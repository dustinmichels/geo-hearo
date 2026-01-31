// 1. LCG Randomizer
// A simple seeded random number generator (Linear Congruential Generator)
// Ensures that for a specific date (seed), we always get the same "random" results.
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }

  nextInt(max: number): number {
    // Use BigInt to avoid precision loss with large numbers
    const nextState = (1103515245n * BigInt(this.state) + 12345n) % 2147483648n;
    this.state = Number(nextState);
    return this.state % max;
  }
}

async function runSelectionForDate(
  dateStr: string,
  indexMap: Record<string, { start: number; end: number }>,
  dataUrl: string,
) {
  // Initialize RNG with the date string (e.g. "20231027") as the seed.
  const rng = new SeededRandom(parseInt(dateStr, 10));
  const countries = Object.keys(indexMap).sort();

  // 1. Pick a Random Country
  const countryCode = countries[rng.nextInt(countries.length)];
  const { start, end } = indexMap[countryCode];

  // 2. Read ONLY that country's data from the JSONL file
  // Using HTTP Range header allows us to read just the bytes we need without downloading the whole file.
  const response = await fetch(dataUrl, {
    headers: { Range: `bytes=${start}-${end}` },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch stations for ${countryCode}: ${response.statusText}`,
    );
  }

  const rawText = await response.text();

  const allStations = rawText
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line))
    .filter((s) => s.country === countryCode);

  const selected = [];
  const pool = [...allStations];
  const targetCount = Math.min(5, pool.length); // Pick up to 5 stations

  // 3. Select 5 unique random stations
  // We randomly pick an index, remove it from the pool (to avoid duplicates), and add to selected.

  for (let i = 0; i < targetCount; i++) {
    const idx = rng.nextInt(pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  console.log(`\n📅 Date Seed: ${dateStr}`);
  console.log(
    `🌍 Country: ${countryCode} (${allStations.length} total stations)`,
  );
  console.table(selected, [
    "channel_name",
    "place_name",
    "country",
    "channel_id",
  ]);
}

async function main() {
  const INDEX_URL = "http://localhost:3000/data/index.json";
  const DATA_URL = "http://localhost:3000/data/stations.jsonl";

  const indexRes = await fetch(INDEX_URL);
  if (!indexRes.ok) {
    throw new Error(`Failed to fetch index: ${indexRes.statusText}`);
  }
  const indexMap = await indexRes.json();

  // For testing: Run the selection logic for every day in December 2025.
  // This verifies that the seeding and data slicing work correctly across multiple days.
  for (let day = 1; day <= 31; day++) {
    const dateStr = `202512${String(day).padStart(2, "0")}`;
    await runSelectionForDate(dateStr, indexMap, DATA_URL);
  }
}

main().catch((e) => {
  console.error(
    "Selection failed. Check if your index offsets match the JSONL file.",
  );
  console.error(e);
});
