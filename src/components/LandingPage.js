// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, Heart } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate('/auth/register');
  const goSignIn  = () => navigate('/signin');

  return (
    <div className="min-h-screen bg-base bg-radial-fade relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-primary rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gold/60 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 glass-soft border-b border-white/30">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-2 border-white/40">
                <img
                  src="/dahtruth-logo.png"
                  alt="DahTruth Story Lab Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-ink font-serif">DahTruth Story Lab</h1>
                <p className="text-muted text-sm font-serif italic">Where your story comes to life</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={goSignIn}
                className="px-6 py-2 bg-accent hover:opacity-90 text-ink rounded-full font-serif font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
              <button
                onClick={goRegister}
                className="px-6 py-2 bg-white/60 hover:bg-white/80 text-ink border border-white/60 rounded-full font-serif font-medium transition-all duration-300 backdrop-blur-sm"
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
          <h2 className="text-6xl font-bold text-ink mb-6 font-serif leading-tight">
            Write boldly. <span className="text-gold">Edit clearly.</span><br />
            <span className="text-accent">Publish confidently.</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto font-serif text-lg">
            An inspiring, faith-centered space to plan, draft, and finish your novel—supported by smart tools and a caring community.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
            <button
              onClick={goRegister}
              className="px-8 py-4 bg-gradient-to-r from-accent to-primary hover:opacity-90 text-ink rounded-full font-serif font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Start 8-Week Challenge
            </button>
            <button
              onClick={goSignIn}
              className="px-8 py-4 bg-white/60 hover:bg-white/80 text-ink border border-white/60 rounded-full font-serif font-medium text-lg backdrop-blur-sm transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Challenge Section */}
        <div className="glass-panel rounded-3xl p-12 mb-16 border border-white/40 shadow-2xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-ink mb-4 font-serif">8-Week Novel Challenge</h3>
            <p className="text-xl text-ink/80 font-serif leading-relaxed max-w-3xl mx-auto">
              Complete your 25,000-word novel in 8 weeks. Get AI prompts, planning tools, and encouragement grounded in faith—every step of the way.
            </p>
            <button
              onClick={goRegister}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-ink rounded-full font-serif font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Join the Challenge →
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-soft rounded-2xl p-8 border border-white/30 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-primary/60 rounded-lg flex-shrink-0">
                <Brain className="h-6 w-6 text-ink/80" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-ink font-serif">Smart AI Writing Assistant</h4>
              </div>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Get contextual prompts, beat writer’s block, and keep your story moving with scene-aware suggestions.
            </p>
          </div>

          <div className="glass-soft rounded-2xl p-8 border border-white/30 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-accent/60 rounded-lg flex-shrink-0">
                <BookOpen className="h-6 w-6 text-ink/80" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-ink font-serif">Character & World Building</h4>
              </div>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Create rich character profiles, track arcs, and build immersive settings that anchor your plot.
            </p>
          </div>

          <div className="glass-soft rounded-2xl p-8 border border-white/30 hover:scale-105 transition-all duration-300 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-gold/30 rounded-lg flex-shrink-0">
                <Heart className="h-6 w-6 text-ink/80" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-ink font-serif">Faith-Centered Community</h4>
              </div>
            </div>
            <p className="text-ink/80 font-serif leading-relaxed">
              Be supported by fellow Christian writers—share progress, encouragement, and prayer.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
