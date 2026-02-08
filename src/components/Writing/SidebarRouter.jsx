// src/components/Writing/SidebarRouter.jsx
// Routes to the correct sidebar component based on project genre
// Main integration point for genre-aware sidebars

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
  const config = getConfigForGenre(genre); // (kept in case you use config soon)

  // Common props shared across sidebars
  const commonProps = {
    chapters,
    onRefresh,
    hasAnyChapters,
  };

  // ✅ Helper: fiction-style sidebar behavior (your existing CHARACTER case)
  const renderFiction = () => {
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
  };

  switch (category) {
    // ✅ NEW: macro buckets
    case GENRE_CATEGORIES.FICTION:
      return renderFiction();

    case GENRE_CATEGORIES.NONFICTION:
      return (
        <ThemeSidebar
          {...commonProps}
          onAddThemeTag={(theme) => onAddTag?.("theme", theme)}
        />
      );

    case GENRE_CATEGORIES.POETRY:
      return (
        <CollectionSidebar
          {...commonProps}
          onSelectPiece={onSelectChapter}
        />
      );

    // Existing detailed.Trigger buckets still supported
    case GENRE_CATEGORIES.CHARACTER:
      return renderFiction();

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

    case GENRE_CATEGORIES.REFERENCE:
      return (
        <ReferenceSidebar
          {...commonProps}
          onAddTermTag={(term) => onAddTag?.("term", term)}
        />
      );

    case GENRE_CATEGORIES.COLLECTION:
      return (
        <CollectionSidebar {...commonProps} onSelectPiece={onSelectChapter} />
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

    // ✅ Macro-aware flags
    isCharacterBased:
      category === GENRE_CATEGORIES.CHARACTER || category === GENRE_CATEGORIES.FICTION,
    isThemeBased:
      category === GENRE_CATEGORIES.THEME || category === GENRE_CATEGORIES.NONFICTION,
    isRecipeBased: category === GENRE_CATEGORIES.RECIPE,
    isHybrid: category === GENRE_CATEGORIES.HYBRID,
    isReference: category === GENRE_CATEGORIES.REFERENCE,
    isCollection:
      category === GENRE_CATEGORIES.COLLECTION || category === GENRE_CATEGORIES.POETRY,
  };
}
