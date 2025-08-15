import Stripe from "stripe";

// Exports must be named “handler” for Netlify Functions
export async function handler(event) {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Ensure we don’t accidentally use a newer API mismatch
    apiVersion: "2025-07-30",
  });

  // Stripe requires the raw request body for signature verification.
  // Netlify provides `event.body` as a string; convert to Buffer.
  const buf = Buffer.from(event.body || "", "utf8");
  const sig = event.headers["stripe-signature"] || "";

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    // Log the error for debugging
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle the event
  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    console.log("✅  Checkout completed for session:", session.id);
    // Insert fulfillment logic here
  }

  // Return a 200 to acknowledge receipt
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
