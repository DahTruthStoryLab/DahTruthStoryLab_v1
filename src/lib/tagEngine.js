// src/lib/tagEngine.js
// Universal Tag Engine for DahTruth StoryLab
// Single system for parsing, validating, and managing all @namespace: tags
//
// Supports:
// - Multiple namespaces (@char:, @theme:, @ingredient:, @person:, etc.)
// - Case normalization
// - Synonym merging
// - Per-project tag type restrictions based on genre
// - Tag extraction, counting, and cross-referencing

import { getTagTypesForGenre, TAG_NAMESPACES } from './genreConfig';

/* =============================================================================
   TAG PATTERN & PARSING
============================================================================= */

/**
 * Universal regex pattern for all @namespace: tags
 * Matches: @namespace: value (until next @ or newline or HTML tag)
 */
const TAG_PATTERN = /@(\w+):\s*([A-Za-z][A-Za-z0-9\s,.'-]*?)(?=[@<\n]|$)/gi;

/**
 * Parse a single tag string into namespace and value
 * @param {string} tagString - e.g., "@char: John Smith"
 * @returns {{ namespace: string, value: string, normalized: string } | null}
 */
export function parseTag(tagString) {
  const match = tagString.match(/@(\w+):\s*(.+)/i);
  if (!match) return null;

  const namespace = match[1].toLowerCase();
  const value = match[2].trim();
  const normalized = normalizeTagValue(value);

  return { namespace, value, normalized };
}

/**
 * Extract all tags from content
 * @param {string} content - Text content to scan
 * @returns {Array<{ namespace: string, value: string, normalized: string, position: number }>}
 */
export function extractTags(content) {
  if (!content) return [];

  const tags = [];
  let match;

  // Reset regex state
  TAG_PATTERN.lastIndex = 0;

  while ((match = TAG_PATTERN.exec(content)) !== null) {
    const namespace = match[1].toLowerCase();
    const value = (match[2] || '').trim();

    if (value) {
      tags.push({
        namespace,
        value,
        normalized: normalizeTagValue(value),
        position: match.index,
      });
    }
  }

  return tags;
}

/**
 * Extract tags of a specific namespace
 * @param {string} content - Text content
 * @param {string} namespace - e.g., 'char', 'theme', 'ingredient'
 */
export function extractTagsByNamespace(content, namespace) {
  return extractTags(content).filter((t) => t.namespace === namespace.toLowerCase());
}

/**
 * Normalize a tag value (lowercase, trim, collapse spaces)
 */
export function normalizeTagValue(value) {
  if (!value) return '';
  return value.toLowerCase().trim().replace(/\s+/g, ' ');
}

/* =============================================================================
   TAG AGGREGATION ACROSS CHAPTERS
============================================================================= */

/**
 * Aggregate tags from multiple chapters
 * @param {Array} chapters - Array of chapter objects with content
 * @param {string} namespace - Optional: filter to specific namespace
 * @returns {Map<string, { name: string, count: number, chapters: Set<string> }>}
 */
export function aggregateTagsFromChapters(chapters, namespace = null) {
  const tagMap = new Map();

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const chapterTitle = chapter?.title || 'Untitled';

    let tags = extractTags(content);

    if (namespace) {
      tags = tags.filter((t) => t.namespace === namespace.toLowerCase());
    }

    tags.forEach((tag) => {
      const key = `${tag.namespace}:${tag.normalized}`;

      if (!tagMap.has(key)) {
        tagMap.set(key, {
          namespace: tag.namespace,
          name: tag.value, // Keep original casing for display
          normalized: tag.normalized,
          count: 0,
          chapters: new Set(),
        });
      }

      const entry = tagMap.get(key);
      entry.count++;
      entry.chapters.add(chapterTitle);
    });
  });

  return tagMap;
}

/**
 * Get tag statistics for chapters
 * @param {Array} chapters
 * @param {string} namespace
 */
export function getTagStats(chapters, namespace = null) {
  const tagMap = aggregateTagsFromChapters(chapters, namespace);

  const tags = Array.from(tagMap.values()).map((t) => ({
    ...t,
    chapters: Array.from(t.chapters),
  }));

  // Sort by count descending
  tags.sort((a, b) => b.count - a.count);

  return {
    tags,
    uniqueCount: tags.length,
    totalMentions: tags.reduce((sum, t) => sum + t.count, 0),
  };
}

/* =============================================================================
   SYNONYM / ALIAS MANAGEMENT
============================================================================= */

/**
 * Synonym registry - maps alternate names to canonical names
 * This can be extended per-project
 */
const defaultSynonyms = new Map([
  // Example: NYC variants
  ['nyc', 'new york city'],
  ['new york', 'new york city'],
  ['ny', 'new york city'],
  // Example: common abbreviations
  ['usa', 'united states'],
  ['us', 'united states'],
]);

