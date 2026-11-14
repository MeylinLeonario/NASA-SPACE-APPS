'use client';

import {useEffect, useRef, useState} from 'react';
import {Download, FlaskConical, ShieldCheck} from 'lucide-react';
import OODEvidence from './ood-evidence';
import {downloadJSON} from './ood-download';
import {modelLabels, PredictionCard, propertyLabels, type Result, ValidationResults} from './ood-results';

type Coverage = {
  observations: number; gravity_levels: number[]; prediction_eligible: boolean;
  folds: {gravity_g: number; eligible: boolean; training_n: number; test_n: number}[];
};
type Cohort = {fuel: string; configuration: string; temperature_available: boolean; coverage: Record<string, Coverage>};
type Status = {
  reason: string | null; reviewed_direct_observations: number; dependencies_ready: boolean;
  observations?: number; unreviewed_observations?: number; cohorts: Cohort[]; exploratory_cohorts?: Cohort[]; dataset_sha256: string | null; provenance_counts: Record<string, number>;
};

export default function OODPanel({token}: {token: string}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [gravity, setGravity] = useState(.38);
  const [oxygen, setOxygen] = useState('21');
  const [pressure, setPressure] = useState('101.325');
  const [airflow, setAirflow] = useState('0');
  const [temperature, setTemperature] = useState('');
  const [cohort, setCohort] = useState('0');
  const [model, setModel] = useState('gpr');
  const [exploratory, setExploratory] = useState(false);
  const [holdout, setHoldout] = useState('');
  const [property, setProperty] = useState('all');
  const [result, setResult] = useState<Result | null>(null);
  const [validation, setValidation] = useState<Result[]>([]);
  const activeRequest = useRef<AbortController | null>(null);
  const activeRequestType = useRef<'prediction' | 'validation' | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const headers = {'Content-Type': 'application/json', ...(token ? {Authorization: `Bearer ${token}`} : {})};

  useEffect(() => {
    const controller = new AbortController();
    setStatus(null);
    setError('');
    fetch('/api/ood/status', {signal: controller.signal, headers: token ? {Authorization: `Bearer ${token}`} : {}})
      .then(async response => {
        const data = await response.json();
        if (!response.ok) throw Error(data.error?.message || 'Scientific service unavailable');
        return data;
      })
      .then(data => {if (!controller.signal.aborted) setStatus(data);})
      .catch(reason => {if (!controller.signal.aborted) setError(String(reason));});
    return () => controller.abort();
  }, [token]);

  useEffect(() => {
    activeRequest.current?.abort();
    setBusy(false);
    setError('');
    setResult(null);
    setValidation([]);
    setProperty('all');
    return () => activeRequest.current?.abort();
  }, [gravity, oxygen, pressure, airflow, temperature, cohort, model, token, exploratory]);

  useEffect(() => {
    if (activeRequestType.current === 'validation') {
      activeRequest.current?.abort();
      setBusy(false);
    }
    setValidation([]);
  }, [holdout]);

  const pendingReview = status?.unreviewed_observations || 0;
  const cohortOptions = (exploratory ? status?.exploratory_cohorts : status?.cohorts) || [];
  const selected = cohortOptions[Number(cohort)];
  const coverage = selected?.coverage || {};
  const availableProperties = Object.values(coverage).some(value => value.prediction_eligible);
  const validationLevels = [...new Set(Object.values(coverage).flatMap(value => value.folds.map(fold => fold.gravity_g)))].sort((a, b) => a - b);
  const eligibleLevel = Object.values(coverage).some(value => value.folds.some(fold => fold.gravity_g === Number(holdout) && fold.eligible));
  const ready = !!selected && !!status?.dependencies_ready && availableProperties && (!selected.temperature_available || !!temperature);

  async function run(validate = false) {
    if ((validate && exploratory) || !selected || !form.current?.reportValidity()) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    activeRequestType.current = validate ? 'validation' : 'prediction';
    setBusy(true);
    setError('');
    setResult(null);
    setValidation([]);
    const payload = {
      data_mode: exploratory ? 'exploratory' : 'reviewed',
      gravity_g: gravity, oxygen_pct: Number(oxygen), pressure_kpa: Number(pressure), airflow_cm_s: Number(airflow),
      temperature_k: selected.temperature_available ? Number(temperature) : null,
      fuel: selected.fuel, configuration: selected.configuration,
      holdout_g: validate ? Number(holdout) : null,
    };
    try {
      const responses = await Promise.all((validate ? ['gpr', 'boosting'] : [model]).map(async candidate => {
        const response = await fetch(`/api/ood/${validate ? 'validate' : 'predict'}`, {
          method: 'POST', headers, signal: controller.signal, body: JSON.stringify({...payload, model: candidate}),
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error?.message || 'Scientific request failed');
        return data as Result;
      }));
      if (!controller.signal.aborted) {
        if (validate) setValidation(responses);
        else setResult(responses[0]);
      }
    } catch (reason) {
      if (!controller.signal.aborted) {controller.abort(); setError(String(reason));}
    } finally {
      if (activeRequest.current === controller) setBusy(false);
    }
  }

  async function downloadSchema() {
    try {
      const response = await fetch('/api/ood/schema', {headers});
      const data = await response.json();
      if (!response.ok) throw Error(data.error?.message || 'Dataset schema unavailable');
      downloadJSON('combustion-observations.schema.json', data);
    } catch (reason) {setError(String(reason));}
  }

  return <section className="panel ood-panel" aria-labelledby="ood-title" aria-busy={busy}>
    <div className="ood-heading"><div><span className="eyebrow">GRAVITY GENERALIZATION LAB</span>
      <h3 id="ood-title">Predict fire behaviour at gravities never tested</h3>
      <p>Explore what the evidence supports across gravity levels.</p></div>
      <span className={`tag ${status?.reviewed_direct_observations ? '' : 'neutral'}`}><ShieldCheck size={12}/> {status?.reviewed_direct_observations ? 'Reviewed observations loaded' : pendingReview ? `${pendingReview} observations awaiting review` : 'Awaiting experimental data'}</span>
    </div>
    <div className="ood-gravity"><label htmlFor="ood-gravity">Gravitational acceleration <output htmlFor="ood-gravity">{gravity.toFixed(3)} g</output></label>
      <input id="ood-gravity" type="range" min="0" max="1" step="0.001" value={gravity} onChange={event => setGravity(Number(event.target.value))}/>
      <div className="ood-references">{[['Orbit', 0], ['Moon', .165], ['Mars', .38], ['Earth', 1]].map(([name, value]) =>
        <button type="button" className={`ood-reference ${gravity === value ? 'selected' : ''}`} aria-pressed={gravity === value} key={name} onClick={() => setGravity(Number(value))}>{name}<small>{value} g</small></button>)}</div>
      <p>g is relative to 9.80665 m/s². An unmeasured gravity inside the training range is interpolation; joint OOD support requires separate evidence.</p>
    </div>
    <details open><summary>Scientific Extrapolation &amp; OOD Generalization</summary>
      {error && <div className="alert" role="alert">{error}</div>}
      {!status && !error && <p role="status">Loading scientific data availability…</p>}
      {status && <>
        {!status.reviewed_direct_observations && <div className="ood-empty"><FlaskConical size={26}/><div>
          <h4>{pendingReview ? 'Measurements extracted; scientific review pending.' : 'Bring observations, then test generalization.'}</h4><p>{status.reason}</p>
          {pendingReview ? <><p>Review the imported observations against their PDF pages, table rows, source notes, and exclusions. Extraction does not establish scientific validation.</p><p>The paper bundle includes an extraction audit and a CSV for inspection. Approve compatible records in the local dataset only after scientific review, then reload this page.</p></> : <ol><li>Prepare run-level measurements with citations, units, and dependency groups.</li><li>Review fuel, geometry, and provenance before marking observations as reviewed.</li><li>Save the dataset as combustion-observations.json in the backend data directory.</li></ol>}
          <div className="action-row">{!pendingReview && <button type="button" className="button secondary" onClick={() => downloadJSON('combustion-observations.json', {schema_version: 1, observations: []})}><Download size={14}/> Empty dataset template</button>}
            <button type="button" className="button secondary" onClick={() => void downloadSchema()}>Download field schema</button></div>
        </div></div>}
        {!status.dependencies_ready && <p className="ood-warning">Scientific dependencies are missing. Install the science optional dependencies before fitting models.</p>}
        {!!status.exploratory_cohorts?.length && pendingReview > 0 && <div className="ood-exploratory">
          <label className="ood-mode-toggle"><input type="checkbox" checked={exploratory} onChange={event => {
            const nextOptions = event.target.checked ? status.exploratory_cohorts || [] : status.cohorts;
            const firstEligible = nextOptions.findIndex(item => Object.values(item.coverage).some(output => output.prediction_eligible));
            setExploratory(event.target.checked); setCohort(String(Math.max(0, firstEligible))); setHoldout(''); setTemperature('');
          }}/><span>Use extracted observations for exploratory estimates</span></label>
          <p>Explicit opt-in: includes direct observations whose transcription is pending scientific review. Estimates are not experimentally validated. This does not approve records or enable scientific validation.</p>
          {exploratory && <strong role="status">Exploratory mode active · unreviewed source transcriptions</strong>}
        </div>}
        <form ref={form} onSubmit={event => {event.preventDefault(); void run();}}>
          <div className="ood-controls">
            <label>Regression model<select value={model} onChange={event => setModel(event.target.value)}>
              {Object.entries(modelLabels).map(([key, label]) => <option key={key} value={key}>{label}{key === 'gpr' ? ' · Matérn 3/2' : ''}</option>)}
              <option disabled>Physics-guided GPR · baseline unavailable</option></select></label>
            <label>Fuel / experimental configuration<select value={cohort} onChange={event => {setCohort(event.target.value); setHoldout(''); setTemperature('');}} disabled={!cohortOptions.length}>
              {!cohortOptions.length && <option value="0">{exploratory ? 'No compatible extracted cohort available' : 'No reviewed cohort available'}</option>}
              {cohortOptions.map((value, i) => <option key={i} value={i}>{value.fuel} / {value.configuration}{value.temperature_available ? ' / measured temperature' : ''}</option>)}</select></label>
            <label>Oxygen (%)<input type="number" required min="0" max="100" step="any" value={oxygen} onChange={event => setOxygen(event.target.value)}/></label>
            <label>Pressure (kPa)<input type="number" required min="0.001" step="any" value={pressure} onChange={event => setPressure(event.target.value)}/></label>
            <label>Airflow (cm/s)<input type="number" required min="0" step="any" value={airflow} onChange={event => setAirflow(event.target.value)}/></label>
            {selected?.temperature_available && <label>Initial temperature (K)<input type="number" required min="1" step="any" value={temperature} onChange={event => setTemperature(event.target.value)}/></label>}
          </div>
          {selected && <div className="ood-coverage"><h4>Evidence available for this cohort</h4><div className="ood-results">{Object.entries(coverage).map(([key, value]) => <div className="ood-coverage-item" key={key}>
            <strong>{propertyLabels[key]}</strong><small>{value.observations} observations · {value.gravity_levels.length} gravity levels</small>
            <span>{value.prediction_eligible ? exploratory ? 'Eligible for exploratory fitting · unvalidated' : 'Eligible for fitting · not a validation claim' : 'Insufficient measurements for fitting'}</span></div>)}</div></div>}
          <button className="button primary" disabled={!ready || busy}>{busy ? 'Computing…' : 'Estimate supported properties'}</button>
          {selected && !availableProperties && <p>Each output needs at least three compatible measurements across two gravity levels. This minimum does not establish scientific sufficiency.</p>}
        </form>
        <p className="small-note">Trees have limited ability to extrapolate trends. GPR outputs are fitted independently. Physics-guided GPR requires a documented, applicable physical baseline; no model guarantees extrapolation.</p>
        {result && <div aria-live="polite">{result.data_mode === 'exploratory' && <div className="alert"><strong>Exploratory estimate · not experimentally validated</strong><p>{result.warning}</p></div>}<p>{result.reason}</p>{Object.entries(result.unavailable_outputs || {}).map(([key, reason]) => <p className="ood-warning" key={key}>{propertyLabels[key]}: {reason}</p>)}{Object.keys(result.results).length > 0 && <>
          <div className="ood-result-toolbar"><label>Properties<select value={property} onChange={event => setProperty(event.target.value)}><option value="all">Compare supported properties</option>{Object.keys(result.results).map(key => <option key={key} value={key}>{propertyLabels[key]}</option>)}</select></label>
            <button type="button" className="button secondary" onClick={() => downloadJSON('ood-prediction.json', result)}><Download size={14}/> Export prediction</button></div>
          <div className="ood-results">{Object.entries(result.results).filter(([key]) => property === 'all' || property === key).map(([key, estimate]) => <PredictionCard key={key} name={key} estimate={estimate}/>)}</div>
        </>}</div>}
        <div className="ood-validation"><h4>Test Generalization Across Gravity Levels</h4>
          <p>Inspect the recorded observations at each gravity and preview which rows remain after related campaign groups are excluded. Reviewed data and an eligible split are required to compare model predictions with held-out measurements.</p>
          <div className="ood-result-toolbar"><label>Gravity to hold out<select disabled={!validationLevels.length} value={holdout} onChange={event => setHoldout(event.target.value)}><option value="">Choose a level in this cohort</option>{validationLevels.map(value => <option key={value} value={value}>{value} g{Object.values(coverage).some(item => item.folds.some(f => f.gravity_g === value && f.eligible)) ? '' : ' · insufficient independent training data'}</option>)}</select></label>
            <button type="button" className="button secondary" disabled={exploratory || !ready || busy || holdout === '' || !eligibleLevel} onClick={() => void run(true)}>Compare held-out predictions</button></div>
          {exploratory && <p className="ood-warning">You can inspect observations in exploratory mode. Scientific validation requires reviewed observations and independent held-out groups.</p>}
          {!validationLevels.length && <p>Validation unavailable: this cohort has no reviewed direct measurements to hold out.</p>}
          {holdout !== '' && !eligibleLevel && <p>Validation unavailable at this level: after excluding related groups, no output retains at least three training observations across two other gravity levels.</p>}
          {selected && <OODEvidence cohort={selected} gravity={holdout === '' ? null : Number(holdout)} dataMode={exploratory ? 'exploratory' : 'reviewed'} token={token}/>}
          {!!validation.length && <><button type="button" className="button secondary" onClick={() => downloadJSON('ood-held-out-validation.json', validation)}><Download size={14}/> Export validation</button><ValidationResults results={validation}/></>}
        </div>
        <details className="ood-provenance"><summary>Dataset provenance</summary><p>SHA-256: <small>{status.dataset_sha256 || 'No observation dataset loaded'}</small></p>
          {Object.entries(status.provenance_counts).map(([source, count]) => <p key={source}>{source.replaceAll('_', ' ')}: {count} records</p>)}
          <p>E-FIELD analogs, simulations, and model predictions are excluded. Unreviewed direct observations are included only after explicit exploratory opt-in; reviewed-mode fitting excludes them. Exported results include the exact request, dataset hash, pipeline version, and scientific package versions.</p>
        </details>
      </>}
      <div className="ood-safety"><ShieldCheck size={15}/><span>Research exploration only. Unvalidated predictions are insufficient for spacecraft fire-safety certification.</span></div>
    </details>
  </section>;
}
