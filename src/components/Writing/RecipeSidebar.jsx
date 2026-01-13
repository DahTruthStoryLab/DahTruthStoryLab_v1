// src/components/Writing/RecipeSidebar.jsx
// Recipe tracking sidebar for cookbooks and recipe collections
// Replaces CharacterSidebar when genre is recipe-based

import React, { useState, useMemo } from 'react';
import {
  ChefHat,
  Clock,
  Users,
  Flame,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  UtensilsCrossed,
  Scale,
  ListChecks,
  Plus,
  Apple,
} from 'lucide-react';

// Brand colors
const BRAND = {
  navy: '#1e3a5f',
  gold: '#d4af37',
  mauve: '#b8a9c9',
  orange: '#f97316',
};

/* =============================================================================
   INGREDIENT EXTRACTION
============================================================================= */

/**
 * Extract @ingredient: tags from chapters
 */
export function extractIngredientsFromChapters(chapters = []) {
  const ingredientMap = new Map(); // ingredient -> { count, recipes }

  const tagPattern = /@ingredient:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;

  chapters.forEach((chapter) => {
    const content = chapter?.content || '';
    const recipeName = chapter?.title || 'Untitled Recipe';
    let match;

    while ((match = tagPattern.exec(content)) !== null) {
      const ingredient = (match[1] || '').trim().toLowerCase();
      if (!ingredient) continue;

      if (!ingredientMap.has(ingredient)) {
        ingredientMap.set(ingredient, {
          name: ingredient,
          count: 0,
          recipes: new Set(),
        });
      }

      const entry = ingredientMap.get(ingredient);
      entry.count++;
      entry.recipes.add(recipeName);
    }
  });

  // Convert to array
  const ingredients = Array.from(ingredientMap.values()).map((i) => ({
    ...i,
    recipes: Array.from(i.recipes),
  }));

  // Sort by count
  ingredients.sort((a, b) => b.count - a.count);

  return ingredients;
}

/**
 * Count total ingredients
 */
export function computeIngredientsFromChapters(chapters = []) {
  const ingredients = extractIngredientsFromChapters(chapters);
  return {
    ingredients: ingredients.map((i) => i.name),
    ingredientCount: ingredients.length,
    ingredientDetails: ingredients,
  };
}

/* =============================================================================
   RECIPE METADATA EXTRACTION
============================================================================= */

/**
 * Extract recipe metadata from chapter content
 * Looks for patterns like:
 * - Prep Time: 15 minutes
 * - Cook Time: 30 minutes
 * - Servings: 4
 * - Difficulty: Easy
 */
export function extractRecipeMetadata(content = '') {
  const metadata = {
    prepTime: null,
    cookTime: null,
    totalTime: null,
    servings: null,
    difficulty: null,
    cuisine: null,
    course: null,
  };

  // Prep time
  const prepMatch = content.match(/prep(?:\s*time)?[:\s]+(\d+)\s*(min|minute|hour|hr)/i);
  if (prepMatch) {
    metadata.prepTime = `${prepMatch[1]} ${prepMatch[2]}`;
  }

  // Cook time
  const cookMatch = content.match(/cook(?:\s*time)?[:\s]+(\d+)\s*(min|minute|hour|hr)/i);
  if (cookMatch) {
    metadata.cookTime = `${cookMatch[1]} ${cookMatch[2]}`;
  }

  // Total time
  const totalMatch = content.match(/total(?:\s*time)?[:\s]+(\d+)\s*(min|minute|hour|hr)/i);
  if (totalMatch) {
    metadata.totalTime = `${totalMatch[1]} ${totalMatch[2]}`;
  }

  // Servings
  const servingsMatch = content.match(/serv(?:ing|es)?[:\s]+(\d+)/i);
  if (servingsMatch) {
    metadata.servings = parseInt(servingsMatch[1]);
  }

  // Difficulty
  const difficultyMatch = content.match(/difficulty[:\s]+(easy|medium|hard|beginner|intermediate|advanced)/i);
  if (difficultyMatch) {
    metadata.difficulty = difficultyMatch[1];
  }

  // Cuisine
  const cuisineMatch = content.match(/cuisine[:\s]+([A-Za-z\s]+?)(?:\n|$)/i);
  if (cuisineMatch) {
    metadata.cuisine = cuisineMatch[1].trim();
  }

  // Course
  const courseMatch = content.match(/course[:\s]+(appetizer|main|dessert|breakfast|lunch|dinner|snack|side|beverage)/i);
  if (courseMatch) {
    metadata.course = courseMatch[1];
  }

  return metadata;
}

/**
 * Detect ingredients using common patterns
 */
