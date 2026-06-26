/**
 * SlugResolver — Catch-all route that resolves /:slug to a form.
 * If the slug matches a published form, renders it via FormViewBySlug.
 * Otherwise, shows the 404 page.
 * 
 * Supports ?continue=responseId to resume a partially completed form.
 * This enables clean URLs like one.cadastrodigital.com.br/vitoria
 */

import { useParams, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import NotFound from "./NotFound";
import { FormContainer } from "@/components/form/FormContainer";
import { useMemo, useEffect } from "react";
import { BRANDS, brandFromValue, brandFromHost } from "@shared/brands";
import type { FormData, Question } from "@/lib/formTypes";

// Known internal routes that should NOT be treated as form slugs
const INTERNAL_PATHS = new Set([
  "form", "editor", "landing", "form-preview", "responses", "corretores", "404", "f",
  "portal", "cadastro-cliente", "login", "aceitar-convite", "dashboard", "equipe",
  "configuracoes", "validar",
]);

export default function SlugResolver() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug ?? "";
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const continueResponseId = searchParams.get("continue");

  // Check if this is a known internal route (evaluated after hooks)
  const isInternalPath = INTERNAL_PATHS.has(slug);
  // Brand of the current subdomain — slugs are unique per brand, so the lookup is scoped to it
  const hostBrand = typeof window !== "undefined" ? brandFromHost(window.location.hostname) : null;

  const { data: dbForm, isLoading, error } = trpc.forms.getBySlug.useQuery(
    { slug, brand: hostBrand ?? undefined },
    { enabled: !!slug && !isInternalPath, retry: 1 }
  );

  // Load partial response if ?continue= is provided
  const { data: partialResponse } = trpc.responses.getForContinue.useQuery(
    { id: Number(continueResponseId) },
    { enabled: !!continueResponseId && !isNaN(Number(continueResponseId)) && !isInternalPath, retry: 1 }
  );

  // Brand separation: if the form belongs to another brand, send the visitor to
  // the correct subdomain (self-healing links). Only triggers on real brand hosts.
  useEffect(() => {
    if (!dbForm) return;
    const formBrand = brandFromValue((dbForm as any).sharing?.brand);
    if (hostBrand && hostBrand !== formBrand) {
      window.location.replace(
        `https://${BRANDS[formBrand].host}${window.location.pathname}${window.location.search}`
      );
    }
  }, [dbForm, hostBrand]);

  const form = useMemo<FormData | null>(() => {
    if (!dbForm) return null;
    const rawQuestions = (dbForm.questions ?? []) as any[];
    const questions: Question[] = rawQuestions.map((q: any) => ({
      id: q.id ?? String(Math.random()),
      type: q.type ?? "short-text",
      title: q.title ?? "",
      subtitle: q.subtitle ?? "",
      required: q.required ?? false,
      placeholder: q.placeholder ?? "",
      choices: (q.choices ?? []).map((c: any) => ({
        id: c.id ?? String(Math.random()),
        label: c.label ?? "",
        value: c.value ?? c.label ?? "",
        imageUrl: c.imageUrl,
        score: c.score ?? 0,
      })),
      imageUrl: q.imageUrl,
      videoUrl: q.videoUrl,
      buttonText: q.buttonText ?? "Continuar",
      mask: q.mask,
      maxLength: q.maxLength,
      validation: q.validation,
      multipleSelection: q.multipleSelection ?? false,
      maxSelections: q.maxSelections,
      layout: q.layout ?? "list",
      dateFormat: q.dateFormat ?? "DD/MM/YYYY",
      currencySymbol: q.currencySymbol ?? "R$",
      allowDecimal: q.allowDecimal ?? true,
      maxFileSize: q.maxFileSize ?? 10,
      allowedFileTypes: q.allowedFileTypes ?? [],
      maxFiles: q.maxFiles ?? 1,
      ratingScale: q.ratingScale ?? 5,
      ratingStyle: q.ratingStyle ?? "star",
      opinionScaleMin: q.opinionScaleMin ?? 0,
      opinionScaleMax: q.opinionScaleMax ?? 10,
      opinionMinLabel: q.opinionMinLabel ?? "",
      opinionMaxLabel: q.opinionMaxLabel ?? "",
      scoringEnabled: q.scoringEnabled ?? false,
      questionScore: q.questionScore ?? 0,
      conditionalLogic: q.conditionalLogic
        ? {
            enabled: q.conditionalLogic.enabled ?? false,
            branches: (q.conditionalLogic.branches ?? []).map((b: any) => ({ ...b })),
            rules: (q.conditionalLogic.rules ?? []).map((r: any) => ({ ...r })),
            scoreRules: (q.conditionalLogic.scoreRules ?? []).map((sr: any) => ({ ...sr })),
          }
        : { enabled: false, branches: [], rules: [], scoreRules: [] },
      smsVerification: q.smsVerification ?? false,
    }));
    const design = (dbForm.design ?? {}) as any;
    return {
      id: dbForm.slug ?? String(dbForm.id),
      title: dbForm.title,
      description: dbForm.description ?? "",
      questions,
      design: {
        fontFamily: design.fontFamily ?? "Inter",
        backgroundColor: design.backgroundColor ?? "#FFFFFF",
        questionColor: design.questionColor ?? "#1A1A2E",
        answerColor: design.answerColor ?? "#3B82F6",
        buttonColor: design.buttonColor ?? "#3B82F6",
        buttonTextColor: design.buttonTextColor ?? "#FFFFFF",
        backgroundType: design.backgroundType || "paths",
        inputStyle: design.inputStyle || "default",
        backgroundColors: design.backgroundColors || [],
        logoUrl: design.logoUrl,
        logoPosition: design.logoPosition ?? "left",
        roundness: design.roundness ?? "medium",
        customCSS: design.customCSS,
      },
      tracking: (() => {
        const wh = (dbForm.webhook ?? {}) as any;
        const t = wh.tracking ?? {};
        return {
          gtm: { enabled: !!t.gtm?.enabled, containerId: t.gtm?.containerId ?? '' },
          googleAnalytics: { enabled: !!t.googleAnalytics?.enabled, measurementId: t.googleAnalytics?.measurementId ?? '' },
          facebookPixel: { enabled: !!t.facebookPixel?.enabled, pixelId: t.facebookPixel?.pixelId ?? '' },
          tiktokPixel: { enabled: !!t.tiktokPixel?.enabled, pixelId: t.tiktokPixel?.pixelId ?? '' },
        };
      })(),
      settings: (() => {
        const s = dbForm.settings ? (typeof dbForm.settings === 'string' ? JSON.parse(dbForm.settings as string) : dbForm.settings) : {};
        return {
          smsVerification: !!s.smsVerification,
        };
      })(),
      _dbFormId: dbForm.id,
    };
  }, [dbForm]);

  // Skip known internal routes (after all hooks to respect Rules of Hooks)
  if (isInternalPath) {
    return <NotFound />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (error || !form) {
    return <NotFound />;
  }

  // Build initial answers from partial response if continuing
  const initialAnswers = partialResponse && !partialResponse.isComplete
    ? (partialResponse.answers as Record<string, unknown>)
    : undefined;

  const continueId = partialResponse && !partialResponse.isComplete
    ? partialResponse.id
    : undefined;

  return (
    <div className="form-viewport-lock h-screen w-screen overflow-hidden">
      <FormContainer
        form={form}
        initialAnswers={initialAnswers}
        continueResponseId={continueId}
      />
    </div>
  );
}
