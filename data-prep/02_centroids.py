"""
Country Centroid Computation Script

This script computes representative centroids for countries using Natural Earth data.

METHODOLOGY:
- Extracts the largest polygon (mainland) for each country to avoid island influence
- Reprojects geometries to EPSG:8857 (Equal Earth) for accurate centroid computation
- Computes geometric centroids, with fallback to representative points for complex shapes
- Reprojects centroids back to EPSG:4326 for output
- Ensures resulting points are guaranteed to be within country boundaries
- Outputs centroids as a GeoJSON file with country metadata

INPUT:
- Natural Earth countries GeoJSON file

OUTPUT:
- GeoJSON file containing point geometries at centroid locations
- Includes: country name, ISO code, continent, population

USAGE:
    uv run 02_centroids.py
"""

import os
import geopandas as gpd
from rich.console import Console
from shapely.geometry import MultiPolygon, Polygon

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

NE_INPUT = "data/ne/ne_10m_admin_0_countries.geojson"
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

    # Create a temporary GeoDataFrame for reprojection
    mainland_gdf = gpd.GeoDataFrame(geometry=gdf_processed["mainland"], crs=gdf.crs)

    # Reproject to EPSG:8857 (Equal Earth) for accurate centroid calculation
    mainland_8857 = mainland_gdf.to_crs("EPSG:8857")

    # Compute centroids in the projected CRS
    console.print("Computing centroids in EPSG:8857...")
    centroids_8857 = mainland_8857.geometry.apply(compute_interior_centroid)

    # Reproject centroids back to EPSG:4326
    centroids_gdf_8857 = gpd.GeoDataFrame(geometry=centroids_8857, crs="EPSG:8857")
    centroids_4326 = centroids_gdf_8857.to_crs("EPSG:4326")

    # Assign geometries back to the processed dataframe
    gdf_processed["centroid"] = centroids_4326.geometry

    # Create output GeoDataFrame with centroids
    centroids_gdf = gpd.GeoDataFrame(
        gdf_processed[
            [
                "NAME",
                "ISO_A3",
                "ISO_A2_EH",
                "ISO_N3",
                "CONTINENT",
            ]
        ],
        geometry=gdf_processed["centroid"],
        crs=gdf.crs,
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
