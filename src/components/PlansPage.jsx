import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PenLine, Users, Building2, GraduationCap, BookOpen, 
  Home, Check, Mail, ArrowRight
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Individual Plan Features
const INDIVIDUAL_FEATURES = [
  "Cloud-based writing workspace",
  "Chapter & manuscript organization",
  "Goals, deadlines, and progress tracking",
  "Version history with automatic backups",
  "Export to Word, PDF, ePub, and Markdown",
  "Writing templates and guided prompts",
  "Commenting and review tools",
];

// Team Plan Features (includes Individual)
const TEAM_FEATURES = [
  "Everything in Individual, plus:",
  "Shared projects and real-time collaboration",
  "Team dashboards and project visibility",
  "Administrative controls",
  "Priority support",
];

// Enterprise Features (includes Team)
const ENTERPRISE_FEATURES = [
  "Everything in Team, plus:",
  "Dedicated onboarding",
  "Advanced analytics and reporting",
  "Custom invoicing and contracts",
  "Dedicated support",
  "Volume-based pricing options",
];

// Workshop Features
const WORKSHOP_FEATURES = [
  "Weekly live Zoom instruction",
  "Guided writing assignments",
  "Peer discussion and feedback",
  "Temporary access to DahTruth Story Lab during the course",
];

// Retreat Features
const RETREAT_FEATURES = [
  "In-person instruction and guided writing sessions",
  "Community and critique circles",
  "One full year of DahTruth Story Lab",
];

