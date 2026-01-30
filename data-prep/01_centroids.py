"""
Country Centroid Computation Script

This script computes representative centroids for countries using Natural Earth data.

METHODOLOGY:
- Extracts the largest polygon (mainland) for each country to avoid island influence
- Computes geometric centroids, with fallback to representative points for complex shapes
- Ensures resulting points are guaranteed to be within country boundaries
- Outputs centroids as a GeoJSON file with country metadata

INPUT:
- Natural Earth countries GeoJSON file

OUTPUT:
- GeoJSON file containing point geometries at centroid locations
- Includes: country name, ISO code, continent, population, mainland area

USAGE:
    uv run 01_centroids.py
"""

import os
import geopandas as gpd
from rich.console import Console
from rich.table import Table
from shapely.geometry import MultiPolygon, Polygon

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

NE_INPUT = "data/ne_110m_admin_0_countries.geojson"
OUTPUT_FILE = "data/out/country_centroids.geojson"

# ==============================================================================
# HELPER FUNCTIONS
# ==============================================================================


def get_largest_polygon(geometry):
    """
    Extract the largest polygon from a geometry (mainland).
    Handles both Polygon and MultiPolygon types.
    """
    if isinstance(geometry, Polygon):
        return geometry
    elif isinstance(geometry, MultiPolygon):
        # Return the polygon with the largest area
        return max(geometry.geoms, key=lambda p: p.area)
    else:
        return geometry


def compute_representative_point(polygon):
    """
    Compute a representative point that is guaranteed to be within the polygon.
    Uses shapely's representative_point() method, which implements an algorithm
    to find a point inside the geometry.
    """
    try:
        # Shapely's representative_point is guaranteed to be within the geometry
        return polygon.representative_point()
    except Exception as e:
        console.print(
            f"[yellow]Warning: Could not compute representative point: {e}[/yellow]"
        )
        # Fallback to centroid (may be outside polygon for complex shapes)
        return polygon.centroid


def compute_interior_centroid(polygon):
    """
    Compute a geometric centroid that is guaranteed to be within the polygon.

    This function first computes the geometric centroid. If that point falls
    outside the polygon (which can happen with concave or complex shapes),
    it falls back to using representative_point() which is guaranteed to be inside.

    Note: This is a geometric centroid based on the polygon's shape, NOT weighted
    by population, area, or any other factor.
    """
    # First try the geometric centroid
    centroid = polygon.centroid

    # Check if centroid is within the polygon
    if polygon.contains(centroid):
        return centroid

    # If not, use representative point (guaranteed to be inside)
    return compute_representative_point(polygon)


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================


def main():
    console.print("\n[bold cyan]Loading Natural Earth dataset...[/bold cyan]")
    gdf = gpd.read_file(NE_INPUT)

    console.print(f"Loaded {len(gdf)} countries")
    console.print(f"CRS: {gdf.crs}")

    # Create a copy for processing
    gdf_processed = gdf.copy()

    console.print("\n[bold cyan]Computing centroids...[/bold cyan]")

    # Extract mainland (largest polygon) for each country
    gdf_processed["mainland"] = gdf_processed["geometry"].apply(get_largest_polygon)

    # Compute representative centroids
    gdf_processed["centroid"] = gdf_processed["mainland"].apply(
        compute_interior_centroid
    )

    # Create output GeoDataFrame with centroids
    centroids_gdf = gpd.GeoDataFrame(
        gdf_processed[["NAME", "ISO_A3", "CONTINENT", "POP_EST"]],
        geometry=gdf_processed["centroid"],
        crs=gdf.crs,
    )

    # Add area information (mainland only)
    centroids_gdf["mainland_area_km2"] = (
        gdf_processed["mainland"].to_crs("EPSG:6933").area / 1e6
    )

    # ==============================================================================
    # VALIDATION & STATISTICS
    # ==============================================================================

    console.print("\n[bold cyan]Validation Results:[/bold cyan]")

    # Check how many centroids are within their country boundaries
    within_boundary = sum(
        gdf_processed["mainland"].iloc[i].contains(gdf_processed["centroid"].iloc[i])
        for i in range(len(gdf_processed))
    )

    console.print(
        f"✓ Centroids within country boundaries: {within_boundary}/{len(gdf_processed)} ({100 * within_boundary / len(gdf_processed):.1f}%)"
    )

    # Show examples
    console.print("\n[bold cyan]Sample Results:[/bold cyan]")
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("Country", style="cyan", width=20)
    table.add_column("ISO", justify="center", width=6)
    table.add_column("Mainland Area (km²)", justify="right", width=18)
    table.add_column("Centroid Lon", justify="right", width=12)
    table.add_column("Centroid Lat", justify="right", width=12)
    table.add_column("Within?", justify="center", width=8)

    # Show a diverse sample of countries
    sample_countries = [
        "United States of America",
        "China",
        "Russia",
        "Brazil",
        "France",
        "Indonesia",
        "Norway",
        "Chile",
        "Japan",
        "South Africa",
    ]

    for country in sample_countries:
        row = centroids_gdf[centroids_gdf["NAME"] == country]
        if not row.empty:
            idx = row.index[0]
            centroid = row.geometry.iloc[0]
            within = (
                "✓" if gdf_processed["mainland"].iloc[idx].contains(centroid) else "✗"
            )

            table.add_row(
                country,
                row["ISO_A3"].iloc[0],
                f"{row['mainland_area_km2'].iloc[0]:,.0f}",
                f"{centroid.x:.4f}",
                f"{centroid.y:.4f}",
                within,
            )

    console.print(table)

    # ==============================================================================
    # SAVE OUTPUT
    # ==============================================================================

    console.print(f"\n[bold cyan]Saving centroids to {OUTPUT_FILE}...[/bold cyan]")

    # Ensure output directory exists
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

    centroids_gdf.to_file(OUTPUT_FILE, driver="GeoJSON")
    console.print("[bold green]✓ Complete![/bold green]")

    return centroids_gdf


if __name__ == "__main__":
    centroids = main()
