import { expect, type Page, type Response } from "@playwright/test";

/** The suite shares a loopback IP; respect each production limiter's deadline. */
async function retryRateLimits(page: Page, response: Response, retry: () => Promise<Response>) {
  const exhausted = new Set<number>();
  while (response.status() === 429 && exhausted.size < 2) {
    const limit = Number(response.headers()["ratelimit-limit"]);
    const seconds = Number(response.headers()["retry-after"]);
    expect([12, 60]).toContain(limit);
    expect(exhausted.has(limit)).toBe(false);
    expect(seconds).toBeGreaterThan(0); expect(seconds).toBeLessThanOrEqual(60);
    exhausted.add(limit);
    await page.waitForTimeout(seconds * 1000 + 100);
    response = await retry();
  }
  return response;
}

export async function openPublicFunnel(page: Page, path: string) {
  const load = async (navigate: () => Promise<unknown>) => {
    const response = page.waitForResponse(response => new URL(response.url()).pathname.startsWith("/api/public/funnels/") && response.request().method() === "GET");
    await navigate();
    return response;
  };
  const response = await retryRateLimits(page, await load(() => page.goto(path)), () => load(() => page.getByRole("button", { name: "Erneut versuchen" }).click()));
  expect(response.status()).toBe(200);
}

export async function submitFunnelLead(page: Page) {
  const submit = async () => {
    const response = page.waitForResponse(response => new URL(response.url()).pathname === "/api/public/leads" && response.request().method() === "POST");
    await page.getByTestId("button-funnel-submit").click();
    return response;
  };
  const response = await retryRateLimits(page, await submit(), async () => {
    await expect(page.getByText("Absenden fehlgeschlagen. Bitte versuche es erneut.")).toBeVisible();
    return submit();
  });
  expect(response.status()).toBe(201);
  return response;
}
