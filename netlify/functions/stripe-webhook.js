import Stripe from "stripe";
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig =
    event.headers["stripe-signature"] ||
    event.headers["Stripe-Signature"] ||
    "";
  const payload = event.body; // raw string

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      payload,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook verification failed.", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    console.log("✅  Checkout completed for session:", session.id);

    // Generate or retrieve your PDF buffer
    const pdfBuffer = await generatePdfForSession(session.id);

    // Send the PDF via email
    const msg = {
      to: session.customer_email,
      from: "you@yourdomain.com",
      subject: "Your PDF is here",
      text: "Thanks for your purchase! Find your PDF attached.",
      attachments: [
        {
          content: pdfBuffer.toString("base64"),
          filename: "document.pdf",
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };
    await sgMail.send(msg);
    console.log("📧 PDF email sent to:", session.customer_email);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}

// Example placeholder for PDF generation
async function generatePdfForSession(sessionId) {
  // Your logic here (e.g., fetch from S3 or generate dynamically)
  return Buffer.from("%PDF-1.4 ..."); 
}
