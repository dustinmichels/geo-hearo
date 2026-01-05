import json

import geopandas as gpd
import pandas as pd
from rich import print
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

console = Console()

# Load data
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

# Fill NA values
radio["channel_stream"] = radio["channel_stream"].fillna("")

# Filter out null channel_resolved_url
console.print(
    "\n[bold yellow]Filtering: Removing stations without 'resolved' URLs[/bold yellow]"
)
before = len(radio)
before_countries = radio["country"].nunique()
radio = radio[radio["channel_resolved_url"].notnull()]
after = len(radio)
after_countries = radio["country"].nunique()
# number of records and countries
console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green]"
)

# Filter out insecure channels
console.print("\n[bold yellow]Filtering: Removing insecure channels[/bold yellow]")
before = len(radio)
before_countries = radio["country"].nunique()
radio = radio[radio["channel_secure"] == True]
after = len(radio)
after_countries = radio["country"].nunique()
console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green]"
)

# Create GeoDataFrame
console.print("\n[bold cyan]Creating geo-spatial data...[/bold cyan]")
radio_gdf = gpd.GeoDataFrame(
    radio,
    geometry=gpd.points_from_xy(radio.geo_lon, radio.geo_lat),
    crs="EPSG:4326",
)

# Spatial join
console.print(
    "\n[bold cyan]Performing spatial join with country boundaries...[/bold cyan]"
)
radio_ne = gpd.sjoin(radio_gdf, ne, how="inner", predicate="within")

# Check lost countries
lost_countries = radio[~radio["country"].isin(radio_ne["country"])]["country"].unique()
if len(lost_countries) > 0:
    console.print(
        Panel(
            f"[yellow]{len(lost_countries)} countries lost during spatial join:[/yellow]\n"
            + ", ".join(sorted(lost_countries)),
            title="⚠️  Lost Countries",
            border_style="yellow",
        )
    )
else:
    console.print("[green]✓ No countries lost during spatial join[/green]")


# Filter based on centers ISO
console.print(
    "\n[bold yellow]Filtering: Aligning with centers dataset based on ISO codes[/bold yellow]"
)
before = len(radio_ne)
radio_ne = radio_ne[radio_ne["ISO_A2"].isin(centers["ISO"])]
after = len(radio_ne)
console.print(
    f"  Before: [red]{before:,}[/red] → After: [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)


console.print(f"\n  Final record count: [bold green]{len(radio_ne):,}[/bold green]")

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


# filter out NE 'level 4 = Lease or special administrative region'
# Examples: Hong Kong, Macau, some military bases
# Areas under special governance arrangements
before = len(radio_final)
radio_final = radio_final[radio_final["LEVEL"] != 4]
after = len(radio_final)
console.print(
    f"\n[bold yellow]Filtering: Removing level 4 special administrative regions[/bold yellow]\n"
    f"  Before: [red]{before:,}[/red] → After: [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)

# Save as JSON
output_path = "data/out/radio_with_countries.json"
console.print(f"\n[bold cyan]Saving to {output_path}...[/bold cyan]")
with open(output_path, "w") as f:
    json.dump(radio_final.to_dict(orient="records"), f, indent=2)

console.print(
    f"[bold green]✓ Successfully saved {len(radio_final):,} records to {output_path}[/bold green]\n"
)
