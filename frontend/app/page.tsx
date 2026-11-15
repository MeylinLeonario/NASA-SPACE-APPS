"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Layers,
  TriangleAlert,
  Droplets,
  Gauge,
  Wind,
  Orbit,
  ShieldCheck,
  Flame,
  Download,
  Send,
} from "lucide-react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import "./scenario.css";

const habitats = [
  {
    name: "Artemis Lunar Base",
    description: "Long-stay habitat, O₂-enriched air",
    oxygen: 30,
    pressure: 10.2,
    gravity: 0.17,
    art: "moon",
  },
  {
    name: "Pressurized Rover",
    description: "Small cabin, frequent EVAs",
    oxygen: 34,
    pressure: 8.2,
    gravity: 0.17,
    art: "rover",
  },
  {
    name: "Mars Habitat",
    description: "Partial gravity, months from help",
    oxygen: 26.5,
    pressure: 10.2,
    gravity: 0.38,
    art: "mars",
  },
  {
    name: "ISS / Spacecraft Cabin",
    description: "Earth-like air, no buoyancy",
    oxygen: 21,
    pressure: 14.7,
    gravity: 0,
    art: "iss",
  },
  {
    name: "Spacesuit (EVA)",
    description: "Pure oxygen at low pressure",
    oxygen: 100,
    pressure: 4.3,
    gravity: 0.17,
    art: "eva",
  },
  {
    name: "Earth: Underground Mine",
    description: "Spinoff · Antofagasta, ~2,750 m",
    oxygen: 20.9,
    pressure: 10.6,
    gravity: 1,
    art: "mine",
  },
];
const materials = [
  {
    name: "Acrylic (PMMA)",
    description: "Windows, panels, enclosures",
    short: "PMMA",
    offset: 0,
  },
  {
    name: "Cotton-fiberglass fabric",
    description: "Seats, bags, soft goods",
    short: "SIBAL",
    offset: -1,
  },
  {
    name: "Nomex (flame-resistant)",
    description: "Suits, flame-resistant covers",
    short: "Nomex",
    offset: 8.5,
  },
];
const investigations = [
  {
    name: "SoFIE",
    year: "2022–",
    title: "Solid Fuel Ignition and Extinction",
    score: 96,
    pillar: "Prevention",
    fuel: "Solid",
    description:
      "The closest mock analog to exploration atmospheres planned for lunar habitats and rovers.",
  },
  {
    name: "BASS-II",
    year: "2014–2017",
    title: "Burning and Suppression of Solids",
    score: 81,
    pillar: "Suppression",
    fuel: "Solid",
    description:
      "Explore how airflow and oxygen change flame spread over solid materials in microgravity.",
  },
  {
    name: "BASS",
    year: "2012–2014",
    title: "Burning and Suppression of Solids",
    score: 81,
    pillar: "Prevention",
    fuel: "Solid",
    description:
      "Compare burning behavior across different ventilation conditions and fuel geometries.",
  },
  {
    name: "Saffire II–III",
    year: "2016–2017",
    title: "Spacecraft Fire Safety",
    score: 76,
    pillar: "Detection",
    fuel: "Fabric",
    description:
      "Large-scale spacecraft demonstrations help explore flame growth and detection.",
  },
  {
    name: "ACME CFI-G",
    year: "2017–2023",
    title: "Confined Combustion",
    score: 70,
    pillar: "Detection",
    fuel: "Gas",
    description:
      "A complementary mock investigation of gas flames in a controlled environment.",
  },
];
const presets = [
  ["Orbit", 0],
  ["Moon", 0.17],
  ["Mars", 0.38],
  ["Earth", 1],
] as const;
export default function ScenarioFlow() {
  const [step, setStep] = useState(0),
    [habitat, setHabitat] = useState(0),
    [oxygen, setOxygen] = useState(30),
    [pressure, setPressure] = useState(10.2),
    [airflow, setAirflow] = useState(10),
    [gravity, setGravity] = useState(0.17),
    [material, setMaterial] = useState(0),
    [pillar, setPillar] = useState("All"),
    [fuel, setFuel] = useState("All fuels"),
    [selected, setSelected] = useState("SoFIE"),
    [view, setView] = useState("Danger map"),
    [allAlerts, setAllAlerts] = useState(false),
    [table, setTable] = useState(false),
    [zoom, setZoom] = useState(false),
    [predictTab, setPredictTab] = useState("Predict partial gravity"),
    [question, setQuestion] = useState(""),
    [answer, setAnswer] = useState("");
  const current = habitats[habitat],
    mat = materials[material];
  const limit =
    16.3 +
    gravity * 1.2 +
    (pressure - 10.2) * 0.08 +
    (airflow - 10) * 0.015 +
    mat.offset;
  const margin = oxygen - limit;
  const ranked = investigations
    .filter(
      (i) =>
        (pillar === "All" || i.pillar === pillar) &&
        (fuel === "All fuels" || i.fuel === fuel),
    )
    .map((i, index) => ({
      ...i,
      score: Math.max(
        0,
        i.score -
          ((habitat * (index + 2)) % 11) -
          Math.round(Math.abs(gravity - current.gravity) * 12) -
          material * 2,
      ),
    }));
  const active = ranked.find((i) => i.name === selected) || ranked[0];
  const curve = Array.from({ length: 21 }, (_, i) => ({
    g: i / 20,
    value: 16.3 + (i / 20) * 1.2 + mat.offset,
    band: [
      16.1 + (i / 20) * 0.9 + mat.offset,
      16.6 + (i / 20) * 1.3 + mat.offset,
    ],
  }));
  const points = Array.from({ length: 9 }, (_, i) => ({
    air: i * 5 + 2,
    oxygen: 21,
    threshold: limit - 0.5 + 6 / (i * 5 + 2),
  }));
  function choose(index: number) {
    const h = habitats[index];
    setHabitat(index);
    setOxygen(h.oxygen);
    setPressure(h.pressure);
    setGravity(h.gravity);
  }
  function go(next: number) {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function download() {
    const blob = new Blob(
      [
        "mock_data,habitat,material,oxygen_pct,pressure_psi,airflow_cm_s,gravity_g\n" +
          `true,${current.name},${mat.short},${oxygen},${pressure},${airflow},${gravity}\n`,
      ],
      { type: "text/csv" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mock-scenario.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  const filters = (
    <div className="sf-segments" aria-label="Safety focus">
      {["All", "Prevention", "Detection", "Suppression"].map((p) => (
        <button
          key={p}
          aria-pressed={pillar === p}
          onClick={() => setPillar(p)}
        >
          {p === "All" ? null : <ShieldCheck size={12} />} {p}
        </button>
      ))}
    </div>
  );
  const chartData: Record<string, number | number[]>[] = step === 2 ? curve : points;
  const chart = (
    <ResponsiveContainer width="100%" height="100%">
      <ComposedChart
        data={chartData}
        margin={{ top: 20, right: 25, left: 0, bottom: 20 }}
      >
        <CartesianGrid stroke="#28364a" strokeDasharray="3 4" />
        <XAxis
          type="number"
          dataKey={step === 2 ? "g" : "air"}
          domain={step === 2 ? [0, 1] : [0, 45]}
          tick={{ fill: "#94a3ba", fontSize: 11 }}
          label={{
            value:
              step === 2 ? "Gravity level (g)" : "Ventilation airflow (cm/s)",
            position: "bottom",
            fill: "#94a3ba",
            fontSize: 11,
          }}
        />
        <YAxis
          domain={zoom ? [14 + mat.offset, 23 + mat.offset] : ["auto", "auto"]}
          tick={{ fill: "#94a3ba", fontSize: 11 }}
          unit="%"
        />
        <Tooltip
          contentStyle={{
            background: "#101a2a",
            border: "1px solid #34445a",
            borderRadius: 8,
          }}
        />
        {step === 2 && (
          <Area dataKey="band" fill="#83baff" fillOpacity={0.2} stroke="none" />
        )}
        <Line
          type="monotone"
          dataKey={step === 2 ? "value" : "threshold"}
          stroke="#83baff"
          strokeWidth={3}
          dot={false}
        />
        {step !== 2 && <Scatter dataKey="oxygen" fill="#f8ae65" />}
        <ReferenceLine
          x={step === 2 ? gravity : airflow}
          stroke="#d7e6fa"
          strokeDasharray="3 3"
          label={{ value: "YOUR SCENARIO", fill: "#d7e6fa", fontSize: 10 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
  const alerts = [
    [
      "CRITICAL",
      "Exploration atmosphere: O₂-enriched",
      `${oxygen.toFixed(1)}% O₂ in your cabin. This mock scenario illustrates oxygen enrichment relative to Earth.`,
    ],
    [
      "CRITICAL",
      "Earth test is not conservative here",
      "Gravity and airflow can change how materials behave. Compare evidence under matching conditions.",
    ],
    [
      "WARNING",
      "Your fan speed is in the danger band",
      `At ${airflow.toFixed(1)} cm/s, explore the relationship between ventilation and flame behavior.`,
    ],
    [
      "WARNING",
      "Fire spreads toward the fan",
      "Without buoyancy, flames on sheets and fabrics may creep upstream.",
    ],
    [
      "WARNING",
      "Partial gravity evidence gap",
      "No direct mock observations are available at lunar or Martian gravity.",
    ],
    [
      "WARNING",
      "Geometry changes the result",
      "Material thickness and configuration affect the comparison.",
    ],
    [
      "WARNING",
      "Suppression needs context",
      "A screening result alone cannot establish suppression performance.",
    ],
    [
      "WARNING",
      "Review the source",
      "These illustrative records are not verified scientific evidence.",
    ],
  ];
  return (
    <div className="sf-app">
      <header className="sf-status">
        <span>
          <i /> <strong>{current.name}</strong>{" "}
          <small>
            {oxygen.toFixed(1)}% O₂ · {pressure.toFixed(1)} psi ·{" "}
            {airflow.toFixed(1)} cm/s · {gravity.toFixed(2)} g
          </small>
        </span>
        <span className="sf-status-tags">
          <b className="sf-burn">
            <Flame size={12} /> {mat.short}:{" "}
            {margin >= 0 ? "Burns" : "Below mock limit"} {margin.toFixed(1)} pts
          </b>
          <b>MOCK DATA</b>
        </span>
      </header>
      <nav className="sf-steps" aria-label="Scenario workflow">
        {["Scenario", "Evidence", "Predict & Ask"].map((name, i) => (
          <button
            key={name}
            aria-current={step === i ? "step" : undefined}
            onClick={() => go(i)}
          >
            <span>{i < step ? <Check size={12} /> : i + 1}</span>
            {name}
            {i < 2 && <ArrowRight size={13} />}
          </button>
        ))}
        <a href="/research">Research workspace ↗</a>
      </nav>
      <main className="sf-main">
        <div className="sf-eyebrow">
          {step + 1} / 3{" "}
          <span>
            STEP {step + 1} OF 3 ·{" "}
            {
              [
                "BUILD YOUR SCENARIO",
                "EXPLORE THE RANKING & PHYSICAL ALERTS",
                "PREDICT, EXTRACT OR ASK",
              ][step]
            }
          </span>
        </div>
        {step === 0 ? (
          <div className="sf-scenario">
            <section>
              <h1>Where will the crew live?</h1>
              <p className="sf-intro">
                Pick a habitat. PyraScope ranks 30+ years of NASA fire
                experiments for it,
                <br />
                <em>
                  flags the counter-intuitive physics, and predicts what was
                  never tested.
                </em>
              </p>
              <div className="sf-stats">
                {[
                  [
                    Database,
                    "30+",
                    "years of shuttle & ISS fire data scattered across PDFs, videos & CSVs",
                  ],
                  [
                    Layers,
                    "15 · 70",
                    "PSI investigations · curated runs, normalised to one schema",
                  ],
                  [
                    TriangleAlert,
                    "0",
                    "direct fire data points at lunar or Martian gravity",
                  ],
                ].map(([Icon, value, description]) => {
                  const I = Icon as typeof Database;
                  return (
                    <div key={String(value)}>
                      <I size={19} />
                      <section>
                        <strong>{String(value)}</strong>
                        <p>{String(description)}</p>
                      </section>
                    </div>
                  );
                })}
              </div>
              <h2 className="sf-habitat-heading">
                Choose a habitat{" "}
                <small>— each card previews how materials behave there</small>
              </h2>
              <div className="sf-habitats">
                {habitats.map((h, i) => (
                  <button
                    className={`sf-habitat ${habitat === i ? "selected" : ""}`}
                    key={h.name}
                    onClick={() => choose(i)}
                    aria-pressed={habitat === i}
                  >
                    <span className={`sf-planet ${h.art}`} aria-hidden="true" />
                    <span className="sf-radio">
                      {habitat === i && <Check size={13} />}
                    </span>
                    <h3>{h.name}</h3>
                    <p>{h.description}</p>
                    <div className="sf-chips">
                      <span>{h.oxygen}% O₂</span>
                      <span>{h.pressure} psi</span>
                      <span>{h.gravity.toFixed(2)} g</span>
                    </div>
                    <small className="sf-caption">
                      BURN MARGIN BY MATERIAL · MOCK
                    </small>
                    <div className="sf-margins">
                      {materials.map((m, j) => (
                        <span
                          key={m.short}
                          className={j === material ? "chosen" : ""}
                        >
                          {m.short}
                          <br />
                          {(
                            h.oxygen -
                            (16.3 + h.gravity * 1.2 + m.offset)
                          ).toFixed(1)}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
              <p className="sf-footnote">
                Burn margin = cabin O₂ minus the illustrative sustaining-oxygen
                threshold. Positive = burns in this mock model.
              </p>
            </section>
            <aside>
              <div className="sf-atmosphere">
                <h2>Fine-tune atmosphere</h2>
                {[
                  {
                    label: "Oxygen",
                    value: oxygen,
                    set: setOxygen,
                    min: 15,
                    max: 100,
                    step: 0.1,
                    unit: "% O₂",
                    icon: Droplets,
                  },
                  {
                    label: "Cabin pressure",
                    value: pressure,
                    set: setPressure,
                    min: 3,
                    max: 16,
                    step: 0.1,
                    unit: "psi",
                    icon: Gauge,
                  },
                  {
                    label: "Ventilation airflow",
                    value: airflow,
                    set: setAirflow,
                    min: 0,
                    max: 40,
                    step: 0.5,
                    unit: "cm/s",
                    icon: Wind,
                  },
                  {
                    label: "Gravity",
                    value: gravity,
                    set: setGravity,
                    min: 0,
                    max: 1,
                    step: 0.01,
                    unit: "g",
                    icon: Orbit,
                  },
                ].map((c) => (
                  <label className="sf-slider" key={c.label}>
                    <span>
                      <span>
                        <c.icon size={14} />
                        {c.label}
                      </span>
                      <output>
                        {c.value.toFixed(c.label === "Gravity" ? 2 : 1)}{" "}
                        <small>{c.unit}</small>
                      </output>
                    </span>
                    <input
                      aria-label={c.label}
                      type="range"
                      min={c.min}
                      max={c.max}
                      step={c.step}
                      value={c.value}
                      onChange={(e) => c.set(Number(e.target.value))}
                    />
                  </label>
                ))}
                <div className="sf-presets">
                  {presets.map(([name, g]) => (
                    <button
                      key={name}
                      aria-pressed={gravity === g}
                      onClick={() => setGravity(g)}
                    >
                      {name} {g} g
                    </button>
                  ))}
                </div>
                <div className="sf-divider" />
                <h2>Material to evaluate</h2>
                <div className="sf-materials">
                  {materials.map((m, i) => (
                    <button
                      key={m.name}
                      onClick={() => setMaterial(i)}
                      aria-pressed={material === i}
                    >
                      <span>
                        <strong>{m.name}</strong>
                        <small>{m.description}</small>
                      </span>
                      <span className="sf-radio">
                        {material === i && <span />}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="sf-divider" />
                <h2>Safety focus</h2>
                <p className="sf-footnote">
                  Boosts investigations from NASA’s matching fire-safety pillar.
                </p>
                {filters}
              </div>
              <button className="sf-primary" onClick={() => go(1)}>
                See ranked evidence & alerts <ArrowRight size={16} />
              </button>
            </aside>
          </div>
        ) : (
          <>
            <h1>
              {step === 1 ? (
                <>
                  Evidence for <em>{current.name}</em>
                </>
              ) : (
                "Go beyond what was tested"
              )}
            </h1>
            <p className="sf-intro">
              {step === 1 ? (
                <>
                  Read first:{" "}
                  <strong>
                    {ranked
                      .slice(0, 3)
                      .map((i) => `${i.name} (${i.score})`)
                      .join(", ") || "No matching investigations"}
                  </strong>
                  . The ranking, the danger map and the
                  <br /> alerts update live with your scenario.
                </>
              ) : (
                "Predict untested gravities, download a clean table for your own models, or ask the Copilot why a phenomenon happens."
              )}
            </p>
            {step === 1 ? (
              <>
                <div className="sf-section-heading">
                  <div>
                    <h2>Physical alerts</h2>
                    <p>2 critical · counter-intuitive physics to design for</p>
                  </div>
                  <button onClick={() => setAllAlerts(!allAlerts)}>
                    {allAlerts ? "Show fewer" : "Show all 8"} ⌄
                  </button>
                </div>
                <div className="sf-alerts">
                  {alerts
                    .slice(0, allAlerts ? 8 : 4)
                    .map(([severity, title, text], i) => (
                      <article
                        key={title}
                        className={severity === "CRITICAL" ? "critical" : ""}
                      >
                        <small>
                          <TriangleAlert size={16} />
                          {severity}
                        </small>
                        <h3>{title}</h3>
                        <p>{text}</p>
                        <footer>
                          Evidence <b>{investigations[i % 5].name}</b>
                          <b>BASS</b>
                        </footer>
                      </article>
                    ))}
                </div>
                <div className="sf-evidence-grid">
                  <section className="sf-panel sf-ranking">
                    <h2>Most useful NASA investigations</h2>
                    <p>
                      Ranked for your conditions. Select one to see its runs.
                    </p>
                    <details>
                      <summary>How scoring works</summary>
                      <p>
                        Mock scores combine a preset relevance rank, gravity
                        similarity and material selection. Safety focus and fuel
                        filter the results.
                      </p>
                    </details>
                    {filters}
                    <label className="sf-fuel">
                      Fuel type{" "}
                      <select
                        aria-label="Fuel type"
                        value={fuel}
                        onChange={(e) => setFuel(e.target.value)}
                      >
                        {["All fuels", "Solid", "Fabric", "Gas"].map((f) => (
                          <option key={f}>{f}</option>
                        ))}
                      </select>
                    </label>
                    <div className="sf-investigations">
                      {ranked.map((i, index) => (
                        <button
                          key={i.name}
                          className={active?.name === i.name ? "selected" : ""}
                          onClick={() => setSelected(i.name)}
                        >
                          <div>
                            <b>{index + 1}</b>
                            <span>
                              <strong>
                                {i.name} <small>{i.year}</small>
                              </strong>
                              <small>{i.title}</small>
                              <progress value={i.score} max={100} />
                            </span>
                            <strong className="sf-score">{i.score}</strong>
                          </div>
                          <div className="sf-chips">
                            <span>{i.pillar}</span>
                            <span>ISS</span>
                            <span>{i.fuel}</span>
                          </div>
                          {active?.name === i.name && <p>{i.description}</p>}
                        </button>
                      ))}
                      {!ranked.length && (
                        <p className="sf-empty">
                          No investigations match these filters. Choose All
                          pillars or All fuels.
                        </p>
                      )}
                    </div>
                  </section>
                  <section className="sf-panel">
                    <div className="sf-segments sf-view-tabs">
                      {[
                        "Danger map",
                        "Head-to-head",
                        "Inside one investigation",
                      ].map((v) => (
                        <button
                          key={v}
                          aria-pressed={view === v}
                          onClick={() => setView(v)}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {view === "Danger map" ? (
                      <>
                        <h2>Where fire becomes dangerous</h2>
                        <p>
                          At {airflow.toFixed(1)} cm/s and {gravity.toFixed(2)}{" "}
                          g, {mat.name} has an illustrative O₂ threshold of{" "}
                          {limit.toFixed(1)}%.{" "}
                          <strong>
                            Your cabin: {oxygen.toFixed(1)}% O₂ →{" "}
                            <mark>
                              {margin >= 0 ? "Burns" : "Below mock limit"}
                            </mark>
                          </strong>
                        </p>
                        <div className="sf-chart-tools">
                          <div className="sf-segments">
                            {materials.map((m, i) => (
                              <button
                                key={m.short}
                                aria-pressed={material === i}
                                onClick={() => setMaterial(i)}
                              >
                                {m.short}
                              </button>
                            ))}
                          </div>
                          <button
                            aria-pressed={zoom}
                            onClick={() => setZoom(!zoom)}
                          >
                            ⊕ {zoom ? "Reset zoom" : "Zoom on limits"}
                          </button>
                          <button
                            aria-pressed={table}
                            onClick={() => setTable(!table)}
                          >
                            ▦ {table ? "Hide table" : "Data table"}
                          </button>
                        </div>
                        <div className="sf-chart">{chart}</div>
                        {table && (
                          <div className="sf-table-wrap">
                            <table>
                              <caption>Illustrative mock points</caption>
                              <thead>
                                <tr>
                                  <th>Airflow (cm/s)</th>
                                  <th>Threshold (% O₂)</th>
                                </tr>
                              </thead>
                              <tbody>
                                {points.map((p) => (
                                  <tr key={p.air}>
                                    <td>{p.air}</td>
                                    <td>{p.threshold.toFixed(1)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </>
                    ) : view === "Head-to-head" ? (
                      <>
                        <h2>Compare the leading investigations</h2>
                        <div className="sf-table-wrap">
                          <table>
                            <thead>
                              <tr>
                                <th>Investigation</th>
                                <th>Score</th>
                                <th>Safety pillar</th>
                                <th>Fuel</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ranked.map((i) => (
                                <tr key={i.name}>
                                  <td>{i.name}</td>
                                  <td>{i.score}</td>
                                  <td>{i.pillar}</td>
                                  <td>{i.fuel}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2>{active?.name || "Select an investigation"}</h2>
                        <p>{active?.title}</p>
                        <p>{active?.description}</p>
                        {active && (
                          <div className="sf-run">
                            <span>MOCK RUN 01</span>
                            <h3>
                              {mat.name} · {current.name}
                            </h3>
                            <p>
                              {oxygen}% O₂ · {pressure} psi · {airflow} cm/s ·{" "}
                              {gravity} g
                            </p>
                            <small>
                              Illustrative scenario match. No measured
                              experimental run is represented.
                            </small>
                          </div>
                        )}
                      </>
                    )}
                    <p className="sf-footnote">
                      MOCK DATA · Illustrative UI values, not validated
                      scientific results or safety guidance.
                    </p>
                  </section>
                </div>
              </>
            ) : (
              <section className="sf-panel sf-predict">
                <div className="sf-segments sf-view-tabs">
                  {[
                    "Predict partial gravity",
                    "Extract clean data",
                    "Ask Copilot",
                  ].map((t) => (
                    <button
                      key={t}
                      aria-pressed={predictTab === t}
                      onClick={() => setPredictTab(t)}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                {predictTab === "Predict partial gravity" ? (
                  <>
                    <h2>Predict fire behaviour at gravities never tested</h2>
                    <p>
                      Explore an illustrative mock curve between orbit and
                      Earth.
                    </p>
                    <div className="sf-predict-grid">
                      <div>
                        <div className="sf-chart">{chart}</div>
                        <label className="sf-slider">
                          Gravity <output>{gravity.toFixed(2)} g</output>
                          <input
                            aria-label="Prediction gravity"
                            type="range"
                            min="0"
                            max="1"
                            step=".01"
                            value={gravity}
                            onChange={(e) => setGravity(Number(e.target.value))}
                          />
                        </label>
                        <div className="sf-presets">
                          {presets.map(([n, g]) => (
                            <button
                              key={n}
                              aria-pressed={g === gravity}
                              onClick={() => setGravity(g)}
                            >
                              {n} {g} g
                            </button>
                          ))}
                        </div>
                      </div>
                      <aside className="sf-readout">
                        <small>
                          AT {gravity.toFixed(2)} G · MOCK PREDICTION
                        </small>
                        <p>Min. O₂ to keep burning</p>
                        <strong>
                          {(16.3 + gravity * 1.2 + mat.offset).toFixed(1)}
                          <small>% ± 0.3</small>
                        </strong>
                        <hr />
                        <p>Your cabin {oxygen.toFixed(1)}% O₂</p>
                        <span className="sf-burn">
                          {margin >= 0 ? "Burns" : "Below mock limit"}
                        </span>
                        <p>Prediction, not measured evidence.</p>
                      </aside>
                    </div>
                  </>
                ) : predictTab === "Extract clean data" ? (
                  <>
                    <h2>Take your scenario with you</h2>
                    <p>
                      Export the current habitat, atmosphere and selected
                      material as a CSV with an explicit mock-data flag.
                    </p>
                    <button className="sf-primary" onClick={download}>
                      <Download size={16} /> Download mock CSV
                    </button>
                  </>
                ) : (
                  <>
                    <h2>Ask about your scenario</h2>
                    <p>Mock Copilot · prepared demonstration response</p>
                    <form
                      className="sf-ask"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (question.trim())
                          setAnswer(
                            `Demo response for “${question.trim()}”: Your ${current.name} scenario uses ${oxygen.toFixed(1)}% oxygen at ${gravity.toFixed(2)} g. Compare ${
                              ranked
                                .slice(0, 2)
                                .map((i) => i.name)
                                .join(" and ") || "the available investigations"
                            } and review the evidence gaps. This is a mock response, not a source-backed scientific answer.`,
                          );
                      }}
                    >
                      <input
                        aria-label="Ask Copilot"
                        placeholder="Why does gravity change flame behavior?"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                      />
                      <button
                        disabled={!question.trim()}
                        aria-label="Send question"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                    {answer && (
                      <p className="sf-answer" role="status">
                        {answer}
                      </p>
                    )}
                  </>
                )}
                <p className="sf-footnote">
                  MOCK DATA · The existing research and prediction tools remain
                  available in the <a href="/research">research workspace</a>.
                </p>
              </section>
            )}
            <div className="sf-bottom">
              <button onClick={() => go(step - 1)}>
                <ArrowLeft size={16} />{" "}
                {step === 1 ? "Edit scenario" : "Back to evidence"}
              </button>
              {step === 1 && (
                <button className="sf-primary" onClick={() => go(2)}>
                  Continue to Predict & Ask <ArrowRight size={16} />
                </button>
              )}
            </div>
          </>
        )}
        <footer className="sf-disclaimer">
          <ShieldCheck size={13} /> Prototype with mock data · For interface
          demonstration only
        </footer>
      </main>
    </div>
  );
}
