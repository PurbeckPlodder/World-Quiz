export type TopicQuizQuestion = {
  answer: string;
  fact: string;
  factGroup: string;
  options: string[];
  question: string;
};

type SolarFact = {
  answer: string;
  clue: string;
  fact: string;
  kind: 'planet' | 'moon';
};

const solarFacts: SolarFact[] = [
  { answer: 'Mercury', kind: 'planet', clue: 'closest to the Sun', fact: 'Mercury completes an orbit in just 88 Earth days.' },
  { answer: 'Mercury', kind: 'planet', clue: 'the smallest of the eight planets by diameter', fact: 'Mercury is only slightly larger than Earth’s Moon.' },
  { answer: 'Mercury', kind: 'planet', clue: 'the world whose spin and orbit form a 3:2 resonance', fact: 'Mercury rotates three times for every two trips around the Sun.' },
  { answer: 'Mercury', kind: 'planet', clue: 'a world with an extremely thin exosphere instead of a substantial atmosphere', fact: 'Mercury’s exosphere contains atoms knocked loose from its surface.' },
  { answer: 'Mercury', kind: 'planet', clue: 'a world with water ice preserved in permanently shadowed polar craters', fact: 'Some deep polar craters never receive direct sunlight.' },
  { answer: 'Venus', kind: 'planet', clue: 'the planet with the highest average surface temperature', fact: 'A powerful greenhouse effect makes this world hotter than the one closer to the Sun.' },
  { answer: 'Venus', kind: 'planet', clue: 'the planet that rotates in the opposite direction to most planets', fact: 'Its slow retrograde rotation means the Sun would appear to rise in the west.' },
  { answer: 'Venus', kind: 'planet', clue: 'the world whose single rotation takes longer than its year', fact: 'One rotation takes about 243 Earth days, while one orbit takes about 225.' },
  { answer: 'Venus', kind: 'planet', clue: 'the planet with an atmosphere dominated by carbon dioxide and clouds of sulfuric acid', fact: 'The surface pressure is roughly 92 times the pressure at sea level on Earth.' },
  { answer: 'Venus', kind: 'planet', clue: 'the brightest planet in Earth’s night sky', fact: 'Its thick clouds reflect a large amount of sunlight.' },
  { answer: 'Earth', kind: 'planet', clue: 'the only world where life has been confirmed', fact: 'So far, every known organism lives on this planet.' },
  { answer: 'Earth', kind: 'planet', clue: 'the planet with stable oceans of liquid water on its surface', fact: 'Liquid water covers about 71 percent of its surface.' },
  { answer: 'Earth', kind: 'planet', clue: 'the world whose atmosphere is mostly nitrogen and oxygen', fact: 'Nitrogen makes up about 78 percent of the dry air near the surface.' },
  { answer: 'Earth', kind: 'planet', clue: 'the planet with one large natural satellite', fact: 'Its moon is moving away by a few centimetres each year.' },
  { answer: 'Earth', kind: 'planet', clue: 'the world whose moving outer core generates a global magnetic field', fact: 'The magnetic field helps shield the atmosphere from the solar wind.' },
  { answer: 'Mars', kind: 'planet', clue: 'the planet whose rusty iron-rich dust gives it a reddish appearance', fact: 'Iron minerals on its surface have oxidized, much like rust.' },
  { answer: 'Mars', kind: 'planet', clue: 'the planet home to the solar system’s largest known volcano', fact: 'Olympus Mons rises roughly 22 kilometres above the surrounding plains.' },
  { answer: 'Mars', kind: 'planet', clue: 'the world cut by the vast canyon system called Valles Marineris', fact: 'This canyon system stretches for thousands of kilometres.' },
  { answer: 'Mars', kind: 'planet', clue: 'the planet accompanied by two small natural satellites', fact: 'Its two moons are named Phobos and Deimos.' },
  { answer: 'Mars', kind: 'planet', clue: 'the world where a day lasts about 24 hours and 39 minutes', fact: 'A day on this planet is often called a sol.' },
  { answer: 'Jupiter', kind: 'planet', clue: 'the largest planet in the solar system by both mass and diameter', fact: 'More than 1,300 Earths could fit inside it by volume.' },
  { answer: 'Jupiter', kind: 'planet', clue: 'the planet marked by a centuries-old storm called the Great Red Spot', fact: 'The storm is a vast anticyclone in the planet’s cloud layers.' },
  { answer: 'Jupiter', kind: 'planet', clue: 'the planet with the fastest rotation, completing a spin in about ten hours', fact: 'Its rapid rotation helps create broad bands of clouds and jet streams.' },
  { answer: 'Jupiter', kind: 'planet', clue: 'the world orbited by four large moons discovered by Galileo in 1610', fact: 'The four Galilean moons are Io, Europa, Ganymede, and Callisto.' },
  { answer: 'Jupiter', kind: 'planet', clue: 'the planet whose magnetic field is the strongest of any in the solar system', fact: 'Its magnetosphere extends millions of kilometres into space.' },
  { answer: 'Saturn', kind: 'planet', clue: 'the planet best known for its broad and bright ring system', fact: 'Its rings are made mostly of countless pieces of water ice.' },
  { answer: 'Saturn', kind: 'planet', clue: 'the planet with the lowest average density of the eight planets', fact: 'Its average density is lower than that of liquid water.' },
  { answer: 'Saturn', kind: 'planet', clue: 'the world with a persistent six-sided jet stream around its north pole', fact: 'The hexagonal cloud pattern was first spotted by the Voyager spacecraft.' },
  { answer: 'Saturn', kind: 'planet', clue: 'the planet that takes about 29 and a half Earth years to orbit the Sun', fact: 'Its long year means seasons last more than seven Earth years apiece.' },
  { answer: 'Saturn', kind: 'planet', clue: 'the world with a moon that has stable lakes and seas of liquid hydrocarbons', fact: 'Those lakes and seas are found near the moon’s polar regions.' },
  { answer: 'Uranus', kind: 'planet', clue: 'the world with an axial tilt of about 98 degrees', fact: 'Its extreme tilt makes it appear to roll around the Sun on its side.' },
  { answer: 'Uranus', kind: 'planet', clue: 'the blue-green planet whose atmosphere contains methane', fact: 'Methane absorbs red light, contributing to its blue-green appearance.' },
  { answer: 'Uranus', kind: 'planet', clue: 'the planet that takes about 84 Earth years to complete an orbit', fact: 'It was the first planet discovered with a telescope.' },
  { answer: 'Uranus', kind: 'planet', clue: 'the planet with a major moon whose surface includes the towering Verona Rupes cliff', fact: 'That cliff may be one of the tallest known in the solar system.' },
  { answer: 'Uranus', kind: 'planet', clue: 'the world with a frigid atmosphere that reaches the lowest temperatures measured on a planet', fact: 'Despite being farther away, another giant planet emits more internal heat.' },
  { answer: 'Neptune', kind: 'planet', clue: 'the most distant of the eight planets from the Sun', fact: 'It orbits about 4.5 billion kilometres from the Sun on average.' },
  { answer: 'Neptune', kind: 'planet', clue: 'the world whose year lasts about 165 Earth years', fact: 'It has completed only a little more than one orbit since its discovery in 1846.' },
  { answer: 'Neptune', kind: 'planet', clue: 'the planet where some measured winds exceed 2,000 kilometres per hour', fact: 'Its atmosphere hosts some of the fastest winds recorded on any planet.' },
  { answer: 'Neptune', kind: 'planet', clue: 'the planet whose discovery followed mathematical predictions about an unseen world', fact: 'Astronomers confirmed its position with a telescope in 1846.' },
  { answer: 'Neptune', kind: 'planet', clue: 'the world whose largest moon follows a retrograde orbit', fact: 'The unusual orbit suggests the moon may once have been an independent object.' },
  { answer: "Earth's Moon", kind: 'moon', clue: 'Earth’s only natural satellite and the fifth-largest moon in the solar system', fact: 'It is gradually moving farther from its host planet.' },
  { answer: 'Phobos', kind: 'moon', clue: 'the larger and closer of the two small moons accompanying the red planet', fact: 'Its orbit is slowly shrinking, and it may eventually break apart.' },
  { answer: 'Deimos', kind: 'moon', clue: 'the smaller and more distant of the two moons accompanying the red planet', fact: 'It is only about 12 kilometres across on average.' },
  { answer: 'Io', kind: 'moon', clue: 'the most volcanically active world known', fact: 'Tidal forces from its host planet and neighbouring moons drive its volcanism.' },
  { answer: 'Europa', kind: 'moon', clue: 'an icy world thought to hide a global ocean beneath its crust', fact: 'Its ocean may contain more liquid water than all of Earth’s oceans combined.' },
  { answer: 'Ganymede', kind: 'moon', clue: 'the largest moon in the solar system, even bigger than Mercury', fact: 'It is the only moon known to generate its own intrinsic magnetic field.' },
  { answer: 'Callisto', kind: 'moon', clue: 'a large moon with one of the most heavily cratered surfaces in the solar system', fact: 'Its ancient crust preserves a long record of impacts.' },
  { answer: 'Amalthea', kind: 'moon', clue: 'a small, irregular, reddish moon that orbits close to the largest planet', fact: 'Its reddish colour may come from material originating on a nearby volcanic moon.' },
  { answer: 'Himalia', kind: 'moon', clue: 'the largest member of the irregular outer-moon group around the largest planet', fact: 'It follows a distant orbit far beyond the four famous large moons.' },
  { answer: 'Metis', kind: 'moon', clue: 'a small moon that orbits inside the main rings of the largest planet', fact: 'It is one of that planet’s innermost known moons.' },
  { answer: 'Elara', kind: 'moon', clue: 'one of the largest irregular moons in the distant outer group around the largest planet', fact: 'It belongs to a family of moons with similarly inclined orbits.' },
  { answer: 'Carme', kind: 'moon', clue: 'the namesake of a distant group of moons that orbit in a retrograde direction', fact: 'Its group likely formed from a captured object that broke apart.' },
  { answer: 'Ananke', kind: 'moon', clue: 'the namesake of a distant family of small moons with retrograde orbits', fact: 'The members of its family travel around their planet opposite to its rotation.' },
  { answer: 'Titan', kind: 'moon', clue: 'the only moon with a dense atmosphere and stable surface lakes of liquid methane', fact: 'Its atmosphere is mostly nitrogen, like Earth’s.' },
  { answer: 'Enceladus', kind: 'moon', clue: 'an icy moon that sprays water-rich plumes from fractures near its south pole', fact: 'The plumes reveal a salty subsurface ocean beneath its ice.' },
  { answer: 'Mimas', kind: 'moon', clue: 'a small icy moon marked by the enormous Herschel impact crater', fact: 'The crater is about one-third the diameter of the moon itself.' },
  { answer: 'Iapetus', kind: 'moon', clue: 'a moon with one hemisphere much darker than the other', fact: 'A prominent ridge runs along much of its equator.' },
  { answer: 'Rhea', kind: 'moon', clue: 'the second-largest natural satellite orbiting the ringed planet', fact: 'It is an icy body with a heavily cratered surface.' },
  { answer: 'Dione', kind: 'moon', clue: 'an icy satellite whose trailing hemisphere is crossed by bright wispy fractures', fact: 'The bright features are cliffs and fractures in its icy crust.' },
  { answer: 'Tethys', kind: 'moon', clue: 'an icy satellite crossed by the enormous Ithaca Chasma canyon', fact: 'The chasm stretches for roughly three-quarters of the way around it.' },
  { answer: 'Hyperion', kind: 'moon', clue: 'an irregular, porous moon that tumbles chaotically as it rotates', fact: 'Its sponge-like appearance comes from deep impact craters.' },
  { answer: 'Phoebe', kind: 'moon', clue: 'a distant moon that travels around its planet in a retrograde orbit', fact: 'Its unusual path and composition suggest it may have been captured.' },
  { answer: 'Janus', kind: 'moon', clue: 'a small moon that shares nearly the same orbit as another moon, Epimetheus', fact: 'The two moons exchange orbital positions about every four years.' },
  { answer: 'Miranda', kind: 'moon', clue: 'a small icy world with a cliff called Verona Rupes that may be kilometres high', fact: 'Its surface combines old craters with strikingly young-looking terrain.' },
  { answer: 'Ariel', kind: 'moon', clue: 'the brightest of the five major moons orbiting the tilted ice giant', fact: 'Its surface is crossed by long valleys and fault canyons.' },
  { answer: 'Umbriel', kind: 'moon', clue: 'the darkest of the five major moons orbiting the tilted ice giant', fact: 'A bright ring of material marks the floor of its crater Wunda.' },
  { answer: 'Titania', kind: 'moon', clue: 'the largest natural satellite orbiting the tilted ice giant', fact: 'Its surface shows large canyons and evidence of ancient geological activity.' },
  { answer: 'Oberon', kind: 'moon', clue: 'the second-largest moon orbiting the tilted ice giant, with a heavily cratered surface', fact: 'Some of its craters have dark deposits on their floors.' },
  { answer: 'Puck', kind: 'moon', clue: 'a small, roughly spherical inner moon discovered by Voyager 2', fact: 'It is named after a character in Shakespeare’s A Midsummer Night’s Dream.' },
  { answer: 'Triton', kind: 'moon', clue: 'a large icy moon with a retrograde orbit and active nitrogen geysers', fact: 'Its backwards orbit suggests it was captured by its host planet.' },
  { answer: 'Nereid', kind: 'moon', clue: 'a distant satellite with one of the most eccentric orbits of any large moon', fact: 'Its distance from its host planet varies dramatically over one orbit.' },
  { answer: 'Proteus', kind: 'moon', clue: 'the largest of the inner moons orbiting the most distant planet', fact: 'Despite its size, it was not discovered until Voyager 2 visited the system.' },
  { answer: 'Naiad', kind: 'moon', clue: 'the innermost known moon in the system of the most distant planet', fact: 'Its orbit is strongly affected by resonances with another nearby moon.' },
  { answer: 'Larissa', kind: 'moon', clue: 'an inner moon whose large craters give it an irregular, battered shape', fact: 'It was discovered from Earth before being seen up close by Voyager 2.' },
  { answer: 'Charon', kind: 'moon', clue: 'a large satellite so massive relative to its companion that their shared centre lies outside the larger body', fact: 'The pair are often described as a double dwarf-planet system.' },
  { answer: 'Nix', kind: 'moon', clue: 'a small satellite in the system of the distant dwarf planet that rotates chaotically', fact: 'It is one of the small moons discovered with the Hubble Space Telescope.' },
  { answer: 'Hydra', kind: 'moon', clue: 'the outermost of the five known moons in the same dwarf-planet system', fact: 'Its surface is highly reflective and rich in water ice.' },
  { answer: 'Dysnomia', kind: 'moon', clue: 'the known moon orbiting the dwarf planet Eris', fact: 'Its orbit helped astronomers estimate the mass of its host.' },
  { answer: "Hi'iaka", kind: 'moon', clue: 'the largest known moon of the dwarf planet Haumea', fact: 'Its surface spectrum shows abundant water ice.' },
];