/**
 * Resolve a tag value to its canonical form using synonyms
 */
export function resolveSynonym(value, customSynonyms = new Map()) {
  const normalized = normalizeTagValue(value);

  // Check custom synonyms first
  if (customSynonyms.has(normalized)) {
    return customSynonyms.get(normalized);
  }

  // Check default synonyms
  if (defaultSynonyms.has(normalized)) {
    return defaultSynonyms.get(normalized);
  }

  return normalized;
}

/**
 * Merge tags using synonym resolution
 */
export function mergeTagsBySynonym(tags, customSynonyms = new Map()) {
  const merged = new Map();

  tags.forEach((tag) => {
    const canonical = resolveSynonym(tag.normalized, customSynonyms);
    const key = `${tag.namespace}:${canonical}`;

    if (!merged.has(key)) {
      merged.set(key, {
        namespace: tag.namespace,
        name: tag.name,
        normalized: canonical,
        count: 0,
        chapters: new Set(),
        aliases: new Set(),
      });
    }

    const entry = merged.get(key);
    entry.count += tag.count || 1;

    if (tag.chapters) {
      if (tag.chapters instanceof Set) {
        tag.chapters.forEach((c) => entry.chapters.add(c));
      } else if (Array.isArray(tag.chapters)) {
        tag.chapters.forEach((c) => entry.chapters.add(c));
      }
    }

    // Track aliases
    if (tag.normalized !== canonical) {
      entry.aliases.add(tag.value);
    }
  });

  return Array.from(merged.values()).map((t) => ({
    ...t,
    chapters: Array.from(t.chapters),
    aliases: Array.from(t.aliases),
  }));
}

/* =============================================================================
   GENRE-BASED TAG VALIDATION
============================================================================= */

/**
 * Check if a tag namespace is allowed for a genre
 */
export function isTagAllowedForGenre(namespace, genre) {
  const allowedTypes = getTagTypesForGenre(genre);
  return allowedTypes.includes(namespace.toLowerCase());
}

/**
 * Filter tags to only those allowed for a genre
 */
export function filterTagsByGenre(tags, genre) {
  const allowedTypes = getTagTypesForGenre(genre);
  return tags.filter((tag) => allowedTypes.includes(tag.namespace));
}

/**
 * Get allowed tag prefixes for a genre (for UI hints)
 */
export function getAllowedTagPrefixes(genre) {
  const allowedTypes = getTagTypesForGenre(genre);
  return allowedTypes.map((ns) => `@${ns}:`);
}

/* =============================================================================
   TAG INSERTION HELPERS
============================================================================= */

/**
 * Create a tag string from namespace and value
 */
export function createTag(namespace, value) {
  return `@${namespace}: ${value}`;
}

/**
 * Insert a tag into content at cursor position
 * @param {string} content - Original content
 * @param {number} position - Cursor position
 * @param {string} namespace - Tag namespace
 * @param {string} value - Tag value
 */
export function insertTag(content, position, namespace, value) {
  const tag = createTag(namespace, value);
  return content.slice(0, position) + tag + ' ' + content.slice(position);
}

/**
 * Find and replace a tag in content
 */
export function replaceTag(content, oldTag, newNamespace, newValue) {
  const newTag = createTag(newNamespace, newValue);
  return content.replace(oldTag, newTag);
}

/**
 * Remove a tag from content
 */
export function removeTag(content, tagToRemove) {
  // Escape special regex characters in the tag
  const escaped = tagToRemove.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(escaped + '\\s*', 'gi');
  return content.replace(pattern, '');
}

/* =============================================================================
   TAG TYPE METADATA
============================================================================= */

/**
 * Get display info for a tag namespace
 */
