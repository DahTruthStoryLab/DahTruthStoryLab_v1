import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Feather, UsersRound, Landmark, Sparkles, BookMarked, 
  TreePine, Check, Mail, ArrowRight, Star
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "";

// Brand colors (matching your CSS variables)
const COLORS = {
  bg: "#F2F5F9",
  white: "#FFFFFF",
  text: "#0A2540",
  subtext: "#5B6B7C",
  border: "rgba(10,37,64,0.10)",
  borderStrong: "rgba(10,37,64,0.18)",
  primary: "#0A2540",
  accent: "#335D92",
  highlight: "#EAF2FB",
  gold: "#D4AF37",
};

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
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: COLORS.bg,
        color: COLORS.text,
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-14">
        
        {/* Hero */}
        <div className="text-center mb-12">
          <img
            src="/DahTruthLogo.png"
            alt="DahTruth StoryLab"
            className="mx-auto h-20 mb-5 rounded-full shadow-lg"
            style={{ border: `3px solid ${COLORS.gold}` }}
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 
            className="text-4xl md:text-5xl font-bold mb-3"
            style={{ 
              fontFamily: "'EB Garamond', Georgia, serif",
              color: COLORS.text,
            }}
          >
            DahTruth Story Lab Pricing
          </h1>
          <p 
            className="text-lg max-w-2xl mx-auto"
            style={{ color: COLORS.subtext }}
          >
            A professional writing platform built for serious writers, cohorts, and institutions.
          </p>
          <p 
            className="text-md mt-2 italic"
            style={{ color: COLORS.accent }}
          >
            No lifetime gimmicks. No confusing tiers. Just clear, fair pricing that grows with your work.
          </p>
        </div>

        {/* Main Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Individual Plan */}
          <div 
            className="rounded-2xl p-6 flex flex-col relative shadow-lg hover:shadow-xl transition-shadow"
            style={{ 
              backgroundColor: COLORS.white,
              border: `2px solid ${COLORS.gold}`,
            }}
          >
            {/* Popular Badge */}
            <div 
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-md"
              style={{ 
                backgroundColor: COLORS.gold,
                color: COLORS.white,
              }}
            >
              <Star size={12} fill="white" />
              Most Popular
            </div>

            <div className="flex items-center gap-4 mb-5 mt-3">
              <div 
                className="w-14 h-14 rounded-2xl grid place-items-center shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.gold} 0%, #B8962E 100%)`,
                }}
              >
                <Feather size={28} color="white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: COLORS.text,
                  }}
                >
                  Individual Writers
                </h2>
                <p className="text-xs" style={{ color: COLORS.subtext }}>
                  ✍️ For independent creators
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  $96
                </span>
                <span style={{ color: COLORS.subtext }}>/ year</span>
              </div>
              <p className="text-sm" style={{ color: COLORS.accent }}>
                (Less than $8/month)
              </p>
            </div>

            <p className="text-sm mb-5" style={{ color: COLORS.subtext }}>
              Everything you need to write, organize, and finish your manuscript.
            </p>

            <ul className="space-y-2.5 text-sm mb-6 flex-1">
              {INDIVIDUAL_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={18} color={COLORS.gold} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span style={{ color: COLORS.text }}>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs mb-5 italic" style={{ color: COLORS.subtext }}>
              Best for: Independent writers, novelists, memoirists, and bloggers.
            </p>

            <button
              onClick={() => handleSelectPlan("individual-annual")}
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ 
                backgroundColor: COLORS.gold,
                color: COLORS.white,
              }}
            >
              Get Started
            </button>
          </div>

          {/* Team Plan */}
          <div 
            className="rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div 
                className="w-14 h-14 rounded-2xl grid place-items-center shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.accent} 0%, #264A75 100%)`,
                }}
              >
                <UsersRound size={28} color="white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: COLORS.text,
                  }}
                >
                  Team Plan
                </h2>
                <p className="text-xs" style={{ color: COLORS.subtext }}>
                  👥 Up to 10 users
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-4xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  $864
                </span>
                <span style={{ color: COLORS.subtext }}>/ year</span>
              </div>
              <p className="text-sm" style={{ color: COLORS.accent }}>
                (About $7.20 per user/month when fully used)
              </p>
            </div>

            <p className="text-sm mb-5" style={{ color: COLORS.subtext }}>
              Built for writing groups, cohorts, and small organizations.
            </p>

            <ul className="space-y-2.5 text-sm mb-6 flex-1">
              {TEAM_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={18} color={COLORS.accent} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span style={{ color: COLORS.text }}>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs mb-5 italic" style={{ color: COLORS.subtext }}>
              Best for: Writing circles, nonprofits, creative labs, small programs, and group workshops.
            </p>

            <button
              onClick={() => handleSelectPlan("team-annual")}
              className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 shadow-md"
              style={{ 
                backgroundColor: COLORS.accent,
                color: COLORS.white,
              }}
            >
              Choose Team Plan
            </button>
          </div>

          {/* Enterprise Plan */}
          <div 
            className="rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
            style={{ 
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.borderStrong}`,
            }}
          >
            <div className="flex items-center gap-4 mb-5">
              <div 
                className="w-14 h-14 rounded-2xl grid place-items-center shadow-md"
                style={{ 
                  background: `linear-gradient(135deg, ${COLORS.primary} 0%, #061525 100%)`,
                }}
              >
                <Landmark size={28} color="white" strokeWidth={1.5} />
              </div>
              <div>
                <h2 
                  className="text-xl font-bold"
                  style={{ 
                    fontFamily: "'EB Garamond', Georgia, serif",
                    color: COLORS.text,
                  }}
                >
                  Enterprise
                </h2>
                <p className="text-xs" style={{ color: COLORS.subtext }}>
                  🏢 10+ users
                </p>
              </div>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1">
                <span 
                  className="text-3xl font-bold"
                  style={{ color: COLORS.text }}
                >
                  Starting at $4,800
                </span>
                <span style={{ color: COLORS.subtext }}>/ year</span>
              </div>
              <p className="text-sm" style={{ color: COLORS.accent }}>
                Volume pricing available
              </p>
            </div>

            <p className="text-sm mb-5" style={{ color: COLORS.subtext }}>
              Designed for universities, schools, and large organizations.
            </p>

            <ul className="space-y-2.5 text-sm mb-6 flex-1">
              {ENTERPRISE_FEATURES.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check size={18} color={COLORS.primary} className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                  <span style={{ color: COLORS.text }}>{f}</span>
                </li>
              ))}
            </ul>

            <p className="text-xs mb-5 italic" style={{ color: COLORS.subtext }}>
              Best for: Colleges, writing programs, foundations, and institutional partners.
            </p>

            <button
              onClick={() => setShowContactForm(true)}
              className="w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
              style={{ 
                backgroundColor: "transparent",
                color: COLORS.primary,
                border: `2px solid ${COLORS.primary}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.primary;
                e.currentTarget.style.color = COLORS.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = COLORS.primary;
              }}
            >
              <Mail size={18} />
              Contact for Quote
            </button>
          </div>
        </div>

        {/* Workshops & Programs Section */}
        <div className="mb-16">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Sparkles size={28} color={COLORS.gold} />
              <h2 
                className="text-3xl font-bold"
                style={{ 
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: COLORS.text,
                }}
              >
                Workshops & Programs
              </h2>
              <Sparkles size={28} color={COLORS.gold} />
            </div>
            <p style={{ color: COLORS.subtext }}>
              Learn, connect, and grow with guided instruction
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Online Workshop */}
            <div 
              className="rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
              style={{ 
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.borderStrong}`,
              }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div 
                  className="w-14 h-14 rounded-2xl grid place-items-center shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
                  }}
                >
                  <BookMarked size={28} color="white" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ 
                      fontFamily: "'EB Garamond', Georgia, serif",
                      color: COLORS.text,
                    }}
                  >
                    8-Week Online Writing Workshop
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.subtext }}>
                    💻 Live virtual instruction
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: COLORS.text }}
                  >
                    $400
                  </span>
                  <span style={{ color: COLORS.subtext }}>total</span>
                </div>
                <p className="text-sm" style={{ color: COLORS.accent }}>
                  ($50/week × 8 weeks)
                </p>
              </div>

              <ul className="space-y-2.5 text-sm mb-5 flex-1">
                {WORKSHOP_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={18} color="#10B981" className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span style={{ color: COLORS.text }}>{f}</span>
                  </li>
                ))}
              </ul>

              <div 
                className="rounded-xl p-4 mb-5"
                style={{ backgroundColor: COLORS.highlight }}
              >
                <p className="text-xs" style={{ color: COLORS.text }}>
                  <strong>After the workshop:</strong> Continue with an annual Story Lab subscription ($96/year). 
                  Optional workshop alumni discounts available.
                </p>
              </div>

              <button
                onClick={() => setShowContactForm(true)}
                className="w-full py-3.5 rounded-xl font-semibold transition-all hover:opacity-90 shadow-md"
                style={{ 
                  backgroundColor: "#10B981",
                  color: COLORS.white,
                }}
              >
                Enroll in Workshop
              </button>
            </div>

            {/* In-Person Retreat */}
            <div 
              className="rounded-2xl p-6 flex flex-col shadow-lg hover:shadow-xl transition-shadow"
              style={{ 
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.borderStrong}`,
              }}
            >
              <div className="flex items-center gap-4 mb-5">
                <div 
                  className="w-14 h-14 rounded-2xl grid place-items-center shadow-md"
                  style={{ 
                    background: `linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)`,
                  }}
                >
                  <TreePine size={28} color="white" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 
                    className="text-xl font-bold"
                    style={{ 
                      fontFamily: "'EB Garamond', Georgia, serif",
                      color: COLORS.text,
                    }}
                  >
                    In-Person Writing Retreats
                  </h3>
                  <p className="text-xs" style={{ color: COLORS.subtext }}>
                    🏡 Immersive experience
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-baseline gap-1">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: COLORS.text }}
                  >
                    Starting at $3,000
                  </span>
                </div>
                <p className="text-sm" style={{ color: COLORS.accent }}>
                  (Retreat only — housing, food, and travel priced separately)
                </p>
              </div>

              <ul className="space-y-2.5 text-sm mb-5 flex-1">
                {RETREAT_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check size={18} color="#8B5CF6" className="mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                    <span style={{ color: COLORS.text }}>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setShowContactForm(true)}
                className="w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: "transparent",
                  color: "#8B5CF6",
                  border: `2px solid #8B5CF6`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#8B5CF6";
                  e.currentTarget.style.color = COLORS.white;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#8B5CF6";
                }}
              >
                <Mail size={18} />
                Inquire About Retreats
              </button>
            </div>
          </div>
        </div>

        {/* Contact Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div 
              className="rounded-2xl p-8 max-w-md w-full shadow-2xl"
              style={{ backgroundColor: COLORS.white }}
            >
              <h3 
                className="text-2xl font-bold mb-3"
                style={{ 
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: COLORS.text,
                }}
              >
                Get in Touch
              </h3>
              <p className="text-sm mb-6" style={{ color: COLORS.subtext }}>
                We'd love to hear from you! Reach out to discuss enterprise pricing, workshops, or retreats.
              </p>
              
              <div 
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ backgroundColor: COLORS.highlight }}
              >
                <div 
                  className="w-12 h-12 rounded-full grid place-items-center"
                  style={{ backgroundColor: COLORS.accent }}
                >
                  <Mail size={22} color="white" />
                </div>
                <div>
                  <p className="text-xs" style={{ color: COLORS.subtext }}>Email us at</p>
                  <a 
                    href="mailto:hello@dahtruth.com" 
                    className="font-semibold text-lg hover:underline"
                    style={{ color: COLORS.accent }}
                  >
                    hello@dahtruth.com
                  </a>
                </div>
              </div>

              <button
                onClick={() => setShowContactForm(false)}
                className="w-full mt-6 py-3 rounded-xl font-medium transition-all"
                style={{ 
                  backgroundColor: COLORS.highlight,
                  color: COLORS.text,
                  border: `1px solid ${COLORS.border}`,
                }}
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
            className="inline-flex items-center gap-3 px-8 py-4 rounded-xl font-semibold transition-all hover:opacity-90 shadow-lg"
            style={{ 
              backgroundColor: COLORS.gold,
              color: COLORS.white,
            }}
          >
            <Feather size={20} /> 
            Start Writing Now
            <ArrowRight size={20} />
          </button>
          <p className="text-sm mt-4" style={{ color: COLORS.subtext }}>
            Try the writing experience before you subscribe
          </p>
        </div>
      </div>
    </div>
  );
}