const planets = [...new Set(solarFacts.filter((item) => item.kind === 'planet').map((item) => item.answer))];
const moons = [...new Set(solarFacts.filter((item) => item.kind === 'moon').map((item) => item.answer))];

function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
}

function buildChoices(answer: string, pool: string[]) {
  return shuffle([answer, ...shuffle([...new Set(pool)].filter((option) => option !== answer)).slice(0, 3)]);
}

const solarSystemQuestions: TopicQuizQuestion[] = solarFacts.flatMap((item, index) => {
  const prompts = [
    `Which ${item.kind} matches this clue: ${item.clue}?`,
    `Name the ${item.kind} described here: ${item.clue}.`,
    `What is the ${item.kind} associated with this fact: ${item.clue}?`,
    `Select the ${item.kind} identified by this description: ${item.clue}.`,
  ];
  const pool = item.kind === 'planet' ? planets : moons;
  return prompts.map((question) => ({
    answer: item.answer,
    fact: item.fact,
    factGroup: `solar-${index}`,
    options: buildChoices(item.answer, pool),
    question,
  }));
});

type RiverFact = {
  city: string;
  continent: string;
  country: string;
  id: string;
  name: string;
  water: string;
};

const rivers: RiverFact[] = [
  { id: 'nile', name: 'Nile', continent: 'Africa', country: 'Egypt', water: 'Mediterranean Sea', city: 'Cairo' },
  { id: 'amazon', name: 'Amazon', continent: 'South America', country: 'Peru', water: 'Atlantic Ocean', city: 'Iquitos' },
  { id: 'yangtze', name: 'Yangtze', continent: 'Asia', country: 'China', water: 'East China Sea', city: 'Wuhan' },
  { id: 'mississippi', name: 'Mississippi', continent: 'North America', country: 'United States', water: 'Gulf of Mexico', city: 'New Orleans' },
  { id: 'yenisei', name: 'Yenisei', continent: 'Asia', country: 'Russia', water: 'Kara Sea', city: 'Krasnoyarsk' },
  { id: 'yellow', name: 'Yellow River', continent: 'Asia', country: 'China', water: 'Bohai Sea', city: 'Lanzhou' },
  { id: 'congo', name: 'Congo', continent: 'Africa', country: 'Democratic Republic of the Congo', water: 'Atlantic Ocean', city: 'Kinshasa' },
  { id: 'mekong', name: 'Mekong', continent: 'Asia', country: 'Cambodia', water: 'South China Sea', city: 'Phnom Penh' },
  { id: 'ganges', name: 'Ganges', continent: 'Asia', country: 'India', water: 'Bay of Bengal', city: 'Varanasi' },
  { id: 'brahmaputra', name: 'Brahmaputra', continent: 'Asia', country: 'India', water: 'Bay of Bengal', city: 'Guwahati' },
  { id: 'danube', name: 'Danube', continent: 'Europe', country: 'Hungary', water: 'Black Sea', city: 'Budapest' },
  { id: 'volga', name: 'Volga', continent: 'Europe', country: 'Russia', water: 'Caspian Sea', city: 'Volgograd' },
  { id: 'rhine', name: 'Rhine', continent: 'Europe', country: 'Germany', water: 'North Sea', city: 'Cologne' },
  { id: 'seine', name: 'Seine', continent: 'Europe', country: 'France', water: 'English Channel', city: 'Paris' },
  { id: 'thames', name: 'Thames', continent: 'Europe', country: 'United Kingdom', water: 'North Sea', city: 'London' },
  { id: 'po', name: 'Po', continent: 'Europe', country: 'Italy', water: 'Adriatic Sea', city: 'Turin' },
  { id: 'tigris', name: 'Tigris', continent: 'Asia', country: 'Iraq', water: 'Shatt al-Arab', city: 'Baghdad' },
  { id: 'euphrates', name: 'Euphrates', continent: 'Asia', country: 'Iraq', water: 'Shatt al-Arab', city: 'Ramadi' },
  { id: 'indus', name: 'Indus', continent: 'Asia', country: 'Pakistan', water: 'Arabian Sea', city: 'Sukkur' },
  { id: 'lena', name: 'Lena', continent: 'Asia', country: 'Russia', water: 'Laptev Sea', city: 'Yakutsk' },
  { id: 'ob', name: 'Ob', continent: 'Asia', country: 'Russia', water: 'Kara Sea', city: 'Novosibirsk' },
  { id: 'amur', name: 'Amur', continent: 'Asia', country: 'Russia', water: 'Sea of Okhotsk', city: 'Khabarovsk' },
  { id: 'irrawaddy', name: 'Irrawaddy', continent: 'Asia', country: 'Myanmar', water: 'Andaman Sea', city: 'Mandalay' },
  { id: 'salween', name: 'Salween', continent: 'Asia', country: 'Myanmar', water: 'Andaman Sea', city: 'Mawlamyine' },
  { id: 'chao-phraya', name: 'Chao Phraya', continent: 'Asia', country: 'Thailand', water: 'Gulf of Thailand', city: 'Bangkok' },
  { id: 'red-river', name: 'Red River', continent: 'Asia', country: 'Vietnam', water: 'Gulf of Tonkin', city: 'Hanoi' },
  { id: 'pearl', name: 'Pearl River', continent: 'Asia', country: 'China', water: 'South China Sea', city: 'Guangzhou' },
  { id: 'kura', name: 'Kura', continent: 'Asia', country: 'Georgia', water: 'Caspian Sea', city: 'Tbilisi' },
  { id: 'tarim', name: 'Tarim', continent: 'Asia', country: 'China', water: 'Taitema Lake', city: 'Alar' },
  { id: 'dnieper', name: 'Dnieper', continent: 'Europe', country: 'Ukraine', water: 'Black Sea', city: 'Kyiv' },
  { id: 'tocantins', name: 'Tocantins', continent: 'South America', country: 'Brazil', water: 'Pará River', city: 'Marabá' },
  { id: 'dniester', name: 'Dniester', continent: 'Europe', country: 'Moldova', water: 'Black Sea', city: 'Tiraspol' },
  { id: 'vistula', name: 'Vistula', continent: 'Europe', country: 'Poland', water: 'Baltic Sea', city: 'Warsaw' },
  { id: 'elbe', name: 'Elbe', continent: 'Europe', country: 'Germany', water: 'North Sea', city: 'Hamburg' },
  { id: 'loire', name: 'Loire', continent: 'Europe', country: 'France', water: 'Atlantic Ocean', city: 'Nantes' },
  { id: 'tagus', name: 'Tagus', continent: 'Europe', country: 'Portugal', water: 'Atlantic Ocean', city: 'Lisbon' },
  { id: 'ebro', name: 'Ebro', continent: 'Europe', country: 'Spain', water: 'Mediterranean Sea', city: 'Zaragoza' },
  { id: 'tiber', name: 'Tiber', continent: 'Europe', country: 'Italy', water: 'Tyrrhenian Sea', city: 'Rome' },
  { id: 'douro', name: 'Douro', continent: 'Europe', country: 'Portugal', water: 'Atlantic Ocean', city: 'Porto' },
  { id: 'oder', name: 'Oder', continent: 'Europe', country: 'Poland', water: 'Baltic Sea', city: 'Wrocław' },
  { id: 'orinoco', name: 'Orinoco', continent: 'South America', country: 'Venezuela', water: 'Atlantic Ocean', city: 'Ciudad Bolívar' },
  { id: 'parana', name: 'Paraná', continent: 'South America', country: 'Argentina', water: 'Río de la Plata', city: 'Rosario' },
  { id: 'paraguay', name: 'Paraguay', continent: 'South America', country: 'Paraguay', water: 'Paraná River', city: 'Asunción' },
  { id: 'sao-francisco', name: 'São Francisco', continent: 'South America', country: 'Brazil', water: 'Atlantic Ocean', city: 'Petrolina' },
  { id: 'magdalena', name: 'Magdalena', continent: 'South America', country: 'Colombia', water: 'Caribbean Sea', city: 'Honda' },
  { id: 'uruguay', name: 'Uruguay', continent: 'South America', country: 'Uruguay', water: 'Río de la Plata', city: 'Salto' },
  { id: 'colorado', name: 'Colorado', continent: 'North America', country: 'United States', water: 'Gulf of California', city: 'Yuma' },
  { id: 'rio-grande', name: 'Rio Grande', continent: 'North America', country: 'United States', water: 'Gulf of Mexico', city: 'El Paso' },
  { id: 'columbia', name: 'Columbia', continent: 'North America', country: 'United States', water: 'Pacific Ocean', city: 'The Dalles' },
  { id: 'st-lawrence', name: 'St. Lawrence', continent: 'North America', country: 'Canada', water: 'Gulf of St. Lawrence', city: 'Montreal' },
  { id: 'yukon', name: 'Yukon', continent: 'North America', country: 'Canada', water: 'Bering Sea', city: 'Dawson City' },
  { id: 'mackenzie', name: 'Mackenzie', continent: 'North America', country: 'Canada', water: 'Beaufort Sea', city: 'Inuvik' },
  { id: 'fraser', name: 'Fraser', continent: 'North America', country: 'Canada', water: 'Strait of Georgia', city: 'Prince George' },
  { id: 'saskatchewan', name: 'Saskatchewan', continent: 'North America', country: 'Canada', water: 'Lake Winnipeg', city: 'Saskatoon' },
  { id: 'zambezi', name: 'Zambezi', continent: 'Africa', country: 'Mozambique', water: 'Indian Ocean', city: 'Tete' },
  { id: 'niger', name: 'Niger', continent: 'Africa', country: 'Niger', water: 'Gulf of Guinea', city: 'Niamey' },
  { id: 'orange', name: 'Orange', continent: 'Africa', country: 'South Africa', water: 'Atlantic Ocean', city: 'Upington' },
  { id: 'limpopo', name: 'Limpopo', continent: 'Africa', country: 'Mozambique', water: 'Indian Ocean', city: 'Xai-Xai' },
  { id: 'senegal', name: 'Senegal', continent: 'Africa', country: 'Senegal', water: 'Atlantic Ocean', city: 'Saint-Louis' },
  { id: 'okavango', name: 'Okavango', continent: 'Africa', country: 'Namibia', water: 'Okavango Delta', city: 'Rundu' },
];

