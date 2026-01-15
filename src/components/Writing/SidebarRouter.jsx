// src/components/Writing/SidebarRouter.jsx
// Routes to the correct sidebar component based on project genre
// This is the main integration point for genre-aware sidebars

import React from "react";
import {
  getGenreCategory,
  getConfigForGenre,
  GENRE_CATEGORIES,
} from "../../lib/genreConfig";

// Import sidebar components that exist
import ThemeSidebar from "./ThemeSidebar";
import RecipeSidebar from "./RecipeSidebar";
import HybridSidebar from "./HybridSidebar";

// These may or may not exist yet in your repo.
// If any of these imports error, comment that import out and the fallback logic below will still work.
import ReferenceSidebar from "./ReferenceSidebar";
import CollectionSidebar from "./CollectionSidebar";
import GeneralSidebar from "./GeneralSidebar";

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
 *
 * Character-specific passthrough (optional):
 * @param {number} characterCount
 * @param {string[]} characters
 * @param {Function} onCharacterRefresh
 * @param {React.ComponentType} CharacterSidebarComponent
 */
export default function SidebarRouter({
  genre,
  chapters = [],
  projectId,
  projectTitle = "",
  wordCount = 0,
  targetWords = 50000,
  onRefresh,
  onSelectChapter,
  onAddTag,
  hasAnyChapters = false,

  // Character-specific props (optional)
  characterCount,
  characters,
  onCharacterRefresh,
  CharacterSidebarComponent,
}) {
  const category = getGenreCategory(genre);
  // config is available if you want it later for labels/features, etc.
  // const config = getConfigForGenre(genre);
  getConfigForGenre(genre); // keeps behavior consistent even if you later use it

  const commonProps = {
    chapters,
    onRefresh,
    hasAnyChapters,
  };

  const renderGeneralFallback = () => {
    // If GeneralSidebar exists, use it; otherwise render nothing safely.
    if (GeneralSidebar) {
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
    return null;
  };

  switch (category) {
    case GENRE_CATEGORIES.CHARACTER: {
      // Fiction: never return null — StoryLab should always show something.
      // If you have a full CharacterSidebar component, render it.
      if (CharacterSidebarComponent) {
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

      // Otherwise, show a safe fallback panel so the area doesn't disappear.
      return renderGeneralFallback();
    }

    case GENRE_CATEGORIES.THEME:
      return (
        <ThemeSidebar
          {...commonProps}
          onAddThemeTag={(theme) => onAddTag?.("theme", theme)}
        />
      );

    case GENRE_CATEGORIES.RECIPE:
      return (
        <RecipeSidebar
          {...commonProps}
          onAddIngredientTag={(ingredient) =>
            onAddTag?.("ingredient", ingredient)
          }
        />
      );

    case GENRE_CATEGORIES.HYBRID:
      return (
        <HybridSidebar
          {...commonProps}
          onAddPersonTag={(person) => onAddTag?.("person", person)}
          onAddThemeTag={(theme) => onAddTag?.("theme", theme)}
        />
      );

    case GENRE_CATEGORIES.REFERENCE: {
      // If ReferenceSidebar doesn't exist yet, fall back safely.
      if (ReferenceSidebar) {
        return (
          <ReferenceSidebar
            {...commonProps}
            onAddTermTag={(term) => onAddTag?.("term", term)}
          />
        );
      }
      return renderGeneralFallback();
    }

    case GENRE_CATEGORIES.COLLECTION: {
      // If CollectionSidebar doesn't exist yet, fall back safely.
      if (CollectionSidebar) {
        return (
          <CollectionSidebar {...commonProps} onSelectPiece={onSelectChapter} />
        );
      }
      return renderGeneralFallback();
    }

    case GENRE_CATEGORIES.GENERAL:
    default:
      return renderGeneralFallback();
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
    primaryStatLabel: config.stats?.primary?.label,
    tagPrefix: `@${config.primaryTag}:`,
    isCharacterBased: category === GENRE_CATEGORIES.CHARACTER,
    isThemeBased: category === GENRE_CATEGORIES.THEME,
    isRecipeBased: category === GENRE_CATEGORIES.RECIPE,
    isHybrid: category === GENRE_CATEGORIES.HYBRID,
    isReference: category === GENRE_CATEGORIES.REFERENCE,
    isCollection: category === GENRE_CATEGORIES.COLLECTION,
  };
}
