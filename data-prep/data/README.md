# Data

## About sources

### Natural Earth

- `ne_110m_admin_0_countries.geojson`

Natural Earth dataset. Downloaded from [nvkelso/natural-earth-vector](https://github.com/nvkelso/natural-earth-vector)

Also try:

```python
ne = gpd.read_file(
    "https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_0_countries.zip"
)

# alternative: use subunits to get territories too
ne_subunits = gpd.read_file(
    "https://naturalearth.s3.amazonaws.com/50m_cultural/ne_50m_admin_0_map_subunits.zip"
)
```

### Datamaps

- `datamaps.json`

This is the data source built into the datamaps javascript library. It can be obtained by running the following in the browser console:

```js
Datamap.prototype.worldTopo.objects.world.geometries;
```

### Centers

- `centers.geojson`

Downloaded from [centers.geojson](https://github.com/gavinr/world-countries-centroids/releases)

<https://cdn.jsdelivr.net/gh/gavinr/world-countries-centroids@v1/dist/countries.geojson>
