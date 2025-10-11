// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Brain, Heart,
  Feather, PenLine, ScrollText, Compass, Star, Users
} from 'lucide-react';

const LOGO_SRC = "/DahTruthLogo.png"; // put DahTruthLogo.png in /public

export default function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate('/auth/register');
  const goSignIn  = () => navigate('/signin');

  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply blur-xl animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gold/60 rounded-full mix-blend-multiply blur-xl animate-pulse"></div>
      </div>

      {/* Floating icons */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Feather className="absolute top-24 left-[12%] w-8 h-8 text-primary/20 rotate-12" />
        <PenLine className="absolute top-10 right-[15%] w-8 h-8 text-accent/25 -rotate-12" />
        <ScrollText className="absolute bottom-24 left-[18%] w-8 h-8 text-ink/10" />
        <Compass className="absolute bottom-12 right-[20%] w-8 h-8 text-gold/25" />
        <Star className="absolute top-1/2 left-1/2 -translate-x-1/2 w-6 h-6 text-primary/15" />
      </div>

      {/* Header */}
      <header className="relative z-10 glass-soft border-b border-white/60">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden shadow-2xl border-2 border-white/60 bg-white/70 backdrop-blur">
                <img
                  src={LOGO_SRC}
                  alt="DahTruth Story Lab Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold font-serif tracking-tight">DahTruth Story Lab</h1>
                <p className="text-muted text-sm font-serif italic">Where the writing journey begins.</p>
              </div>
            </div>

            {/* Only sign-in lives here; create account made high-contrast */}
            <div className="flex items-center gap-3">
              <button
                onClick={goSignIn}
                className="px-6 py-2 rounded-full glass-soft border border-white/60 text-ink font-serif font-medium transition-all duration-300 hover:bg-white/80"
              >
                Sign In
              </button>
              <button
                onClick={goRegister}
                className="px-6 py-2 rounded-full bg-primary text-white font-serif font-medium transition-all duration-300 shadow-lg hover:opacity-90"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          {/* (Removed the small "DahTruth Story Lab" badge above the headline) */}
          <h2 className="text-5xl sm:text-6xl font-bold mb-6 font-serif leading-tight">
            Write boldly. <span className="text-gold">Edit clearly.</span><br />
            <span className="text-accent">Publish confidently.</span>
          </h2>

          <p className="text-muted max-w-2xl mx-auto font-serif text-lg">
            An inspiring, faith-centered space to plan, draft, and finish your novel—supported by smart tools and a caring community.
          </p>

          {/* CTA buttons (removed secondary Sign In here) */}
          <div className="flex justify-center mt-12">
            <button
              onClick={goRegister}
              className="px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-ink font-serif font-bold text-lg transition-all duration-300 shadow-2xl hover:opacity-90 hover:scale-105"
            >
              Start 8-Week Challenge
            </button>
          </div>
        </div>

        {/* Challenge Section */}
        <section className="glass-panel rounded-3xl p-10 md:p-12 mb-12 border border-white/60 shadow-2xl">
          <div className="text-center mb-10">
            <h3 className="text-3xl sm:text-4xl font-bold mb-4 font-serif">8-Week Novel Challenge</h3>
            <p className="text-xl text-ink/80 font-serif leading-relaxed max-w-3xl mx-auto">
              Complete your 25,000-word novel in 8 weeks. Get AI prompts, planning tools, and encouragement grounded in faith—every step of the way.
            </p>
            <button
              onClick={goRegister}
              className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-accent text-ink font-serif font-bold text-lg transition-all duration-300 shadow-xl hover:opacity-90 hover:scale-105"
            >
              Join the Challenge →
            </button>
          </div>

          {/* Mini stats / trust row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="rounded-xl glass-soft border border-white/60 px-4 py-3">
              <span className="text-2xl font-extrabold text-ink">25k</span>
              <div className="text-xs text-muted mt-1">Word Goal</div>
            </div>
            <div className="rounded-xl glass-soft border border-white/60 px-4 py-3">
              <span className="text-2xl font-extrabold text-ink">8</span>
              <div className="text-xs text-muted mt-1">Weeks</div>
            </div>
            <div className="rounded-xl glass-soft border border-white/60 px-4 py-3">
              <span className="text-2xl font-extrabold text-ink">∞</span>
              <div className="text-xs text-muted mt-1">Encouragement</div>
            </div>
          </div>
        </section>

        {/* List below the 8-week challenge */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-muted">
          <div className="inline-flex items-center gap-2">
            <PenLine className="w-4 h-4 text-primary" /> Writing prompts
          </div>
          <div className="inline-flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-accent" /> Scene planning
          </div>
          <div className="inline-flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" /> Character development
          </div>
          <div className="inline-flex items-center gap-2">
            <Users className="w-4 h-4 text-gold" /> Lab collaboration
          </div>
        </div>

        {/* Features Grid */}
        <section className="mt-12 grid md:grid-cols-3 gap-8">
          <div className="glass-soft rounded-2xl p-8 border border-white/60 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/15">
                <Brain className="w-6 h-6 text-primary" />
              </div>
              <h4 className="text-xl font-bold font-serif">Smart AI Writing Assistant</h4>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Get contextual prompts, beat writer’s block, and keep your story moving with scene-aware suggestions.
            </p>
          </div>

          <div className="glass-soft rounded-2xl p-8 border border-white/60 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/20">
                <BookOpen className="w-6 h-6 text-accent" />
              </div>
              <h4 className="text-xl font-bold font-serif">Character &amp; World Building</h4>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Create rich character profiles, track arcs, and build immersive settings that anchor your plot.
            </p>
          </div>

          <div className="glass-soft rounded-2xl p-8 border border-white/60 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gold/20">
                <Heart className="w-6 h-6 text-gold" />
              </div>
              <h4 className="text-xl font-bold font-serif">Faith-Centered Community</h4>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Be supported by fellow Christian writers—share progress, encouragement, and prayer.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
