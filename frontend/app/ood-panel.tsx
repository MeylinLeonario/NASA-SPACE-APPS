'use client';
import {useEffect, useState} from 'react';
import {ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, Tooltip, CartesianGrid} from 'recharts';

type Cohort={fuel:string;configuration:string;temperature_available:boolean};
type Status={reason:string|null;reviewed_direct_observations:number;dependencies_ready:boolean;cohorts:Cohort[];gravity_levels:number[];outputs:Record<string,string>;dataset_sha256:string|null};
type Metrics={n:number;mae:number;rmse:number;normalized_mae:number|null;r2:number|null;coverage:number|null;interval_width:number|null};
type Fold={gravity_g:number;status:string;reason?:string;position?:string;metrics?:Metrics;by_source?:Record<string,Metrics>;points?:{observed:number;predicted:number;source:string;interval:[number,number]|null}[]};
type Estimate={unit:string;mean?:number|null;interval?:[number,number]|null;interval_interpretation?:string;gravity_position?:string;within_marginal_ranges?:boolean;joint_domain?:string;sources?:string[];physical_constraint_warning?:string;folds?:Fold[]};
type Result={status:string;reason:string|null;model:string;dataset_sha256:string|null;results:Record<string,Estimate>};
const labels:Record<string,string>={minimum_oxygen_pct:'Minimum sustaining oxygen',spread_mm_s:'Flame-spread velocity',length_mm:'Flame length',temperature_k:'Flame temperature'};
export default function OODPanel({token}:{token:string}){
 const [status,setStatus]=useState<Status|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [gravity,setGravity]=useState(.38),[oxygen,setOxygen]=useState('21'),[pressure,setPressure]=useState('101.325'),[airflow,setAirflow]=useState('0'),[temperature,setTemperature]=useState('');
 const [cohort,setCohort]=useState('0'),[model,setModel]=useState('gpr'),[holdout,setHoldout]=useState(''),[result,setResult]=useState<Result|null>(null),[validation,setValidation]=useState<Result[]>([]),[property,setProperty]=useState('all');
 const headers={'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})};
 useEffect(()=>{let active=true; setStatus(null);setError('');fetch('/api/ood/status',{headers:token?{Authorization:`Bearer ${token}`}:{}}).then(async r=>{if(!r.ok)throw Error('Scientific service unavailable');return r.json();}).then(s=>{if(active)setStatus(s);}).catch(e=>{if(active)setError(String(e));});return()=>{active=false;};},[token]);
 useEffect(()=>{setResult(null);setValidation([]);setProperty('all');},[gravity,oxygen,pressure,airflow,temperature,cohort,model,holdout,token]);
 const selected=status?.cohorts[Number(cohort)];
 const ready=!!selected&&!!status?.dependencies_ready&&(!selected.temperature_available||!!temperature);
 async function run(validate=false){
  if(!selected)return;setBusy(true);setError('');setResult(null);setValidation([]);
  try{
   const models=validate?['gpr','boosting']:[model];
   const responses:Result[]=[];
   for(const candidate of models){
    const response=await fetch(`/api/ood/${validate?'validate':'predict'}`,{method:'POST',headers,body:JSON.stringify({gravity_g:gravity,oxygen_pct:Number(oxygen),pressure_kpa:Number(pressure),airflow_cm_s:Number(airflow),temperature_k:selected.temperature_available?Number(temperature):null,fuel:selected.fuel,configuration:selected.configuration,model:candidate,holdout_g:holdout===''?null:Number(holdout)})});
    const data=await response.json();if(!response.ok)throw Error(data.error?.message||'Scientific request failed');responses.push(data);
   }
   if(validate)setValidation(responses);else setResult(responses[0]);
  }catch(e){setError(String(e));}finally{setBusy(false);}
 }
 return <section className="panel ood-panel"><h3>Predict fire behaviour at gravities never tested</h3><p>Run-level observations are required. Unobserved gravity can be interpolation; it does not by itself establish OOD generalization.</p>
 <label htmlFor="ood-gravity">Gravity: {gravity.toFixed(3)} g (relative to 9.80665 m/s²)</label><input id="ood-gravity" type="range" min="0" max="1" step="0.001" value={gravity} onChange={e=>setGravity(Number(e.target.value))}/>
 <div className="ood-references">{[['Orbit',0],['Moon',.165],['Mars',.38],['Earth',1]].map(([name,g])=><button type="button" className="text-button" key={name} onClick={()=>setGravity(Number(g))}>{name} · {g} g</button>)}</div>
 <details open><summary>Scientific Extrapolation &amp; OOD Generalization</summary>
 {error&&<p role="alert">{error}</p>}{!status&&!error&&<p role="status">Loading scientific data availability…</p>}
 {status&&<><p className="limitations">{status.reason||`${status.reviewed_direct_observations} reviewed direct observations loaded. Compatibility is checked separately for each output.`}</p>
 <form onSubmit={e=>{e.preventDefault();void run();}}><div className="ood-controls">
 <label>Model comparison<select value={model} onChange={e=>setModel(e.target.value)}><option value="gpr">Standard GPR · Matérn 3/2</option><option value="boosting">Gradient Boosting</option><option disabled>Physics-guided GPR · physical baseline unavailable</option></select></label>
 <label>Fuel / configuration<select value={cohort} onChange={e=>setCohort(e.target.value)} disabled={!status.cohorts.length}>{!status.cohorts.length&&<option>No supported cohort</option>}{status.cohorts.map((c,i)=><option key={i} value={i}>{c.fuel} / {c.configuration}{c.temperature_available?' / measured temperature':''}</option>)}</select></label>
 <label>Oxygen (%)<input type="number" required min="0" max="100" step="any" value={oxygen} onChange={e=>setOxygen(e.target.value)}/></label>
 <label>Pressure (kPa)<input type="number" required min="0.001" step="any" value={pressure} onChange={e=>setPressure(e.target.value)}/></label>
 <label>Airflow (cm/s)<input type="number" required min="0" step="any" value={airflow} onChange={e=>setAirflow(e.target.value)}/></label>
 {selected?.temperature_available&&<label>Initial temperature (K)<input type="number" required min="1" step="any" value={temperature} onChange={e=>setTemperature(e.target.value)}/></label>}
 </div><button className="button secondary" disabled={!ready||busy}>{busy?'Computing…':'Estimate supported properties'}</button></form>
 <p>Trees have limited ability to extrapolate beyond training ranges. GPR outputs are independent and do not model cross-property correlations. No model guarantees extrapolation.</p>
 {result&&<><p>{result.reason}</p>{Object.keys(result.results).length>0&&<label>Supported properties<select value={property} onChange={e=>setProperty(e.target.value)}><option value="all">Compare all supported properties</option>{Object.keys(result.results).map(key=><option key={key} value={key}>{labels[key]}</option>)}</select></label>}<div className="ood-results">{Object.entries(result.results).filter(([key])=>property==='all'||property===key).map(([key,r])=><article className="limitations" key={key}><h4>{labels[key]} ({r.unit})</h4><p>{r.mean?.toFixed(3)??'Unavailable'}{r.interval&&` · interval [${r.interval.map(n=>n.toFixed(3)).join(', ')}]`}</p><p>{r.physical_constraint_warning}</p><p>{r.interval_interpretation}</p><p>Gravity: {r.gravity_position}. Inside input marginal ranges: {r.within_marginal_ranges?'yes':'no — outside training domain'}. Joint domain: {r.joint_domain}.</p><p>Novelty probability and domain coverage uncertainty: unavailable. Measurement errors enter fitting where reported; they are not separately estimated here.</p><p>Independent validation: not established by this prediction.</p><p>Conditioning variables: gravity, oxygen, pressure, airflow{selected?.temperature_available?', temperature':''}. This is statistical association, not proof of physical causation.</p><ul>{r.sources?.map(s=><li key={s}>{s}</li>)}</ul></article>)}</div></>}
 <h4>Test Generalization Across Gravity Levels</h4><label>Observed gravity to hold out <select value={holdout} onChange={e=>setHoldout(e.target.value)}><option value="">Choose an observed level</option>{status.gravity_levels.map(g=><option key={g} value={g}>{g} g</option>)}</select></label>
 <button type="button" className="button secondary" disabled={!ready||busy||holdout===''} onClick={()=>void run(true)}>Compare GPR and Gradient Boosting</button>
 {!status.gravity_levels.length&&<p>Validation disabled: no direct reviewed observations at any gravity level.</p>}
 {validation.map(v=><div key={v.model}><h4>{v.model}</h4><p>{v.reason}</p>{Object.entries(v.results).map(([key,r])=><div key={key}><h4>{labels[key]} ({r.unit})</h4>{r.folds?.map(f=><div key={f.gravity_g}><p>{f.gravity_g} g · {f.position||f.status} · {f.reason}</p>{f.metrics&&<><p>n={f.metrics.n} · MAE {f.metrics.mae.toFixed(3)} · RMSE {f.metrics.rmse.toFixed(3)} · normalized MAE {f.metrics.normalized_mae?.toFixed(3)??'unavailable'} · R² {f.metrics.r2?.toFixed(3)??'unavailable'} · interval coverage {f.metrics.coverage?.toFixed(3)??'unavailable'} · mean interval width {f.metrics.interval_width?.toFixed(3)??'unavailable'}</p><p>Coverage is empirical for this fold; Gaussian intervals remain uncalibrated.</p><div style={{height:220}}><ResponsiveContainer width="100%" height="100%"><ScatterChart><CartesianGrid stroke="#343434"/><XAxis dataKey="observed" type="number" name="Observed" unit={` ${r.unit}`}/><YAxis dataKey="predicted" type="number" name="Predicted" unit={` ${r.unit}`}/><Tooltip/><Scatter data={f.points} fill="#ff864b"/></ScatterChart></ResponsiveContainer></div><table><caption>Held-out observations and predictions ({r.unit})</caption><thead><tr><th>Source</th><th>Observed</th><th>Predicted</th><th>Interval</th></tr></thead><tbody>{f.points?.map((p,i)=><tr key={i}><td>{p.source}</td><td>{p.observed.toFixed(3)}</td><td>{p.predicted.toFixed(3)}</td><td>{p.interval?.map(n=>n.toFixed(3)).join(' – ')??'Unavailable'}</td></tr>)}</tbody></table>{Object.entries(f.by_source||{}).map(([s,m])=><p key={s}>{s}: n={m.n}, MAE {m.mae.toFixed(3)}, RMSE {m.rmse.toFixed(3)}</p>)}</>}</div>)}</div>)}</div>)}
 <p>Dataset SHA-256: <small>{status.dataset_sha256||'No observation artifact'}</small>. E-FIELD analogs, simulations, model predictions, and unreviewed records are excluded from training.</p></>}
 <p>Research exploration only. Unvalidated predictions are insufficient for spacecraft fire-safety certification.</p>
 </details></section>;
}
