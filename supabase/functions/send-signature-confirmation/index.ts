import { createClient } from "npm:@supabase/supabase-js@2.75.0";
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = new Set([
  "https://batirnet.com",
  "https://www.batirnet.com",
]);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type SignatureSubmission = {
  signature_image: string;
  coordinates: { x: number; y: number };
  geolocation?: { latitude: number; longitude: number; accuracy: number };
  signature_method: "draw" | "type";
};

type SecureSigningResult = {
  contract?: Record<string, unknown>;
  signature_data?: Record<string, unknown>;
  signer_role?: string;
};

function corsHeaders(origin: string | null): Record<string, string> {
  return {
    ...(origin && ALLOWED_ORIGINS.has(origin)
      ? { "Access-Control-Allow-Origin": origin }
      : {}),
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(
  body: Record<string, unknown>,
  status: number,
  headers: Record<string, string>,
): Response {
  return Response.json(body, {
    status,
    headers: { ...headers, "Cache-Control": "no-store" },
  });
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getClientIp(req: Request): string {
  const raw = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("cf-connecting-ip")?.trim()
    || "unknown";
  return raw.slice(0, 64);
}

function parseSignaturePayload(value: unknown): SignatureSubmission | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  const image = input.signature_image;
  const method = input.signature_method;
  const coordinates = input.coordinates as Record<string, unknown> | null;

  if (typeof image !== "string"
    || !/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(image)
    || image.length > 850_000
    || (method !== "draw" && method !== "type")
    || !coordinates
    || typeof coordinates !== "object"
    || typeof coordinates.x !== "number"
    || typeof coordinates.y !== "number"
    || !Number.isFinite(coordinates.x)
    || !Number.isFinite(coordinates.y)) {
    return null;
  }

  const parsed: SignatureSubmission = {
    signature_image: image,
    signature_method: method,
    coordinates: { x: Number(coordinates.x), y: Number(coordinates.y) },
  };

  if (input.geolocation !== undefined) {
    const location = input.geolocation as Record<string, unknown> | null;
    if (!location
      || typeof location !== "object"
      || typeof location.latitude !== "number"
      || typeof location.longitude !== "number"
      || typeof location.accuracy !== "number"
      || !Number.isFinite(location.latitude)
      || !Number.isFinite(location.longitude)
      || !Number.isFinite(location.accuracy)) {
      return null;
    }
    const latitude = Number(location.latitude);
    const longitude = Number(location.longitude);
    const accuracy = Number(location.accuracy);
    if (latitude < -90 || latitude > 90
      || longitude < -180 || longitude > 180
      || accuracy < 0 || accuracy > 100_000) {
      return null;
    }
    parsed.geolocation = { latitude, longitude, accuracy };
  }

  return parsed;
}

serve(async (req) => {
  const origin = req.headers.get("origin");
  const headers = corsHeaders(origin);

  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return json({ success: false, message: "Origin not allowed." }, 403, headers);
  }
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers });
  }
  if (req.method !== "POST") {
    return json({ success: false, message: "Method not allowed." }, 405, headers);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = req.headers.get("authorization");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error("Signing function is missing required Supabase environment variables.");
    return json({ success: false, message: "Signing service unavailable." }, 503, headers);
  }
  if (!authorization?.startsWith("Bearer ")) {
    return json({ success: false, message: "Authentication required." }, 401, headers);
  }

  try {
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    const user = userData.user;
    if (userError || !user) {
      return json({ success: false, message: "Authentication required." }, 401, headers);
    }

    const body = await req.json().catch(() => null) as Record<string, unknown> | null;
    const contractId = body?.contractId;
    const signatureData = parseSignaturePayload(body?.signatureData);
    if (typeof contractId !== "string" || !UUID_RE.test(contractId)) {
      return json({ success: false, message: "Invalid contract identifier." }, 400, headers);
    }
    if (!signatureData) {
      return json({ success: false, message: "Invalid signature payload." }, 400, headers);
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Authorize against the stored contract before invoking any privileged RPC.
    const { data: contractAccess, error: contractError } = await admin
      .from("contracts")
      .select("id, client_id, professional_id")
      .eq("id", contractId)
      .maybeSingle();

    if (contractError) throw contractError;
    if (!contractAccess) {
      return json({ success: false, message: "Contract not found." }, 404, headers);
    }
    if (user.id !== contractAccess.client_id && user.id !== contractAccess.professional_id) {
      return json({ success: false, message: "Not authorized for this contract." }, 403, headers);
    }

    const { data: signingResult, error: signingError } = await admin.rpc(
      "sign_contract_secure",
      {
        p_contract_id: contractId,
        p_signer_id: user.id,
        p_signature_data: signatureData,
        p_ip_address: getClientIp(req),
        p_user_agent: req.headers.get("user-agent")?.slice(0, 512) || "unknown",
      },
    );

    if (signingError) {
      const knownConflict = /already signed|current state/i.test(signingError.message || "");
      return json(
        {
          success: false,
          message: knownConflict
            ? "This contract has already been signed or cannot be signed."
            : "The signature could not be recorded.",
        },
        knownConflict ? 409 : 400,
        headers,
      );
    }

    const result = signingResult as SecureSigningResult;
    const savedSignature = result.signature_data;
    const verificationCode = savedSignature?.verification_code;
    const contractTitle = result.contract?.title || contractId;

    let emailSent = false;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const senderEmail = Deno.env.get("SIGNATURE_EMAIL_FROM");
    if (resendApiKey && senderEmail && user.email && typeof verificationCode === "string") {
      const { data: profile } = await admin
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();
      const recipientName = profile?.full_name || "Utilisateur";
      const verificationUrl = `https://batirnet.com/contracts/verify/${encodeURIComponent(verificationCode)}`;

      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: senderEmail,
          to: [user.email],
          subject: `Confirmation de signature — ${String(contractTitle).slice(0, 120)}`,
          html: `
            <h1>Confirmation de signature</h1>
            <p>Bonjour ${escapeHtml(recipientName)},</p>
            <p>Votre signature a été enregistrée pour le contrat <strong>${escapeHtml(contractTitle)}</strong>.</p>
            <p>Code de vérification : <strong>${escapeHtml(verificationCode)}</strong></p>
            <p><a href="${escapeHtml(verificationUrl)}">Vérifier l’enregistrement de la signature</a></p>
          `,
        }),
      });
      emailSent = resendResponse.ok;
      if (!resendResponse.ok) {
        console.error("Resend rejected a signature confirmation email:", resendResponse.status);
      }
    }

    return json(
      {
        success: true,
        contract: result.contract ?? null,
        signatureData: savedSignature ?? null,
        signerRole: result.signer_role ?? null,
        emailSent,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error("Secure signing failed:", error instanceof Error ? error.message : "unknown");
    return json({ success: false, message: "Signing service unavailable." }, 500, headers);
  }
});
