import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
        { status: 503, headers: corsHeaders },
      );
    }

    const { contractId, recipientEmail, recipientName, verificationCode, verificationUrl } = await req.json();

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: senderEmail,
        to: [recipientEmail],
        subject: `Confirmation de signature du contrat ${contractId}`,
        html: `
          <h1>Confirmation de signature</h1>
          <p>Bonjour ${recipientName},</p>
          <p>Votre signature a bien été enregistrée pour le contrat <strong>${contractId}</strong>.</p>
          <p>Code de vérification : <strong>${verificationCode}</strong></p>
          <p>Vous pouvez vérifier le document ici : <a href="${verificationUrl}">${verificationUrl}</a></p>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorBody = await resendResponse.text();
      return Response.json(
        { success: false, configured: true, message: errorBody },
        { status: 502, headers: corsHeaders },
      );
    }

    return Response.json({ success: true, configured: true }, { headers: corsHeaders });
  } catch (error) {
    return Response.json(
      {
        success: false,
        configured: true,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500, headers: corsHeaders },
    );
  }
});
