// src/lib/genreConfig.js
// Central configuration for genre-based module loading
// This is the SPINE of the StoryLab genre-smart system
//
// Controls:
// - Project structure (chapters vs recipes vs entries)
// - Enabled tag types
// - Which modules render
// - Which stats display
// - Which AI scans run

/* =============================================================================
   GENRE CATEGORIES
   Each genre belongs to one category, which determines the entire UX
============================================================================= */

export const GENRE_CATEGORIES = {
  CHARACTER: 'character',    // Fiction - characters, relationships, arcs
  THEME: 'theme',            // Essays/Arguments - themes, evidence, claims
  RECIPE: 'recipe',          // Cookbooks - ingredients, steps, timing
  HYBRID: 'hybrid',          // Memoir/Bio - real people + themes + timeline
  REFERENCE: 'reference',    // Instructional - lessons, prompts, objectives
  COLLECTION: 'collection',  // Anthologies - multiple independent pieces
  GENERAL: 'general',        // Undeclared - minimal universal tools
};

/* =============================================================================
   PROJECT STRUCTURE TYPES
   Determines how "chapters" are labeled and organized
============================================================================= */

export const STRUCTURE_TYPES = {
  CHAPTERS: 'chapters',      // Standard book chapters
  RECIPES: 'recipes',        // Each "chapter" is a recipe
  ENTRIES: 'entries',        // Devotional/workbook entries
  ARTICLES: 'articles',      // Essay/article collection
  LESSONS: 'lessons',        // Curriculum/study guide units
  STORIES: 'stories',        // Short story collection
  POEMS: 'poems',            // Poetry collection
};

/* =============================================================================
   TAG NAMESPACES
   Universal tagging system - all tags use @namespace: format
============================================================================= */

export const TAG_NAMESPACES = {
  CHAR: 'char',              // Fictional characters
  PERSON: 'person',          // Real people (memoir/bio)
  THEME: 'theme',            // Themes and concepts
  INGREDIENT: 'ingredient',  // Recipe ingredients
  EQUIPMENT: 'equipment',    // Cooking equipment
  PLACE: 'place',            // Locations
  ORG: 'org',                // Organizations
  EVENT: 'event',            // Timeline events
  DATE: 'date',              // Dates/periods
  TERM: 'term',              // Key terms/glossary
  OBJECTIVE: 'objective',    // Learning objectives
  PROMPT: 'prompt',          // Workbook prompts
  STAGE: 'stage',            // Story/argument stages
};

/* =============================================================================
   GENRE TO CATEGORY MAPPING
============================================================================= */

