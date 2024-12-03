import geopandas as gpd
import pandas as pd

N_STATIONS = 8

def load_radio():
    df = pd.read_csv("crawl/out/output.csv")
    print(f"\nLoaded {len(df):,} rows from 'output.csv'")

    # Filter to only include countries with at least 3 stations
    s = df.groupby("country").size() >= N_STATIONS
    df = df[df["country"].isin(s[s].index)]
    print(f"> Filtered to countries with >= {N_STATIONS} stations - {len(df):,} rows")

    radio = df.groupby("country").sample(N_STATIONS)
    print(f"> Sampled {N_STATIONS} stations from each country - {len(radio):,} rows")

    return radio


def match_up(radio):
    ne = gpd.read_file("./data/ne_110m_admin_0_countries.geojson")
    datamaps = pd.read_json("./data/datamaps.json")
    centers = gpd.read_file("./data/centers.geojson")

    # merge radio with natural earth
    print("\nmerge radio with natural earth")
    df = pd.merge(
        radio, ne, left_on="country", right_on="SUBUNIT", suffixes=("_radio", "_ne")
    )
    lost_countries = radio[~radio["country"].isin(df["country"])]["country"].unique()
    print("> lost countries:", lost_countries)

    # ensure we can match ids with datamap
    print("\nfilter to align with datamaps dataset")
    df2 = df[df["ADM0_A3"].isin(datamaps["id"])]
    lost_countries = df[~df["country"].isin(df2["country"])]["country"].unique()
    print("> lost countries:", lost_countries)

    # filter to centers
    print("\nfilter to align with centers dataset")
    df3 = df2[df2["ISO_A2_EH"].isin(centers["ISO"])]
    lost_countries = df2[~df2["country"].isin(df3["country"])]["country"].unique()
    print("> lost countries:", lost_countries)

    return df3


if __name__ == "__main__":
    radio = load_radio()
    out = match_up(radio)

    use_cols = list(radio.columns) + ["ADM0_A3", "ISO_A2_EH"]
    out = out[use_cols]
    out = out.rename(
        {
            "ADM0_A3": "three_code",
            "ISO_A2_EH": "two_code",
        },
        axis=1,
    )

    print("final shape:", out.shape)
    out.to_json("out/radio.json", orient="records")
