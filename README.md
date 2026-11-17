# Atlas World Quiz

A responsive country-identification quiz built with React, TypeScript, Vite, and D3. Country borders are provided by Natural Earth at 1:50m resolution.

Quiz clues include country name, flag, capital, and a single-country outline. Outline mode offers eight country choices. The county quiz lets players choose any combination of England, Wales, Scotland, Northern Ireland, and Ireland, and optionally show county names on hover. UK current local-area boundaries are grouped to represent the supplied county names; historical and overlapping county boundaries are approximate. Irish county boundaries are based on Natural Earth. The county map supports zooming and panning. The 20 Questions mode runs 5 questions in each clue type against four randomly selected regions, with 5 minutes to complete the round. Matchup is a timed drag-and-drop puzzle: arrange ten countries' names, capitals, flags, outlines, and populations into matching rows. Restarting deals a fresh set of countries. Where am I? is a UK-only map quiz in which players identify one of 86 cities and major towns (each with a reported population of at least 100,000) from its geodesic distances to three other places. It includes a zoom-responsive distance scale and an option to highlight and label the three clue cities on the map. Planets & Moons is a 25-question multiple-choice quiz with an unlabelled, not-to-scale solar-system diagram and a short fact after each answer.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. The deployed GitHub Pages site is configured to publish from the `main` branch through `.github/workflows/pages.yml`.

Map data source: [Natural Earth](https://www.naturalearthdata.com/), distributed through the [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector).

Capital clues are loaded at runtime from the [mledoze/countries dataset](https://github.com/mledoze/countries); flag images use [FlagCDN](https://flagcdn.com/). The country-name quiz remains available if the metadata source is unavailable.

UK county and local-area boundaries are provided by [geoBoundaries](https://www.geoboundaries.org/) using data from the Office for National Statistics Open Geography Portal, under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/). Ireland county boundaries are from [Natural Earth Vector](https://github.com/nvkelso/natural-earth-vector).

The Where am I? place list is derived from the [GeoNames GB postal and populated-place database](https://download.geonames.org/export/dump/), which is licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). Population values are those reported in GeoNames and may not reflect the latest census.