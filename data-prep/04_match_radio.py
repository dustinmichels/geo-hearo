"""
USAGE:
    uv run 03_process_radio.py
"""

import json

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.progress import track
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "data/out/all_radio_filtered.json"
NE_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/all_radio_with_countries.json"

MIN_STATIONS = 5


# ==============================================================================
# MAIN
# ==============================================================================

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold cyan]SCRIPT 2: PROCESS RADIO STATIONS[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)


# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("[bold cyan]Loading data...[/bold cyan]\n")
radio = pd.read_json(RADIO_INPUT)
ne = gpd.read_file(NE_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Radio)", f"{radio['country'].nunique():,}")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
console.print(table)


# ==============================================================================
# COUNTRY MATCHING
# ==============================================================================

console.print(
    "\n[bold cyan]Matching radio stations to Natural Earth countries...[/bold cyan]\n"
)


# Create a mapping function
def match_country(country_name, ne_df):
    """Match a country name to Natural Earth data"""
    if pd.isna(country_name):
        return None

    country_name = str(country_name).strip().lower()

    # First try ADMIN column
    match = ne_df[ne_df["ADMIN"].astype(str).str.lower() == country_name]
    if len(match) > 0:
        return match.iloc[0]

    # Then try all NAME* columns
    name_cols = [col for col in ne_df.columns if col.startswith("NAME")]
    for col in name_cols:
        try:
            match = ne_df[ne_df[col].astype(str).str.lower() == country_name]
            if len(match) > 0:
                return match.iloc[0]
        except (AttributeError, TypeError):
            # Skip columns that can't be converted to string
            continue

    return None


# Match each radio station to NE data
matched_data = []
unmatched_countries = set()

for row in track(radio.itertuples(), total=len(radio), description="Matching stations"):
    row_dict = row._asdict()
    # Remove the Index field added by itertuples
    row_dict.pop("Index", None)

    country_match = match_country(row_dict["country"], ne)

    if country_match is not None:
        # Merge radio data with NE data
        merged_row = row_dict.copy()
        # Add NE columns
        for col in country_match.index:
            if col != "geometry":  # Skip geometry column
                merged_row[col] = country_match[col]
        matched_data.append(merged_row)
    else:
        unmatched_countries.add(row_dict["country"])
        # Still include the row but without NE data
        matched_data.append(row_dict)

# Create matched dataframe
radio_ne = pd.DataFrame(matched_data)

console.print(
    f"\n[bold green]✓ Matched {len(radio_ne[radio_ne['ADMIN'].notna()]) if 'ADMIN' in radio_ne.columns else 0:,} stations[/bold green]"
)
console.print(
    f"[bold yellow]⚠ Unmatched stations: {len(radio_ne[radio_ne['ADMIN'].isna()]) if 'ADMIN' in radio_ne.columns else len(radio_ne):,}[/bold yellow]"
)
console.print(
    f"[bold yellow]⚠ Lost countries: {len(unmatched_countries)}[/bold yellow]"
)
if unmatched_countries:
    console.print(f"  {', '.join(sorted(unmatched_countries))}")


# ==============================================================================
# FINAL DATA PREPARATION
# ==============================================================================

console.print("\n[bold cyan]Preparing final dataset...[/bold cyan]")

# Get original radio columns
original_radio_cols = radio.columns.tolist()

# Select NE columns to add
selected_ne_cols = [
    "ADMIN",
    "NAME",
    "GEOUNIT",
    "ISO_A3",
    "ISO_A2",
    "ISO_A2_EH",
    "ISO_N3",
    "POSTAL",
    "CONTINENT",
    "LEVEL",
    "POP_EST",
    "POP_RANK",
]

# Only include columns that exist in the dataframe
available_ne_cols = [col for col in selected_ne_cols if col in radio_ne.columns]
final_cols = original_radio_cols + available_ne_cols

# Reorder columns
radio_final = radio_ne[final_cols]

matched_count = (
    radio_final["ISO_A2"].notna().sum() if "ISO_A2" in radio_final.columns else 0
)
unique_countries = (
    radio_final["ISO_A2"].nunique() if "ISO_A2" in radio_final.columns else 0
)

console.print(
    f"[bold green]✓ Final record count: {len(radio_final):,} stations across {unique_countries} countries[/bold green]"
)

# ==============================================================================
# FINAL SUMMARY: STATIONS PER COUNTRY
# ==============================================================================

console.print(
    "\n[bold cyan]═══════════════════════════════════════════════════════[/bold cyan]"
)
console.print("[bold cyan]FINAL SUMMARY: Radio Stations by Country[/bold cyan]")
console.print(
    "[bold cyan]═══════════════════════════════════════════════════════[/bold cyan]\n"
)

# Calculate stations per country with population
if all(col in radio_final.columns for col in ["ISO_A2_EH", "NAME", "POP_EST"]):
    stations_per_country = (
        radio_final[radio_final["ISO_A2_EH"].notna()]
        .groupby(["ISO_A2_EH", "NAME", "POP_EST"])
        .size()
        .reset_index(name="station_count")
    )

    # Sort by population
    stations_per_country = stations_per_country.sort_values("POP_EST", ascending=False)

    # Create summary table
    summary_table = Table(
        title=f"Radio Stations Distribution ({len(stations_per_country)} Countries) - Sorted by Population"
    )
    summary_table.add_column("Rank", justify="right", style="dim")
    summary_table.add_column("Country", style="cyan")
    summary_table.add_column("ISO", style="yellow")
    summary_table.add_column("Population", justify="right", style="blue")
    summary_table.add_column("Stations", justify="right", style="green")

    for rank, (idx, row) in enumerate(stations_per_country.iterrows(), start=1):
        summary_table.add_row(
            str(rank),
            row["NAME"],
            row["ISO_A2_EH"],
            f"{row['POP_EST']:,.0f}",
            f"{row['station_count']:,}",
        )

    console.print(summary_table)
else:
    console.print("[bold yellow]⚠ Insufficient data for country summary[/bold yellow]")

# ==============================================================================
# OUTPUT
# ==============================================================================

console.print(f"\n[bold cyan]Saving to {OUTPUT}...[/bold cyan]")
with open(OUTPUT, "w") as f:
    json.dump(radio_final.to_dict(orient="records"), f, indent=2)

console.print(
    f"[bold green]✓ Successfully saved {len(radio_final):,} records to {OUTPUT}[/bold green]\n"
)

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold green]SCRIPT 2 COMPLETE[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)
