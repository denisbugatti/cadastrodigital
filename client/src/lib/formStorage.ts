/**
 * FormFlow — Form Storage Utility
 * Persists form configurations to localStorage with version history.
 * Since this is a static frontend app, localStorage is the persistence layer.
 */

import type { BuilderForm } from "./builderTypes";

const STORAGE_KEY_PREFIX = "formflow_builder_";
const HISTORY_KEY_PREFIX = "formflow_history_";
const FORMS_INDEX_KEY = "formflow_forms_index";
const MAX_HISTORY_VERSIONS = 5;

/* ─── Version History Types ─── */

export interface FormVersion {
  id: string;
  formId: string;
  savedAt: string;
  label: string;
  data: BuilderForm;
}

/* ─── Core CRUD ─── */

/**
 * Save a form to localStorage and push a version to history
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
 * Save a form AND create a version snapshot
 */
export function saveFormWithVersion(form: BuilderForm, label?: string): void {
  saveForm(form);
  pushVersion(form, label);
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
 * Delete a form from localStorage (including history)
 */
export function deleteForm(formId: string): void {
  try {
    const key = `${STORAGE_KEY_PREFIX}${formId}`;
    localStorage.removeItem(key);

    // Remove history
    const historyKey = `${HISTORY_KEY_PREFIX}${formId}`;
    localStorage.removeItem(historyKey);

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

/* ─── Version History ─── */

/**
 * Push a new version to the form's history (keeps last MAX_HISTORY_VERSIONS)
 */
function pushVersion(form: BuilderForm, label?: string): void {
  try {
    const historyKey = `${HISTORY_KEY_PREFIX}${form.id}`;
    const versions = getVersionHistory(form.id);

    const newVersion: FormVersion = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      formId: form.id,
      savedAt: new Date().toISOString(),
      label: label || `Versão ${versions.length + 1}`,
      data: JSON.parse(JSON.stringify(form)), // deep clone
    };

    versions.unshift(newVersion); // newest first

    // Keep only last N versions
    const trimmed = versions.slice(0, MAX_HISTORY_VERSIONS);
    localStorage.setItem(historyKey, JSON.stringify(trimmed));
  } catch (error) {
    console.error("Failed to push version:", error);
  }
}

/**
 * Get the version history for a form (newest first)
 */
export function getVersionHistory(formId: string): FormVersion[] {
  try {
    const historyKey = `${HISTORY_KEY_PREFIX}${formId}`;
    const data = localStorage.getItem(historyKey);
    if (!data) return [];
    return JSON.parse(data) as FormVersion[];
  } catch {
    return [];
  }
}

/**
 * Restore a specific version (replaces the current form)
 */
export function restoreVersion(formId: string, versionId: string): BuilderForm | null {
  try {
    const versions = getVersionHistory(formId);
    const version = versions.find((v) => v.id === versionId);
    if (!version) return null;

    // Save the restored version as current
    saveForm(version.data);
    return version.data;
  } catch (error) {
    console.error("Failed to restore version:", error);
    return null;
  }
}

/**
 * Delete a specific version from history
 */
export function deleteVersion(formId: string, versionId: string): void {
  try {
    const historyKey = `${HISTORY_KEY_PREFIX}${formId}`;
    const versions = getVersionHistory(formId).filter((v) => v.id !== versionId);
    localStorage.setItem(historyKey, JSON.stringify(versions));
  } catch (error) {
    console.error("Failed to delete version:", error);
  }
}

/* ─── Export / Import ─── */

/**
 * Export a form as a JSON file (triggers download)
 */
export function exportFormAsJSON(form: BuilderForm): void {
  try {
    const exportData = {
      _type: "formflow_export",
      _version: "1.0",
      _exportedAt: new Date().toISOString(),
      form: form,
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title.replace(/[^a-zA-Z0-9À-ÿ\s-]/g, "").replace(/\s+/g, "_")}_formflow.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Failed to export form:", error);
  }
}

/**
 * Import a form from a JSON file
 * Returns the imported form or null if invalid
 */
export function importFormFromJSON(file: File): Promise<BuilderForm | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data = JSON.parse(text);

        // Validate structure
        if (data._type !== "formflow_export" || !data.form) {
          console.error("Invalid FormFlow export file");
          resolve(null);
          return;
        }

        const form = data.form as BuilderForm;

        // Generate a new unique ID to avoid conflicts
        form.id = `imported_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        form.title = `${form.title} (importado)`;

        // Save the imported form
        saveForm(form);

        resolve(form);
      } catch (error) {
        console.error("Failed to parse import file:", error);
        resolve(null);
      }
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}
