src/lib/workshopModules.ts
// src/lib/workshopModules.ts
export type WorkshopGenre = "Fiction" | "Non-Fiction" | "Poetry" | "General";

export type WorkshopToolKey =
  | "characterLab"
  | "dialogueLab"
  | "sceneBuilder"
  | "plotBuilder"
  | "narrativeArc"
  | "storyPrompts"
  | "argumentBuilder"
  | "throughlineMap"
  | "voiceAuthorityLab"
  | "researchEvidence"
  | "imageryLab"
  | "soundLab"
  | "lineationLab"
  | "personaVoiceLab"
  | "formConstraint";

export type WorkshopStep = {
  id: string;
  title: string;
  description: string;
  tools: WorkshopToolKey[];
};

export type WorkshopModule = {
  genre: WorkshopGenre;
  headerTitle: string;
  headerDescription: string;
  steps: WorkshopStep[];
};

export const WORKSHOP_MODULES: Record<WorkshopGenre, WorkshopModule> = {
  Fiction: {
    genre: "Fiction",
    headerTitle: "Fiction Workshop Module",
    headerDescription:
      "Manuscript-driven craft work focusing on character, scene, dialogue, and narrative arc using structured tools applied directly to your current draft.",
    steps: [
      {
        id: "fiction-character",
        title: "Character Development",
        description:
          "Define hopes, fears, priorities, and internal contradictions. Translate motivation into believable choices on the page.",
        tools: ["characterLab", "storyPrompts"],
      },
      {
        id: "fiction-scene",
        title: "Scene Construction",
        description:
          "Build scenes with intention: goal, conflict, shift, and outcome. Strengthen movement and purpose in every scene.",
        tools: ["sceneBuilder", "storyPrompts"],
      },
      {
        id: "fiction-dialogue",
        title: "Dialogue Lab",
        description:
          "Refine dialogue for voice, subtext, and tension. Make conversations do story work, not just fill space.",
        tools: ["dialogueLab"],
      },
      {
        id: "fiction-plot-arc",
        title: "Plot Builder and Narrative Arc",
        description:
          "Map your roadmap and narrative arc. Clarify stakes, turning points, and momentum across the manuscript.",
        tools: ["plotBuilder", "narrativeArc"],
      },
    ],
  },

  "Non-Fiction": {
    genre: "Non-Fiction",
    headerTitle: "Non-Fiction Workshop Module",
    headerDescription:
      "Manuscript-driven craft work focusing on purpose, structure, voice, argument, and evidence to produce clear, credible, and coherent nonfiction.",
    steps: [
      {
        id: "nf-purpose",
        title: "Purpose and Promise",
        description:
          "Clarify what your piece is doing, who it serves, and what it promises to deliver—without losing your voice.",
        tools: ["throughlineMap"],
      },
      {
        id: "nf-argument",
        title: "Argument Builder",
        description:
          "Strengthen thesis, claims, logic, and progression. Make the reader’s path through your thinking easy to follow.",
        tools: ["argumentBuilder", "throughlineMap"],
      },
      {
        id: "nf-voice",
        title: "Voice and Authority Lab",
        description:
          "Develop stance, tone, and authority. Align your voice with your intent and the emotional weight of the topic.",
        tools: ["voiceAuthorityLab"],
      },
      {
        id: "nf-evidence",
        title: "Research and Evidence Framework",
        description:
          "Support claims responsibly with sources, examples, and lived experience. Improve credibility without flattening the narrative.",
        tools: ["researchEvidence"],
      },
    ],
  },

  Poetry: {
    genre: "Poetry",
    headerTitle: "Poetry Workshop Module",
    headerDescription:
      "A manuscript-driven poetry track focused on imagery, sound, lineation, voice, and form—turning revision into precise craft.",
    steps: [
      {
        id: "poetry-imagery",
        title: "Imagery Lab",
        description:
          "Strengthen images and metaphor. Build sensory clarity and emotional resonance through compression and specificity.",
        tools: ["imageryLab"],
      },
      {
        id: "poetry-sound",
        title: "Sound and Musicality",
        description:
          "Work with rhythm, repetition, sonic texture, and pacing to shape meaning and impact.",
        tools: ["soundLab"],
      },
      {
        id: "poetry-lineation",
        title: "Line and Enjambment Studies",
        description:
          "Use line breaks and white space intentionally. Control breath, emphasis, and tension on the page.",
        tools: ["lineationLab"],
      },
      {
        id: "poetry-voice-form",
        title: "Persona, Voice, and Form",
        description:
          "Explore persona and voice. Experiment with form and constraint to deepen control and range.",
        tools: ["personaVoiceLab", "formConstraint"],
      },
    ],
  },

  General: {
    genre: "General",
    headerTitle: "Workshop Module",
    headerDescription:
      "Choose a genre to unlock the matching workshop tools and roadmap for your manuscript.",
    steps: [],
  },
};

export function normalizeGenre(raw?: string | null): WorkshopGenre {
  const g = (raw || "").trim().toLowerCase();
  if (g === "fiction") return "Fiction";
  if (g === "nonfiction" || g === "non-fiction" || g === "non fiction") return "Non-Fiction";
  if (g === "poetry") return "Poetry";
  return "General";
}
