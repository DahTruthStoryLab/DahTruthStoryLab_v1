// src/lib/storylab/projectAwareStorage.js
// Utility for project-specific localStorage keys in StoryLab modules

/**
 * This utility ensures that each StoryLab module stores data
 * separately for each project/manuscript. When you switch projects,
 * the modules will load the correct data for that project.
 */

// Base storage keys (these get suffixed with projectId)
const STORAGE_KEYS = {
  CHARACTER_ROADMAP: 'dahtruth-character-roadmap',
  PRIORITY_CARDS: 'dahtruth-priority-cards',
  CLOTHESLINE: 'dahtruth-clothesline',
  STORY_LAB_TOC: 'dahtruth-story-lab-toc-v3',
  WORKSHOP_COHORT: 'dahtruth-workshop-cohort',
};

// Key for tracking the currently selected project
const SELECTED_PROJECT_KEY = 'dahtruth-selected-project-id';

/**
 * Get the currently selected project ID
 * Falls back to 'default' if no project is selected
 */
export function getSelectedProjectId() {
  try {
    // First check if there's a selected project ID stored
    const stored = localStorage.getItem(SELECTED_PROJECT_KEY);
    if (stored) return stored;
    
    // Fallback: try to get from project store
    const projectData = localStorage.getItem('dahtruth-project-store');
    if (projectData) {
      const parsed = JSON.parse(projectData);
      return parsed.selectedProjectId || parsed.currentProjectId || 'default';
    }
    
    return 'default';
  } catch (err) {
    console.error('[projectAwareStorage] Failed to get project ID:', err);
    return 'default';
  }
}

/**
 * Set the currently selected project ID
 */
export function setSelectedProjectId(projectId) {
  try {
    localStorage.setItem(SELECTED_PROJECT_KEY, projectId);
    // Dispatch event so all modules know to reload
    window.dispatchEvent(new CustomEvent('project:switch', { detail: { projectId } }));
    window.dispatchEvent(new Event('project:change'));
  } catch (err) {
    console.error('[projectAwareStorage] Failed to set project ID:', err);
  }
}

/**
 * Get a project-specific storage key
 * @param {string} baseKey - The base key (e.g., 'dahtruth-character-roadmap')
 * @param {string} [projectId] - Optional project ID (uses current if not provided)
 * @returns {string} The project-specific key
 */
export function getProjectKey(baseKey, projectId = null) {
  const pid = projectId || getSelectedProjectId();
  // Don't add suffix if it's the default project (for backwards compatibility)
  if (pid === 'default') {
    return baseKey;
  }
  return `${baseKey}-${pid}`;
}

/**
 * Load data from project-specific storage
 * @param {string} baseKey - The base storage key
 * @param {*} defaultValue - Default value if nothing is stored
 * @returns {*} The parsed data or default value
 */
export function loadProjectData(baseKey, defaultValue = null) {
  try {
    const key = getProjectKey(baseKey);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`[projectAwareStorage] Failed to load ${baseKey}:`, err);
  }
  return defaultValue;
}

/**
 * Save data to project-specific storage
 * @param {string} baseKey - The base storage key
 * @param {*} data - The data to save
 */
export function saveProjectData(baseKey, data) {
  try {
    const key = getProjectKey(baseKey);
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('project:change'));
  } catch (err) {
    console.error(`[projectAwareStorage] Failed to save ${baseKey}:`, err);
  }
}

/**
 * Create a React hook factory for project-aware storage
 * This helps components automatically reload when projects change
 */
export function createProjectAwareLoader(baseKey, defaultValue) {
  return {
    load: () => loadProjectData(baseKey, defaultValue),
    save: (data) => saveProjectData(baseKey, data),
    getKey: () => getProjectKey(baseKey),
    baseKey,
  };
}

// Pre-configured loaders for each module
export const CharacterRoadmapStorage = createProjectAwareLoader(
  STORAGE_KEYS.CHARACTER_ROADMAP,
  { characters: [], relationships: [] }
);

export const PriorityCardsStorage = createProjectAwareLoader(
  STORAGE_KEYS.PRIORITY_CARDS,
  { priorities: [] }
);

export const ClotheslineStorage = createProjectAwareLoader(
  STORAGE_KEYS.CLOTHESLINE,
  { cards: [] }
);

export const StoryLabTocStorage = createProjectAwareLoader(
  STORAGE_KEYS.STORY_LAB_TOC,
  null
);

// Export base keys for reference
export { STORAGE_KEYS };

/**
 * Hook helper: Use this pattern in your React components
 * 
 * Example usage in a component:
 * 
 * import { CharacterRoadmapStorage, getSelectedProjectId } from './projectAwareStorage';
 * 
 * function CharacterRoadmap() {
 *   const [projectId, setProjectId] = useState(getSelectedProjectId);
 *   const [data, setData] = useState(() => CharacterRoadmapStorage.load());
 *   
 *   // Reload when project changes
 *   useEffect(() => {
 *     const handleProjectChange = () => {
 *       const newProjectId = getSelectedProjectId();
 *       if (newProjectId !== projectId) {
 *         setProjectId(newProjectId);
 *         setData(CharacterRoadmapStorage.load());
 *       }
 *     };
 *     
 *     window.addEventListener('project:switch', handleProjectChange);
 *     window.addEventListener('project:change', handleProjectChange);
 *     
 *     return () => {
 *       window.removeEventListener('project:switch', handleProjectChange);
 *       window.removeEventListener('project:change', handleProjectChange);
 *     };
 *   }, [projectId]);
 *   
 *   // Save function
 *   const saveData = (newData) => {
 *     setData(newData);
 *     CharacterRoadmapStorage.save(newData);
 *   };
 *   
 *   // ... rest of component
 * }
 */
