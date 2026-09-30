import { test, expect } from "@playwright/test";

for (const variant of ["control", "alternative"]) {
  test(`Besucherantworten bleiben versioniert, wenn nur die A/B-Alternative neue Optionen enthält: ${variant}`, async ({ page, baseURL }) => {
    const funnel = {
      uuid: "variant-reader", name: "Varianten", documentVersion: 3, publishedRevisionId: 321,
      theme: { primaryColor: "#123456", textColor: "#111111", backgroundColor: "#ffffff", fontFamily: "Inter" },
      pages: [
        { id: "question", type: "question", title: "Auswahl", elements: [{ id: "legacy", type: "radio", label: "Bedarf", required: true, options: ["Beratung"] }] },
        { id: "contact", type: "contact", title: "Kontakt", elements: [{ id: "email", type: "input", placeholder: "E-Mail", required: true, mapToLeadField: "email" }] },
        { id: "done", type: "thankyou", title: "Danke", elements: [] },
      ],
      abTests: [{ id: "test", pageId: "question", name: "Auswahltest", status: "running", variants: [
        { id: "control", name: "Kontrolle", trafficAllocation: 50 },
        { id: "alternative", name: "Alternative", trafficAllocation: 50, elements: [{ id: "stable", type: "radio", label: "Bedarf", required: true, choices: [{ id: "consultation", label: "Beratung" }] }] },
      ] }],
    };
    const payloads: any[] = [];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.addInitScript(variant => {
      sessionStorage.setItem("tw_ab_variant-reader", JSON.stringify({ test: variant }));
      localStorage.setItem("trichterwerk-cookie-consent", "true");
    }, variant);
    await page.route("**/*", route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin !== new URL(baseURL!).origin) return route.abort();
      if (url.pathname === "/api/public/funnels/variant-reader") return route.fulfill({ json: funnel });
      if (url.pathname === "/api/public/leads") {
        payloads.push(request.postDataJSON());
        return route.fulfill({ status: 201, json: { id: "mock-lead" } });
      }
      if (url.pathname.startsWith("/api/")) return route.fulfill({ status: 200, json: {} });
      return route.continue();
    });
    await page.goto("/f/variant-reader");
    await page.getByText("Beratung", { exact: true }).click();
    await page.getByTestId("button-funnel-next").click();
    await page.getByPlaceholder("E-Mail").fill("variant@example.test");
    await page.getByTestId("button-funnel-submit").click();
    await expect(page.getByRole("heading", { name: "Danke", exact: true })).toBeVisible();
    expect(payloads).toHaveLength(1);
    expect(payloads[0].answerSnapshot).toMatchObject({ contentRevisionId: 321, path: ["question", "contact"], variants: { test: variant } });
    expect(payloads[0].answers.Bedarf).toBe("Beratung");
    expect(payloads[0].answerSnapshot.fields[0]).toMatchObject(variant === "alternative"
      ? { elementId: "stable", value: "consultation", optionId: "consultation", optionText: "Beratung" }
      : { elementId: "legacy", value: "Beratung" });
    expect(errors).toEqual([]);
  });
}
