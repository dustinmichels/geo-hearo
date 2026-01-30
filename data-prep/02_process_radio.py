"""
USAGE:
    uv run 02_process_radio.py
"""

import geopandas as gpd
import pandas as pd
from rich.console import Console
from rich.table import Table

console = Console()

# ==============================================================================
# CONFIGURATION
# ==============================================================================

RADIO_INPUT = "crawl/out/output.csv"
NE_INPUT = "data/ne_110m_admin_0_countries.geojson"
OUTPUT = "data/out/all_radio_with_countries.json"

MIN_STATIONS = 5


# ==============================================================================
# MAIN
# ==============================================================================

console.print(
    "[bold cyan]═════════════════════════════════════════════════════════════[/]",
    "\n[bold cyan]SCRIPT 2: PROCESS RADIO STATIONS[/]",
    "\n[bold cyan]═════════════════════════════════════════════════════════════[/]\n",
)

# ==============================================================================
# DATA LOADING
# ==============================================================================

console.print("\n[bold cyan]Loading data...[/bold cyan]\n")
radio = pd.read_csv(RADIO_INPUT)
ne = gpd.read_file(NE_INPUT)

# Print summary table
table = Table(title="Dataset Summary")
table.add_column("Dataset", style="cyan")
table.add_column("Records", justify="right", style="green")
table.add_row("Radio stations", f"{len(radio):,}")
table.add_row("Countries (Radio)", f"{radio['country'].nunique():,}")
table.add_row("Countries (Natural Earth)", f"{len(ne):,}")
console.print(table)


# ==============================================================================
# FILTERING: MIN STATIONS (FIRST PASS)
# ==============================================================================

console.print(
    f"\n[bold yellow]Filtering: Removing countries with < {MIN_STATIONS} stations[/bold yellow]"
)
before = len(radio)
before_countries = radio["country"].nunique()
countries_before = set(radio["country"].unique())

counts = radio["country"].value_counts()
valid_countries = counts[counts >= MIN_STATIONS].index
radio = radio[radio["country"].isin(valid_countries)]

after = len(radio)
after_countries = radio["country"].nunique()
countries_after = set(radio["country"].unique())
lost_countries = sorted(countries_before - countries_after)

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)
console.print(
    f"  Countries: [red]{before_countries}[/red] → [green]{after_countries}[/green] ([dim]removed {len(lost_countries)}[/dim])"
)
if lost_countries:
    console.print(
        f"  Lost countries: [yellow]{', '.join(str(x) for x in lost_countries)}[/yellow]"
    )


# ==============================================================================
# FILTERING: NULL CHANNEL URLS
# ==============================================================================

console.print(
    "\n[bold yellow]Filtering: Removing stations without 'resolved' URLs[/bold yellow]"
)
before = len(radio)
before_countries = radio["country"].nunique()
countries_before = set(radio["country"].unique())

radio = radio[radio["channel_resolved_url"].notnull()]

after = len(radio)
after_countries = radio["country"].nunique()
countries_after = set(radio["country"].unique())

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)

# Re-check minimum stations and show country impact
counts = radio["country"].value_counts()
valid_countries = counts[counts >= MIN_STATIONS].index
radio_final = radio[radio["country"].isin(valid_countries)]

after_recheck_countries = radio_final["country"].nunique()
lost_countries = sorted(countries_after - set(radio_final["country"].unique()))

console.print(
    f"  Countries: [red]{after_countries}[/red] → [green]{after_recheck_countries}[/green] ([dim]removed {after_countries - after_recheck_countries}[/dim])"
)
if lost_countries:
    console.print(f"  Lost countries: [yellow]{', '.join(lost_countries)}[/yellow]")

radio = radio_final


# ==============================================================================
# FILTERING: INSECURE CHANNELS
# ==============================================================================

console.print(
    "\n[bold yellow]Filtering: Removing stations with insecure channels[/bold yellow]"
)
before = len(radio)

radio = radio[radio["channel_secure"]]

after = len(radio)
after_countries = radio["country"].nunique()
countries_after = set(radio["country"].unique())

console.print(
    f"  Stations: [red]{before:,}[/red] → [green]{after:,}[/green] ([dim]removed {before - after:,}[/dim])"
)

# Re-check minimum stations
counts = radio["country"].value_counts()
valid_countries = counts[counts >= MIN_STATIONS].index
radio_final = radio[radio["country"].isin(valid_countries)]

after_recheck_countries = radio_final["country"].nunique()
lost_countries = sorted(countries_after - set(radio_final["country"].unique()))

console.print(
    f"  Countries: [red]{after_countries}[/red] → [green]{after_recheck_countries}[/green] ([dim]removed {after_countries - after_recheck_countries}[/dim])"
)
if lost_countries:
    console.print(f"  Lost countries: [yellow]{', '.join(lost_countries)}[/yellow]")

radio = radio_final
