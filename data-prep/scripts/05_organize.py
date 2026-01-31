import json
import os

import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "data/out/all_radio_with_countries.json"
DATA_OUTPUT = "data/out/public/data/stations.jsonl"  # The big file
INDEX_OUTPUT = "data/out/public/data/index.json"  # The byte-map

# ==============================================================================
# MAIN
# ==============================================================================

console.print("[bold cyan]Organizing for HTTP Range Requests...[/bold cyan]\n")

# Load data
radio = pd.read_json(RADIO_INPUT)

# Sort by ADMIN to ensure all records for a region are contiguous
radio = radio.sort_values("ADMIN")

index_map = {}
current_offset = 0

# Ensure output directory exists
os.makedirs(os.path.dirname(DATA_OUTPUT), exist_ok=True)

with open(DATA_OUTPUT, "wb") as f_out:
    # Group by ADMIN
    for admin, group in radio.groupby("ADMIN"):
        start_byte = current_offset

        # Write each station in the ADMIN group as a JSON line
        for _, row in group.iterrows():
            # Convert row to dict, then to JSON string + newline
            line = json.dumps(row.to_dict()).encode("utf-8") + b"\n"
            f_out.write(line)
            current_offset += len(line)

        end_byte = current_offset - 1  # End of the last line for this region

        # Store offsets and the number of stations (to help the LCG)
        index_map[admin] = {"start": start_byte, "end": end_byte, "count": len(group)}

# Save the index
with open(INDEX_OUTPUT, "w") as f_index:
    json.dump(index_map, f_index)

# ==============================================================================
# SUMMARY
# ==============================================================================

table = Table(title="Build Results")
table.add_column("File", style="cyan")
table.add_column("Size", justify="right", style="green")
table.add_row("Data (JSONL)", f"{os.path.getsize(DATA_OUTPUT) / 1024 / 1024:.2f} MB")
table.add_row("Index (JSON)", f"{os.path.getsize(INDEX_OUTPUT) / 1024:.2f} KB")
console.print(table)

console.print(
    f"\n[bold green]Success![/bold green] Map created for {len(index_map)} regions."
)
