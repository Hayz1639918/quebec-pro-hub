import homeDocument from "../../../index.html?raw";
import packageLock from "../../../package-lock.json?raw";
import packageJson from "../../../package.json";
import viteConfig from "../../../vite.config.ts?raw";
import tenderView from "../../pages/TenderView.tsx?raw";

describe("BâtirNet public branding", () => {
  it("uses only BâtirNet metadata and build tooling", () => {
    const retiredGeneratorBrand = ["lova", "ble"].join("");
    const publicBranding = [
      homeDocument,
      packageLock,
      JSON.stringify(packageJson),
      viteConfig,
    ]
      .join("\n")
      .toLowerCase();

    expect(publicBranding).not.toContain(retiredGeneratorBrand);
    expect(homeDocument).toContain('rel="canonical" href="https://batirnet.com/"');
    expect(homeDocument).toContain('href="/favicon.ico"');
    expect(homeDocument).toContain('content="https://batirnet.com/logo-batirnet.png"');
  });
});

describe("public tender PDF controls", () => {
  it("offers download without embedding a PDF preview", () => {
    expect(tenderView).toContain("Télécharger le PDF");
    expect(tenderView).not.toContain("PDFViewer");
    expect(tenderView).not.toContain("Prévisualiser le PDF");
    expect(tenderView).not.toContain("Prévisualisation du document complet");
  });
});
