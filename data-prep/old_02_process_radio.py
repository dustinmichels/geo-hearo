import json

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "crawl/out/output.csv"
NE_INPUT = "data/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/all_radio_with_countries.json"

# Population percentile threshold - countries below this percentile will be filtered out
POPULATION_PERCENTILE_THRESHOLD = 0.00  # 0th percentile (bottom 0%)

# Area percentile threshold - countries below this percentile will be filtered out
AREA_PERCENTILE_THRESHOLD = 0.00  # 0th percentile (bottom 0%)

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

console.print("\n[bold cyan]Loading data...[/bold cyan]")
radio = pd.read_csv(RADIO_INPUT)
ne = gpd.read_file(NE_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
console.print(table)

# ==============================================================================
# DATA CLEANING & PREPARATION
# ==============================================================================

# Fill NA values
radio["channel_stream"] = radio["channel_stream"].fillna("")

# ==============================================================================
# FILTERING: NULL CHANNEL URLS
# ==============================================================================

console.print(
    "\n[bold yellow]Filtering: Removing stations without 'resolved' URLs[/bold yellow]"
)
before = len(radio)
before_countries = radio["country"].nunique()
countries_before = set(radio["country"].unique())
radio = radio[radio["channel_resolved_url"].notnull()]
after = len(radio)
after_countries = radio["country"].nunique()
countries_after = set(radio["country"].unique())
lost_countries = sorted(countries_before - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_countries)}[/dim])"
)
if lost_countries:
    console.print(f"  Lost countries: [yellow]{', '.join(lost_countries)}[/yellow]")

# ==============================================================================
# FILTERING: INSECURE CHANNELS
# ==============================================================================

console.print("\n[bold yellow]Filtering: Removing insecure channels[/bold yellow]")
before = len(radio)
before_countries = radio["country"].nunique()
countries_before = set(radio["country"].unique())
radio = radio[radio["channel_secure"] == True]
after = len(radio)
after_countries = radio["country"].nunique()
countries_after = set(radio["country"].unique())
lost_countries = sorted(countries_before - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_countries)}[/dim])"
)
if lost_countries:
    console.print(f"  Lost countries: [yellow]{', '.join(lost_countries)}[/yellow]")

# ==============================================================================
# GEOSPATIAL PROCESSING
# ==============================================================================

console.print("\n[bold cyan]Creating geo-spatial data...[/bold cyan]")
radio_gdf = gpd.GeoDataFrame(
    radio,
    geometry=gpd.points_from_xy(radio.geo_lon, radio.geo_lat),
    crs="EPSG:4326",
)

# ==============================================================================
# SPATIAL JOIN WITH COUNTRY BOUNDARIES
# ==============================================================================

console.print(
    "\n[bold cyan]Performing spatial join with country boundaries...[/bold cyan]"
)
before = len(radio)
before_countries = radio["country"].nunique()
countries_before = set(radio["country"].unique())

radio_ne = gpd.sjoin(radio_gdf, ne, how="inner", predicate="within")

after = len(radio_ne)
after_countries = radio_ne["country"].nunique()
countries_after = set(radio_ne["country"].unique())
lost_countries = sorted(countries_before - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_countries)}[/dim])"
)
if lost_countries:
    console.print(
        Panel(
            ", ".join(lost_countries),
            title=f"⚠️  {len(lost_countries)} Countries Lost in Spatial Join",
            border_style="yellow",
        )
    )
else:
    console.print("[green]✓ No countries lost during spatial join[/green]")


# ==============================================================================
# FILTERING: REMOVE BOTTOM 10% OF COUNTRIES BY POPULATION
# ==============================================================================

console.print(
    f"\n[bold yellow]Filtering: Removing bottom {POPULATION_PERCENTILE_THRESHOLD * 100:.0f}% of countries by population (based on Natural Earth dataset)[/bold yellow]"
)

# Load original Natural Earth to calculate threshold
ne_original = gpd.read_file("data/ne_50m_admin_0_countries.geojson")
pop_threshold = ne_original["POP_EST"].quantile(POPULATION_PERCENTILE_THRESHOLD)
console.print(
    f"  Population threshold ({POPULATION_PERCENTILE_THRESHOLD * 100:.0f}th percentile of NE dataset): {pop_threshold:,.0f}"
)

# Get unique countries in current working dataset with their population
country_populations = radio_ne[["ISO_A2", "NAME", "POP_EST"]].drop_duplicates()

# Identify countries below threshold in our working dataset
countries_below_threshold = country_populations[
    country_populations["POP_EST"] < pop_threshold
].sort_values("POP_EST")

console.print(
    f"  Countries in working dataset below threshold: {len(countries_below_threshold)}"
)
if len(countries_below_threshold) > 0:
    console.print("  Countries to be removed:")
    for _, row in countries_below_threshold.iterrows():
        console.print(f"    {row['NAME']} ({row['ISO_A2']}): {row['POP_EST']:,.0f}")

before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()

# Filter out countries below threshold
radio_ne = radio_ne[radio_ne["POP_EST"] >= pop_threshold]

