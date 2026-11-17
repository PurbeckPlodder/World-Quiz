import { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10, geoMercator, geoTransform, geoDistance } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { Crosshair, Globe2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

type CountryProperties = {
  ADMIN: string;
  CONTINENT: string;
  POP_EST?: number;
  ISO_A3_EH?: string;
  ISO_A3?: string;
  ADM0_A3?: string;
};

type Country = Feature<Geometry, CountryProperties>;
type UkPlace = {
  name: string;
  population: number;
  latitude: number;
  longitude: number;
  featureCode: string;
  geonameId: string;
};
type WhereAmIClue = { place: UkPlace; distanceMiles: number };
type WhereAmIPuzzle = { target: UkPlace; clues: WhereAmIClue[] };
type CountyRegion = 'England' | 'Wales' | 'Scotland' | 'Northern Ireland' | 'Ireland';
type CountyProperties = { shapeName: string; shapeID?: string; region?: CountyRegion };
type CountyFeature = Feature<Geometry, CountyProperties>;
type CountryMetadata = { cca2: string; cca3: string; capital?: string[] };
type QuestionMode = 'name' | 'flag' | 'capital' | 'outline';
type QuizMode = QuestionMode | 'twenty' | 'matchup' | 'counties' | 'whereami' | 'planets';
type PlanetQuizQuestion = { question: string; options: string[]; answer: string; fact: string };
type SolarSystemOrbit = { name: string; rx: number; ry: number; angle: number; radius: number; moons: number; rings?: boolean };
const twentyQuestionDurationSeconds = 5 * 60;
const matchupColumns = ['country', 'capital', 'flag', 'outline', 'population'] as const;
type MatchupColumn = typeof matchupColumns[number];
type MatchupTile = { id: string; country: Country; capital: string; flagCode: string; population: number };
type MatchupBoard = Record<MatchupColumn, string[]>;
type SessionQuestion = { mode: QuestionMode; continent: Continent; target: string };
type Continent = 'World' | 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica';

const continents: Continent[] = ['World', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];
const challengeContinents: Continent[] = ['Africa', 'Asia', 'Europe', 'South America', 'North America'];
const matchupColumnLabels: Record<MatchupColumn, string> = {
  country: 'COUNTRY',
  capital: 'CAPITAL',
  flag: 'FLAG',
  outline: 'OUTLINE',
  population: 'POPULATION',
};
const countriesUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';
const ukCitiesUrl = 'uk-cities.json';
const ukCountiesUrl = 'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/GBR/ADM2/geoBoundaries-GBR-ADM2_simplified.geojson';
const irelandCountiesUrl = 'ireland-counties.geojson';
const countyRegions: CountyRegion[] = ['England', 'Wales', 'Scotland', 'Northern Ireland', 'Ireland'];
const planetaryQuestions: PlanetQuizQuestion[] = [
  { question: 'Which planet is farthest from the Sun?', options: ['Neptune', 'Uranus', 'Saturn', 'Jupiter'], answer: 'Neptune', fact: 'Neptune orbits about 4.5 billion kilometres from the Sun on average.' },
  { question: 'Which planet is largest by diameter?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 'Jupiter', fact: 'Jupiter is so large that more than 1,300 Earths could fit inside it by volume.' },
  { question: 'Which is the smallest planet in our solar system?', options: ['Mercury', 'Mars', 'Venus', 'Earth'], answer: 'Mercury', fact: 'Mercury is only a little larger than Earth’s Moon.' },
  { question: 'Which planet has the hottest average surface?', options: ['Venus', 'Mercury', 'Mars', 'Jupiter'], answer: 'Venus', fact: 'Venus’s thick carbon-dioxide atmosphere traps heat in an intense greenhouse effect.' },
  { question: 'Which planet is nicknamed the Red Planet?', options: ['Mars', 'Mercury', 'Venus', 'Jupiter'], answer: 'Mars', fact: 'Iron minerals in Martian dust rust, giving the planet its familiar reddish colour.' },
  { question: 'Which planet is famous for its broad, bright ring system?', options: ['Saturn', 'Jupiter', 'Uranus', 'Neptune'], answer: 'Saturn', fact: 'Saturn’s rings are made mostly of countless pieces of water ice, from tiny grains to boulders.' },
  { question: 'Which planet rotates with its axis tipped almost onto its side?', options: ['Uranus', 'Neptune', 'Saturn', 'Jupiter'], answer: 'Uranus', fact: 'Uranus has an axial tilt of about 98 degrees, so it effectively rolls around the Sun.' },
  { question: 'On which planet is one rotation longer than one trip around the Sun?', options: ['Venus', 'Mercury', 'Mars', 'Jupiter'], answer: 'Venus', fact: 'Venus takes about 243 Earth days to rotate once, but only about 225 Earth days to orbit the Sun.' },
  { question: 'The Great Red Spot is a giant storm on which planet?', options: ['Jupiter', 'Neptune', 'Mars', 'Saturn'], answer: 'Jupiter', fact: 'The Great Red Spot is a long-lived storm system large enough to contain Earth.' },
  { question: 'Olympus Mons, the tallest known volcano in the solar system, is on which planet?', options: ['Mars', 'Venus', 'Mercury', 'Earth'], answer: 'Mars', fact: 'Olympus Mons rises about 22 kilometres above the surrounding Martian plains.' },
  { question: 'Which planet has a dense atmosphere made mostly of carbon dioxide?', options: ['Venus', 'Earth', 'Jupiter', 'Mercury'], answer: 'Venus', fact: 'Venus’s atmosphere is roughly 96% carbon dioxide, with clouds of sulfuric acid.' },
  { question: 'Which planet is closest to the Sun?', options: ['Mercury', 'Venus', 'Earth', 'Mars'], answer: 'Mercury', fact: 'Mercury completes one orbit in just 88 Earth days.' },
  { question: 'Which moon is the largest in the solar system?', options: ['Ganymede', 'Titan', 'Callisto', 'Earth’s Moon'], answer: 'Ganymede', fact: 'Jupiter’s moon Ganymede is larger than the planet Mercury.' },
  { question: 'Which moon has lakes and seas of liquid methane on its surface?', options: ['Titan', 'Enceladus', 'Rhea', 'Iapetus'], answer: 'Titan', fact: 'Titan is Saturn’s largest moon and the only moon known to have stable lakes and seas on its surface, made of hydrocarbons.' },
  { question: 'Europa, a moon with a likely ocean beneath its icy crust, orbits which planet?', options: ['Jupiter', 'Saturn', 'Uranus', 'Neptune'], answer: 'Jupiter', fact: 'Europa’s hidden ocean may contain more liquid water than all of Earth’s oceans combined.' },
  { question: 'Which Jupiter moon is covered in active volcanoes?', options: ['Io', 'Europa', 'Ganymede', 'Callisto'], answer: 'Io', fact: 'Io is the most volcanically active world known, powered by strong tidal forces from Jupiter.' },
  { question: 'Triton, which orbits Neptune backwards compared with Neptune’s rotation, is a moon of which planet?', options: ['Neptune', 'Uranus', 'Saturn', 'Jupiter'], answer: 'Neptune', fact: 'Triton’s unusual backwards orbit suggests Neptune may have captured it long ago.' },
  { question: 'Phobos, the larger and closer of Mars’s two moons, orbits which planet?', options: ['Mars', 'Earth', 'Jupiter', 'Neptune'], answer: 'Mars', fact: 'Phobos is slowly spiralling inward and may eventually break apart or collide with Mars.' },
  { question: 'Deimos, the smaller and more distant of Mars’s two moons, orbits which planet?', options: ['Mars', 'Earth', 'Saturn', 'Uranus'], answer: 'Mars', fact: 'Deimos is only about 12 kilometres across on average and has a heavily cratered surface.' },
  { question: 'What is the name of Earth’s natural moon?', options: ['The Moon', 'Europa', 'Titan', 'Phobos'], answer: 'The Moon', fact: 'The Moon is moving about 3.8 centimetres farther from Earth each year.' },
  { question: 'Which Saturn moon vents water-rich plumes into space from its south pole?', options: ['Enceladus', 'Titan', 'Rhea', 'Iapetus'], answer: 'Enceladus', fact: 'The plumes from Enceladus hint at a global ocean beneath its icy shell.' },
  { question: 'Which large moon of Jupiter has an ancient surface covered in impact craters?', options: ['Callisto', 'Io', 'Europa', 'Ganymede'], answer: 'Callisto', fact: 'Callisto’s old, heavily cratered crust preserves a record of impacts from the early solar system.' },
  { question: 'Which of these Uranian moons is known for dramatic cliffs and patchwork terrain?', options: ['Miranda', 'Ariel', 'Umbriel', 'Titania', 'Oberon'], answer: 'Miranda', fact: 'Miranda is one of Uranus’s five major moons and is only about 470 kilometres across.' },
  { question: 'Which dwarf planet has a large moon named Charon?', options: ['Pluto', 'Ceres', 'Eris', 'Haumea'], answer: 'Pluto', fact: 'Charon is so large relative to Pluto that the pair orbit a point in space between them.' },
  { question: 'Which planet has the shortest year, lasting just 88 Earth days?', options: ['Mercury', 'Venus', 'Earth', 'Mars'], answer: 'Mercury', fact: 'Mercury’s close orbit makes it the fastest planet to travel around the Sun.' },
];
const solarSystemOrbits: SolarSystemOrbit[] = [
  { name: 'Mercury', rx: 46, ry: 28, angle: -110, radius: 4, moons: 0 },
  { name: 'Venus', rx: 90, ry: 52, angle: -48, radius: 6, moons: 0 },
  { name: 'Earth', rx: 134, ry: 77, angle: -170, radius: 6, moons: 1 },
  { name: 'Mars', rx: 177, ry: 102, angle: -18, radius: 5, moons: 2 },
  { name: 'Jupiter', rx: 222, ry: 128, angle: 145, radius: 13, moons: 4 },
  { name: 'Saturn', rx: 269, ry: 155, angle: 73, radius: 11, moons: 5, rings: true },
  { name: 'Uranus', rx: 318, ry: 183, angle: 4, radius: 8, moons: 4 },
  { name: 'Neptune', rx: 368, ry: 210, angle: -36, radius: 8, moons: 3 },
];

function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
}

function geodesicDistanceMiles(first: UkPlace, second: UkPlace) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const latitudeDelta = radians(second.latitude - first.latitude);
  const longitudeDelta = radians(second.longitude - first.longitude);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(first.latitude)) * Math.cos(radians(second.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function roundedDistanceMiles(first: UkPlace, second: UkPlace) {
  return Math.round(geodesicDistanceMiles(first, second) * 10) / 10;
}

function createWhereAmIPuzzle(places: UkPlace[], previousTarget?: string): WhereAmIPuzzle | null {
  const targets = shuffle(places.filter((place) => place.name !== previousTarget));
  for (const target of targets) {
    const references = places.filter((place) => place.name !== target.name);
    for (let index = 0; index < 300; index += 1) {
      const clues = shuffle(references).slice(0, 3);
      if (clues.length < 3) break;
      const distances = clues.map((place) => roundedDistanceMiles(target, place));
      const matchingPlaces = places.filter((candidate) => (
        candidate.name === target.name
        || clues.every((place, clueIndex) => roundedDistanceMiles(candidate, place) === distances[clueIndex])
      ));
      if (matchingPlaces.length === 1) {
        return {
          target,
          clues: clues.map((place, clueIndex) => ({ place, distanceMiles: distances[clueIndex] })),
        };
      }
    }
  }
  return null;
}

function randomCountry(features: Country[], exclude?: string) {
  const choices = features.filter((feature) => feature.properties.ADMIN !== exclude);
  return choices[Math.floor(Math.random() * choices.length)] ?? features[0];
}

function outlineChoices(features: Country[], target: string) {
  const answer = features.find((country) => country.properties.ADMIN === target);
  if (!answer) return [];

  const choices = features.filter((country) => country.properties.ADMIN !== target);
  for (let index = choices.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [choices[index], choices[swapIndex]] = [choices[swapIndex], choices[index]];
  }

  return shuffle([answer, ...choices.slice(0, 7)]);
}

function metadataFor(country: Country, metadata: Map<string, CountryMetadata>) {
  const { ISO_A3_EH, ISO_A3, ADM0_A3 } = country.properties;
  const code = [ISO_A3_EH, ISO_A3, ADM0_A3].find((value) => value && value !== '-99');
  return code ? metadata.get(code) : undefined;
}

function buildTwentyQuestions(countries: Country[], metadata: Map<string, CountryMetadata>): SessionQuestion[] {
  const modes = shuffle<QuestionMode>(['name', 'flag', 'capital', 'outline']);
  const regions = shuffle(challengeContinents).slice(0, modes.length);
  const questions: SessionQuestion[] = [];

  modes.forEach((mode, blockIndex) => {
    const region = regions[blockIndex];
    const eligibleCountries = countries.filter((country) => {
      if (country.properties.CONTINENT !== region) return false;
      if (mode === 'name' || mode === 'outline') return true;
      const countryMetadata = metadataFor(country, metadata);
      return mode === 'flag' ? Boolean(countryMetadata?.cca2) : Boolean(countryMetadata?.capital?.[0]);
    });

    shuffle(eligibleCountries).slice(0, 5).forEach((country) => {
      questions.push({ mode, continent: region, target: country.properties.ADMIN });
    });
  });

  return questions.length === 20 ? questions : [];
}

function buildMatchupCountries(countries: Country[], metadata: Map<string, CountryMetadata>, excludedIds: string[] = []): MatchupTile[] {
  const excluded = new Set(excludedIds);
  const eligibleCountries = countries.flatMap((country) => {
    const countryMetadata = metadataFor(country, metadata);
    const capital = countryMetadata?.capital?.[0];
    const population = country.properties.POP_EST;
    if (!countryMetadata?.cca2 || !capital || typeof population !== 'number' || !Number.isFinite(population)) return [];
    return [{ id: country.properties.ADMIN, country, capital, flagCode: countryMetadata.cca2.toLowerCase(), population }];
  });
  const freshCountries = eligibleCountries.filter((country) => !excluded.has(country.id));
  return shuffle(freshCountries.length >= 10 ? freshCountries : eligibleCountries).slice(0, 10);
}

function createMatchupBoard(ids: string[]): MatchupBoard {
  return {
    country: shuffle(ids),
    capital: shuffle(ids),
    flag: shuffle(ids),
    outline: shuffle(ids),
    population: shuffle(ids),
  };
}

function countCorrectMatchupRows(board: MatchupBoard) {
  return board.country.reduce((count, id, index) => (
    id === board.capital[index] && id === board.flag[index] && id === board.outline[index] && id === board.population[index] ? count + 1 : count
  ), 0);
}

function formatElapsedTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function correctCountyWinding(feature: CountyFeature): CountyFeature {
  const { geometry } = feature;
  if (geometry.type === 'Polygon') {
    return {
      ...feature,
      geometry: { ...geometry, coordinates: geometry.coordinates.map((ring) => [...ring].reverse()) },
    };
  }
  if (geometry.type === 'MultiPolygon') {
    return {
      ...feature,
      geometry: {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) => polygon.map((ring) => [...ring].reverse())),
      },
    };
  }
  return feature;
}

