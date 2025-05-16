import path from "node:path";
import { test as configure, expect } from "@playwright/test";

const test = configure.extend({
  context: async ({ context }, run) => {
    await context.route("**/*", (route, request) =>
      route.fulfill({
        path: path.join(import.meta.dirname, "../..", new URL(request.url()).pathname),
      }),
    );
    await run(context);
  },
});

test("test suite passes", async ({ page }) => {
  await page.goto("http://localhost:8080/test/test.html");
  expect(page.getByTestId("suite")).toHaveAttribute("status", "passed");
  await page.waitForTimeout(100);
});
