import { Facts } from 'src/chat/chat.types';

export type Guideline = {
  id: string;
  title: string;
  priority: number;
  condition: (facts: Facts) => boolean;
  action: JSON;
  single_use?: boolean;
  embedding?: number[];
  fuzzy?: boolean;
  conflicts_with?: string[];
  overrides?: string[];
};

export type Action =
  | { kind: 'reply'; message: string }
  | { kind: 'ask'; prompt: string; choices?: string[]; storeAs: string }
  | { kind: 'tool'; name: string; args?: Record<string, any>; successReply?: string }
  | {
      kind: 'ask_and_tool';
      ask: { prompt: string; choices?: string[]; fields?: any[]; storeAs: string };
      tool: { name: string; args?: Record<string, any> };
      successReply?: string;
    };

export type ToolFn = (args?: Record<string, any>) => Promise<any>;
export type Tools = Record<string, ToolFn>;

export type NextStep =
  | { type: 'reply'; text: string }
  | { type: 'ask'; text: string; storeAs: string; choices?: string[] }
  | { type: 'toolDone'; text?: string }
  | { type: 'noop' };
