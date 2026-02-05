# Geo Hearo

> GeoHearo is the geo-guessing game where you win with your ears.
>
> 1. Stream live radio station from a mystery country (you get 5 stations)
> 1. Pay attention to what you hear
> 1. Make a guess, get a hint, repeat
>
> Do you have what it takes to be... the Geo Hearo? :superhero:

Try online at [geohearo.com](http://geohearo.com/).

<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://geohearo.com/" alt="QR code">

## Dev

Audio geo-guessing game

- **Data-prep** - Scrape radiogarden API for radio stations and format data for frontend.
- **Frontend** - Vue app that plays radio stations and asks user to guess the location of the station.

## Game Logic

### Distance Calculation

The distance between countries is calculated using the "Main Landmass" rule:

- Total land area for a country is calculated.
- Only polygons (landmasses) that constitute at least **20%** of the country's total area are used for measurement.
- Distance is measured from the nearest border point of any "Major Landmass" of the guess to the nearest border point of any "Major Landmass" of the secret country.
- This effectively excludes small overseas territories (e.g., measuring from French Guiana for "France") while preserving major islands (e.g., North and South Island of New Zealand). It also filters out Alaska (17% of US landmass.)

## Thanks

This is inspired by other geo guessing games:

- [GeoGuessr](https://www.geoguessr.com/)
- [Worldle](https://worldle.teuteuf.fr/)
