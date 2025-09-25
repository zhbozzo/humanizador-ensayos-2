// Tipos para el Humanizador
export interface HumanizeRequest {
  text: string;
  budget: number;
  preserve_entities: boolean;
  respect_style: boolean;
  style_sample: string | null;
  level?: string;
  voice?: 'neutral' | 'collective';
  plan?: 'free' | 'basic' | 'pro' | 'ultra';
  max_words?: number;
}

export interface DiffItem {
  type: 'insert' | 'delete' | 'equal';
  token: string;
}

export interface Metrics {
  change_ratio: number;
  rare_words_ratio: number;
  avg_sentence_len: number;
  lix: number;
}

export interface HumanizeResponse {
  result: string;
  diff: DiffItem[];
  metrics: Metrics;
  alerts: string[];
}

// Tipos para el Detector de IA
export interface DetectRequest {
  text: string;
  language?: string;
}

export interface DetectMetrics {
  perplexity: number;
  burstiness: number;
  sentence_variation: number;
  vocabulary_diversity: number;
  pattern_score: number;
  readability: number;
  repetition_score: number;
}

export interface DetectResponse {
  is_ai: boolean;
  ai_probability: number;
  human_score: number;
  classification: string;
  metrics: DetectMetrics;
  analysis: string;
}

// Error type
export interface ApiError {
  detail?: string;
  message?: string;
}
