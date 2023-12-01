import { expect, test as configure } from "@playwright/test";
import path from "node:path";

const test = configure.extend({
  context: async ({ context }, run) => {
    await context.route("**/*", (route, request) =>
      route.fulfill({
        path: path.join(__dirname, "../..", new URL(request.url()).pathname)
      })
    );
    await run(context);
  }
});

test("test suite passes", async ({ page }) => {
  await page.goto("http://localhost:8080/test.html");
  expect(page.getByTestId("suite")).toHaveAttribute("status", "passed");
  await page.waitForTimeout(100);
});
