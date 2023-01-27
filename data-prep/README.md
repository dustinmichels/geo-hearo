# Data Prep

## Setup

Create conda env from file:

```bash
conda env create -f environment.yml
```

## Data Sources

### Radio Garden

- I use the API to get streaming URLs for the radio stations of different places.
- I generally have a place name (eg, "Pontal do Paraná PR") and a country name (eg, "Brazil").
- I also have the coordinates of the place.

```json
{
  "size": 1,
  "id": "S7H8SqEe",
  "geo": [-102.987625, 22.646875],
  "url": "/visit/jerez-de-garcia-salinas/S7H8SqEe",
  "boost": false,
  "title": "Jerez de García Salinas",
  "country": "Mexico"
}
```

### `datamaps.json`

- On the frontend, I have a datamaps map, where countries can be selected by their name or a three-letter code.

```json
{
  "type": "MultiPolygon",
  "properties": {
    "name": "Canada"
  },
  "id": "CAN",
  "arcs": [[[128]], [[160]]]
}
```

### `centers.json`

I have a dataset of the centerpoint of each country, `centers.json`, where countries have a name and two-letter "ISO".

```json
{
  "type": "Feature",
  "geometry": {
    "type": "Point",
    "coordinates": [-98.41680517868062, 57.550480044655636]
  },
  "properties": {
    "COUNTRY": "Canada",
    "ISO": "CA",
    "COUNTRYAFF": "Canada",
    "AFF_ISO": "CA"
  }
}
```

### `ne_50`

- One idea is to use the natural earth dataset as the underlying source of truth for matching countries. It has many two-letter and three-letter codes for each country.

```json
{
  "type": "Feature",
  "properties": {
    "SOVEREIGNT": "Canada",
    "SOV_A3": "CAN",
    "ADMIN": "Canada",
    "ADM0_A3": "CAN",
    "ISO_A2": "CA",
    "ADM0_ISO": "CAN",
    "ADM0_TLC": "CAN"
  }
}
```

## Dev Notes

### Git Config

So as to not include notebook out in git, and based on this [SO post](https://stackoverflow.com/a/58004619/7576819), I modified the `.git/config`.

```properties
[filter "strip-notebook-output"]
    clean = "jq '.cells[].outputs = [] | .cells[].execution_count = null | .'"
```

And created a `.gitattributes` files with the following content:

```properties
*.ipynb filter=strip-notebook-output
```
