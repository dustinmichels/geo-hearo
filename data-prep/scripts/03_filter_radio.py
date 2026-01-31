"""
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
# MAIN
# ==============================================================================

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold cyan]SCRIPT: PROCESS RADIO STATIONS[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================


def filter_with_report(df, mask, description):
    """Applies a boolean mask to the dataframe and reports station count changes."""
    console.print(f"\n[bold yellow]Filtering: {description}[/bold yellow]")
    before = len(df)
    new_df = df[mask]
    after = len(new_df)
    console.print(
        f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
    )
    return new_df


# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("[bold cyan]Loading data...[/bold cyan]\n")
radio = pd.read_csv(RADIO_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Radio)", f"{radio['country'].nunique():,}")
console.print(table)


# ==============================================================================
# FILTERING: NULL CHANNEL URLS
# ==============================================================================

radio = filter_with_report(
    radio,
    radio["channel_resolved_url"].notnull(),
    "Removing stations without 'resolved' URLs",
)


# ==============================================================================
# FILTERING: INSECURE CHANNELS
# ==============================================================================

radio = filter_with_report(
    radio, radio["channel_secure"], "Removing stations with insecure channels"
)


# ==============================================================================
# DROP UNWANTED COLUMNS
# =============================================================================

radio = radio.drop(columns=DROP_COLS)

# ==============================================================================
# OUTPUT
# ==============================================================================

console.print(f"\n[bold cyan]Saving to {OUTPUT}...[/bold cyan]")
with open(OUTPUT, "w") as f:
    json.dump(radio.to_dict(orient="records"), f, indent=2)

console.print(
    f"[bold green]✓ Successfully saved {len(radio):,} records to {OUTPUT}[/bold green]\n"
)

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold green]SCRIPT COMPLETE[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)
