# Atlas World Quiz

A responsive country-identification quiz built with React, TypeScript, Vite, and D3. Country borders are provided by Natural Earth at 1:50m resolution.

Quiz clues include country name, flag, capital, and a single-country outline. In Outline mode, choose the country from the on-screen options.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`. The deployed GitHub Pages site is configured to publish from the `main` branch through `.github/workflows/pages.yml`.

Map data source: [Natural Earth](https://www.naturalearthdata.com/), distributed through the [Natural Earth Vector repository](https://github.com/nvkelso/natural-earth-vector).

Capital clues are loaded at runtime from the [mledoze/countries dataset](https://github.com/mledoze/countries); flag images use [FlagCDN](https://flagcdn.com/). The country-name quiz remains available if the metadata source is unavailable.