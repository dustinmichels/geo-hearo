"""
USAGE:
    uv run 03_process_radio.py
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
    "NAME",
    "GEOUNIT",
    "ISO_A3",
    "ISO_A2",
    "ISO_A2_EH",
    "ISO_N3",
    "POSTAL",
    "CONTINENT",
    "LEVEL",
    "POP_EST",
    "POP_RANK",
]

# ==============================================================================
# UTILS
# ==============================================================================


def print_header(text: str):
    console.print(f"\n[bold cyan] {text} [/bold cyan]".center(80, "━"))


# ==============================================================================
# MAIN
# ==============================================================================


def main():
    print_header("SCRIPT 2: PROCESS RADIO STATIONS")

    # --------------------------------------------------------------------------
    # DATA LOADING
    # --------------------------------------------------------------------------
    console.print("[bold yellow]Loading datasets...[/bold yellow]")
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
    table = Table(title="Dataset Summary", title_style="bold magenta")
    table.add_column("Dataset", style="cyan")
    table.add_column("Records", justify="right", style="green")
    table.add_row("Radio stations", f"{len(radio):,}")
    table.add_row("Countries (Radio Source)", f"{radio['country'].nunique():,}")
    table.add_row("Natural Earth Shapes", f"{len(ne):,}")
    console.print(table)

    # --------------------------------------------------------------------------
    # COUNTRY MATCHING (VECTORIZED)
    # --------------------------------------------------------------------------
    console.print("\n[bold yellow]Building country name lookup map...[/bold yellow]")

    # Identify relevant columns for matching
    name_cols = ["ADMIN"] + [col for col in ne.columns if col.startswith("NAME")]

    # Ensure selected metadata columns exist in the dataset
    available_ne_cols = [c for c in SELECTED_NE_COLS if c in ne.columns]

    lookup_list = []
    for col in name_cols:
        # We only want the unique mapping of this specific name column to the metadata
        # We select the columns explicitly and rename the 'key' column
        # Using .loc and ensuring we don't have duplicate names in the selection
        cols_to_select = list(set([col] + available_ne_cols))
        temp_df = ne[cols_to_select].copy()
        temp_df = temp_df.rename(columns={col: "match_key"})
        lookup_list.append(temp_df)

    # Combine all variants.
    # ignore_index=True handles the row index.
    # We ensure columns are unique across the list before concat.
    lookup_map = pd.concat(lookup_list, ignore_index=True)

    # Clean match keys
    lookup_map = lookup_map.dropna(subset=["match_key"])
    lookup_map["match_key"] = (
        lookup_map["match_key"].astype(str).str.strip().str.lower()
    )

    # Keep the first occurrence of each country name variant
    lookup_map = lookup_map.drop_duplicates(subset=["match_key"], keep="first")

    # Prepare radio data for merging
    radio["match_key"] = radio["country"].astype(str).str.strip().str.lower()

    # Perform a standard left merge.
    # This avoids the Reindexing error by matching on a clean, deduplicated map.
    radio_enriched = radio.merge(lookup_map, on="match_key", how="left")

    # Statistics
    unmatched_mask = radio_enriched["ADMIN"].isna()
    unmatched_names = radio.loc[unmatched_mask, "country"].unique()
    matched_count = len(radio_enriched) - unmatched_mask.sum()

    console.print(f"[bold green]✓ Matched {matched_count:,} stations[/bold green]")
    if len(unmatched_names) > 0:
        console.print(
            f"[bold yellow]⚠ Unmatched country strings ({len(unmatched_names)}):[/bold yellow]"
        )
        console.print(f"  {', '.join(sorted([str(x) for x in unmatched_names]))}")

    # --------------------------------------------------------------------------
    # FILTERING BY MIN STATIONS
    # --------------------------------------------------------------------------
    console.print(
        f"\n[bold yellow]Filtering countries with < {MIN_STATIONS} stations...[/bold yellow]"
    )

    # Identify unique ID for countries
    country_id_col = "ISO_A2_EH"

    if country_id_col in radio_enriched.columns:
        # Count stations per country (ignoring NaNs)
        counts = radio_enriched[country_id_col].value_counts()
        valid_countries = counts[counts >= MIN_STATIONS].index

        initial_count = len(radio_enriched)
        # Filter: only keep countries with enough stations
        radio_final = radio_enriched[
            radio_enriched[country_id_col].isin(valid_countries)
        ].copy()

        removed_count = initial_count - len(radio_final)
        console.print(
            f"[bold green]✓ Kept {len(radio_final):,} stations across {len(valid_countries)} countries[/bold green]"
        )
        console.print(
            f"[dim]Dropped {removed_count:,} stations (unmatched or small country sets)[/dim]"
        )
    else:
        console.print("[bold red]Cannot filter: ISO_A2_EH column missing.[/bold red]")
        radio_final = radio_enriched

    # --------------------------------------------------------------------------
    # FINAL SUMMARY
    # --------------------------------------------------------------------------
    print_header("FINAL SUMMARY: Radio Stations by Country")

    # Clean up temporary column used for joining
    if "match_key" in radio_final.columns:
        radio_final = radio_final.drop(columns=["match_key"])

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
            header_style="bold white on blue",
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
    # OUTPUT
    # --------------------------------------------------------------------------
    console.print(f"\n[bold yellow]Saving to {OUTPUT}...[/bold yellow]")

    # Ensure we don't have NaN in the final JSON output (converts to null)
    output_data = radio_final.to_dict(orient="records")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    console.print(
        f"[bold green]✓ Successfully saved {len(radio_final):,} records.[/bold green]"
    )
    print_header("SCRIPT COMPLETE")


if __name__ == "__main__":
    main()