export const GENRE_CATEGORY_MAP = {
  // CHARACTER-BASED (Fiction)
  'Urban Fiction': GENRE_CATEGORIES.CHARACTER,
  'Romance': GENRE_CATEGORIES.CHARACTER,
  'Mystery': GENRE_CATEGORIES.CHARACTER,
  'Fantasy': GENRE_CATEGORIES.CHARACTER,
  'Science Fiction': GENRE_CATEGORIES.CHARACTER,
  'Horror': GENRE_CATEGORIES.CHARACTER,
  'Thriller': GENRE_CATEGORIES.CHARACTER,
  'Literary Fiction': GENRE_CATEGORIES.CHARACTER,
  'Young Adult (YA)': GENRE_CATEGORIES.CHARACTER,
  'Historical Fiction': GENRE_CATEGORIES.CHARACTER,
  'Crime': GENRE_CATEGORIES.CHARACTER,
  'Action / Adventure': GENRE_CATEGORIES.CHARACTER,
  'Paranormal': GENRE_CATEGORIES.CHARACTER,
  'Dystopian': GENRE_CATEGORIES.CHARACTER,
  'Women\'s Fiction': GENRE_CATEGORIES.CHARACTER,
  'LGBTQ+ Fiction': GENRE_CATEGORIES.CHARACTER,
  'Contemporary Fiction': GENRE_CATEGORIES.CHARACTER,
  'Suspense': GENRE_CATEGORIES.CHARACTER,
  'Western': GENRE_CATEGORIES.CHARACTER,
  'Children\'s Fiction': GENRE_CATEGORIES.CHARACTER,
  'Graphic Novel / Comic': GENRE_CATEGORIES.CHARACTER,
  'Fan Fiction': GENRE_CATEGORIES.CHARACTER,
  'Satire': GENRE_CATEGORIES.CHARACTER,
  'Magical Realism': GENRE_CATEGORIES.CHARACTER,
  'Cozy Mystery': GENRE_CATEGORIES.CHARACTER,
  'Erotic Fiction': GENRE_CATEGORIES.CHARACTER,
  'Military Fiction': GENRE_CATEGORIES.CHARACTER,
  'Sports Fiction': GENRE_CATEGORIES.CHARACTER,
  'Family Saga': GENRE_CATEGORIES.CHARACTER,
  'Coming-of-Age': GENRE_CATEGORIES.CHARACTER,
  'Noir': GENRE_CATEGORIES.CHARACTER,
  'Steampunk': GENRE_CATEGORIES.CHARACTER,
  'Cyberpunk': GENRE_CATEGORIES.CHARACTER,
  'Gothic': GENRE_CATEGORIES.CHARACTER,

  // THEME-BASED (Non-Fiction / Essays / Arguments)
  'Non-Fiction': GENRE_CATEGORIES.THEME,
  'Essay Collection': GENRE_CATEGORIES.THEME,
  'Self-Help': GENRE_CATEGORIES.THEME,
  'Philosophy': GENRE_CATEGORIES.THEME,
  'Politics': GENRE_CATEGORIES.THEME,
  'Social Commentary': GENRE_CATEGORIES.THEME,
  'Psychology': GENRE_CATEGORIES.THEME,
  'Personal Finance': GENRE_CATEGORIES.THEME,
  'Business': GENRE_CATEGORIES.THEME,
  'Science': GENRE_CATEGORIES.THEME,
  'History': GENRE_CATEGORIES.THEME,
  'Journalism': GENRE_CATEGORIES.THEME,

  // REFERENCE/INSTRUCTIONAL
  'Religious / Spiritual': GENRE_CATEGORIES.REFERENCE,
  'Devotional': GENRE_CATEGORIES.REFERENCE,
  'Academic': GENRE_CATEGORIES.REFERENCE,
  'How-To / Guide': GENRE_CATEGORIES.REFERENCE,
  'Study Guide': GENRE_CATEGORIES.REFERENCE,
  'Curriculum': GENRE_CATEGORIES.REFERENCE,
  'Workbook': GENRE_CATEGORIES.REFERENCE,
  'Journal Prompts': GENRE_CATEGORIES.REFERENCE,
  'Reference': GENRE_CATEGORIES.REFERENCE,
  'Manual / SOP': GENRE_CATEGORIES.REFERENCE,
  'Education': GENRE_CATEGORIES.REFERENCE,
  'Technology': GENRE_CATEGORIES.REFERENCE,
  'Health / Wellness': GENRE_CATEGORIES.REFERENCE,

  // RECIPE-BASED (Cookbooks)
  'Cookbook': GENRE_CATEGORIES.RECIPE,
  'Recipe Collection': GENRE_CATEGORIES.RECIPE,
  'Food & Drink': GENRE_CATEGORIES.RECIPE,
  'Baking': GENRE_CATEGORIES.RECIPE,
  'Healthy Eating': GENRE_CATEGORIES.RECIPE,
  'Regional Cuisine': GENRE_CATEGORIES.RECIPE,
  'Vegan / Vegetarian': GENRE_CATEGORIES.RECIPE,

  // HYBRID (Real People + Themes)
  'Memoir': GENRE_CATEGORIES.HYBRID,
  'Biography': GENRE_CATEGORIES.HYBRID,
  'Autobiography': GENRE_CATEGORIES.HYBRID,
  'Creative Non-Fiction': GENRE_CATEGORIES.HYBRID,
  'True Crime': GENRE_CATEGORIES.HYBRID,
  'Travel': GENRE_CATEGORIES.HYBRID,
  'Personal Essay': GENRE_CATEGORIES.HYBRID,

  // COLLECTION (Multiple independent pieces)
  'Short Story Collection': GENRE_CATEGORIES.COLLECTION,
  'Poetry': GENRE_CATEGORIES.COLLECTION,
  'Anthology': GENRE_CATEGORIES.COLLECTION,
  'Flash Fiction': GENRE_CATEGORIES.COLLECTION,

  // DEFAULT
  'General / Undeclared': GENRE_CATEGORIES.GENERAL,
};

