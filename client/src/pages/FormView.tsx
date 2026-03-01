/**
 * FormFlow — Dark Futuristic Design
 * FormView page: renders the immersive conversational form experience.
 * Loads form from database by slug or ID via tRPC.
 */

import { useParams } from "wouter";
import { Loader2 } from "lucide-react";
import { FormContainer } from "@/components/form/FormContainer";
import { demoForm } from "@/lib/formTypes";
import type { FormData, Question } from "@/lib/formTypes";
import { trpc } from "@/lib/trpc";

/**
 * Convert a database form record into the FormData shape expected by FormContainer.
 */
function dbFormToFormData(dbForm: any): FormData {
  const questions: Question[] = (dbForm.questions ?? []).map((q: any) => ({
    id: q.id,
    type: q.type,
    title: q.title,
    subtitle: q.subtitle,
    placeholder: q.placeholder,
    required: q.required,
    choices: q.choices?.map((c: any) => ({
      id: c.id,
      label: c.label,
      icon: c.icon,
      imageUrl: c.imageUrl,
      score: c.score,
    })),
    maxRating: q.maxRating,
    ratingLabels: q.ratingLabels,
    validation: q.validation,
    image: q.image,
    imageUrl: q.imageUrl,
    iconName: q.iconName,
    motionIconUrl: q.motionIconUrl,
    buttonText: q.buttonText,
    showButton: q.showButton,
    redirectUrl: q.redirectUrl,
    legalText: q.legalText,
    matrixRows: q.matrix?.rows ?? q.matrixRows,
    matrixColumns: q.matrix?.columns ?? q.matrixColumns,
    rankItems: q.rankItems,
    scoringEnabled: q.scoringEnabled,
    questionScore: q.questionScore,
    conditionalLogic: q.conditionalLogic ? {
      enabled: q.conditionalLogic.enabled ?? false,
      branches: (q.conditionalLogic.branches ?? []).map((r: any) => ({
        choiceId: r.choiceId,
        goToQuestionId: r.goToQuestionId,
        operator: r.operator,
        value: r.value,
      })),
      rules: (q.conditionalLogic.rules ?? []).map((r: any) => ({
        id: r.id,
        goToQuestionId: r.goToQuestionId,
        operator: r.operator,
        value: r.value,
      })),
      scoreRules: (q.conditionalLogic.scoreRules ?? []).map((sr: any) => ({
        id: sr.id,
        scoreMin: sr.scoreMin ?? null,
        scoreMax: sr.scoreMax ?? null,
        goToQuestionId: sr.goToQuestionId,
      })),
      defaultGoTo: q.conditionalLogic.defaultGoTo ?? "next",
    } : { enabled: false, branches: [], rules: [], scoreRules: [], defaultGoTo: "next" },
  }));

  const design = dbForm.design ?? {};

  return {
    id: dbForm.slug ?? String(dbForm.id),
    title: dbForm.title ?? "Formulário",
    description: dbForm.description ?? "",
    questions,
    theme: {
      primaryColor: design.buttonColor ?? "#3B82F6",
      accentColor: design.answerColor ?? "#3B82F6",
    },
    design: {
      backgroundColor: design.backgroundColor,
      questionColor: design.questionColor,
      answerColor: design.answerColor,
      buttonColor: design.buttonColor,
      buttonTextColor: design.buttonTextColor,
      fontFamily: design.fontFamily,
      logoUrl: design.logoUrl,
      backgroundImage: design.backgroundImage,
    },
    // Pass the database form ID for response submission
    _dbFormId: dbForm.id,
  };
}

function FormViewBySlug({ slug }: { slug: string }) {
  const { data: dbForm, isLoading, error } = trpc.forms.getBySlug.useQuery(
    { slug },
    { staleTime: 30000 }
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !dbForm) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Formulário não encontrado</h2>
          <p className="text-gray-400">Este formulário não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const formData = dbFormToFormData(dbForm);
  return (
    <div className="form-viewport-lock h-screen w-screen overflow-hidden">
      <FormContainer form={formData} />
    </div>
  );
}

function FormViewById({ id }: { id: number }) {
  const { data: dbForm, isLoading, error } = trpc.forms.getById.useQuery(
    { id },
    { staleTime: 30000 }
  );

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black">
        <Loader2 size={32} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error || !dbForm) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Formulário não encontrado</h2>
          <p className="text-gray-400">Este formulário não existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  const formData = dbFormToFormData(dbForm);
  return (
    <div className="form-viewport-lock h-screen w-screen overflow-hidden">
      <FormContainer form={formData} />
    </div>
  );
}

export default function FormView() {
  const params = useParams<{ id?: string; slug?: string }>();

  // Route /f/:slug
  if (params?.slug) {
    return <FormViewBySlug slug={params.slug} />;
  }

  // Route /form/:id — try numeric ID first, then slug
  if (params?.id) {
    if (/^\d+$/.test(params.id)) {
      return <FormViewById id={parseInt(params.id, 10)} />;
    }
    // Treat as slug
    return <FormViewBySlug slug={params.id} />;
  }

  // Fallback: render demo form
  return (
    <div className="form-viewport-lock h-screen w-screen overflow-hidden">
      <FormContainer form={demoForm} />
    </div>
  );
}