const COUNTY_AREA_GROUPS: Record<string, string> = {
  Bedfordshire: 'Bedford|Central Bedfordshire|Luton',
  Berkshire: 'Bracknell Forest|Reading|Slough|West Berkshire|Windsor and Maidenhead|Wokingham',
  Bristol: 'Bristol, City of',
  Buckinghamshire: 'Buckinghamshire|Milton Keynes',
  Cambridgeshire: 'Cambridgeshire|Peterborough',
  Cheshire: 'Cheshire East|Cheshire West and Chester|Halton|Warrington',
  'City of London': 'City of London',
  Cornwall: 'Cornwall|Isles of Scilly',
  'County Durham': 'County Durham|Darlington|Hartlepool|Middlesbrough|Redcar and Cleveland|Stockton-on-Tees',
  Cumbria: 'Cumbria',
  Derbyshire: 'Derby|Derbyshire',
  Devon: 'Devon|Plymouth|Torbay',
  Dorset: 'Bournemouth, Christchurch and Poole|Dorset',
  'East Riding of Yorkshire': 'East Riding of Yorkshire|Kingston upon Hull, City of',
  'East Sussex': 'Brighton and Hove|East Sussex',
  Essex: 'Essex|Southend-on-Sea|Thurrock',
  Gloucestershire: 'Gloucestershire',
  'Greater London': 'Barking and Dagenham|Barnet|Bexley|Brent|Bromley|Camden|Croydon|Ealing|Enfield|Greenwich|Hackney|Hammersmith and Fulham|Haringey|Harrow|Havering|Hillingdon|Hounslow|Islington|Kensington and Chelsea|Kingston upon Thames|Lambeth|Lewisham|Merton|Newham|Redbridge|Richmond upon Thames|Southwark|Sutton|Tower Hamlets|Waltham Forest|Wandsworth|Westminster',
  'Greater Manchester': 'Bolton|Bury|Manchester|Oldham|Rochdale|Salford|Stockport|Tameside|Trafford|Wigan',
  Hampshire: 'Hampshire|Portsmouth|Southampton',
  Herefordshire: 'Herefordshire, County of',
  Hertfordshire: 'Hertfordshire',
  'Isle of Wight': 'Isle of Wight',
  Kent: 'Kent|Medway',
  Lancashire: 'Blackburn with Darwen|Blackpool|Lancashire',
  Leicestershire: 'Leicester|Leicestershire',
  Lincolnshire: 'Lincolnshire|North East Lincolnshire|North Lincolnshire',
  Merseyside: 'Knowsley|Liverpool|Sefton|St. Helens|Wirral',
  Norfolk: 'Norfolk',
  'North Somerset': 'North Somerset',
  'North Yorkshire': 'North Yorkshire|York',
  Northamptonshire: 'Northamptonshire',
  Northumberland: 'Northumberland',
  Nottinghamshire: 'Nottingham|Nottinghamshire',
  Oxfordshire: 'Oxfordshire',
  Rutland: 'Rutland',
  Shropshire: 'Shropshire|Telford and Wrekin',
  Somerset: 'Bath and North East Somerset|Somerset',
  'South Gloucestershire': 'South Gloucestershire',
  'South Yorkshire': 'Barnsley|Doncaster|Rotherham|Sheffield',
  Staffordshire: 'Staffordshire|Stoke-on-Trent',
  Suffolk: 'Suffolk',
  Surrey: 'Surrey',
  'Tyne & Wear': 'Gateshead|Newcastle upon Tyne|North Tyneside|South Tyneside|Sunderland',
  Warwickshire: 'Warwickshire',
  'West Midlands': 'Birmingham|Coventry|Dudley|Sandwell|Solihull|Walsall|Wolverhampton',
  'West Sussex': 'West Sussex',
  'West Yorkshire': 'Bradford|Calderdale|Kirklees|Leeds|Wakefield',
  Wiltshire: 'Swindon|Wiltshire',
  Worcestershire: 'Worcestershire',
  Aberdeenshire: 'Aberdeen City|Aberdeenshire',
  Angus: 'Angus|Dundee City',
  'Argyll & Bute': 'Argyll and Bute',
  Ayrshire: 'East Ayrshire|North Ayrshire|South Ayrshire',
  Banffshire: 'Aberdeenshire|Moray',
  Berwickshire: 'Scottish Borders',
  Caithness: 'Highland',
  Clackmannanshire: 'Clackmannanshire',
  'Dumfries & Galloway': 'Dumfries and Galloway',
  'East Ayrshire': 'East Ayrshire',
  'East Dunbartonshire': 'East Dunbartonshire',
  'East Lothian': 'East Lothian',
  'East Renfrewshire': 'East Renfrewshire',
  Fife: 'Fife',
  Highland: 'Highland',
  Inverclyde: 'Inverclyde',
  Kincardineshire: 'Aberdeenshire',
  Lanarkshire: 'Glasgow City|North Lanarkshire|South Lanarkshire',
  Midlothian: 'City of Edinburgh|Midlothian',
  Moray: 'Moray',
  'North Ayrshire': 'North Ayrshire',
  'North Lanarkshire': 'North Lanarkshire',
  Orkney: 'Orkney Islands',
  'Perth & Kinross': 'Perth and Kinross',
  Renfrewshire: 'Renfrewshire',
  'Scottish Borders': 'Scottish Borders',
  Shetland: 'Shetland Islands',
  'South Ayrshire': 'South Ayrshire',
  'South Lanarkshire': 'South Lanarkshire',
  Stirlingshire: 'Falkirk|Stirling',
  'West Dunbartonshire': 'West Dunbartonshire',
  'West Lothian': 'West Lothian',
  'Western Isles': 'Na h-Eileanan Siar',
  'Blaenau Gwent': 'Blaenau Gwent',
  Bridgend: 'Bridgend',
  Caerphilly: 'Caerphilly',
  Cardiff: 'Cardiff',
  Carmarthenshire: 'Carmarthenshire',
  Ceredigion: 'Ceredigion',
  Conwy: 'Conwy',
  Denbighshire: 'Denbighshire',
  Flintshire: 'Flintshire',
  Gwynedd: 'Gwynedd',
  'Isle of Anglesey': 'Isle of Anglesey',
  'Merthyr Tydfil': 'Merthyr Tydfil',
  Monmouthshire: 'Monmouthshire',
  'Neath Port Talbot': 'Neath Port Talbot',
  Newport: 'Newport',
  Pembrokeshire: 'Pembrokeshire',
  Powys: 'Powys',
  'Rhondda Cynon Taff': 'Rhondda Cynon Taf',
  Swansea: 'Swansea',
  Torfaen: 'Torfaen',
  'Vale of Glamorgan': 'Vale of Glamorgan',
  Wrexham: 'Wrexham',
  Antrim: 'Antrim and Newtownabbey|Belfast|Causeway Coast and Glens|Lisburn and Castlereagh|Mid and East Antrim',
  Armagh: 'Armagh City, Banbridge and Craigavon|Mid Ulster|Newry, Mourne and Down',
  'County Down': 'Ards and North Down|Belfast|Lisburn and Castlereagh|Newry, Mourne and Down',
  Fermanagh: 'Fermanagh and Omagh',
  Londonderry: 'Causeway Coast and Glens|Derry City and Strabane|Mid Ulster',
  Tyrone: 'Derry City and Strabane|Fermanagh and Omagh|Mid Ulster',
};

