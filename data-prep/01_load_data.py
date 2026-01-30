import geopandas as gpd
import os

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

    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for scale, url in URLS.items():
        print(f"Loading {scale} data from {url}...")
        try:
            # Load directly from URL using geopandas
            # This handles downloading and unzipping in memory/tmp
            gdf = gpd.read_file(url)

            # Construct output filename
            filename = f"ne_{scale}_admin_0_countries.geojson"
            output_path = os.path.join(output_dir, filename)

            print(f"Saving to {output_path}...")
            gdf.to_file(output_path, driver="GeoJSON")
            print("Done.")

        except Exception as e:
            print(f"Error processing {scale} ({url}): {e}")


if __name__ == "__main__":
    main()