const continents = [...new Set(rivers.map((river) => river.continent))];
const countries = [...new Set(rivers.map((river) => river.country))];
const riverNames = rivers.map((river) => river.name);
const riverCities = rivers.map((river) => river.city);
const riverMouths = [...new Set(rivers.map((river) => river.water))];

const riverQuestions: TopicQuizQuestion[] = rivers.flatMap((river) => {
  const countryQuestion = river.country.toLowerCase().includes(river.name.toLowerCase())
    ? `Which country contains the city of ${river.city}?`
    : `In which country is ${river.city}, which stands on the ${river.name}?`;
  const questions = [
    { answer: river.continent, pool: continents, question: `On which continent is ${river.city}, a city on the ${river.name}?` },
    { answer: river.country, pool: countries, question: countryQuestion },
    { answer: river.water, pool: riverMouths, question: river.id === 'colorado'
      ? 'Into which gulf did the Colorado River historically flow?'
      : `Which named destination receives the waters of the ${river.name}?` },
    { answer: river.city, pool: riverCities, question: `Which city lies on the course of the ${river.name}?` },
    { answer: river.name, pool: riverNames, question: `Which river runs through ${river.city}?` },
  ];
  return questions.map((item) => ({
    answer: item.answer,
    fact: `The ${river.name} is a major waterway in ${river.continent}; its waters reach the ${river.water}.`,
    factGroup: river.id,
    options: buildChoices(item.answer, item.pool),
    question: item.question,
  }));
});

function buildRound(pool: TopicQuizQuestion[], count: number) {
  const groups = new Map<string, TopicQuizQuestion[]>();
  for (const question of pool) {
    const group = groups.get(question.factGroup) ?? [];
    group.push(question);
    groups.set(question.factGroup, group);
  }
  return shuffle([...groups.values()])
    .slice(0, count)
    .map((group) => {
      const question = shuffle(group)[0];
      return { ...question, options: shuffle(question.options) };
    });
}

export const solarSystemQuestionCount = solarSystemQuestions.length;
export const riverQuestionCount = riverQuestions.length;

export function createSolarSystemRound() {
  return buildRound(solarSystemQuestions, 25);
}

export function createRiversRound() {
  return buildRound(riverQuestions, 25);
}
