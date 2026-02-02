"""
Radio Station Country Matching Script

This script matches filtered radio stations to Natural Earth country records
using a name-based lookup, then filters out countries with too few stations.

METHODOLOGY:
- Builds a lowercase lookup map from Natural Earth ADMIN and NAME columns
- Matches radio station country names to Natural Earth indices
- Reports and drops unmatched stations
- Filters out countries with fewer than MIN_STATIONS stations
- Enriches radio data with selected Natural Earth metadata columns

INPUT:
- Filtered radio station JSON (data/out/all_radio_filtered.json)
- Natural Earth 110m countries GeoJSON (data/ne/ne_110m_admin_0_countries.geojson)

OUTPUT:
- JSON file with radio stations enriched with country metadata

USAGE:
    uv run scripts/04_match_radio.py
"""

import json

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "data/out/all_radio_filtered.json"
NE_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/all_radio_with_countries.json"

MIN_STATIONS = 5

SELECTED_NE_COLS = [
    "ADMIN",
    "ISO_A3",
    "ISO_A2_EH",
    "CONTINENT",
]


# ==============================================================================
# MAIN PROCESSING
# ==============================================================================


def main():
    # --------------------------------------------------------------------------
    # DATA LOADING
    # --------------------------------------------------------------------------
    console.print("\n[bold cyan]Loading datasets...[/bold cyan]")
    try:
        radio = pd.read_json(RADIO_INPUT)
        ne = gpd.read_file(NE_INPUT)
        # Drop geometry immediately to avoid index/reindexing overhead during processing
        if "geometry" in ne.columns:
            ne = ne.drop(columns=["geometry"])
    except Exception as e:
        console.print(f"[bold red]Error loading files: {e}[/bold red]")
        return

    # Print summary table
    table = Table(title="Dataset Summary")
    table.add_column("Dataset", style="cyan")
    table.add_column("Records", justify="right", style="green")
    table.add_row("Radio stations", f"{len(radio):,}")
    table.add_row("Countries (Radio Source)", f"{radio['country'].nunique():,}")
    table.add_row("Natural Earth Shapes", f"{len(ne):,}")
    console.print(table)

    # --------------------------------------------------------------------------
    # COUNTRY MATCHING
    # --------------------------------------------------------------------------
    console.print("\n[bold cyan]Building country name lookup map...[/bold cyan]")

    # Identify all name-related columns in order
    name_cols = [col for col in ne.columns if "NAME" in col.upper()]

    # We want a lookup map: { lowercase_name: ne_index }
    # Priorities: 1. ADMIN, 2. name_cols (in order)
    lookup = {}

    def populate_lookup(column_name):
        if column_name not in ne.columns:
            return
        for idx, val in ne[column_name].items():
            if pd.isna(val):
                continue
            key = str(val).strip().lower()
            if key not in lookup:
                lookup[key] = idx

    # Primary check: ADMIN
    populate_lookup("ADMIN")

    # Fallback checks: all NAME columns
    for col in name_cols:
        populate_lookup(col)

    console.print(f"Lookup table built with {len(lookup):,} unique name variations")

    # Map radio stations to NE indices
    radio["ne_idx"] = radio["country"].str.strip().str.lower().map(lookup)

    # Identify unmatched countries BEFORE filtering
    unmatched_mask = radio["ne_idx"].isna()
    unmatched_countries = radio.loc[unmatched_mask, "country"].value_counts()

    if len(unmatched_countries) > 0:
        console.print(
            f"\n[yellow]Warning: Found {len(unmatched_countries)} unmatched countries[/yellow]"
        )
        unmatch_table = Table(title="Unmatched Countries (will be dropped)")
        unmatch_table.add_column("Country", style="yellow")
        unmatch_table.add_column("Stations", justify="right", style="red")

        for country, count in unmatched_countries.items():
            unmatch_table.add_row(str(country), f"{count:,}")
        console.print(unmatch_table)

        total_dropped = unmatched_mask.sum()
        console.print(f"Dropping {total_dropped:,} stations from unmatched countries")

    # Drop unmatched stations
    radio = radio[~unmatched_mask].copy()

    # Merge with ALL NE columns (we'll filter later)
    radio_enriched = radio.merge(ne, left_on="ne_idx", right_index=True, how="left")

    matched_count = len(radio_enriched)
    console.print(f"Matched {matched_count:,} stations")

    # --------------------------------------------------------------------------
    # FILTERING BY MIN STATIONS
    # --------------------------------------------------------------------------
    console.print(
        f"\n[bold cyan]Filtering countries with < {MIN_STATIONS} stations...[/bold cyan]"
    )

    # Identify unique ID for countries
    country_id_col = "ISO_A2_EH"

    if country_id_col in radio_enriched.columns:
        # Count stations per country (ignoring NaNs)
        counts = radio_enriched[country_id_col].value_counts()
        valid_countries = counts[counts >= MIN_STATIONS].index

        # Identify countries being filtered out
        small_countries = counts[counts < MIN_STATIONS]
        if len(small_countries) > 0:
            console.print(
                f"\n[yellow]Warning: Found {len(small_countries)} countries with < {MIN_STATIONS} stations[/yellow]"
            )
            small_table = Table(
                title=f"Countries with < {MIN_STATIONS} stations (will be dropped)",
            )
            small_table.add_column("Country Code", style="cyan")
            small_table.add_column("Stations", justify="right", style="yellow")

            for iso_code, count in small_countries.items():
                # Try to get the country name
                country_name = radio_enriched[
                    radio_enriched[country_id_col] == iso_code
                ]["NAME"].iloc[0]
                small_table.add_row(f"{country_name} ({iso_code})", f"{count:,}")
            console.print(small_table)

        initial_count = len(radio_enriched)
        # Filter: only keep countries with enough stations
        radio_final = radio_enriched[
            radio_enriched[country_id_col].isin(valid_countries)
        ].copy()

        removed_count = initial_count - len(radio_final)
        console.print(
            f"Kept {len(radio_final):,} stations across {len(valid_countries)} countries"
        )
        console.print(f"Dropped {removed_count:,} stations (small country sets)")
    else:
        console.print(
            f"[bold red]Cannot filter: {country_id_col} column missing.[/bold red]"
        )
        radio_final = radio_enriched

    # --------------------------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------------------------
    console.print("\n[bold cyan]Final Summary: Radio Stations by Country[/bold cyan]")

    # Clean up temporary columns used for joining
    cols_to_drop = ["match_key", "ne_idx"]
    radio_final = radio_final.drop(
        columns=[c for c in cols_to_drop if c in radio_final.columns]
    )

    required_cols = ["ISO_A2_EH", "NAME", "POP_EST"]
    if all(col in radio_final.columns for col in required_cols):
        summary_data = (
            radio_final.dropna(subset=["ISO_A2_EH"])
            .groupby(required_cols)
            .size()
            .reset_index(name="station_count")
            .sort_values("POP_EST", ascending=False)
        )

        summary_table = Table(
            title=f"Radio Stations by Population ({len(summary_data)} Countries)",
        )
        summary_table.add_column("Rank", justify="right", style="dim")
        summary_table.add_column("Country", style="cyan")
        summary_table.add_column("ISO", style="yellow")
        summary_table.add_column("Population", justify="right", style="blue")
        summary_table.add_column("Stations", justify="right", style="green")

        for rank, (_, row) in enumerate(summary_data.iterrows(), start=1):
            summary_table.add_row(
                str(rank),
                str(row["NAME"]),
                str(row["ISO_A2_EH"]),
                f"{row['POP_EST']:,.0f}",
                f"{row['station_count']:,}",
            )
        console.print(summary_table)

    # --------------------------------------------------------------------------
    # FILTER COLUMNS (Final step before output)
    # --------------------------------------------------------------------------
    console.print("\n[bold cyan]Filtering columns for output...[/bold cyan]")

    # Keep original radio columns + selected NE columns
    original_radio_cols = [col for col in radio.columns if col != "ne_idx"]
    final_columns = original_radio_cols + SELECTED_NE_COLS

    # Only keep columns that exist in radio_final
    final_columns = [col for col in final_columns if col in radio_final.columns]
    radio_final = radio_final[final_columns]

    console.print(f"Kept {len(final_columns)} columns in final output")

    # --------------------------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------------------------
    console.print(f"\n[bold cyan]Saving to {OUTPUT}...[/bold cyan]")

    # Ensure we don't have NaN in the final JSON output (converts to null)
    output_data = radio_final.where(pd.notnull(radio_final), None).to_dict(
        orient="records"
    )

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    console.print(
        f"[bold green]Successfully saved {len(radio_final):,} records to {OUTPUT}[/bold green]"
    )


if __name__ == "__main__":
    main()
