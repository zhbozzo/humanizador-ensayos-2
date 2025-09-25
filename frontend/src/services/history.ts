import { supabase } from "../lib/supabaseClient";

export type HistoryItem = {
  id?: string;
  created_at?: string;
  email?: string;
  level?: string;
  input?: string;
  result?: string;
  input_len?: number;
  result_len?: number;
};

export async function saveHistoryItem(item: HistoryItem) {
  try {
    // Tabla recomendada: public.humanize_history (ver DB_README.md)
    const { error } = await supabase
      .from("humanize_history")
      .insert(item as any);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[history] save failed", e);
    return false;
  }
}

export async function fetchHistory(limit = 50) {
  try {
    const { data, error } = await supabase
      .from("humanize_history")
      .select("id, created_at, level, input_len, result_len, input, result")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data as HistoryItem[];
  } catch (e) {
    console.warn("[history] fetch failed", e);
    return [];
  }
}

export async function deleteHistoryItem(id: string) {
  try {
    const { error } = await supabase
      .from("humanize_history")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn("[history] delete failed", e);
    return false;
  }
}


