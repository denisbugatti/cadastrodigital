/**
 * FormFlow — Dark Futuristic Design
 * Types and demo data for the conversational form engine.
 * Supports all 28 question types.
 */

export type QuestionType =
  | "welcome"
  | "thank-you"
  | "statement"
  // Text & contact
  | "short-text"
  | "long-text"
  | "email"
  | "phone"
  | "name"
  | "number"
  | "currency"
  | "link"
  // Documents
  | "cpf"
  | "cnpj"
  | "identity-doc"
  // Location
  | "address"
  // Choice
  | "multiple-choice"
  | "multiple-select"
  | "dropdown"
  | "image-choice"
  | "yes-no"
  | "checkbox"
  // Rating & scale
  | "satisfaction"
  | "rating"
  | "nps"
  | "ranking"
  | "matrix"
  // Date
  | "date"
  // Files
  | "file-upload"
  // Legal
  | "legal";

export interface Choice {
  id: string;
  label: string;
  icon?: string;
  imageUrl?: string;
  score?: number;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  subtitle?: string;
  placeholder?: string;
  required?: boolean;
  choices?: Choice[];
  maxRating?: number;
  ratingLabels?: { low: string; high: string };
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  image?: string;
  // Per-question media
  imageUrl?: string;
  iconName?: string;
  motionIconUrl?: string;
  // Welcome/Thank-you specific
  buttonText?: string;
  showButton?: boolean;
  redirectUrl?: string;
  // Legal
  legalText?: string;
  // Matrix
  matrixRows?: string[];
  matrixColumns?: string[];
  // Ranking
  rankItems?: string[];
  // Scoring
  scoringEnabled?: boolean;
  questionScore?: number; // Fixed score for non-choice questions (awarded when answered)
  // Conditional logic
  conditionalLogic?: {
    enabled: boolean;
    branches?: Array<{
      choiceId: string;
      goToQuestionId: string;
    }>;
    rules?: Array<{
      id: string;
      operator: string; // is_answered, is_empty, equals, not_equals, contains, not_contains, greater_than, less_than, greater_equal, less_equal
      value: string;
      goToQuestionId: string;
    }>;
    scoreRules?: Array<{
      id: string;
      scoreMin: number | null; // minimum score (inclusive), null = no lower bound
      scoreMax: number | null; // maximum score (inclusive), null = no upper bound
      goToQuestionId: string;
    }>;
    defaultGoTo?: string;
  };
  // SMS verification for phone questions
  smsVerification?: boolean;
}

export interface FormData {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  theme?: {
    primaryColor?: string;
    accentColor?: string;
  };
  design?: {
    backgroundColor?: string;
    questionColor?: string;
    answerColor?: string;
    buttonColor?: string;
    buttonTextColor?: string;
    fontFamily?: string;
    logoUrl?: string;
    backgroundImage?: string;
    backgroundType?: "solid" | "image" | "webgl";
    webglEffect?: "gradient-flow" | "particles" | "aurora" | "waves" | "mesh-gradient";
    webglIntensity?: number;
  };
  /** Tracking/metrics configuration from webhook settings */
  tracking?: {
    gtm?: { enabled: boolean; containerId: string };
    googleAnalytics?: { enabled: boolean; measurementId: string };
    facebookPixel?: { enabled: boolean; pixelId: string };
    tiktokPixel?: { enabled: boolean; pixelId: string };
  };
  /** Form settings (from database) */
  settings?: {
    smsVerification?: boolean;
  };
  /** Database form ID for response submission (internal use) */
  _dbFormId?: number;
}

export interface FormResponse {
  questionId: string;
  value: string | string[] | number | boolean | Record<string, string> | null;
}

// Demo form data — Pesquisa de Satisfação
export const demoForm: FormData = {
  id: "demo-satisfaction",
  title: "Pesquisa de Satisfação",
  description: "Queremos ouvir você! Sua opinião nos ajuda a melhorar.",
  questions: [
    {
      id: "welcome",
      type: "welcome",
      title: "Queremos ouvir você",
      subtitle:
        "Responda algumas perguntas rápidas e nos ajude a criar uma experiência ainda melhor. Leva menos de 2 minutos.",
      image: "welcome",
    },
    {
      id: "name",
      type: "short-text",
      title: "Para começar, qual é o seu nome?",
      subtitle: "Como gostaria de ser chamado(a)",
      placeholder: "Digite seu nome...",
      required: true,
    },
    {
      id: "email",
      type: "email",
      title: "Qual é o seu e-mail?",
      subtitle: "Prometemos não enviar spam",
      placeholder: "seu@email.com",
      required: true,
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        message: "Por favor, insira um e-mail válido",
      },
    },
    {
      id: "role",
      type: "multiple-choice",
      title: "Qual é a sua área de atuação?",
      subtitle: "Selecione a opção que melhor descreve você",
      required: true,
      choices: [
        { id: "dev", label: "Desenvolvimento", icon: "💻" },
        { id: "design", label: "Design", icon: "🎨" },
        { id: "marketing", label: "Marketing", icon: "📊" },
        { id: "product", label: "Produto", icon: "🚀" },
        { id: "management", label: "Gestão", icon: "📋" },
        { id: "other", label: "Outro", icon: "✨" },
      ],
    },
    {
      id: "experience",
      type: "rating",
      title: "Como você avalia sua experiência geral?",
      subtitle: "De 1 a 5, sendo 5 excelente",
      required: true,
      maxRating: 5,
      ratingLabels: { low: "Precisa melhorar", high: "Excelente" },
    },
    {
      id: "features",
      type: "multiple-select",
      title: "Quais funcionalidades você mais utiliza?",
      subtitle: "Selecione todas que se aplicam",
      required: false,
      choices: [
        { id: "forms", label: "Formulários" },
        { id: "analytics", label: "Análise de dados" },
        { id: "automation", label: "Automações" },
        { id: "integrations", label: "Integrações" },
        { id: "reports", label: "Relatórios" },
        { id: "collaboration", label: "Colaboração em equipe" },
      ],
    },
    {
      id: "recommend",
      type: "yes-no",
      title: "Você recomendaria nosso produto para um colega?",
      subtitle: "Seja honesto(a), sua resposta é anônima",
      required: true,
    },
    {
      id: "feedback",
      type: "long-text",
      title: "Tem algo mais que gostaria de compartilhar?",
      subtitle: "Sugestões, elogios ou críticas — tudo é bem-vindo",
      placeholder: "Escreva aqui seus comentários...",
      required: false,
    },
    {
      id: "thank-you",
      type: "thank-you",
      title: "Obrigado pela sua participação!",
      subtitle:
        "Suas respostas são muito valiosas para nós. Vamos usar seu feedback para melhorar continuamente.",
      image: "thankyou",
    },
  ],
};
