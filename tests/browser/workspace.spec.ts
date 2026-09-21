import { test, expect } from "@playwright/test";
import { actor, fixture } from "../fixtures";
import { query, pool } from "../../src/lib/db";
let user: Awaited<ReturnType<typeof actor>>;
test.beforeAll(async () => {
  user = await actor("Maya Creator");
  await fixture(user.id);
});
test.afterAll(async () => {
  await query('DELETE FROM "user" WHERE id=$1', [user.id]);
  await pool.end();
});
test.beforeEach(async ({ context, page }) => {
  const [name, ...parts] = user.cookie.split("=");
  await context.addCookies([
    {
      name,
      value: parts.join("="),
      url: "http://localhost:3100",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.route("**/api/media/*/preview", (route) =>
    route.fulfill({
      contentType: "video/mp4",
      path: "tests/fixtures/video.mp4",
    }),
  );
});
test("workspace, navigation and responsive layout", async ({ page }, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your publishing desk" }),
  ).toBeVisible();
  await expect(page.getByText("Creator channel").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `.local/overview-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Calendar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Publishing calendar" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Next month" }).click();
});
test("creates and edits a real draft, then schedules and cancels it", async ({
  page,
}, info) => {
  await page.goto("/compose");
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "A day in the studio.mp4" }).click();
  await page.getByText("Creator channel", { exact: true }).click();
  await page
    .getByLabel("Shared caption", { exact: true })
    .fill("Made in the studio.");
  await page
    .getByPlaceholder("Give your video a title")
    .fill("A day in the studio");
  await page
    .getByRole("combobox")
    .filter({ hasText: "Is this video made for kids?" })
    .click();
  await page
    .getByRole("option", { name: "No, it’s not made for kids" })
    .click();
  await page.screenshot({
    path: `.local/composer-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(page).toHaveURL(/\/posts$/);
  const draft = page
    .locator(".post-row")
    .filter({ hasText: "Made in the studio." });
  await expect(draft).toContainText("draft");
  await draft.getByRole("link", { name: "Edit", exact: true }).click();
  await page.getByRole("button", { name: "Schedule for later" }).click();
  await page.getByLabel("Timezone", { exact: true }).fill("UTC");
  const future = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
  await page.getByLabel("Date and time", { exact: true }).fill(future);
  await page
    .getByRole("button", { name: "Schedule post", exact: true })
    .click();
  await expect(page).toHaveURL(/\/posts$/);
  const scheduled = page
    .locator(".post-row")
    .filter({ hasText: "Made in the studio." });
  await expect(scheduled).toContainText("scheduled");
  await scheduled.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(scheduled).toContainText("canceled");
});
test("accounts, video library, billing and settings render without page errors", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const [path, title] of [
    ["/accounts", "Connected accounts"],
    ["/library", "Video library"],
    ["/billing", "Your plan"],
    ["/settings", "Settings"],
  ]) {
    await page.goto(path);
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    await expect(page.locator(".loading")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("unauthenticated users get Google sign-in and protected APIs reject them", async ({
  context,
  page,
}) => {
  await context.clearCookies();
  await page.goto("/");
  await expect(
    page.getByRole("button", { name: "Continue with Google" }),
  ).toBeVisible();
  const r = await page.request.get("/api/workspace");
  expect(r.status()).toBe(401);
});
