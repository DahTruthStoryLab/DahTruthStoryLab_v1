// src/components/Writing/SidebarRouter.jsx
// Routes to the correct sidebar component based on project genre
// This is the main integration point for genre-aware sidebars

import React from "react";
import {
  getGenreCategory,
  getConfigForGenre,
  GENRE_CATEGORIES,
} from "../../lib/genreConfig";

// Import all sidebar components
import ThemeSidebar from "./ThemeSidebar";
import RecipeSidebar from "./RecipeSidebar";
import HybridSidebar from "./HybridSidebar";
import ReferenceSidebar from "./ReferenceSidebar";
import CollectionSidebar from "./CollectionSidebar";
import GeneralSidebar from "./GeneralSidebar";

/**
 * SidebarRouter - Renders the appropriate sidebar based on genre category
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

  // Character-specific pass-through
  characterCount = 0,
  characters = [],
  onCharacterRefresh,
  CharacterSidebarComponent,
}) {
  // Derive category/config
  const category = getGenreCategory(genre);
  const config = getConfigForGenre(genre);

  // Common props shared across sidebars
  const commonProps = {
    chapters,
    onRefresh,
    hasAnyChapters,
  };

  switch (category) {
    case GENRE_CATEGORIES.CHARACTER: {
      // If you have a CharacterSidebar implementation, render it
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

      // Safe fallback so StoryLab doesn't disappear for fiction projects
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
          onAddIngredientTag={(ingredient) => onAddTag?.("ingredient", ingredient)}
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

    case GENRE_CATEGORIES.REFERENCE:
      return (
        <ReferenceSidebar
          {...commonProps}
          onAddTermTag={(term) => onAddTag?.("term", term)}
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
    primaryStatLabel: config.stats?.primary?.label || "Chapters",
    tagPrefix: `@${config.primaryTag}:`,
    isCharacterBased: category === GENRE_CATEGORIES.CHARACTER,
    isThemeBased: category === GENRE_CATEGORIES.THEME,
    isRecipeBased: category === GENRE_CATEGORIES.RECIPE,
    isHybrid: category === GENRE_CATEGORIES.HYBRID,
    isReference: category === GENRE_CATEGORIES.REFERENCE,
    isCollection: category === GENRE_CATEGORIES.COLLECTION,
  };
}
