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

/**
 * Default values for every BuilderQuestion field.
 * When loading from DB, any missing field gets this default
 * so React inputs always start as controlled (never undefined).
 */
const questionDefaults = {
  title: "",
  subtitle: "",
  placeholder: "",
  required: false,
  choices: [],
  maxRating: 5,
  ratingLabels: { low: "Ruim", high: "Excelente" },
  npsLabels: { low: "Nada provável", mid: "Neutro", high: "Muito provável" },
  matrix: { rows: ["Item 1", "Item 2"], columns: ["Ruim", "Regular", "Bom", "Ótimo"] },
  rankItems: ["Item 1", "Item 2", "Item 3"],
  validation: {},
  conditionalLogic: { enabled: false, branches: [], rules: [], defaultGoTo: "next" },
  image: "",
  imageUrl: "",
  iconName: "",
  motionIconUrl: "",
  buttonText: "Continuar",
  showButton: true,
  redirectUrl: "",
  legalText: "",
  addressFields: {
    cep: true,
    street: true,
    number: true,
    complement: true,
    neighborhood: true,
    city: true,
    state: true,
  },
};

function ensureQuestionDefaults(q: any): any {
  const merged = { ...questionDefaults, ...q };
  // Deep-merge conditionalLogic: ensure branches and rules are always separate arrays
  if (q.conditionalLogic) {
    const cl = q.conditionalLogic;
    merged.conditionalLogic = {
      enabled: cl.enabled ?? false,
      branches: Array.isArray(cl.branches) ? [...cl.branches] : [],
      rules: Array.isArray(cl.rules) ? [...cl.rules] : [],
      defaultGoTo: cl.defaultGoTo ?? "next",
    };
  } else {
    // Ensure conditionalLogic always has separate array instances
    merged.conditionalLogic = {
      enabled: false,
      branches: [],
      rules: [],
      defaultGoTo: "next",
    };
  }
  // Ensure scoringEnabled and questionScore have defaults
  if (merged.scoringEnabled === undefined) merged.scoringEnabled = false;
  if (merged.questionScore === undefined) merged.questionScore = 0;
  return merged;
}

function dbFormToBuilderForm(dbForm: any): BuilderForm {
  const rawQuestions = dbForm.questions ?? [];
  const dbWebhook = dbForm.webhook ?? {};
  const dbDesign = dbForm.design ?? {};
  const dbSharing = dbForm.sharing ?? {};

  // Deep merge webhook integrations so nested fields never become undefined
  const mergedIntegrations = {
    rdStation: {
      ...defaultWebhookSettings.integrations!.rdStation!,
      ...(dbWebhook.integrations?.rdStation ?? {}),
    },
    whatsapp: {
      ...defaultWebhookSettings.integrations!.whatsapp!,
      ...(dbWebhook.integrations?.whatsapp ?? {}),
    },
    email: {
      ...defaultWebhookSettings.integrations!.email!,
      ...(dbWebhook.integrations?.email ?? {}),
    },
  };

  return {
    id: String(dbForm.id),
    title: dbForm.title ?? "Sem título",
    description: dbForm.description ?? "",
    questions: rawQuestions.map(ensureQuestionDefaults),
    design: {
      ...defaultDesignSettings,
      ...dbDesign,
      // Ensure all string fields have defaults
      buttonColor: dbDesign.buttonColor ?? defaultDesignSettings.buttonColor,
      buttonTextColor: dbDesign.buttonTextColor ?? defaultDesignSettings.buttonTextColor,
      questionColor: dbDesign.questionColor ?? defaultDesignSettings.questionColor,
      answerColor: dbDesign.answerColor ?? defaultDesignSettings.answerColor,
      backgroundColor: dbDesign.backgroundColor ?? defaultDesignSettings.backgroundColor,
      backgroundImage: dbDesign.backgroundImage ?? defaultDesignSettings.backgroundImage,
      logoUrl: dbDesign.logoUrl ?? defaultDesignSettings.logoUrl,
      ogTitle: dbDesign.ogTitle ?? defaultDesignSettings.ogTitle,
      ogDescription: dbDesign.ogDescription ?? defaultDesignSettings.ogDescription,
      ogImage: dbDesign.ogImage ?? defaultDesignSettings.ogImage,
      fontFamily: dbDesign.fontFamily ?? defaultDesignSettings.fontFamily,
    },
    webhook: {
      ...defaultWebhookSettings,
      ...dbWebhook,
      url: dbWebhook.url ?? defaultWebhookSettings.url,
      headers: dbWebhook.headers ?? defaultWebhookSettings.headers,
      integrations: mergedIntegrations,
    },
    sharing: {
      ...defaultSharingSettings,
      ...dbSharing,
      slug: dbSharing.slug ?? dbForm.slug ?? "",
      embedWidth: dbSharing.embedWidth ?? defaultSharingSettings.embedWidth,
      embedHeight: dbSharing.embedHeight ?? defaultSharingSettings.embedHeight,
      embedButtonText: dbSharing.embedButtonText ?? defaultSharingSettings.embedButtonText,
      embedButtonColor: dbSharing.embedButtonColor ?? defaultSharingSettings.embedButtonColor,
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
