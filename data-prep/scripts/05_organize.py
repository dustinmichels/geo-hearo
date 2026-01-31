"""
Data Organization Script for HTTP Range Requests (Fixed-Width Line Indexing)

This script converts the radio station JSON into a fixed-width JSONL format.
Every line is padded with spaces to a consistent length, allowing for
O(1) byte-offset calculations without storing individual line offsets.

METHODOLOGY:
- Finds the maximum length of a JSON-serialized station record.
- Pads every record with spaces to match this 'LINE_LENGTH'.
- The index only needs to store: { country: { start_byte, count } }.
- Client calculates offset: start_byte + (station_index * LINE_LENGTH).
"""

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
DATA_OUTPUT = "data/out/public/data/stations.jsonl"
INDEX_OUTPUT = "data/out/public/data/index.json"

# We define a fixed length that is guaranteed to fit any station record.
# 1024 is usually safe for radio metadata, but we will calculate the real max.
LINE_LENGTH = 0

# ==============================================================================
# MAIN PROCESSING
# ==============================================================================


def main():
    global LINE_LENGTH
    console.print(
        "\n[bold cyan]Organizing for Fixed-Width HTTP Range Requests...[/bold cyan]"
    )

    # Load data
    if not os.path.exists(RADIO_INPUT):
        console.print(
            f"[bold red]Error: Input file {RADIO_INPUT} not found.[/bold red]"
        )
        return

    radio = pd.read_json(RADIO_INPUT)
    radio = radio.sort_values("ADMIN")

    # Step 1: Calculate the maximum line length needed
    console.print("Calculating maximum record length...")
    max_len = 0
    for _, row in radio.iterrows():
        # +1 for the newline character
        current_len = len(json.dumps(row.to_dict()).encode("utf-8")) + 1
        if current_len > max_len:
            max_len = current_len

    # Add a small buffer and round up to a nice power of 2 or a clean number
    # This makes manual inspection easier and provides room for minor data changes.
    LINE_LENGTH = max_len + 16
    console.print(
        f"Set fixed LINE_LENGTH to: [bold yellow]{LINE_LENGTH} bytes[/bold yellow]"
    )

    index_map = {"config": {"line_length": LINE_LENGTH}, "countries": {}}

    current_offset = 0

    # Ensure output directory exists
    os.makedirs(os.path.dirname(DATA_OUTPUT), exist_ok=True)

    console.print("Writing fixed-width JSONL and building compact index...")

    with open(DATA_OUTPUT, "wb") as f_out:
        for admin, group in radio.groupby("ADMIN"):
            start_byte = current_offset

            for _, row in group.iterrows():
                # Convert to JSON
                json_data = json.dumps(row.to_dict()).encode("utf-8")

                # Calculate padding needed: (LINE_LENGTH - 1) because the last byte is \n
                padding_size = (LINE_LENGTH - 1) - len(json_data)

                if padding_size < 0:
                    raise ValueError(f"Record too long for LINE_LENGTH {LINE_LENGTH}!")

                # Write: JSON + Spaces + Newline
                line = json_data + (b" " * padding_size) + b"\n"
                f_out.write(line)

                current_offset += len(line)

            # Compact index entry
            index_map["countries"][str(admin)] = {
                "start": start_byte,
                "count": len(group),
            }

    # Save the index
    with open(INDEX_OUTPUT, "w") as f_index:
        json.dump(index_map, f_index)

    # ==============================================================================
    # VALIDATION & STATISTICS
    # ==============================================================================

    console.print("\n[bold cyan]Build Results:[/bold cyan]")

    data_size_mb = os.path.getsize(DATA_OUTPUT) / (1024 * 1024)
    index_size_kb = os.path.getsize(INDEX_OUTPUT) / 1024

    table = Table(title="Build Results")
    table.add_column("File", style="cyan")
    table.add_column("Size", justify="right", style="green")
    table.add_row("Data (Fixed JSONL)", f"{data_size_mb:.2f} MB")
    table.add_row("Index (JSON)", f"{index_size_kb:.2f} KB")
    console.print(table)

    console.print(
        f"[bold green]Successfully created fixed-width index for {len(index_map['countries'])} regions.[/bold green]"
    )
    console.print(
        f"[italic gray]App logic: start + (randomIndex * {LINE_LENGTH})[/italic gray]"
    )


if __name__ == "__main__":
    main()
