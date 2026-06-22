export type SpeedStop = {
  label: string;
  target: number;
};

export type SimParams = {
  universeSizeLy: number;
  totalMassSolar: number;
  particleCount: number;
  expansionRate: number;
  initialTemperature: number;
  matterDensity: number;
  radiationDensity: number;
  radiantShare: number;
  baryonShare: number;
  neutralShare: number;
  leptonShare: number;
  seedMetalShare: number;
  exoticShare: number;
  isotopeInstability: number;
  primordialTraceElements: number;
  darkMatterStrength: number;
  fluctuationAmplitude: number;
  turbulence: number;
  gravityStrength: number;
  coolingEfficiency: number;
  gasRetention: number;
  starFormationThreshold: number;
  massiveStarFraction: number;
  supernovaYield: number;
  metalDispersal: number;
  planetSensitivity: number;
  lifeProbability: number;
  catastropheRate: number;
};

export type ParticleKind = "matter" | "radiation";
export type SpeciesId = "radiant" | "baryon" | "neutral" | "lepton" | "seedMetal" | "exotic";
export type VariantId = "light" | "stable" | "heavy" | "volatile";
export type ElementFamilyId =
  | "primordial"
  | "alkaliLike"
  | "alkalineEarthLike"
  | "transitionLike"
  | "metalloidLike"
  | "nonmetalLike"
  | "halogenLike"
  | "nobleLike"
  | "lanthanideLike"
  | "actinideLike";

export type SpeciesTrait = {
  id: SpeciesId;
  label: string;
  kind: ParticleKind;
  baseMass: number;
  charge: number;
  gravityBias: number;
  coolingAffinity: number;
  radiationPressure: number;
  fusionYield: number;
  metalSeed: number;
  stability: number;
  habitabilityBias: number;
  color: string;
};

export type VariantTrait = {
  id: VariantId;
  label: string;
  massScale: number;
  stabilityScale: number;
  coolingScale: number;
  fusionScale: number;
};

export type ElementFamilyTrait = {
  id: ElementFamilyId;
  label: string;
  periodicMirror: string;
  color: string;
  complexity: number;
  coolingBonus: number;
  planetBonus: number;
  habitabilityBias: number;
  volatility: number;
  radiationAbsorption: number;
  enrichmentBias: number;
};

export type Particle = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  mass: number;
  temp: number;
  density: number;
  metallicity: number;
  elementFamily: ElementFamilyId;
  elementComplexity: number;
  habitability: number;
  kind: ParticleKind;
  species: SpeciesId;
  variant: VariantId;
  charge: number;
  stability: number;
  fusionYield: number;
  coolingAffinity: number;
  gravityBias: number;
  radiationPressure: number;
  habitabilityBias: number;
  star: boolean;
  supernovaClock: number;
};

export type SimStats = {
  stars: number;
  activeStars: number;
  supernovae: number;
  averageMetallicity: number;
  averageDensity: number;
  averageTemp: number;
  habitableCandidates: number;
  rockyPlanets: number;
  escapedMassFraction: number;
  speciesCounts: Record<SpeciesId, number>;
  elementFamilyCounts: Record<ElementFamilyId, number>;
  averageElementComplexity: number;
};

export type SimEvent = {
  title: string;
  description: string;
  ageMyr: number;
};

export type Diagnosis = {
  title: string;
  description: string;
};

export type SimSummary = {
  seed: string;
  params: SimParams;
  ageMyr: number;
  stats: SimStats;
  events: SimEvent[];
  diagnosis: Diagnosis;
};

type SpatialGrid = {
  cells: Particle[][];
  size: number;
};

type FabricBuffers = {
  fabric: Float32Array;
  smoothedFabric: Float32Array;
};

function emptySpeciesCounts(): Record<SpeciesId, number> {
  return {
    radiant: 0,
    baryon: 0,
    neutral: 0,
    lepton: 0,
    seedMetal: 0,
    exotic: 0
  };
}

function emptyElementFamilyCounts(): Record<ElementFamilyId, number> {
  return {
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
  };
}

export const SPECIES_TRAITS: Record<SpeciesId, SpeciesTrait> = {
  radiant: {
    id: "radiant",
    label: "Radiant quanta",
    kind: "radiation",
    baseMass: 0.22,
    charge: 0,
    gravityBias: 0.25,
    coolingAffinity: 0.35,
    radiationPressure: 1.45,
    fusionYield: 0.02,
    metalSeed: 0,
    stability: 0.92,
    habitabilityBias: -0.08,
    color: "#5bc9ff"
  },
  baryon: {
    id: "baryon",
    label: "Baryon packets",
    kind: "matter",
    baseMass: 1,
    charge: 0.18,
    gravityBias: 1.05,
    coolingAffinity: 1.05,
    radiationPressure: 0.18,
    fusionYield: 0.72,
    metalSeed: 0,
    stability: 0.9,
    habitabilityBias: 0.06,
    color: "#66e6a3"
  },
  neutral: {
    id: "neutral",
    label: "Neutral condensates",
    kind: "matter",
    baseMass: 1.2,
    charge: 0,
    gravityBias: 1.22,
    coolingAffinity: 1.24,
    radiationPressure: 0.08,
    fusionYield: 0.48,
    metalSeed: 0.006,
    stability: 0.96,
    habitabilityBias: 0.12,
    color: "#b4d873"
  },
  lepton: {
    id: "lepton",
    label: "Lepton haze",
    kind: "matter",
    baseMass: 0.45,
    charge: -0.45,
    gravityBias: 0.62,
    coolingAffinity: 0.78,
    radiationPressure: 0.34,
    fusionYield: 0.16,
    metalSeed: 0,
    stability: 0.84,
    habitabilityBias: -0.02,
    color: "#c49bff"
  },
  seedMetal: {
    id: "seedMetal",
    label: "Trace heavy seeds",
    kind: "matter",
    baseMass: 1.65,
    charge: 0.12,
    gravityBias: 1.42,
    coolingAffinity: 1.38,
    radiationPressure: 0.05,
    fusionYield: 1.15,
    metalSeed: 0.04,
    stability: 0.74,
    habitabilityBias: 0.18,
    color: "#ffb24a"
  },
  exotic: {
    id: "exotic",
    label: "Exotic unstable",
    kind: "matter",
    baseMass: 1.85,
    charge: 0.65,
    gravityBias: 1.65,
    coolingAffinity: 0.62,
    radiationPressure: 0.48,
    fusionYield: 1.35,
    metalSeed: 0.012,
    stability: 0.38,
    habitabilityBias: -0.18,
    color: "#ff4f8b"
  }
};

