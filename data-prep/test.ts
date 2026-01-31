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

async function runLocalSelection() {
  const INDEX_PATH = "data/out/public/data/index.json";
  const DATA_PATH = "data/out/public/data/stations.jsonl";

  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rng = new SeededRandom(parseInt(dateStr, 10));

  // 2. Load the index
  const indexFile = Bun.file(INDEX_PATH);
  const indexMap = await indexFile.json();
  const countries = Object.keys(indexMap);

  // 3. Pick the country
  const countryCode = countries[rng.nextInt(countries.length)];
  const { start, end } = indexMap[countryCode];

  // 4. Slice the data file
  const stationSlice = Bun.file(DATA_PATH).slice(start, end + 1);
  const rawText = await stationSlice.text();

  // Filter out any empty lines from the split
  const allStations = rawText
    .trim()
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));

  // 5. Pick up to 5 unique stations
  const selected = [];
  const pool = [...allStations];
  const targetCount = Math.min(5, pool.length);

  for (let i = 0; i < targetCount; i++) {
    const idx = rng.nextInt(pool.length);
    selected.push(pool.splice(idx, 1)[0]);
  }

  // 6. Visual Output with the correct columns
  console.log(`\n📅 Date Seed: ${dateStr}`);
  console.log(
    `🌍 Country: ${countryCode} (${allStations.length} total stations)`,
  );

  // Using the specific keys from your JSON
  console.table(selected, [
    "channel_name",
    "place_name",
    "country",
    "channel_id",
  ]);
}

runLocalSelection().catch((e) => {
  console.error(
    "Selection failed. Check if your index offsets match the JSONL file.",
  );
  console.error(e);
});
