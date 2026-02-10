# Geo Hearo

[![Netlify Status](https://api.netlify.com/api/v1/badges/3ab5d931-9245-4a8b-bacc-b0c75dce967f/deploy-status)](https://app.netlify.com/projects/geohearo/deploys)

[![Plausible Analytics](https://img.shields.io/badge/Analytics-Plausible-5850EC?style=flat&logo=simpleanalytics&logoColor=white)](https://plausible.io/geohearo.com)

> GeoHearo is the geo-guessing game where you win with your ears.
>
> 1. Stream five live, random radio stations from a mystery country
> 1. Make a guess, get a hint, repeat
> 1. Tomorrow will bring a new daily challenge
>
> Do you have what it takes to be... the Geo Hearo? :superhero:

Try online at [geohearo.com](http://geohearo.com/).

<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://geohearo.com/" alt="QR code">

## Dev

- **Data-prep** - Scrape radio.garden API for radio stations and prepare data for frontend.
- **Frontend** - Vue app that plays radio stations and asks user to guess the location of the station.

## Thanks

This is inspired by other geo guessing games:

- [GeoGuessr](https://www.geoguessr.com/)
- [Worldle](https://worldle.teuteuf.fr/)
