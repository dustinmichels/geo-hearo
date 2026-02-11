"""
USAGE:
    uv run scrape_wpr_languages.py
"""

import json
import os
import re

import requests
from bs4 import BeautifulSoup

# Note: Keeping the console/table logic for your reporting preference
try:
    from rich.console import Console
    from rich.table import Table

    console = Console()
except ImportError:
    # Fallback if rich is not installed
    class MockConsole:
        print = print

    console = MockConsole()

# ==============================================================================
# CONFIGURATION
# ==============================================================================
NE_INPUT = "data/ne/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/country_details.json"
WPR_URL = "https://worldpopulationreview.com/country-rankings/languages-by-country"


def clean_string(text):
    if not text:
        return ""
    text = text.strip().replace("\n", " ").replace("\r", "")
    text = re.sub(r"\s+", " ", text)
    return text


def main():
    console.print(f"[bold blue]Scraping World Population Review:[/bold blue] {WPR_URL}")

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    scraped_data = []

    try:
        response = requests.get(WPR_URL, headers=headers)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        table = soup.find("table")
        if not table:
            console.print("[red]Error: Could not find the data table.[/red]")
            return

        # 1. Precise Column Mapping
        thead = table.find("thead")
        header_cols = [th.get_text(strip=True).lower() for th in thead.find_all("th")]

        # We need to map specifically based on the WPR headers
        idx_map = {"country": -1, "official": -1, "minority": -1, "other": -1}

        for i, h in enumerate(header_cols):
            if "country" in h:
                idx_map["country"] = i
            elif "official" in h or "national" in h:
                idx_map["official"] = i
            elif "minority" in h:
                idx_map["minority"] = i
            elif "other" in h or "widely spoken" in h:
                idx_map["other"] = i

        # 2. Iterate Rows
        tbody = table.find("tbody")
        rows = tbody.find_all("tr") if tbody else table.find_all("tr")[1:]

        for row in rows:
            tds = row.find_all("td")
            if len(tds) <= idx_map["country"]:
                continue

            # Extract Country Name (handling the <a> tag inside)
            country_td = tds[idx_map["country"]]
            country_link = country_td.find("a")
            country_raw = (
                country_link.get_text(strip=True)
                if country_link
                else country_td.get_text(strip=True)
            )

            # Extract Languages based on mapped indices
            official = (
                tds[idx_map["official"]].get_text(strip=True)
                if idx_map["official"] != -1
                else ""
            )
            minority = (
                tds[idx_map["minority"]].get_text(strip=True)
                if idx_map["minority"] != -1
                else ""
            )
            other = (
                tds[idx_map["other"]].get_text(strip=True)
                if idx_map["other"] != -1
                else ""
            )

            scraped_data.append(
                {
                    "country_raw": country_raw,
                    "country_clean": clean_string(country_raw),
                    "official_languages": clean_string(official),
                    "minority_languages": clean_string(minority),
                    "regional_languages": clean_string(other),
                }
            )

    except Exception as e:
        console.print(f"[red]Failed to scrape WPR:[/red] {e}")
        return

    # 3. Matching with Natural Earth (GeoPandas)
    # This section handles the ISO mapping. Note: France usually has ISO_A3 'FRA'.
    # If your GeoJSON shows '-99', it might be a property of that specific file version.
    try:
        import geopandas as gpd
        import pandas as pd

        if os.path.exists(NE_INPUT):
            console.print(f"[bold blue]Loading Natural Earth data...[/bold blue]")
            ne = gpd.read_file(NE_INPUT)

            # Build lookup
            lookup = {}
            for idx, row in ne.iterrows():
                # Add various name fields to lookup
                names = [
                    row.get("ADMIN"),
                    row.get("NAME"),
                    row.get("NAME_LONG"),
                    row.get("BRK_NAME"),
                ]
                for name in names:
                    if name:
                        lookup[str(name).strip().lower()] = idx

            matched_data = []
            for item in scraped_data:
                key = item["country_clean"].lower()

                # Manual fixes for common discrepancies
                manual_map = {
                    "united states": "united states of america",
                    "dr congo": "democratic republic of the congo",
                    "ivory coast": "côte d'ivoire",
                    "czechia": "czech republic",
                }
                if key in manual_map:
                    key = manual_map[key]

                if key in lookup:
                    ne_row = ne.iloc[lookup[key]]
                    # Use ISO_A3, but fallback to ADM0_A3 if ISO is -99
                    iso = str(ne_row.get("ISO_A3", "N/A"))
                    if iso == "-99":
                        iso = str(
                            ne_row.get("ADM0_A3", "FRA" if key == "france" else "N/A")
                        )

                    matched_data.append(
                        {
                            "country": ne_row.get("ADMIN", item["country_clean"]),
                            "iso_a3": iso,
                            "official_languages": item["official_languages"],
                            "minority_languages": item["minority_languages"],
                            "regional_languages": item["regional_languages"],
                        }
                    )

            final_output = matched_data
            console.print(f"[green]Matched {len(matched_data)} countries.[/green]")
        else:
            final_output = scraped_data
            console.print(
                "[yellow]Natural Earth file missing, saving raw scraped data.[/yellow]"
            )

    except ImportError:
        final_output = scraped_data
        console.print("[yellow]Geopandas not found, saving raw scraped data.[/yellow]")

    # 4. Save to JSON
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(final_output, f, ensure_ascii=False, indent=2)

    console.print(f"[bold green]Data saved to {OUTPUT}[/bold green]")


if __name__ == "__main__":
    main()
