"""
USAGE:
    uv run scripts/country_details/scrape.py
"""

import io
import json
import os
import re

import geopandas as gpd
import pandas as pd
import requests
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NE_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/country_details.json"
WIKI_URL = (
    "https://en.wikipedia.org/wiki/List_of_official_languages_by_country_and_territory"
)


def clean_text(text):
    """
    Removes Wikipedia footnotes/citations like [1], [a], [10][b], etc.
    Also strips leading/trailing whitespace and handles nulls.
    """
    if pd.isna(text) or text is None:
        return ""

    # Regex explanation:
    # \[      : Matches literal opening bracket
    # [^\]]+  : Matches one or more characters that are NOT a closing bracket
    # \]      : Matches literal closing bracket
    cleaned = re.sub(r"\[[^\]]+\]", "", str(text))
    return cleaned.strip()


def main():
    # 1. Scrape Wikipedia Data
    console.print(f"[bold blue]Scraping Wikipedia article:[/bold blue] {WIKI_URL}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(WIKI_URL, headers=headers)
        response.raise_for_status()

        # Use io.StringIO to avoid the BeautifulSoup/Pandas FutureWarning
        html_data = io.StringIO(response.text)
        tables = pd.read_html(html_data)

        df = None
        for t in tables:
            cols_str = " ".join([str(c) for c in t.columns])
            if "Official language" in cols_str:
                df = t
                break

        if df is None:
            console.print(
                "[red]Error: Could not find the languages table on the page.[/red]"
            )
            return

        col_mapping = {
            "Country/Region": "country",
            "Official language(s)": "official_languages",
            "Regional language(s)": "regional_languages",
            "Minority language(s)": "minority_languages",
        }

        final_cols = {}
        for c in df.columns:
            column_name = str(c)
            for key, val in col_mapping.items():
                if key.lower() in column_name.lower():
                    final_cols[c] = val

        df = df.rename(columns=final_cols)

        target_cols = [
            "country",
            "official_languages",
            "regional_languages",
            "minority_languages",
        ]
        existing_target_cols = [c for c in target_cols if c in df.columns]
        df = df[existing_target_cols]

    except Exception as e:
        console.print(f"[red]Failed to scrape Wikipedia:[/red] {e}")
        return

    # 2. Load Natural Earth Data
    if not os.path.exists(NE_INPUT):
        console.print(f"[red]Error: Natural Earth file not found at {NE_INPUT}[/red]")
        return

    console.print(f"[bold blue]Loading Natural Earth data...[/bold blue]")
    ne = gpd.read_file(NE_INPUT)

    # 3. Matching Logic
    name_cols = [col for col in ne.columns if "NAME" in col.upper()]
    lookup = {}

    def populate_lookup(column_name):
        if column_name not in ne.columns:
            return
        for idx, val in ne[column_name].items():
            if pd.isna(val) or val is None:
                continue
            key = str(val).strip().lower()
            if key not in lookup:
                lookup[key] = idx

    populate_lookup("ADMIN")
    for col in name_cols:
        populate_lookup(col)

    # 4. Perform Matching
    matched_data = []
    unmatched_countries = []

    for _, row in df.iterrows():
        raw_wiki_country = str(row["country"]).strip()

        # Clean country name for lookup (e.g., "Argentina[a]" -> "Argentina")
        clean_name_search = clean_text(raw_wiki_country)
        lookup_key = clean_name_search.lower()

        if lookup_key in lookup:
            ne_idx = lookup[lookup_key]
            ne_row = ne.iloc[ne_idx]

            # Use ADMIN name from Natural Earth for consistency
            ne_admin_name = str(ne_row.get("ADMIN", clean_name_search))
            iso_code = ne_row.get("ISO_A3", "N/A")

            # Apply clean_text to all language fields
            entry = {
                "country": ne_admin_name,
                "iso_a3": iso_code,
                "official_languages": clean_text(row.get("official_languages")),
                "regional_languages": clean_text(row.get("regional_languages")),
                "minority_languages": clean_text(row.get("minority_languages")),
            }
            matched_data.append(entry)
        else:
            unmatched_countries.append(raw_wiki_country)

    # 5. Reporting
    if unmatched_countries:
        console.print(
            f"\n[bold yellow]{len(unmatched_countries)} Wikipedia entries could not be matched:[/bold yellow]"
        )
        table = Table(show_header=True, header_style="bold magenta")
        table.add_column("Dropped Country")
        for c in unmatched_countries[:10]:
            table.add_row(c)
        if len(unmatched_countries) > 10:
            table.add_row(f"... and {len(unmatched_countries) - 10} more")
        console.print(table)

    console.print(
        f"\n[green]Successfully matched {len(matched_data)} countries.[/green]"
    )

    # 6. Save to JSON
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(matched_data, f, ensure_ascii=False, indent=2)

    console.print(f"[bold green]Data saved to {OUTPUT}[/bold green]")


if __name__ == "__main__":
    main()
