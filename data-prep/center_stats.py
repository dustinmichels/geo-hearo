"""
Compute distances between all country centroids.

This script reads the centers.geojson file and computes the distance
from every centroid to every other centroid using geodesic distances.
"""

from pprint import pprint

import geopandas as gpd
from shapely.geometry import Point


def compute_directional_extents(geojson_path):
    """
    Compute directional extents between all centroids in the GeoJSON file.

    For each pair of centroids, calculates how far in kilometers you need to travel
    in each cardinal direction (N, E, S, W) to get from point 1 to point 2.

    Args:
        geojson_path: Path to the centers.geojson file

    Returns:
        Dictionary with directional statistics and pair details
    """
    from pyproj import Geod

    # Read the GeoJSON file
    gdf = gpd.read_file(geojson_path)

    # Convert to WGS84 for lat/lon coordinates
    gdf_wgs84 = gdf.to_crs(epsg=4326)

    # Initialize geoid for geodesic calculations
    geod = Geod(ellps="WGS84")

    # Lists to store all directional distances (in km)
    north_distances = []
    south_distances = []
    east_distances = []
    west_distances = []
    pair_details = {}

    # Compute directional distances between all pairs of centroids
    for i, row_i in gdf_wgs84.iterrows():
        country_i = row_i["COUNTRY"]
        geom_i = row_i.geometry
        lat_i, lon_i = geom_i.y, geom_i.x

        for j, row_j in gdf_wgs84.iterrows():
            if i >= j:  # Skip self and duplicate pairs
                continue

            country_j = row_j["COUNTRY"]
            geom_j = row_j.geometry
            lat_j, lon_j = geom_j.y, geom_j.x

            # Calculate the bearing and distance
            fwd_azimuth, _, total_distance = geod.inv(lon_i, lat_i, lon_j, lat_j)

            # Convert to km
            total_distance_km = total_distance / 1000

            # Calculate N/S component (latitude difference in km)
            # Distance along a meridian for the latitude change
            _, _, ns_distance = geod.inv(lon_i, lat_i, lon_i, lat_j)
            ns_distance_km = ns_distance / 1000
            if lat_j > lat_i:
                # Going north
                north_km = ns_distance_km
                south_km = 0
                north_distances.append(north_km)
            elif lat_j < lat_i:
                # Going south
                north_km = 0
                south_km = ns_distance_km
                south_distances.append(south_km)
            else:
                north_km = 0
                south_km = 0

            # Calculate E/W component (longitude difference in km)
            # Distance along a parallel for the longitude change
            _, _, ew_distance = geod.inv(lon_i, lat_i, lon_j, lat_i)
            ew_distance_km = ew_distance / 1000
            if lon_j > lon_i:
                # Going east
                east_km = ew_distance_km
                west_km = 0
                east_distances.append(east_km)
            elif lon_j < lon_i:
                # Going west
                east_km = 0
                west_km = ew_distance_km
                west_distances.append(west_km)
            else:
                east_km = 0
                west_km = 0

            # Store pair details
            pair_key = f"{country_i} ({lat_i:.2f}, {lon_i:.2f}) -> {country_j} ({lat_j:.2f}, {lon_j:.2f})"
            pair_details[pair_key] = {
                "north_km": round(north_km, 2),
                "south_km": round(south_km, 2),
                "east_km": round(east_km, 2),
                "west_km": round(west_km, 2),
                "total_distance_km": round(total_distance_km, 2),
                "bearing": round(fwd_azimuth, 2),
            }

    return {
        "north_distances": north_distances,
        "south_distances": south_distances,
        "east_distances": east_distances,
        "west_distances": west_distances,
        "pair_details": pair_details,
    }


def main():
    geojson_path = "data/centers.geojson"

    print("Computing directional extents between all country centroids...")
    print("=" * 70)

    results = compute_directional_extents(geojson_path)

    north_distances = results["north_distances"]
    south_distances = results["south_distances"]
    east_distances = results["east_distances"]
    west_distances = results["west_distances"]
    pair_details = results["pair_details"]

    # Print all pair details
    print("\nAll Country Pairs:")
    print("=" * 70)
    pprint(pair_details, width=120)

    print("\n" + "=" * 70)
    print("Directional Extents (in kilometers):")
    print("=" * 70)
    print("\nNORTH (northward travel distances):")
    if north_distances:
        print(f"  Max: {max(north_distances):.2f} km")
        print(f"  Min: {min(north_distances):.2f} km")
        print(f"  Average: {sum(north_distances) / len(north_distances):.2f} km")
    else:
        print("  No northward travel needed")

    print("\nSOUTH (southward travel distances):")
    if south_distances:
        print(f"  Max: {max(south_distances):.2f} km")
        print(f"  Min: {min(south_distances):.2f} km")
        print(f"  Average: {sum(south_distances) / len(south_distances):.2f} km")
    else:
        print("  No southward travel needed")

    print("\nEAST (eastward travel distances):")
    if east_distances:
        print(f"  Max: {max(east_distances):.2f} km")
        print(f"  Min: {min(east_distances):.2f} km")
        print(f"  Average: {sum(east_distances) / len(east_distances):.2f} km")
    else:
        print("  No eastward travel needed")

    print("\nWEST (westward travel distances):")
    if west_distances:
        print(f"  Max: {max(west_distances):.2f} km")
        print(f"  Min: {min(west_distances):.2f} km")
        print(f"  Average: {sum(west_distances) / len(west_distances):.2f} km")
    else:
        print("  No westward travel needed")


if __name__ == "__main__":
    main()
