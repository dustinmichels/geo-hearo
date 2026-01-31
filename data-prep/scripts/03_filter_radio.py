"""
Radio Station Filtering Script

This script loads crawled radio station data and applies quality filters
to remove stations with missing or insecure stream URLs.

METHODOLOGY:
- Removes stations without resolved stream URLs
- Removes stations with insecure (non-HTTPS) channels
- Drops unnecessary columns from the dataset

INPUT:
- CSV file of crawled radio station data (crawl/out/output.csv)

OUTPUT:
- JSON file containing filtered radio station records

USAGE:
    uv run scripts/03_filter_radio.py
"""

import json

import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "crawl/out/output.csv"
OUTPUT = "data/out/all_radio_filtered.json"

DROP_COLS = [
    "channel_stream",
    "channel_secure",
    "boost",
]


# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================


def filter_with_report(df, mask, description):
    """
    Apply a boolean mask to the dataframe and report station count changes.
    """
    console.print(f"\n[bold cyan]Filtering: {description}[/bold cyan]")
    before = len(df)
    new_df = df[mask]
    after = len(new_df)
    console.print(f"  Stations: {before:,} -> {after:,} (removed {before - after:,})")
    return new_df


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================


def main():
    console.print("\n[bold cyan]Loading radio station data...[/bold cyan]")
    radio = pd.read_csv(RADIO_INPUT)

    # Print summary table
    table = Table(title="Dataset Summary")
    table.add_column("Dataset", style="cyan")
    table.add_column("Records", justify="right", style="green")
    table.add_row("Radio stations", f"{len(radio):,}")
    table.add_row("Countries (Radio)", f"{radio['country'].nunique():,}")
    console.print(table)

    # Filter: null channel URLs
    radio = filter_with_report(
        radio,
        radio["channel_resolved_url"].notnull(),
        "Removing stations without 'resolved' URLs",
    )

    # Filter: insecure channels
    radio = filter_with_report(
        radio, radio["channel_secure"], "Removing stations with insecure channels"
    )

    # Drop unwanted columns
    radio = radio.drop(columns=DROP_COLS)

    # Save output
    console.print(f"\n[bold cyan]Saving to {OUTPUT}...[/bold cyan]")
    with open(OUTPUT, "w") as f:
        json.dump(radio.to_dict(orient="records"), f, indent=2)

    console.print(
        f"[bold green]Successfully saved {len(radio):,} records to {OUTPUT}[/bold green]"
    )


if __name__ == "__main__":
    main()