export function detectPotentialIngredients(chapters = []) {
  const candidates = new Map();
  
  // Common ingredients to look for
  const commonIngredients = [
    'salt', 'pepper', 'sugar', 'flour', 'butter', 'oil', 'olive oil',
    'garlic', 'onion', 'tomato', 'chicken', 'beef', 'pork', 'fish',
    'egg', 'milk', 'cream', 'cheese', 'rice', 'pasta', 'bread',
    'lemon', 'lime', 'vinegar', 'soy sauce', 'honey', 'vanilla',
    'cinnamon', 'cumin', 'paprika', 'oregano', 'basil', 'thyme',
    'parsley', 'cilantro', 'ginger', 'turmeric', 'chili', 'carrot',
    'celery', 'potato', 'broccoli', 'spinach', 'mushroom', 'bell pepper',
  ];

  // Get already tagged ingredients
  const existingIngredients = new Set();
  const tagPattern = /@ingredient:\s*([A-Za-z][A-Za-z0-9\s,'-]*?)(?=[@<\n]|$)/gi;
  chapters.forEach((ch) => {
    let match;
    while ((match = tagPattern.exec(ch?.content || '')) !== null) {
      existingIngredients.add((match[1] || '').trim().toLowerCase());
    }
  });

  chapters.forEach((chapter) => {
    const content = (chapter?.content || '').toLowerCase();
    const recipeName = chapter?.title || 'Untitled';

    commonIngredients.forEach((ingredient) => {
      if (existingIngredients.has(ingredient)) return;
      
      // Count occurrences
      const regex = new RegExp(`\\b${ingredient}s?\\b`, 'gi');
      const matches = content.match(regex);
      
      if (matches && matches.length > 0) {
        if (!candidates.has(ingredient)) {
          candidates.set(ingredient, {
            name: ingredient,
            count: 0,
            recipes: new Set(),
          });
        }
        candidates.get(ingredient).count += matches.length;
        candidates.get(ingredient).recipes.add(recipeName);
      }
    });
  });

  // Convert and sort
  const results = Array.from(candidates.values())
    .map((c) => ({
      ...c,
      recipes: Array.from(c.recipes),
    }))
    .sort((a, b) => b.count - a.count);

  return results.slice(0, 30);
}

/* =============================================================================
   RECIPE SIDEBAR COMPONENT
============================================================================= */

export default function RecipeSidebar({
  chapters = [],
  onRefresh,
  onAddIngredientTag,
  hasAnyChapters = false,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDetected, setShowDetected] = useState(false);
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'recipes'

  // Extract tagged ingredients
  const { ingredients, ingredientCount, ingredientDetails } = useMemo(
    () => computeIngredientsFromChapters(chapters),
    [chapters]
  );

  // Detect potential ingredients
  const detectedIngredients = useMemo(
    () => detectPotentialIngredients(chapters),
    [chapters]
  );

  // Extract recipe metadata for each chapter
  const recipesWithMetadata = useMemo(() => {
    return chapters.map((ch) => ({
      id: ch.id,
      title: ch.title || 'Untitled Recipe',
      metadata: extractRecipeMetadata(ch.content || ''),
    }));
  }, [chapters]);

  const handleAddIngredient = (ingredientName) => {
    if (onAddIngredientTag && ingredientName) {
      onAddIngredientTag(ingredientName);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${BRAND.orange}20` }}
          >
            <ChefHat size={16} style={{ color: BRAND.orange }} />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold" style={{ color: BRAND.navy }}>
              Recipe Tools
            </div>
            <div className="text-xs text-slate-500">
              {chapters.length} recipes • {ingredientCount} ingredients
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronDown size={16} className="text-slate-400" />
        ) : (
          <ChevronRight size={16} className="text-slate-400" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Tab Switcher */}
          <div className="flex gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'ingredients'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Ingredients
            </button>
            <button
              onClick={() => setActiveTab('recipes')}
              className={`flex-1 text-[11px] py-1.5 rounded-md font-medium transition-colors ${
                activeTab === 'recipes'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Recipes
            </button>
          </div>

          {/* Ingredients Tab */}
          {activeTab === 'ingredients' && (
            <>
              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={onRefresh}
                  disabled={!hasAnyChapters}
                  className="text-[11px] px-2 py-1 rounded border bg-white border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1"
                >
                  <RefreshCw size={12} />
                  Scan
                </button>
                <button
                  onClick={() => setShowDetected(!showDetected)}
                  className={`text-[11px] px-2 py-1 rounded border flex items-center gap-1 ${
                    showDetected
                      ? 'bg-orange-50 border-orange-200 text-orange-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Apple size={12} />
                  {showDetected ? 'Hide' : 'Show'} Suggestions
                </button>
              </div>

              {/* Tagged Ingredients */}
              {ingredientCount === 0 ? (
                <div className="text-center py-4">
                  <UtensilsCrossed size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500 mb-2">
                    No ingredients tagged yet.
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Tag ingredients as{' '}
                    <code className="bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                      @ingredient: garlic
                    </code>
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {ingredientDetails.map((ing) => (
                    <div
                      key={ing.name}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Apple size={14} style={{ color: BRAND.orange }} />
                        <span className="text-xs font-medium capitalize truncate" style={{ color: BRAND.navy }}>
                          {ing.name}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {ing.recipes.length} recipe{ing.recipes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Detected Ingredients */}
              {showDetected && detectedIngredients.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-600 mb-2">
                    Suggested Ingredients
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {detectedIngredients.slice(0, 15).map((ing) => (
                      <button
                        key={ing.name}
                        onClick={() => handleAddIngredient(ing.name)}
                        className="text-[10px] px-2 py-1 rounded-full border border-dashed border-slate-200 hover:border-orange-300 hover:bg-orange-50 capitalize transition-colors"
                      >
                        + {ing.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Recipes Tab */}
          {activeTab === 'recipes' && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recipesWithMetadata.length === 0 ? (
                <div className="text-center py-4">
                  <ListChecks size={24} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-xs text-slate-500">
                    No recipes yet. Each chapter = one recipe.
                  </p>
                </div>
              ) : (
                recipesWithMetadata.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="p-3 rounded-lg border border-slate-200 hover:border-orange-200 transition-colors"
                  >
                    <div className="font-medium text-xs mb-2" style={{ color: BRAND.navy }}>
                      {recipe.title}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                      {recipe.metadata.prepTime && (
                        <span className="flex items-center gap-1">
                          <Clock size={10} />
                          Prep: {recipe.metadata.prepTime}
                        </span>
                      )}
                      {recipe.metadata.cookTime && (
                        <span className="flex items-center gap-1">
                          <Flame size={10} />
                          Cook: {recipe.metadata.cookTime}
                        </span>
                      )}
                      {recipe.metadata.servings && (
                        <span className="flex items-center gap-1">
                          <Users size={10} />
                          Serves: {recipe.metadata.servings}
                        </span>
                      )}
                      {recipe.metadata.difficulty && (
                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-100">
                          {recipe.metadata.difficulty}
                        </span>
                      )}
                    </div>
                    {!recipe.metadata.prepTime && !recipe.metadata.cookTime && (
                      <p className="text-[10px] text-slate-400 italic">
                        Add "Prep Time: X min" to your recipe
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* Shopping List Preview */}
          {ingredientCount > 0 && activeTab === 'ingredients' && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center gap-1">
                <Scale size={12} />
                Quick Stats
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-semibold text-slate-700">{chapters.length}</div>
                  <div className="text-slate-500">Recipes</div>
                </div>
                <div className="p-2 bg-slate-50 rounded">
                  <div className="font-semibold text-slate-700">{ingredientCount}</div>
                  <div className="text-slate-500">Ingredients</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =============================================================================
   RECIPE CARD COMPONENT
   Display a single recipe in a structured format
============================================================================= */

export function RecipeCard({ title, content, metadata }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3"
        style={{ background: `linear-gradient(135deg, ${BRAND.orange}15, ${BRAND.gold}10)` }}
      >
        <h3 className="font-semibold text-base" style={{ color: BRAND.navy }}>
          {title}
        </h3>
        {metadata?.cuisine && (
          <span className="text-xs text-slate-500">{metadata.cuisine} Cuisine</span>
        )}
      </div>

      {/* Quick Info */}
      <div className="px-4 py-2 bg-slate-50 flex items-center gap-4 text-xs text-slate-600 border-b border-slate-100">
        {metadata?.prepTime && (
          <span className="flex items-center gap-1">
            <Clock size={12} />
            Prep: {metadata.prepTime}
          </span>
        )}
        {metadata?.cookTime && (
          <span className="flex items-center gap-1">
            <Flame size={12} />
            Cook: {metadata.cookTime}
          </span>
        )}
        {metadata?.servings && (
          <span className="flex items-center gap-1">
            <Users size={12} />
            Serves {metadata.servings}
          </span>
        )}
        {metadata?.difficulty && (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
              metadata.difficulty.toLowerCase() === 'easy'
                ? 'bg-green-100 text-green-700'
                : metadata.difficulty.toLowerCase() === 'hard'
                ? 'bg-red-100 text-red-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}
          >
            {metadata.difficulty}
          </span>
        )}
      </div>

      {/* Content Preview */}
      <div className="px-4 py-3">
        <div
          className="text-sm text-slate-700 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: content?.slice(0, 300) || '' }}
        />
      </div>
    </div>
  );
}