/* =============================================================================
   CATEGORY CONFIGURATION
   The master config for each category - controls everything
============================================================================= */

export const CATEGORY_CONFIG = {
  [GENRE_CATEGORIES.CHARACTER]: {
    name: 'Fiction',
    description: 'Character-driven stories with narrative arcs',
    structure: STRUCTURE_TYPES.CHAPTERS,
    chapterLabel: 'Chapter',
    chapterLabelPlural: 'Chapters',
    
    // Allowed tag types for this category
    tagTypes: [
      TAG_NAMESPACES.CHAR,
      TAG_NAMESPACES.PLACE,
      TAG_NAMESPACES.ORG,
      TAG_NAMESPACES.STAGE,
    ],
    primaryTag: TAG_NAMESPACES.CHAR,
    
    // Sidebar modules to show
    sidebar: {
      primary: 'CharacterSidebar',
      components: ['CharacterList', 'CharacterRelationships', 'CharacterRoadmap', 'NarrativeArc'],
    },
    
    // Features enabled
    features: {
      characterScan: true,
      themeScan: false,
      ingredientScan: false,
      personScan: false,
      narrativeArc: true,
      argumentArc: false,
      recipeCards: false,
      timeline: false,
      lessonPlanner: false,
      collectionIndex: false,
    },
    
    // Stats to display
    stats: {
      primary: { key: 'characterCount', label: 'Characters', icon: 'Users' },
      secondary: [
        { key: 'chapterCount', label: 'Chapters', icon: 'BookOpen' },
        { key: 'wordCount', label: 'Words', icon: 'FileText' },
      ],
    },
    
    // AI context for prompts
    aiContext: 'This is a work of fiction with characters and narrative arcs. Focus on character development, dialogue, pacing, and story structure.',
  },

  [GENRE_CATEGORIES.THEME]: {
    name: 'Essays & Non-Fiction',
    description: 'Argument-driven writing with themes and evidence',
    structure: STRUCTURE_TYPES.CHAPTERS,
    chapterLabel: 'Chapter',
    chapterLabelPlural: 'Chapters',
    
    tagTypes: [
      TAG_NAMESPACES.THEME,
      TAG_NAMESPACES.TERM,
      TAG_NAMESPACES.STAGE,
    ],
    primaryTag: TAG_NAMESPACES.THEME,
    
    sidebar: {
      primary: 'ThemeSidebar',
      components: ['ThemeList', 'ThemeRoadmap', 'ArgumentArc', 'EvidenceTracker'],
    },
    
    features: {
      characterScan: false,
      themeScan: true,
      ingredientScan: false,
      personScan: false,
      narrativeArc: false,
      argumentArc: true,
      recipeCards: false,
      timeline: false,
      lessonPlanner: false,
      collectionIndex: false,
    },
    
    stats: {
      primary: { key: 'themeCount', label: 'Themes', icon: 'Lightbulb' },
      secondary: [
        { key: 'chapterCount', label: 'Chapters', icon: 'BookOpen' },
        { key: 'wordCount', label: 'Words', icon: 'FileText' },
      ],
    },
    
    aiContext: 'This is non-fiction focused on themes, arguments, and evidence. Help with clarity, logical flow, supporting evidence, and persuasive structure.',
  },

  [GENRE_CATEGORIES.RECIPE]: {
    name: 'Cookbook',
    description: 'Recipe collections with ingredients and instructions',
    structure: STRUCTURE_TYPES.RECIPES,
    chapterLabel: 'Recipe',
    chapterLabelPlural: 'Recipes',
    
    tagTypes: [
      TAG_NAMESPACES.INGREDIENT,
      TAG_NAMESPACES.EQUIPMENT,
    ],
    primaryTag: TAG_NAMESPACES.INGREDIENT,
    
    sidebar: {
      primary: 'RecipeSidebar',
      components: ['IngredientList', 'RecipeIndex', 'EquipmentTracker', 'MealPlanner'],
    },
    
    features: {
      characterScan: false,
      themeScan: false,
      ingredientScan: true,
      personScan: false,
      narrativeArc: false,
      argumentArc: false,
      recipeCards: true,
      timeline: false,
      lessonPlanner: false,
      collectionIndex: false,
    },
    
    stats: {
      primary: { key: 'recipeCount', label: 'Recipes', icon: 'ChefHat' },
      secondary: [
        { key: 'ingredientCount', label: 'Ingredients', icon: 'Apple' },
        { key: 'totalPrepTime', label: 'Total Prep', icon: 'Clock' },
      ],
    },
    
    aiContext: 'This is a cookbook. Help with clear instructions, ingredient lists, cooking tips, and recipe organization.',
  },

  [GENRE_CATEGORIES.HYBRID]: {
    name: 'Memoir & Biography',
    description: 'Real people, life events, and personal themes',
    structure: STRUCTURE_TYPES.CHAPTERS,
    chapterLabel: 'Chapter',
    chapterLabelPlural: 'Chapters',
    
    tagTypes: [
      TAG_NAMESPACES.PERSON,
      TAG_NAMESPACES.THEME,
      TAG_NAMESPACES.EVENT,
      TAG_NAMESPACES.DATE,
      TAG_NAMESPACES.PLACE,
    ],
    primaryTag: TAG_NAMESPACES.PERSON,
    
    sidebar: {
      primary: 'HybridSidebar',
      components: ['PeopleList', 'ThemeList', 'Timeline', 'LifeArc'],
    },
    
    features: {
      characterScan: false,
      themeScan: true,
      ingredientScan: false,
      personScan: true,
      narrativeArc: true,
      argumentArc: false,
      recipeCards: false,
      timeline: true,
      lessonPlanner: false,
      collectionIndex: false,
    },
    
    stats: {
      primary: { key: 'personCount', label: 'People', icon: 'User' },
      secondary: [
        { key: 'themeCount', label: 'Themes', icon: 'Lightbulb' },
        { key: 'eventCount', label: 'Events', icon: 'Calendar' },
        { key: 'wordCount', label: 'Words', icon: 'FileText' },
      ],
    },
    
    aiContext: 'This is a memoir/biography about real people and life events. Help with authentic voice, chronology, emotional truth, and thematic resonance.',
  },

  [GENRE_CATEGORIES.REFERENCE]: {
    name: 'Reference & Instructional',
    description: 'Educational content with lessons and objectives',
    structure: STRUCTURE_TYPES.LESSONS,
    chapterLabel: 'Section',
    chapterLabelPlural: 'Sections',
    
    tagTypes: [
      TAG_NAMESPACES.TERM,
      TAG_NAMESPACES.OBJECTIVE,
      TAG_NAMESPACES.PROMPT,
      TAG_NAMESPACES.THEME,
    ],
    primaryTag: TAG_NAMESPACES.TERM,
    
    sidebar: {
      primary: 'ReferenceSidebar',
      components: ['GlossaryList', 'ObjectiveTracker', 'LessonPlanner', 'PromptBank'],
    },
    
    features: {
      characterScan: false,
      themeScan: true,
      ingredientScan: false,
      personScan: false,
      narrativeArc: false,
      argumentArc: false,
      recipeCards: false,
      timeline: false,
      lessonPlanner: true,
      collectionIndex: false,
    },
    
    stats: {
      primary: { key: 'termCount', label: 'Key Terms', icon: 'Book' },
      secondary: [
        { key: 'objectiveCount', label: 'Objectives', icon: 'Target' },
        { key: 'sectionCount', label: 'Sections', icon: 'Layers' },
      ],
    },
    
    aiContext: 'This is educational/instructional content. Help with clear explanations, learning objectives, practical exercises, and logical organization.',
  },

  [GENRE_CATEGORIES.COLLECTION]: {
    name: 'Collection',
    description: 'Anthology of independent pieces (stories, poems, essays)',
    structure: STRUCTURE_TYPES.STORIES,
    chapterLabel: 'Piece',
    chapterLabelPlural: 'Pieces',
    
    tagTypes: [
      TAG_NAMESPACES.CHAR,
      TAG_NAMESPACES.THEME,
      TAG_NAMESPACES.STAGE,
    ],
    primaryTag: TAG_NAMESPACES.THEME,
    
    sidebar: {
      primary: 'CollectionSidebar',
      components: ['CollectionIndex', 'PieceMetadata', 'SharedElements', 'PublishTracker'],
    },
    
    features: {
      characterScan: true,
      themeScan: true,
      ingredientScan: false,
      personScan: false,
      narrativeArc: false, // Each piece has its own arc
      argumentArc: false,
      recipeCards: false,
      timeline: false,
      lessonPlanner: false,
      collectionIndex: true,
    },
    
    stats: {
      primary: { key: 'pieceCount', label: 'Pieces', icon: 'Files' },
      secondary: [
        { key: 'wordCount', label: 'Total Words', icon: 'FileText' },
        { key: 'publishedCount', label: 'Published', icon: 'CheckCircle' },
      ],
    },
    
    aiContext: 'This is a collection of independent pieces. Help with individual piece quality, collection cohesion, variety, and ordering.',
  },

  [GENRE_CATEGORIES.GENERAL]: {
    name: 'General',
    description: 'Basic tools for any project type',
    structure: STRUCTURE_TYPES.CHAPTERS,
    chapterLabel: 'Chapter',
    chapterLabelPlural: 'Chapters',
    
    tagTypes: [
      TAG_NAMESPACES.CHAR,
      TAG_NAMESPACES.THEME,
    ],
    primaryTag: TAG_NAMESPACES.CHAR,
    
    sidebar: {
      primary: 'GeneralSidebar',
      components: ['Outline', 'Notes', 'TodoList', 'Logline', 'Targets'],
    },
    
    features: {
      characterScan: true,
      themeScan: true,
      ingredientScan: false,
      personScan: false,
      narrativeArc: true,
      argumentArc: false,
      recipeCards: false,
      timeline: false,
      lessonPlanner: false,
      collectionIndex: false,
    },
    
    stats: {
      primary: { key: 'chapterCount', label: 'Chapters', icon: 'BookOpen' },
      secondary: [
        { key: 'wordCount', label: 'Words', icon: 'FileText' },
      ],
    },
    
    aiContext: 'Help with general writing tasks including clarity, structure, and style.',
  },
};

