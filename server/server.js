// server/server.js
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// JSON for normal routes
app.use(cors({ origin: true }));
app.use(express.json());

// ----- Config -----
const APP_BASE = process.env.APP_BASE_URL || "http://localhost:3000";

// Subscription price IDs (Stripe)
const PRICE_MAP = {
  individual: {
    monthly: process.env.PRICE_INDIVIDUAL_MONTHLY,   // e.g. price_123
    yearly:  process.env.PRICE_INDIVIDUAL_YEARLY     // e.g. price_456
  },
  "small-team": {
    monthly: process.env.PRICE_TEAM_MONTHLY,
    yearly:  process.env.PRICE_TEAM_YEARLY
  },
  enterprise: {
    monthly: process.env.PRICE_ORG_MONTHLY,
    yearly:  process.env.PRICE_ORG_YEARLY
  },
};

// One-time (lifetime) price IDs (Stripe)
const ONE_TIME_PRICE_MAP = {
  lifetime: process.env.PRICE_LIFETIME_ONE_TIME,     // e.g. price_789
};

// ---------------------------
// Create Checkout Session
// ---------------------------
app.post("/api/checkout-session", async (req, res) => {
  try {
    const {
      planId,                 // "individual" | "small-team" | "enterprise" | "lifetime"
      cycle = "monthly",      // "monthly" | "yearly" (subs only)
      purchaseType,           // "subscription" | "one-time"
      userId = "anon",
      email
    } = req.body;

    // ONE-TIME (Lifetime)
    if (purchaseType === "one-time") {
      const price = ONE_TIME_PRICE_MAP[planId];
      if (!price) return res.status(400).json({ error: "Invalid one-time planId" });

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [{ price, quantity: 1 }],
        success_url: `${APP_BASE}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${APP_BASE}/store?cancelled=true`,
        client_reference_id: userId,
        customer_email: email,
        metadata: { plan_id: planId, purchaseType: "one-time" },
      });
      return res.json({ url: session.url });
    }

    // SUBSCRIPTION
    if (!PRICE_MAP[planId] || !PRICE_MAP[planId][cycle]) {
      return res.status(400).json({ error: "Invalid subscription planId or cycle" });
    }

    const priceId = PRICE_MAP[planId][cycle];
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${APP_BASE}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${APP_BASE}/store?cancelled=true`,
      client_reference_id: userId,
      customer_email: email,
      metadata: { plan_id: planId, cycle, purchaseType: "subscription" },
      allow_promotion_codes: true,
    });
    return res.json({ url: session.url });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------
// Customer Portal (optional)
// ---------------------------
app.post("/api/portal-session", async (req, res) => {
  try {
    const { customerId, returnPath = "/store" } = req.body;
    if (!customerId) return res.status(400).json({ error: "customerId required" });
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${APP_BASE}${returnPath}`,
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ---------------------------
// Stripe Webhook (RAW BODY!)
// ---------------------------
app.post("/api/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        // TODO: mark user as paid in your DB
        // session.client_reference_id (userId)
        // session.customer / session.subscription (for subs)
        // session.payment_status === "paid" (for one-time)
        // session.metadata: { plan_id, cycle?, purchaseType }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // TODO: update subscription status in your DB
        break;
      default:
        break;
    }
    res.json({ received: true });
  } catch (e) {
    console.error("Webhook handler failed:", e);
    res.status(500).json({ error: "Webhook handler failed" });
  }
});

// ---------------------------
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => console.log(`Stripe server listening on ${PORT}`));