export default function PlansPage() {
  const navigate = useNavigate();
  const [showContactForm, setShowContactForm] = useState(false);

  const handleSelectPlan = async (planId) => {
    try {
      const payload = {
        planId,
        userId: localStorage.getItem("dt_user_id") || "anon",
        email: JSON.parse(localStorage.getItem("dt_profile") || "{}").email || undefined,
      };

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
        <div className="text-center mb-12">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth StoryLab"
            className="mx-auto h-16 mb-4 rounded-full shadow"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 className="heading-serif text-4xl font-bold mb-3">
            DahTruth Story Lab Pricing
          </h1>
          <p className="text-lg text-[color:var(--color-ink)]/80 max-w-2xl mx-auto">
            A professional writing platform built for serious writers, cohorts, and institutions.
          </p>
          <p className="text-md text-[color:var(--color-ink)]/60 mt-2 italic">
            No lifetime gimmicks. No confusing tiers. Just clear, fair pricing that grows with your work.
          </p>
        </div>

        {/* Main Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          
          {/* Individual Plan */}
          <div className="glass-panel p-6 flex flex-col relative border-2 border-[color:var(--color-primary)]/30">
            <div className="absolute -top-3 left-4 bg-[color:var(--color-primary)] text-white text-xs px-3 py-1 rounded-full shadow">
              Most Popular
            </div>
            <div className="flex items-center gap-3 mb-4 mt-2">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 grid place-items-center text-white">
                <PenLine size={24} />
              </div>
              <div>
                <h2 className="heading-serif text-xl font-semibold">Individual Writers</h2>
                <p className="text-xs text-[color:var(--color-ink)]/60">✍️ For independent creators</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-4xl font-bold">$96<span className="text-lg font-normal text-[color:var(--color-ink)]/60"> / year</span></div>
              <p className="text-sm text-[color:var(--color-ink)]/60">(Less than $8/month)</p>
            </div>

            <p className="text-sm text-[color:var(--color-ink)]/80 mb-4">
              Everything you need to write, organize, and finish your manuscript.
            </p>

            <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-6 flex-1">
              {INDIVIDUAL_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-[color:var(--color-ink)]/50 mb-4 italic">
              Best for: Independent writers, novelists, memoirists, and bloggers.
            </p>

            <button
              onClick={() => handleSelectPlan("individual-annual")}
              className="w-full py-3 rounded-lg bg-[color:var(--color-primary)] text-white font-medium hover:opacity-90 transition"
            >
              Get Started
            </button>
          </div>

          {/* Team Plan */}
          <div className="glass-panel p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 grid place-items-center text-white">
                <Users size={24} />
              </div>
              <div>
                <h2 className="heading-serif text-xl font-semibold">Team Plan</h2>
                <p className="text-xs text-[color:var(--color-ink)]/60">👥 Up to 10 users</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-4xl font-bold">$864<span className="text-lg font-normal text-[color:var(--color-ink)]/60"> / year</span></div>
              <p className="text-sm text-[color:var(--color-ink)]/60">(About $7.20 per user/month when fully used)</p>
            </div>

            <p className="text-sm text-[color:var(--color-ink)]/80 mb-4">
              Built for writing groups, cohorts, and small organizations.
            </p>

            <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-6 flex-1">
              {TEAM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-[color:var(--color-ink)]/50 mb-4 italic">
              Best for: Writing circles, nonprofits, creative labs, small programs, and group workshops.
            </p>

            <button
              onClick={() => handleSelectPlan("team-annual")}
              className="w-full py-3 rounded-lg bg-[color:var(--color-ink)] text-white font-medium hover:opacity-90 transition"
            >
              Choose Team Plan
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-panel p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 grid place-items-center text-white">
                <Building2 size={24} />
              </div>
              <div>
                <h2 className="heading-serif text-xl font-semibold">Enterprise</h2>
                <p className="text-xs text-[color:var(--color-ink)]/60">🏢 10+ users</p>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-3xl font-bold">Starting at $4,800<span className="text-lg font-normal text-[color:var(--color-ink)]/60"> / year</span></div>
              <p className="text-sm text-[color:var(--color-ink)]/60">Volume pricing available</p>
            </div>

            <p className="text-sm text-[color:var(--color-ink)]/80 mb-4">
              Designed for universities, schools, and large organizations.
            </p>

            <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-6 flex-1">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs text-[color:var(--color-ink)]/50 mb-4 italic">
              Best for: Colleges, writing programs, foundations, and institutional partners.
            </p>

            <button
              onClick={() => setShowContactForm(true)}
              className="w-full py-3 rounded-lg border-2 border-[color:var(--color-ink)] text-[color:var(--color-ink)] font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition flex items-center justify-center gap-2"
            >
              <Mail size={16} />
              Contact for Quote
            </button>
          </div>
        </div>

        {/* Workshops & Programs Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h2 className="heading-serif text-3xl font-bold mb-2 flex items-center justify-center gap-3">
              <GraduationCap size={32} className="text-[color:var(--color-gold)]" />
              Workshops & Programs
            </h2>
            <p className="text-[color:var(--color-ink)]/70">
              Learn, connect, and grow with guided instruction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Online Workshop */}
            <div className="glass-panel p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 grid place-items-center text-white">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h3 className="heading-serif text-xl font-semibold">8-Week Online Writing Workshop</h3>
                  <p className="text-xs text-[color:var(--color-ink)]/60">💻 Live virtual instruction</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold">$400<span className="text-lg font-normal text-[color:var(--color-ink)]/60"> total</span></div>
                <p className="text-sm text-[color:var(--color-ink)]/60">($50/week × 8 weeks)</p>
              </div>

              <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-4 flex-1">
                {WORKSHOP_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="bg-[color:var(--color-accent)]/30 rounded-lg p-3 mb-4">
                <p className="text-xs text-[color:var(--color-ink)]/70">
                  <strong>After the workshop:</strong> Continue with an annual Story Lab subscription ($96/year). 
                  Optional workshop alumni discounts available.
                </p>
              </div>

              <button
                onClick={() => setShowContactForm(true)}
                className="w-full py-3 rounded-lg bg-emerald-600 text-white font-medium hover:opacity-90 transition"
              >
                Enroll in Workshop
              </button>
            </div>

            {/* In-Person Retreat */}
            <div className="glass-panel p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 grid place-items-center text-white">
                  <Home size={24} />
                </div>
                <div>
                  <h3 className="heading-serif text-xl font-semibold">In-Person Writing Retreats</h3>
                  <p className="text-xs text-[color:var(--color-ink)]/60">🏡 Immersive experience</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold">Starting at $3,000</div>
                <p className="text-sm text-[color:var(--color-ink)]/60">(Retreat only — housing, food, and travel priced separately)</p>
              </div>

              <ul className="space-y-2 text-sm text-[color:var(--color-ink)]/80 mb-4 flex-1">
                {RETREAT_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={16} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowContactForm(true)}
                className="w-full py-3 rounded-lg border-2 border-rose-500 text-rose-600 font-medium hover:bg-rose-500 hover:text-white transition flex items-center justify-center gap-2"
              >
                <Mail size={16} />
                Inquire About Retreats
              </button>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
              <h3 className="heading-serif text-xl font-bold mb-2">Get in Touch</h3>
              <p className="text-sm text-[color:var(--color-ink)]/70 mb-4">
                We'd love to hear from you! Reach out to discuss enterprise pricing, workshops, or retreats.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-[color:var(--color-accent)]/20 rounded-lg">
                  <Mail size={20} className="text-[color:var(--color-primary)]" />
                  <div>
                    <p className="text-xs text-[color:var(--color-ink)]/60">Email us at</p>
                    <a href="mailto:hello@dahtruth.com" className="text-[color:var(--color-primary)] font-medium">
                      hello@dahtruth.com
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowContactForm(false)}
                className="w-full mt-6 py-2 rounded-lg border border-[color:var(--color-ink)]/20 text-[color:var(--color-ink)]/70 hover:bg-[color:var(--color-ink)]/5 transition"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <button 
            onClick={() => navigate("/writer")} 
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[color:var(--color-gold)] text-[color:var(--color-ink)] font-medium hover:opacity-90 transition shadow-lg"
          >
            <BookOpen size={18} /> 
            Start Writing Now
            <ArrowRight size={18} />
          </button>
          <p className="text-sm text-[color:var(--color-ink)]/50 mt-3">
            Try the writing experience before you subscribe
          </p>
        </div>
      </div>
    </div>
  );
}

