import Stripe from "stripe";

// Netlify Functions use "handler" export
export async function handler(event) {
  // Only accept POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed",
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Get the raw body (as string, not parsed)
  const sig = event.headers["stripe-signature"];
  const body = event.body; // This is a string!

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("⚠️  Webhook signature verification failed.", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // Handle the event
  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    console.log("✅  Checkout completed for session:", session.id);
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
}
