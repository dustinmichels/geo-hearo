// 1. LCG Randomizer
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }

  nextInt(max: number): number {
    this.state = (1103515245 * this.state + 12345) % 2147483648;
    return this.state % max;
  }
}

async function runSelectionForDate(
  dateStr: string,
  indexMap: Record<string, { start: number; end: number }>,
  dataPath: string,
) {
  const rng = new SeededRandom(parseInt(dateStr, 10));
  const countries = Object.keys(indexMap);

  const countryCode = countries[rng.nextInt(countries.length)];
  const { start, end } = indexMap[countryCode];

  const stationSlice = Bun.file(dataPath).slice(start, end + 1);
  const rawText = await stationSlice.text();

  const allStations = rawText
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));

  const selected = [];
  const pool = [...allStations];
  const targetCount = Math.min(5, pool.length);

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
  const INDEX_PATH = "data/out/public/data/index.json";
  const DATA_PATH = "data/out/public/data/stations.jsonl";

  const indexMap = await Bun.file(INDEX_PATH).json();

  // Test 12 consecutive days in December 2025
  for (let day = 1; day <= 12; day++) {
    const dateStr = `202512${String(day).padStart(2, "0")}`;
    await runSelectionForDate(dateStr, indexMap, DATA_PATH);
  }
}

main().catch((e) => {
  console.error(
    "Selection failed. Check if your index offsets match the JSONL file.",
  );
  console.error(e);
});