const COUNTY_TARGETS_BY_AREA = Object.entries(COUNTY_AREA_GROUPS).reduce<Record<string, string[]>>(
  (targetsByArea, [target, areaNames]) => {
    for (const areaName of areaNames.split('|')) {
      (targetsByArea[areaName] ??= []).push(target);
    }
    return targetsByArea;
  },
  {},
);

const COUNTY_TARGETS_BY_REGION: Record<CountyRegion, string[]> = {
  England: [
    'Bedfordshire', 'Berkshire', 'Bristol', 'Buckinghamshire', 'Cambridgeshire', 'Cheshire', 'City of London',
    'Cornwall', 'County Durham', 'Cumbria', 'Derbyshire', 'Devon', 'Dorset', 'East Riding of Yorkshire',
    'East Sussex', 'Essex', 'Gloucestershire', 'Greater London', 'Greater Manchester', 'Hampshire',
    'Herefordshire', 'Hertfordshire', 'Isle of Wight', 'Kent', 'Lancashire', 'Leicestershire', 'Lincolnshire',
    'Merseyside', 'Norfolk', 'North Somerset', 'North Yorkshire', 'Northamptonshire', 'Northumberland',
    'Nottinghamshire', 'Oxfordshire', 'Rutland', 'Shropshire', 'Somerset', 'South Gloucestershire',
    'South Yorkshire', 'Staffordshire', 'Suffolk', 'Surrey', 'Tyne & Wear', 'Warwickshire', 'West Midlands',
    'West Sussex', 'West Yorkshire', 'Wiltshire', 'Worcestershire',
  ],
  Wales: [
    'Blaenau Gwent', 'Bridgend', 'Caerphilly', 'Cardiff', 'Carmarthenshire', 'Ceredigion', 'Conwy',
    'Denbighshire', 'Flintshire', 'Gwynedd', 'Isle of Anglesey', 'Merthyr Tydfil', 'Monmouthshire',
    'Neath Port Talbot', 'Newport', 'Pembrokeshire', 'Powys', 'Rhondda Cynon Taff', 'Swansea', 'Torfaen',
    'Vale of Glamorgan', 'Wrexham',
  ],
  Scotland: [
    'Aberdeenshire', 'Angus', 'Argyll & Bute', 'Ayrshire', 'Banffshire', 'Berwickshire', 'Caithness',
    'Clackmannanshire', 'Dumfries & Galloway', 'East Ayrshire', 'East Dunbartonshire', 'East Lothian',
    'East Renfrewshire', 'Fife', 'Highland', 'Inverclyde', 'Kincardineshire', 'Lanarkshire', 'Midlothian',
    'Moray', 'North Ayrshire', 'North Lanarkshire', 'Orkney', 'Perth & Kinross', 'Renfrewshire',
    'Scottish Borders', 'Shetland', 'South Ayrshire', 'South Lanarkshire', 'Stirlingshire',
    'West Dunbartonshire', 'West Lothian', 'Western Isles',
  ],
  'Northern Ireland': ['Antrim', 'Armagh', 'County Down', 'Fermanagh', 'Londonderry', 'Tyrone'],
  Ireland: [
    'Carlow', 'Cavan', 'Clare', 'Cork', 'Donegal', 'Dublin', 'Galway', 'Kerry', 'Kildare', 'Kilkenny',
    'Laois', 'Leitrim', 'Limerick', 'Longford', 'Louth', 'Mayo', 'Meath', 'Monaghan', 'Offaly',
    'Roscommon', 'Sligo', 'Tipperary', 'Waterford', 'Westmeath', 'Wexford', 'Wicklow',
  ],
};

function countyTargetsForFeature(feature: CountyFeature) {
  return feature.properties.region === 'Ireland'
    ? [feature.properties.shapeName]
    : COUNTY_TARGETS_BY_AREA[feature.properties.shapeName] ?? [];
}

function countyTargetsForRegions(features: CountyFeature[], regions: CountyRegion[]) {
  const targetsInRegions = new Set(regions.flatMap((region) => COUNTY_TARGETS_BY_REGION[region]));
  return [...targetsInRegions].filter((target) => features.some((feature) => countyTargetsForFeature(feature).includes(target)));
}

function countyProjection(counties: CountyFeature[], width: number, height: number) {
  const positions = counties.flatMap(({ geometry }) => (
    geometry.type === 'Polygon'
      ? geometry.coordinates.flat()
      : geometry.type === 'MultiPolygon'
        ? geometry.coordinates.flat(2)
        : []
  ));
  const mercatorY = (latitude: number) => Math.log(Math.tan(Math.PI / 4 + latitude * Math.PI / 360));
  const longitudes = positions.map(([longitude]) => longitude * Math.PI / 180);
  const latitudes = positions.map((position) => mercatorY(position[1]));
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const scale = Math.min((width - 48) / (maxLongitude - minLongitude), (height - 48) / (maxLatitude - minLatitude));
  const offsetX = (width - (maxLongitude - minLongitude) * scale) / 2 - minLongitude * scale;
  const offsetY = (height - (maxLatitude - minLatitude) * scale) / 2 + maxLatitude * scale;

  return geoTransform({
    point(longitude, latitude) {
      this.stream.point(
        offsetX + longitude * Math.PI / 180 * scale,
        offsetY - mercatorY(latitude) * scale,
      );
    },
  });
}

