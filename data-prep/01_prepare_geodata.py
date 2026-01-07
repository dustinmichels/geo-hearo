import geopandas as gpd
from rich import print
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

NE_INPUT = "data/ne_110m_admin_0_countries.geojson"
CENTERS_INPUT = "./data/centers.geojson"
NE_OUTPUT = "data/out/ne_countries.geojson"
CENTERS_OUTPUT = "data/out/centers.geojson"

# ==============================================================================
# MAIN
# ==============================================================================

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold cyan]SCRIPT 1: PREPARE GEODATA[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)

# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("\n[bold cyan]Loading data...[/bold cyan]")
ne = gpd.read_file(NE_INPUT)
centers = gpd.read_file(CENTERS_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
table.add_row("Country Centers", f"{len(centers):,}")
console.print(table)

# ==============================================================================
# USE ISO_A2_EH AS ISO CODE
# ==============================================================================

console.print("\n[bold cyan]Using ISO_A2_EH as the ISO code column...[/bold cyan]")

# Rename ISO_A2_EH to ISO_A2 for consistency
ne["ISO_A2"] = ne["ISO_A2_EH"]

console.print(
    f"  [green]✓ Set ISO_A2 from ISO_A2_EH for all {len(ne):,} records[/green]"
)

# ==============================================================================
# MERGE DISPUTED TERRITORIES
# ==============================================================================

console.print(
    "\n[bold cyan]Merging disputed territories with parent countries...[/bold cyan]"
)

# Define territories to merge: disputed territory name -> parent country ISO code
territories_to_merge = {
    "N. Cyprus": "CY",  # Cyprus
    "Somaliland": "SO",  # Somalia
}

merged_count = 0

for territory_name, parent_iso in territories_to_merge.items():
    # Find the disputed territory
    territory = ne[ne["NAME"] == territory_name]

    if len(territory) == 0:
        console.print(f"  [yellow]⚠ Territory '{territory_name}' not found[/yellow]")
        continue

    # Find the parent country
    parent = ne[ne["ISO_A2"] == parent_iso]

    if len(parent) == 0:
        console.print(
            f"  [yellow]⚠ Parent country with ISO '{parent_iso}' not found[/yellow]"
        )
        continue

    territory_geom = territory.iloc[0].geometry
    parent_idx = parent.index[0]
    parent_geom = ne.loc[parent_idx, "geometry"]

    # Merge geometries using unary_union
    from shapely.ops import unary_union

    merged_geom = unary_union([parent_geom, territory_geom])

    # Update parent country geometry
    ne.loc[parent_idx, "geometry"] = merged_geom

    # Remove the disputed territory
    ne = ne[ne["NAME"] != territory_name]

    parent_name = ne.loc[parent_idx, "NAME"]
    console.print(
        f"  [green]✓ Merged {territory_name} into {parent_name} ({parent_iso})[/green]"
    )
    merged_count += 1

console.print(
    f"\n[bold green]✓ Merged {merged_count} disputed territories[/bold green]"
)
console.print(f"[bold green]✓ Dataset now has {len(ne):,} countries[/bold green]")

# ==============================================================================
# CHECK FOR MISSING CENTERS
# ==============================================================================

console.print("\n[bold cyan]Checking for countries without centers...[/bold cyan]")

# Determine the ISO column name in centers dataset
iso_col = "ISO" if "ISO" in centers.columns else None

if iso_col is not None:
    centers_isos = set(centers[iso_col].unique())
    ne_isos = set(ne["ISO_A2"].unique())

    missing_isos = ne_isos - centers_isos

    if missing_isos:
        console.print(
            f"\n[yellow]Found {len(missing_isos)} countries without centers:[/yellow]\n"
        )

        missing_countries = ne[ne["ISO_A2"].isin(missing_isos)][
            ["ISO_A2", "NAME"]
        ].sort_values("NAME")

        for _, row in missing_countries.iterrows():
            console.print(f"  {row['ISO_A2']}: {row['NAME']}")

        console.print(
            f"\n[yellow]⚠ These countries will use computed centroids[/yellow]"
        )
    else:
        console.print("[green]✓ All countries have centers[/green]")
else:
    console.print("[yellow]⚠ Cannot determine ISO column in centers dataset[/yellow]")

# ==============================================================================
# OUTPUT: NATURAL EARTH GEOJSON
# ==============================================================================

console.print("\n[bold cyan]Creating Natural Earth GeoJSON output...[/bold cyan]")

# Select columns to keep
ne_output_cols = [
    "ADMIN",
    "NAME",
    "SUBUNIT",
    "ISO_A3",
    "ISO_A2",
    "POSTAL",
    "CONTINENT",
    "LEVEL",
    "POP_EST",
    "POP_RANK",
    "TINY",
    "geometry",
]

ne_output = ne[ne_output_cols].copy()

# Save as GeoJSON
console.print(f"  Saving to {NE_OUTPUT}...")
ne_output.to_file(NE_OUTPUT, driver="GeoJSON")

console.print(
    f"[bold green]✓ Successfully saved {len(ne_output):,} countries to {NE_OUTPUT}[/bold green]\n"
)

# ==============================================================================
# OUTPUT: CENTERS GEOJSON
# ==============================================================================

console.print("\n[bold cyan]Creating Centers GeoJSON output...[/bold cyan]")

# Check what columns are in the centers dataset
console.print(f"  Centers dataset columns: {list(centers.columns)}")

# Determine the ISO column name in centers dataset
iso_col = "ISO" if "ISO" in centers.columns else None

# Create a dataset with centers - use original if exists, otherwise compute centroid
centers_output_data = []
used_original = 0
computed_centroid = 0

for idx, country in ne_output.iterrows():
    iso = country["ISO_A2"]

    # Get original center from centers dataset if available
    if iso_col is not None:
        original_center = centers[centers[iso_col] == iso]
    else:
        original_center = []

    if len(original_center) > 0:
        # Use original center
        original_geom = original_center.iloc[0].geometry
        lon = original_geom.x
        lat = original_geom.y
        used_original += 1
    else:
        # Compute centroid from country geometry
        centroid = country["geometry"].centroid
        lon = centroid.x
        lat = centroid.y
        computed_centroid += 1

    centers_output_data.append(
        {"iso_a2": iso, "name": country["NAME"], "lon": lon, "lat": lat}
    )

console.print(f"  Using original centers: {used_original}")
console.print(f"  Computing centroids: {computed_centroid}")

# Create GeoDataFrame
centers_gdf = gpd.GeoDataFrame(
    centers_output_data,
    geometry=gpd.points_from_xy(
        [d["lon"] for d in centers_output_data], [d["lat"] for d in centers_output_data]
    ),
    crs="EPSG:4326",
)

# Save as GeoJSON
console.print(f"  Saving to {CENTERS_OUTPUT}...")
centers_gdf.to_file(CENTERS_OUTPUT, driver="GeoJSON")

console.print(
    f"[bold green]✓ Successfully saved {len(centers_gdf):,} country centers to {CENTERS_OUTPUT}[/bold green]\n"
)

# ==============================================================================
# FINAL SUMMARY
# ==============================================================================

console.print(
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]"
)
console.print("[bold cyan]FINAL SUMMARY[/]")
console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]\n"
)

summary_table = Table(title="Processing Results")
summary_table.add_column("Metric", style="cyan")
summary_table.add_column("Count", justify="right", style="green")

summary_table.add_row("Countries in Natural Earth", f"{len(ne_output):,}")
summary_table.add_row("Centers output", f"{len(centers_gdf):,}")
summary_table.add_row("Original centers used", f"{used_original:,}")
summary_table.add_row("Centroids computed", f"{computed_centroid:,}")

console.print(summary_table)

# Verify all countries have centers
if len(ne_output) == len(centers_gdf):
    console.print(
        "\n[bold green]✓ All countries have corresponding center entries[/bold green]"
    )
else:
    console.print(
        f"\n[bold red]✗ Mismatch: {len(ne_output)} countries but {len(centers_gdf)} centers[/bold red]"
    )

console.print(
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold green]SCRIPT 1 COMPLETE[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)
