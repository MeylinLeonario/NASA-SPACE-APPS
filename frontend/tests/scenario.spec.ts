import { expect, test } from "@playwright/test";

test("scenario survives evidence navigation, filtering and mock export", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname.startsWith("/api/"))
      requests.push(request.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: /Mars Habitat Partial gravity/ })
    .click();
  await expect(
    page.getByRole("slider", { name: "Oxygen", exact: true }),
  ).toHaveValue("26.5");
  await page.getByRole("button", { name: /Nomex \(flame-resistant\)/ }).click();
  await page
    .getByRole("button", { name: "See ranked evidence & alerts" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Evidence for Mars Habitat" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Show all 8" }).click();
  await expect(
    page.getByRole("heading", { name: "Partial gravity evidence gap" }),
  ).toBeVisible();
  await page.getByLabel("Fuel type").selectOption("Gas");
  await expect(page.getByRole("button", { name: /ACME CFI-G/ })).toBeVisible();
  await page.getByRole("button", { name: "Suppression", exact: true }).click();
  await expect(
    page.getByText("No investigations match these filters."),
  ).toBeVisible();
  await page.getByRole("button", { name: "All", exact: true }).click();
  await page.getByLabel("Fuel type").selectOption("All fuels");
  await page
    .getByRole("button", { name: "Inside one investigation", exact: true })
    .click();
  await expect(page.getByText("MOCK RUN 01")).toBeVisible();
  await page.getByRole("button", { name: "Edit scenario" }).click();
  await expect(
    page.getByRole("slider", { name: "Oxygen", exact: true }),
  ).toHaveValue("26.5");
  await expect(
    page.getByRole("button", { name: /Nomex \(flame-resistant\)/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /Predict & Ask/ }).click();
  await page
    .getByRole("button", { name: "Extract clean data", exact: true })
    .click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download mock CSV" }).click();
  expect((await downloadPromise).suggestedFilename()).toBe("mock-scenario.csv");
  await page.getByRole("button", { name: "Ask Copilot", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Ask Copilot" })
    .fill("Why does gravity matter?");
  await page.getByRole("button", { name: "Send question" }).click();
  await expect(page.getByRole("status")).toContainText("Mars Habitat");
  expect(requests).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