function CountyQuiz({
  selectedRegions,
  showHoverName,
}: {
  selectedRegions: CountyRegion[];
  showHoverName: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const [counties, setCounties] = useState<CountyFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [target, setTarget] = useState('');
  const [picked, setPicked] = useState('');
  const [hoveredName, setHoveredName] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const countyTargets = useMemo(() => countyTargetsForRegions(counties, selectedRegions), [counties, selectedRegions]);
  const selectedTargetNames = useMemo(() => new Set(countyTargets), [countyTargets]);
  const playableCounties = useMemo(
    () => counties.filter((county) => countyTargetsForFeature(county).some((name) => selectedTargetNames.has(name))),
    [counties, selectedTargetNames],
  );

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(ukCountiesUrl, { signal: controller.signal }),
      fetch(irelandCountiesUrl, { signal: controller.signal }),
    ])
      .then(async ([ukResponse, irelandResponse]) => {
        if (!ukResponse.ok) throw new Error('UK county boundary request failed');
        if (!irelandResponse.ok) throw new Error('Ireland county boundary request failed');
        const [ukCollection, irelandCollection] = await Promise.all([
          ukResponse.json() as Promise<FeatureCollection<Geometry, CountyProperties>>,
          irelandResponse.json() as Promise<FeatureCollection<Geometry, CountyProperties>>,
        ]);
        const ukFeatures = ukCollection.features
          .filter((feature): feature is CountyFeature => Boolean(feature.properties?.shapeName))
          .map(correctCountyWinding);
        if (!ukFeatures.length) throw new Error('UK county boundary data is empty');
        const irelandFeatures = irelandCollection.features
          .filter((feature): feature is CountyFeature => Boolean(feature.properties?.shapeName && feature.properties.region === 'Ireland'))
          .map(correctCountyWinding);
        const features = [...ukFeatures, ...irelandFeatures];
        const areaNames = new Set(ukFeatures.map((feature) => feature.properties.shapeName));
        const missingTargets = Object.entries(COUNTY_AREA_GROUPS)
          .filter(([, areas]) => !areas.split('|').some((area) => areaNames.has(area)))
          .map(([name]) => name);
        if (missingTargets.length) throw new Error(`UK county boundaries are missing groups: ${missingTargets.join(', ')}`);
        const missingIrelandTargets = COUNTY_TARGETS_BY_REGION.Ireland.filter(
          (name) => !irelandFeatures.some((feature) => feature.properties.shapeName === name),
        );
        if (missingIrelandTargets.length) throw new Error(`Ireland county boundaries are missing: ${missingIrelandTargets.join(', ')}`);
        const targets = countyTargetsForRegions(features, countyRegions);
        setCounties(features);
        setTarget(targets[Math.floor(Math.random() * targets.length)]);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(true);
      })
      .finally(() => setLoading(false));

    return () => {
      controller.abort();
      window.clearTimeout(timer.current);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;
    const selection = select(svg);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 12])
      .on('zoom', (event) => select(group).attr('transform', event.transform.toString()));
    behaviorRef.current = behavior;
    selection.call(behavior);
    return () => {
      selection.on('.zoom', null);
      behaviorRef.current = null;
    };
  }, []);

  useEffect(() => {
    window.clearTimeout(timer.current);
    setPicked('');
    setScore(0);
    setTotal(0);
    setTarget(countyTargets[Math.floor(Math.random() * countyTargets.length)] ?? '');
    setHoveredName('');
    resetZoom();
  }, [selectedRegions, counties]);

  useEffect(() => {
    if (!showHoverName) setHoveredName('');
  }, [showHoverName]);

  const path = useMemo(() => {
    if (!size.width || !size.height || !playableCounties.length) return null;
    const projection = countyProjection(playableCounties, size.width, size.height);
    return geoPath(projection);
  }, [playableCounties, size]);

  function answer(county: CountyFeature) {
    if (picked || !target) return;
    const answerName = county.properties.shapeName;
    setPicked(answerName);
    setHoveredName('');
    setTotal((value) => value + 1);
    if (countyTargetsForFeature(county).includes(target)) setScore((value) => value + 1);
    timer.current = window.setTimeout(() => {
      setTarget((currentTarget) => {
        const options = countyTargets.filter((name) => name !== currentTarget);
        return options[Math.floor(Math.random() * options.length)] ?? currentTarget;
      });
      setPicked('');
    }, 750);
  }

  function zoomBy(factor: number) {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.scaleBy, factor);
  }

  function resetZoom() {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.transform, zoomIdentity);
  }

  function resetScore() {
    window.clearTimeout(timer.current);
    setScore(0);
    setTotal(0);
    setPicked('');
    setTarget(countyTargets[Math.floor(Math.random() * countyTargets.length)] ?? '');
  }

  const accuracy = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="county-quiz">
      <div className="map-heading">
        <div><span className="map-kicker">{selectedRegions.join(' · ').toUpperCase()}</span><span className="map-title">County explorer</span></div>
        <button className="icon-button reset-button" onClick={resetScore} title="Reset county score" aria-label="Reset county score"><RotateCcw size={15} /></button>
      </div>
      <div className="county-question" aria-live="polite">
        <span className="map-kicker">FIND THIS COUNTY</span>
        <h2>{loading ? 'Loading county boundaries…' : loadError ? 'County map unavailable' : target || 'Preparing the map'}</h2>
        <span className="county-score">{score} / {total} correct · {accuracy}% accuracy</span>
      </div>
      <div className="map-canvas county-map-canvas" ref={containerRef}>
        <svg ref={svgRef} className="world-map" aria-label={`Interactive map of ${selectedRegions.join(', ')} counties`}>
          <g ref={groupRef}>
            {path && playableCounties.map((county, index) => {
              const name = county.properties.shapeName;
              const targetNames = countyTargetsForFeature(county);
              if (!targetNames.length) return null;
              const isPicked = name === picked;
              const isAnswer = targetNames.includes(target);
              const status = isPicked ? (isAnswer ? 'correct' : 'wrong') : picked && isAnswer ? 'answer' : '';
              return (
                <path
                  key={county.properties.shapeID ?? `${name}-${index}`}
                  d={path(county) ?? undefined}
                  className={`country-shape county-shape${status ? ` ${status}` : ''}${picked ? ' locked' : ''}`}
                  role="button"
                  tabIndex={picked ? -1 : 0}
                  aria-label={targetNames.join(' / ')}
                  aria-disabled={Boolean(picked)}
                  onMouseEnter={() => { if (!picked && showHoverName) setHoveredName(targetNames.join(' / ')); }}
                  onMouseLeave={() => setHoveredName('')}
                  onFocus={() => { if (!picked && showHoverName) setHoveredName(targetNames.join(' / ')); }}
                  onBlur={() => setHoveredName('')}
                  onClick={() => answer(county)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      answer(county);
                    }
                  }}
                />
              );
            })}
          </g>
        </svg>
        {showHoverName && hoveredName && !picked && <div className="country-hover-label" role="status">{hoveredName}</div>}
        {(loading || loadError) && <div className="map-message" role={loadError ? 'alert' : 'status'}>{loadError ? 'Could not load UK county boundaries. Please try again later.' : 'Loading county boundaries…'}</div>}
        <div className="map-tools county-map-tools" aria-label="County map controls">
          <button className="icon-button" onClick={() => zoomBy(1.5)} aria-label="Zoom in to counties" title="Zoom in"><ZoomIn size={17} /></button>
          <button className="icon-button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out from counties" title="Zoom out"><ZoomOut size={17} /></button>
          <span className="tool-divider" />
          <button className="icon-button" onClick={resetZoom} aria-label="Reset county map view" title="Reset map view"><Crosshair size={16} /></button>
        </div>
        <div className="map-stamp">ATLAS<br /><span>SELECTED COUNTIES</span></div>
      </div>
      <div className="map-caption"><span><i className="legend-dot" />SELECT A COUNTY ON THE MAP</span><span>BOUNDARIES: GEOBOUNDARIES / NATURAL EARTH</span></div>
    </div>
  );
}

function isUkPlace(value: unknown): value is UkPlace {
  if (!value || typeof value !== 'object') return false;
  const place = value as Record<string, unknown>;
  return typeof place.name === 'string'
    && typeof place.population === 'number'
    && place.population >= 100000
    && typeof place.latitude === 'number'
    && Number.isFinite(place.latitude)
    && typeof place.longitude === 'number'
    && Number.isFinite(place.longitude)
    && typeof place.featureCode === 'string'
    && typeof place.geonameId === 'string';
}

