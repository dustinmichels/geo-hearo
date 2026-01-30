"""
USAGE:
    uv run 01_load_data.py
"""

import geopandas as gpd
import os
from rich.console import Console

import shutil

# URLs for Natural Earth Data - Admin 0 - Map Subunits
# Using map subunits instead of countries for better handling of territories
# URLs for Natural Earth Data
URLS = {
    # large scale
    "10m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson",
    # medium scale
    "50m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson",
    # small scale
    "110m": "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson",
}

OUTPUT_DIR = "data/ne"


def main():
    # Setup paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, OUTPUT_DIR)

    console = Console()

    console.print("\n[bold blue]🌍 Loading Natural Earth dataset...[/bold blue]")

    # Remove output directory if it exists
    console.print(f"[dim]🗑️  Cleaning output directory: {OUTPUT_DIR}[/dim]")
    if os.path.exists(output_dir):
        shutil.rmtree(output_dir)
    os.makedirs(output_dir)

    for scale, url in URLS.items():
        console.print(f"\n[bold cyan]⬇️  Processing {scale} scale[/bold cyan]")
        try:
            # Load directly from URL using geopandas
            # This handles downloading and unzipping in memory/tmp
            with console.status(f"[dim]Downloading from {url}...[/dim]"):
                gdf = gpd.read_file(url)

            # Construct output filename
            filename = f"ne_{scale}_admin_0_countries.geojson"
            output_path = os.path.join(output_dir, filename)

            console.print(f"  [green]💾 Saving to {filename}...[/green]")
            gdf.to_file(output_path, driver="GeoJSON")
            console.print("  [bold green]✅ Done[/bold green]")

        except Exception as e:
            console.print(f"  [bold red]❌ Error processing {scale}: {e}[/bold red]")


if __name__ == "__main__":
    main()
