# Supabase setup

Supabase SQL (run in this order in the Supabase SQL editor)

1. Create table

```sql
CREATE TABLE IF NOT EXISTS daily_challenge_stats (
  date        date     NOT NULL,
  num_guesses smallint NOT NULL CHECK (num_guesses BETWEEN 1 AND 6),
  count       integer  NOT NULL DEFAULT 0,
  PRIMARY KEY (date, num_guesses)
);
```

1. Create RPC function (atomic upsert)

```sql
CREATE OR REPLACE FUNCTION increment_daily_stats(
  p_date        date,
  p_num_guesses smallint
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO daily_challenge_stats (date, num_guesses, count)
  VALUES (p_date, p_num_guesses, 1)
  ON CONFLICT (date, num_guesses)
  DO UPDATE SET count = daily_challenge_stats.count + 1;
$$;
```

SECURITY DEFINER lets the function bypass RLS (runs as postgres), so anon users can call it without direct table write access.

1. RLS + grant

```sql
ALTER TABLE daily_challenge_stats ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (e.g. future stats page)
CREATE POLICY "allow_anon_select"
  ON daily_challenge_stats
  FOR SELECT TO anon USING (true);

-- Grant anon role permission to call the RPC (writes go through function only)
GRANT EXECUTE ON FUNCTION increment_daily_stats(date, smallint) TO anon;
```
