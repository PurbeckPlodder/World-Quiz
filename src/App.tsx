import { useEffect, useMemo, useRef, useState } from 'react';
import { geoNaturalEarth1, geoPath, geoGraticule10 } from 'd3-geo';
import { select } from 'd3-selection';
import { zoom, zoomIdentity, type ZoomBehavior } from 'd3-zoom';
import { Crosshair, Globe2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import type { Feature, FeatureCollection, Geometry } from 'geojson';

type CountryProperties = {
  ADMIN: string;
  CONTINENT: string;
};

type Country = Feature<Geometry, CountryProperties>;
type Continent = 'World' | 'Africa' | 'Asia' | 'Europe' | 'North America' | 'South America' | 'Oceania' | 'Antarctica';

const continents: Continent[] = ['World', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Antarctica'];
const countriesUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson';

function randomCountry(features: Country[], exclude?: string) {
  const choices = features.filter((feature) => feature.properties.ADMIN !== exclude);
  return choices[Math.floor(Math.random() * choices.length)] ?? features[0];
}

function App() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [continent, setContinent] = useState<Continent>('World');
  const [target, setTarget] = useState('');
  const [picked, setPicked] = useState('');
  const [locked, setLocked] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const timer = useRef<number | undefined>(undefined);

  const activeCountries = useMemo(
    () => continent === 'World' ? countries : countries.filter((country) => country.properties.CONTINENT === continent),
    [countries, continent],
  );

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
    window.clearTimeout(timer.current);
    setLocked(false);
    setPicked('');
    setTarget(activeCountries.length ? randomCountry(activeCountries)?.properties.ADMIN ?? '' : '');
    return () => window.clearTimeout(timer.current);
  }, [activeCountries]);

  function answer(country: Country) {
    if (locked || !target) return;
    const answerName = country.properties.ADMIN;
    setPicked(answerName);
    setLocked(true);
    setTotal((value) => value + 1);
    if (answerName === target) setScore((value) => value + 1);

    timer.current = window.setTimeout(() => {
      setTarget(randomCountry(activeCountries, target)?.properties.ADMIN ?? '');
      setPicked('');
      setLocked(false);
    }, 1000);
  }

  function resetScore() {
    setScore(0);
    setTotal(0);
    setPicked('');
    setLocked(false);
    window.clearTimeout(timer.current);
    setTarget(randomCountry(activeCountries)?.properties.ADMIN ?? '');
  }

  const isCorrect = picked === target && Boolean(picked);
  const accuracy = total ? Math.round((score / total) * 100) : 0;

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
        <aside className="quiz-panel">
          <div className="eyebrow"><span>01</span> &nbsp;COUNTRY STUDY</div>
          <div className="question-block" aria-live="polite">
            <div className="question-label">YOUR NEXT DESTINATION</div>
            <h1>{loading ? 'Preparing the atlas' : loadError ? 'Map unavailable' : target ? <>Find <em>{target}</em></> : 'No countries found'}</h1>
            <p className="instruction">{loading ? 'Loading country borders…' : loadError ? 'The map data could not be reached.' : picked ? (isCorrect ? 'Exactly right. Nice work.' : `That was ${picked}. The answer is ${target}.`) : 'Select the highlighted destination on the map.'}</p>
          </div>

          <section className="region-section" aria-labelledby="region-title">
            <div className="section-heading"><span id="region-title">REGION</span><span className="region-count">{String(continents.indexOf(continent) + 1).padStart(2, '0')} / 08</span></div>
            <div className="region-grid" role="group" aria-label="Choose a region">
              {continents.map((region) => (
                <button key={region} className={`region-option${region === continent ? ' selected' : ''}`} onClick={() => setContinent(region)} aria-pressed={region === continent}>
                  <span>{region}</span><span className="region-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          <section className="score-section" aria-label="Quiz score">
            <div className="section-heading"><span>SESSION SCORE</span><button className="icon-button reset-button" onClick={resetScore} title="Reset score" aria-label="Reset score"><RotateCcw size={15} /></button></div>
            <div className="score-row"><strong>{score}<span> / {total}</span></strong><span className="accuracy">{accuracy}%<small> ACCURACY</small></span></div>
            <div className="score-track" aria-hidden="true"><span style={{ width: `${accuracy}%` }} /></div>
          </section>

          <div className="panel-footer"><Crosshair size={15} /><span>Every answer is a new bearing.</span></div>
        </aside>

        <section className="map-section" aria-label="Interactive world map">
          <div className="map-heading"><div><span className="map-kicker">THE WORLD, ONE COUNTRY AT A TIME</span><span className="map-title">{continent === 'World' ? 'World map' : continent}</span></div><div className="map-coordinates">50° N&nbsp; / &nbsp;20° E</div></div>
          <MapView
            countries={activeCountries}
            continent={continent}
            target={target}
            picked={picked}
            locked={locked}
            loading={loading}
            loadError={loadError}
            onPick={answer}
          />
          <div className="map-caption"><span><i className="legend-dot" />COUNTRY BORDERS</span><span>SCROLL TO EXPLORE</span></div>
        </section>
      </div>
    </main>
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
  onPick: (country: Country) => void;
};

function MapView({ countries, continent, target, picked, locked, loading, loadError, onPick }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const groupRef = useRef<SVGGElement>(null);
  const behaviorRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

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
            const status = picked === name ? (picked === target ? 'correct' : 'wrong') : locked && target === name ? 'answer' : '';
            return (
              <path
                key={`${name}-${index}`}
                d={path(country) ?? undefined}
                className={`country-shape${status ? ` ${status}` : ''}${locked ? ' locked' : ''}`}
                role="button"
                tabIndex={locked ? -1 : 0}
                aria-label={name}
                onClick={() => onPick(country)}
                onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onPick(country); } }}
              ><title>{name}</title></path>
            );
          })}
        </g>
      </svg>

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