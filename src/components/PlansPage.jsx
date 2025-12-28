import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine, Users, Building2, Crown, Infinity, BookOpen
} from "lucide-react";

// 👉 Fixed: use import.meta.env for Vite (not process.env)
const API_BASE = import.meta.env.VITE_API_BASE || "";

const FEATURE_LIST = [
  "Cloud sync & backups",
  "Distraction-free writing",
  "Chapters & drag/drop TOC",
  "Goals & deadlines tracking",
  "Version history & rollback",
  "Export: PDF, ePub, Word, Markdown",
  "Comments & review workflow",
  "Templates (genres & structures)",
  "StoryLab tools & prompts",
];

const PLANS = [
  {
    id: "lifetime",
    title: "Lifetime License",
    icon: Infinity,
    type: "one-time",
    priceOneTime: 100,
    ribbon: "Own it forever",
    features: FEATURE_LIST,
  },
  {
    id: "individual",
    title: "Individual",
    icon: PenLine,
    type: "subscription",
    priceMonthly: 10,
    ribbon: "Most popular",
    features: FEATURE_LIST,
  },
  {
    id: "small-team",
    title: "Team (<10)",
    icon: Users,
    type: "subscription",
    priceMonthly: 90,
    features: [
      ...FEATURE_LIST,
      "Team collaboration",
      "Admin dashboard",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise (10+)",
    icon: Building2,
    type: "subscription",
    priceMonthly: 500,
    features: [
      ...FEATURE_LIST,
      "Dedicated onboarding",
      "Advanced analytics",
      "Dedicated support",
    ],
  },
];

export default function PlansPage() {
  const navigate = useNavigate();
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | yearly

  const subscriptionPlans = useMemo(
    () => PLANS.filter(p => p.type === "subscription"),
    []
  );

  const handleSelectPlan = async (planId) => {
    const plan = PLANS.find(p => p.id === planId);
    if (!plan) return;

    try {
      const payload =
        plan.type === "one-time"
          ? {
              planId,
              purchaseType: "one-time",
              userId: localStorage.getItem("dt_user_id") || "anon",
              email: JSON.parse(localStorage.getItem("dt_profile") || "{}").email || undefined,
            }
          : {
              planId,
              cycle: billingCycle,
              userId: localStorage.getItem("dt_user_id") || "anon",
              email: JSON.parse(localStorage.getItem("dt_profile") || "{}").email || undefined,
            };

      // 👇 Updated to use API_BASE (handles prod + dev seamlessly)
      const res = await fetch(`${API_BASE}/api/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data?.url) window.location.href = data.url;
      else alert(data?.error || "Unable to start checkout");
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="min-h-screen bg-[color:var(--color-base)] text-[color:var(--color-ink)] bg-radial-fade">
      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* Hero */}
        <div className="text-center mb-10">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth StoryLab"
            className="mx-auto h-16 mb-4 rounded-full shadow"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 className="heading-serif text-4xl font-bold mb-2">
            Start Your Writing Journey
          </h1>
          <p className="text-muted text-lg">
            Choose a plan or a lifetime license that fits your creative flow.
          </p>
        </div>

        {/* Billing toggle for subscriptions */}
        {subscriptionPlans.length > 0 && (
          <div className="flex justify-center mb-8">
            <div className="glass-panel inline-flex overflow-hidden rounded-lg">
              <button
                className={`px-4 py-2 ${billingCycle === "monthly" ? "bg-[color:var(--color-accent)] text-[color:var(--color-ink)]" : "bg-white"}`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                className={`px-4 py-2 ${billingCycle === "yearly" ? "bg-[color:var(--color-accent)] text-[color:var(--color-ink)]" : "bg-white"}`}
                onClick={() => setBillingCycle("yearly")}
              >
                Yearly (save 20%)
              </button>
            </div>
          </div>
        )}

        {/* Plans grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon || Crown;

            let priceText = "";
            if (plan.type === "one-time") {
              priceText = `$${plan.priceOneTime}`;
            } else {
              const price = billingCycle === "monthly"
                ? plan.priceMonthly
                : (plan.priceMonthly * 12 * 0.8).toFixed(2);
              priceText = `$${price}/${billingCycle === "monthly" ? "mo" : "yr"}`;
            }

            return (
              <div key={plan.id} className="glass-panel p-6 flex flex-col relative">
                {plan.ribbon && (
                  <div className="absolute -top-2 right-4 bg-[color:var(--color-gold)] text-white text-xs px-3 py-1 rounded-full shadow">
                    {plan.ribbon}
                  </div>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[color:var(--color-primary)] grid place-items-center">
                    <Icon size={20} />
                  </div>
                  <h2 className="heading-serif text-xl font-semibold">{plan.title}</h2>
                </div>

                <div className="text-4xl font-bold mb-3">{priceText}</div>
                <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-6">
                  {plan.features.map((f, i) => (
                    <li key={i}>✔ {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => handleSelectPlan(plan.id)}
                  className="btn-primary"
                >
                  {plan.type === "one-time" ? "Buy & Own Forever" : "Choose Plan"}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footnotes */}
        <div className="mt-10 grid md:grid-cols-3 gap-6">
          <div className="glass-panel p-5">
            <h3 className="heading-serif text-lg font-semibold mb-2">Bundles</h3>
            <p className="text-sm text-[color:var(--color-ink)]/80">
              Need multiple lifetime licenses? Ask about 3-pack, 5-pack, and site licenses.
            </p>
          </div>
          <div className="glass-panel p-5">
            <h3 className="heading-serif text-lg font-semibold mb-2">Education Discounts</h3>
            <p className="text-sm text-[color:var(--color-ink)]/80">
              Students & educators save 20% with academic verification.
            </p>
          </div>
          <div className="glass-panel p-5">
            <h3 className="heading-serif text-lg font-semibold mb-2">What You Get</h3>
            <p className="text-sm text-[color:var(--color-ink)]/80">
              Regular updates, cloud sync, StoryLab tools, and priority support on team/enterprise plans.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <button onClick={() => navigate("/writer")} className="btn-gold inline-flex items-center gap-2">
            <BookOpen size={16} /> Start Writing Now
          </button>
        </div>
      </div>
    </div>
  );
}
