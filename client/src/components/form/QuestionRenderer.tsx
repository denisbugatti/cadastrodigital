/**
 * FormFlow — Organic Flow Design
 * Renders the correct input component based on question type.
 */

import type { Question, FormResponse } from "@/lib/formTypes";
import { QuestionHeader } from "./QuestionHeader";
import { TextInput } from "./inputs/TextInput";
import { LongTextInput } from "./inputs/LongTextInput";
import { MultipleChoiceInput } from "./inputs/MultipleChoiceInput";
import { MultipleSelectInput } from "./inputs/MultipleSelectInput";
import { RatingInput } from "./inputs/RatingInput";
import { YesNoInput } from "./inputs/YesNoInput";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { ThankYouScreen } from "./screens/ThankYouScreen";

interface QuestionRendererProps {
  question: Question;
  questionNumber: number;
  value: FormResponse["value"] | undefined;
  onChange: (value: FormResponse["value"]) => void;
  onNext: () => void;
  validationError?: string;
}

export function QuestionRenderer({
  question,
  questionNumber,
  value,
  onChange,
  onNext,
  validationError,
}: QuestionRendererProps) {
  // Welcome screen
  if (question.type === "welcome") {
    return <WelcomeScreen question={question} onStart={onNext} />;
  }

  // Thank you screen
  if (question.type === "thank-you") {
    return <ThankYouScreen question={question} />;
  }

  // Regular question
  return (
    <div>
      <QuestionHeader
        number={questionNumber}
        title={question.title}
        subtitle={question.subtitle}
      />

      {/* Input component based on type */}
      {(question.type === "short-text" || question.type === "phone" || question.type === "number") && (
        <TextInput
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          placeholder={question.placeholder}
          type={
            question.type === "phone"
              ? "tel"
              : question.type === "number"
              ? "number"
              : "text"
          }
          error={validationError}
        />
      )}

      {question.type === "email" && (
        <TextInput
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          placeholder={question.placeholder}
          type="email"
          error={validationError}
        />
      )}

      {question.type === "long-text" && (
        <LongTextInput
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          placeholder={question.placeholder}
          error={validationError}
        />
      )}

      {question.type === "multiple-choice" && question.choices && (
        <MultipleChoiceInput
          choices={question.choices}
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          onAutoAdvance={onNext}
        />
      )}

      {question.type === "multiple-select" && question.choices && (
        <MultipleSelectInput
          choices={question.choices}
          value={(value as string[]) || []}
          onChange={(v) => onChange(v)}
        />
      )}

      {question.type === "rating" && (
        <RatingInput
          value={(value as number) || 0}
          onChange={(v) => onChange(v)}
          maxRating={question.maxRating}
          labels={question.ratingLabels}
          onAutoAdvance={onNext}
        />
      )}

      {question.type === "yes-no" && (
        <YesNoInput
          value={value as boolean | null}
          onChange={(v) => onChange(v)}
          onAutoAdvance={onNext}
        />
      )}

      {question.type === "date" && (
        <TextInput
          value={(value as string) || ""}
          onChange={(v) => onChange(v)}
          placeholder="DD/MM/AAAA"
          type="text"
          error={validationError}
        />
      )}
    </div>
  );
}
