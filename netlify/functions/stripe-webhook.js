import Stripe from "stripe";
import fetch from "node-fetch";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-07-30",
  });
  const sig = event.headers["stripe-signature"] || "";
  const payload = event.body;

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;

    // Retrieve session line items to identify the product ID
    const sessionWithItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items"],
    });
    const lineItem = sessionWithItems.line_items.data[0];
    const productId = lineItem.price.product;

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

    // Send email with the matching PDF
    const msg = {
      to: session.customer_email,
      from: "you@yourdomain.com",
      subject: "Your PDF from Smart Prompt Solutions",
      text: "Thank you for your purchase! Please find your PDF attached.",
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: pdfEntry.filename,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    try {
      await sgMail.send(msg);
      console.log("📧 PDF email sent to:", session.customer_email);
    } catch (emailErr) {
      console.error("❌ Error sending email:", emailErr);
      return { statusCode: 500, body: "Failed to send email" };
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
