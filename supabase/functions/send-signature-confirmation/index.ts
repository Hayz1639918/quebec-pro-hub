import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

// Origins allowed to call this function from a browser. Keep in sync with the
// deployed front-end domains. Non-browser callers (server-to-server) send no
// Origin header and are unaffected.
const ALLOWED_ORIGINS = [
  "https://batirnet.com",
  "https://www.batirnet.com",
];

function corsHeaders(origin: string | null): Record<string, string> {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// Escape values before interpolating them into the email HTML to prevent HTML
// / attribute injection (phishing links, style/script smuggling).
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers });
  }

  if (req.method !== "POST") {
    return Response.json({ success: false, message: "Method not allowed" }, { status: 405, headers });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SIGNATURE_EMAIL_FROM");

    if (!resendApiKey || !senderEmail) {
      return Response.json(
        {
          success: false,
          configured: false,
          message: "Missing RESEND_API_KEY or SIGNATURE_EMAIL_FROM.",
        },
        { status: 503, headers },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return Response.json({ success: false, message: "Invalid JSON body." }, { status: 400, headers });
    }

    const { contractId, recipientEmail, recipientName, verificationCode, verificationUrl } = body as Record<string, unknown>;

    // Input validation: reject malformed / oversized payloads before doing any work.
    if (!isValidEmail(recipientEmail)) {
      return Response.json({ success: false, message: "Invalid recipient email." }, { status: 400, headers });
    }
    if (typeof contractId !== "string" || contractId.length === 0 || contractId.length > 100) {
      return Response.json({ success: false, message: "Invalid contractId." }, { status: 400, headers });
    }
    if (typeof recipientName !== "string" || recipientName.length > 200) {
      return Response.json({ success: false, message: "Invalid recipientName." }, { status: 400, headers });
    }
    if (typeof verificationCode !== "string" || verificationCode.length > 100) {
      return Response.json({ success: false, message: "Invalid verificationCode." }, { status: 400, headers });
    }
    // Only allow verification links that point at our own domains.
    let safeVerificationUrl = "";
    if (typeof verificationUrl === "string" && verificationUrl.length <= 2048) {
      try {
        const parsed = new URL(verificationUrl);
        if (parsed.protocol === "https:" && ALLOWED_ORIGINS.includes(parsed.origin)) {
          safeVerificationUrl = parsed.toString();
        }
      } catch {
        // ignore invalid URL — safeVerificationUrl stays empty
      }
    }

    const linkBlock = safeVerificationUrl
      ? `<p>Vous pouvez vérifier le document ici : <a href="${escapeHtml(safeVerificationUrl)}">${escapeHtml(safeVerificationUrl)}</a></p>`
      : "";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [recipientEmail],
        subject: `Confirmation de signature du contrat ${escapeHtml(contractId)}`,
        html: `
          <h1>Confirmation de signature</h1>
          <p>Bonjour ${escapeHtml(recipientName)},</p>
          <p>Votre signature a bien été enregistrée pour le contrat <strong>${escapeHtml(contractId)}</strong>.</p>
          <p>Code de vérification : <strong>${escapeHtml(verificationCode)}</strong></p>
          ${linkBlock}
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      return Response.json(
        { success: false, configured: true, message: errorBody },
        { status: 502, headers },
      );
    }

    return Response.json({ success: true, configured: true }, { headers });
  } catch (error) {
    return Response.json(
      {
        success: false,
        configured: true,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers },
    );
  }
});
