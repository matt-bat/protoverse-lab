import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  Copy,
  Download,
  FastForward,
  FolderOpen,
  Pause,
  Play,
  RefreshCcw,
  Save,
  Shuffle,
  SkipForward,
  Trash2,
  Upload
} from "lucide-react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import {
  DEFAULT_PARAMS,
  ELEMENT_FAMILY_TRAITS,
  PARAM_LIMITS,
  SPECIES_TRAITS,
  SPEEDS,
  UniverseSimulation,
  clamp,
  makeSeed,
  normalizeParams,
  type Diagnosis,
  type SimEvent,
  type SimParams,
  type SimStats,
  type SimSummary,
  type ElementFamilyId,
  type SpeciesId
} from "./simulation";

type Tab = "run" | "params" | "library" | "timeline";
type RenderMode = "species" | "elements" | "composition" | "density" | "temperature" | "metallicity" | "habitability";
type PresetKey = "balanced" | "gentle" | "dense" | "diffuse" | "chaotic";

type SavedSeed = {
  id: string;
  seed: string;
  title: string;
  description: string;
  createdAt: string;
  params: SimParams;
  outcome: SimSummary;
};

type ParamDef = {
  key: keyof SimParams;
  label: string;
  step: number;
  suffix: string;
  group: "Physical-ish" | "Sandbox" | "Engine";
  tooltip: string;
};

const STORAGE_KEY = "cosmic-seed-sim.library.v2";
const APP_NAME = "Protoverse Lab";
const DENSITY_GRID_SIZE = 10;
const DENSITY_CELL_COUNT = DENSITY_GRID_SIZE * DENSITY_GRID_SIZE * DENSITY_GRID_SIZE;

const particleVertexShader = `
attribute float aSize;
attribute float aAlpha;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vColor = color;
  vAlpha = aAlpha;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = aSize * (180.0 / max(24.0, -mvPosition.z));
  gl_Position = projectionMatrix * mvPosition;
}
`;

const particleFragmentShader = `
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec2 uv = gl_PointCoord - vec2(0.5);
  float radius = length(uv);
  if (radius > 0.5) discard;
  float core = smoothstep(0.5, 0.06, radius);
  float halo = smoothstep(0.5, 0.0, radius) * 0.34;
  gl_FragColor = vec4(vColor * (0.55 + core * 0.7), (core + halo) * vAlpha);
}
`;

const PRESETS: Record<PresetKey, Partial<SimParams>> = {
  balanced: {},
  gentle: {
    expansionRate: 0.42,
    initialTemperature: 0.68,
    exoticShare: 0.65,
    isotopeInstability: 0.24,
    coolingEfficiency: 0.72,
    gasRetention: 0.82,
    massiveStarFraction: 0.18,
    catastropheRate: 0.16,
    lifeProbability: 0.44
  },
  dense: {
    matterDensity: 0.98,
    expansionRate: 0.32,
    baryonShare: 1.24,
    neutralShare: 1.16,
    seedMetalShare: 1.18,
    darkMatterStrength: 0.92,
    gravityStrength: 0.9,
    fluctuationAmplitude: 0.72,
    catastropheRate: 0.42
  },
  diffuse: {
    matterDensity: 0.34,
    expansionRate: 0.9,
    radiantShare: 1.18,
    baryonShare: 0.76,
    primordialTraceElements: 0.18,
    darkMatterStrength: 0.32,
    gasRetention: 0.36,
    fluctuationAmplitude: 0.18,
    coolingEfficiency: 0.42
  },
  chaotic: {
    turbulence: 0.82,
    fluctuationAmplitude: 0.86,
    exoticShare: 1.55,
    isotopeInstability: 0.74,
    primordialTraceElements: 0.68,
    gravityStrength: 1.12,
    supernovaYield: 0.98,
    metalDispersal: 0.92,
    catastropheRate: 0.58,
    massiveStarFraction: 0.42
  }
};

