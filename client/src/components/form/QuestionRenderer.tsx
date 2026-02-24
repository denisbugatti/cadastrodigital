/**
 * FormFlow — Dark Futuristic Design
 * Renders the correct input component based on question type.
 * Supports all 28 question types.
 */

import type { Question, FormResponse } from "@/lib/formTypes";
import { QuestionHeader } from "./QuestionHeader";
import { TextInput } from "./inputs/TextInput";
import { LongTextInput } from "./inputs/LongTextInput";
import { MultipleChoiceInput } from "./inputs/MultipleChoiceInput";
import { MultipleSelectInput } from "./inputs/MultipleSelectInput";
import { RatingInput } from "./inputs/RatingInput";
import { YesNoInput } from "./inputs/YesNoInput";
import { CPFInput } from "./inputs/CPFInput";
import { CNPJInput } from "./inputs/CNPJInput";
import { AddressInput } from "./inputs/AddressInput";
import { CurrencyInput } from "./inputs/CurrencyInput";
import { NPSInput } from "./inputs/NPSInput";
import { SatisfactionInput } from "./inputs/SatisfactionInput";
import { DropdownInput } from "./inputs/DropdownInput";
import { ImageChoiceInput } from "./inputs/ImageChoiceInput";
import { LegalInput } from "./inputs/LegalInput";
import { FileUploadInput } from "./inputs/FileUploadInput";
import { RankingInput } from "./inputs/RankingInput";
import { MatrixInput } from "./inputs/MatrixInput";
import { PhoneInput } from "./inputs/PhoneInput";
import { DatePickerInput } from "./inputs/DatePickerInput";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { ThankYouScreen } from "./screens/ThankYouScreen";
import { StatementScreen } from "./screens/StatementScreen";

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
  // Special screens (no header)
  if (question.type === "welcome") {
    return <WelcomeScreen question={question} onStart={onNext} />;
  }
  if (question.type === "thank-you") {
    return <ThankYouScreen question={question} />;
  }
  if (question.type === "statement") {
    return <StatementScreen question={question} onNext={onNext} />;
  }

  // Regular question with header
  const renderInput = () => {
    switch (question.type) {
      // Text inputs
      case "short-text":
      case "name":
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder || (question.type === "name" ? "Digite seu nome completo..." : undefined)}
            type="text"
            error={validationError}
          />
        );

      case "email":
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder || "seu@email.com"}
            type="email"
            error={validationError}
          />
        );

      case "phone":
        return (
          <PhoneInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      case "number":
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder || "0"}
            type="number"
            error={validationError}
          />
        );

      case "long-text":
        return (
          <LongTextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder}
            error={validationError}
          />
        );

      case "link":
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder || "https://"}
            type="text"
            error={validationError}
          />
        );

      case "identity-doc":
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder || "Digite o número do documento..."}
            type="text"
            error={validationError}
          />
        );

      // Document inputs
      case "cpf":
        return (
          <CPFInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      case "cnpj":
        return (
          <CNPJInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      // Address
      case "address":
        return (
          <AddressInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      // Currency
      case "currency":
        return (
          <CurrencyInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      // Choice inputs
      case "multiple-choice":
        return question.choices ? (
          <MultipleChoiceInput
            choices={question.choices}
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            onAutoAdvance={onNext}
          />
        ) : null;

      case "dropdown":
        return question.choices ? (
          <DropdownInput
            choices={question.choices}
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder}
            onAutoAdvance={onNext}
          />
        ) : null;

      case "image-choice":
        return question.choices ? (
          <ImageChoiceInput
            choices={question.choices}
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            onAutoAdvance={onNext}
          />
        ) : null;

      case "multiple-select":
      case "checkbox":
        return question.choices ? (
          <MultipleSelectInput
            choices={question.choices}
            value={(value as string[]) || []}
            onChange={(v) => onChange(v)}
          />
        ) : null;

      case "yes-no":
        return (
          <YesNoInput
            value={value as boolean | null}
            onChange={(v) => onChange(v)}
            onAutoAdvance={onNext}
          />
        );

      // Rating & scale
      case "rating":
        return (
          <RatingInput
            value={(value as number) || 0}
            onChange={(v) => onChange(v)}
            maxRating={question.maxRating}
            labels={question.ratingLabels}
            onAutoAdvance={onNext}
          />
        );

      case "satisfaction":
        return (
          <SatisfactionInput
            value={(value as number) || 0}
            onChange={(v) => onChange(v)}
            maxRating={question.maxRating}
            labels={question.ratingLabels}
            onAutoAdvance={onNext}
          />
        );

      case "nps":
        return (
          <NPSInput
            value={typeof value === "number" ? value : -1}
            onChange={(v) => onChange(v)}
            labels={question.ratingLabels}
            onAutoAdvance={onNext}
          />
        );

      case "ranking":
        return question.choices ? (
          <RankingInput
            choices={question.choices}
            value={(value as string[]) || []}
            onChange={(v) => onChange(v)}
          />
        ) : null;

      case "matrix":
        return question.matrixRows && question.matrixColumns ? (
          <MatrixInput
            rows={question.matrixRows}
            columns={question.matrixColumns}
            value={(value as Record<string, string>) || {}}
            onChange={(v) => onChange(v)}
          />
        ) : null;

      // Date
      case "date":
        return (
          <DatePickerInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      // File upload
      case "file-upload":
        return (
          <FileUploadInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            error={validationError}
          />
        );

      // Legal
      case "legal":
        return (
          <LegalInput
            value={value as boolean | null}
            onChange={(v) => onChange(v)}
            legalText={question.legalText || question.subtitle}
            onAutoAdvance={onNext}
          />
        );

      default:
        return (
          <TextInput
            value={(value as string) || ""}
            onChange={(v) => onChange(v)}
            placeholder={question.placeholder}
            type="text"
            error={validationError}
          />
        );
    }
  };

  return (
    <div>
      <QuestionHeader
        number={questionNumber}
        title={question.title}
        subtitle={question.type !== "legal" ? question.subtitle : undefined}
      />
      {renderInput()}
    </div>
  );
}
