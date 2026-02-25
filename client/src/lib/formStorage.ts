/**
 * FormFlow — Form Storage Utility
 * Persists form configurations to localStorage.
 * Since this is a static frontend app, localStorage is the persistence layer.
 */

import type { BuilderForm } from "./builderTypes";

const STORAGE_KEY_PREFIX = "formflow_builder_";
const FORMS_INDEX_KEY = "formflow_forms_index";

/**
 * Save a form to localStorage
 */
export function saveForm(form: BuilderForm): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${form.id}`;
    localStorage.setItem(key, JSON.stringify(form));
    
    // Update the forms index
    const index = getFormsIndex();
    if (!index.includes(form.id)) {
      index.push(form.id);
      localStorage.setItem(FORMS_INDEX_KEY, JSON.stringify(index));
    }
  } catch (error) {
    console.error("Failed to save form:", error);
  }
}

/**
 * Load a form from localStorage
 */
export function loadForm(formId: string): BuilderForm | null {
  try {
    const key = `${STORAGE_KEY_PREFIX}${formId}`;
    const data = localStorage.getItem(key);
    if (!data) return null;
    return JSON.parse(data) as BuilderForm;
  } catch (error) {
    console.error("Failed to load form:", error);
    return null;
  }
}

/**
 * Delete a form from localStorage
 */
export function deleteForm(formId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${formId}`;
    localStorage.removeItem(key);
    
    // Update the forms index
    const index = getFormsIndex().filter((id) => id !== formId);
    localStorage.setItem(FORMS_INDEX_KEY, JSON.stringify(index));
  } catch (error) {
    console.error("Failed to delete form:", error);
  }
}

/**
 * Get the list of saved form IDs
 */
export function getFormsIndex(): string[] {
  try {
    const data = localStorage.getItem(FORMS_INDEX_KEY);
    if (!data) return [];
    return JSON.parse(data) as string[];
  } catch {
    return [];
  }
}

/**
 * Check if a form has been saved (has local modifications)
 */
export function hasLocalForm(formId: string): boolean {
  const key = `${STORAGE_KEY_PREFIX}${formId}`;
  return localStorage.getItem(key) !== null;
}
