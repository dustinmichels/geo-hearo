"""
USAGE:
    uv run 03_process_radio.py
"""

import json

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "crawl/out/output.csv"
NE_10M_INPUT = "data/ne/ne_10m_admin_0_countries.geojson"
NE_110M_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/all_radio_with_countries.json"
SPATIAL_JOIN_LOG_FILE = "data/out/spatial_join.log"
DROP_SUBUNITS_LOG_FILE = "data/out/drop_subunits.log"

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


def log_dropped_stations(dropped_df, log_file, title):
    """Logs details of dropped stations to a specified log file."""
    if dropped_df.empty:
        return

    console.print(
        f"  [yellow]Logging {len(dropped_df):,} dropped stations to {log_file}[/yellow]"
    )
    with open(log_file, "w", encoding="utf-8") as f:
        f.write(f"{title}\n")
        f.write(f"Timestamp: {pd.Timestamp.now()}\n")
        f.write(f"Total Dropped: {len(dropped_df)}\n")
        f.write("=" * 60 + "\n\n")

        for idx, row in dropped_df.iterrows():
            f.write(f"Channel: {row.get('channel_name', 'N/A')}\n")
            f.write(
                f"Location: {row.get('place_name', 'N/A')}, {row.get('country', 'N/A')}\n"
            )
            f.write(
                f"Coordinates: ({row.get('geo_lat', 'N/A')}, {row.get('geo_lon', 'N/A')})\n"
            )
            if "GEOUNIT" in row and "ADMIN" in row:
                f.write(f"Subunit: {row['GEOUNIT']}, Admin: {row['ADMIN']}\n")
            f.write(f"URL: {row.get('channel_resolved_url', 'N/A')}\n")
            f.write("-" * 40 + "\n")


def enforce_min_stations(df):
    """Removes countries with fewer than MIN_STATIONS and reports changes."""
    counts = df["country"].value_counts()
    valid_countries = counts[counts >= MIN_STATIONS].index

    before_n = len(df)
    before_countries = set(df["country"].unique())

    new_df = df[df["country"].isin(valid_countries)]

    after_n = len(new_df)
    after_countries = set(new_df["country"].unique())
    lost_countries = sorted(before_countries - after_countries)

    # Report station changes if any
    if before_n != after_n:
        console.print(
            f"  Stations: [red]{before_n:,}[/red] → [green]{after_n:,}[/green] ([dim]removed {before_n - after_n:,}[/dim])"
        )

    # Report country changes
    console.print(
        f"  Countries: [red]{len(before_countries)}[/red] → [green]{len(after_countries)}[/green] "
        f"([dim]removed {len(lost_countries)}[/dim])"
    )
    if lost_countries:
        console.print(
            f"  Lost countries: [yellow]{', '.join(str(x) for x in lost_countries)}[/yellow]"
        )
    return new_df


# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("[bold cyan]Loading data...[/bold cyan]\n")
radio = pd.read_csv(RADIO_INPUT)
ne = gpd.read_file(NE_10M_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Radio)", f"{radio['country'].nunique():,}")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
console.print(table)


# ==============================================================================
# FILTERING: MIN STATIONS (FIRST PASS)
# ==============================================================================

console.print(
    f"\n[bold yellow]Filtering: Removing countries with < {MIN_STATIONS} stations[/bold yellow]"
)
radio = enforce_min_stations(radio)


# ==============================================================================
# FILTERING: NULL CHANNEL URLS
# ==============================================================================

radio = filter_with_report(
    radio,
    radio["channel_resolved_url"].notnull(),
    "Removing stations without 'resolved' URLs",
)
console.print(f"  [dim]Re-applying min stations filter (< {MIN_STATIONS})...[/dim]")
radio = enforce_min_stations(radio)


# ==============================================================================
# FILTERING: INSECURE CHANNELS
# ==============================================================================

radio = filter_with_report(
    radio, radio["channel_secure"], "Removing stations with insecure channels"
)
console.print(f"  [dim]Re-applying min stations filter (< {MIN_STATIONS})...[/dim]")
radio = enforce_min_stations(radio)


# ==============================================================================
# SPATIAL JOIN
# ==============================================================================

console.print(
    "\n[bold yellow]Spatial Join: Matching stations to Natural Earth countries[/bold yellow]"
)

# Create GeoDataFrame
radio_gdf = gpd.GeoDataFrame(
    radio,
    geometry=gpd.points_from_xy(radio["geo_lon"], radio["geo_lat"]),
    crs="EPSG:4326",
)

# Ensure CRS match
if ne.crs != radio_gdf.crs:
    console.print(
        f"  CRS mismatch: {ne.crs} != {radio_gdf.crs}. Reprojecting NE to match."
    )
    ne = ne.to_crs(radio_gdf.crs)

# Perform spatial join
radio_ne = gpd.sjoin(radio_gdf, ne, how="inner", predicate="within")

console.print(
    f"  Stations: [red]{len(radio):,}[/red] → [green]{len(radio_ne):,}[/green] "
    f"([dim]removed {len(radio) - len(radio_ne):,}[/dim])"
)

# Log dropped stations
dropped_indices = set(radio_gdf.index) - set(radio_ne.index)
dropped_stations = radio_gdf.loc[list(dropped_indices)]

if not dropped_stations.empty:
    log_dropped_stations(
        dropped_stations, SPATIAL_JOIN_LOG_FILE, "SPATIAL JOIN DROP REPORT"
    )

console.print(f"  [dim]Re-applying min stations filter (< {MIN_STATIONS})...[/dim]")
radio_ne = enforce_min_stations(radio_ne)


# ==============================================================================
# FILTER TO MATCH LOWER RESOLUTION
# ==============================================================================

console.print(
    "\n[bold yellow]Filtering: Matching to lower resolution (110m) country set[/bold yellow]"
)

# Load lower resolution dataset
ne_110m = gpd.read_file(NE_110M_INPUT)

# Get country names from lower resolution dataset
valid_country_names = set(ne_110m["NAME"].unique())

console.print(f"  Countries in 10m dataset: [cyan]{radio_ne['NAME'].nunique()}[/cyan]")
console.print(f"  Countries in 110m dataset: [cyan]{len(valid_country_names)}[/cyan]")

# Identify countries that will be dropped
current_country_names = set(radio_ne["NAME"].unique())
countries_to_drop = sorted(current_country_names - valid_country_names)

# Filter to only countries present in 110m dataset
radio_ne = filter_with_report(
    radio_ne,
    radio_ne["NAME"].isin(valid_country_names),
    "Removing countries not in 110m dataset",
)

if countries_to_drop:
    console.print(
        f"  Dropped countries: [yellow]{', '.join(countries_to_drop)}[/yellow]"
    )

console.print(f"  [dim]Re-applying min stations filter (< {MIN_STATIONS})...[/dim]")
radio_ne = enforce_min_stations(radio_ne)


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

# Prepare final columns list
final_cols = original_radio_cols + selected_ne_cols
radio_final = radio_ne[final_cols]

console.print(
    f"[bold green]✓ Final record count: {len(radio_final):,} stations across {radio_final['ISO_A2'].nunique()} countries[/bold green]"
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

# Calculate stations per country with population and area
stations_per_country = (
    radio_final.groupby(["ISO_A2_EH", "NAME", "POP_EST"])
    .size()
    .reset_index(name="station_count")
)

# Sort by population
stations_per_country = stations_per_country.sort_values("POP_EST", ascending=True)

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
