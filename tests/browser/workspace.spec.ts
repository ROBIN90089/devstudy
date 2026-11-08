import { test, expect } from "@playwright/test";
test("solve, save, reload, use tools and notes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Your next chapter starts here." }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Start your first challenge" })
    .click();
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.getByText("2/3 passed")).toBeVisible();
  await page
    .getByRole("textbox", { name: "Code editor" })
    .fill("function solve(input) { return input.reduce((sum,n)=>sum+n,0); }");
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.getByText("3/3 passed")).toBeVisible({ timeout: 15000 });
  await page.getByRole("button", { name: "Save ticket", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "My progress", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /Repair the checkout total/ }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Study toolkit", exact: false })
    .click();
  await expect(page.locator(".tool-card")).toHaveCount(50);
  await page
    .getByRole("textbox", { name: "Search tools" })
    .fill("JSON formatter");
  await page.locator(".tool-card").click();
  await page.getByRole("textbox", { name: "Tool input" }).fill("{bad");
  await page.getByRole("button", { name: "Run tool" }).click();
  await expect(page.locator(".error-box")).toBeVisible();
  await page.getByRole("textbox", { name: "Tool input" }).fill('{"ok":true}');
  await page.getByRole("button", { name: "Run tool" }).click();
  await expect(page.locator(".tool-output")).toContainText('"ok": true');
  await page.getByRole("button", { name: "My notebook" }).click();
  await page
    .getByRole("textbox", { name: "Study notes" })
    .fill("# My first win");
  await page.reload();
  await page.getByRole("button", { name: "My notebook" }).click();
  await expect(page.getByRole("textbox", { name: "Study notes" })).toHaveValue(
    "# My first win",
  );
  expect(errors).toEqual([]);
});
test("mobile navigation and no horizontal overflow", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("button", { name: /Coding challenges/ }).click();
  await expect(page.locator(".challenge-card")).toHaveCount(100);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole("textbox", { name: "Search challenges" })
    .fill("checkout");
  await expect(page.locator(".challenge-card")).toHaveCount(1);
});
test("infinite loop fails without freezing the editor", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start your first challenge" })
    .click();
  await page
    .getByRole("textbox", { name: "Code editor" })
    .fill("function solve(){while(true){}}");
  await page.getByRole("button", { name: "Run tests", exact: true }).click();
  await expect(page.getByText("0/3 passed")).toBeVisible({ timeout: 15000 });
  await expect(
    page.getByRole("button", { name: "Run tests", exact: true }),
  ).toBeEnabled();
});
test("database persists progress and isolates browser sessions", async ({
  browser,
}) => {
  test.skip(!process.env.DATABASE_URL, "PostgreSQL is optional in local mode");
  const a = await browser.newContext(),
    b = await browser.newContext();
  const page = await a.newPage();
  await page.goto("/");
  await expect
    .poll(async () => {
      const r = await a.request.get("/api/progress");
      return (await r.json()).mode;
    })
    .toBe("database");
  await page.getByRole("button", { name: "My notebook" }).click();
  await page
    .getByRole("textbox", { name: "Study notes" })
    .fill("Persisted in PostgreSQL");
  await expect
    .poll(async () => {
      const r = await a.request.get("/api/progress");
      return (await r.json()).progress.notes;
    })
    .toBe("Persisted in PostgreSQL");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole("button", { name: "My notebook" }).click();
  await expect(page.getByRole("textbox", { name: "Study notes" })).toHaveValue(
    "Persisted in PostgreSQL",
  );
  const other = await b.request.get("/api/progress");
  expect((await other.json()).progress.notes).toBe("");
  const blocked = await a.request.put("/api/progress", {
    headers: { Origin: "https://untrusted.example" },
    data: { notes: "bad" },
  });
  expect(blocked.status()).toBe(403);
  await page.getByRole("textbox", { name: "Study notes" }).fill("");
  await page.reload();
  await page.getByRole("button", { name: "My notebook" }).click();
  await expect(page.getByRole("textbox", { name: "Study notes" })).toHaveValue(
    "",
  );
  await expect
    .poll(async () => {
      const response = await a.request.get("/api/progress");
      return (await response.json()).progress.notes;
    })
    .toBe("");
  await a.close();
  await b.close();
});
