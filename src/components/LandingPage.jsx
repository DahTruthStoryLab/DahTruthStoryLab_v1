// src/components/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Feather, PenLine, ScrollText, Compass, Star,
  Users, Sparkles, Library, Quote, NotebookPen, Briefcase,
  Brain, Wand2, MessageSquareQuote
} from 'lucide-react';
 
const LOGO_SRC = "/DahTruthLogo.png";
 
export default function LandingPage() {
  const navigate = useNavigate();
  const goRegister = () => navigate('/auth/register');
  const goSignIn   = () => navigate('/signin');
  const goStudios  = () => navigate('/dashboard');
 
  return (
    <div className="min-h-screen bg-base bg-radial-fade text-ink relative overflow-hidden">
      {/* ---------- Atmosphere: blobs ---------- */}
      <div className="absolute inset-0 opacity-30 pointer-events-none" aria-hidden="true">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent rounded-full mix-blend-multiply blur-3xl animate-pulse"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-accent/70 rounded-full mix-blend-multiply blur-3xl animate-pulse"></div>
        <div className="absolute top-[60%] left-[40%] w-80 h-80 bg-primary/40 rounded-full mix-blend-multiply blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-gold/40 rounded-full mix-blend-multiply blur-3xl animate-pulse"></div>
      </div>
 
      {/* ---------- Atmosphere: floating icons ---------- */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <Feather className="absolute top-24 left-[12%] w-8 h-8 text-accent/30 rotate-12" />
        <PenLine className="absolute top-10 right-[15%] w-8 h-8 text-primary/25 -rotate-12" />
        <ScrollText className="absolute bottom-24 left-[18%] w-8 h-8 text-ink/10" />
        <Compass className="absolute bottom-12 right-[20%] w-8 h-8 text-gold/30" />
        <Star className="absolute top-1/2 left-1/2 -translate-x-1/2 w-6 h-6 text-accent/20" />
      </div>
 
      {/* ---------- Header ---------- */}
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
 
            <div className="flex items-center gap-3">
              <button
                onClick={goSignIn}
                className="px-6 py-2 rounded-full glass-soft border border-white/60 text-ink font-serif font-medium transition-all duration-300 hover:bg-white/80"
              >
                Sign In
              </button>
              <button
                onClick={goRegister}
                className="px-6 py-2 rounded-full bg-accent text-white font-serif font-medium transition-all duration-300 shadow-lg hover:opacity-90"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </header>
 
      {/* ---------- HERO ---------- */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="relative">
          {/* Mauve glow pad behind the hero panel */}
          <div className="absolute -inset-6 bg-accent/25 blur-3xl rounded-[3rem]" aria-hidden="true" />
 
          <section className="relative glass-panel rounded-[2rem] border border-white/60 shadow-2xl overflow-hidden">
            {/* Inner mauve wash */}
            <div className="absolute inset-0 bg-gradient-to-br from-accent/30 via-transparent to-primary/20 pointer-events-none" />
            {/* Gold hairline accent */}
            <div className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
 
            <div className="relative px-8 py-20 md:px-16 md:py-24 text-center">
              <div className="inline-flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full glass-soft border border-white/60">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <span className="text-xs uppercase tracking-[0.25em] text-ink/70 font-serif">A Studio for Serious Writers</span>
              </div>
 
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-bold font-serif leading-[1.05] tracking-tight">
                Where the work
                <br />
                <span className="text-accent italic">takes its shape.</span>
              </h2>
 
              <p className="text-ink/75 max-w-2xl mx-auto font-serif text-lg md:text-xl mt-8 leading-relaxed">
                A deliberate space to plan, draft, and finish the work that matters to you,
                with an intelligent writing companion at your side. Built for writers who take
                craft seriously, across fiction, nonfiction, and verse.
              </p>
 
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
                <button
                  onClick={goStudios}
                  className="px-8 py-4 rounded-full bg-accent text-white font-serif font-bold text-lg transition-all duration-300 shadow-2xl hover:opacity-90 hover:scale-105"
                >
                  Enter the Studios →
                </button>
                <button
                  onClick={goRegister}
                  className="px-8 py-4 rounded-full glass-soft border border-white/60 text-ink font-serif font-medium text-lg transition-all duration-300 hover:bg-white/80"
                >
                  Create an Account
                </button>
              </div>
            </div>
          </section>
        </div>
 
        {/* ---------- SECTION 1: THE FORMS ---------- */}
        <section className="mt-20">
          <div className="max-w-3xl mx-auto mb-10 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-gold" />
              <span className="text-xs uppercase tracking-[0.3em] text-gold font-serif">The Forms</span>
              <div className="h-px w-8 bg-gold" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
              Four <span className="text-gold">Studios</span> to bring your work into form.
            </h3>
          </div>
 
          <div className="grid md:grid-cols-2 gap-6">
            <FormCard
              icon={<BookOpen className="w-5 h-5 text-accent" />}
              name="Fiction"
              body="Shape stories of depth and texture, where character, place, and narrative are brought carefully into form."
            />
            <FormCard
              icon={<NotebookPen className="w-5 h-5 text-accent" />}
              name="Nonfiction"
              body="Set down essays and memoirs that order lived experience into clear, deliberate, and lasting work."
            />
            <FormCard
              icon={<Quote className="w-5 h-5 text-accent" />}
              name="Poetry"
              body="Compose verse with rhythm and measure, refined into language that endures beyond the moment."
            />
            <FormCard
              icon={<Users className="w-5 h-5 text-accent" />}
              name="Workshops"
              body="Gather in shared study to exchange thought, refine craft, and bring each work to completion."
            />
          </div>
        </section>
      </main>
 
      {/* ---------- SECTION: THE COMPANION (AI) ---------- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mt-20">
        <div className="relative">
          <div className="absolute -inset-4 bg-accent/15 blur-3xl rounded-[3rem]" aria-hidden="true" />
          <div className="relative glass-panel rounded-[2rem] border border-white/60 shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/15 via-transparent to-primary/10 pointer-events-none" />
            <div className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
 
            <div className="relative grid md:grid-cols-2 gap-10 p-10 md:p-14 items-center">
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="h-px w-8 bg-gold" />
                  <span className="text-xs uppercase tracking-[0.3em] text-gold font-serif">The Companion</span>
                  <div className="h-px w-8 bg-gold md:hidden" />
                </div>
                <h3 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
                  An intelligent <span className="text-gold">Reader</span>,
                  <br />
                  <span className="text-accent italic">always at your desk.</span>
                </h3>
                <p className="mt-5 text-ink/80 font-serif leading-relaxed text-lg">
                  Story Lab is built around a writing companion that reads what you have written
                  and helps you move forward. Not to write for you, but to think alongside you when
                  the work asks more than memory can hold.
                </p>
              </div>
 
              <div className="space-y-4">
                <CompanionItem
                  icon={<Brain className="w-5 h-5 text-accent" />}
                  title="Scene-aware suggestions"
                  body="Prompts and questions drawn from the chapter you are in, the characters already on the page, and the arc you have set in motion."
                />
                <CompanionItem
                  icon={<Wand2 className="w-5 h-5 text-accent" />}
                  title="Through the difficult passage"
                  body="When the next sentence will not come, ask for openings, alternatives, or a sharper line. Take what serves the work and leave the rest."
                />
                <CompanionItem
                  icon={<MessageSquareQuote className="w-5 h-5 text-accent" />}
                  title="A second reader for revision"
                  body="Test a passage for clarity, weigh the cadence of a paragraph, or pressure a chapter for the places where the writing gives way."
                />
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* ---------- SECTION 2: THE WORKSPACES (deep mauve band) ---------- */}
      <section className="relative mt-20 py-20 md:py-24 overflow-hidden">
        {/* Deep mauve background using primary/accent tokens */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-primary" aria-hidden="true" />
        <div className="absolute inset-0 bg-ink/40" aria-hidden="true" />
 
        {/* Glow orbs */}
        <div className="absolute top-10 left-[10%] w-72 h-72 bg-accent/40 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute bottom-10 right-[10%] w-80 h-80 bg-gold/15 rounded-full blur-3xl" aria-hidden="true" />
 
        {/* Gold hairlines */}
        <div className="absolute inset-x-0 top-0 mx-auto h-px w-40 bg-gold/70" />
        <div className="absolute inset-x-0 bottom-0 mx-auto h-px w-40 bg-gold/40" />
 
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-3xl mx-auto mb-12 text-center">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="h-px w-8 bg-gold" />
              <span className="text-xs uppercase tracking-[0.3em] text-gold font-serif">The Workspaces</span>
              <div className="h-px w-8 bg-gold" />
            </div>
            <h3 className="text-4xl md:text-5xl font-bold font-serif leading-tight text-white">
              Three <span className="text-gold">Rooms</span> for the writing life.
            </h3>
            <p className="mt-5 text-white/75 font-serif leading-relaxed text-lg">
              Each studio holds a distinct part of the work. Move between them as the writing requires.
            </p>
          </div>
 
          <div className="grid md:grid-cols-3 gap-6">
            <WorkspaceCard
              number="01"
              icon={<PenLine className="w-5 h-5 text-gold" />}
              name="Compose"
              body="The desk where chapters take shape. Draft, revise, and order your manuscript with the page held steady, your notes within reach, and the work unbroken."
            />
            <WorkspaceCard
              number="02"
              icon={<Library className="w-5 h-5 text-gold" />}
              name="Publishing"
              body="The room where the manuscript becomes a book. Prepare your cover, format the interior, and ready the work for the readers who have been waiting for it."
            />
            <WorkspaceCard
              number="03"
              icon={<Briefcase className="w-5 h-5 text-gold" />}
              name="Author"
              body="The space behind the work itself. Hold your projects together, track what you have made, and tend to the life of the writer alongside the writing."
            />
          </div>
        </div>
      </section>
 
      {/* ---------- SECTION: A LOOK INSIDE (Tour) ---------- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 mt-20">
        <div className="max-w-3xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-gold" />
            <span className="text-xs uppercase tracking-[0.3em] text-gold font-serif">A Look Inside</span>
            <div className="h-px w-8 bg-gold" />
          </div>
          <h3 className="text-4xl md:text-5xl font-bold font-serif leading-tight">
            Visit each <span className="text-gold">Studio</span>.
          </h3>
          <p className="mt-5 text-ink/75 font-serif leading-relaxed text-lg">
            A glimpse of the rooms where the work takes place.
          </p>
        </div>
 
        <div className="grid md:grid-cols-3 gap-6">
          <TourCard
            name="Compose"
            caption="Where chapters take shape, in a clean and steady editor."
            screenshot="/screenshots/compose.png"
          />
          <TourCard
            name="Publishing"
            caption="Cover, format, and prepare your manuscript for readers."
            screenshot="/screenshots/publishing.png"
          />
          <TourCard
            name="Author"
            caption="Hold all your work together in one place."
            screenshot="/screenshots/author.png"
          />
        </div>
      </section>
 
      {/* ---------- CHALLENGE ---------- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="relative">
          <div className="absolute -inset-4 bg-accent/20 blur-3xl rounded-[3rem]" aria-hidden="true" />
          <div className="relative glass-panel rounded-3xl p-10 md:p-14 border border-white/60 shadow-2xl">
            <div className="absolute left-10 right-10 top-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent" />
 
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 mb-3">
                <div className="h-px w-8 bg-gold" />
                <span className="text-xs uppercase tracking-[0.3em] text-gold font-serif">A Structured Path</span>
                <div className="h-px w-8 bg-gold" />
              </div>
              <h3 className="text-4xl md:text-5xl font-bold mb-5 font-serif">The Novel Challenge</h3>
              <p className="text-lg md:text-xl text-ink/80 font-serif leading-relaxed max-w-3xl mx-auto">
                A guided path to a finished first draft. Eight weeks, a clear weekly rhythm,
                and the planning tools to carry the work from opening line to final page.
              </p>
              <button
                onClick={goRegister}
                className="mt-8 px-8 py-4 rounded-full bg-gradient-to-r from-accent to-primary text-white font-serif font-bold text-lg transition-all duration-300 shadow-xl hover:opacity-90 hover:scale-105"
              >
                Begin the Challenge →
              </button>
            </div>
 
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div className="rounded-xl glass-soft border border-white/60 px-4 py-4">
                <span className="text-3xl font-extrabold text-accent font-serif">75k</span>
                <div className="text-xs text-muted mt-1 uppercase tracking-[0.15em]">Word Goal</div>
              </div>
              <div className="rounded-xl glass-soft border border-white/60 px-4 py-4">
                <span className="text-3xl font-extrabold text-accent font-serif">8</span>
                <div className="text-xs text-muted mt-1 uppercase tracking-[0.15em]">Weeks</div>
              </div>
              <div className="rounded-xl glass-soft border border-white/60 px-4 py-4">
                <span className="text-3xl font-extrabold text-accent font-serif">∞</span>
                <div className="text-xs text-muted mt-1 uppercase tracking-[0.15em]">Encouragement</div>
              </div>
            </div>
          </div>
        </div>
      </section>
 
      {/* ---------- Footer ---------- */}
      <footer className="relative z-10 border-t border-white/40 px-6 py-10 text-center">
        <p className="text-sm text-muted font-serif">
          DahTruth Story Lab · A studio of <span className="italic">DAHTRUTH, LLC</span>
        </p>
      </footer>
    </div>
  );
}
 
/* ---------- SUB-COMPONENTS ---------- */
 
function FormCard({ icon, name, body }) {
  return (
    <div className="group glass-soft rounded-2xl p-8 border border-white/60 hover:scale-[1.02] hover:border-accent/40 transition-all duration-300 shadow-xl">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/15 group-hover:bg-accent/25 transition">
          {icon}
        </div>
        <h4 className="text-2xl font-bold font-serif">{name}</h4>
      </div>
      <p className="text-ink/80 font-serif leading-relaxed">{body}</p>
    </div>
  );
}
 
function WorkspaceCard({ number, icon, name, body }) {
  return (
    <div className="rounded-2xl bg-white/[0.08] backdrop-blur-md p-8 border border-white/20 hover:bg-white/[0.13] hover:border-gold/50 transition-all duration-300">
      <div className="flex items-center gap-3 mb-5">
        <div className="h-px w-6 bg-gold" />
        <span className="font-serif text-xs tracking-[0.25em] text-gold">{number}</span>
        <div className="ml-auto flex items-center justify-center w-9 h-9 rounded-lg bg-white/10">
          {icon}
        </div>
      </div>
      <h4 className="text-3xl font-bold font-serif text-white tracking-tight">{name}</h4>
      <p className="mt-4 text-white/80 font-serif leading-relaxed">{body}</p>
    </div>
  );
}
 
function CompanionItem({ icon, title, body }) {
  return (
    <div className="flex gap-4 p-5 rounded-xl glass-soft border border-white/60 hover:border-accent/40 transition-all duration-300">
      <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-accent/15">
        {icon}
      </div>
      <div>
        <h5 className="font-serif font-bold text-lg">{title}</h5>
        <p className="mt-1 text-ink/75 font-serif leading-relaxed text-sm">{body}</p>
      </div>
    </div>
  );
}
 
function TourCard({ name, caption, screenshot }) {
  return (
    <div className="group glass-soft rounded-2xl border border-white/60 overflow-hidden shadow-xl hover:scale-[1.02] hover:border-accent/40 transition-all duration-300">
      <div className="aspect-[16/10] bg-gradient-to-br from-accent/15 via-white/40 to-primary/10 border-b border-white/60 relative overflow-hidden">
        <img
          src={screenshot}
          alt={`Preview of the ${name} studio`}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-serif text-2xl text-ink/30 italic">{name}</span>
        </div>
      </div>
      <div className="p-6 text-center">
        <h4 className="font-serif font-bold text-xl mb-2">{name}</h4>
        <p className="text-ink/75 font-serif text-sm leading-relaxed">{caption}</p>
      </div>
    </div>
  );
}
 
