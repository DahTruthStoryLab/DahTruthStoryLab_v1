// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Brain, Heart } from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate('/auth/register');
  const goSignIn  = () => navigate('/signin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-15">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-700"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative z-10 bg-blue-950/30 backdrop-blur-md border-b border-blue-800/40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-2xl border-2 border-blue-400/30">
                <img
                  src="/dahtruth-logo.png"
                  alt="DahTruth Story Lab Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white font-serif">DahTruth Story Lab</h1>
                <p className="text-blue-200 text-sm font-serif italic">Where your story comes to life</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={goSignIn}
                className="px-6 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-full font-serif font-medium transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
              <button
                onClick={goRegister}
                className="px-6 py-2 bg-blue-900/40 hover:bg-blue-800/60 text-white border border-blue-500/50 rounded-full font-serif font-medium transition-all duration-300 backdrop-blur-sm"
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
          <h2 className="text-6xl font-bold text-white mb-6 font-serif leading-tight">
            Write boldly. <span className="text-blue-400">Edit clearly.</span><br />
            <span className="text-teal-400">Publish confidently.</span>
          </h2>
          <p className="text-blue-200 max-w-2xl mx-auto font-serif text-lg">
            An inspiring, faith-centered space to plan, draft, and finish your novel—supported by smart tools and a caring community.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center mt-12">
            <button
              onClick={goRegister}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-teal-500 hover:from-blue-400 hover:to-teal-400 text-white rounded-full font-serif font-bold text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl hover:scale-105"
            >
              Start 8-Week Challenge
            </button>
            <button
              onClick={goSignIn}
              className="px-8 py-4 bg-blue-900/40 hover:bg-blue-800/60 text-white border border-blue-500/50 rounded-full font-serif font-medium text-lg backdrop-blur-sm transition-all duration-300"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* Challenge Section */}
        <div className="bg-blue-950/40 backdrop-blur-md rounded-3xl p-12 mb-16 border border-blue-800/40 shadow-2xl">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold text-white mb-4 font-serif">8-Week Novel Challenge</h3>
            <p className="text-xl text-blue-100 font-serif leading-relaxed max-w-3xl mx-auto">
              Complete your 25,000-word novel in 8 weeks. Get AI prompts, planning tools, and encouragement grounded in faith—every step of the way.
            </p>
            <button
              onClick={goRegister}
              className="mt-8 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-400 hover:to-blue-400 text-white rounded-full font-serif font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl hover:scale-105"
            >
              Join the Challenge →
            </button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl p-8 border border-blue-800/40 hover:border-blue-600/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-600/30 rounded-lg flex-shrink-0">
                <Brain className="h-6 w-6 text-blue-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-serif">Smart AI Writing Assistant</h4>
              </div>
            </div>
            <p className="text-blue-200 font-serif leading-relaxed">
              Get contextual prompts, beat writer’s block, and keep your story moving with scene-aware suggestions.
            </p>
          </div>

          <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl p-8 border border-blue-800/40 hover:border-blue-600/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-teal-600/30 rounded-lg flex-shrink-0">
                <BookOpen className="h-6 w-6 text-teal-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-serif">Character & World Building</h4>
              </div>
            </div>
            <p className="text-blue-200 font-serif leading-relaxed">
              Create rich character profiles, track arcs, and build immersive settings that anchor your plot.
            </p>
          </div>

          <div className="bg-blue-950/40 backdrop-blur-md rounded-2xl p-8 border border-blue-800/40 hover:border-blue-600/60 transition-all duration-300 hover:scale-105 shadow-xl">
            <div className="flex items-start space-x-4 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-indigo-600/30 rounded-lg flex-shrink-0">
                <Heart className="h-6 w-6 text-indigo-300" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white font-serif">Faith-Centered Community</h4>
              </div>
            </div>
            <p className="text-blue-200 font-serif leading-relaxed">
              Be supported by fellow Christian writers—share progress, encouragement, and prayer.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
