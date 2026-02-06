// src/lib/storyWorkshopCards.js

/**
 * Maps a project's primaryGenre (e.g., "Literary Fiction", "Memoir", "Poetry")
 * to a workshop track: "Fiction" | "Non-Fiction" | "Poetry" | "General"
 */
export function normalizeGenre(raw) {
  const g = String(raw || "").trim().toLowerCase();

  // Catch empty or default
  if (!g || g.includes("general") || g.includes("undeclared")) return "General";

  // Poetry track
  if (g.includes("poetry")) return "Poetry";

  // Non-Fiction track
  const nonfictionHits = [
    "memoir",
    "biography",
    "essay",
    "essays",
    "cultural",
    "commentary",
    "self-help",
    "faith",
    "christian",
    "nonfiction",
    "non-fiction",
    "non fiction",
  ];
  if (nonfictionHits.some((k) => g.includes(k))) return "Non-Fiction";

  // Everything else defaults to Fiction
  return "Fiction";
}

/**
 * IMPORTANT: We store iconName (string) here because icons are imported in the component.
 * The component will map iconName -> actual Lucide icon.
 *
 * Keep iconName values in sync with the iconMap in StoryWorkshop.jsx
 * (e.g. "RouteIcon" must exist in iconMap).
 */
export const WORKSHOP_CARDS_BY_GENRE = {
  // Shared building blocks that can apply to most tracks
  common: [
    {
      key: "priorities",
      to: "/story-lab/workshop/priorities",
      title: "Priority Cards",
      description: "Brainstorm and organize what matters most.",
      iconName: "ListChecks",
    },
    {
      key: "roadmap",
      to: "/story-lab/workshop/roadmap",
      title: "Roadmap",
      description: "Map progression with clarity and intent.",
      iconName: "RouteIcon",
    },
  ],

  Fiction: [
    {
      key: "hfl",
      to: "/story-lab/workshop/hfl",
      title: "Hopes • Fears • Legacy",
      description: "Theme motivators by major characters.",
      iconName: "Layers",
    },
    {
      key: "clothesline",
      to: "/story-lab/workshop/clothesline",
      title: "Clothesline",
      description: "A visual cast-at-a-glance.",
      iconName: "Pin",
    },
    {
      key: "narrativeArc",
      to: "/story-lab/narrative-arc",
      title: "Narrative Arc",
      description: "Map emotional beats and structure.",
      iconName: "Sparkles",
    },

    // Add these only once the routes exist:
    // { key:"dialogueLab", to:"/story-lab/workshop/dialogue", title:"Dialogue Lab", description:"Subtext, tension, voice.", iconName:"BookOpen" },
    // { key:"sceneBuilder", to:"/story-lab/workshop/scenes", title:"Scene Builder", description:"Goal, conflict, shift, outcome.", iconName:"BookOpen" },
    // { key:"plotBuilder", to:"/story-lab/workshop/plot", title:"Plot Builder", description:"Stakes, turns, momentum.", iconName:"BookOpen" },
  ],

  "Non-Fiction": [
    {
      key: "throughline",
      to: "/story-lab/workshop/throughline",
      title: "Throughline Map",
      description: "Clarify purpose, audience, and thread.",
      iconName: "Layers",
    },
    {
      key: "argument",
      to: "/story-lab/workshop/argument",
      title: "Argument Builder",
      description: "Claims, logic, and progression.",
      iconName: "Sparkles",
    },
    {
      key: "voiceAuthority",
      to: "/story-lab/workshop/voice",
      title: "Voice and Authority Lab",
      description: "Stance, tone, and credibility.",
      iconName: "BookOpen",
    },
    {
      key: "evidence",
      to: "/story-lab/workshop/evidence",
      title: "Research and Evidence",
      description: "Support claims responsibly.",
      iconName: "Pin",
    },
  ],

  Poetry: [
    {
      key: "imagery",
      to: "/story-lab/workshop/imagery",
      title: "Imagery Lab",
      description: "Metaphor, clarity, sensory work.",
      iconName: "Sparkles",
    },
    {
      key: "sound",
      to: "/story-lab/workshop/sound",
      title: "Sound and Musicality",
      description: "Rhythm, repetition, pacing.",
      iconName: "Layers",
    },
    {
      key: "lineation",
      to: "/story-lab/workshop/lineation",
      title: "Line and Enjambment",
      description: "Breaks, breath, tension.",
      iconName: "Pin",
    },
    {
      key: "form",
      to: "/story-lab/workshop/form",
      title: "Form and Constraint",
      description: "Structure as creative engine.",
      iconName: "BookOpen",
    },
  ],

  General: [
    {
      key: "chooseGenre",
      to: "/projects",
      title: "Select a Genre",
      description: "Choose a project genre to unlock the right workshop modules.",
      iconName: "BookOpen",
    },
  ],
};
