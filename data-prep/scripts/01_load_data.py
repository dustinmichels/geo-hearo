"""
Natural Earth Data Loading Script

This script downloads Natural Earth GeoJSON datasets at multiple scales
and saves them locally for use by downstream processing scripts.

INPUT:
- Natural Earth GeoJSON files fetched from GitHub (nvkelso/natural-earth-vector)

OUTPUT:
- GeoJSON files saved to data/ne/ at 10m, 50m, and 110m scales

USAGE:
    uv run scripts/01_load_data.py
"""

import os
import shutil

import geopandas as gpd
from rich.console import Console

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

# URLs for Natural Earth Data
URLS = {
    # large scale
    "10m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
    "10m_map_subunits": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_map_subunits.geojson",
    # medium scale
    "50m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    "50m_map_subunits": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_map_subunits.geojson",
    # small scale
    "110m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
}

OUTPUT_DIR = "data/ne"


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================


def main():
    console.print("\n[bold cyan]Loading Natural Earth datasets...[/bold cyan]")

    # Remove output directory if it exists
    console.print(f"Cleaning output directory: {OUTPUT_DIR}")
    if os.path.exists(OUTPUT_DIR):
        shutil.rmtree(OUTPUT_DIR)
    os.makedirs(OUTPUT_DIR)

    for scale, url in URLS.items():
        console.print(f"\n[bold cyan]Processing {scale} scale...[/bold cyan]")
        try:
            # Load directly from URL using geopandas
            with console.status(f"Downloading from {url}..."):
                gdf = gpd.read_file(url)

            # Construct output filename
            filename = f"ne_{scale}_admin_0_countries.geojson"
            output_path = os.path.join(OUTPUT_DIR, filename)

            console.print(f"Saving to {filename}...")
            gdf.to_file(output_path, driver="GeoJSON")
            console.print(f"[bold green]Done[/bold green]")

        except Exception as e:
            console.print(f"[bold red]Error processing {scale}: {e}[/bold red]")


if __name__ == "__main__":
    main()
