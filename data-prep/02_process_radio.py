"""
USAGE:
    uv run 02_process_radio.py
"""

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "crawl/out/output.csv"
NE_INPUT = "data/ne_110m_admin_0_countries.geojson"
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

console.print("\n[bold cyan]Loading data...[/bold cyan]\n")
radio = pd.read_csv(RADIO_INPUT)
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

console.print(f"  [dim]Re-applying min stations filter (< {MIN_STATIONS})...[/dim]")
radio_ne = enforce_min_stations(radio_ne)
