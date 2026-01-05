import json

import geopandas as gpd
import pandas as pd
from rich import print

radio = pd.read_csv("crawl/out/output.csv")

ne = gpd.read_file("data/ne_110m_admin_0_countries.geojson")
# ne = gpd.read_file("data/ne_50m_admin_0_countries.geojson")


print("Loaded data: ")
print("radio:", len(radio))
print("ne:", len(ne))


# for channel stream, fill na with empty string
radio["channel_stream"] = radio["channel_stream"].fillna("")


# filter out from radio if channel_resolved_url is null
# print len before and after
print("\nFiltering radio data: removing rows with null channel_resolved_url")
print(f"len before: {len(radio):,}")
radio = radio[radio["channel_resolved_url"].notnull()]
print(f"len after: {len(radio):,}")

# filter out channel_secure": false
print("\nFiltering radio data: removing rows with channel_secure = false")
print(f"len before: {len(radio):,}")
radio = radio[radio["channel_secure"] == True]
print(f"len after: {len(radio):,}")

# make radio geo-spatial, using cols geo_lat, geo_lon
radio_gdf = gpd.GeoDataFrame(
    radio,
    geometry=gpd.points_from_xy(radio.geo_lon, radio.geo_lat),
    crs="EPSG:4326",
)

# spatial join with natural earth
print("\nPerforming spatial join with natural earth countries")
radio_ne = gpd.sjoin(radio_gdf, ne, how="inner", predicate="within")

# check which countries were lost
lost_countries = radio[~radio["country"].isin(radio_ne["country"])]["country"].unique()
print("\nLost countries:", lost_countries)


print(f"\nlen after spatial join: {len(radio_ne):,}")


# save all radio columns, and select ne columns
selected_ne_cols = ["ADMIN", "ISO_A3", "ISO_A2_EH", "CONTINENT"]
final_cols = radio.columns.tolist() + selected_ne_cols
radio_final = radio_ne[final_cols]


# save as json
with open("data/out/radio_with_countries.json", "w") as f:
    json.dump(radio_final.to_dict(orient="records"), f, indent=2)
print("Saved data/out/radio_with_countries.json")