/* =============================================================================
   HELPER FUNCTIONS
============================================================================= */

/**
 * Get the category for a genre
 */
export function getGenreCategory(genre) {
  if (!genre) return GENRE_CATEGORIES.GENERAL;
  
  // Direct match
  if (GENRE_CATEGORY_MAP[genre]) {
    return GENRE_CATEGORY_MAP[genre];
  }
  
  // Case-insensitive match
  const lowerGenre = genre.toLowerCase();
  for (const [key, value] of Object.entries(GENRE_CATEGORY_MAP)) {
    if (key.toLowerCase() === lowerGenre) {
      return value;
    }
  }
  
  return GENRE_CATEGORIES.GENERAL;
}

/**
 * Get the full config for a genre
 */
export function getConfigForGenre(genre) {
  const category = getGenreCategory(genre);
  return CATEGORY_CONFIG[category] || CATEGORY_CONFIG[GENRE_CATEGORIES.GENERAL];
}

/**
 * Get allowed tag types for a genre
 */
export function getTagTypesForGenre(genre) {
  const config = getConfigForGenre(genre);
  return config.tagTypes || [];
}

/**
 * Get the primary tag namespace for a genre
 */
export function getPrimaryTagForGenre(genre) {
  const config = getConfigForGenre(genre);
  return config.primaryTag || TAG_NAMESPACES.CHAR;
}

