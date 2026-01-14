// src/components/Writing/SidebarRouter.jsx
// Routes to the correct sidebar component based on project genre
// This is the main integration point for genre-aware sidebars

import React from 'react';
import {
  getGenreCategory,
  getConfigForGenre,
  GENRE_CATEGORIES,
} from '../../lib/genreConfig';

// Import all sidebar components
import ThemeSidebar from './ThemeSidebar';
import RecipeSidebar from './RecipeSidebar';
import HybridSidebar from './HybridSidebar';
import ReferenceSidebar from './ReferenceSidebar';
import CollectionSidebar from './CollectionSidebar';
import GeneralSidebar from './GeneralSidebar';

/**
 * SidebarRouter - Renders the appropriate sidebar based on genre category
 * 
 * @param {string} genre - The project's primary genre
 * @param {Array} chapters - Array of chapter objects
 * @param {string} projectId - Current project ID
 * @param {string} projectTitle - Current project title
 * @param {number} wordCount - Total word count
 * @param {number} targetWords - Target word count
 * @param {Function} onRefresh - Callback to refresh/rescan content
 * @param {Function} onSelectChapter - Callback when a chapter is selected
 * @param {Function} onAddTag - Callback to add a tag: (namespace, value) => void
 * @param {boolean} hasAnyChapters - Whether any chapters exist
 * @param {boolean} renderCharacterSidebar - If true, returns null for CHARACTER genre (let parent handle)
 */
export default function SidebarRouter({
  genre,
  chapters = [],
  projectId,
  projectTitle = '',
  wordCount = 0,
  targetWords = 50000,
  onRefresh,
  onSelectChapter,
  onAddTag,
  hasAnyChapters = false,
  renderCharacterSidebar = false,
  // Character-specific props (passed through if CHARACTER genre)
  characterCount,
  characters,
  onCharacterRefresh,
  CharacterSidebarComponent,
}) {
  // Get the genre category
  const category = getGenreCategory(genre);
  const config = getConfigForGenre(genre);

  // Common props for all sidebars
  const commonProps = {
    chapters,
    onRefresh,
    hasAnyChapters,
  };

  // Route to the appropriate sidebar
  switch (category) {
    case GENRE_CATEGORIES.CHARACTER:
      // For fiction genres - either render CharacterSidebar or return null
      if (renderCharacterSidebar && CharacterSidebarComponent) {
        return (
          <CharacterSidebarComponent
            chapters={chapters}
            characterCount={characterCount}
            characters={characters}
            onRefresh={onCharacterRefresh || onRefresh}
            hasAnyChapters={hasAnyChapters}
          />
        );
      }
      // Return null to let parent component render existing CharacterSidebar
      return null;

    case GENRE_CATEGORIES.THEME:
      return (
        <ThemeSidebar
          {...commonProps}
          onAddThemeTag={(theme) => onAddTag?.('theme', theme)}
        />
      );

    case GENRE_CATEGORIES.RECIPE:
      return (
        <RecipeSidebar
          {...commonProps}
          onAddIngredientTag={(ingredient) => onAddTag?.('ingredient', ingredient)}
        />
      );

    case GENRE_CATEGORIES.HYBRID:
      return (
        <HybridSidebar
          {...commonProps}
          onAddPersonTag={(person) => onAddTag?.('person', person)}
          onAddThemeTag={(theme) => onAddTag?.('theme', theme)}
        />
      );

    case GENRE_CATEGORIES.REFERENCE:
      return (
        <ReferenceSidebar
          {...commonProps}
          onAddTermTag={(term) => onAddTag?.('term', term)}
        />
      );

    case GENRE_CATEGORIES.COLLECTION:
      return (
        <CollectionSidebar
          {...commonProps}
          onSelectPiece={onSelectChapter}
        />
      );

    case GENRE_CATEGORIES.GENERAL:
    default:
      return (
        <GeneralSidebar
          {...commonProps}
          projectId={projectId}
          projectTitle={projectTitle}
          wordCount={wordCount}
          targetWords={targetWords}
        />
      );
  }
}

/**
 * Hook to get genre-aware display values
 */
export function useGenreConfig(genre) {
  const category = getGenreCategory(genre);
  const config = getConfigForGenre(genre);

  return {
    category,
    config,
    chapterLabel: config.chapterLabel,
    chapterLabelPlural: config.chapterLabelPlural,
    primaryStatLabel: config.stats.primary.label,
    tagPrefix: `@${config.primaryTag}:`,
    isCharacterBased: category === GENRE_CATEGORIES.CHARACTER,
    isThemeBased: category === GENRE_CATEGORIES.THEME,
    isRecipeBased: category === GENRE_CATEGORIES.RECIPE,
    isHybrid: category === GENRE_CATEGORIES.HYBRID,
    isReference: category === GENRE_CATEGORIES.REFERENCE,
    isCollection: category === GENRE_CATEGORIES.COLLECTION,
  };
}

