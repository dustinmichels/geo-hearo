"""
USAGE:
    export PEXELS_API_KEY="your_key_here"
    uv run scripts/country_details/02_get_pics.py
"""

import json
import os
import re
import shutil
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
IMAGE_DIR = "data/out/country-pics"  # Directory where images will be saved
PEXELS_SEARCH_URL = "https://api.pexels.com/v1/search"

# Set to None to process all countries, or an integer to test a small sample
SAMPLE_N = None


def slugify(text):
    """Convert country name to a safe filename."""
    return re.sub(r"\W+", "_", text.lower()).strip("_")


def download_image(url, save_path):
    """Downloads an image from a URL and saves it to the specified path."""
    try:
        response = requests.get(url, timeout=15, stream=True)
        response.raise_for_status()
        with open(save_path, "wb") as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        return True
    except Exception as e:
        console.print(f"\n[red]Error downloading {url}: {e}[/red]")
        return False


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

    # 2. Load the data
    if not os.path.exists(INPUT_JSON):
        console.print(
            f"[red]Error: Input file {INPUT_JSON} not found. Run the scraper first.[/red]"
        )
        return

    with open(INPUT_JSON, "r", encoding="utf-8") as f:
        countries = json.load(f)

    if SAMPLE_N is not None:
        console.print(
            f"[bold yellow]Sampling enabled: Processing first {SAMPLE_N} countries only.[/bold yellow]"
        )
        countries = countries[:SAMPLE_N]

    # 3. Setup output directories
    # Ensure the parent directory for the JSON exists
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)

    # Clean and recreate the image directory
    if os.path.exists(IMAGE_DIR):
        console.print(
            f"[yellow]Cleaning existing image directory: {IMAGE_DIR}[/yellow]"
        )
        shutil.rmtree(IMAGE_DIR)

    os.makedirs(IMAGE_DIR, exist_ok=True)

    headers = {"Authorization": api_key}
    updated_countries = []

    console.print(
        f"[bold blue]Starting Pexels metadata retrieval and image downloads for {len(countries)} countries...[/bold blue]"
    )

    # 4. Process countries
    with Progress() as progress:
        task = progress.add_task("[cyan]Processing countries...", total=len(countries))

        for entry in countries:
            country_name = entry.get("country")
            safe_name = slugify(country_name)
            filename = f"{safe_name}.jpg"
            local_save_path = os.path.join(IMAGE_DIR, filename)

            # This is the path we'll store in the JSON as requested
            json_image_path = f"country-pics/{filename}"

            try:
                # Search Pexels
                params = {
                    "query": f"{country_name} famous scenic landscape",
                    "per_page": 1,
                    "orientation": "landscape",
                }

                response = requests.get(
                    PEXELS_SEARCH_URL, headers=headers, params=params, timeout=10
                )

                if response.status_code == 429:
                    console.print("\n[yellow]Rate limit reached. Sleeping...[/yellow]")
                    time.sleep(30)
                    response = requests.get(
                        PEXELS_SEARCH_URL, headers=headers, params=params, timeout=10
                    )

                response.raise_for_status()
                data = response.json()

                if data.get("photos") and len(data["photos"]) > 0:
                    photo = data["photos"][0]
                    src = photo.get("src", {})
                    medium_url = src.get("medium")

                    # Download the image
                    if medium_url:
                        success = download_image(medium_url, local_save_path)
                        if success:
                            entry["local_image_path"] = json_image_path
                        else:
                            entry["local_image_path"] = None
                    else:
                        entry["local_image_path"] = None

                    # Store metadata
                    entry["pexels_data"] = {
                        "url": photo.get("url"),
                        "photographer": photo.get("photographer"),
                        "photographer_url": photo.get("photographer_url"),
                        "src": {
                            "large": src.get("large"),
                            "medium": medium_url,
                            "small": src.get("small"),
                        },
                        "alt": photo.get("alt"),
                    }
                else:
                    entry["pexels_data"] = None
                    entry["local_image_path"] = None
                    console.print(
                        f"\n[yellow]No image found for {country_name}[/yellow]"
                    )

            except Exception as e:
                console.print(
                    f"\n[red]Failed to fetch data for {country_name}: {e}[/red]"
                )
                entry["pexels_data"] = None
                entry["local_image_path"] = None

            updated_countries.append(entry)
            progress.update(task, advance=1)
            time.sleep(0.5)  # Reduced delay slightly but kept for safety

    # 5. Save updated JSON
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(updated_countries, f, ensure_ascii=False, indent=2)

    console.print(f"\n[bold green]Success![/bold green]")
    console.print(f"Images saved to: [white]{IMAGE_DIR}[/white]")
    console.print(f"Updated metadata saved to: [white]{OUTPUT_JSON}[/white]")


if __name__ == "__main__":
    main()
