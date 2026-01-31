import json
import random

import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

INPUT = "data/out/all_radio_with_countries.json"
OUTPUT = "data/out/filtered_radio_with_countries.json"

# Set seed for reproducibility (optional - remove if you want different results each time)
RANDOM_SEED = 42

# ==============================================================================
# MAIN
# ==============================================================================

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold cyan]SCRIPT 3: FILTER TO 5 STATIONS PER COUNTRY[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)

# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("\n[bold cyan]Loading data...[/bold cyan]")
with open(INPUT, "r") as f:
    data = json.load(f)

radio_final = pd.DataFrame(data)

console.print(f"  Loaded {len(radio_final):,} stations")
console.print(f"  Countries: {radio_final['ISO_A2'].nunique()}")

# ==============================================================================
# FILTERING: 5 STATIONS PER COUNTRY
# ==============================================================================

console.print(
    "\n[bold cyan]Selecting 5 stations per country using criteria...[/bold cyan]"
)
console.print(f"  Random seed: {RANDOM_SEED}\n")

# Verify country count before filtering
unique_countries_before = radio_final["ISO_A2"].nunique()
console.print(f"  Countries in dataset: {unique_countries_before}")

random.seed(RANDOM_SEED)

filtered_stations = []
countries_processed = set()

# Group by country
for country_code in sorted(radio_final["ISO_A2"].unique()):
    country_stations = radio_final[radio_final["ISO_A2"] == country_code].copy()
    country_name = country_stations.iloc[0]["NAME"]

    # Separate by place_size and boost status
    large_place = country_stations[country_stations["place_size"] > 7].to_dict(
        "records"
    )
    boosted = country_stations[country_stations["boost"]].to_dict("records")
    all_stations = country_stations.to_dict("records")

    selected_stations = []

    # Step 1: Try to select one station with place_size > 7
    large_place_selected = False
    if len(large_place) > 0:
        selected_large = random.sample(large_place, 1)
        selected_stations.extend(selected_large)
        large_place_selected = True

    # Step 2: Try to get 2 boosted stations (different from already selected)
    available_boosted = [s for s in boosted if s not in selected_stations]
    num_boosted_to_select = min(2, len(available_boosted))
    if num_boosted_to_select > 0:
        selected_boosted = random.sample(available_boosted, num_boosted_to_select)
        selected_stations.extend(selected_boosted)

    # Step 3: Fill remaining slots with random stations (different than ones already selected)
    remaining_slots = 5 - len(selected_stations)
    if remaining_slots > 0:
        available_remaining = [s for s in all_stations if s not in selected_stations]
        num_remaining_to_select = min(remaining_slots, len(available_remaining))
        if num_remaining_to_select > 0:
            selected_remaining = random.sample(
                available_remaining, num_remaining_to_select
            )
            selected_stations.extend(selected_remaining)

    # Shuffle the final selection
    country_selection = selected_stations
    random.shuffle(country_selection)

    filtered_stations.extend(country_selection)
    countries_processed.add(country_code)

    # Report selection details
    large_place_text = (
        "[green]place_size>7: Yes[/green]"
        if large_place_selected
        else "[red]place_size>7: No[/red]"
    )
    console.print(
        f"  {country_name} ({country_code}): selected {len(country_selection)} stations | "
        f"{large_place_text} | "
        f"{num_boosted_to_select} boosted | "
        f"[dim]{len(country_stations)} total available[/dim]"
    )

console.print(f"\n  Total countries processed: {len(countries_processed)}")

# ==============================================================================
# SUMMARY
# ==============================================================================

console.print(
    "\n[bold cyan]═══════════════════════════════════════════════════════[/bold cyan]"
)
console.print("[bold cyan]SELECTION SUMMARY[/bold cyan]")
console.print(
    "[bold cyan]═══════════════════════════════════════════════════════[/bold cyan]\n"
)

summary_table = Table(title="Filtered Dataset Summary")
summary_table.add_column("Metric", style="cyan")
summary_table.add_column("Value", justify="right", style="green")
summary_table.add_row("Total Stations", f"{len(filtered_stations):,}")
summary_table.add_row("Countries", f"{len(countries_processed)}")
summary_table.add_row(
    "Avg Stations/Country", f"{len(filtered_stations) / len(countries_processed):.1f}"
)

console.print(summary_table)

# ==============================================================================
# OUTPUT
# ==============================================================================

console.print(f"\n[bold cyan]Saving filtered version to {OUTPUT}...[/bold cyan]")
with open(OUTPUT, "w") as f:
    json.dump(filtered_stations, f, indent=2)

console.print(
    f"[bold green]✓ Successfully saved {len(filtered_stations):,} records to {OUTPUT}[/bold green]"
)
console.print(f"[bold green]  ({len(countries_processed)} countries)[/bold green]\n")

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold green]SCRIPT 3 COMPLETE[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)
