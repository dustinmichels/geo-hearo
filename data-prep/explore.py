"""
USAGE:
    uv run explore_spatial.py

Check which subunits are within or intersect their sovereign's polygon
"""

import os

import geopandas as gpd
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from shapely.geometry import Point

console = Console()

NE_SUBUNITS = "data/ne/ne_10m_map_subunits_admin_0_countries.geojson"
NE = "data/ne/ne_10m_admin_0_countries.geojson"

# Read both datasets
console.print(
    Panel.fit("🌍 Spatial Analysis: Subunits vs Sovereign Polygons", style="bold cyan")
)
console.print()

with console.status("[bold green]Reading datasets..."):
    gdf_subunits = gpd.read_file(NE_SUBUNITS)
    gdf_sovereigns = gpd.read_file(NE)

    # Reproject to equal area projection for accurate area calculations
    gdf_subunits = gdf_subunits.to_crs("EPSG:6933")  # World Cylindrical Equal Area
    gdf_sovereigns = gdf_sovereigns.to_crs("EPSG:6933")

console.print(
    f"✓ Loaded {len(gdf_subunits)} subunits and {len(gdf_sovereigns)} sovereign states",
    style="green",
)
console.print()

# Get sovereigns with multiple subunits
multi_subunit_sovereigns = []
for sovereign in gdf_subunits["SOVEREIGNT"].unique():
    subunits = gdf_subunits[gdf_subunits["SOVEREIGNT"] == sovereign]
    if len(subunits) > 1:
        multi_subunit_sovereigns.append(sovereign)

console.print(
    f"Found [bold]{len(multi_subunit_sovereigns)}[/bold] sovereigns with multiple subunits\n"
)

# Iterate over each sovereign
for sovereign in multi_subunit_sovereigns:
    # Get all subunits for this sovereign
    subunits = gdf_subunits[gdf_subunits["SOVEREIGNT"] == sovereign]

    # Get the sovereign's polygon from NE dataset
    sovereign_row = gdf_sovereigns[gdf_sovereigns["SOVEREIGNT"] == sovereign]

    if len(sovereign_row) == 0:
        console.print(
            Panel(
                f"⚠️  No sovereign polygon found for {sovereign}",
                style="yellow",
                border_style="yellow",
            )
        )
        continue

    # Get the polygon with the largest area
    sovereign_geom = sovereign_row.loc[sovereign_row.geometry.area.idxmax()].geometry

    # Lists to track subunits
    within = []
    intersects = []
    not_within = []

    # Check each subunit
    for idx, subunit_row in subunits.iterrows():
        subunit_name = subunit_row["SUBUNIT"]
        subunit_geom = subunit_row.geometry

        # Check if subunit centroid is within sovereign polygon
        centroid = subunit_geom.centroid

        # Check containment vs intersection
        if sovereign_geom.contains(centroid):
            # Fully within - centroid is contained
            try:
                intersection = sovereign_geom.intersection(subunit_geom)
                overlap_pct = (intersection.area / subunit_geom.area) * 100
                within.append((subunit_name, overlap_pct))
            except:
                within.append((subunit_name, None))
        elif sovereign_geom.intersects(subunit_geom):
            # Intersects but centroid not fully within
            try:
                intersection = sovereign_geom.intersection(subunit_geom)
                overlap_pct = (intersection.area / subunit_geom.area) * 100
                intersects.append((subunit_name, overlap_pct))
            except:
                intersects.append((subunit_name, None))
        else:
            # No spatial relationship
            not_within.append(subunit_name)

    # Create a rich table for this sovereign
    table = Table(
        title=f"[bold cyan]{sovereign}[/bold cyan]",
        show_header=True,
        header_style="bold magenta",
        border_style="cyan",
    )

    table.add_column("Status", style="bold", width=14)
    table.add_column("Subunit", style="white")
    table.add_column("Overlap %", justify="right", style="yellow")

    # Add within subunits
    for subunit, overlap in within:
        overlap_str = f"{overlap:.1f}%" if overlap is not None else "N/A"
        table.add_row("✓ WITHIN", subunit, overlap_str, style="green")

    # Add intersecting subunits
    for subunit, overlap in intersects:
        overlap_str = f"{overlap:.1f}%" if overlap is not None else "N/A"
        table.add_row("⊕ INTERSECTS", subunit, overlap_str, style="yellow")

    # Add not within subunits
    for subunit in not_within:
        table.add_row("✗ OUTSIDE", subunit, "0.0%", style="red")

    # Add summary row
    table.add_section()
    summary = (
        f"{len(within)} within, {len(intersects)} intersects, {len(not_within)} outside"
    )
    table.add_row("[bold]TOTAL", summary, "", style="bold white")

    console.print(table)
    console.print()

console.print(Panel.fit("✨ Analysis Complete!", style="bold green"))