export const VARIANT_TRAITS: Record<VariantId, VariantTrait> = {
  light: { id: "light", label: "Light", massScale: 0.72, stabilityScale: 1.08, coolingScale: 0.9, fusionScale: 0.84 },
  stable: { id: "stable", label: "Stable", massScale: 1, stabilityScale: 1.18, coolingScale: 1, fusionScale: 1 },
  heavy: { id: "heavy", label: "Heavy", massScale: 1.34, stabilityScale: 0.92, coolingScale: 1.16, fusionScale: 1.18 },
  volatile: { id: "volatile", label: "Volatile", massScale: 1.08, stabilityScale: 0.58, coolingScale: 0.78, fusionScale: 1.42 }
};

export const ELEMENT_FAMILY_TRAITS: Record<ElementFamilyId, ElementFamilyTrait> = {
  primordial: {
    id: "primordial",
    label: "Primordial H/He-like",
    periodicMirror: "Hydrogen and helium baseline",
    color: "#7ee7bf",
    complexity: 0,
    coolingBonus: 0.88,
    planetBonus: 0.08,
    habitabilityBias: -0.04,
    volatility: 0.28,
    radiationAbsorption: 0.18,
    enrichmentBias: 0.8
  },
  alkaliLike: {
    id: "alkaliLike",
    label: "Alkali-like",
    periodicMirror: "Group 1 chemistry analog",
    color: "#ffd447",
    complexity: 1,
    coolingBonus: 1.06,
    planetBonus: 0.26,
    habitabilityBias: 0.03,
    volatility: 0.52,
    radiationAbsorption: 0.24,
    enrichmentBias: 0.92
  },
  alkalineEarthLike: {
    id: "alkalineEarthLike",
    label: "Alkaline-earth-like",
    periodicMirror: "Group 2 rock-forming analog",
    color: "#b6ea6f",
    complexity: 2,
    coolingBonus: 1.12,
    planetBonus: 0.38,
    habitabilityBias: 0.06,
    volatility: 0.34,
    radiationAbsorption: 0.28,
    enrichmentBias: 0.98
  },
  transitionLike: {
    id: "transitionLike",
    label: "Transition-metal-like",
    periodicMirror: "Iron/nickel/metal core analog",
    color: "#ff8c4a",
    complexity: 4,
    coolingBonus: 1.28,
    planetBonus: 0.58,
    habitabilityBias: 0.1,
    volatility: 0.2,
    radiationAbsorption: 0.42,
    enrichmentBias: 1.2
  },
  metalloidLike: {
    id: "metalloidLike",
    label: "Metalloid-like",
    periodicMirror: "Silicon/boron chemistry analog",
    color: "#86d5a6",
    complexity: 3,
    coolingBonus: 1.2,
    planetBonus: 0.5,
    habitabilityBias: 0.16,
    volatility: 0.26,
    radiationAbsorption: 0.36,
    enrichmentBias: 1.08
  },
  nonmetalLike: {
    id: "nonmetalLike",
    label: "Nonmetal CHON-like",
    periodicMirror: "Carbon, nitrogen, oxygen analog",
    color: "#4fd8d2",
    complexity: 3,
    coolingBonus: 1.24,
    planetBonus: 0.48,
    habitabilityBias: 0.22,
    volatility: 0.4,
    radiationAbsorption: 0.34,
    enrichmentBias: 1.1
  },
  halogenLike: {
    id: "halogenLike",
    label: "Halogen-like",
    periodicMirror: "Reactive group 17 analog",
    color: "#9cff57",
    complexity: 4,
    coolingBonus: 1.08,
    planetBonus: 0.22,
    habitabilityBias: -0.02,
    volatility: 0.62,
    radiationAbsorption: 0.5,
    enrichmentBias: 0.86
  },
  nobleLike: {
    id: "nobleLike",
    label: "Noble-gas-like",
    periodicMirror: "Inert group 18 analog",
    color: "#80b6ff",
    complexity: 2,
    coolingBonus: 0.72,
    planetBonus: 0.06,
    habitabilityBias: -0.08,
    volatility: 0.72,
    radiationAbsorption: 0.18,
    enrichmentBias: 0.52
  },
  lanthanideLike: {
    id: "lanthanideLike",
    label: "Lanthanide-like",
    periodicMirror: "Rare-earth analog",
    color: "#d88cff",
    complexity: 6,
    coolingBonus: 1.35,
    planetBonus: 0.34,
    habitabilityBias: 0.02,
    volatility: 0.18,
    radiationAbsorption: 0.6,
    enrichmentBias: 0.68
  },
  actinideLike: {
    id: "actinideLike",
    label: "Actinide-like",
    periodicMirror: "Radioactive heavy analog",
    color: "#ff5573",
    complexity: 7,
    coolingBonus: 1.18,
    planetBonus: 0.18,
    habitabilityBias: -0.18,
    volatility: 0.22,
    radiationAbsorption: 0.8,
    enrichmentBias: 0.44
  }
};

export const SPEEDS: SpeedStop[] = [
  { label: "Paused", target: 0 },
  { label: "1x", target: 1 },
  { label: "5x", target: 5 },
  { label: "25x", target: 25 },
  { label: "100x", target: 100 },
  { label: "500x", target: 500 },
  { label: "1,000x", target: 1000 },
  { label: "5,000x", target: 5000 },
  { label: "Max Frame-Budgeted", target: Number.POSITIVE_INFINITY }
];

