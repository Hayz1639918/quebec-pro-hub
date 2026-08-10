import { describe, expect, it, vi } from "vitest";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {},
}));

import { extractStoragePath, isStorageUrl } from "@/lib/storage";

describe("private storage references", () => {
  it("extracts a legacy public URL path", () => {
    expect(
      extractStoragePath(
        "certifications",
        "https://example.supabase.co/storage/v1/object/public/certifications/123/file.pdf",
      ),
    ).toBe("123/file.pdf");
  });

  it("extracts a signed URL path without its token", () => {
    expect(
      extractStoragePath(
        "chat-attachments",
        "https://example.supabase.co/storage/v1/object/sign/chat-attachments/user/photo.png?token=secret",
      ),
    ).toBe("user/photo.png");
  });

  it("keeps a new object path unchanged", () => {
    expect(extractStoragePath("certifications", "user/rbq.pdf")).toBe("user/rbq.pdf");
  });

  it("recognizes UUID-prefixed private object paths without treating free text as a file", () => {
    expect(isStorageUrl("6ba7b810-9dad-41d1-80b4-00c04fd430c8/identity.pdf")).toBe(true);
    expect(isStorageUrl("Assurance responsabilité civile de 2 M$ ")).toBe(false);
  });
});
