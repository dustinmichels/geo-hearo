"""
USAGE:
    export PEXELS_API_KEY="your_key_here"
    uv run scripts/country_details/get_pics.py
"""

import json
import os
import time

import requests
from rich.console import Console
from rich.progress import Progress

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================
INPUT_JSON = "data/out/country_details.json"
OUTPUT_JSON = "data/out/country_details_with_pics.json"
PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"

# Set to None to process all countries, or an integer to test a small sample
SAMPLE_N = 5


def main():
    # 1. Check for API Key
    api_key = os.getenv("PEXELS_API_KEY")
    if not api_key:
        console.print(
            "[red bold]Error:[/red bold] PEXELS_API_KEY environment variable not found."
        )
        console.print(
            "Please run [italic]export PEXELS_API_KEY='your_api_key'[/italic] before executing."
        )
        return

    # 2. Load the data from part 1
    if not os.path.exists(INPUT_JSON):
        console.print(
            f"[red]Error: Input file {INPUT_JSON} not found. Run the scraper first.[/red]"
        )
        return

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        countries = json.load(f)

    # Apply sample if configured
    if SAMPLE_N is not None:
        console.print(
            f"[bold yellow]Sampling enabled: Processing first {SAMPLE_N} countries only.[/bold yellow]"
        )
        countries = countries[:SAMPLE_N]

    # 3. Setup output directory
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    headers = {"Authorization": api_key}
    updated_countries = []

    console.print(
        f"[bold blue]Starting Pexels metadata retrieval for {len(countries)} countries...[/bold blue]"
    )

    # 4. Process countries
    with Progress() as progress:
        task = progress.add_task(
            "[cyan]Fetching image metadata...", total=len(countries)
        )

        for entry in countries:
            country_name = entry.get("country")

            try:
                # Optimized search query: "{country} iconic"
                params = {
                    "query": f"{country_name} iconic",
                    "per_page": 1,
                    "orientation": "landscape",
                }

                response = requests.get(
                    PEXELS_SEARCH_URL, headers=headers, params=params, timeout=10
                )

                # Handle rate limiting
                if response.status_code == 429:
                    console.print(
                        "\n[yellow]Rate limit reached. Sleeping for 30 seconds...[/yellow]"
                    )
                    time.sleep(30)
                    response = requests.get(
                        PEXELS_SEARCH_URL, headers=headers, params=params, timeout=10
                    )

                response.raise_for_status()
                data = response.json()

                if data.get("photos") and len(data["photos"]) > 0:
                    photo = data["photos"][0]
                    src = photo.get("src", {})

                    # Store only the requested subset of Pexels data
                    entry["pexels_data"] = {
                        "url": photo.get("url"),
                        "photographer": photo.get("photographer"),
                        "photographer_url": photo.get("photographer_url"),
                        "src": {
                            "large": src.get("large"),
                            "medium": src.get("medium"),
                            "small": src.get("small"),
                        },
                        "alt": photo.get("alt"),
                    }
                else:
                    entry["pexels_data"] = None
                    console.print(
                        f"\n[yellow]No image found for {country_name}[/yellow]"
                    )

            except Exception as e:
                console.print(
                    f"\n[red]Failed to fetch data for {country_name}: {e}[/red]"
                )
                entry["pexels_data"] = None

            updated_countries.append(entry)
            progress.update(task, advance=1)

            # Small delay to respect API limits
            time.sleep(0.2)

    # 5. Save updated JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(updated_countries, f, ensure_ascii=False, indent=2)

    console.print(f"\n[bold green]Success![/bold green]")
    console.print(
        f"Updated metadata with limited Pexels fields: [white]{OUTPUT_JSON}[/white]"
    )


if __name__ == "__main__":
    main()