/**
 * Get the chapter label for a genre (e.g., "Chapter", "Recipe", "Entry")
 */
export function getChapterLabel(genre, plural = false) {
  const config = getConfigForGenre(genre);
  return plural ? config.chapterLabelPlural : config.chapterLabel;
}

/**
 * Get the structure type for a genre
 */
export function getStructureType(genre) {
  const config = getConfigForGenre(genre);
  return config.structure || STRUCTURE_TYPES.CHAPTERS;
}

/**
 * Get the sidebar component name for a genre
 */
export function getSidebarComponent(genre) {
  const config = getConfigForGenre(genre);
  return config.sidebar?.primary || 'CharacterSidebar';
}

/**
 * Check if a feature is enabled for a genre
 */
export function isFeatureEnabled(genre, featureName) {
  const config = getConfigForGenre(genre);
  return config.features?.[featureName] || false;
}

/**
 * Get stats config for a genre
 */
export function getStatsConfig(genre) {
  const config = getConfigForGenre(genre);
  return config.stats || CATEGORY_CONFIG[GENRE_CATEGORIES.GENERAL].stats;
}

/**
 * Get AI context for a genre
 */
export function getAIContext(genre) {
  const config = getConfigForGenre(genre);
  return config.aiContext || '';
}

/**
 * Category checker functions
 */
