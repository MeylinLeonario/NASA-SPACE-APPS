/** Synthetic API fixtures verify software behavior, never scientific performance. */
import {expect, test, type Page} from '@playwright/test';

const coverage = {
  spread_mm_s: {
    observations: 5, gravity_levels: [0, .2, .5, 1], prediction_eligible: true,
    folds: [0, .2, .5, 1].map(gravity_g => ({gravity_g, eligible: gravity_g !== .2, training_n: 3, test_n: 1})),
  },
  length_mm: {observations: 0, gravity_levels: [], prediction_eligible: false, folds: []},
};
const loaded = {
  reason: null, reviewed_direct_observations: 6, dependencies_ready: true, dataset_sha256: 'software-fixture-only',
  provenance_counts: {partial_gravity: 6},
  cohorts: [
    {fuel: 'Software test fuel', configuration: 'Test configuration', temperature_available: false, coverage},
    {fuel: 'Other test fuel', configuration: 'Other configuration', temperature_available: false,
      coverage: {spread_mm_s: {observations: 1, gravity_levels: [.8], prediction_eligible: false,
        folds: [{gravity_g: .8, eligible: false, training_n: 0, test_n: 1}]}}},
  ],
};
const empty = {...loaded, reason: 'No reviewed run-level experimental observations supplied.', reviewed_direct_observations: 0, cohorts: [], dataset_sha256: null, provenance_counts: {}};
const statistics = {
  total_papers: 0, indexed_chunks: 0, total_pages: 0, experiments_represented: 0, research_categories: 0,
  extraction_failures: 0, extraction_warning_pages: 0, verified_findings: 0, source_checked_findings: 0,
  experiment_distribution: [], publication_timeline: [], category_distribution: [], usage: {},
  paid_api_enabled: false, embedded_chunks: 0,
};

async function setup(page: Page, status: typeof loaded | typeof empty = loaded) {
  await page.route('**/api/**', async route => {
    const path = new URL(route.request().url()).pathname;
    const json = path === '/api/ood/status' ? status : path === '/api/statistics' ? statistics :
      path === '/api/documents' ? [] : path === '/api/ood/schema' ? {title: 'Dataset', type: 'object'} : {items: []};
    await route.fulfill({json});
  });
  await page.goto('/');
  return page.getByRole('region', {name: 'Predict fire behaviour at gravities never tested'});
}

function prediction(mean: number, oxygen: number) {
  return {
    status: 'available', reason: null, model: 'gpr', dataset_sha256: 'software-fixture-only', artifact_version: 'ood-v2',
    package_versions: {'scikit-learn': 'test'}, request: {oxygen_pct: oxygen},
    results: {spread_mm_s: {unit: 'mm/s', mean, interval: [mean - .1, mean + .1], gravity_position: 'interpolation',
      training_n: 5, outside_features: [], sources: ['Synthetic software test fixture'], interval_interpretation: 'Uncalibrated software fixture'}},
  };
}

