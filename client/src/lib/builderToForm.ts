/**
 * FormFlow — Builder to Form Converter
 * Converts BuilderForm (from the builder) to FormData (for the conversational preview).
 * Now maps directly to native types since formTypes supports all 28 types.
 */

import type { BuilderForm, BuilderQuestion } from "./builderTypes";
import type { FormData, Question, QuestionType, Choice } from "./formTypes";

/**
 * Convert a single BuilderQuestion to a Question for the form engine.
 */
function convertQuestion(bq: BuilderQuestion): Question {
  const question: Question = {
    id: bq.id,
    type: bq.type as QuestionType,
    title: bq.title || "Pergunta sem título",
    subtitle: bq.subtitle || undefined,
    placeholder: bq.placeholder || undefined,
    required: bq.required,
  };

  // Handle choices
  if (bq.choices && bq.choices.length > 0) {
    question.choices = bq.choices.map((c): Choice => ({
      id: c.id,
      label: c.label,
      icon: undefined,
    }));
  }

  // Handle legal text
  if (bq.type === "legal") {
    question.legalText = bq.legalText || bq.subtitle;
  }

  // Handle rating types
  if (bq.type === "rating" || bq.type === "satisfaction") {
    question.maxRating = bq.maxRating || 5;
    question.ratingLabels = bq.ratingLabels;
  }

  // Handle NPS (0-10 scale)
  if (bq.type === "nps") {
    question.maxRating = 10;
    if (bq.npsLabels) {
      question.ratingLabels = { low: bq.npsLabels.low, high: bq.npsLabels.high };
    }
  }

  // Handle ranking
  if (bq.type === "ranking" && bq.rankItems) {
    question.choices = bq.rankItems.map((item, idx) => ({
      id: `rank_${idx}`,
      label: item,
    }));
  }

  // Handle matrix
  if (bq.type === "matrix" && bq.matrix) {
    question.matrixRows = bq.matrix.rows;
    question.matrixColumns = bq.matrix.columns;
  }

  // Handle welcome/thank-you images and special fields
  if (bq.type === "welcome" || bq.type === "thank-you") {
    question.image = bq.image || (bq.type === "welcome" ? "welcome" : "thankyou");
    question.buttonText = bq.buttonText;
    question.showButton = bq.showButton;
    question.redirectUrl = bq.redirectUrl;
  }

  // Handle per-question media
  if (bq.imageUrl) question.imageUrl = bq.imageUrl;
  if (bq.iconName) question.iconName = bq.iconName;
  if (bq.motionIconUrl) question.motionIconUrl = bq.motionIconUrl;

  // Handle conditional logic
  if (bq.conditionalLogic?.enabled) {
    const hasBranches = (bq.conditionalLogic?.branches?.length ?? 0) > 0;
    const hasDefaultGoTo = bq.conditionalLogic?.defaultGoTo && bq.conditionalLogic.defaultGoTo !== "next";
    if (hasBranches || hasDefaultGoTo) {
      question.conditionalLogic = {
        enabled: true,
        rules: (bq.conditionalLogic?.branches ?? []).map((b) => ({
          choiceId: b.choiceId,
          goToQuestionId: b.goToQuestionId,
        })),
        defaultGoTo: hasDefaultGoTo ? bq.conditionalLogic?.defaultGoTo : undefined,
      };
    }
  }

  return question;
}

/**
 * Convert a BuilderForm to FormData for the conversational form engine.
 */
export function builderToFormData(builderForm: BuilderForm): FormData {
  return {
    id: builderForm.id,
    title: builderForm.title,
    description: builderForm.description || undefined,
    questions: builderForm.questions.map(convertQuestion),
    design: {
      backgroundColor: builderForm.design.backgroundColor,
      questionColor: builderForm.design.questionColor,
      answerColor: builderForm.design.answerColor,
      buttonColor: builderForm.design.buttonColor,
      fontFamily: builderForm.design.fontFamily,
      logoUrl: builderForm.design.logoUrl || undefined,
      backgroundImage: builderForm.design.backgroundImage || undefined,
    },
  };
}
