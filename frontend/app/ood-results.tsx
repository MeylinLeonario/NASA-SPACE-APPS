'use client';

import {
  CartesianGrid, ErrorBar, ReferenceLine, ResponsiveContainer,
  Scatter, ScatterChart, Tooltip, XAxis, YAxis,
} from 'recharts';

export const propertyLabels: Record<string, string> = {
  minimum_oxygen_pct: 'Minimum sustaining oxygen',
  spread_mm_s: 'Flame-spread velocity',
  length_mm: 'Flame length',
  temperature_k: 'Flame temperature',
};
export const modelLabels: Record<string, string> = {
  gpr: 'Standard GPR', boosting: 'Gradient Boosting',
};

type Metrics = {
  n: number; mae: number; rmse: number; normalized_mae: number | null;
  r2: number | null; coverage: number | null; interval_width: number | null;
};
type Point = { observed: number; predicted: number; source: string; interval: [number, number] | null };
type Fold = {
  gravity_g: number; status: string; reason?: string; position?: string;
  training_n?: number; metrics?: Metrics; by_source?: Record<string, Metrics>; points?: Point[];
};
export type Estimate = {
  unit: string; mean?: number | null; interval?: [number, number] | null;
  interval_interpretation?: string; gravity_position?: string; within_marginal_ranges?: boolean;
  joint_domain?: string; sources?: string[]; physical_constraint_warning?: string;
  outside_features?: string[]; training_n?: number; folds?: Fold[];
};
export type Result = {
  status: string; reason: string | null; model: string; dataset_sha256: string | null;
  results: Record<string, Estimate>; request: Record<string, unknown>;
  artifact_version: string; package_versions: Record<string, string>;
};
const number = (value: number | null | undefined) => value == null ? 'Unavailable' : value.toFixed(3);

export function PredictionCard({name, estimate: r}: {name: string; estimate: Estimate}) {
  return <article className="ood-estimate">
    <span className="eyebrow">{propertyLabels[name]}</span>
    <div className="ood-estimate-value">{number(r.mean)} <small>{r.unit}</small></div>
    <p>{r.interval ? `95% interval: ${r.interval.map(number).join(' to ')} ${r.unit}` : 'Prediction interval unavailable'}</p>
    <div className="ood-badges"><span className="tag">{r.gravity_position}</span><span className="tag neutral">{r.training_n} training observations</span></div>
    {r.physical_constraint_warning && <p role="alert">{r.physical_constraint_warning}</p>}
    {r.outside_features?.length ? <p className="ood-warning">Outside training ranges: {r.outside_features.join(', ')}.</p> : <p>Inputs are within marginal training ranges. Joint support is not established.</p>}
    <details><summary>Uncertainty, sources &amp; limitations</summary>
      <p>{r.interval_interpretation}</p>
      <p>Known measurement errors enter fitting where reported; model and domain coverage uncertainty are not separately identified. A calibrated novelty or failure probability is unavailable.</p>
      <p>This estimate has not itself established independent validation. Conditioning variables express statistical association, not proof of physical causation.</p>
      <ul>{r.sources?.map(source => <li key={source}>{source}</li>)}</ul>
    </details>
  </article>;
}

function ValidationFold({fold: f, unit}: {fold: Fold; unit: string}) {
  if (!f.metrics) return <p>{f.gravity_g} g: {f.reason}</p>;
  const points = f.points || [];
  const values = points.flatMap(p => [p.observed, p.predicted, ...(p.interval || [])]);
  const lo = Math.min(...values), hi = Math.max(...values);
  const padding = (hi - lo || Math.abs(lo) || 1) * .1;
  const domain: [number, number] = [lo - padding, hi + padding];
  const chartPoints = points.map(p => ({...p, error: p.interval ? [p.predicted - p.interval[0], p.interval[1] - p.predicted] : [0, 0]}));
  return <article className="ood-fold">
    <h4>{f.gravity_g} g · {f.position}</h4>
    <p>{f.metrics.n} held-out observations · {f.training_n} training observations after related groups were excluded.</p>
    <dl className="ood-metrics">
      {Object.entries({MAE: number(f.metrics.mae), RMSE: number(f.metrics.rmse),
        'Normalized MAE': number(f.metrics.normalized_mae), 'R²': number(f.metrics.r2),
        'Interval coverage': f.metrics.coverage == null ? 'Unavailable' : `${(f.metrics.coverage * 100).toFixed(1)}%`,
        'Mean interval width': number(f.metrics.interval_width)}).map(([label, value]) =>
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
    </dl>
    <p>Observed versus predicted ({unit}). The dashed line represents perfect agreement. Error bars show uncalibrated Gaussian intervals when available; coverage describes this held-out fold only.</p>
    <div className="ood-scatter"><ResponsiveContainer width="100%" height="100%">
      <ScatterChart margin={{top: 12, right: 24, bottom: 22, left: 12}}>
        <CartesianGrid stroke="#283341"/>
        <XAxis dataKey="observed" type="number" name="Observed" domain={domain} label={{value: `Observed (${unit})`, position: 'bottom'}} tickFormatter={v => Number(v).toPrecision(3)}/>
        <YAxis dataKey="predicted" type="number" name="Predicted" domain={domain} label={{value: `Predicted (${unit})`, angle: -90, position: 'insideLeft'}} tickFormatter={v => Number(v).toPrecision(3)}/>
        <Tooltip/>
        <ReferenceLine segment={[{x: domain[0], y: domain[0]}, {x: domain[1], y: domain[1]}]} stroke="#8497a9" strokeDasharray="4 4"/>
        <Scatter name="Held-out observations" data={chartPoints} fill="#f38b55">
          <ErrorBar dataKey="error" direction="y" stroke="#f3b48f" width={5}/>
        </Scatter>
      </ScatterChart>
    </ResponsiveContainer></div>
    <div className="ood-table-scroll"><table>
      <caption>Held-out pairs ({unit})</caption>
      <thead><tr><th scope="col">Source</th><th scope="col">Observed</th><th scope="col">Predicted</th><th scope="col">Interval</th></tr></thead>
      <tbody>{points.map((p, i) => <tr key={i}><td>{p.source}</td><td>{number(p.observed)}</td><td>{number(p.predicted)}</td><td>{p.interval?.map(number).join(' to ') || 'Unavailable'}</td></tr>)}</tbody>
    </table></div>
    <details><summary>Error by source</summary>{Object.entries(f.by_source || {}).map(([source, m]) =>
      <p key={source}>{source}: n={m.n}, MAE {number(m.mae)}, RMSE {number(m.rmse)}, coverage {number(m.coverage)}, interval width {number(m.interval_width)}.</p>)}</details>
  </article>;
}

export function ValidationResults({results}: {results: Result[]}) {
  return <div className="ood-validation-results">{results.map(result => <section key={result.model}>
    <h4>{modelLabels[result.model]}</h4><p>{result.reason}</p>
    {Object.entries(result.results).map(([key, estimate]) => <div key={key}>
      <h4>{propertyLabels[key]} ({estimate.unit})</h4>
      {estimate.folds?.map(fold => <ValidationFold key={fold.gravity_g} fold={fold} unit={estimate.unit}/>)}
    </div>)}
  </section>)}</div>;
}
