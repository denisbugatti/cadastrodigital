/**
 * Editor Page — Wrapper for the Builder component
 * Route: /editor and /editor/:id
 * When :id is a number, loads form from database via tRPC.
 * When :id is a string slug, loads pre-built form.
 */

import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import Builder from "./Builder";
import { createOneInnovationForm } from "@/lib/oneInnovationForm";
import type { BuilderForm } from "@/lib/builderTypes";
import { trpc } from "@/lib/trpc";
import { defaultDesignSettings, defaultWebhookSettings, defaultSharingSettings } from "@/lib/builderTypes";

// Registry of pre-built forms (for templates)
const preBuiltForms: Record<string, () => BuilderForm> = {
  one_innovation_form: createOneInnovationForm,
};

function dbFormToBuilderForm(dbForm: any): BuilderForm {
  return {
    id: String(dbForm.id),
    title: dbForm.title ?? "Sem título",
    description: dbForm.description ?? "",
    questions: dbForm.questions ?? [],
    design: { ...defaultDesignSettings, ...(dbForm.design ?? {}) },
    webhook: { ...defaultWebhookSettings, ...(dbForm.webhook ?? {}) },
    sharing: {
      ...defaultSharingSettings,
      slug: dbForm.slug ?? "",
      ...(dbForm.sharing ?? {}),
    },
    workspaceId: dbForm.workspaceId ?? null,
    createdAt: dbForm.createdAt ? new Date(dbForm.createdAt).toISOString() : new Date().toISOString(),
    updatedAt: dbForm.updatedAt ? new Date(dbForm.updatedAt).toISOString() : new Date().toISOString(),
  };
}

function EditorWithDbForm({ formId }: { formId: number }) {
  const { data: dbForm, isLoading, error } = trpc.forms.getById.useQuery(
    { id: formId },
    { staleTime: 5000 }
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={32} className="animate-spin text-brand" />
          <p className="text-muted-foreground font-body">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error || !dbForm) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md mx-auto px-6">
          <h2 className="font-display text-xl font-bold text-foreground mb-2">Formulário não encontrado</h2>
          <p className="text-muted-foreground font-body mb-4">
            O formulário solicitado não existe ou você não tem acesso.
          </p>
          <a href="/form" className="text-brand hover:underline font-body font-medium">
            Voltar ao Dashboard
          </a>
        </div>
      </div>
    );
  }

  const builderForm = dbFormToBuilderForm(dbForm);
  return <Builder key={`db-${formId}`} initialForm={builderForm} dbFormId={formId} />;
}

export default function Editor() {
  const params = useParams<{ id?: string }>();
  const formId = params?.id;

  // If formId is a number, load from database
  if (formId && /^\d+$/.test(formId)) {
    return <EditorWithDbForm formId={parseInt(formId, 10)} />;
  }

  // If formId is a string slug, check pre-built forms
  let initialForm: BuilderForm | undefined;
  if (formId && preBuiltForms[formId]) {
    initialForm = preBuiltForms[formId]();
  }

  return <Builder key={formId || "new"} initialForm={initialForm} />;
}
