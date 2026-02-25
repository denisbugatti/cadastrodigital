/**
 * FormPreviewPage — Standalone form preview with demo data
 * Shows a full-screen Respondi/Typeform-style form experience.
 * Uses a vibrant blue background with white text (like the Respondi reference).
 */

import { useMemo } from "react";
import { FormContainer } from "@/components/form/FormContainer";
import type { FormData } from "@/lib/formTypes";

function getDemoForm(): FormData {
  return {
    id: "demo-form",
    title: "Cadastro Digital",
    description: "Formulário de demonstração estilo Respondi",
    design: {
      backgroundColor: "#2196F3",
      questionColor: "#FFFFFF",
      answerColor: "#FFFFFF",
      buttonColor: "#FFFFFF",
      fontFamily: "Plus Jakarta Sans, sans-serif",
      logoUrl: "",
    },
    questions: [
      {
        id: "welcome",
        type: "welcome",
        title: "Bem-vindo ao Cadastro Digital",
        subtitle: "Seu cadastro levará menos de 2 minutos para ser concluído.",
        required: false,
        buttonText: "começar",
        showButton: true,
      },
      {
        id: "q1",
        type: "multiple-choice",
        title: "Você é pessoa física ou jurídica?",
        subtitle: "Selecione a opção que se aplica.",
        required: true,
        choices: [
          { id: "pf", label: "Pessoa Física" },
          { id: "pj", label: "Pessoa Jurídica" },
        ],
      },
      {
        id: "q2",
        type: "short-text",
        title: "Qual é o seu nome completo?",
        subtitle: "Como consta no documento.",
        required: true,
        placeholder: "Digite seu nome completo...",
      },
      {
        id: "q3",
        type: "email",
        title: "Qual é o seu e-mail comercial?",
        subtitle: "Usaremos para enviar a confirmação.",
        required: true,
        placeholder: "nome@empresa.com",
      },
      {
        id: "q4",
        type: "phone",
        title: "Qual é o seu telefone?",
        subtitle: "Com DDD, para contato rápido.",
        required: true,
        placeholder: "(00) 00000-0000",
      },
      {
        id: "q5",
        type: "multiple-choice",
        title: "Como conheceu nossos serviços?",
        subtitle: "Selecione a opção mais adequada.",
        required: false,
        choices: [
          { id: "google", label: "Google / Pesquisa" },
          { id: "social", label: "Redes Sociais" },
          { id: "referral", label: "Indicação de amigo" },
          { id: "event", label: "Evento / Feira" },
          { id: "other", label: "Outro" },
        ],
      },
      {
        id: "q6",
        type: "rating",
        title: "De 1 a 5, como avalia esta experiência?",
        subtitle: "Sua opinião nos ajuda a melhorar.",
        required: true,
        maxRating: 5,
        ratingLabels: { low: "Precisa melhorar", high: "Excelente" },
      },
      {
        id: "thank-you",
        type: "thank-you",
        title: "Parabéns, seu cadastro foi concluído!",
        subtitle: "Entraremos em contato em breve. Obrigado pelo seu tempo.",
        required: false,
        showButton: false,
      },
    ],
  };
}

export default function FormPreviewPage() {
  const form = useMemo(() => getDemoForm(), []);

  return (
    <div className="h-screen w-screen overflow-hidden">
      <FormContainer form={form} />
    </div>
  );
}
