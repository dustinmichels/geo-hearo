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
from bs4 import BeautifulSoup
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


def clean_cell_content(cell):
    """
    Parses a BeautifulSoup table cell to extract languages.
    If the cell contains a list (ul/li), it joins them with commas.
    Otherwise, it falls back to standard text cleaning.
    """
    if cell is None:
        return ""

    # Check for list items first (Wikipedia usually uses <ul><li> for multiple languages)
    list_items = cell.find_all("li")
    if list_items:
        languages = []
        for li in list_items:
            # Clean individual list item text
            text = li.get_text(strip=True)
            text = clean_string(text)
            if text:
                languages.append(text)
        return ", ".join(languages)

    # Fallback: handle plain text or <br> separated lines
    # We replace <br> with a unique separator to split correctly later
    for br in cell.find_all("br"):
        br.replace_with("\n")

    return clean_string(cell.get_text())


def clean_string(text):
    """
    Removes Wikipedia footnotes/citations and parenthetical details from a string.
    """
    if not text:
        return ""

    # 1. Remove Wikipedia footnotes/citations like [1], [a], [10][b]
    text = re.sub(r"\[[^\]]+\]", "", text)

    # 2. Remove content in parentheses (e.g., specific regions or notes)
    text = re.sub(r"\([^)]*\)", "", text)

    # 3. Clean up whitespace and handle newline separation
    # Split by common separators if not already comma-separated
    parts = [p.strip() for p in re.split(r"[\n\r,]+", text) if p.strip()]

    # Filter out empty or purely symbolic parts
    return ", ".join(parts)


def main():
    # 1. Scrape Wikipedia Data
    console.print(f"[bold blue]Scraping Wikipedia article:[/bold blue] {WIKI_URL}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    try:
        response = requests.get(WIKI_URL, headers=headers)
        response.raise_for_status()

        soup = BeautifulSoup(response.text, "html.parser")

        # Find the main table (usually the one with 'wikitable' class)
        table = soup.find("table", {"class": "wikitable"})
        if not table:
            console.print(
                "[red]Error: Could not find the languages table on the page.[/red]"
            )
            return

        # Identify column indices
        headers_row = table.find("tr")
        header_cols = [
            th.get_text(strip=True).lower() for th in headers_row.find_all(["th", "td"])
        ]

        idx_map = {"country": -1, "official": -1, "regional": -1, "minority": -1}

        for i, h in enumerate(header_cols):
            if "country" in h:
                idx_map["country"] = i
            elif "official" in h:
                idx_map["official"] = i
            elif "regional" in h:
                idx_map["regional"] = i
            elif "minority" in h:
                idx_map["minority"] = i

        wiki_data = []
        # Skip header row
        rows = table.find_all("tr")[1:]

        for row in rows:
            tds = row.find_all(["td", "th"])
            if len(tds) < max(idx_map.values()):
                continue

            # Use the specialized clean_cell_content function for each column
            country_raw = (
                tds[idx_map["country"]].get_text(strip=True)
                if idx_map["country"] != -1
                else ""
            )

            entry = {
                "country_raw": country_raw,
                "country_clean": clean_string(country_raw),
                "official_languages": clean_cell_content(tds[idx_map["official"]])
                if idx_map["official"] != -1
                else "",
                "regional_languages": clean_cell_content(tds[idx_map["regional"]])
                if idx_map["regional"] != -1
                else "",
                "minority_languages": clean_cell_content(tds[idx_map["minority"]])
                if idx_map["minority"] != -1
                else "",
            }
            wiki_data.append(entry)

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

    for row in wiki_data:
        lookup_key = row["country_clean"].lower()

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