export const DEFAULT_PARAMS: SimParams = {
  universeSizeLy: 10000,
  totalMassSolar: 1_000_000_000,
  particleCount: 8000,
  expansionRate: 0.38,
  initialTemperature: 0.82,
  matterDensity: 0.68,
  radiationDensity: 0.32,
  radiantShare: 1,
  baryonShare: 1,
  neutralShare: 1,
  leptonShare: 1,
  seedMetalShare: 1,
  exoticShare: 1,
  isotopeInstability: 0.36,
  primordialTraceElements: 0.42,
  darkMatterStrength: 0.62,
  fluctuationAmplitude: 0.44,
  turbulence: 0.28,
  gravityStrength: 0.58,
  coolingEfficiency: 0.54,
  gasRetention: 0.62,
  starFormationThreshold: 0.72,
  massiveStarFraction: 0.24,
  supernovaYield: 0.64,
  metalDispersal: 0.56,
  planetSensitivity: 0.52,
  lifeProbability: 0.36,
  catastropheRate: 0.25
};

export const PARAM_LIMITS: Record<keyof SimParams, [number, number]> = {
  universeSizeLy: [2000, 30000],
  totalMassSolar: [100_000_000, 3_000_000_000],
  particleCount: [1000, 250_000],
  expansionRate: [0.1, 1.2],
  initialTemperature: [0.2, 1.4],
  matterDensity: [0.15, 1.2],
  radiationDensity: [0.05, 1],
  radiantShare: [0, 2],
  baryonShare: [0, 2],
  neutralShare: [0, 2],
  leptonShare: [0, 2],
  seedMetalShare: [0, 2],
  exoticShare: [0, 2],
  isotopeInstability: [0, 1],
  primordialTraceElements: [0, 1],
  darkMatterStrength: [0, 1.2],
  fluctuationAmplitude: [0, 1],
  turbulence: [0, 1],
  gravityStrength: [0.1, 1.4],
  coolingEfficiency: [0.1, 1.2],
  gasRetention: [0.1, 1.2],
  starFormationThreshold: [0.35, 1.25],
  massiveStarFraction: [0.02, 0.6],
  supernovaYield: [0.05, 1.2],
  metalDispersal: [0.05, 1.2],
  planetSensitivity: [0.05, 1.2],
  lifeProbability: [0, 1],
  catastropheRate: [0, 1]
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function normalizeParams(params?: Partial<SimParams> | null): SimParams {
  const normalized = { ...DEFAULT_PARAMS };
  (Object.keys(PARAM_LIMITS) as Array<keyof SimParams>).forEach((key) => {
    const value = Number(params?.[key]);
    const [min, max] = PARAM_LIMITS[key];
    normalized[key] = Number.isFinite(value) ? clamp(value, min, max) : DEFAULT_PARAMS[key];
  });
  normalized.particleCount = Math.round(normalized.particleCount);
  return normalized;
}

export function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function rand() {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makeSeed(): string {
  const words = ["aurora", "quench", "ember", "halo", "forge", "lattice", "nova", "field"];
  const rand = mulberry32(Date.now() >>> 0);
  return `${words[Math.floor(rand() * words.length)]}-${Math.floor(rand() * 999999)}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export class UniverseSimulation {
  seed = "";
  params: SimParams = DEFAULT_PARAMS;
  rng: () => number = Math.random;
  ageMyr = 0;
  actualSpeed = 0;
  limiter = "paused";
  events: SimEvent[] = [];
  stats: SimStats = {
    stars: 0,
    activeStars: 0,
    supernovae: 0,
    averageMetallicity: 0,
    averageDensity: 0,
    averageTemp: 0,
    habitableCandidates: 0,
    rockyPlanets: 0,
    escapedMassFraction: 0,
    speciesCounts: emptySpeciesCounts(),
    elementFamilyCounts: emptyElementFamilyCounts(),
    averageElementComplexity: 0
  };
  particles: Particle[] = [];
  private gridCache = new Map<number, SpatialGrid>();
  private fabricCache = new Map<number, FabricBuffers>();
  private neighborCache = new Map<number, number[][]>();

  constructor(seed: string, params?: Partial<SimParams>) {
    this.reset(seed, params);
  }

  reset(seed: string, params?: Partial<SimParams>): void {
    this.seed = seed || makeSeed();
    this.params = normalizeParams(params);
    this.rng = mulberry32(hashString(`${this.seed}:${JSON.stringify(this.params)}`));
    this.ageMyr = 0;
    this.actualSpeed = 0;
    this.limiter = "paused";
    this.events = [];
    this.stats = {
      stars: 0,
      activeStars: 0,
      supernovae: 0,
      averageMetallicity: 0,
      averageDensity: this.params.matterDensity,
      averageTemp: this.params.initialTemperature,
      habitableCandidates: 0,
      rockyPlanets: 0,
      escapedMassFraction: 0,
      speciesCounts: emptySpeciesCounts(),
      elementFamilyCounts: emptyElementFamilyCounts(),
      averageElementComplexity: 0
    };
    this.particles = [];
    this.spawnParticles();
    this.stats.speciesCounts = this.countSpecies();
    this.stats.elementFamilyCounts = this.countElementFamilies();
    this.addEvent("Primordial field initialized", "Matter-energy packets distributed from the seed.");
  }

  step(requestedSpeed: number, frameSeconds: number): void {
    if (!requestedSpeed) {
      this.actualSpeed = 0;
      this.limiter = "paused";
      return;
    }

    const desiredMyr = requestedSpeed === Number.POSITIVE_INFINITY ? 120 : requestedSpeed * frameSeconds * 0.22;
    const maxStep = this.computeStableStep();
    const requestedSteps = Math.ceil(desiredMyr / maxStep);
    const frameStepCap = this.computeFrameStepCap();
    const steps = clamp(requestedSteps, 1, frameStepCap);
    const dt = Math.min(maxStep, desiredMyr / steps);
    const before = this.ageMyr;

    for (let i = 0; i < steps; i += 1) {
      this.integrate(dt);
    }

    const elapsed = Math.max(0.0001, frameSeconds);
    this.actualSpeed = ((this.ageMyr - before) / elapsed) / 0.22;
    this.limiter = requestedSteps > frameStepCap ? "frame budget" : "stable";
  }

  getDiagnosis(): Diagnosis {
    const s = this.stats;
    const p = this.params;
    if (this.ageMyr < 50) {
      return {
        title: "Primordial cooling",
        description: "The field is still cooling and expanding. Watch density and temperature for the first stable star-forming regions."
      };
    }
    if (s.stars === 0 && s.averageDensity < p.starFormationThreshold * 0.72) {
      return {
        title: "Too diffuse",
        description: "Matter is not clustering strongly enough for first stars. Try lower expansion, higher density, stronger dark matter wells, or better gas retention."
      };
    }
    if (s.stars === 0 && s.averageTemp > 0.78) {
      return {
        title: "Too hot for stars",
        description: "Dense regions are not cooling below the star threshold. Increase cooling efficiency or lower initial heat."
      };
    }
    if (s.stars > 0 && s.supernovae === 0) {
      return {
        title: "First generation stars",
        description: "Stars have formed, but enrichment has not started. Massive star fraction and elapsed time control when metals appear."
      };
    }
    if (s.supernovae > 0 && s.rockyPlanets === 0) {
      return {
        title: "Enrichment phase",
        description: "Heavy elements exist, but rocky planet regions have not stabilized. Metal dispersal, gas retention, and planet sensitivity matter here."
      };
    }
    if (s.rockyPlanets > 0 && s.habitableCandidates === 0) {
      return {
        title: "Rocky worlds forming",
        description: "Metal-rich regions can form planets, but stability is still low. Lower catastrophe rate or allow more simulation time."
      };
    }
    return {
      title: "Life-capable pockets",
      description: "This seed has produced stable enriched regions with habitable potential. Save it, fork it, or compare nearby parameter changes."
    };
  }

  getSummary(): SimSummary {
    return {
      seed: this.seed,
      params: this.params,
      ageMyr: this.ageMyr,
      stats: { ...this.stats },
      events: [...this.events],
      diagnosis: this.getDiagnosis()
    };
  }

  private spawnParticles(): void {
    const count = this.params.particleCount;
    const fluct = this.params.fluctuationAmplitude;
    const massPerParticle = this.params.totalMassSolar / count;
    const clusterCount = 5 + Math.floor(this.rng() * 9);
    const fieldPoint = (radiusScale = 0.46) => {
      const phi = Math.acos(1 - 2 * this.rng());
      const theta = this.rng() * Math.PI * 2;
      const radius = Math.pow(this.rng(), 1 / 3) * radiusScale;
      return {
        x: 0.5 + radius * Math.sin(phi) * Math.cos(theta),
        y: 0.5 + radius * Math.sin(phi) * Math.sin(theta),
        z: 0.5 + radius * Math.cos(phi)
      };
    };
    const clusters = Array.from({ length: clusterCount }, () => ({
      ...fieldPoint(0.36),
      pull: 0.25 + this.rng() * 0.75
    }));

    for (let i = 0; i < count; i += 1) {
      const cluster = clusters[Math.floor(this.rng() * clusters.length)];
      const useCluster = this.rng() < fluct;
      const phi = Math.acos(1 - 2 * this.rng());
      const theta = this.rng() * Math.PI * 2;
      const radius = Math.pow(this.rng(), 1.8) * 0.2 * cluster.pull;
      
      const background = fieldPoint(0.47);
      const x = useCluster ? clamp(cluster.x + radius * Math.sin(phi) * Math.cos(theta), 0.035, 0.965) : background.x;
      const y = useCluster ? clamp(cluster.y + radius * Math.sin(phi) * Math.sin(theta), 0.035, 0.965) : background.y;
      const z = useCluster ? clamp(cluster.z + radius * Math.cos(phi), 0.035, 0.965) : background.z;
      
      const dx = x - 0.5;
      const dy = y - 0.5;
      const dz = z - 0.5;
      const expansion = this.params.expansionRate * 0.000045;
      const turbulence = this.params.turbulence * 0.00036;
      const species = this.rollSpecies();
      const variant = this.rollVariant(species);
      const speciesTrait = SPECIES_TRAITS[species];
      const variantTrait = VARIANT_TRAITS[variant];
      const kind = speciesTrait.kind;
      const traitMass = speciesTrait.baseMass * variantTrait.massScale;
      const stability = clamp(speciesTrait.stability * variantTrait.stabilityScale, 0.05, 1.5);
      const coolingAffinity = speciesTrait.coolingAffinity * variantTrait.coolingScale;
      const fusionYield = speciesTrait.fusionYield * variantTrait.fusionScale;
      const elementFamily = this.rollInitialElementFamily(species);
      const elementTrait = ELEMENT_FAMILY_TRAITS[elementFamily];
      const metallicity = speciesTrait.metalSeed + (elementFamily === "primordial" ? 0 : elementTrait.complexity * 0.006);

      this.particles.push({
        x,
        y,
        z,
        vx: dx * expansion * speciesTrait.radiationPressure * (kind === "radiation" ? 1.4 : 0.36) + (this.rng() - 0.5) * turbulence * (2 - stability),
        vy: dy * expansion * speciesTrait.radiationPressure * (kind === "radiation" ? 1.4 : 0.36) + (this.rng() - 0.5) * turbulence * (2 - stability),
        vz: dz * expansion * speciesTrait.radiationPressure * (kind === "radiation" ? 1.4 : 0.36) + (this.rng() - 0.5) * turbulence * (2 - stability),
        mass: massPerParticle * traitMass * lerp(0.55, 1.7, this.rng()),
        temp: clamp(this.params.initialTemperature * lerp(0.75, 1.25, this.rng()) * (1 + speciesTrait.radiationPressure * 0.08), 0, 1.5),
        density: clamp(this.params.matterDensity * lerp(0.45, 1.35, this.rng()) * speciesTrait.gravityBias * (1 + elementTrait.complexity * 0.018), 0, 1.6),
        metallicity,
        elementFamily,
        elementComplexity: elementTrait.complexity,
        habitability: 0,
        kind,
        species,
        variant,
        charge: speciesTrait.charge,
        stability,
        fusionYield,
        coolingAffinity,
        gravityBias: speciesTrait.gravityBias,
        radiationPressure: speciesTrait.radiationPressure,
        habitabilityBias: speciesTrait.habitabilityBias,
        star: false,
        supernovaClock: 0
      });
    }
  }

  private rollSpecies(): SpeciesId {
    const radiationWeight = this.params.radiationDensity * 0.42 * this.params.radiantShare;
    const exoticWeight = (0.025 + this.params.turbulence * 0.045) * this.params.exoticShare;
    const seedMetalWeight = (0.018 + this.params.supernovaYield * 0.012) * this.params.seedMetalShare;
    const leptonWeight = (0.12 + this.params.radiationDensity * 0.08) * this.params.leptonShare;
    const neutralWeight = (0.2 + this.params.coolingEfficiency * 0.08) * this.params.neutralShare;
    const baryonWeight = this.params.matterDensity * 0.52 * this.params.baryonShare;
    const weights: Array<[SpeciesId, number]> = [
      ["radiant", radiationWeight],
      ["baryon", baryonWeight],
      ["neutral", neutralWeight],
      ["lepton", leptonWeight],
      ["seedMetal", seedMetalWeight],
      ["exotic", exoticWeight]
    ];
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    if (total <= 0) return "baryon";
    let roll = this.rng() * total;
    for (const [species, weight] of weights) {
      roll -= weight;
      if (roll <= 0) return species;
    }
    return "baryon";
  }

  private rollVariant(species: SpeciesId): VariantId {
    const isotopeNoise = this.params.isotopeInstability;
    const volatileBias = (species === "exotic" ? 0.38 : 0.12 + this.params.turbulence * 0.1) * (0.55 + isotopeNoise * 1.35);
    const heavyBias = (species === "seedMetal" ? 0.42 : 0.16 + this.params.matterDensity * 0.08) * (0.75 + isotopeNoise * 0.7);
    const lightBias = species === "radiant" || species === "lepton" ? 0.42 : 0.18;
    const stableBias = (0.34 + this.params.coolingEfficiency * 0.08) * (1.25 - isotopeNoise * 0.55);
    const weights: Array<[VariantId, number]> = [
      ["light", lightBias],
      ["stable", stableBias],
      ["heavy", heavyBias],
      ["volatile", volatileBias]
    ];
    const total = weights.reduce((sum, [, weight]) => sum + weight, 0);
    let roll = this.rng() * total;
    for (const [variant, weight] of weights) {
      roll -= weight;
      if (roll <= 0) return variant;
    }
    return "stable";
  }

  private rollInitialElementFamily(species: SpeciesId): ElementFamilyId {
    if (species === "radiant" || species === "lepton") return this.rng() < 0.92 ? "primordial" : "nobleLike";
    if (species === "seedMetal") {
      const roll = this.rng();
      if (roll < 0.38) return "transitionLike";
      if (roll < 0.62) return "metalloidLike";
      if (roll < 0.78) return "nonmetalLike";
      if (roll < 0.9) return "lanthanideLike";
      return "actinideLike";
    }
    if (species === "exotic") return this.rng() < 0.7 ? "actinideLike" : "halogenLike";
    const trace = (0.015 + this.params.supernovaYield * 0.014) * (0.4 + this.params.primordialTraceElements * 1.4);
    if (this.rng() > trace) return "primordial";
    const roll = this.rng();
    if (roll < 0.18) return "alkaliLike";
    if (roll < 0.36) return "alkalineEarthLike";
    if (roll < 0.58) return "nonmetalLike";
    if (roll < 0.78) return "metalloidLike";
    return "transitionLike";
  }

  private countSpecies(): Record<SpeciesId, number> {
    const counts = emptySpeciesCounts();
    for (const particle of this.particles) {
      counts[particle.species] += 1;
    }
    return counts;
  }

  private countElementFamilies(): Record<ElementFamilyId, number> {
    const counts = emptyElementFamilyCounts();
    for (const particle of this.particles) {
      counts[particle.elementFamily] += 1;
    }
    return counts;
  }

  private evolveElementFamily(particle: Particle, enrichment: number): ElementFamilyId {
    const metal = particle.metallicity + enrichment;
    const heat = particle.temp;
    const density = particle.density;
    const stability = particle.stability;
    const roll = this.rng();

    if (metal < 0.035) return particle.elementFamily === "nobleLike" && roll < 0.25 ? "nobleLike" : "primordial";

    if (particle.species === "exotic" || (metal > 0.42 && stability < 0.55 && roll < 0.38)) {
      return roll < 0.72 ? "actinideLike" : "lanthanideLike";
    }

    if (metal > 0.34 && density > 0.75) {
      if (roll < 0.42) return "transitionLike";
      if (roll < 0.62) return "lanthanideLike";
      if (roll < 0.78) return "metalloidLike";
      return "alkalineEarthLike";
    }

    if (metal > 0.18) {
      if (heat < 0.72 && roll < 0.34) return "nonmetalLike";
      if (density > 0.65 && roll < 0.62) return "metalloidLike";
      if (roll < 0.78) return "transitionLike";
      return "halogenLike";
    }

    if (metal > 0.08) {
      if (heat > 1.05 && roll < 0.3) return "nobleLike";
      if (roll < 0.25) return "alkaliLike";
      if (roll < 0.48) return "alkalineEarthLike";
      if (roll < 0.72) return "nonmetalLike";
      return "metalloidLike";
    }

    if (roll < 0.42) return "alkaliLike";
    if (roll < 0.66) return "alkalineEarthLike";
    if (roll < 0.84) return "nonmetalLike";
    return "nobleLike";
  }

  private computeStableStep(): number {
    const density = this.stats.averageDensity || this.params.matterDensity;
    const heat = this.stats.averageTemp || this.params.initialTemperature;
    const collapsePenalty = clamp(density * this.params.gravityStrength, 0.2, 2.2);
    const heatPenalty = clamp(heat, 0.2, 1.8);
    return clamp(0.18 / (collapsePenalty + heatPenalty * 0.35), 0.018, 0.14);
  }

  private computeFrameStepCap(): number {
    const count = this.params.particleCount;
    if (count <= 8_000) return 8;
    if (count <= 20_000) return 4;
    if (count <= 35_000) return 2;
    return 1;
  }

  private integrate(dt: number): void {
    const p = this.params;
    let densitySum = 0;
    let tempSum = 0;
    let metalSum = 0;
    let habitable = 0;
    let stars = 0;
    let rockyPlanets = 0;
    let escapedMass = 0;
    let complexitySum = 0;
    const enrichmentEvents: Particle[] = [];
    const speciesCounts = emptySpeciesCounts();
    const elementFamilyCounts = emptyElementFamilyCounts();

    const cooling = p.coolingEfficiency * 0.0035 * dt;
    const expansionFade = 1 / (1 + this.ageMyr * 0.018);
    const expansion = p.expansionRate * 0.0000055 * expansionFade * dt;

    const gridSize = 16;
    const gridSizeSq = gridSize * gridSize;
    const grid = this.buildSpatialGrid(gridSize);
    const { fabric, smoothedFabric } = this.getFabricBuffers(gridSize);
    const neighborIndices = this.getNeighborIndices(gridSize);
    fabric.fill(0);
    smoothedFabric.fill(0);
    for (let i = 0; i < grid.cells.length; i++) {
       let mass = 0;
       for (const a of grid.cells[i]) mass += a.mass * a.gravityBias;
       fabric[i] = (mass / p.totalMassSolar) * grid.cells.length;
    }

    for (let i = 0; i < smoothedFabric.length; i += 1) {
      let sum = 0;
      const neighbors = neighborIndices[i];
      for (let n = 0; n < neighbors.length; n += 1) {
        sum += fabric[neighbors[n]];
      }
      smoothedFabric[i] = sum;
    }

    const gravityConstant = p.darkMatterStrength * p.gravityStrength * 0.00018;

    for (let i = 0; i < this.particles.length; i += 1) {
      const a = this.particles[i];
      
      const gx = clamp(Math.floor(a.x * gridSize), 0, gridSize-1);
      const gy = clamp(Math.floor(a.y * gridSize), 0, gridSize-1);
      const gz = clamp(Math.floor(a.z * gridSize), 0, gridSize-1);

      const cellIndex = gz * gridSizeSq + gy * gridSize + gx;
      const nXp = smoothedFabric[gz * gridSizeSq + gy * gridSize + clamp(gx + 1, 0, gridSize - 1)];
      const nXm = smoothedFabric[gz * gridSizeSq + gy * gridSize + clamp(gx - 1, 0, gridSize - 1)];
      const nYp = smoothedFabric[gz * gridSizeSq + clamp(gy + 1, 0, gridSize - 1) * gridSize + gx];
      const nYm = smoothedFabric[gz * gridSizeSq + clamp(gy - 1, 0, gridSize - 1) * gridSize + gx];
      const nZp = smoothedFabric[clamp(gz + 1, 0, gridSize - 1) * gridSizeSq + gy * gridSize + gx];
      const nZm = smoothedFabric[clamp(gz - 1, 0, gridSize - 1) * gridSizeSq + gy * gridSize + gx];

      const gradX = nXp - nXm;
      const gradY = nYp - nYm;
      const gradZ = nZp - nZm;

      a.vx += gradX * gravityConstant * dt;
      a.vy += gradY * gravityConstant * dt;
      a.vz += gradZ * gravityConstant * dt;

      const matterBinding = a.kind === "matter" ? 1 : 0.22;
      const pressure = expansion * a.radiationPressure * (a.kind === "radiation" ? 1 : 0.28);
      a.vx += (a.x - 0.5) * pressure;
      a.vy += (a.y - 0.5) * pressure;
      a.vz += (a.z - 0.5) * pressure;
      const centerX = 0.5 - a.x;
      const centerY = 0.5 - a.y;
      const centerZ = 0.5 - a.z;
      const radiusSq = centerX * centerX + centerY * centerY + centerZ * centerZ;
      const haloBinding = p.darkMatterStrength * p.gravityStrength * a.gravityBias * matterBinding * (0.000035 + radiusSq * 0.00009) * dt;
      a.vx += centerX * haloBinding;
      a.vy += centerY * haloBinding;
      a.vz += centerZ * haloBinding;

      const margin = 0.075;
      const edgeStrength = p.gasRetention * matterBinding * 0.00024 * dt;
      if (a.x < margin) a.vx += (margin - a.x) * edgeStrength;
      if (a.x > 1 - margin) a.vx -= (a.x - (1 - margin)) * edgeStrength;
      if (a.y < margin) a.vy += (margin - a.y) * edgeStrength;
      if (a.y > 1 - margin) a.vy -= (a.y - (1 - margin)) * edgeStrength;
      if (a.z < margin) a.vz += (margin - a.z) * edgeStrength;
      if (a.z > 1 - margin) a.vz -= (a.z - (1 - margin)) * edgeStrength;

      const damping = 0.9975 - p.gasRetention * 0.0012 * a.stability * matterBinding;
      a.vx *= damping;
      a.vy *= damping;
      a.vz *= damping;

      const maxVelocity = (a.kind === "radiation" ? 0.0034 : 0.00145) * (1 + p.turbulence * 0.35);
      const speedSq = a.vx * a.vx + a.vy * a.vy + a.vz * a.vz;
      if (speedSq > maxVelocity * maxVelocity) {
        const scale = maxVelocity / Math.sqrt(speedSq);
        a.vx *= scale;
        a.vy *= scale;
        a.vz *= scale;
      }
      
      a.x += a.vx * dt * 18;
      a.y += a.vy * dt * 18;
      a.z += a.vz * dt * 18;

      const rx = a.x - 0.5;
      const ry = a.y - 0.5;
      const rz = a.z - 0.5;
      const radius = Math.sqrt(rx * rx + ry * ry + rz * rz);
      const radiusLimit = a.kind === "radiation" ? 0.565 : 0.485 + p.gasRetention * 0.035;
      if (radius > radiusLimit) {
        const nx = rx / radius;
        const ny = ry / radius;
        const nz = rz / radius;
        const radialVelocity = a.vx * nx + a.vy * ny + a.vz * nz;
        a.x = 0.5 + nx * radiusLimit;
        a.y = 0.5 + ny * radiusLimit;
        a.z = 0.5 + nz * radiusLimit;
        if (radialVelocity > 0) {
          const rebound = a.kind === "radiation" ? 0.18 : 0.08;
          a.vx -= radialVelocity * nx * (1 + rebound);
          a.vy -= radialVelocity * ny * (1 + rebound);
          a.vz -= radialVelocity * nz * (1 + rebound);
        }
        a.density *= a.kind === "radiation" ? 0.996 : 0.999;
        escapedMass += a.kind === "radiation" ? a.mass * (1 - p.gasRetention) * 0.0015 : 0;
      }

      if (a.x < 0 || a.x > 1) {
        a.vx *= -0.22 * p.gasRetention * matterBinding;
        a.x = clamp(a.x, 0.002, 0.998);
        a.density *= 0.985;
        escapedMass += a.mass * (1 - p.gasRetention) * (a.kind === "radiation" ? 0.012 : 0.002);
      }
      if (a.y < 0 || a.y > 1) {
        a.vy *= -0.22 * p.gasRetention * matterBinding;
        a.y = clamp(a.y, 0.002, 0.998);
        a.density *= 0.985;
        escapedMass += a.mass * (1 - p.gasRetention) * (a.kind === "radiation" ? 0.012 : 0.002);
      }
      if (a.z < 0 || a.z > 1) {
        a.vz *= -0.22 * p.gasRetention * matterBinding;
        a.z = clamp(a.z, 0.002, 0.998);
        a.density *= 0.985;
        escapedMass += a.mass * (1 - p.gasRetention) * (a.kind === "radiation" ? 0.012 : 0.002);
      }

      const localDensityScore = Math.max(0.1, smoothedFabric[cellIndex] / 27);
      const gravityCompression = p.gravityStrength * a.gravityBias * localDensityScore * 0.00008 * dt;
      a.density = clamp(a.density + gravityCompression - p.expansionRate * expansionFade * 0.00012 * dt, 0, 2.4);
      const elementTrait = ELEMENT_FAMILY_TRAITS[a.elementFamily];
      const instabilityHeat = (1 - clamp(a.stability, 0, 1)) * (0.00055 + elementTrait.radiationAbsorption * 0.00022) * dt;
      const volatilityLoss = elementTrait.volatility * p.expansionRate * 0.00008 * dt;
      a.temp = clamp(a.temp - cooling * a.coolingAffinity * elementTrait.coolingBonus + a.density * 0.00042 * dt + instabilityHeat, 0.025, 1.7);
      a.metallicity = clamp(a.metallicity - volatilityLoss, 0, 1);

      const starThreshold = p.starFormationThreshold * (a.species === "radiant" ? 1.9 : 1) * (a.variant === "heavy" ? 0.94 : 1);
      if (!a.star && a.kind === "matter" && a.density > starThreshold && a.temp < 0.74 && a.stability > 0.18) {
        const chargePenalty = 1 - Math.min(0.45, Math.abs(a.charge) * 0.28);
        const chance = (a.density - starThreshold) * 0.0035 * a.coolingAffinity * chargePenalty * dt;
        if (this.rng() < chance) {
          a.star = true;
          a.supernovaClock = lerp(42, 380, this.rng()) * (1 - p.massiveStarFraction * 0.55) * clamp(a.stability, 0.42, 1.25);
          a.temp = clamp(a.temp + 0.28, 0, 1.7);
          this.stats.stars += 1;
          if (this.stats.stars === 1) {
            this.addEvent("First stars formed", "Cold dense regions crossed the stellar formation threshold.");
          }
        }
      }

      if (a.star) {
        stars += 1;
        a.supernovaClock -= dt;
        a.temp = clamp(a.temp + 0.0008 * dt, 0, 1.7);
        if (a.supernovaClock <= 0 && this.rng() < p.massiveStarFraction * a.fusionYield) {
          a.star = false;
          a.density = clamp(a.density * 0.64, 0, 2.4);
          a.temp = clamp(a.temp + 0.62, 0, 1.7);
          a.metallicity = clamp(a.metallicity + 0.045 * p.supernovaYield * a.fusionYield * elementTrait.enrichmentBias, 0, 1);
          a.elementFamily = this.evolveElementFamily(a, 0.1 * p.supernovaYield);
          a.elementComplexity = ELEMENT_FAMILY_TRAITS[a.elementFamily].complexity;
          this.stats.supernovae += 1;
          enrichmentEvents.push(a);
          if (this.stats.supernovae === 1) {
            this.addEvent("First supernova enrichment", "Massive stars started distributing heavy elements.");
          }
        }
      }

      const updatedElementTrait = ELEMENT_FAMILY_TRAITS[a.elementFamily];
      const planetChance = (a.metallicity - 0.045) * p.planetSensitivity * (1 + a.habitabilityBias + updatedElementTrait.planetBonus);
      if (planetChance > 0 && a.temp < 0.9 && a.density > 0.45) {
        a.habitability = clamp(a.habitability + planetChance * 0.0009 * a.stability * (1 + updatedElementTrait.habitabilityBias) * dt, 0, 1);
      }
      a.habitability = clamp(a.habitability - p.catastropheRate * a.temp * (2 - a.stability + updatedElementTrait.volatility * 0.35) * 0.00022 * dt, 0, 1);

      if (a.habitability > 0.08) rockyPlanets += 1;
      if (a.habitability > 0.45 && this.rng() < p.lifeProbability * 0.00012 * dt) {
        a.habitability = clamp(a.habitability + 0.08, 0, 1);
      }
      if (a.habitability > 0.62) habitable += 1;

      densitySum += a.density;
      tempSum += a.temp;
      metalSum += a.metallicity;
      speciesCounts[a.species] += 1;
      elementFamilyCounts[a.elementFamily] += 1;
      complexitySum += a.elementComplexity;
    }

    if (enrichmentEvents.length) {
      const enrichGrid = this.buildSpatialGrid(16);
      for (const event of enrichmentEvents) {
        this.enrichNeighbors(event, p.metalDispersal * 0.085, p.supernovaYield, enrichGrid);
      }
    }

    this.ageMyr += dt;
    this.stats.averageDensity = densitySum / this.particles.length;
    this.stats.averageTemp = tempSum / this.particles.length;
    this.stats.averageMetallicity = metalSum / this.particles.length;
    this.stats.habitableCandidates = habitable;
    this.stats.rockyPlanets = rockyPlanets;
    this.stats.activeStars = stars;
    this.stats.escapedMassFraction = clamp(this.stats.escapedMassFraction + escapedMass / p.totalMassSolar, 0, 1);
    this.stats.speciesCounts = speciesCounts;
    this.stats.elementFamilyCounts = elementFamilyCounts;
    this.stats.averageElementComplexity = complexitySum / this.particles.length;

    if (rockyPlanets > 0 && !this.hasEvent("First rocky planet candidates")) {
      this.addEvent("First rocky planet candidates", "Metal-rich second-generation regions crossed the planet threshold.");
    }
    if (habitable > 0 && !this.hasEvent("First habitable candidates")) {
      this.addEvent("First habitable candidates", "Stable enriched regions have persisted long enough for life potential.");
    }
  }

  private buildSpatialGrid(size: number): SpatialGrid {
    let grid = this.gridCache.get(size);
    if (!grid) {
      grid = {
        cells: Array.from({ length: size * size * size }, () => [] as Particle[]),
        size
      };
      this.gridCache.set(size, grid);
    }
    for (const cell of grid.cells) {
      cell.length = 0;
    }
    const cells = grid.cells;
    for (const p of this.particles) {
      const x = clamp(Math.floor(p.x * size), 0, size - 1);
      const y = clamp(Math.floor(p.y * size), 0, size - 1);
      const z = clamp(Math.floor(p.z * size), 0, size - 1);
      cells[z * size * size + y * size + x].push(p);
    }
    return grid;
  }

  private getFabricBuffers(size: number): FabricBuffers {
    let buffers = this.fabricCache.get(size);
    if (!buffers) {
      const length = size * size * size;
      buffers = {
        fabric: new Float32Array(length),
        smoothedFabric: new Float32Array(length)
      };
      this.fabricCache.set(size, buffers);
    }
    return buffers;
  }

  private getNeighborIndices(size: number): number[][] {
    let indices = this.neighborCache.get(size);
    if (indices) return indices;

    const sizeSq = size * size;
    indices = Array.from({ length: size * size * size }, () => [] as number[]);
    for (let z = 0; z < size; z += 1) {
      for (let y = 0; y < size; y += 1) {
        for (let x = 0; x < size; x += 1) {
          const cell = z * sizeSq + y * size + x;
          const neighbors = indices[cell];
          for (let dz = -1; dz <= 1; dz += 1) {
            const nz = clamp(z + dz, 0, size - 1);
            for (let dy = -1; dy <= 1; dy += 1) {
              const ny = clamp(y + dy, 0, size - 1);
              for (let dx = -1; dx <= 1; dx += 1) {
                const nx = clamp(x + dx, 0, size - 1);
                neighbors.push(nz * sizeSq + ny * size + nx);
              }
            }
          }
        }
      }
    }
    this.neighborCache.set(size, indices);
    return indices;
  }

  private enrichNeighbors(source: Particle, radius: number, yieldStrength: number, grid: SpatialGrid): void {
    const r2 = radius * radius;
    const minX = clamp(Math.floor((source.x - radius) * grid.size), 0, grid.size - 1);
    const maxX = clamp(Math.floor((source.x + radius) * grid.size), 0, grid.size - 1);
    const minY = clamp(Math.floor((source.y - radius) * grid.size), 0, grid.size - 1);
    const maxY = clamp(Math.floor((source.y + radius) * grid.size), 0, grid.size - 1);
    const minZ = clamp(Math.floor((source.z - radius) * grid.size), 0, grid.size - 1);
    const maxZ = clamp(Math.floor((source.z + radius) * grid.size), 0, grid.size - 1);

    for (let gz = minZ; gz <= maxZ; gz += 1) {
      for (let gy = minY; gy <= maxY; gy += 1) {
        for (let gx = minX; gx <= maxX; gx += 1) {
          const cell = grid.cells[gz * grid.size * grid.size + gy * grid.size + gx];
          for (const a of cell) {
            const dx = a.x - source.x;
            const dy = a.y - source.y;
            const dz = a.z - source.z;
            const d2 = dx * dx + dy * dy + dz * dz;
            if (d2 < r2) {
              const influence = (1 - d2 / r2) * 0.018 * yieldStrength * source.fusionYield;
              a.metallicity = clamp(a.metallicity + influence, 0, 1);
              a.elementFamily = this.evolveElementFamily(a, influence);
              a.elementComplexity = ELEMENT_FAMILY_TRAITS[a.elementFamily].complexity;
              a.temp = clamp(a.temp + influence * 3.5 * (2 - a.stability), 0, 1.7);
            }
          }
        }
      }
    }
  }

  private hasEvent(title: string): boolean {
    return this.events.some((event) => event.title === title);
  }

  private addEvent(title: string, description: string): void {
    this.events.unshift({ title, description, ageMyr: this.ageMyr });
    this.events = this.events.slice(0, 40);
  }
}
