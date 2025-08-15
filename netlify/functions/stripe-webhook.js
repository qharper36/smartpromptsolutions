import Stripe from "stripe";
import { buffer } from "micro";

export const config = {
  api: {
    bodyParser: false
  }
};

// Netlify Functions expect an “exports.handler” that returns { statusCode, headers, body }
export async function handler(event, context) {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { Allow: "POST" },
      body: "Method Not Allowed"
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = event.headers["stripe-signature"] || event.headers["Stripe-Signature"];
  const buf = await buffer({
    rawBody: Buffer.from(event.body || "", "utf8"),
    headers: event.headers
  });

  let webhookEvent;
  try {
    webhookEvent = stripe.webhooks.constructEvent(
      buf,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return {
      statusCode: 400,
      body: `Webhook Error: ${err.message}`
    };
  }

  if (webhookEvent.type === "checkout.session.completed") {
    const session = webhookEvent.data.object;
    console.log("Checkout completed for session", session.id);
    // Perform any fulfillment logic here
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
}