export function getTagTypeInfo(namespace) {
  const info = {
    [TAG_NAMESPACES.CHAR]: {
      label: 'Character',
      plural: 'Characters',
      icon: 'Users',
      color: '#d4af37', // gold
      description: 'Fictional characters in your story',
    },
    [TAG_NAMESPACES.PERSON]: {
      label: 'Person',
      plural: 'People',
      icon: 'User',
      color: '#d4af37',
      description: 'Real people in memoir/biography',
    },
    [TAG_NAMESPACES.THEME]: {
      label: 'Theme',
      plural: 'Themes',
      icon: 'Lightbulb',
      color: '#b8a9c9', // mauve
      description: 'Themes and concepts',
    },
    [TAG_NAMESPACES.INGREDIENT]: {
      label: 'Ingredient',
      plural: 'Ingredients',
      icon: 'Apple',
      color: '#f97316', // orange
      description: 'Recipe ingredients',
    },
    [TAG_NAMESPACES.EQUIPMENT]: {
      label: 'Equipment',
      plural: 'Equipment',
      icon: 'Utensils',
      color: '#f97316',
      description: 'Cooking equipment',
    },
    [TAG_NAMESPACES.PLACE]: {
      label: 'Place',
      plural: 'Places',
      icon: 'MapPin',
      color: '#3b82f6', // blue
      description: 'Locations and settings',
    },
    [TAG_NAMESPACES.ORG]: {
      label: 'Organization',
      plural: 'Organizations',
      icon: 'Building',
      color: '#6366f1', // indigo
      description: 'Companies, groups, institutions',
    },
    [TAG_NAMESPACES.EVENT]: {
      label: 'Event',
      plural: 'Events',
      icon: 'Calendar',
      color: '#8b5cf6', // purple
      description: 'Timeline events',
    },
    [TAG_NAMESPACES.DATE]: {
      label: 'Date',
      plural: 'Dates',
      icon: 'Clock',
      color: '#8b5cf6',
      description: 'Dates and time periods',
    },
    [TAG_NAMESPACES.TERM]: {
      label: 'Term',
      plural: 'Terms',
      icon: 'Book',
      color: '#0d9488', // teal
      description: 'Key terms and glossary',
    },
    [TAG_NAMESPACES.OBJECTIVE]: {
      label: 'Objective',
      plural: 'Objectives',
      icon: 'Target',
      color: '#0d9488',
      description: 'Learning objectives',
    },
    [TAG_NAMESPACES.PROMPT]: {
      label: 'Prompt',
      plural: 'Prompts',
      icon: 'HelpCircle',
      color: '#0d9488',
      description: 'Reflection prompts',
    },
    [TAG_NAMESPACES.STAGE]: {
      label: 'Stage',
      plural: 'Stages',
      icon: 'Flag',
      color: '#ec4899', // pink
      description: 'Story or argument stages',
    },
  };

  return info[namespace] || {
    label: namespace,
    plural: `${namespace}s`,
    icon: 'Tag',
    color: '#64748b',
    description: 'Custom tag',
  };
}

/* =============================================================================
   CROSS-REFERENCE ANALYSIS
============================================================================= */

/**
 * Find which tags appear together frequently
 */
export function findTagCooccurrence(chapters, namespace1, namespace2) {
  const cooccurrence = new Map();

  chapters.forEach((chapter) => {
    const tags1 = extractTagsByNamespace(chapter.content || '', namespace1);
    const tags2 = extractTagsByNamespace(chapter.content || '', namespace2);

    tags1.forEach((t1) => {
      tags2.forEach((t2) => {
        const key = `${t1.normalized}|${t2.normalized}`;
        cooccurrence.set(key, (cooccurrence.get(key) || 0) + 1);
      });
    });
  });

  return Array.from(cooccurrence.entries())
    .map(([key, count]) => {
      const [tag1, tag2] = key.split('|');
      return { tag1, tag2, count };
    })
    .sort((a, b) => b.count - a.count);
}

/**
 * Find which chapters share the most tags
 */
export function findChapterSimilarity(chapters, namespace = null) {
  const similarities = [];

  for (let i = 0; i < chapters.length; i++) {
    for (let j = i + 1; j < chapters.length; j++) {
      const tags1 = new Set(
        extractTags(chapters[i].content || '')
          .filter((t) => !namespace || t.namespace === namespace)
          .map((t) => t.normalized)
      );

      const tags2 = new Set(
        extractTags(chapters[j].content || '')
          .filter((t) => !namespace || t.namespace === namespace)
          .map((t) => t.normalized)
      );

      // Jaccard similarity
      const intersection = new Set([...tags1].filter((x) => tags2.has(x)));
      const union = new Set([...tags1, ...tags2]);
      const similarity = union.size > 0 ? intersection.size / union.size : 0;

      if (similarity > 0) {
        similarities.push({
          chapter1: chapters[i].title || 'Untitled',
          chapter2: chapters[j].title || 'Untitled',
          sharedTags: Array.from(intersection),
          similarity,
        });
      }
    }
  }

  return similarities.sort((a, b) => b.similarity - a.similarity);
}

/* =============================================================================
   EXPORTS
============================================================================= */

export default {
  // Parsing
  parseTag,
  extractTags,
  extractTagsByNamespace,
  normalizeTagValue,

  // Aggregation
  aggregateTagsFromChapters,
  getTagStats,

  // Synonyms
  resolveSynonym,
  mergeTagsBySynonym,

  // Validation
  isTagAllowedForGenre,
  filterTagsByGenre,
  getAllowedTagPrefixes,

  // Manipulation
  createTag,
  insertTag,
  replaceTag,
  removeTag,

  // Metadata
  getTagTypeInfo,

  // Analysis
  findTagCooccurrence,
  findChapterSimilarity,
};