function WhereAmIGame({
  countries,
  loading,
  loadError,
  showHoverName,
  highlightDistancePlaces,
}: {
  countries: Country[];
  loading: boolean;
  loadError: boolean;
  showHoverName: boolean;
  highlightDistancePlaces: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [places, setPlaces] = useState<UkPlace[]>([]);
  const [placesError, setPlacesError] = useState('');
  const [puzzle, setPuzzle] = useState<WhereAmIPuzzle | null>(null);
  const [picked, setPicked] = useState('');
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [hoveredPlace, setHoveredPlace] = useState('');
  const [zoomTransform, setZoomTransform] = useState({ x: 0, y: 0, k: 1 });

  useEffect(() => {
    const controller = new AbortController();
    fetch(ukCitiesUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('UK city data request failed');
        return response.json() as Promise<unknown>;
      })
      .then((data) => {
        if (!Array.isArray(data) || data.length < 4 || !data.every(isUkPlace)) {
          throw new Error('UK city data is invalid or does not meet the population threshold');
        }
        setPlaces(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setPlacesError(error instanceof Error ? error.message : 'UK city data could not be loaded');
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!places.length) return;
    const nextPuzzle = createWhereAmIPuzzle(places);
    if (nextPuzzle) setPuzzle(nextPuzzle);
    else setPlacesError('Could not create a unique distance puzzle from the available UK places.');
  }, [places]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;
    const selection = select(svg);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 10])
      .on('zoom', (event) => {
        select(group).attr('transform', event.transform.toString());
        setZoomTransform(event.transform);
      });
    behaviorRef.current = behavior;
    selection.call(behavior);
    return () => { selection.on('.zoom', null); };
  }, []);

  const ukFeature = countries.find((country) => country.properties.ADMIN === 'United Kingdom');
  const projection = useMemo(() => {
    if (!ukFeature || !size.width || !size.height) return null;
    return geoMercator().fitExtent([[18, 18], [size.width - 18, size.height - 18]], ukFeature);
  }, [size, ukFeature]);
  const path = useMemo(() => projection ? geoPath(projection) : null, [projection]);
  const scale = useMemo(() => {
    if (!projection || !projection.invert || !size.width || !size.height) return null;
    const center = projection.invert([
      (size.width / 2 - zoomTransform.x) / zoomTransform.k,
      (size.height / 2 - zoomTransform.y) / zoomTransform.k,
    ]);
    const east = projection.invert([
      (size.width / 2 - zoomTransform.x) / zoomTransform.k + 100 / zoomTransform.k,
      (size.height / 2 - zoomTransform.y) / zoomTransform.k,
    ]);
    if (!center || !east) return null;
    const milesPer100Pixels = geoDistance(center, east) * 3958.7613;
    if (!Number.isFinite(milesPer100Pixels) || milesPer100Pixels <= 0) return null;
    const magnitude = 10 ** Math.floor(Math.log10(milesPer100Pixels));
    const distanceMiles = [5, 2, 1].map((multiple) => multiple * magnitude).find((distance) => distance <= milesPer100Pixels);
    if (!distanceMiles) return null;
    return { distanceMiles, width: (distanceMiles / milesPer100Pixels) * 100 };
  }, [projection, size, zoomTransform]);

  function zoomBy(factor: number) {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.scaleBy, factor);
  }

  function resetZoom() {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.transform, zoomIdentity);
  }

  function answer(place: UkPlace) {
    if (!puzzle || picked) return;
    setPicked(place.name);
    setTotal((value) => value + 1);
    if (place.name === puzzle.target.name) setScore((value) => value + 1);
  }

  function nextPuzzle() {
    const nextPuzzle = createWhereAmIPuzzle(places, puzzle?.target.name);
    if (!nextPuzzle) {
      setPlacesError('Could not create another unique distance puzzle from the available UK places.');
      return;
    }
    setPuzzle(nextPuzzle);
    setPicked('');
    setHoveredPlace('');
  }

  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const pending = !placesError && (!places.length || !puzzle);
  const cluePlaces = new Map(puzzle?.clues.map((clue) => [clue.place.geonameId, clue]) ?? []);

  return (
    <div className="whereami-game">
      <div className="whereami-heading">
        <div><span className="map-kicker">UK DISTANCE CHALLENGE</span><span className="map-title">Where am I?</span></div>
        <span className="whereami-score">{score} / {total} correct · {accuracy}%</span>
      </div>
      <div className="whereami-question" aria-live="polite">
        <div className="whereami-clues">
          {puzzle?.clues.map((clue) => (
            <div className="whereami-clue" key={clue.place.geonameId}>
              <span>Distance from <strong>{clue.place.name}</strong></span>
              <b>{clue.distanceMiles.toFixed(1)} mi</b>
            </div>
          ))}
        </div>
        <div className="whereami-feedback" role="status">
          {picked
            ? picked === puzzle?.target.name ? 'Correct — well done.' : `Not quite — the answer was ${puzzle?.target.name}.`
            : 'Use the three straight-line distances to find the place.'}
        </div>
        {picked && <button className="matchup-start-button" onClick={nextPuzzle}>Next place</button>}
      </div>
      <div className="map-canvas whereami-map-canvas" ref={containerRef}>
        <svg ref={svgRef} className="world-map" aria-label="Interactive map of UK cities and major towns">
          <g ref={groupRef}>
            {path && ukFeature && <path className="whereami-land" d={path(ukFeature) ?? undefined} />}
            {projection && places.map((place) => {
              const point = projection([place.longitude, place.latitude]);
              if (!point) return null;
              const clue = highlightDistancePlaces ? cluePlaces.get(place.geonameId) : undefined;
              const isPicked = place.name === picked;
              const isAnswer = place.name === puzzle?.target.name;
              const status = picked ? (isPicked ? (isAnswer ? 'correct' : 'wrong') : isAnswer ? 'answer' : '') : '';
              return (
                <g key={place.geonameId}>
                  {clue && <circle className="whereami-clue-halo" cx={point[0]} cy={point[1]} r={8} />}
                  <circle
                    cx={point[0]}
                    cy={point[1]}
                    r={status ? 6 : clue ? 5 : 3.5}
                    className={`whereami-marker${clue ? ' clue' : ''}${status ? ` ${status}` : ''}${picked ? ' locked' : ''}`}
                    role="button"
                    tabIndex={picked ? -1 : 0}
                    aria-label={`${place.name}${clue ? `, clue city, ${clue.distanceMiles.toFixed(1)} miles from the answer` : ''}`}
                    aria-disabled={Boolean(picked)}
                    onMouseEnter={() => { if (showHoverName) setHoveredPlace(place.name); }}
                    onMouseLeave={() => setHoveredPlace('')}
                    onFocus={() => { if (showHoverName) setHoveredPlace(place.name); }}
                    onBlur={() => setHoveredPlace('')}
                    onClick={() => answer(place)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        answer(place);
                      }
                    }}
                  />
                  {clue && (
                    <text className="whereami-clue-label" x={point[0] + 8} y={point[1] - 8}>
                      {clue.place.name} · {clue.distanceMiles.toFixed(1)} mi
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
        {showHoverName && hoveredPlace && !picked && <div className="country-hover-label" role="status">{hoveredPlace}</div>}
        {(pending || placesError || loading || loadError) && (
          <div className="map-message" role={placesError || loadError ? 'alert' : 'status'}>
            {placesError || (loadError ? 'Could not load the UK map outline.' : pending ? 'Loading UK places…' : 'Loading the UK map…')}
          </div>
        )}
        <div className="map-tools county-map-tools" aria-label="UK map controls">
          <button className="icon-button" onClick={() => zoomBy(1.5)} aria-label="Zoom in to UK places" title="Zoom in"><ZoomIn size={17} /></button>
          <button className="icon-button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out from UK places" title="Zoom out"><ZoomOut size={17} /></button>
          <span className="tool-divider" />
          <button className="icon-button" onClick={resetZoom} aria-label="Reset UK map view" title="Reset map view"><Crosshair size={16} /></button>
        </div>
        {scale && (
          <div className="whereami-scale" aria-label={`Map scale: ${scale.distanceMiles} miles`}>
            <span>{scale.distanceMiles} mi</span>
            <i style={{ width: `${scale.width}px` }} />
          </div>
        )}
        <div className="map-stamp">ATLAS<br /><span>UK PLACES</span></div>
      </div>
      <div className="map-caption"><span><i className="legend-dot" />SELECT A PLACE ON THE MAP</span><span>STRAIGHT-LINE DISTANCES · MILES</span></div>
    </div>
  );
}

function PlanetaryQuiz() {
  const [questions, setQuestions] = useState(() => shuffle(planetaryQuestions).map((question) => ({
    ...question,
    options: shuffle(question.options),
  })));
  const [questionIndex, setQuestionIndex] = useState(0);
  const [picked, setPicked] = useState('');
  const [score, setScore] = useState(0);
  const question = questions[questionIndex];
  const finished = questionIndex >= questions.length;

  function answer(option: string) {
    if (!question || picked) return;
    setPicked(option);
    if (option === question.answer) setScore((value) => value + 1);
  }

  function advance() {
    setQuestionIndex((index) => index + 1);
    setPicked('');
  }

  function restart() {
    setQuestions(shuffle(planetaryQuestions).map((item) => ({ ...item, options: shuffle(item.options) })));
    setQuestionIndex(0);
    setPicked('');
    setScore(0);
  }

  const currentQuestionNumber = Math.min(questionIndex + (picked ? 1 : 0), questions.length);

  return (
    <div className="planetary-quiz">
      <div className="planetary-heading">
        <div>
          <span className="map-kicker">25-QUESTION CHALLENGE</span>
          <span className="map-title">Planets &amp; moons</span>
        </div>
        <span className="planetary-score">{score} correct · {currentQuestionNumber} / {questions.length}</span>
      </div>
      <div className="solar-system-diagram">
        <svg viewBox="0 0 900 440" role="img" aria-label="Unlabelled schematic of the Sun, eight planetary orbits, planets and selected moon positions; not to scale">
          {[...solarSystemOrbits].reverse().map((orbit) => {
            const radians = orbit.angle * Math.PI / 180;
            const x = 450 + Math.cos(radians) * orbit.rx;
            const y = 220 + Math.sin(radians) * orbit.ry;
            return (
              <g key={orbit.name}>
                <ellipse className="solar-orbit-line" cx="450" cy="220" rx={orbit.rx} ry={orbit.ry} />
                {orbit.rings && (
                  <>
                    <ellipse className="solar-planet-ring" cx={x} cy={y} rx={orbit.radius * 1.9} ry={orbit.radius * 0.62} transform={`rotate(-18 ${x} ${y})`} />
                    <ellipse className="solar-planet-ring" cx={x} cy={y} rx={orbit.radius * 1.45} ry={orbit.radius * 0.43} transform={`rotate(-18 ${x} ${y})`} />
                  </>
                )}
                {Array.from({ length: orbit.moons }, (_, index) => {
                  const angle = index * (Math.PI * 2 / orbit.moons) + orbit.angle;
                  const distance = orbit.radius + 9 + (index % 2) * 5;
                  return (
                    <circle
                      className="solar-moon-point"
                      key={`${orbit.name}-moon-${index}`}
                      cx={x + Math.cos(angle) * distance}
                      cy={y + Math.sin(angle) * distance * 0.72}
                      r="1.8"
                    />
                  );
                })}
                <circle className={`solar-planet-point solar-planet-${orbit.name.toLowerCase()}`} cx={x} cy={y} r={orbit.radius} />
                <ellipse className="solar-planet-latitude" cx={x} cy={y} rx={orbit.radius * 0.92} ry={orbit.radius * 0.34} />
                <path className="solar-planet-longitude" d={`M${x} ${y - orbit.radius} C${x - orbit.radius * 0.48} ${y - orbit.radius * 0.35} ${x - orbit.radius * 0.48} ${y + orbit.radius * 0.35} ${x} ${y + orbit.radius} M${x} ${y - orbit.radius} C${x + orbit.radius * 0.48} ${y - orbit.radius * 0.35} ${x + orbit.radius * 0.48} ${y + orbit.radius * 0.35} ${x} ${y + orbit.radius}`} />
              </g>
            );
          })}
          <circle className="solar-sun-point" cx="450" cy="220" r="20" />
          <path className="solar-sun-line" d="M450 192v-9m0 74v-9m-28-28h-9m74 0h-9m-48-20-7-7m52 52-7-7m0-38 7-7m-52 52 7-7" />
        </svg>
        <span className="solar-diagram-note">SCHEMATIC · NOT TO SCALE</span>
      </div>
      <div className="planetary-question" aria-live="polite">
        {finished ? (
          <div className="planetary-complete">
            <span className="map-kicker">ROUND COMPLETE</span>
            <h2>You scored {score} out of {questions.length}</h2>
            <p>Start a new round to reshuffle all 25 questions.</p>
            <button className="matchup-start-button" onClick={restart}>Play again</button>
          </div>
        ) : (
          <>
            <div className="planetary-progress">
              <span className="map-kicker">QUESTION {currentQuestionNumber} OF {questions.length}</span>
              <div className="planetary-progress-track"><i style={{ width: `${(currentQuestionNumber / questions.length) * 100}%` }} /></div>
              <h2>{question.question}</h2>
            </div>
            <div className="planetary-answer-grid" role="group" aria-label="Choose an answer">
              {question.options.map((option) => {
                const result = picked
                  ? option === question.answer ? ' correct' : option === picked ? ' wrong' : ''
                  : '';
                return (
                  <button
                    className={`planetary-answer${result}`}
                    type="button"
                    key={option}
                    onClick={() => answer(option)}
                    disabled={Boolean(picked)}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
            {picked && (
              <div className="planetary-response">
                <p className="planetary-feedback" role="status">{picked === question.answer ? 'Correct!' : `Not quite — the answer is ${question.answer}.`}</p>
                <p className="planetary-fact"><strong>Did you know?</strong> {question.fact}</p>
                <button className="matchup-start-button" onClick={advance}>{questionIndex === questions.length - 1 ? 'See results' : 'Next question'}</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MatchupTileButton({
  column,
  tile,
  index,
  matched,
  enabled,
  onDropTile,
  onMoveTile,
}: {
  column: MatchupColumn;
  tile: MatchupTile;
  index: number;
  matched: boolean;
  enabled: boolean;
  onDropTile: (column: MatchupColumn, sourceId: string, targetId: string) => void;
  onMoveTile: (column: MatchupColumn, id: string, targetIndex: number) => void;
}) {
  const touchPointerId = useRef<number | null>(null);
  const outlinePath = useMemo(() => {
    const projection = geoNaturalEarth1().fitExtent([[5, 5], [115, 59]], tile.country);
    return geoPath(projection)(tile.country) ?? '';
  }, [tile.country]);

  return (
    <button
      className={`matchup-tile${matched ? ' matched' : ''}`}
      data-matchup-column={column}
      data-matchup-id={tile.id}
      draggable={enabled}
      onPointerDown={(event) => {
        if (enabled && event.pointerType === 'touch') {
          touchPointerId.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
        }
      }}
      onPointerUp={(event) => {
        if (touchPointerId.current !== event.pointerId) return;
        touchPointerId.current = null;
        const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>('[data-matchup-column]');
        if (target?.dataset.matchupColumn === column && target.dataset.matchupId) {
          onDropTile(column, tile.id, target.dataset.matchupId);
        }
      }}
      onPointerCancel={() => { touchPointerId.current = null; }}
      onDragStart={(event) => {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', `${column}\n${tile.id}`);
      }}
      onDragOver={(event) => {
        if (enabled && event.dataTransfer.types.includes('text/plain')) {
          event.preventDefault();
          event.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        const [sourceColumn, sourceId] = event.dataTransfer.getData('text/plain').split('\n');
        if (enabled && sourceColumn === column && sourceId) onDropTile(column, sourceId, tile.id);
      }}
      onKeyDown={(event) => {
        if (!enabled) return;
        const targetIndex = event.key === 'ArrowUp' ? index - 1 : event.key === 'ArrowDown' ? index + 1 : index;
        if (targetIndex !== index) {
          event.preventDefault();
          onMoveTile(column, tile.id, targetIndex);
        }
      }}
      aria-label={`${matchupColumnLabels[column].toLowerCase()}: ${column === 'flag' ? tile.country.properties.ADMIN : column === 'outline' ? `${tile.country.properties.ADMIN} outline` : column === 'population' ? tile.population.toLocaleString() : column === 'country' ? tile.country.properties.ADMIN : tile.capital}. Row ${index + 1}${matched ? ', matched' : ''}. Drag to reorder, or use the up and down arrow keys.`}
      title="Drag to reorder, or use the up and down arrow keys"
    >
      <span className="matchup-tile-number">{String(index + 1).padStart(2, '0')}</span>
      {column === 'country' && <span className="matchup-tile-text">{tile.country.properties.ADMIN}</span>}
      {column === 'capital' && <span className="matchup-tile-text">{tile.capital}</span>}
      {column === 'flag' && <img className="matchup-flag" src={`https://flagcdn.com/w80/${tile.flagCode}.png`} alt="" draggable={false} />}
      {column === 'outline' && <svg className="matchup-outline" viewBox="0 0 120 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d={outlinePath} /></svg>}
      {column === 'population' && <span className="matchup-tile-text">{tile.population.toLocaleString()}</span>}
    </button>
  );
}

function MatchupGame({
  tiles,
  board,
  correctRows,
  elapsedSeconds,
  started,
  finished,
  onStart,
  onDropTile,
  onMoveTile,
}: {
  tiles: MatchupTile[];
  board: MatchupBoard;
  correctRows: number;
  elapsedSeconds: number;
  started: boolean;
  finished: boolean;
  onStart: () => void;
  onDropTile: (column: MatchupColumn, sourceId: string, targetId: string) => void;
  onMoveTile: (column: MatchupColumn, id: string, targetIndex: number) => void;
}) {
  const tilesById = useMemo(() => new Map(tiles.map((tile) => [tile.id, tile])), [tiles]);
  const enabled = started && !finished;

  return (
    <div className="matchup-game">
      <div className="matchup-game-heading">
        <div>
          <span className="map-kicker">MATCH COUNTRY, CAPITAL, FLAG, OUTLINE &amp; POPULATION</span>
          <h2>Matchup</h2>
        </div>
        <div className="matchup-timer" role="timer" aria-label={`${elapsedSeconds} seconds elapsed`}>{formatElapsedTime(elapsedSeconds)}</div>
      </div>
      <div className="matchup-toolbar">
        <p>{finished ? 'All ten countries matched. Great work!' : started ? 'Drag blocks within each column to line up matching countries.' : 'Arrange each column so every row shows clues for the same country.'}</p>
        <button className="matchup-start-button" onClick={onStart}>{finished ? 'Play again' : started ? 'Restart' : 'Start timer'}</button>
      </div>
      <p className="matchup-accessibility-hint">You can also focus a block and use the up and down arrow keys to move it.</p>
      <div className="matchup-board-scroll">
        <div className="matchup-board" aria-label="Match the ten countries across five columns">
          {matchupColumns.map((column) => (
            <section className="matchup-column" key={column} aria-label={`${matchupColumnLabels[column]} blocks`}>
              <h3>{matchupColumnLabels[column]}</h3>
              <ol>
                {board[column].map((id, index) => {
                  const tile = tilesById.get(id);
                  if (!tile) return null;
                    const matched = matchupColumns.every((matchupColumn) => id === board[matchupColumn][index]);
                  return (
                    <li key={`${column}-${id}`}>
                      <MatchupTileButton
                        column={column}
                        tile={tile}
                        index={index}
                        matched={matched}
                        enabled={enabled}
                        onDropTile={onDropTile}
                        onMoveTile={onMoveTile}
                      />
                    </li>
                  );
                })}
              </ol>
            </section>
          ))}
        </div>
      </div>
      <div className="matchup-progress" role="status">{correctRows} / 10 ROWS MATCHED</div>
    </div>
  );
}

function App() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [countryMetadata, setCountryMetadata] = useState<CountryMetadata[]>([]);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [metadataError, setMetadataError] = useState(false);
  const [continent, setContinent] = useState<Continent>('World');
  const [quizMode, setQuizMode] = useState<QuizMode>('name');
  const [showHoverName, setShowHoverName] = useState(true);
  const [highlightDistancePlaces, setHighlightDistancePlaces] = useState(false);
  const [selectedCountyRegions, setSelectedCountyRegions] = useState<CountyRegion[]>(countyRegions);
  const [sessionQuestions, setSessionQuestions] = useState<SessionQuestion[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(twentyQuestionDurationSeconds);
  const [challengeFinished, setChallengeFinished] = useState(false);
  const [matchupTiles, setMatchupTiles] = useState<MatchupTile[]>([]);
  const [matchupBoard, setMatchupBoard] = useState<MatchupBoard>(() => createMatchupBoard([]));
  const [matchupStarted, setMatchupStarted] = useState(false);
  const [matchupFinished, setMatchupFinished] = useState(false);
  const [matchupElapsedSeconds, setMatchupElapsedSeconds] = useState(0);
  const [matchupError, setMatchupError] = useState('');
  const [target, setTarget] = useState('');
  const [picked, setPicked] = useState('');
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const timer = useRef<number | undefined>(undefined);
  const countdown = useRef<number | undefined>(undefined);

  const currentQuestion = quizMode === 'twenty' ? sessionQuestions[questionIndex] : undefined;
  const questionMode: QuestionMode = currentQuestion?.mode ?? (quizMode === 'twenty' || quizMode === 'matchup' || quizMode === 'counties' || quizMode === 'whereami' || quizMode === 'planets' ? 'name' : quizMode);
  const activeContinent = currentQuestion?.continent ?? continent;
  const activeCountries = useMemo(
    () => activeContinent === 'World' ? countries : countries.filter((country) => country.properties.CONTINENT === activeContinent),
    [countries, activeContinent],
  );
  const metadataByCode = useMemo(() => new Map(countryMetadata.map((country) => [country.cca3, country])), [countryMetadata]);
  const quizCountries = useMemo(() => {
    if (questionMode === 'name' || questionMode === 'outline') return activeCountries;
    return activeCountries.filter((country) => {
      const metadata = metadataFor(country, metadataByCode);
      return questionMode === 'flag'
        ? Boolean(metadata?.cca2)
        : Boolean(metadata?.capital?.[0]);
    });
  }, [activeCountries, metadataByCode, questionMode]);
  const answerableNames = useMemo(() => new Set(quizCountries.map((country) => country.properties.ADMIN)), [quizCountries]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(countriesUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Map data request failed');
        return response.json() as Promise<FeatureCollection<Geometry, CountryProperties>>;
      })
      .then((collection) => setCountries(collection.features.filter((feature): feature is Country => Boolean(feature.properties?.ADMIN && feature.properties?.CONTINENT))))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError(true);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch('https://raw.githubusercontent.com/mledoze/countries/master/countries.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Country clue data request failed');
        return response.json() as Promise<CountryMetadata[]>;
      })
      .then((metadata) => setCountryMetadata(metadata.filter((country) => Boolean(country.cca2 && country.cca3))))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setMetadataError(true);
      })
      .finally(() => setMetadataLoading(false));

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (quizMode === 'twenty') return;
    window.clearTimeout(timer.current);
    setLocked(false);
    setPicked('');
    setTarget(quizCountries.length ? randomCountry(quizCountries)?.properties.ADMIN ?? '' : '');
    return () => window.clearTimeout(timer.current);
  }, [quizCountries, quizMode]);

  useEffect(() => {
    if (quizMode !== 'twenty' || challengeFinished) return;
    countdown.current = window.setInterval(() => setTimeRemaining((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(countdown.current);
  }, [quizMode, challengeFinished]);

  useEffect(() => {
    if (quizMode !== 'matchup' || !matchupStarted || matchupFinished) return;
    countdown.current = window.setInterval(() => setMatchupElapsedSeconds((seconds) => seconds + 1), 1000);
    return () => window.clearInterval(countdown.current);
  }, [quizMode, matchupStarted, matchupFinished]);

  useEffect(() => {
    if (quizMode !== 'twenty' || timeRemaining > 0 || challengeFinished) return;
    window.clearTimeout(timer.current);
    setLocked(true);
    setChallengeFinished(true);
  }, [challengeFinished, quizMode, timeRemaining]);

  function answer(country: Country) {
    if (locked || challengeFinished || !target) return;
    const answerName = country.properties.ADMIN;
    setPicked(answerName);
    setLocked(true);
    setTotal((value) => value + 1);
    if (answerName === target) setScore((value) => value + 1);

    timer.current = window.setTimeout(() => {
      if (quizMode === 'twenty') {
        const nextIndex = questionIndex + 1;
        if (nextIndex === sessionQuestions.length) {
          setChallengeFinished(true);
          setLocked(true);
          return;
        }
        setQuestionIndex(nextIndex);
        setTarget(sessionQuestions[nextIndex].target);
      } else {
        setTarget(randomCountry(quizCountries, target)?.properties.ADMIN ?? '');
      }
      setPicked('');
      setLocked(false);
    }, 1000);
  }

  function startTwentyQuestions() {
    const questions = buildTwentyQuestions(countries, metadataByCode);
    if (questions.length !== 20) return;
    window.clearTimeout(timer.current);
    setSessionQuestions(questions);
    setQuestionIndex(0);
    setTimeRemaining(twentyQuestionDurationSeconds);
    setChallengeFinished(false);
    setQuizMode('twenty');
    setTarget(questions[0].target);
    setPicked('');
    setLocked(false);
    setScore(0);
    setTotal(0);
  }

  function prepareMatchup() {
    const tiles = buildMatchupCountries(countries, metadataByCode);
    if (tiles.length !== 10) {
      setMatchupError('Matchup needs ten countries with capital, flag, and population data.');
      return;
    }
    window.clearTimeout(timer.current);
    setMatchupError('');
    setMatchupTiles(tiles);
    setMatchupBoard(createMatchupBoard(tiles.map((tile) => tile.id)));
    setMatchupStarted(false);
    setMatchupFinished(false);
    setMatchupElapsedSeconds(0);
    setQuizMode('matchup');
  }

  function startMatchupRound() {
    const tiles = matchupStarted || matchupFinished
      ? buildMatchupCountries(countries, metadataByCode, matchupTiles.map((tile) => tile.id))
      : matchupTiles;
    if (tiles.length !== 10) {
      setMatchupError('Could not find ten new countries for this round. Please try again.');
      return;
    }
    setMatchupError('');
    setMatchupTiles(tiles);
    setMatchupBoard(createMatchupBoard(tiles.map((tile) => tile.id)));
    setMatchupElapsedSeconds(0);
    setMatchupFinished(false);
    setMatchupStarted(true);
  }

  function moveMatchupTile(column: MatchupColumn, sourceId: string, targetIndex: number) {
    if (!matchupStarted || matchupFinished) return;
    const sourceIndex = matchupBoard[column].indexOf(sourceId);
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= matchupBoard[column].length || sourceIndex === targetIndex) return;
    const movedColumn = [...matchupBoard[column]];
    movedColumn.splice(sourceIndex, 1);
    movedColumn.splice(targetIndex, 0, sourceId);
    const nextBoard = { ...matchupBoard, [column]: movedColumn };
    setMatchupBoard(nextBoard);
    if (countCorrectMatchupRows(nextBoard) === 10) setMatchupFinished(true);
  }

  function dropMatchupTile(column: MatchupColumn, sourceId: string, targetId: string) {
    const targetIndex = matchupBoard[column].indexOf(targetId);
    moveMatchupTile(column, sourceId, targetIndex);
  }

  function changeMode(mode: QuizMode) {
    if (mode === 'twenty') {
      startTwentyQuestions();
      return;
    }
    if (mode === 'matchup') {
      prepareMatchup();
      return;
    }
    window.clearTimeout(timer.current);
    setChallengeFinished(false);
    setMatchupStarted(false);
    setMatchupFinished(false);
    setSessionQuestions([]);
    setQuestionIndex(0);
    setTimeRemaining(twentyQuestionDurationSeconds);
    setPicked('');
    setLocked(false);
    setQuizMode(mode);
  }

  function resetScore() {
    if (quizMode === 'twenty') {
      startTwentyQuestions();
      return;
    }
    setScore(0);
    setTotal(0);
    setPicked('');
    setLocked(false);
    window.clearTimeout(timer.current);
    setTarget(randomCountry(quizCountries)?.properties.ADMIN ?? '');
  }

  const isCorrect = picked === target && Boolean(picked);
  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const targetCountry = quizCountries.find((country) => country.properties.ADMIN === target);
  const targetMetadata = targetCountry ? metadataFor(targetCountry, metadataByCode) : undefined;
  const choices = useMemo(() => questionMode === 'outline' ? outlineChoices(quizCountries, target) : [], [quizCountries, questionMode, target]);
  const correctMatchupRows = countCorrectMatchupRows(matchupBoard);

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Atlas home">
          <span className="brand-mark"><Globe2 size={21} strokeWidth={1.8} /></span>
          <span className="brand-name">atlas<span>/</span></span>
          <span className="brand-divider" />
          <span className="brand-edition">FIELD QUIZ 01</span>
        </a>
        <div className="topbar-meta"><span className="live-dot" /> GEOGRAPHY, IN MOTION</div>
      </header>

      <div className="workspace">
        <aside className={`quiz-panel${questionMode === 'outline' ? ' outline-quiz-panel' : ''}${quizMode === 'twenty' ? ' challenge-quiz-panel' : ''}${quizMode === 'matchup' ? ' matchup-quiz-panel' : ''}${quizMode === 'counties' ? ' counties-quiz-panel' : ''}${quizMode === 'whereami' ? ' whereami-quiz-panel' : ''}${quizMode === 'planets' ? ' planetary-quiz-panel' : ''}`}>
          <div className="eyebrow"><span>01</span> &nbsp;COUNTRY STUDY</div>
          <div className="question-block" aria-live="polite">
            <div className="question-label">
              {quizMode === 'counties' ? 'COUNTY QUIZ' : quizMode === 'whereami' ? 'WHERE AM I?' : quizMode === 'planets' ? 'PLANET & MOON QUIZ' : quizMode === 'matchup' ? 'MATCHUP' : quizMode === 'twenty' ? <><span>20 QUESTION CHALLENGE</span><span role="timer" className={`challenge-clock${timeRemaining <= 10 ? ' urgent' : ''}`} aria-label={`${timeRemaining} seconds remaining`}>{`${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(timeRemaining % 60).padStart(2, '0')}`}</span></> : 'YOUR NEXT DESTINATION'}
            </div>
            {quizMode === 'twenty' && <div className="challenge-progress">QUESTION {Math.min(questionIndex + 1, 20)} / 20 <span>{activeContinent.toUpperCase()}</span></div>}
            <h1>{quizMode === 'counties' ? 'Explore the counties' : quizMode === 'whereami' ? 'Trace the distances' : quizMode === 'planets' ? '25 questions' : quizMode === 'matchup' ? matchupFinished ? 'All matched!' : 'Match the clues' : loading ? 'Preparing the atlas' : loadError ? 'Map unavailable' : quizMode === 'twenty' && challengeFinished ? timeRemaining === 0 ? "Time's up" : 'Challenge complete' : target ? questionMode === 'name' ? <>Find <em>{target}</em></> : questionMode === 'capital' ? <>Find the country with capital <em>{targetMetadata?.capital?.[0]}</em></> : questionMode === 'outline' ? 'Name this outline' : 'Identify this flag' : 'No countries found'}</h1>
            {questionMode === 'flag' && targetMetadata?.cca2 && <img className="flag-clue" src={`https://flagcdn.com/w320/${targetMetadata.cca2.toLowerCase()}.png`} alt="Flag clue" />}
            <p className="instruction">{quizMode === 'counties' ? 'Select the county named on the map.' : quizMode === 'whereami' ? 'Match a UK place to its geodesic distances from three others.' : quizMode === 'planets' ? 'Answer a shuffled round about the planets, moons, and their remarkable features.' : quizMode === 'matchup' ? matchupFinished ? `Completed in ${formatElapsedTime(matchupElapsedSeconds)}.` : 'Line up all five clues for each of the ten countries.' : quizMode === 'twenty' && challengeFinished ? `You scored ${score} of 20.` : loading ? 'Loading country borders…' : loadError ? 'The map data could not be reached.' : metadataError && (questionMode === 'flag' || questionMode === 'capital') ? 'Flag and capital clues could not be loaded.' : picked ? (isCorrect ? 'Exactly right. Nice work.' : `That was ${picked}. The answer is ${target}.`) : !target && !metadataLoading && questionMode !== 'name' ? `No ${questionMode} clues are available for this region.` : ''}</p>
          </div>

          <section className="quiz-settings" aria-label="Quiz options">
            <div className="section-heading"><span>CLUE TYPE</span></div>
            <div className="mode-options" role="group" aria-label="Choose a quiz clue">
              {(['name', 'flag', 'capital', 'outline', 'twenty', 'matchup', 'counties', 'whereami', 'planets'] as const).map((mode) => (
                <button key={mode} className={`mode-option${quizMode === mode ? ' selected' : ''}`} onClick={() => changeMode(mode)} aria-pressed={quizMode === mode} disabled={((mode === 'flag' || mode === 'capital') && (metadataLoading || metadataError)) || ((mode === 'twenty' || mode === 'matchup') && (loading || metadataLoading || metadataError))}>
                  {mode === 'name' ? 'Name' : mode === 'flag' ? 'Flag' : mode === 'capital' ? 'Capital' : mode === 'outline' ? 'Outline' : mode === 'twenty' ? '20 Questions' : mode === 'matchup' ? 'Matchup' : mode === 'counties' ? 'UK Counties' : mode === 'whereami' ? 'Where am I?' : 'Planets & Moons'}
                </button>
              ))}
            </div>
            {quizMode === 'counties' && (
              <section className="county-region-section" aria-label="Choose included regions">
                <div className="section-heading"><span>INCLUDE AREAS</span></div>
                <div className="county-region-grid" role="group" aria-label="Select counties from">
                  {countyRegions.map((region) => (
                    <label className="county-region-option" key={region}>
                      <input
                        type="checkbox"
                        checked={selectedCountyRegions.includes(region)}
                        disabled={selectedCountyRegions.length === 1 && selectedCountyRegions.includes(region)}
                        onChange={(event) => setSelectedCountyRegions((regions) => (
                          event.target.checked ? [...regions, region] : regions.filter((value) => value !== region)
                        ))}
                      />
                      {region}
                    </label>
                  ))}
                </div>
              </section>
            )}
            {quizMode !== 'matchup' && quizMode !== 'planets' && <label className="hover-toggle"><input type="checkbox" checked={showHoverName} onChange={(event) => setShowHoverName(event.target.checked)} />{quizMode === 'counties' ? 'Show county names on hover' : quizMode === 'whereami' ? 'Show place names on hover' : 'Show country name on hover'}</label>}
            {quizMode === 'whereami' && <label className="hover-toggle"><input type="checkbox" checked={highlightDistancePlaces} onChange={(event) => setHighlightDistancePlaces(event.target.checked)} />Highlight clue cities and distances</label>}
            {metadataError && <p className="metadata-note">Flag and capital clues are unavailable right now.</p>}
            {matchupError && <p className="metadata-note" role="alert">{matchupError}</p>}
          </section>

          {questionMode === 'outline' && target && (
            <section className="outline-choices" aria-label="Choose the outlined country">
              <div className="section-heading"><span>WHICH COUNTRY?</span><span className="region-count">{choices.length} {choices.length === 1 ? 'OPTION' : 'OPTIONS'}</span></div>
              <div className="outline-choice-grid">
                {choices.map((country, index) => {
                  const name = country.properties.ADMIN;
                  const result = picked === name ? (isCorrect ? ' correct' : ' wrong') : locked && name === target ? ' answer' : '';
                  return <button key={`${name}-${index}`} className={`outline-choice${result}`} onClick={() => answer(country)} disabled={locked || challengeFinished}>{name}</button>;
                })}
              </div>
            </section>
          )}

          {quizMode !== 'matchup' && quizMode !== 'counties' && quizMode !== 'whereami' && quizMode !== 'planets' && <section className="region-section" aria-labelledby="region-title">
            <div className="section-heading"><span id="region-title">{quizMode === 'twenty' ? 'REGION · AUTO' : 'REGION'}</span><span className="region-count">{String(continents.indexOf(activeContinent) + 1).padStart(2, '0')} / 08</span></div>
            <div className="region-grid" role="group" aria-label="Choose a region">
              {continents.map((region) => (
                <button key={region} className={`region-option${region === activeContinent ? ' selected' : ''}`} onClick={() => setContinent(region)} aria-pressed={region === activeContinent} disabled={quizMode === 'twenty'}>
                  <span>{region}</span><span className="region-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>}

          {quizMode !== 'counties' && quizMode !== 'whereami' && quizMode !== 'planets' && <section className="score-section" aria-label="Quiz score">
            <div className="section-heading"><span>{quizMode === 'matchup' ? 'MATCHED ROWS' : 'SESSION SCORE'}</span>{quizMode !== 'matchup' && <button className="icon-button reset-button" onClick={resetScore} title="Reset score" aria-label="Reset score"><RotateCcw size={15} /></button>}</div>
            <div className="score-row"><strong>{quizMode === 'matchup' ? correctMatchupRows : score}<span> / {quizMode === 'matchup' ? 10 : total}</span></strong>{quizMode === 'matchup' ? <span className="accuracy">ROWS</span> : <span className="accuracy">{accuracy}%<small> ACCURACY</small></span>}</div>
            <div className="score-track" aria-hidden="true"><span style={{ width: `${quizMode === 'matchup' ? correctMatchupRows * 10 : accuracy}%` }} /></div>
          </section>}

          <div className="panel-footer"><Crosshair size={15} /><span>Every answer is a new bearing.</span></div>
        </aside>

        <section className={`map-section${quizMode === 'matchup' ? ' matchup-section' : ''}${quizMode === 'counties' ? ' county-map-section' : ''}${quizMode === 'whereami' ? ' whereami-section' : ''}${quizMode === 'planets' ? ' planetary-section' : ''}`} aria-label={quizMode === 'matchup' ? 'Matchup game' : quizMode === 'counties' ? 'County quiz' : quizMode === 'whereami' ? 'Where am I UK distance quiz' : quizMode === 'planets' ? 'Planets and moons quiz' : 'Interactive world map'}>
          {quizMode === 'counties' ? (
            <CountyQuiz selectedRegions={selectedCountyRegions} showHoverName={showHoverName} />
          ) : quizMode === 'planets' ? (
            <PlanetaryQuiz />
          ) : quizMode === 'whereami' ? (
            <WhereAmIGame countries={countries} loading={loading} loadError={loadError} showHoverName={showHoverName} highlightDistancePlaces={highlightDistancePlaces} />
          ) : quizMode === 'matchup' ? (
            <MatchupGame
              tiles={matchupTiles}
              board={matchupBoard}
              correctRows={correctMatchupRows}
              elapsedSeconds={matchupElapsedSeconds}
              started={matchupStarted}
              finished={matchupFinished}
              onStart={startMatchupRound}
              onDropTile={dropMatchupTile}
              onMoveTile={moveMatchupTile}
            />
          ) : (
            <>
              <div className="map-heading"><div><span className="map-kicker">{questionMode === 'outline' ? 'ONE COUNTRY, NO NEIGHBOURS' : 'THE WORLD, ONE COUNTRY AT A TIME'}</span><span className="map-title">{questionMode === 'outline' ? 'Country outline' : activeContinent === 'World' ? 'World map' : activeContinent}</span></div><div className="map-coordinates">{questionMode === 'outline' ? 'IDENTIFY THE SHAPE' : quizMode === 'twenty' ? '5 MINUTE ROUND' : '50° N&nbsp; / &nbsp;20° E'}</div></div>
              {questionMode === 'outline' ? (
                <CountryOutline country={targetCountry} loading={loading} loadError={loadError} />
              ) : (
                <MapView
                  countries={activeCountries}
                  continent={activeContinent}
                  target={target}
                  picked={picked}
                  locked={locked}
                  loading={loading}
                  loadError={loadError}
                  answerableNames={answerableNames}
                  showHoverName={showHoverName}
                  onPick={answer}
                />
              )}
              <div className="map-caption"><span><i className="legend-dot" />{questionMode === 'outline' ? 'TARGET COUNTRY ONLY' : 'COUNTRY BORDERS'}</span><span>NATURAL EARTH / 1:50M</span></div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}

type CountryOutlineProps = {
  country?: Country;
  loading: boolean;
  loadError: boolean;
};

function CountryOutline({ country, loading, loadError }: CountryOutlineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const outlinePath = useMemo(() => {
    if (!country || !size.width || !size.height) return undefined;
    const projection = geoNaturalEarth1().fitExtent([[size.width * 0.12, size.height * 0.12], [size.width * 0.88, size.height * 0.88]], country);
    return geoPath(projection)(country) ?? undefined;
  }, [country, size]);

  return (
    <div className="map-canvas outline-canvas" ref={containerRef}>
      <svg className="world-map" aria-label="Outline of a country">
        {outlinePath && <path className="outline-shape" d={outlinePath} />}
      </svg>
      {(loading || loadError) && <div className="map-message">{loadError ? 'Could not load country outlines' : 'Drawing the outline…'}</div>}
      {!loading && !loadError && !country && <div className="map-message">No country outline available</div>}
      {!loading && !loadError && country && !outlinePath && <div className="map-message">Drawing the outline…</div>}
      <div className="map-stamp">ATLAS<br /><span>ONE COUNTRY</span></div>
    </div>
  );
}

type MapViewProps = {
  countries: Country[];
  continent: Continent;
  target: string;
  picked: string;
  locked: boolean;
  loading: boolean;
  loadError: boolean;
  answerableNames: Set<string>;
  showHoverName: boolean;
  onPick: (country: Country) => void;
};

function MapView({ countries, continent, target, picked, locked, loading, loadError, answerableNames, showHoverName, onPick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [hoveredName, setHoveredName] = useState('');

  useEffect(() => {
    if (!showHoverName) setHoveredName('');
  }, [showHoverName]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const group = groupRef.current;
    if (!svg || !group) return;
    const selection = select(svg);
    const behavior = zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on('zoom', (event) => select(group).attr('transform', event.transform.toString()));
    behaviorRef.current = behavior;
    selection.call(behavior);
    return () => { selection.on('.zoom', null); };
  }, []);

  useEffect(() => {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.transform, zoomIdentity);
  }, [continent]);

  const projection = useMemo(() => {
    if (!size.width || !size.height || !countries.length) return null;
    return geoNaturalEarth1().fitExtent([[22, 22], [size.width - 22, size.height - 22]], { type: 'FeatureCollection', features: countries });
  }, [countries, size]);
  const path = useMemo(() => projection ? geoPath(projection) : null, [projection]);
  const graticulePath = path?.(geoGraticule10()) ?? undefined;

  function zoomBy(factor: number) {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.scaleBy, factor);
  }

  function resetZoom() {
    const svg = svgRef.current;
    const behavior = behaviorRef.current;
    if (svg && behavior) select(svg).call(behavior.transform, zoomIdentity);
  }

  return (
    <div className="map-canvas" ref={containerRef}>
      <svg ref={svgRef} className="world-map" aria-label="Countries of the world">
        <g ref={groupRef}>
          {graticulePath && <path className="graticule" d={graticulePath} />}
          {path && countries.map((country, index) => {
            const name = country.properties.ADMIN;
            const answerable = answerableNames.has(name);
            const status = picked === name ? (picked === target ? 'correct' : 'wrong') : locked && target === name ? 'answer' : '';
            return (
              <path
                key={`${name}-${index}`}
                d={path(country) ?? undefined}
                className={`country-shape${status ? ` ${status}` : ''}${locked || !answerable ? ' locked' : ''}${!answerable ? ' unavailable' : ''}`}
                role="button"
                tabIndex={locked || !answerable ? -1 : 0}
                aria-label={name}
                aria-disabled={locked || !answerable}
                onMouseEnter={() => { if (showHoverName) setHoveredName(name); }}
                onMouseLeave={() => setHoveredName('')}
                onFocus={() => { if (showHoverName) setHoveredName(name); }}
                onBlur={() => setHoveredName('')}
                onClick={() => { if (answerable) onPick(country); }}
                onKeyDown={(event) => { if (answerable && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); onPick(country); } }}
              />
            );
          })}
        </g>
      </svg>

      {showHoverName && hoveredName && <div className="country-hover-label" role="status">{hoveredName}</div>}

      {(loading || loadError) && <div className="map-message">{loadError ? 'Could not load map data' : 'Drawing the world…'}</div>}
      {!loading && !loadError && countries.length === 0 && <div className="map-message">No countries in this region</div>}

      <div className="map-tools" aria-label="Map controls">
        <button className="icon-button" onClick={() => zoomBy(1.5)} aria-label="Zoom in" title="Zoom in"><ZoomIn size={17} /></button>
        <button className="icon-button" onClick={() => zoomBy(1 / 1.5)} aria-label="Zoom out" title="Zoom out"><ZoomOut size={17} /></button>
        <span className="tool-divider" />
        <button className="icon-button" onClick={resetZoom} aria-label="Reset map view" title="Reset map view"><Crosshair size={16} /></button>
      </div>
      <div className="map-stamp">ATLAS<br /><span>1 : 50M</span></div>
    </div>
  );
}

export default App;