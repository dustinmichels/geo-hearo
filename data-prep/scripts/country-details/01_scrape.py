"""
USAGE:
    uv run scrape_wpr_languages.py
"""

import json
import os
import re

import geopandas as gpd
import pandas as pd
import requests
from bs4 import BeautifulSoup
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NE_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/country_details.json"
WPR_URL = "https://worldpopulationreview.com/country-rankings/languages-by-country"


def clean_string(text):
    """
    Cleans strings by removing extra whitespace and common delimiters.
    """
    if not text:
        return ""

    # Remove extra whitespace and newlines
    text = text.strip().replace("\n", " ").replace("\r", "")
    # Remove multiple spaces
    text = re.sub(r"\s+", " ", text)

    return text


def main():
    # 1. Scrape World Population Review Data
    console.print(f"[bold blue]Scraping World Population Review:[/bold blue] {WPR_URL}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(WPR_URL, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # WPR usually uses a standard table inside a div with specific classes
        table = soup.find("table")
        if not table:
            console.print(
                "[red]Error: Could not find the data table on the page.[/red]"
            )
            return

        # Identify column indices
        thead = table.find("thead")
        if not thead:
            console.print("[red]Error: Table has no header (thead).[/red]")
            return

        header_cols = [th.get_text(strip=True).lower() for th in thead.find_all("th")]

        # WPR Column mapping
        idx_map = {"country": -1, "official": -1}

        for i, h in enumerate(header_cols):
            if "country" in h:
                idx_map["country"] = i
            elif "official" in h or "language" in h:
                idx_map["official"] = i

        if idx_map["country"] == -1 or idx_map["official"] == -1:
            console.print(
                f"[red]Error: Could not map columns. Found: {header_cols}[/red]"
            )
            return

        scraped_data = []
        # Find the tbody and iterate rows
        tbody = table.find("tbody")
        rows = tbody.find_all("tr") if tbody else table.find_all("tr")[1:]

        for row in rows:
            tds = row.find_all("td")
            if len(tds) <= max(idx_map.values()):
                continue

            country_raw = tds[idx_map["country"]].get_text(strip=True)
            official_raw = tds[idx_map["official"]].get_text(strip=True)

            entry = {
                "country_raw": country_raw,
                "country_clean": clean_string(country_raw),
                "official_languages": clean_string(official_raw),
                "regional_languages": "",  # WPR doesn't consistently provide these in this table
                "minority_languages": "",  # WPR doesn't consistently provide these in this table
            }
            scraped_data.append(entry)

    except Exception as e:
        console.print(f"[red]Failed to scrape WPR:[/red] {e}")
        return

    # 2. Load Natural Earth Data
    if not os.path.exists(NE_INPUT):
        console.print(
            f"[yellow]Warning: Natural Earth file not found at {NE_INPUT}. Skipping matching logic and saving raw data.[/yellow]"
        )
        # Save raw data if GeoJSON is missing
        os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
        with open(OUTPUT, "w", encoding="utf-8") as f:
            json.dump(scraped_data, f, ensure_ascii=False, indent=2)
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

    for row in scraped_data:
        lookup_key = row["country_clean"].lower()

        # Handle common naming mismatches
        manual_fixes = {
            "united states": "United States of America",
            "dr congo": "Democratic Republic of the Congo",
            "congo": "Republic of the Congo",
        }

        if lookup_key in manual_fixes:
            lookup_key = manual_fixes[lookup_key].lower()

        if lookup_key in lookup:
            ne_idx = lookup[lookup_key]
            ne_row = ne.iloc[ne_idx]

            ne_admin_name = str(ne_row.get("ADMIN", row["country_clean"]))
            iso_code = ne_row.get("ISO_A3", "N/A")

            entry = {
                "country": ne_admin_name,
                "iso_a3": iso_code,
                "official_languages": row["official_languages"],
                "regional_languages": row["regional_languages"],
                "minority_languages": row["minority_languages"],
            }
            matched_data.append(entry)
        else:
            unmatched_countries.append(row["country_raw"])

    # 5. Reporting
    if unmatched_countries:
        console.print(
            f"\n[bold yellow]{len(unmatched_countries)} WPR entries could not be matched:[/bold yellow]"
        )
        table_rep = Table(show_header=True, header_style="bold magenta")
        table_rep.add_column("Dropped Country")
        for c in unmatched_countries[:10]:
            table_rep.add_row(c)
        if len(unmatched_countries) > 10:
            table_rep.add_row(f"... and {len(unmatched_countries) - 10} more")
        console.print(table_rep)

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
