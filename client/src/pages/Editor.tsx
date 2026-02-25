/**
 * Editor Page — Wrapper for the Builder component
 * Route: /editor and /editor/:id
 * When :id matches a known form, loads it pre-populated.
 */

import { useParams } from "wouter";
import Builder from "./Builder";
import { createOneInnovationForm } from "@/lib/oneInnovationForm";
import type { BuilderForm } from "@/lib/builderTypes";

// Registry of pre-built forms
const preBuiltForms: Record<string, () => BuilderForm> = {
  one_innovation_form: createOneInnovationForm,
};

export default function Editor() {
  const params = useParams<{ id?: string }>();
  const formId = params?.id;

  const initialForm = formId && preBuiltForms[formId]
    ? preBuiltForms[formId]()
    : undefined;

  return <Builder key={formId || "new"} initialForm={initialForm} />;
}
