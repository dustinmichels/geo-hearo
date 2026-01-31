/**
 * LCG Randomizer
 * A simple seeded random number generator (Linear Congruential Generator)
 * Ensures that for a specific date (seed), we always get the same "random" results.
 */
class SeededRandom {
  private state: number;
  constructor(seed: number) {
    this.state = seed;
  }

  nextInt(max: number): number {
    // Use BigInt to avoid precision loss with large numbers
    const nextState = (1103515245n * BigInt(this.state) + 12345n) % 2147483648n;
    this.state = Number(nextState);
    return Math.abs(this.state % max);
  }
}

interface IndexStructure {
  config: {
    line_length: number;
  };
  countries: Record<string, { start: number; count: number }>;
}

/**
 * Fetches a single record from the JSONL file using a byte range
 */
async function fetchStationAt(
  url: string,
  startByte: number,
  lineLength: number,
): Promise<any> {
  const endByte = startByte + lineLength - 1;

  const response = await fetch(url, {
    headers: { Range: `bytes=${startByte}-${endByte}` },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch byte range ${startByte}-${endByte}`);
  }

  const text = await response.text();
  // .trim() removes the padding spaces added for fixed-width alignment
  return JSON.parse(text.trim());
}

async function runSelectionForDate(
  dateStr: string,
  index: IndexStructure,
  dataUrl: string,
) {
  const rng = new SeededRandom(parseInt(dateStr, 10));
  const { config, countries } = index;
  const lineLength = config.line_length;
  const countryNames = Object.keys(countries).sort();

  // 1. Pick a Random Country
  const countryName = countryNames[rng.nextInt(countryNames.length)];
  const { start, count } = countries[countryName];

  console.log(`\n📅 Date Seed: ${dateStr}`);
  console.log(`🌍 Country: ${countryName} (${count} available stations)`);

  // 2. Determine which unique indices to fetch (up to 5)
  const targetCount = Math.min(5, count);
  const selectedIndices: number[] = [];
  const pool = Array.from({ length: count }, (_, i) => i);

  // We pick unique indices from the pool using the seed
  for (let i = 0; i < targetCount; i++) {
    const poolIdx = rng.nextInt(pool.length);
    selectedIndices.push(pool.splice(poolIdx, 1)[0]);
  }

  // 3. Fetch specific byte ranges for the selected indices
  const selectedStations = await Promise.all(
    selectedIndices.map((idx) => {
      const stationOffset = start + idx * lineLength;
      return fetchStationAt(dataUrl, stationOffset, lineLength);
    }),
  );

  console.table(selectedStations, [
    "channel_name",
    "place_name",
    "country",
    "channel_id",
  ]);
}

async function main() {
  const INDEX_URL = "http://localhost:3000/data/index.json";
  const DATA_URL = "http://localhost:3000/data/stations.jsonl";

  // Load the new index structure
  const indexRes = await fetch(INDEX_URL);
  if (!indexRes.ok) {
    throw new Error(`Failed to fetch index: ${indexRes.statusText}`);
  }
  const index: IndexStructure = await indexRes.json();

  // For testing: Run the selection logic for every day in December 2025.
  for (let day = 1; day <= 31; day++) {
    const dateStr = `202512${String(day).padStart(2, "0")}`;
    try {
      await runSelectionForDate(dateStr, index, DATA_URL);
    } catch (err) {
      console.error(`Error processing ${dateStr}:`, err);
    }
  }
}

main().catch((e) => {
  console.error(
    "Selection failed. Check if your index offsets and line_length match the JSONL file.",
  );
  console.error(e);
});
