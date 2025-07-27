import { Injectable } from '@nestjs/common';
import { Facts } from 'src/chat/chat.types';
import { DbService } from 'src/db/db.service';
import { OpenaiService } from 'src/openai/openai.service';
import { Action, Guideline, Tools } from './guidelines.types';
import { apply } from 'json-logic-js';

@Injectable()
export class GuidelinesService {
  constructor(private readonly dbService: DbService, private readonly openaiService: OpenaiService) {}

  async calculateEmbeddings(): Promise<void> {
    const { data: guidelines, error } = await this.dbService.client.from('guidelines').select();

    if (error) {
      throw error;
    }

    await Promise.all(
      guidelines.map(async (g: Guideline) => {
        const embedding = await this.openaiService.embed(g.title);

        await this.dbService.client.from('guidelines').update({ embedding }).eq('id', g.id);
      }),
    );
  }

  async selectGuidelines({ facts }: { facts: Facts }): Promise<Guideline[]> {
    const message = facts.lastUserMsg ?? '';
    const retrievedInfo = facts.informationRetrieved || {};

    let enrichedQuery = message;
    if (Object.keys(retrievedInfo).length > 0) {
      const context = Object.entries(retrievedInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      enrichedQuery = `${message} (Context: ${context})`;
    }

    const userVec = await this.openaiService.embed(enrichedQuery);

    const { data: allFuzzyCandidates, error } = await this.dbService.matchGuidelines({
      queryEmbedding: userVec,
      matchCount: 3,
      similarityThreshold: 0.8,
    });

    const { data: allDeterministicCandidates, error: errorDeterministicCandidates } = await this.dbService.client
      .from('guidelines')
      .select()
      .eq('fuzzy', false)
      .not('condition', 'is', null);

    if (error || errorDeterministicCandidates) {
      throw error || errorDeterministicCandidates;
    }

    const deterministicToApply = (allDeterministicCandidates as Guideline[]).filter((g) => {
      if (!g.condition) {
        return false;
      }

      try {
        return apply(g.condition, { facts });
      } catch (error) {
        return false;
      }
    });

    const fuzzyCandidates = allFuzzyCandidates.filter((g) => {
      return g.fuzzy && g.embedding;
    });

    const fuzzyToApply = await this.validateFuzzy({
      guidelines: fuzzyCandidates,
      message,
    });

    const toApply = this.dropSingleUseGuidelines([...deterministicToApply, ...fuzzyToApply], facts.usedGuidelines);

    return toApply;
  }

  private async validateFuzzy({
    guidelines,
    message,
  }: {
    guidelines: Guideline[];
    message: string;
  }): Promise<Guideline[]> {
    const basePrompt = `You are a rule checker. You have to decide whether a rule applies based on the user's message. Answer ONLY "true" or "false" and nothing else. DO NOT EXPLAIN YOUR ANSWER.\n
      If the user's message is not in English, evaluate it by translating it first. Always compare it with messages in English.\n`;

    const results = await Promise.all(
      guidelines.map(async (g) => {
        const prompt = `${basePrompt}\nRule: "${g.title}"\nUser message: "${message}"\nAnswer:`;

        const response = await this.openaiService.evaluate([
          {
            role: 'user',
            content: prompt,
          },
        ]);

        return {
          id: g.id,
          applies: response === 'true',
        };
      }),
    );

    return guidelines.filter((g) => results.find((r: { id: string; applies: boolean }) => r.id === g.id)?.applies);
  }

  private dropSingleUseGuidelines(guidelines: Guideline[], usedGuidelines: string[]) {
    const used = new Set(usedGuidelines);

    return guidelines.filter((g) => !(g.single_use && used.has(g.id)));
  }

  private render(template: string, facts: Facts): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.get(facts.informationRetrieved, key) || match;
    });
  }

  private renderObj(obj: Record<string, any>, facts: Facts): Record<string, any> {
    const result = { ...obj };
    for (const key in result) {
      if (typeof result[key] === 'string') {
        result[key] = this.render(result[key], facts);
      }
    }
    return result;
  }

  private get(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  async runGuidelines(guidelines: Guideline[], facts: Facts, tools: Tools) {
    let pendingAsk: boolean = false;
    const replies: string[] = [];
    const consumedGuidelineIds: string[] = [];
    const toolsRun: { name: string; args: any; ok: boolean; error?: string; result?: any }[] = [];

    for (const g of guidelines) {
      if (!g.action) {
        continue;
      }
      const action: Action = typeof g.action === 'string' ? JSON.parse(g.action) : g.action;

      if (pendingAsk) {
        break;
      }

      switch (action.kind) {
        case 'reply': {
          const renderedMessage = this.render(action.message, facts);
          replies.push(renderedMessage);
          consumedGuidelineIds.push(g.id);
          break;
        }

        case 'ask': {
          const askResult = this.executeAsk({
            prompt: action.prompt,
            choices: action.choices,
            storeAs: action.storeAs,
            facts,
            replies,
            consumedGuidelineIds,
            guidelineId: g.id,
          });
          pendingAsk = askResult;
          break;
        }

        case 'tool': {
          const args = this.renderObj(action.args ?? {}, facts);
          await this.executeTool({
            toolName: action.name,
            args,
            successReply: action.successReply,
            tools,
            facts,
            toolsRun,
            replies,
            consumedGuidelineIds,
            guidelineId: g.id,
          });
          break;
        }

        case 'ask_and_tool': {
          const key = action.ask.storeAs;
          const hasRequiredInfo = this.get(facts.informationRetrieved, key);

          if (!hasRequiredInfo) {
            const askResult = this.executeAsk({
              prompt: action.ask.prompt,
              choices: action.ask.choices,
              storeAs: key,
              facts,
              replies,
              consumedGuidelineIds: [],
              guidelineId: '',
            });
            pendingAsk = askResult;
          } else {
            const args = this.renderObj(action.tool.args ?? {}, facts);
            await this.executeTool({
              toolName: action.tool.name,
              args,
              successReply: action.successReply,
              tools,
              facts,
              toolsRun,
              replies,
              consumedGuidelineIds,
              guidelineId: g.id,
            });
          }
          break;
        }

        default:
          break;
      }
    }

    return { replies, ask: pendingAsk, tools: toolsRun, consumedGuidelineIds };
  }

  private clearWaitingState(facts: Facts): void {
    facts.waitingFor = undefined;
    facts.lastSystemQuestion = undefined;
  }

  private async executeTool({
    toolName,
    args,
    successReply,
    tools,
    facts,
    toolsRun,
    replies,
    consumedGuidelineIds,
    guidelineId,
  }: {
    toolName: string;
    args: Record<string, any>;
    successReply?: string;
    tools: Tools;
    facts: Facts;
    toolsRun: { name: string; args: any; ok: boolean; error?: string; result?: any }[];
    replies: string[];
    consumedGuidelineIds: string[];
    guidelineId: string;
  }): Promise<void> {
    const fn = tools?.[toolName];

    if (!fn) {
      toolsRun.push({ name: toolName, args, ok: false, error: 'Tool not found' });
      return;
    }

    try {
      const result = await fn(args);
      toolsRun.push({ name: toolName, args, ok: true, result });

      if (successReply) {
        const renderedReply = this.render(successReply, facts);
        replies.push(renderedReply);
      }

      consumedGuidelineIds.push(guidelineId);
      this.clearWaitingState(facts);
    } catch (e: any) {
      toolsRun.push({
        name: toolName,
        args,
        ok: false,
        error: e?.message ?? String(e),
      });
    }
  }

  private executeAsk({
    prompt,
    choices,
    storeAs,
    facts,
    replies,
    consumedGuidelineIds,
    guidelineId,
  }: {
    prompt: string;
    choices?: string[];
    storeAs: string;
    facts: Facts;
    replies: string[];
    consumedGuidelineIds: string[];
    guidelineId: string;
  }): boolean {
    if (this.get(facts.informationRetrieved, storeAs)) {
      consumedGuidelineIds.push(guidelineId);
      this.clearWaitingState(facts);

      return false;
    }

    if (!facts.waitingFor) {
      facts.waitingFor = storeAs;
      const renderedPrompt = this.render([prompt, ...(choices || [])].join('\n'), facts);
      replies.push(renderedPrompt);
      facts.lastSystemQuestion = renderedPrompt;

      return true;
    }

    return false;
  }
}
