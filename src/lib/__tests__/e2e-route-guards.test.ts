import { describe, expect, it } from "vitest";
import appSource from "../../App.tsx?raw";

describe("critical E2E route guards", () => {
  it("keeps contract proposal review inside the client-only route group", () => {
    const clientGroup = appSource.match(
      /<Route element={<ProtectedClientRoute\s*\/>}>[\s\S]*?<\/Route>/,
    )?.[0];

    expect(clientGroup).toBeDefined();
    expect(clientGroup).toContain('path="/proposals/review"');
  });

  it("does not place contract proposal review inside the professional-only route group", () => {
    const professionalGroup = appSource.match(
      /<Route element={<ProtectedProRoute\s*\/>}>[\s\S]*?<\/Route>/,
    )?.[0];

    expect(professionalGroup).toBeDefined();
    expect(professionalGroup).not.toContain('path="/proposals/review"');
  });
});
