# Gravity generalization: auditable minimum implementation

The repository snapshot contained a literature dashboard, not the gravity prediction chart described in the task. The new panel is additive on Overview; existing research features remain in place. There are **no validated run-level datasets bundled**. The papers and extracted document summaries cannot be treated as matched physical observations. No PSI/BASS-II/SAFFIRE numerical dataset was downloaded, digitized, or used for training. The default view therefore has no estimated curves, experimental markers, or benchmark numbers.

## Run

Install `python -m pip install -e '.[science,test]'`, start the existing FastAPI service, and run the frontend normally. Scientific dependencies are optional for the literature application. The frontend uses the existing Next API proxy and in-memory API token.

Place a reviewed JSON dataset at `<FLAME data_dir>/combustion-observations.json`. The native adapter validates the whole file, with `schema_version: 1` and `observations: []`. Empty observations are a valid unavailable state. An invalid file is rejected, not partially accepted. No automatic inference from literature metadata is performed. Dataset custodians must transcribe or export compatible experimental observations and retain source references. There is no generic PSI conversion because no compatible downloaded file format or measurement table was available for verification.

Each observation requires:

| Field | Meaning / unit |
|---|---|
| experiment_id | Experiment/run identifier |
| source, citation | Source identifier and resolvable citation, including table/page where applicable |
| leakage_group | Shared dependency group across runs/campaigns/sources; use the broadest dependent group |
| provenance | ground, partial_gravity, microgravity, efield_analog, simulation, model_prediction |
| reviewed | Defaults false; scientific custodian must confirm run-level integrity |
| gravity_g | Acceleration / standard gravity (9.80665 m/s²); adapter supports explicit m/s² conversion |
| oxygen_pct | 0–100, percent |
| pressure_kpa | Positive, kPa |
| airflow_cm_s | Nonnegative, cm/s |
| fuel, configuration | Required cohort identifiers; include geometry, mechanism and regime in configuration |
| temperature_k | Positive K or null (explicit missing indicator) |
| outputs | Any subset of minimum_oxygen_pct (%), spread_mm_s (mm/s), length_mm (mm), temperature_k (K); null means missing |
| uncertainty | Optional output → measured standard deviation, in matching units |

Missing required physical conditions are rejected rather than imputed. Missing optional temperature creates a separate cohort. Output absence/null excludes that row for that output only. Observation/Query JSON schemas can be obtained with Pydantic `model_json_schema()`; requests are also in `/api/openapi.json`. NaN/Infinity, unknown fields, negative measurements and unsupported outputs are rejected. Extinction classification is unavailable because no compatible labeled data/model was provided.

## Models, assumptions and uncertainty

* Standard GPR uses a fixed initial Matérn 3/2 covariance plus fitted constant and white-noise kernels. Features are standardized using training rows only; target normalization and measurement variance use matching units. Separate GPs fit each output, without cross-output covariance. Known standard deviations enter the GP diagonal variance. Missing uncertainty does not establish zero measurement error; a numerical jitter is used and white noise is fitted.
* HistGradientBoostingRegressor provides a deterministic comparison baseline. It has no interval estimator here and should not be expected to extrapolate trends.
* Physics-guided GPR is explicitly disabled. No regime-specific cited physical law, baseline coefficients, thermophysical properties, length scale or validated microgravity applicability was available. No arbitrary gravity power law, dimensionless features, or E-FIELD effective-gravity mapping was invented.
* Symbolic regression and correlated multi-task GPs are not implemented.

Only reviewed direct observations are eligible for training; E-FIELD analogs, simulations and model predictions remain labeled in the loader and are excluded. Fuel, geometry/regime configuration, and temperature availability are matched before training. A reviewed flag is an operator attestation, not automatic scientific verification. Input cohorts must still be scientifically reviewed by a domain expert.

GPR intervals are mean ± 1.96 posterior standard deviation, including the fitted WhiteKernel contribution. They are **uncalibrated Gaussian posterior predictive intervals**, not validated confidence bounds or guaranteed physical ranges. Measurement, latent-model, and domain-coverage uncertainties are not separately identified. Intervals can cross physical bounds; physically invalid means are suppressed, not clipped into plausible values. No arbitrary distance-dependent uncertainty inflation is used.

Measured gravity, numerical interpolation/extrapolation, input marginal coverage and joint OOD status are different concepts. The API reports marginal bounds; the joint supported domain and calibrated novelty/failure probabilities remain unavailable. An unmeasured level inside the observed gravity range is interpolation, without implying validated joint support. All conditioning features enter the estimator but feature dependence does not prove causation.

## Validation and API

* `GET /api/ood/status`: data/dependency availability, provenance hash, cohorts, observed gravity levels, output schema, model availability.
* `POST /api/ood/predict`: Query physical inputs plus model (`gpr`, `boosting`, `physics_gpr`). Only outputs with at least three compatible measurements across two gravities are estimated. This minimum is a software eligibility rule, not a scientific sufficiency claim.
* `POST /api/ood/validate`: same Query, optional `holdout_g`; omitted means all gravity levels. For each output, every row at held-out gravity is excluded, along with all rows sharing leakage groups with the test rows. Folds need at least three remaining rows across two gravities. Missing/ineligible folds give reasons. Input oxygen/pressure/airflow do not filter LOGO test observations; evaluation uses each held-out row's recorded conditions within the selected fuel/configuration/temperature-availability cohort.

Each eligible fold includes MAE, RMSE, MAE divided by training target range (null for zero range), R² only with at least two nonconstant test targets, empirical interval coverage/mean width when available, per-source metrics and predicted/observed pairs. The UI compares both baselines for the selected held-out gravity and displays paired values with intervals and a scatter plot. No pooled-only performance claims are made. Sparse single-observation folds cannot establish reliable calibration. Leakage-group quality is the dataset custodian's responsibility.

LOGO is implemented; leave-one-condition-out, nested grouped kernel selection, alternative kernels and calibration are deferred. The initial Matérn kernel is not claimed to have won model selection. There are no scientific validation results until reviewed datasets are supplied. Test fixtures are explicitly synthetic software tests, excluded from dashboard datasets.

## Reproducibility and limits

Models fit on demand and are not deserialized from untrusted pickle files. Responses identify pipeline version `ood-v1` and SHA-256 of the complete source dataset; the input request and installed package versions must also be recorded by callers for reproduction. Persisted fitted model artifacts, training job scheduling, calibrated domain detection and physical-baseline registration are not yet implemented. Small local datasets are intended; large production datasets require offline training and bounded serving workloads.

References for implemented methods: Rasmussen & Williams, *Gaussian Processes for Machine Learning*, MIT Press (2006), https://gaussianprocess.org/gpml/ ; scikit-learn Gaussian process regression https://scikit-learn.org/stable/modules/gaussian_process.html and histogram gradient boosting https://scikit-learn.org/stable/modules/ensemble.html#histogram-based-gradient-boosting . Dataset discovery starting point: NASA Physical Sciences Informatics https://psi.nasa.gov/ . These are method/discovery references, not evidence that any NASA observations were loaded.

This module supports research exploration. Unvalidated estimates are insufficient for spacecraft fire-safety certification.
