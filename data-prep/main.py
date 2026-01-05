import json

import geopandas as gpd
import pandas as pd
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# Population percentile threshold - countries below this percentile will be filtered out
POPULATION_PERCENTILE_THRESHOLD = 0.10  # 10th percentile (bottom 10%)

# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("\n[bold cyan]Loading data...[/bold cyan]")
radio = pd.read_csv("crawl/out/output.csv")
ne = gpd.read_file("data/ne_50m_admin_0_countries.geojson")
centers = gpd.read_file("./data/centers.geojson")

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
table.add_row("Country Centers", f"{len(centers):,}")
console.print(table)

# ==============================================================================
# DATA CLEANING & PREPARATION
# ==============================================================================

# Fill NA values
radio["channel_stream"] = radio["channel_stream"].fillna("")

# ==============================================================================
# FILTERING: NULL CHANNEL URLS
# ==============================================================================

# Filter out null channel_resolved_url
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

# Filter out insecure channels
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

# Create GeoDataFrame
console.print("\n[bold cyan]Creating geo-spatial data...[/bold cyan]")
radio_gdf = gpd.GeoDataFrame(
    radio,
    geometry=gpd.points_from_xy(radio.geo_lon, radio.geo_lat),
    crs="EPSG:4326",
)

# ==============================================================================
# SPATIAL JOIN WITH COUNTRY BOUNDARIES
# ==============================================================================

# Spatial join
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
# FIX ISO CODES
# ==============================================================================

# Fix ISO_A2 codes: use ISO_A2_EH as fallback when ISO_A2 is -99
console.print(
    "\n[bold cyan]Fixing ISO codes (using ISO_A2_EH fallback for -99 values)...[/bold cyan]"
)
before = len(radio_ne)
before_countries = radio_ne["country"].nunique()

iso_fixes_count = (radio_ne["ISO_A2"] == "-99").sum()
if iso_fixes_count > 0:
    console.print(f"  Found {iso_fixes_count:,} records with ISO_A2 = -99")
    # Show which countries are affected
    affected = (
        radio_ne[radio_ne["ISO_A2"] == "-99"][["NAME", "ISO_A2_EH"]]
        .drop_duplicates()
        .sort_values("NAME")
    )
    for _, row in affected.iterrows():
        console.print(f"    {row['NAME']}: -99 → {row['ISO_A2_EH']}")

    # Apply the fix
    radio_ne["ISO_A2"] = radio_ne.apply(
        lambda row: row["ISO_A2_EH"] if row["ISO_A2"] == "-99" else row["ISO_A2"],
        axis=1,
    )
    console.print(f"  [green]✓ Fixed {iso_fixes_count:,} ISO codes[/green]")
else:
    console.print("  [green]✓ No ISO codes need fixing[/green]")

after = len(radio_ne)
after_countries = radio_ne["country"].nunique()

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]no records removed[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green]"
)


# ==============================================================================
# FILTERING: ALIGN WITH CENTERS DATASET
# ==============================================================================

# Filter based on centers ISO
console.print(
    "\n[bold yellow]Filtering: Aligning with centers dataset based on ISO codes[/bold yellow]"
)
before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()
countries_before = set(radio_ne["ISO_A2"].unique())
# Capture country names BEFORE filtering
countries_before_data = radio_ne[["ISO_A2", "NAME"]].drop_duplicates()

radio_ne = radio_ne[radio_ne["ISO_A2"].isin(centers["ISO"])]

after = len(radio_ne)
after_countries = radio_ne["ISO_A2"].nunique()
countries_after = set(radio_ne["ISO_A2"].unique())
lost_iso_codes = sorted(countries_before - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_iso_codes)}[/dim])"
)
if lost_iso_codes:
    # Get the country names from the data we captured before filtering
    lost_country_names = countries_before_data[
        countries_before_data["ISO_A2"].isin(lost_iso_codes)
    ]
    lost_country_names = lost_country_names.sort_values("NAME")
    lost_names_list = [
        f"{row['NAME']} ({row['ISO_A2']})" for _, row in lost_country_names.iterrows()
    ]
    console.print(f"  Lost countries: [yellow]{', '.join(lost_names_list)}[/yellow]")


# ==============================================================================
# FILTERING: REMOVE SPECIAL ADMINISTRATIVE REGIONS
# ==============================================================================

# filter out NE 'level 4 = Lease or special administrative region'
# Examples: Hong Kong, Macau, some military bases
# Areas under special governance arrangements
console.print(
    "\n[bold yellow]Filtering: Removing level 4 special administrative regions[/bold yellow]"
)
before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()
countries_before_data = radio_ne[["ISO_A2", "NAME"]].drop_duplicates()

radio_ne = radio_ne[radio_ne["LEVEL"] != 4]

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
    lost_country_names = countries_before_data[
        countries_before_data["ISO_A2"].isin(lost_iso_codes)
    ]
    lost_country_names = lost_country_names.sort_values("NAME")
    lost_names_list = [
        f"{row['NAME']} ({row['ISO_A2']})" for _, row in lost_country_names.iterrows()
    ]
    console.print(f"  Lost countries: [yellow]{', '.join(lost_names_list)}[/yellow]")


# ==============================================================================
# FILTERING: REMOVE BOTTOM 10% OF COUNTRIES BY POPULATION
# ==============================================================================

console.print(
    f"\n[bold yellow]Filtering: Removing bottom {POPULATION_PERCENTILE_THRESHOLD * 100:.0f}% of countries by population (based on Natural Earth dataset)[/bold yellow]"
)

# Calculate the percentile threshold from the ORIGINAL Natural Earth dataset
pop_threshold = ne["POP_EST"].quantile(POPULATION_PERCENTILE_THRESHOLD)
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
# FINAL DATA PREPARATION
# ==============================================================================

# Prepare final data
# LEVEL - Administrative level (2=country, 3=dependency, etc.)
# POP_EST
selected_ne_cols = [
    "ADMIN",
    "NAME",
    "ISO_A3",
    "ISO_A2",
    "POSTAL",
    "CONTINENT",
    "LEVEL",
    "POP_EST",
    "POP_RANK",
]
final_cols = radio.columns.tolist() + selected_ne_cols
radio_final = radio_ne[final_cols]

console.print(
    f"\n[bold green]✓ Final record count: {len(radio_final):,} stations across {radio_final['ISO_A2'].nunique()} countries[/bold green]"
)

# ==============================================================================
# OUTPUT
# ==============================================================================

# Save as JSON
output_path = "data/out/radio_with_countries.json"
console.print(f"\n[bold cyan]Saving to {output_path}...[/bold cyan]")
with open(output_path, "w") as f:
    json.dump(radio_final.to_dict(orient="records"), f, indent=2)

console.print(
    f"[bold green]✓ Successfully saved {len(radio_final):,} records to {output_path}[/bold green]\n"
)
