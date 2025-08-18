import Stripe from "stripe";
import fetch from "node-fetch";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-07-30",
});

const PDF_MAP = {
  prod_SnXuRnOi6Z8OVw: {
    filename: "PRODUCTIVITY-BOOSTER-PACK.pdf",
    url:
      "https://github.com/qharper36/smartpromptsolutions/releases/download/v1.0/PRODUCTIVITY-BOOSTER-PACK.pdf",
  },
  prod_SnXJP796uNZYS2: {
    filename: "Small-Business-Content-Pack.pdf",
    url:
      "https://github.com/qharper36/smartpromptsolutions/releases/download/v1.0/Small-Business-Content-Pack.pdf",
  },
  prod_SnXtH62ZcjLT8s: {
    filename:
      "Smart-Prompt-Solutions-Marketing-Automation-Prompt-Pack-2025.pdf",
    url:
      "https://github.com/qharper36/smartpromptsolutions/releases/download/v1.0/Smart-Prompt-Solutions-Marketing-Automation-Prompt-Pack-2025.pdf",
  },
};

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { Allow: "POST" }, body: "Method Not Allowed" };
  }

  // Verify Stripe webhook signature
  const sig = event.headers["stripe-signature"] || "";
  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (webhookEvent.type === "checkout.session.completed") {
    // Retrieve session with line items
    const session = await stripe.checkout.sessions.retrieve(webhookEvent.data.object.id, {
      expand: ["line_items"],
    });
    const productId = session.line_items.data[0].price.product;
    const pdfEntry = PDF_MAP[productId];

    if (!pdfEntry) {
      console.error("❌ No PDF configured for product ID:", productId);
      return { statusCode: 400, body: "Invalid product ID" };
    }

    // Download the specific PDF
    const res = await fetch(pdfEntry.url);
    if (!res.ok) {
      console.error("❌ Failed to download PDF:", res.status);
      return { statusCode: 502, body: "Failed to fetch PDF" };
    }
    const pdfBuffer = await res.buffer();

    // Send via Brevo (Sendinblue) REST API
    const brevoRes = await fetch("https://api.sendinblue.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: "hello@smartpromptsolutions.com" },
        to: [{ email: session.customer_email }],
        subject: "Your PDF from Smart Prompt Solutions",
        textContent: "Thank you for your purchase! Please find your PDF attached.",
        attachment: [
          {
            content: pdfBuffer.toString("base64"),
            name: pdfEntry.filename,
            contentType: "application/pdf",
          },
        ],
      }),
    });

    if (!brevoRes.ok) {
      const errorText = await brevoRes.text();
      console.error("❌ Brevo send error:", brevoRes.status, errorText);
      return { statusCode: 500, body: "Email send failure" };
    }

    console.log("📧 Brevo email sent to:", session.customer_email);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
