import vercelConfig from "../../../vercel.json";

describe("production security headers", () => {
  it("allows the PDF renderer's WebAssembly module and blob preview frame", () => {
    const contentSecurityPolicy = vercelConfig.headers
      .flatMap(({ headers }) => headers)
      .find(({ key }) => key === "Content-Security-Policy")?.value;

    expect(contentSecurityPolicy).toContain(
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
    );
    expect(contentSecurityPolicy).toContain("frame-src 'self' blob:");
  });

  it("permanently consolidates the www hostname on the canonical domain", () => {
    const canonicalRedirect = vercelConfig.redirects.find(({ has }) =>
      has.some(({ type, value }) => type === "host" && value === "www.batirnet.com"),
    );

    expect(canonicalRedirect).toMatchObject({
      destination: "https://batirnet.com/:path*",
      permanent: true,
    });
  });
});