test('empty state offers a measurement-free template and blocks fitting', async ({page}) => {
  const panel = await setup(page, empty);
  await expect(panel.getByText('Bring observations, then test generalization.')).toBeVisible();
  await expect(panel.getByRole('button', {name: 'Estimate supported properties'})).toBeDisabled();
  await expect(panel.getByRole('button', {name: 'Compare held-out predictions'})).toBeDisabled();
  const downloadEvent = page.waitForEvent('download');
  await panel.getByRole('button', {name: 'Empty dataset template'}).click();
  const download = await downloadEvent;
  const stream = await download.createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  expect(JSON.parse(Buffer.concat(chunks).toString())).toEqual({schema_version: 1, observations: []});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('validation levels belong to selected cohort and honor group exclusions', async ({page}) => {
  const panel = await setup(page);
  const levels = panel.getByLabel('Gravity to hold out');
  await expect(levels.locator('option[value="0.8"]')).toHaveCount(0);
  await levels.selectOption('0.2');
  await expect(panel.getByRole('button', {name: 'Compare held-out predictions'})).toBeDisabled();
  await expect(panel.getByText(/after excluding related groups, no output retains/)).toBeVisible();
  await panel.getByLabel('Fuel / experimental configuration').selectOption('1');
  await expect(levels).toHaveValue('');
  await expect(levels.locator('option[value="0.8"]')).toHaveCount(1);
  await expect(levels.locator('option[value="0.2"]')).toHaveCount(0);
  await expect(panel.getByRole('button', {name: 'Estimate supported properties'})).toBeDisabled();
});

test('validation cannot bypass required physical inputs', async ({page}) => {
  let requests = 0;
  const panel = await setup(page);
  await page.route('**/api/ood/validate', async route => {requests++; await route.fulfill({json: {results: {}}});});
  await panel.getByLabel('Gravity to hold out').selectOption('0');
  await panel.getByLabel('Oxygen (%)').fill('');
  await panel.getByRole('button', {name: 'Compare held-out predictions'}).click();
  expect(await panel.getByLabel('Oxygen (%)').evaluate(input => (input as HTMLInputElement).validity.valueMissing)).toBe(true);
  expect(requests).toBe(0);
});

test('late predictions cannot overwrite changed conditions and exports retain provenance', async ({page}) => {
  const panel = await setup(page);
  let release!: () => void;
  let fulfilled!: () => void;
  let started = false;
  const pending = new Promise<void>(resolve => {release = resolve;});
  const completed = new Promise<void>(resolve => {fulfilled = resolve;});
  await page.route('**/api/ood/predict', async route => {
    const oxygen = route.request().postDataJSON().oxygen_pct;
    if (oxygen === 21) {
      started = true;
      await pending;
      await route.fulfill({json: prediction(777, oxygen)}).catch(() => {});
      fulfilled();
    } else await route.fulfill({json: prediction(1.234, oxygen)});
  });
  await panel.getByRole('button', {name: 'Estimate supported properties'}).click();
  await expect.poll(() => started).toBe(true);
  await panel.getByLabel('Oxygen (%)').fill('22');
  await panel.getByRole('button', {name: 'Estimate supported properties'}).click();
  await expect(panel.locator('.ood-estimate-value')).toContainText('1.234');
  release();
  await completed;
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await expect(panel.locator('.ood-estimate-value')).toContainText('1.234');
  const downloadEvent = page.waitForEvent('download');
  await panel.getByRole('button', {name: 'Export prediction'}).click();
  const stream = await (await downloadEvent).createReadStream();
  const chunks = [];
  for await (const chunk of stream!) chunks.push(chunk);
  const report = JSON.parse(Buffer.concat(chunks).toString());
  expect(report.request.oxygen_pct).toBe(22);
  expect(report.dataset_sha256).toBe('software-fixture-only');
  expect(report.artifact_version).toBe('ood-v2');
  expect(report.package_versions).toBeTruthy();
});

test('held-out comparison renders both models, intervals and accessible pairs', async ({page}) => {
  const panel = await setup(page);
  await page.route('**/api/ood/validate', async route => {
    const model = route.request().postDataJSON().model;
    const metrics = {n: 1, mae: .1, rmse: .1, normalized_mae: .1, r2: null, coverage: model === 'gpr' ? 1 : null, interval_width: model === 'gpr' ? .4 : null};
    await route.fulfill({json: {
      ...prediction(1.234, 21), model,
      results: {spread_mm_s: {unit: 'mm/s', folds: [{gravity_g: 0, status: 'evaluated', position: 'extrapolation', training_n: 3,
        metrics, by_source: {'Synthetic software fixture': metrics},
        points: [{source: 'Synthetic software fixture', observed: 1.1, predicted: 1.2, interval: model === 'gpr' ? [1, 1.4] : null}]}]}},
    }});
  });
  await panel.getByLabel('Gravity to hold out').selectOption('0');
  await panel.getByRole('button', {name: 'Compare held-out predictions'}).click();
  await expect(panel.getByRole('heading', {name: 'Standard GPR', exact: true})).toBeVisible();
  await expect(panel.getByRole('heading', {name: 'Gradient Boosting', exact: true})).toBeVisible();
  await expect(panel.getByRole('table')).toHaveCount(2);
  await expect(panel.getByRole('cell', {name: '1.000 to 1.400', exact: true})).toBeVisible();
  await expect(panel.getByRole('cell', {name: 'Unavailable', exact: true})).toBeVisible();
  await expect(panel.locator('.ood-scatter svg.recharts-surface')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
