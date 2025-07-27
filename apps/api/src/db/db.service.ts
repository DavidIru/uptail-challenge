import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class DbService {
  private clientSupabase: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
    this.clientSupabase = createClient(this.configService.get('SUPABASE_URL'), this.configService.get('SUPABASE_KEY'));
  }

  get client() {
    return this.clientSupabase;
  }

  async matchGuidelines({
    queryEmbedding,
    matchCount = 6,
    similarityThreshold = 0.7,
  }: {
    queryEmbedding: number[];
    matchCount?: number;
    similarityThreshold?: number;
  }) {
    return await this.clientSupabase.rpc('match_guidelines_improved', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      similarity_threshold: similarityThreshold,
    });
  }
}
