// src/types/project.ts
// Complete type definitions for the multi-project system

/* ============================================================================
   AUTHOR PROFILE
   ============================================================================ */

export interface AuthorProfile {
  id: string;                    // Hash of email or UUID
  name: string;                  // Display name / pen name
  email: string;
  createdAt: string;
  updatedAt: string;
  
  // Profile details
  tagline?: string;              // Short bio/tagline
  bio?: string;                  // Full bio (up to 500 chars)
  avatarUrl?: string;            // Base64 or URL for avatar
  genres?: string[];             // Writing genres
  
  // Social links
  website?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  
  // Preferences
  preferences?: AuthorPreferences;
}

export interface AuthorPreferences {
  defaultGenre?: string;
  defaultTargetWords?: number;
  theme?: "light" | "dark" | "system";
  aiProvider?: "openai" | "anthropic";
  autoSaveEnabled?: boolean;
  autoSaveIntervalMs?: number;
}

/* ============================================================================
   PROJECT STRUCTURE
   ============================================================================ */

export interface Project {
  id: string;
  authorId: string;
  
  // Core metadata
  title: string;
  author: string;                // Author name (for book cover)
  genre?: string;
  description?: string;
  targetWords?: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastOpenedAt?: string;
  
  // Status
  status: ProjectStatus;
  
  // Compose workspace data
  compose: ComposeData;
  
  // Publishing workspace data
  publishing: PublishingData;
  
  // Cover designer data
  cover: CoverData;
  
  // Version for migration support
  version: number;
}

export type ProjectStatus = 
  | "draft"
  | "writing"
  | "editing"
  | "publishing"
  | "completed"
  | "archived";

/* ============================================================================
   COMPOSE DATA (Writing Workspace)
   ============================================================================ */

export interface ComposeData {
  chapters: Chapter[];
  characters: Character[];
  activeChapterId?: string;
  
  // Editor state
  editorSettings?: EditorSettings;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  
  // Content
  text: string;                  // Plain text
  textHTML?: string;             // Rich text HTML
  
  // Metadata
  wordCount?: number;
  status?: ChapterStatus;
  notes?: string;
  
  // Publishing flags
  included: boolean;             // Include in manuscript
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export type ChapterStatus = 
  | "outline"
  | "draft"
  | "revised"
  | "final";

export interface Character {
  id: string;
  name: string;
  aliases?: string[];
  description?: string;
  traits?: string[];
  relationships?: CharacterRelationship[];
  notes?: string;
  imageUrl?: string;
  
  // For Character Clothesline feature
  color?: string;
  position?: { x: number; y: number };
}

export interface CharacterRelationship {
  characterId: string;
  type: string;                  // "sibling", "spouse", "enemy", etc.
  description?: string;
}

export interface EditorSettings {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  showWordCount?: boolean;
  spellCheck?: boolean;
}

/* ============================================================================
   PUBLISHING DATA (Formatting Workspace)
   ============================================================================ */

export interface PublishingData {
  // Formatted chapters (may differ from Compose)
  chapters: PublishingChapter[];
  activeChapterId?: string;
  
  // Front and back matter
  matter: Matter;
  
  // Metadata for title page, headers, etc.
  meta: PublishingMeta;
  
  // Format settings
  format: FormatSettings;
  
  // Platform target
  platform: PlatformSettings;
  
  // Generated materials
  materials?: StoryMaterials;
}

export interface PublishingChapter {
  id: string;
  title: string;
  order: number;
  
  text: string;
  textHTML?: string;
  
  included: boolean;
  
  // Publishing-specific
  pageBreakBefore?: boolean;
  customStyles?: Record<string, string>;
}

export interface Matter {
  // Front matter
  titlePage: string;
  copyright: string;
  dedication: string;
  epigraph: string;
  toc: boolean;
  tocFromHeadings?: boolean;
  
  // Back matter
  acknowledgments: string;
  aboutAuthor: string;
  notes: string;
}

export interface PublishingMeta {
  title: string;
  author: string;
  authorLast?: string;
  year: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
}

export interface FormatSettings {
  // Typography
  fontFamily: string;
  fontSizePt: number;
  lineHeight: number;
  
  // Spacing
  firstLineIndentInches: number;
  paragraphSpacingPt: number;
  
  // Alignment
  align: "left" | "justify" | "center" | "right";
  
  // Chapters
  chapterTitleCase: "UPPER" | "Capitalize" | "AsIs";
  chapterStartsOnNewPage: boolean;
  
  // Preset key
  presetKey?: string;
}

export interface PlatformSettings {
  presetKey: string;
  
  // Trim size (for print)
  trim?: {
    widthInch: number;
    heightInch: number;
  } | null;
  
  // Margins
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    gutter?: number;
  };
  
  // Features
  headers: boolean;
  footers: boolean;
  pageNumbers: boolean;
  showTOCInEbook: boolean;
}