export function isCharacterBased(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.CHARACTER;
}

export function isThemeBased(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.THEME;
}

export function isRecipeBased(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.RECIPE;
}

export function isHybrid(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.HYBRID;
}

export function isReference(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.REFERENCE;
}

export function isCollection(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.COLLECTION;
}

export function isGeneral(genre) {
  return getGenreCategory(genre) === GENRE_CATEGORIES.GENERAL;
}

/**
 * Get all genres for a category
 */
export function getGenresForCategory(category) {
  return Object.entries(GENRE_CATEGORY_MAP)
    .filter(([_, cat]) => cat === category)
    .map(([genre]) => genre);
}

/**
 * Get genres grouped by category (for UI display)
 */
export function getGenresGroupedByCategory() {
  return {
    'Fiction': getGenresForCategory(GENRE_CATEGORIES.CHARACTER),
    'Essays & Non-Fiction': getGenresForCategory(GENRE_CATEGORIES.THEME),
    'Reference & Instructional': getGenresForCategory(GENRE_CATEGORIES.REFERENCE),
    'Cookbooks': getGenresForCategory(GENRE_CATEGORIES.RECIPE),
    'Memoir & Biography': getGenresForCategory(GENRE_CATEGORIES.HYBRID),
    'Collections': getGenresForCategory(GENRE_CATEGORIES.COLLECTION),
    'Other': getGenresForCategory(GENRE_CATEGORIES.GENERAL),
  };
}

/**
 * Validate a tag for a genre (is this tag type allowed?)
 */
export function isTagAllowed(genre, tagNamespace) {
  const allowedTypes = getTagTypesForGenre(genre);
  return allowedTypes.includes(tagNamespace);
}

/**
 * Get the tag prefix string for a namespace (e.g., "@char:")
 */
export function getTagPrefix(namespace) {
  return `@${namespace}:`;
}

/**
 * Parse a tag from text (returns { namespace, value } or null)
 */
export function parseTag(text) {
  const match = text.match(/@(\w+):\s*(.+)/);
  if (!match) return null;
  return {
    namespace: match[1].toLowerCase(),
    value: match[2].trim(),
  };
}

/* =============================================================================
   MIGRATION HELPERS
============================================================================= */

/**
 * Get default category for projects without a genre
 */
export function getDefaultCategory() {
  return GENRE_CATEGORIES.GENERAL;
}

/**
 * Migrate old project data to new genre system
 */
export function migrateProjectGenre(project) {
  if (!project) return project;
  
  // If no genre, set to General / Undeclared
  if (!project.primaryGenre) {
    return {
      ...project,
      primaryGenre: 'General / Undeclared',
      _genreCategory: GENRE_CATEGORIES.GENERAL,
    };
  }
  
  // Add category for existing genre
  return {
    ...project,
    _genreCategory: getGenreCategory(project.primaryGenre),
  };
}

/* =============================================================================
   EXPORTS
============================================================================= */

export default {
  GENRE_CATEGORIES,
  STRUCTURE_TYPES,
  TAG_NAMESPACES,
  GENRE_CATEGORY_MAP,
  CATEGORY_CONFIG,
  getGenreCategory,
  getConfigForGenre,
  getTagTypesForGenre,
  getPrimaryTagForGenre,
  getChapterLabel,
  getStructureType,
  getSidebarComponent,
  isFeatureEnabled,
  getStatsConfig,
  getAIContext,
  isCharacterBased,
  isThemeBased,
  isRecipeBased,
  isHybrid,
  isReference,
  isCollection,
  isGeneral,
  getGenresForCategory,
  getGenresGroupedByCategory,
  isTagAllowed,
  getTagPrefix,
  parseTag,
  getDefaultCategory,
  migrateProjectGenre,
};
