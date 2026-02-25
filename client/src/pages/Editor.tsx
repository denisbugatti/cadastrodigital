/**
 * Editor Page — Wrapper for the Builder component
 * Route: /editor and /editor/:id
 * When :id matches a known form, loads it pre-populated.
 * Also checks localStorage for saved versions.
 */

import { useParams } from "wouter";
import Builder from "./Builder";
import { createOneInnovationForm } from "@/lib/oneInnovationForm";
import { loadForm } from "@/lib/formStorage";
import type { BuilderForm } from "@/lib/builderTypes";

// Registry of pre-built forms
const preBuiltForms: Record<string, () => BuilderForm> = {
  one_innovation_form: createOneInnovationForm,
};

export default function Editor() {
  const params = useParams<{ id?: string }>();
  const formId = params?.id;

  let initialForm: BuilderForm | undefined;

  if (formId) {
    // First try to load from localStorage (saved version)
    const savedForm = loadForm(formId);
    if (savedForm) {
      initialForm = savedForm;
    } else if (preBuiltForms[formId]) {
      // Fall back to pre-built form
      initialForm = preBuiltForms[formId]();
    }
  }

  return <Builder key={formId || "new"} initialForm={initialForm} />;
}