export interface StoryMaterials {
  synopsisShort?: string;
  synopsisLong?: string;
  backCover?: string;
  logline?: string;
  queryLetter?: string;
  generatedAt?: string;
}

/* ============================================================================
   COVER DATA (Cover Designer)
   ============================================================================ */

export interface CoverData {
  // Text
  title: string;
  subtitle?: string;
  author: string;
  
  // Design
  genrePresetKey: string;
  layoutKey: string;
  
  // Background
  backgroundType: "gradient" | "image";
  backgroundImageUrl?: string;
  backgroundImageFit?: "cover" | "contain";
  backgroundImageFilter?: "soft-dark" | "soft-blur" | "none";
  
  // Export settings
  trimKey: string;
  dpi: number;
  
  // Saved designs
  savedDesigns?: SavedCoverDesign[];
}

export interface SavedCoverDesign {
  id: string;
  name: string;
  createdAt: string;
  
  title: string;
  subtitle?: string;
  author: string;
  genrePresetKey: string;
  layoutKey: string;
  
  backgroundImageUrl?: string;
  backgroundImageFit?: string;
  backgroundImageFilter?: string;
}

/* ============================================================================
   PROJECT INDEX (for fast dashboard loading)
   ============================================================================ */

export interface ProjectIndexEntry {
  id: string;
  title: string;
  author: string;
  status: ProjectStatus;
  wordCount?: number;
  chapterCount?: number;
  updatedAt: string;
  createdAt: string;
}

export interface ProjectIndex {
  authorId: string;
  projects: ProjectIndexEntry[];
  updatedAt: string;
}

/* ============================================================================
   SYNC STATUS
   ============================================================================ */

export type SyncStatus = 
  | "idle"
  | "syncing"
  | "saved"
  | "error"
  | "offline";

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt?: string;
  error?: string;
  pendingChanges: boolean;
}

/* ============================================================================
   DEFAULTS / FACTORIES
   ============================================================================ */

export const DEFAULT_MATTER: Matter = {
  titlePage: "{title}\nby {author}",
  copyright: "© {year} {author}. All rights reserved.",
  dedication: "",
  epigraph: "",
  toc: true,
  tocFromHeadings: true,
  acknowledgments: "",
  aboutAuthor: "",
  notes: "",
};

export const DEFAULT_FORMAT_SETTINGS: FormatSettings = {
  fontFamily: "Times New Roman",
  fontSizePt: 12,
  lineHeight: 2.0,
  firstLineIndentInches: 0.5,
  paragraphSpacingPt: 0,
  align: "left",
  chapterTitleCase: "UPPER",
  chapterStartsOnNewPage: true,
  presetKey: "Agents_Standard_12pt_TNR_Double",
};

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  presetKey: "Generic_Manuscript_Submission",
  trim: null,
  margins: { top: 1, right: 1, bottom: 1, left: 1 },
  headers: true,
  footers: true,
  pageNumbers: true,
  showTOCInEbook: false,
};

export const DEFAULT_COVER_DATA: CoverData = {
  title: "Working Title",
  subtitle: "",
  author: "Your Name",
  genrePresetKey: "general",
  layoutKey: "center",
  backgroundType: "gradient",
  backgroundImageFilter: "soft-dark",
  trimKey: "6x9",
  dpi: 300,
};

export function createEmptyProject(authorId: string, title: string = "Untitled Project"): Project {
  const now = new Date().toISOString();
  const id = crypto?.randomUUID?.() || `proj_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  return {
    id,
    authorId,
    title,
    author: "",
    status: "draft",
    createdAt: now,
    updatedAt: now,
    version: 1,
    
    compose: {
      chapters: [
        {
          id: crypto?.randomUUID?.() || `ch_${Date.now()}`,
          title: "Chapter 1",
          order: 0,
          text: "",
          textHTML: "",
          included: true,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        },
      ],
      characters: [],
    },
    
    publishing: {
      chapters: [],
      matter: { ...DEFAULT_MATTER },
      meta: {
        title,
        author: "",
        year: new Date().getFullYear().toString(),
      },
      format: { ...DEFAULT_FORMAT_SETTINGS },
      platform: { ...DEFAULT_PLATFORM_SETTINGS },
    },
    
    cover: { ...DEFAULT_COVER_DATA, title },
  };
}

export function createProjectIndexEntry(project: Project): ProjectIndexEntry {
  const wordCount = project.compose.chapters.reduce(
    (sum, ch) => sum + (ch.text?.split(/\s+/).filter(Boolean).length || 0),
    0
  );
  
  return {
    id: project.id,
    title: project.title,
    author: project.author,
    status: project.status,
    wordCount,
    chapterCount: project.compose.chapters.length,
    updatedAt: project.updatedAt,
    createdAt: project.createdAt,
  };
}
