import { test, expect, type Page } from "@playwright/test";

/**
 * E2E — routes publiques (environnement Supabase factice : aucune donnée
 * réelle ; on vérifie le rendu, la navigation, les formulaires, le responsive
 * et l'absence d'erreurs applicatives en console).
 */

// L'overlay d'introduction s'affiche au premier chargement — on le marque
// comme déjà vu pour des tests déterministes.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("bn_intro_done_v1", "1");
  });
});

/** Erreurs console applicatives (on ignore le réseau vers le Supabase factice). */
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (
      text.includes("stub.supabase.co") ||
      text.includes("Failed to load resource") ||
      text.includes("net::ERR") ||
      text.includes("TypeError: Failed to fetch") ||
      text.includes("AuthRetryableFetchError")
    ) {
      return;
    }
    errors.push(text);
  });
  return errors;
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const el = document.documentElement;
    return el.scrollWidth - el.clientWidth;
  });
  expect(overflow, "la page ne doit pas défiler horizontalement").toBeLessThanOrEqual(0);
}

test.describe("Accueil", () => {
  test("affiche le contenu principal sans erreur console", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation").first()).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("Responsive — pas de débordement horizontal", () => {
  const routes = ["/", "/auth", "/professionals", "/projects", "/privacy-policy"];
  const widths = [320, 390, 768, 1024, 1440];

  for (const route of routes) {
    test(`${route} de 320px à 1440px`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState("networkidle").catch(() => {});
      for (const width of widths) {
        await page.setViewportSize({ width, height: 900 });
        await page.waitForTimeout(150);
        await expectNoHorizontalOverflow(page);
      }
    });
  }
});

test.describe("Authentification", () => {
  test("formulaire de connexion : champs, OAuth masqué et validation courriel", async ({ page }) => {
    await page.goto("/auth?mode=login");

    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Boutons OAuth (US-002) : implémentés mais masqués tant que
    // VITE_ENABLE_OAUTH n'est pas à "true" (décision 2026-07-12).
    await expect(page.getByRole("button", { name: /Google/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Apple/i })).toHaveCount(0);
    // La bascule connexion↔inscription reste visible sous le formulaire.
    await expect(page.getByRole("button", { name: /Pas encore de compte/ })).toBeVisible();

    // Validation côté client : courriel accepté par la validation native du
    // navigateur mais rejeté par la validation applicative (TLD manquant)
    // → erreur inline, sans appel réseau.
    await page.locator("#email").fill("test@exemple");
    await page.locator("#password").fill("Password1!");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("inscription : sélecteur de type de compte et indicateur de force du mot de passe", async ({ page }) => {
    await page.goto("/auth?mode=signup");

    // Les trois types de comptes
    await expect(page.getByRole("button", { name: /Propriétaire/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Entrepreneur général/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /Pro métier/ })).toBeVisible();

    // Indicateur de force du mot de passe
    await page.locator("#signup-password").fill("abc");
    await expect(page.getByText("8 caractères minimum")).toBeVisible();
    await expect(page.getByText("Une lettre majuscule")).toBeVisible();
  });

  test("bascule connexion ↔ inscription", async ({ page }) => {
    await page.goto("/auth?mode=login");
    await page.getByRole("button", { name: /Pas encore de compte/ }).click();
    await expect(page.getByRole("heading", { name: "Inscription" })).toBeVisible();
  });
});

test.describe("Pages publiques", () => {
  test("annuaire des professionnels : rendu sans crash", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/professionals");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("place de marché des projets : rendu sans crash", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/projects");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("politique de confidentialité : rendu", async ({ page }) => {
    await page.goto("/privacy-policy");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("page 404 pour une route inconnue", async ({ page }) => {
    await page.goto("/cette-route-n-existe-pas");
    await expect(page.getByText(/404|introuvable|not found/i).first()).toBeVisible();
  });
});
