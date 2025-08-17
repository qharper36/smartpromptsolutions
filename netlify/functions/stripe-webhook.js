import Stripe from "stripe";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sigHeader =
    event.headers["stripe-signature"] ||
    event.headers["Stripe-Signature"] ||
    "";
  const payload = event.body; // raw string

  // DEBUG LOGGING
  console.log("🔍 Signature header:", sigHeader);
  console.log("🔍 Payload sample:", payload.slice(0, 200));

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      payload,
      sigHeader,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️ Webhook verification error:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    console.log("✅ Checkout completed for session:", session.id);
    // TODO: send PDF email or return download link
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