after = len(radio_ne)
after_countries = radio_ne["ISO_A2"].nunique()

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(countries_below_threshold)}[/dim])"
)

# ==============================================================================
# FILTERING: REMOVE BOTTOM X% OF COUNTRIES BY AREA
# ==============================================================================

console.print(
    f"\n[bold yellow]Filtering: Removing bottom {AREA_PERCENTILE_THRESHOLD * 100:.0f}% of countries by area (based on Natural Earth dataset)[/bold yellow]"
)

# Calculate area for Natural Earth dataset (in square kilometers)
ne_with_area = ne.copy()
ne_with_area["AREA_KM2"] = ne_with_area.to_crs("EPSG:6933").geometry.area / 1_000_000

area_threshold = ne_with_area["AREA_KM2"].quantile(AREA_PERCENTILE_THRESHOLD)
console.print(
    f"  Area threshold ({AREA_PERCENTILE_THRESHOLD * 100:.0f}th percentile of NE dataset): {area_threshold:,.0f} km²"
)

# Merge area data into radio_ne based on ISO_A2
country_areas = ne_with_area[["ISO_A2", "AREA_KM2"]].drop_duplicates()
radio_ne = radio_ne.merge(country_areas, on="ISO_A2", how="left")

# Get unique countries in current working dataset with their area
country_info = radio_ne[["ISO_A2", "NAME", "AREA_KM2"]].drop_duplicates()

# Identify countries below threshold in our working dataset
countries_below_threshold_area = country_info[
    country_info["AREA_KM2"] < area_threshold
].sort_values("AREA_KM2")

console.print(
    f"  Countries in working dataset below threshold: {len(countries_below_threshold_area)}"
)
if len(countries_below_threshold_area) > 0:
    console.print("  Countries to be removed:")
    for _, row in countries_below_threshold_area.iterrows():
        console.print(
            f"    {row['NAME']} ({row['ISO_A2']}): {row['AREA_KM2']:,.0f} km²"
        )

before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()

# Filter out countries below threshold
radio_ne = radio_ne[radio_ne["AREA_KM2"] >= area_threshold].copy()
# Drop the AREA_KM2 column as it was only for filtering
radio_ne = radio_ne.drop(columns=["AREA_KM2"])

after = len(radio_ne)
after_countries = radio_ne["ISO_A2"].nunique()

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(countries_below_threshold_area)}[/dim])"
)

# ==============================================================================
# FILTERING: COUNTRIES WITH <5 RADIO STATIONS (FINAL CHECK)
# ==============================================================================

console.print(
    "\n[bold yellow]Filtering: Final check - removing countries with <5 radio stations[/bold yellow]"
)
before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()
countries_before_data = radio_ne[["ISO_A2", "NAME"]].drop_duplicates()

# Count stations per country
stations_per_country_check = radio_ne.groupby("ISO_A2").size()
countries_to_keep = stations_per_country_check[stations_per_country_check >= 5].index

# Filter the dataframe
radio_ne = radio_ne[radio_ne["ISO_A2"].isin(countries_to_keep)]

after = len(radio_ne)
after_countries = radio_ne["ISO_A2"].nunique()
countries_after = set(radio_ne["ISO_A2"].unique())
lost_iso_codes = sorted(set(countries_before_data["ISO_A2"].unique()) - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_iso_codes)}[/dim])"
)
if lost_iso_codes:
    # Show countries that were removed with their station counts
    removed_countries_info = stations_per_country_check[
        stations_per_country_check.index.isin(lost_iso_codes)
    ].sort_values()
    console.print(f"  Lost countries with their station counts:")
    for iso_code, count in removed_countries_info.items():
        country_name = countries_before_data[
            countries_before_data["ISO_A2"] == iso_code
        ]["NAME"].iloc[0]
        console.print(f"    {country_name} ({iso_code}): {count} station(s)")

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
    "ISO_A3",
    "ISO_A2",
    "ISO_A2_EH",
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

# Calculate area for countries in final dataset (in square kilometers)
ne_with_area_final = ne[ne["ISO_A2"].isin(radio_final["ISO_A2"].unique())].copy()
ne_with_area_final["AREA_KM2"] = (
    ne_with_area_final.to_crs("EPSG:6933").geometry.area / 1_000_000
)
country_areas_final = ne_with_area_final[["ISO_A2", "AREA_KM2"]].drop_duplicates()

# Calculate stations per country with population and area
stations_per_country = (
    radio_final.groupby(["ISO_A2", "NAME", "POP_EST"])
    .size()
    .reset_index(name="station_count")
)
# Merge area data
stations_per_country = stations_per_country.merge(
    country_areas_final, on="ISO_A2", how="left"
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
summary_table.add_column("Area (km²)", justify="right", style="magenta")
summary_table.add_column("Stations", justify="right", style="green")

for rank, (idx, row) in enumerate(stations_per_country.iterrows(), start=1):
    summary_table.add_row(
        str(rank),
        row["NAME"],
        row["ISO_A2"],
        f"{row['POP_EST']:,.0f}",
        f"{row['AREA_KM2']:,.0f}",
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
