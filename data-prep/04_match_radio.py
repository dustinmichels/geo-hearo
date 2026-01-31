"""
USAGE:
    uv run 04_match_radio.py
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

    # We want to match 'country' from radio to NE's ADMIN or NAME* columns.
    # To do this efficiently, we create a "long" mapping table: Name -> NE Index
    name_cols = ["ADMIN"] + [col for col in ne.columns if col.startswith("NAME")]

    lookup_list = []
    for col in name_cols:
        # Create a temp df with the name and the original index
        temp_df = ne[[col]].copy()
        temp_df.columns = ["match_key"]
        temp_df["ne_index"] = ne.index
        lookup_list.append(temp_df)

    # Combine all name variants, clean them, and drop duplicates (favoring first match)
    lookup_map = pd.concat(lookup_list).dropna(subset=["match_key"])

    # Added .str before .lower() to correctly access pandas string methods
    lookup_map["match_key"] = (
        lookup_map["match_key"].astype(str).str.strip().str.lower()
    )
    lookup_map = lookup_map.drop_duplicates(subset=["match_key"], keep="first")

    # Prepare radio data for merging
    radio["match_key"] = radio["country"].astype(str).str.strip().str.lower()

    # Perform the merge
    # 1. Match radio keys to NE indices
    matched_indices = radio[["match_key"]].merge(lookup_map, on="match_key", how="left")

    # 2. Join back to the actual NE data (excluding geometry for speed/JSON compatibility)
    available_ne_cols = [c for c in SELECTED_NE_COLS if c in ne.columns]
    ne_subset = ne[available_ne_cols].copy()

    # Join the metadata using the ne_index we found
    radio_enriched = radio.join(
        matched_indices["ne_index"].map(ne_subset.to_dict("index")).apply(pd.Series)
    )

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

    # Identify unique ID for countries (ISO_A2_EH is robust)
    country_id_col = "ISO_A2_EH"

    if country_id_col in radio_enriched.columns:
        # Count stations per country
        counts = radio_enriched[country_id_col].value_counts()
        valid_countries = counts[counts >= MIN_STATIONS].index

        initial_count = len(radio_enriched)
        # Filter: keep matched countries with enough stations OR keep unmatched rows (optional)
        # Here we filter the whole dataset to ensure quality
        radio_final = radio_enriched[
            radio_enriched[country_id_col].isin(valid_countries)
        ].copy()

        removed_count = initial_count - len(radio_final)
        console.print(
            f"[bold green]✓ Kept {len(radio_final):,} stations across {len(valid_countries)} countries[/bold green]"
        )
        console.print(
            f"[dim]Dropped {removed_count:,} stations from small country datasets[/dim]"
        )
    else:
        console.print("[bold red]Cannot filter: ISO_A2_EH column missing.[/bold red]")
        radio_final = radio_enriched

    # --------------------------------------------------------------------------
    # FINAL SUMMARY: STATIONS PER COUNTRY
    # --------------------------------------------------------------------------
    print_header("FINAL SUMMARY: Radio Stations by Country")

    # Clean up temporary columns
    if "match_key" in radio_final.columns:
        radio_final = radio_final.drop(columns=["match_key"])

    # Grouping logic
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
    else:
        console.print(
            "[bold red]Missing columns for summary table. Check NE data columns.[/bold red]"
        )

    # --------------------------------------------------------------------------
    # OUTPUT
    # --------------------------------------------------------------------------
    console.print(f"\n[bold yellow]Saving to {OUTPUT}...[/bold yellow]")

    # Convert to dictionary for JSON output
    output_data = radio_final.to_dict(orient="records")

    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output_data, f, indent=2, ensure_ascii=False)

    console.print(
        f"[bold green]✓ Successfully saved {len(radio_final):,} records.[/bold green]"
    )
    print_header("SCRIPT COMPLETE")


if __name__ == "__main__":
    main()
