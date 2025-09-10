export interface HumanizeRequest {
  text: string;
  budget: number;
  preserve_entities: boolean;
  respect_style: boolean;
  style_sample: string | null;
}

export interface DiffItem {
  type: 'insert' | 'delete' | 'equal';
  token: string;
}

export interface Metrics {
  change_ratio: number;
  rare_word_ratio: number;
  avg_sentence_len: number;
  lix: number;
}

export interface HumanizeResponse {
  result: string;
  diff: DiffItem[];
  metrics: Metrics;
  alerts: string[];
}

export interface ApiError {
  detail: string;
}
