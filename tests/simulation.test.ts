import { describe, expect, it } from "vitest";
import { DEFAULT_PARAMS, ELEMENT_FAMILY_TRAITS, SPECIES_TRAITS, UniverseSimulation, normalizeParams, type SimParams, type SimSummary } from "../src/simulation";

function run(seed: string, params: Partial<SimParams>, steps = 60): SimSummary {
  const sim = new UniverseSimulation(seed, params);
  for (let i = 0; i < steps; i += 1) {
    sim.step(Number.POSITIVE_INFINITY, 0.016);
  }
  return sim.getSummary();
}

function compact(summary: SimSummary) {
  return {
    ageMyr: Number(summary.ageMyr.toFixed(6)),
    stats: {
      stars: summary.stats.stars,
      activeStars: summary.stats.activeStars,
      supernovae: summary.stats.supernovae,
      rockyPlanets: summary.stats.rockyPlanets,
      habitableCandidates: summary.stats.habitableCandidates,
      averageMetallicity: Number(summary.stats.averageMetallicity.toFixed(8))
    },
    speciesCounts: summary.stats.speciesCounts,
    elementFamilyCounts: summary.stats.elementFamilyCounts,
    averageElementComplexity: Number(summary.stats.averageElementComplexity.toFixed(6)),
    events: summary.events.map((event) => [event.title, Math.floor(event.ageMyr)]),
    diagnosis: summary.diagnosis.title
  };
}

describe("UniverseSimulation", () => {
  it("normalizes unsafe parameter input", () => {
    expect(normalizeParams({ particleCount: -1 }).particleCount).toBe(1000);
    expect(normalizeParams({ particleCount: 300000 }).particleCount).toBe(60000);
    expect(DEFAULT_PARAMS.particleCount).toBeLessThanOrEqual(30000);
  });

  it("is deterministic for identical seed and params", () => {
    const params = {
      ...DEFAULT_PARAMS,
      particleCount: 1200,
      matterDensity: 0.98,
      gravityStrength: 0.9,
      fluctuationAmplitude: 0.72
    };
    expect(compact(run("regression-seed", params))).toEqual(compact(run("regression-seed", params)));
  });

  it("keeps summaries finite under hot and dense scenarios", () => {
    const hot = run("hot-seed", { ...DEFAULT_PARAMS, particleCount: 800, initialTemperature: 1.4, coolingEfficiency: 0.1 }, 20);
    const dense = run("dense-seed", { ...DEFAULT_PARAMS, particleCount: 1800, massiveStarFraction: 0.45, matterDensity: 1 }, 90);

    expect(Number.isFinite(hot.ageMyr)).toBe(true);
    expect(Number.isFinite(dense.stats.averageMetallicity)).toBe(true);
    expect(Number.isFinite(dense.stats.escapedMassFraction)).toBe(true);
    expect(dense.events.length).toBeGreaterThanOrEqual(1);
  });

  it("assigns deterministic species and isotope-like variants with traits", () => {
    const sim = new UniverseSimulation("species-seed", { ...DEFAULT_PARAMS, particleCount: 1000 });
    const particles = sim.particles.slice(0, 100);
    const species = new Set(particles.map((particle) => particle.species));
    const variants = new Set(particles.map((particle) => particle.variant));
    const elementFamilies = new Set(particles.map((particle) => particle.elementFamily));

    expect(species.size).toBeGreaterThan(1);
    expect(variants.size).toBeGreaterThan(1);
    expect(elementFamilies.size).toBeGreaterThan(1);
    for (const particle of particles) {
      expect(SPECIES_TRAITS[particle.species].kind).toBe(particle.kind);
      expect(ELEMENT_FAMILY_TRAITS[particle.elementFamily].complexity).toBe(particle.elementComplexity);
      expect(Number.isFinite(particle.coolingAffinity)).toBe(true);
      expect(Number.isFinite(particle.fusionYield)).toBe(true);
      expect(Number.isFinite(particle.stability)).toBe(true);
    }

    const total = Object.values(sim.getSummary().stats.speciesCounts).reduce((sum, value) => sum + value, 0);
    const elementTotal = Object.values(sim.getSummary().stats.elementFamilyCounts).reduce((sum, value) => sum + value, 0);
    expect(total).toBe(1000);
    expect(elementTotal).toBe(1000);
  });

  it("lets particle-balance controls reshape the initial species mix", () => {
    const baryonRich = new UniverseSimulation("mix-seed", {
      ...DEFAULT_PARAMS,
      particleCount: 1400,
      radiantShare: 0,
      baryonShare: 2,
      neutralShare: 0,
      leptonShare: 0,
      seedMetalShare: 0,
      exoticShare: 0
    }).getSummary();
    const exoticRich = new UniverseSimulation("mix-seed", {
      ...DEFAULT_PARAMS,
      particleCount: 1400,
      radiantShare: 0,
      baryonShare: 0,
      neutralShare: 0,
      leptonShare: 0,
      seedMetalShare: 0,
      exoticShare: 2
    }).getSummary();

    expect(baryonRich.stats.speciesCounts.baryon).toBe(1400);
    expect(exoticRich.stats.speciesCounts.exotic).toBe(1400);
    expect(exoticRich.stats.elementFamilyCounts.actinideLike + exoticRich.stats.elementFamilyCounts.halogenLike).toBe(1400);
  });

  it("evolves enriched matter into periodic-table mirror families", () => {
    const summary = run("element-seed", {
      ...DEFAULT_PARAMS,
      particleCount: 1600,
      supernovaYield: 1.1,
      metalDispersal: 1.1,
      massiveStarFraction: 0.5,
      matterDensity: 1,
      coolingEfficiency: 0.85
    }, 120);
    const nonPrimordial = Object.entries(summary.stats.elementFamilyCounts)
      .filter(([family]) => family !== "primordial")
      .reduce((sum, [, value]) => sum + value, 0);

    expect(summary.stats.averageElementComplexity).toBeGreaterThan(0);
    expect(nonPrimordial).toBeGreaterThan(0);
  });

  it("keeps matter bound inside the simulated universe over long runs", () => {
    const sim = new UniverseSimulation("retention-seed", { ...DEFAULT_PARAMS, particleCount: 2500 });
    for (let i = 0; i < 120; i += 1) {
      sim.step(Number.POSITIVE_INFINITY, 0.016);
    }

    let edge = 0;
    let shell = 0;
    let radiusSum = 0;
    for (const particle of sim.particles) {
      const dx = particle.x - 0.5;
      const dy = particle.y - 0.5;
      const dz = particle.z - 0.5;
      const radius = Math.sqrt(dx * dx + dy * dy + dz * dz);
      radiusSum += radius;
      if (particle.x <= 0.004 || particle.x >= 0.996 || particle.y <= 0.004 || particle.y >= 0.996 || particle.z <= 0.004 || particle.z >= 0.996) {
        edge += 1;
      }
      if (radius > 0.68) shell += 1;
    }

    expect(edge / sim.particles.length).toBeLessThan(0.03);
    expect(shell / sim.particles.length).toBeLessThan(0.03);
    expect(radiusSum / sim.particles.length).toBeLessThan(0.42);
    expect(sim.getSummary().stats.escapedMassFraction).toBeLessThan(0.08);
  });
});