const PARAM_DEFS: ParamDef[] = [
  { key: "universeSizeLy", label: "Universe size", step: 100, suffix: "ly", group: "Physical-ish", tooltip: "Sets the simulated pocket-universe width in light years. Larger spaces spread packets out more." },
  { key: "totalMassSolar", label: "Total mass", step: 100000000, suffix: "Msun", group: "Physical-ish", tooltip: "Total mass represented by the packet field, measured in rough solar-mass units." },
  { key: "particleCount", label: "Particle packets", step: 1000, suffix: "", group: "Engine", tooltip: "Number of coarse packets in the simulation. More packets give finer structure but cost more CPU and GPU time." },
  { key: "expansionRate", label: "Expansion rate", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How strongly packets drift outward before gravity and retention slow them down." },
  { key: "initialTemperature", label: "Initial heat", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Starting thermal energy. Hotter runs stay diffuse longer and delay clustering." },
  { key: "matterDensity", label: "Matter density", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Overall matter crowding. Higher density makes star formation and enrichment more likely." },
  { key: "radiationDensity", label: "Radiation balance", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Radiation pressure in the early field. More radiation resists collapse and keeps regions hot." },
  { key: "radiantShare", label: "Radiant packet share", step: 0.01, suffix: "x", group: "Physical-ish", tooltip: "Relative amount of radiation-like packets in the starting mix." },
  { key: "baryonShare", label: "Baryon packet share", step: 0.01, suffix: "x", group: "Physical-ish", tooltip: "Relative amount of ordinary matter packets that can cool, cluster, and form stars." },
  { key: "neutralShare", label: "Neutral packet share", step: 0.01, suffix: "x", group: "Physical-ish", tooltip: "Relative amount of slow neutral packets that help gas clouds settle." },
  { key: "leptonShare", label: "Lepton packet share", step: 0.01, suffix: "x", group: "Physical-ish", tooltip: "Relative amount of light charged haze that affects cooling and local temperature." },
  { key: "seedMetalShare", label: "Trace heavy seed share", step: 0.01, suffix: "x", group: "Sandbox", tooltip: "Starting heavy-element hints. Raising this gives chemistry a head start before supernovae." },
  { key: "exoticShare", label: "Exotic packet share", step: 0.01, suffix: "x", group: "Sandbox", tooltip: "Relative amount of unstable exotic packets that can stir unusual enrichment paths." },
  { key: "isotopeInstability", label: "Isotope instability", step: 0.01, suffix: "", group: "Sandbox", tooltip: "How often variant packets behave like unstable isotopes and push material toward enrichment events." },
  { key: "primordialTraceElements", label: "Primordial trace elements", step: 0.01, suffix: "", group: "Sandbox", tooltip: "Small early traces of element-family material present before stars do most of the work." },
  { key: "darkMatterStrength", label: "Dark matter wells", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Strength of invisible gravity wells that help matter gather without directly becoming stars." },
  { key: "fluctuationAmplitude", label: "Density fluctuations", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Size of the early uneven spots that seed galaxies, clusters, and void-like regions." },
  { key: "turbulence", label: "Initial turbulence", step: 0.01, suffix: "", group: "Sandbox", tooltip: "Random early motion. More turbulence creates messier structure and can disrupt collapse." },
  { key: "gravityStrength", label: "Gravity strength", step: 0.01, suffix: "", group: "Sandbox", tooltip: "How strongly nearby dense regions pull packets together." },
  { key: "coolingEfficiency", label: "Cooling efficiency", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How quickly hot gas-like packets lose energy and become able to cluster." },
  { key: "gasRetention", label: "Gas retention", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How well the universe keeps matter from escaping the useful simulation volume." },
  { key: "starFormationThreshold", label: "Star threshold", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How dense and cool a region needs to be before packets can become star-forming." },
  { key: "massiveStarFraction", label: "Massive star fraction", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "Share of star formation that becomes short-lived massive stars, driving faster supernova enrichment." },
  { key: "supernovaYield", label: "Element yield", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How much enriched element-family material each supernova spreads into nearby packets." },
  { key: "metalDispersal", label: "Metal dispersal", step: 0.01, suffix: "", group: "Physical-ish", tooltip: "How far heavy elements spread after enrichment events." },
  { key: "planetSensitivity", label: "Planet sensitivity", step: 0.01, suffix: "", group: "Sandbox", tooltip: "How readily enriched stable regions become rocky-world candidates." },
  { key: "lifeProbability", label: "Life probability", step: 0.01, suffix: "", group: "Sandbox", tooltip: "How strongly stable rocky regions turn into habitability candidates." },
  { key: "catastropheRate", label: "Catastrophe rate", step: 0.01, suffix: "", group: "Sandbox", tooltip: "How often disruptive events reduce habitability or scatter developed regions." }
];

const TAB_TOOLTIPS: Record<Tab, string> = {
  run: "Run controls, live outcome, packet mix, and high-level metrics.",
  params: "Seed and starting-condition controls for generating a new universe.",
  library: "Saved seeds stored in this browser, with import and export tools.",
  timeline: "Major simulation events recorded during the current run."
};

const RENDER_MODE_TOOLTIPS: Record<RenderMode, string> = {
  species: "Colors packets by their proto-particle species.",
  elements: "Colors enriched packets by their periodic-table-inspired family.",
  composition: "Blends species, stars, and enriched material into one view.",
  density: "Shows crowded regions brighter and warmer.",
  temperature: "Shows hotter regions in warmer colors and cooler regions in blue-green.",
  metallicity: "Highlights areas with heavier element-family enrichment.",
  habitability: "Highlights stable enriched regions that could support rocky worlds or life potential."
};

const PRESET_TOOLTIPS: Record<PresetKey, string> = {
  balanced: "A middle-ground dwarf-galaxy run with stable enrichment odds.",
  gentle: "Lower chaos and better retention, useful for slower habitability development.",
  dense: "Matter-rich conditions that collapse and enrich quickly.",
  diffuse: "Spread-out conditions that make star formation harder.",
  chaotic: "High turbulence, exotic matter, and disruption for unusual outcomes."
};

const METRIC_TOOLTIPS: Record<string, string> = {
  Age: "Elapsed simulation time in the current run.",
  Actual: "Measured simulation speed after frame-budget limits are applied.",
  Limiter: "The active speed limiter keeping the browser responsive.",
  Stars: "Packets currently or previously flagged as star-forming regions.",
  "Active stars": "Star packets still burning instead of already spent or exploded.",
  Supernovae: "Recorded stellar explosions that spread enriched material.",
  "Rocky worlds": "Stable enriched regions counted as rocky-planet candidates.",
  Habitables: "Rocky or enriched regions that reached the life-potential threshold.",
  "Star yield": "Share of all packets that became star-forming.",
  "Active ratio": "Share of star packets that are still active.",
  "Rocky ratio": "Share of all packets counted as rocky-world candidates.",
  "Life potential": "Share of all packets counted as habitability candidates.",
  Metallicity: "Average heavy-element enrichment across the packet field.",
  "Enriched matter": "Share of packets assigned to non-primordial element families.",
  "Element complexity": "Average complexity of the element-family mix.",
  Density: "Average local packet crowding.",
  Heat: "Average packet temperature after cooling and energetic events.",
  "Matter share": "Share of packets that are not radiation-like.",
  "Escaped mass": "Estimated share of mass that has drifted outside the useful simulation volume.",
  "Dominant species": "Most common proto-particle species in the current packet mix.",
  "Dominant family": "Most common enriched element family in the current packet mix."
};

const LEGEND_TOOLTIPS: Record<string, string> = {
  "Primordial matter": "Matter-like packets before strong enrichment.",
  Radiation: "Radiation-like packets that resist early collapse.",
  "Lepton haze": "Light charged packets that influence cooling and heat.",
  "Star packet": "Packets that reached star-forming conditions.",
  "Enriched metals": "Packets carrying heavier element-family material."
};

const emptyStats: SimStats = {
  stars: 0,
  activeStars: 0,
  supernovae: 0,
  averageMetallicity: 0,
  averageDensity: 0,
  averageTemp: 0,
  habitableCandidates: 0,
  rockyPlanets: 0,
  escapedMassFraction: 0,
  speciesCounts: {
    radiant: 0,
    baryon: 0,
    neutral: 0,
    lepton: 0,
    seedMetal: 0,
    exotic: 0
  },
  elementFamilyCounts: {
    primordial: 0,
    alkaliLike: 0,
    alkalineEarthLike: 0,
    transitionLike: 0,
    metalloidLike: 0,
    nonmetalLike: 0,
    halogenLike: 0,
    nobleLike: 0,
    lanthanideLike: 0,
    actinideLike: 0
  },
  averageElementComplexity: 0
};

const initialDiagnosis: Diagnosis = {
  title: "Primordial cooling",
  description: "Generate or run a seed to see its development path."
};

export function App() {
  const [tab, setTab] = useState<Tab>("run");
  const [seed, setSeed] = useState(makeSeed);
  const [params, setParams] = useState<SimParams>(() => normalizeParams(DEFAULT_PARAMS));
  const [preset, setPreset] = useState<PresetKey>("balanced");
  const [speedIndex, setSpeedIndex] = useState(0);
  const [renderMode, setRenderMode] = useState<RenderMode>("composition");
  const [library, setLibrary] = useState<SavedSeed[]>(loadLibrary);
  const [toast, setToast] = useState("");
  const [summary, setSummary] = useState<SimSummary>(() => new UniverseSimulation(seed, params).getSummary());

  const simRef = useRef(new UniverseSimulation(seed, params));
  const fileRef = useRef<HTMLInputElement>(null);

  const showStatus = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const regenerate = useCallback((nextSeed: string, nextParams: SimParams) => {
    const cleanSeed = nextSeed.trim() || makeSeed();
    const normalized = normalizeParams(nextParams);
    simRef.current = new UniverseSimulation(cleanSeed, normalized);
    setSeed(cleanSeed);
    setParams(normalized);
    setSpeedIndex(0);
    setSummary(simRef.current.getSummary());
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)) return;
      if (event.code === "Space") {
        event.preventDefault();
        setSpeedIndex((value) => (value === 0 ? 1 : 0));
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setSpeedIndex((value) => clamp(value + 1, 0, SPEEDS.length - 1));
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setSpeedIndex((value) => clamp(value - 1, 0, SPEEDS.length - 1));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
    } catch {
      showStatus("Storage is full or unavailable. Export seeds before closing.");
    }
  }, [library, showStatus]);

  useEffect(() => {
    const id = window.setInterval(() => setSummary(simRef.current.getSummary()), 180);
    return () => window.clearInterval(id);
  }, []);

  const saveCurrent = () => {
    const current = simRef.current.getSummary();
    const existing = library.find((item) => item.seed === current.seed);
    const record: SavedSeed = {
      id: existing?.id ?? crypto.randomUUID(),
      seed: current.seed,
      title: existing?.title ?? titleFromSeed(current.seed),
      description: existing?.description ?? summarizeOutcome(current),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      params: current.params,
      outcome: current
    };
    setLibrary((items) => [record, ...items.filter((item) => item.id !== record.id)].slice(0, 80));
    showStatus("Seed saved.");
  };

  const exportLibrary = () => {
    const blob = new Blob(
      [JSON.stringify({ app: "cosmic-seed-sim", version: 2, exportedAt: new Date().toISOString(), seeds: library }, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cosmic-seed-library-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showStatus(`Exported ${library.length} seed${library.length === 1 ? "" : "s"}.`);
  };

  const importLibrary = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const incoming = sanitizeLibrary(Array.isArray(parsed) ? parsed : parsed.seeds);
      setLibrary((items) => [...incoming, ...items].slice(0, 80));
      showStatus(`Imported ${incoming.length} seed${incoming.length === 1 ? "" : "s"}.`);
    } catch {
      showStatus("Import failed. Choose a valid seed library JSON file.");
    }
  };

  const loadSavedSeed = (item: SavedSeed) => {
    regenerate(item.seed, item.params);
    showStatus("Seed loaded.");
  };

  const speciesMix = getSpeciesMix(summary.stats.speciesCounts, summary.params.particleCount);
  const elementMix = getElementMix(summary.stats.elementFamilyCounts, summary.params.particleCount);
  const metrics = makeMetrics(summary, speciesMix, elementMix);

  return (
    <main className="app-shell">
      <section className="viewport" aria-label="Cosmic simulation viewport">
        <UniverseCanvas
          key={`${summary.seed}-${summary.params.particleCount}`}
          simRef={simRef}
          speedTarget={SPEEDS[speedIndex].target}
          renderMode={renderMode}
          onSummary={setSummary}
        />
        <div className="topbar">
          <div>
            <h1>{APP_NAME}</h1>
            <p>Dwarf-galaxy pocket universe / {summary.params.particleCount.toLocaleString()} packets</p>
          </div>
          <div className="readouts" aria-label="Simulation readouts">
            <Readout label="Age" value={formatAge(summary.ageMyr)} tooltip={METRIC_TOOLTIPS.Age} />
            <Readout label="Actual" value={`${Math.round(simRef.current.actualSpeed).toLocaleString()}x`} tooltip={METRIC_TOOLTIPS.Actual} />
            <Readout label="Limiter" value={simRef.current.limiter} tooltip={METRIC_TOOLTIPS.Limiter} />
          </div>
        </div>
        <div className="legend">
          <Legend color="#7ee7bf" label="Primordial matter" tooltip={LEGEND_TOOLTIPS["Primordial matter"]} />
          <Legend color="#5bc9ff" label="Radiation" tooltip={LEGEND_TOOLTIPS.Radiation} />
          <Legend color="#c49bff" label="Lepton haze" tooltip={LEGEND_TOOLTIPS["Lepton haze"]} />
          <Legend color="#f6d36c" label="Star packet" tooltip={LEGEND_TOOLTIPS["Star packet"]} />
          <Legend color="#ffb24a" label="Enriched metals" tooltip={LEGEND_TOOLTIPS["Enriched metals"]} />
        </div>
      </section>

      <aside className="panel" aria-label="Simulation controls">
        <nav className="tabs" aria-label="Control sections" role="tablist">
          {(["run", "params", "library", "timeline"] as Tab[]).map((item) => (
            <button
              key={item}
              className={tab === item ? "tab active has-tooltip" : "tab has-tooltip"}
              role="tab"
              aria-selected={tab === item}
              onClick={() => setTab(item)}
              data-tooltip={TAB_TOOLTIPS[item]}
              title={TAB_TOOLTIPS[item]}
            >
              {item}
            </button>
          ))}
        </nav>

        {tab === "run" && (
          <section className="tabpane active" role="tabpanel">
            <div className="control-row">
              <IconButton icon={speedIndex === 0 ? Play : Pause} label={speedIndex === 0 ? "Play" : "Pause"} tooltip="Start or pause the simulation. Space does the same thing." primary onClick={() => setSpeedIndex(speedIndex === 0 ? 1 : 0)} />
              <IconButton
                icon={SkipForward}
                label="Step"
                tooltip="Advance the simulation by one controlled step without playing continuously."
                onClick={() => {
                  simRef.current.step(1, 0.8);
                  setSummary(simRef.current.getSummary());
                }}
              />
              <IconButton icon={RefreshCcw} label="Reset" tooltip="Restart the current seed with the current parameters." onClick={() => regenerate(seed, params)} />
            </div>
            <label className="field has-tooltip" data-tooltip="Controls target simulation speed. Max mode runs as fast as the frame budget allows." title="Controls target simulation speed. Max mode runs as fast as the frame budget allows.">
              <span>Simulation speed</span>
              <input type="range" min="0" max={SPEEDS.length - 1} value={speedIndex} onChange={(event) => setSpeedIndex(Number(event.target.value))} />
              <output>{SPEEDS[speedIndex].label}</output>
            </label>
            <label className="field has-tooltip" data-tooltip={RENDER_MODE_TOOLTIPS[renderMode]} title={RENDER_MODE_TOOLTIPS[renderMode]}>
              <span>Render mode</span>
              <select value={renderMode} onChange={(event) => setRenderMode(event.target.value as RenderMode)}>
                <option value="species">Species</option>
                <option value="elements">Element families</option>
                <option value="composition">Composition</option>
                <option value="density">Density</option>
                <option value="temperature">Temperature</option>
                <option value="metallicity">Metallicity</option>
                <option value="habitability">Habitability</option>
              </select>
            </label>
            <div className="diagnostic has-tooltip" data-tooltip="Plain-language summary of the current run's dominant outcome." title="Plain-language summary of the current run's dominant outcome.">
              <span>Outcome</span>
              <strong>{summary.diagnosis.title}</strong>
              <p>{summary.diagnosis.description}</p>
            </div>
            <div className="metric-grid">
              {metrics.map(([label, value]) => (
                <Readout key={label} label={String(label)} value={typeof value === "number" ? value.toLocaleString() : String(value)} tooltip={METRIC_TOOLTIPS[String(label)]} />
              ))}
            </div>
            <div className="species-panel has-tooltip" data-tooltip="Current distribution of proto-particle packet species." title="Current distribution of proto-particle packet species.">
              <span>Particle species</span>
              {speciesMix.map((item) => (
                <div className="species-row has-tooltip" key={item.id} data-tooltip={`${item.label}: ${item.count.toLocaleString()} packets, ${item.percent}% of the field.`} title={`${item.label}: ${item.count.toLocaleString()} packets, ${item.percent}% of the field.`}>
                  <i className="dot" style={{ background: item.color }} />
                  <strong>{item.label}</strong>
                  <em>{item.percent}%</em>
                </div>
              ))}
            </div>
            <div className="species-panel has-tooltip" data-tooltip="Element-family mix produced by enrichment, loosely mirrored from periodic-table behavior." title="Element-family mix produced by enrichment, loosely mirrored from periodic-table behavior.">
              <span>Periodic-table mirror</span>
              {elementMix.map((item) => (
                <div className="species-row has-tooltip" key={item.id} data-tooltip={`${item.label}: ${item.percent}% of packets. Mirrors ${item.mirror}.`} title={`${item.label}: ${item.percent}% of packets. Mirrors ${item.mirror}.`}>
                  <i className="dot" style={{ background: item.color }} />
                  <strong>{item.label}</strong>
                  <em>{item.percent}%</em>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === "params" && (
          <section className="tabpane active" role="tabpanel">
            <div className="seed-row">
              <label className="field has-tooltip" data-tooltip="The deterministic seed. Same seed plus same parameters gives the same universe." title="The deterministic seed. Same seed plus same parameters gives the same universe.">
                <span>Seed</span>
                <input value={seed} onChange={(event) => setSeed(event.target.value)} autoComplete="off" />
              </label>
              <IconButton icon={Shuffle} label="New" tooltip="Create a fresh random seed without changing the parameters yet." onClick={() => setSeed(makeSeed())} />
            </div>
            <label className="field has-tooltip" data-tooltip={PRESET_TOOLTIPS[preset]} title={PRESET_TOOLTIPS[preset]}>
              <span>Preset</span>
              <select
                value={preset}
                onChange={(event) => {
                  const nextPreset = event.target.value as PresetKey;
                  setPreset(nextPreset);
                  setParams(normalizeParams({ ...DEFAULT_PARAMS, ...PRESETS[nextPreset] }));
                }}
              >
                <option value="balanced">Balanced dwarf galaxy</option>
                <option value="gentle">Gentle enrichment</option>
                <option value="dense">Dense fast-collapse</option>
                <option value="diffuse">Diffuse starved field</option>
                <option value="chaotic">Chaotic sandbox</option>
              </select>
            </label>
            <div className="param-list">
              {PARAM_DEFS.map((def) => (
                <ParamSlider key={def.key} def={def} value={params[def.key]} onChange={(value) => setParams((current) => normalizeParams({ ...current, [def.key]: value }))} />
              ))}
            </div>
            <button className="primary full has-tooltip" onClick={() => regenerate(seed, params)} data-tooltip="Build a new universe from the current seed and parameter values." title="Build a new universe from the current seed and parameter values.">
              <FastForward size={16} /> Generate Universe
            </button>
          </section>
        )}

        {tab === "library" && (
          <section className="tabpane active" role="tabpanel">
            <div className="library-actions">
              <IconButton icon={Save} label="Save" tooltip="Save the current seed, parameters, and outcome in this browser." primary onClick={saveCurrent} />
              <IconButton icon={Copy} label="Fork" tooltip="Create a related seed from the current one and regenerate it." onClick={() => regenerate(`${seed}-fork-${Math.floor(Math.random() * 999)}`, params)} />
              <IconButton icon={Download} label="Export" tooltip="Download the saved seed library as a JSON backup." onClick={exportLibrary} />
              <IconButton icon={Upload} label="Import" tooltip="Import a previously exported seed library JSON file." onClick={() => fileRef.current?.click()} />
              <IconButton
                icon={Trash2}
                label="Clear"
                tooltip="Remove all locally saved seeds from this browser."
                onClick={() => {
                  if (!library.length) return showStatus("Seed library is already empty.");
                  if (window.confirm("Clear the entire local seed library? Export first if you need a backup.")) setLibrary([]);
                }}
              />
              <input ref={fileRef} className="visually-hidden" type="file" accept="application/json,.json" onChange={(event) => importLibrary(event.target.files?.[0])} />
            </div>
            <div className="seed-list">
              {library.length === 0 && <article className="seed-card"><p>No saved seeds yet. Save the current universe to add it here.</p></article>}
              {library.map((item) => (
                <article key={item.id} className={item.seed === summary.seed ? "seed-card active" : "seed-card"}>
                  <header>
                    <div>
                      <input className="title-input" value={item.title} onChange={(event) => updateSavedSeed(item.id, { title: event.target.value }, setLibrary)} title="Edit this saved seed title." />
                      <p>{item.seed} / {formatAge(item.outcome.ageMyr)} / {item.outcome.diagnosis.title}</p>
                    </div>
                  </header>
                  <textarea value={item.description} onChange={(event) => updateSavedSeed(item.id, { description: event.target.value }, setLibrary)} title="Edit notes for this saved seed." />
                  <div className="seed-actions">
                    <button className="has-tooltip" data-tooltip="Load this saved seed and its parameters into the simulator." title="Load this saved seed and its parameters into the simulator." onClick={() => loadSavedSeed(item)}><FolderOpen size={15} /> Load</button>
                    <button className="has-tooltip" data-tooltip="Duplicate this saved seed entry in the library." title="Duplicate this saved seed entry in the library." onClick={() => setLibrary((items) => [{ ...item, id: crypto.randomUUID(), seed: `${item.seed}-copy`, title: `${item.title} Copy` }, ...items])}><Copy size={15} /> Copy</button>
                    <button className="has-tooltip" data-tooltip="Delete this saved seed from local storage." title="Delete this saved seed from local storage." onClick={() => window.confirm(`Delete "${item.title}" from the seed library?`) && setLibrary((items) => items.filter((entry) => entry.id !== item.id))}><Trash2 size={15} /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {tab === "timeline" && (
          <section className="tabpane active" role="tabpanel">
            <div className="timeline">
              {summary.events.map((event) => <TimelineEvent key={`${event.title}-${event.ageMyr}`} event={event} />)}
            </div>
          </section>
        )}
      </aside>
      <div className={toast ? "status-toast visible" : "status-toast"} role="status" aria-live="polite">{toast}</div>
    </main>
  );
}

function UniverseCanvas({
  simRef,
  speedTarget,
  renderMode,
  onSummary
}: {
  simRef: React.MutableRefObject<UniverseSimulation>;
  speedTarget: number;
  renderMode: RenderMode;
  onSummary: (summary: SimSummary) => void;
}) {
  const interactionRef = useRef(0);
  return (
    <Canvas
      camera={{ position: [0, 0, 92], fov: 58 }}
      className="universe-canvas"
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onPointerDown={() => { interactionRef.current = performance.now(); }}
      onWheel={() => { interactionRef.current = performance.now(); }}
    >
      <color attach="background" args={["#05070a"]} />
      <SimulationRenderer simRef={simRef} speedTarget={speedTarget} renderMode={renderMode} onSummary={onSummary} interactionRef={interactionRef} />
      <gridHelper args={[120, 12, "#1f2933", "#101820"]} position={[0, -52, 0]} />
      <axesHelper args={[24]} />
      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan
        enableZoom
        zoomSpeed={0.85}
        panSpeed={0.9}
        rotateSpeed={0.65}
        minDistance={10}
        maxDistance={260}
      />
    </Canvas>
  );
}

function SimulationRenderer({
  simRef,
  speedTarget,
  renderMode,
  onSummary,
  interactionRef
}: {
  simRef: React.MutableRefObject<UniverseSimulation>;
  speedTarget: number;
  renderMode: RenderMode;
  onSummary: (summary: SimSummary) => void;
  interactionRef: React.MutableRefObject<number>;
}) {
  const { camera, controls } = useThree();
  const geometryRef = useRef<THREE.BufferGeometry>(null);
  const highlightGeometryRef = useRef<THREE.BufferGeometry>(null);
  const densityGeometryRef = useRef<THREE.BufferGeometry>(null);
  const maxParticles = simRef.current.params.particleCount;
  const positions = useMemo(() => new Float32Array(maxParticles * 3), [maxParticles]);
  const colors = useMemo(() => new Float32Array(maxParticles * 3), [maxParticles]);
  const sizes = useMemo(() => new Float32Array(maxParticles), [maxParticles]);
  const alphas = useMemo(() => new Float32Array(maxParticles), [maxParticles]);
  const highlightCapacity = useMemo(() => Math.max(512, Math.min(6000, Math.ceil(maxParticles * 0.16))), [maxParticles]);
  const highlightPositions = useMemo(() => new Float32Array(highlightCapacity * 3), [highlightCapacity]);
  const highlightColors = useMemo(() => new Float32Array(highlightCapacity * 3), [highlightCapacity]);
  const highlightSizes = useMemo(() => new Float32Array(highlightCapacity), [highlightCapacity]);
  const highlightAlphas = useMemo(() => new Float32Array(highlightCapacity), [highlightCapacity]);
  const densityPositions = useMemo(() => new Float32Array(DENSITY_CELL_COUNT * 3), []);
  const densityColors = useMemo(() => new Float32Array(DENSITY_CELL_COUNT * 3), []);
  const densitySizes = useMemo(() => new Float32Array(DENSITY_CELL_COUNT), []);
  const densityAlphas = useMemo(() => new Float32Array(DENSITY_CELL_COUNT), []);
  const densityMass = useMemo(() => new Float32Array(DENSITY_CELL_COUNT), []);
  const densityMetal = useMemo(() => new Float32Array(DENSITY_CELL_COUNT), []);
  const color = useMemo(() => new THREE.Color(), []);
  const staticColors = useMemo(() => makeStaticColorCache(), []);
  const bounds = useMemo(() => new THREE.Sphere(new THREE.Vector3(0, 0, 0), 92), []);
  const particleMaterial = useMemo(() => makeParticleMaterial(0.88), []);
  const highlightMaterial = useMemo(() => makeParticleMaterial(0.92), []);
  const densityMaterial = useMemo(() => makeParticleMaterial(0.3), []);
  
  const speedRef = useRef(speedTarget);
  const modeRef = useRef(renderMode);
  const lastSummary = useRef(0);
  const lastRenderedAge = useRef(-1);
  const lastRenderedMode = useRef<RenderMode | null>(null);
  const stepAccumulator = useRef(0);
  const visualAccumulator = useRef(0);
  const renderAccumulator = useRef(0);
  const densityAccumulator = useRef(1);
  const lastFrameTune = useRef(16);

  useEffect(() => { speedRef.current = speedTarget; }, [speedTarget]);
  useEffect(() => { modeRef.current = renderMode; }, [renderMode]);
  useEffect(() => {
    if (geometryRef.current) {
      geometryRef.current.boundingSphere = bounds;
    }
    if (highlightGeometryRef.current) {
      highlightGeometryRef.current.boundingSphere = bounds;
    }
    if (densityGeometryRef.current) {
      densityGeometryRef.current.boundingSphere = bounds;
    }
  }, [bounds]);

  useFrame((state, delta) => {
    lastFrameTune.current = lastFrameTune.current * 0.92 + delta * 1000 * 0.08;
    const sim = simRef.current;
    const cappedDelta = Math.min(delta, 0.08);
    const count = sim.params.particleCount;
    const targetStepSeconds = 1 / 30;
    const targetRenderSeconds = 1 / 30;
    visualAccumulator.current = Math.min(visualAccumulator.current + cappedDelta, 1 / 30);
    renderAccumulator.current += cappedDelta;
    densityAccumulator.current += cappedDelta;
    if (speedRef.current > 0) {
      stepAccumulator.current += cappedDelta;
      if (stepAccumulator.current >= targetStepSeconds) {
        sim.step(speedRef.current, Math.min(stepAccumulator.current, targetStepSeconds * 1.2));
        stepAccumulator.current = 0;
        visualAccumulator.current = 0;
      }
    } else {
      stepAccumulator.current = 0;
      visualAccumulator.current = 0;
      renderAccumulator.current = targetRenderSeconds;
      sim.step(0, cappedDelta);
    }
    const mode = modeRef.current;
    const shouldAnimateVisuals = speedRef.current > 0 && visualAccumulator.current > 0;
    const modeChanged = lastRenderedMode.current !== mode;
    const ageChanged = lastRenderedAge.current !== sim.ageMyr;
    const shouldRenderTick = renderAccumulator.current >= targetRenderSeconds;
    if (!modeChanged && !ageChanged && !shouldRenderTick && !shouldAnimateVisuals) {
      return;
    }
    if (!modeChanged && !ageChanged && !shouldRenderTick) {
      return;
    }
    renderAccumulator.current = 0;
    
    if (geometryRef.current) {
      const pCount = sim.particles.length;
      const stride = computeRenderStride(pCount, lastFrameTune.current);
      let drawIndex = 0;
      let highlightIndex = 0;
      let radiusMax = 0;
      const updateDensity = modeChanged || densityAccumulator.current >= 0.16;
      if (updateDensity) {
        densityAccumulator.current = 0;
        densityMass.fill(0);
        densityMetal.fill(0);
      }

      for (let i = 0; i < pCount; i += 1) {
        const p = sim.particles[i];
        const driftScale = shouldAnimateVisuals ? Math.min(visualAccumulator.current, 1 / 30) * 18 : 0;
        const visualX = clamp(p.x + p.vx * driftScale, 0.002, 0.998);
        const visualY = clamp(p.y + p.vy * driftScale, 0.002, 0.998);
        const visualZ = clamp(p.z + p.vz * driftScale, 0.002, 0.998);
        const x = (visualX - 0.5) * 100;
        const y = (visualY - 0.5) * 100;
        const z = (visualZ - 0.5) * 100;
        const radius = Math.sqrt(x * x + y * y + z * z);
        if (radius > radiusMax) radiusMax = radius;
        if (updateDensity) {
          accumulateDensity(p, densityMass, densityMetal);
        }

        if (p.star || p.metallicity > 0.08 || p.habitability > 0.15) {
          if (highlightIndex < highlightCapacity) {
            highlightPositions[highlightIndex * 3] = x;
            highlightPositions[highlightIndex * 3 + 1] = y;
            highlightPositions[highlightIndex * 3 + 2] = z;
            writeColor3D(p, mode, color, staticColors);
            if (p.star) color.lerp(staticColors.star, 0.72);
            highlightColors[highlightIndex * 3] = color.r;
            highlightColors[highlightIndex * 3 + 1] = color.g;
            highlightColors[highlightIndex * 3 + 2] = color.b;
            highlightSizes[highlightIndex] = p.star ? 5.4 : 3.4 + p.metallicity * 5.5 + p.habitability * 4;
            highlightAlphas[highlightIndex] = p.star ? 0.95 : clamp(0.28 + p.metallicity * 1.6 + p.habitability * 0.5, 0.25, 0.78);
            highlightIndex += 1;
          }
        }

        if (i % stride !== 0) continue;
        
        positions[drawIndex * 3] = x;
        positions[drawIndex * 3 + 1] = y;
        positions[drawIndex * 3 + 2] = z;
        
        writeColor3D(p, mode, color, staticColors);
        colors[drawIndex * 3] = color.r;
        colors[drawIndex * 3 + 1] = color.g;
        colors[drawIndex * 3 + 2] = color.b;
        sizes[drawIndex] = p.star ? 3.6 : p.kind === "radiation" ? 1.15 : 1.55 + clamp(p.density, 0, 1.8) * 0.36;
        alphas[drawIndex] = p.kind === "radiation" ? 0.52 : 0.66;
        drawIndex += 1;
      }

      const densityCount = updateDensity
        ? writeDensityOverlay(densityMass, densityMetal, densityPositions, densityColors, densitySizes, densityAlphas)
        : densityGeometryRef.current?.drawRange.count ?? 0;
      
      const positionAttr = geometryRef.current.getAttribute("position");
      const colorAttr = geometryRef.current.getAttribute("color");
      const sizeAttr = geometryRef.current.getAttribute("aSize");
      const alphaAttr = geometryRef.current.getAttribute("aAlpha");
      geometryRef.current.setDrawRange(0, drawIndex);
      positionAttr.needsUpdate = true;
      colorAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
      alphaAttr.needsUpdate = true;
      geometryRef.current.boundingSphere = bounds;

      if (highlightGeometryRef.current) {
        highlightGeometryRef.current.setDrawRange(0, highlightIndex);
        highlightGeometryRef.current.getAttribute("position").needsUpdate = true;
        highlightGeometryRef.current.getAttribute("color").needsUpdate = true;
        highlightGeometryRef.current.getAttribute("aSize").needsUpdate = true;
        highlightGeometryRef.current.getAttribute("aAlpha").needsUpdate = true;
        highlightGeometryRef.current.boundingSphere = bounds;
      }

      if (densityGeometryRef.current && updateDensity) {
        densityGeometryRef.current.setDrawRange(0, densityCount);
        densityGeometryRef.current.getAttribute("position").needsUpdate = true;
        densityGeometryRef.current.getAttribute("color").needsUpdate = true;
        densityGeometryRef.current.getAttribute("aSize").needsUpdate = true;
        densityGeometryRef.current.getAttribute("aAlpha").needsUpdate = true;
        densityGeometryRef.current.boundingSphere = bounds;
      }

      if (performance.now() - interactionRef.current > 2500 && radiusMax > 1) {
        const desiredDistance = clamp(radiusMax * 2.15, 58, 128);
        const currentDistance = camera.position.length();
        camera.position.setLength(THREE.MathUtils.lerp(currentDistance, desiredDistance, 0.018));
        const orbitControls = controls as { update?: () => void } | undefined;
        orbitControls?.update?.();
      }
    }
    lastRenderedAge.current = sim.ageMyr;
    lastRenderedMode.current = mode;
    
    if (state.clock.elapsedTime * 1000 - lastSummary.current > 180) {
      onSummary(sim.getSummary());
      lastSummary.current = state.clock.elapsedTime * 1000;
    }
  });

  return (
    <>
    <points renderOrder={1}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[alphas, 1]} />
      </bufferGeometry>
      <primitive attach="material" object={particleMaterial} />
    </points>
    <points renderOrder={0}>
      <bufferGeometry ref={densityGeometryRef}>
        <bufferAttribute attach="attributes-position" args={[densityPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[densityColors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[densitySizes, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[densityAlphas, 1]} />
      </bufferGeometry>
      <primitive attach="material" object={densityMaterial} />
    </points>
    <points renderOrder={2}>
      <bufferGeometry ref={highlightGeometryRef}>
        <bufferAttribute attach="attributes-position" args={[highlightPositions, 3]} />
        <bufferAttribute attach="attributes-color" args={[highlightColors, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[highlightSizes, 1]} />
        <bufferAttribute attach="attributes-aAlpha" args={[highlightAlphas, 1]} />
      </bufferGeometry>
      <primitive attach="material" object={highlightMaterial} />
    </points>
    </>
  );
}

function makeParticleMaterial(opacity: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    opacity
  });
}

function computeRenderStride(count: number, frameMs: number): number {
  const target = frameMs > 30 ? 9_000 : frameMs > 22 ? 13_000 : 18_000;
  return Math.max(1, Math.ceil(count / target));
}

function accumulateDensity(p: UniverseSimulation["particles"][number], mass: Float32Array, metal: Float32Array): void {
  const gx = clamp(Math.floor(p.x * DENSITY_GRID_SIZE), 0, DENSITY_GRID_SIZE - 1);
  const gy = clamp(Math.floor(p.y * DENSITY_GRID_SIZE), 0, DENSITY_GRID_SIZE - 1);
  const gz = clamp(Math.floor(p.z * DENSITY_GRID_SIZE), 0, DENSITY_GRID_SIZE - 1);
  const index = gz * DENSITY_GRID_SIZE * DENSITY_GRID_SIZE + gy * DENSITY_GRID_SIZE + gx;
  const weight = p.kind === "radiation" ? 0.32 : 1;
  mass[index] += p.density * weight;
  metal[index] += p.metallicity * weight;
}

function writeDensityOverlay(
  mass: Float32Array,
  metal: Float32Array,
  positions: Float32Array,
  colors: Float32Array,
  sizes: Float32Array,
  alphas: Float32Array
): number {
  let count = 0;
  const size = DENSITY_GRID_SIZE;
  const sizeSq = size * size;
  for (let i = 0; i < mass.length; i += 1) {
    const value = mass[i];
    if (value < 1.2) continue;
    const z = Math.floor(i / sizeSq);
    const y = Math.floor((i - z * sizeSq) / size);
    const x = i - z * sizeSq - y * size;
    positions[count * 3] = ((x + 0.5) / size - 0.5) * 100;
    positions[count * 3 + 1] = ((y + 0.5) / size - 0.5) * 100;
    positions[count * 3 + 2] = ((z + 0.5) / size - 0.5) * 100;
    const intensity = clamp(value / 38, 0, 1);
    const enrichment = clamp(metal[i] / Math.max(1, value) * 16, 0, 1);
    colors[count * 3] = 0.14 + enrichment * 0.55 + intensity * 0.12;
    colors[count * 3 + 1] = 0.48 + intensity * 0.22;
    colors[count * 3 + 2] = 0.62 + enrichment * 0.18;
    sizes[count] = 8 + intensity * 24;
    alphas[count] = 0.025 + intensity * 0.12;
    count += 1;
  }
  return count;
}

function makeStaticColorCache(): Record<string, THREE.Color> {
  const colors: Record<string, THREE.Color> = {
    star: new THREE.Color("#fff2a6")
  };
  (Object.keys(SPECIES_TRAITS) as SpeciesId[]).forEach((id) => {
    colors[`species:${id}`] = new THREE.Color(SPECIES_TRAITS[id].color);
  });
  (Object.keys(ELEMENT_FAMILY_TRAITS) as ElementFamilyId[]).forEach((id) => {
    colors[`element:${id}`] = new THREE.Color(ELEMENT_FAMILY_TRAITS[id].color);
  });
  return colors;
}

function writeColor3D(
  p: UniverseSimulation["particles"][number],
  mode: RenderMode,
  out: THREE.Color,
  staticColors: Record<string, THREE.Color>
): void {
  if (mode === "species") {
    out.copy(staticColors[`species:${p.species}`]);
    applyVariantTint(out, p.variant);
    return;
  }
  if (mode === "elements") {
    out.copy(staticColors[`element:${p.elementFamily}`]);
    applyVariantTint(out, p.variant);
    return;
  }
  if (mode === "density") {
    const v = clamp(p.density / 1.5, 0, 1);
    out.setRGB(0.18 + v * 0.82, 0.24 + v * 0.62, 0.58 - v * 0.3);
    return;
  }
  if (mode === "temperature") {
    const v = clamp(p.temp / 1.5, 0, 1);
    out.setRGB(0.16 + v * 0.84, 0.38 + Math.sin(v * Math.PI) * 0.38, 0.9 - v * 0.72);
    return;
  }
  if (mode === "metallicity") {
    const v = clamp(p.metallicity * 8, 0, 1);
    out.setRGB(0.22 + v * 0.78, 0.38 + v * 0.28, 0.78 - v * 0.54);
    return;
  }
  if (mode === "habitability") {
    const v = clamp(p.habitability, 0, 1);
    out.setRGB(0.22 + v * 0.1, 0.38 + v * 0.58, 0.48 + v * 0.18);
    return;
  }
  if (p.kind === "radiation") {
    out.copy(staticColors["species:radiant"]);
    applyVariantTint(out, p.variant);
    return;
  }
  if (p.metallicity > 0.04) {
    out.copy(staticColors[`element:${p.elementFamily}`]);
    applyVariantTint(out, p.variant);
    return;
  }
  out.copy(staticColors[`species:${p.species}`]);
  applyVariantTint(out, p.variant);
}

function applyVariantTint(color: THREE.Color, variant: UniverseSimulation["particles"][number]["variant"]): void {
  if (variant === "light") {
    color.lerp(new THREE.Color("#dff8ff"), 0.18);
    return;
  }
  if (variant === "heavy") {
    color.lerp(new THREE.Color("#ff9a3d"), 0.16);
    return;
  }
  if (variant === "volatile") {
    color.lerp(new THREE.Color("#ff4fd8"), 0.22);
    return;
  }
  color.multiplyScalar(1.06);
}

function ParamSlider({ def, value, onChange }: { def: ParamDef; value: number; onChange: (value: number) => void }) {
  const [min, max] = PARAM_LIMITS[def.key];
  return (
    <label className="param has-tooltip" data-tooltip={def.tooltip} title={def.tooltip}>
      <span className="param-label">
        <strong>{def.label}</strong>
        <span><em>{formatParamValue(value, def.suffix)}</em><small>{def.group}</small></span>
      </span>
      <input type="range" min={min} max={max} step={def.step} value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}

function IconButton({ icon: Icon, label, tooltip, primary, onClick }: { icon: typeof Play; label: string; tooltip?: string; primary?: boolean; onClick: () => void }) {
  return (
    <button className={primary ? "primary icon-button has-tooltip" : "icon-button has-tooltip"} onClick={onClick} data-tooltip={tooltip} title={tooltip}>
      <Icon size={16} /> {label}
    </button>
  );
}

function Readout({ label, value, tooltip }: { label: string; value: string | number; tooltip?: string }) {
  return <div className="readout has-tooltip" data-tooltip={tooltip} title={tooltip}><span>{label}</span><strong>{value}</strong></div>;
}

function Legend({ color, label, tooltip }: { color: string; label: string; tooltip?: string }) {
  return <span className="legend-item has-tooltip" data-tooltip={tooltip} title={tooltip}><i className="dot" style={{ background: color }} />{label}</span>;
}

function TimelineEvent({ event }: { event: SimEvent }) {
  return <article className="event has-tooltip" data-tooltip="A major event recorded by the simulation timeline." title="A major event recorded by the simulation timeline."><header><h3>{event.title}</h3><time>{formatAge(event.ageMyr)}</time></header><p>{event.description}</p></article>;
}

function loadLibrary(): SavedSeed[] {
  try {
    const v2 = localStorage.getItem(STORAGE_KEY);
    const legacy = localStorage.getItem("cosmic-seed-sim.library.v1");
    return sanitizeLibrary(JSON.parse(v2 || legacy || "[]"));
  } catch {
    return [];
  }
}

function sanitizeLibrary(items: unknown): SavedSeed[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is Partial<SavedSeed> => Boolean(item && typeof item === "object" && "seed" in item))
    .map((item, index) => {
      const seed = String(item.seed || `imported-${index}`).slice(0, 120);
      const params = normalizeParams(item.params);
      const outcome = item.outcome && typeof item.outcome === "object" ? item.outcome as Partial<SimSummary> : {};
      return {
        id: String(item.id || crypto.randomUUID()),
        seed,
        title: String(item.title || titleFromSeed(seed)).slice(0, 80),
        description: String(item.description || "").slice(0, 1000),
        createdAt: String(item.createdAt || new Date().toISOString()),
        params,
        outcome: {
          seed,
          params,
          ageMyr: Number(outcome.ageMyr || 0),
          stats: {
            ...emptyStats,
            ...(outcome.stats || {}),
            speciesCounts: { ...emptyStats.speciesCounts, ...((outcome.stats && outcome.stats.speciesCounts) || {}) },
            elementFamilyCounts: { ...emptyStats.elementFamilyCounts, ...((outcome.stats && outcome.stats.elementFamilyCounts) || {}) }
          },
          events: Array.isArray(outcome.events) ? outcome.events as SimEvent[] : [],
          diagnosis: outcome.diagnosis || initialDiagnosis
        }
      };
    })
    .slice(0, 80);
}

function getSpeciesMix(counts: Record<SpeciesId, number>, total: number) {
  return (Object.keys(SPECIES_TRAITS) as SpeciesId[])
    .map((id) => {
      const trait = SPECIES_TRAITS[id];
      const count = counts[id] || 0;
      return {
        id,
        label: trait.label,
        color: trait.color,
        count,
        percent: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
      };
    })
    .filter((item) => Number(item.percent) > 0.05)
    .sort((a, b) => b.count - a.count);
}

function getElementMix(counts: Record<ElementFamilyId, number>, total: number) {
  return (Object.keys(ELEMENT_FAMILY_TRAITS) as ElementFamilyId[])
    .map((id) => {
      const trait = ELEMENT_FAMILY_TRAITS[id];
      const count = counts[id] || 0;
      return {
        id,
        label: trait.label,
        mirror: trait.periodicMirror,
        color: trait.color,
        count,
        percent: total > 0 ? ((count / total) * 100).toFixed(1) : "0.0"
      };
    })
    .filter((item) => Number(item.percent) > 0.05)
    .sort((a, b) => b.count - a.count);
}

function makeMetrics(summary: SimSummary, speciesMix: ReturnType<typeof getSpeciesMix>, elementMix: ReturnType<typeof getElementMix>) {
  const total = Math.max(1, summary.params.particleCount);
  const stats = summary.stats;
  const nonPrimordial = Object.entries(stats.elementFamilyCounts)
    .filter(([family]) => family !== "primordial")
    .reduce((sum, [, value]) => sum + value, 0);
  const matterPackets = total - (stats.speciesCounts.radiant || 0);
  const dominantSpecies = speciesMix[0]?.label.replace(" packets", "").replace(" quanta", "") || "None";
  const dominantElement = elementMix[0]?.label.replace("-like", "") || "None";
  const activeShare = stats.stars > 0 ? stats.activeStars / stats.stars : 0;

  return [
    ["Stars", stats.stars],
    ["Active stars", stats.activeStars],
    ["Supernovae", stats.supernovae],
    ["Rocky worlds", stats.rockyPlanets],
    ["Habitables", stats.habitableCandidates],
    ["Star yield", formatPercent(stats.stars / total)],
    ["Active ratio", formatPercent(activeShare)],
    ["Rocky ratio", formatPercent(stats.rockyPlanets / total)],
    ["Life potential", formatPercent(stats.habitableCandidates / total)],
    ["Metallicity", stats.averageMetallicity.toFixed(3)],
    ["Enriched matter", formatPercent(nonPrimordial / total)],
    ["Element complexity", stats.averageElementComplexity.toFixed(2)],
    ["Density", stats.averageDensity.toFixed(2)],
    ["Heat", stats.averageTemp.toFixed(2)],
    ["Matter share", formatPercent(matterPackets / total)],
    ["Escaped mass", formatPercent(stats.escapedMassFraction)],
    ["Dominant species", dominantSpecies],
    ["Dominant family", dominantElement]
  ];
}

function formatPercent(value: number) {
  return `${(clamp(value, 0, 1) * 100).toFixed(value < 0.01 && value > 0 ? 2 : 1)}%`;
}

function updateSavedSeed(id: string, patch: Partial<SavedSeed>, setLibrary: React.Dispatch<React.SetStateAction<SavedSeed[]>>) {
  setLibrary((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));
}

function formatAge(ageMyr: number) {
  if (ageMyr >= 1000) return `${(ageMyr / 1000).toFixed(2)} Gyr`;
  return `${Math.floor(ageMyr).toLocaleString()} Myr`;
}

function formatParamValue(value: number, suffix: string) {
  if (suffix === "Msun") return `${(value / 1_000_000_000).toFixed(1)}B ${suffix}`;
  if (suffix === "x") return `${value.toFixed(2)}x`;
  return `${value.toLocaleString()}${suffix ? ` ${suffix}` : ""}`;
}

function titleFromSeed(seed: string) {
  return seed.split(/[-_\s]+/).filter(Boolean).map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function summarizeOutcome(summary: SimSummary) {
  return `${summary.stats.stars.toLocaleString()} stars, ${summary.stats.supernovae.toLocaleString()} supernovae, ${summary.stats.habitableCandidates.toLocaleString()} habitable candidates at ${formatAge(summary.ageMyr)}.`;
}
