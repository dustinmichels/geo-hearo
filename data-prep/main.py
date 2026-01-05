import json

import geopandas as gpd
import pandas as pd
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

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
# FILTERING: ALIGN WITH CENTERS DATASET
# ==============================================================================

# Filter based on centers ISO
console.print(
    "\n[bold yellow]Filtering: Aligning with centers dataset based on ISO codes[/bold yellow]"
)
before = len(radio_ne)
before_countries = radio_ne["ISO_A2"].nunique()
countries_before = set(radio_ne["ISO_A2"].unique())

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
    # Get full country names for lost ISO codes from the NE dataset
    lost_country_names = ne[ne["ISO_A2"].isin(lost_iso_codes)][
        ["ISO_A2", "NAME"]
    ].drop_duplicates()
    lost_country_names = lost_country_names.sort_values("NAME")
    lost_names_list = [
        f"{row['NAME']} ({row['ISO_A2']})" for _, row in lost_country_names.iterrows()
    ]
    console.print(f"  Lost countries: [yellow]{', '.join(lost_names_list)}[/yellow]")


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


# ==============================================================================
# FILTERING: REMOVE SPECIAL ADMINISTRATIVE REGIONS
# ==============================================================================

# filter out NE 'level 4 = Lease or special administrative region'
# Examples: Hong Kong, Macau, some military bases
# Areas under special governance arrangements
console.print(
    "\n[bold yellow]Filtering: Removing level 4 special administrative regions[/bold yellow]"
)
before = len(radio_final)
before_countries = radio_final["ISO_A2"].nunique()
countries_before_data = radio_final[["ISO_A2", "NAME"]].drop_duplicates()

radio_final = radio_final[radio_final["LEVEL"] != 4]

after = len(radio_final)
after_countries = radio_final["ISO_A2"].nunique()
countries_after = set(radio_final["ISO_A2"].unique())
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
