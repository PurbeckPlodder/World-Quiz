import { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10, geoTransform } from 'd3-geo';
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
type CountyProperties = { shapeName: string; shapeID?: string };
type CountyFeature = Feature<Geometry, CountyProperties>;
type CountryMetadata = { cca2: string; cca3: string; capital?: string[] };
type QuestionMode = 'name' | 'flag' | 'capital' | 'outline';
type QuizMode = QuestionMode | 'twenty' | 'matchup' | 'counties';
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
const ukCountiesUrl = 'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/GBR/ADM2/geoBoundaries-GBR-ADM2_simplified.geojson';

function shuffle<T>(items: T[]) {
  const shuffledItems = [...items];
  for (let index = shuffledItems.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffledItems[index], shuffledItems[swapIndex]] = [shuffledItems[swapIndex], shuffledItems[index]];
  }
  return shuffledItems;
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
  const latitudes = positions.map(([longitude, latitude]) => mercatorY(latitude));
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

function CountyQuiz() {
  const containerRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    const controller = new AbortController();
    fetch(ukCountiesUrl, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('UK county boundary request failed');
        return response.json() as Promise<FeatureCollection<Geometry, CountyProperties>>;
      })
      .then((collection) => {
        const features = collection.features
          .filter((feature): feature is CountyFeature => Boolean(feature.properties?.shapeName))
          .map(correctCountyWinding);
        if (!features.length) throw new Error('UK county boundary data is empty');
        setCounties(features);
        setTarget(features[Math.floor(Math.random() * features.length)].properties.shapeName);
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

  const path = useMemo(() => {
    if (!size.width || !size.height || !counties.length) return null;
    const projection = countyProjection(counties, size.width, size.height);
    return geoPath(projection);
  }, [counties, size]);

  function answer(county: CountyFeature) {
    if (picked || !target) return;
    const answerName = county.properties.shapeName;
    setPicked(answerName);
    setHoveredName('');
    setTotal((value) => value + 1);
    if (answerName === target) setScore((value) => value + 1);
    timer.current = window.setTimeout(() => {
      setTarget((currentTarget) => {
        const options = counties.filter((feature) => feature.properties.shapeName !== currentTarget);
        return options[Math.floor(Math.random() * options.length)]?.properties.shapeName ?? currentTarget;
      });
      setPicked('');
    }, 750);
  }

  function resetScore() {
    window.clearTimeout(timer.current);
    setScore(0);
    setTotal(0);
    setPicked('');
    setTarget(counties[Math.floor(Math.random() * counties.length)]?.properties.shapeName ?? '');
  }

  const accuracy = total ? Math.round((score / total) * 100) : 0;

  return (
    <div className="county-quiz">
      <div className="map-heading">
        <div><span className="map-kicker">ENGLAND · SCOTLAND · WALES · NORTHERN IRELAND</span><span className="map-title">United Kingdom counties</span></div>
        <button className="icon-button reset-button" onClick={resetScore} title="Reset county score" aria-label="Reset county score"><RotateCcw size={15} /></button>
      </div>
      <div className="county-question" aria-live="polite">
        <span className="map-kicker">FIND THIS COUNTY OR LOCAL AREA</span>
        <h2>{loading ? 'Loading county boundaries…' : loadError ? 'County map unavailable' : target || 'Preparing the map'}</h2>
        <span className="county-score">{score} / {total} correct · {accuracy}% accuracy</span>
      </div>
      <div className="map-canvas county-map-canvas" ref={containerRef}>
        <svg className="world-map" aria-label="Interactive map of United Kingdom counties and local areas">
          {path && counties.map((county, index) => {
            const name = county.properties.shapeName;
            const isPicked = name === picked;
            const status = isPicked ? (picked === target ? 'correct' : 'wrong') : picked && name === target ? 'answer' : '';
            return (
              <path
                key={county.properties.shapeID ?? `${name}-${index}`}
                d={path(county) ?? undefined}
                className={`country-shape county-shape${status ? ` ${status}` : ''}${picked ? ' locked' : ''}`}
                role="button"
                tabIndex={picked ? -1 : 0}
                aria-label={name}
                aria-disabled={Boolean(picked)}
                onMouseEnter={() => { if (!picked) setHoveredName(name); }}
                onMouseLeave={() => setHoveredName('')}
                onFocus={() => { if (!picked) setHoveredName(name); }}
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
        </svg>
        {hoveredName && !picked && <div className="country-hover-label" role="status">{hoveredName}</div>}
        {(loading || loadError) && <div className="map-message" role={loadError ? 'alert' : 'status'}>{loadError ? 'Could not load UK county boundaries. Please try again later.' : 'Loading county boundaries…'}</div>}
        <div className="map-stamp">ATLAS<br /><span>UK LOCAL AREAS</span></div>
      </div>
      <div className="map-caption"><span><i className="legend-dot" />SELECT A COUNTY ON THE MAP</span><span>BOUNDARIES: GEOBOUNDARIES / OGL 3.0</span></div>
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
  const questionMode: QuestionMode = currentQuestion?.mode ?? (quizMode === 'twenty' || quizMode === 'matchup' || quizMode === 'counties' ? 'name' : quizMode);
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
        <aside className={`quiz-panel${questionMode === 'outline' ? ' outline-quiz-panel' : ''}${quizMode === 'twenty' ? ' challenge-quiz-panel' : ''}${quizMode === 'matchup' ? ' matchup-quiz-panel' : ''}${quizMode === 'counties' ? ' counties-quiz-panel' : ''}`}>
          <div className="eyebrow"><span>01</span> &nbsp;COUNTRY STUDY</div>
          <div className="question-block" aria-live="polite">
            <div className="question-label">
              {quizMode === 'counties' ? 'UK COUNTIES' : quizMode === 'matchup' ? 'MATCHUP' : quizMode === 'twenty' ? <><span>20 QUESTION CHALLENGE</span><span role="timer" className={`challenge-clock${timeRemaining <= 10 ? ' urgent' : ''}`} aria-label={`${timeRemaining} seconds remaining`}>{`${String(Math.floor(timeRemaining / 60)).padStart(2, '0')}:${String(timeRemaining % 60).padStart(2, '0')}`}</span></> : 'YOUR NEXT DESTINATION'}
            </div>
            {quizMode === 'twenty' && <div className="challenge-progress">QUESTION {Math.min(questionIndex + 1, 20)} / 20 <span>{activeContinent.toUpperCase()}</span></div>}
            <h1>{quizMode === 'counties' ? 'Explore the counties' : quizMode === 'matchup' ? matchupFinished ? 'All matched!' : 'Match the clues' : loading ? 'Preparing the atlas' : loadError ? 'Map unavailable' : quizMode === 'twenty' && challengeFinished ? timeRemaining === 0 ? "Time's up" : 'Challenge complete' : target ? questionMode === 'name' ? <>Find <em>{target}</em></> : questionMode === 'capital' ? <>Find the country with capital <em>{targetMetadata?.capital?.[0]}</em></> : questionMode === 'outline' ? 'Name this outline' : 'Identify this flag' : 'No countries found'}</h1>
            {questionMode === 'flag' && targetMetadata?.cca2 && <img className="flag-clue" src={`https://flagcdn.com/w320/${targetMetadata.cca2.toLowerCase()}.png`} alt="Flag clue" />}
            <p className="instruction">{quizMode === 'counties' ? 'Select the county or local area named on the map.' : quizMode === 'matchup' ? matchupFinished ? `Completed in ${formatElapsedTime(matchupElapsedSeconds)}.` : 'Line up all five clues for each of the ten countries.' : quizMode === 'twenty' && challengeFinished ? `You scored ${score} of 20.` : loading ? 'Loading country borders…' : loadError ? 'The map data could not be reached.' : metadataError && (questionMode === 'flag' || questionMode === 'capital') ? 'Flag and capital clues could not be loaded.' : picked ? (isCorrect ? 'Exactly right. Nice work.' : `That was ${picked}. The answer is ${target}.`) : !target && !metadataLoading && questionMode !== 'name' ? `No ${questionMode} clues are available for this region.` : ''}</p>
          </div>

          <section className="quiz-settings" aria-label="Quiz options">
            <div className="section-heading"><span>CLUE TYPE</span></div>
            <div className="mode-options" role="group" aria-label="Choose a quiz clue">
              {(['name', 'flag', 'capital', 'outline', 'twenty', 'matchup', 'counties'] as const).map((mode) => (
                <button key={mode} className={`mode-option${quizMode === mode ? ' selected' : ''}`} onClick={() => changeMode(mode)} aria-pressed={quizMode === mode} disabled={((mode === 'flag' || mode === 'capital') && (metadataLoading || metadataError)) || ((mode === 'twenty' || mode === 'matchup') && (loading || metadataLoading || metadataError))}>
                  {mode === 'name' ? 'Name' : mode === 'flag' ? 'Flag' : mode === 'capital' ? 'Capital' : mode === 'outline' ? 'Outline' : mode === 'twenty' ? '20 Questions' : mode === 'matchup' ? 'Matchup' : 'UK Counties'}
                </button>
              ))}
            </div>
            {quizMode !== 'matchup' && quizMode !== 'counties' && <label className="hover-toggle"><input type="checkbox" checked={showHoverName} onChange={(event) => setShowHoverName(event.target.checked)} />Show country name on hover</label>}
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

          {quizMode !== 'matchup' && quizMode !== 'counties' && <section className="region-section" aria-labelledby="region-title">
            <div className="section-heading"><span id="region-title">{quizMode === 'twenty' ? 'REGION · AUTO' : 'REGION'}</span><span className="region-count">{String(continents.indexOf(activeContinent) + 1).padStart(2, '0')} / 08</span></div>
            <div className="region-grid" role="group" aria-label="Choose a region">
              {continents.map((region) => (
                <button key={region} className={`region-option${region === activeContinent ? ' selected' : ''}`} onClick={() => setContinent(region)} aria-pressed={region === activeContinent} disabled={quizMode === 'twenty'}>
                  <span>{region}</span><span className="region-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>}

          {quizMode !== 'counties' && <section className="score-section" aria-label="Quiz score">
            <div className="section-heading"><span>{quizMode === 'matchup' ? 'MATCHED ROWS' : 'SESSION SCORE'}</span>{quizMode !== 'matchup' && <button className="icon-button reset-button" onClick={resetScore} title="Reset score" aria-label="Reset score"><RotateCcw size={15} /></button>}</div>
            <div className="score-row"><strong>{quizMode === 'matchup' ? correctMatchupRows : score}<span> / {quizMode === 'matchup' ? 10 : total}</span></strong>{quizMode === 'matchup' ? <span className="accuracy">ROWS</span> : <span className="accuracy">{accuracy}%<small> ACCURACY</small></span>}</div>
            <div className="score-track" aria-hidden="true"><span style={{ width: `${quizMode === 'matchup' ? correctMatchupRows * 10 : accuracy}%` }} /></div>
          </section>}

          <div className="panel-footer"><Crosshair size={15} /><span>Every answer is a new bearing.</span></div>
        </aside>

        <section className={`map-section${quizMode === 'matchup' ? ' matchup-section' : ''}${quizMode === 'counties' ? ' county-map-section' : ''}`} aria-label={quizMode === 'matchup' ? 'Matchup game' : quizMode === 'counties' ? 'United Kingdom counties quiz' : 'Interactive world map'}>
          {quizMode === 'counties' ? (
            <CountyQuiz />
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