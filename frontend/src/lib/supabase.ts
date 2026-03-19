import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const supabase =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

/**
 * Atomically increments the daily challenge result counter.
 * Fire-and-forget — never throws, never blocks the UI.
 *
 * @param challengeDate  "YYYY-MM-DD" derived from the seed
 * @param numGuesses     1–5 for a win, 6 for a loss
 */
export async function fetchDailyStats(
  date: string
): Promise<{ num_guesses: number; count: number }[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from("daily_challenge_stats")
      .select("num_guesses, count")
      .eq("date", date)
      .order("num_guesses");
    if (error) {
      console.warn("[analytics] fetchDailyStats failed:", error.message);
      return [];
    }
    return data ?? [];
  } catch (err) {
    console.warn("[analytics] fetchDailyStats exception:", err);
    return [];
  }
}

export async function trackDailyResult(challengeDate: string, numGuesses: number): Promise<void> {
  if (!supabase) return;
  try {
    const { error } = await supabase.rpc("increment_daily_stats", {
      p_date: challengeDate,
      p_num_guesses: numGuesses,
    });
    if (error) console.warn("[analytics] trackDailyResult failed:", error.message);
  } catch (err) {
    console.warn("[analytics] trackDailyResult exception:", err);
  }
}
