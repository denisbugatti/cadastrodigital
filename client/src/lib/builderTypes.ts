/**
 * FormFlow Builder — Types & Data
 * 28 question types organized by category, with conditional logic support.
 */

// ─── Question Type Definitions ───

export type BuilderQuestionType =
  // Contact Info
  | "name"
  | "email"
  | "phone"
  | "cpf"
  | "cnpj"
  | "identity-doc"
  | "address"
  // Text & Content
  | "short-text"
  | "long-text"
  | "statement"
  | "number"
  | "currency"
  | "link"
  // Choice & Selection
  | "multiple-choice"
  | "dropdown"
  | "image-choice"
  | "yes-no"
  | "checkbox"
  // Rating & Scale
  | "satisfaction"
  | "rating"
  | "nps"
  | "ranking"
  | "matrix"
  // Date
  | "date"
  // Media
  | "file-upload"
  // Special Screens
  | "welcome"
  | "thank-you"
  | "legal";

export interface QuestionTypeInfo {
  type: BuilderQuestionType;
  label: string;
  icon: string; // lucide icon name
  description: string;
  category: QuestionCategory;
  hasChoices?: boolean;
  hasConditionalLogic?: boolean;
}

export type QuestionCategory =
  | "contact"
  | "text"
  | "choice"
  | "rating"
  | "date"
  | "media"
  | "special";

export interface CategoryInfo {
  id: QuestionCategory;
  label: string;
  icon: string;
}

// ─── Builder Question (instance in the form) ───

export interface ConditionalBranch {
  choiceId: string;
  goToQuestionId: string; // "next" = default next, or question ID
}

// Condition-based rules for non-choice questions (text, number, email, etc.)
export type ConditionOperator =
  | "is_answered"    // any non-empty value
  | "is_empty"       // no value
  | "equals"         // exact match (case-insensitive)
  | "not_equals"     // not equal
  | "contains"       // text contains substring
  | "not_contains"   // text does not contain
  | "greater_than"   // numeric comparison
  | "less_than"      // numeric comparison
  | "greater_equal"  // numeric comparison
  | "less_equal";    // numeric comparison

export interface ConditionalRule {
  id: string;
  operator: ConditionOperator;
  value: string; // comparison value (empty for is_answered/is_empty)
  goToQuestionId: string;
}

// Score-based conditional rule: jump based on accumulated total score
export interface ScoreRule {
  id: string;
  scoreMin: number | null; // minimum score (inclusive), null = no lower bound
  scoreMax: number | null; // maximum score (inclusive), null = no upper bound
  goToQuestionId: string;
}

export interface ConditionalLogic {
  enabled: boolean;
  branches: ConditionalBranch[]; // for choice-based questions
  rules: ConditionalRule[];       // for non-choice questions (condition-based)
  scoreRules: ScoreRule[];        // score-based rules (evaluated on accumulated score)
  defaultGoTo: string; // "next" or question ID
}

export interface MatrixConfig {
  rows: string[];
  columns: string[];
}

export interface BuilderQuestion {
  id: string;
  type: BuilderQuestionType;
  title: string;
  subtitle: string;
  placeholder: string;
  required: boolean;
  // Choice-based fields
  choices: BuilderChoice[];
  // Rating fields
  maxRating: number;
  ratingLabels: { low: string; high: string };
  // NPS fields
  npsLabels: { low: string; mid: string; high: string };
  // Matrix
  matrix: MatrixConfig;
  // Ranking
  rankItems: string[];
  // Validation
  validation: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
  // Conditional logic (for multiple-choice, yes-no, dropdown)
  conditionalLogic: ConditionalLogic;
  // Image for welcome/thank-you
  image: string;
  // Per-question media
  imageUrl: string;
  iconName: string; // lucide icon name or empty
  motionIconUrl: string; // URL to animated icon (Motion/Lordicon etc)
  // Welcome/Thank-you specific
  buttonText: string;
  showButton: boolean;
  redirectUrl: string;
  // Scoring
  scoringEnabled: boolean;
  questionScore: number; // Fixed score for non-choice questions (awarded when answered)
  // Legal text
  legalText: string;
  // Address fields config
  addressFields: {
    cep: boolean;
    street: boolean;
    number: boolean;
    complement: boolean;
    neighborhood: boolean;
    city: boolean;
    state: boolean;
  };
}

export interface BuilderChoice {
  id: string;
  label: string;
  imageUrl?: string; // for image-choice
  score?: number; // scoring points for this option
}

// ─── Design Settings ───

export type BackgroundType = "solid" | "image" | "webgl";
export type WebGLEffect = "gradient-flow" | "particles" | "aurora" | "waves" | "mesh-gradient";

export interface FormDesignSettings {
  // Colors
  buttonColor: string;
  buttonTextColor: string;
  questionColor: string;
  answerColor: string;
  backgroundColor: string;
  // Background
  backgroundType: BackgroundType;
  backgroundImage: string;
  webglEffect: WebGLEffect;
  webglIntensity: number; // 0-100
  // Media
  logoUrl: string;
  // Open Graph (social sharing)
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  // Font
  fontFamily: string;
}

// ─── Webhook Settings ───

export interface WebhookSettings {
  enabled: boolean;
  url: string;
  method: "POST" | "PUT";
  headers: { key: string; value: string }[];
  sendOnComplete: boolean;
  sendOnPartial: boolean;
  // Integrations
  integrations?: {
    rdStation?: {
      enabled: boolean;
      apiToken: string;
      conversionIdentifier: string;
    };
    whatsapp?: {
      enabled: boolean;
      phoneNumber: string;
      message: string;
    };
    email?: {
      enabled: boolean;
      recipients: string;
      subject: string;
    };
    googleSheets?: {
      enabled: boolean;
      spreadsheetUrl: string;
      sheetName: string;
    };
    crmManus?: {
      enabled: boolean;
      webhookUrl: string;
      funnelName: string;
      stageName: string;
    };
  };
  // Métricas e conversões (tracking pixels)
  tracking?: {
    gtm?: {
      enabled: boolean;
      containerId: string; // GTM-XXXXXXX
    };
    googleAnalytics?: {
      enabled: boolean;
      measurementId: string; // G-XXXXXXXXXX
    };
    facebookPixel?: {
      enabled: boolean;
      pixelId: string;
    };
    tiktokPixel?: {
      enabled: boolean;
      pixelId: string; // TikTok Events Manager ID
    };
  };
}

// ─── Sharing / Embed Settings ───

export type EmbedMode = "normal" | "fullscreen" | "button-link" | "button-popup";

export interface SharingSettings {
  slug: string; // URL slug for the form
  isPublished: boolean;
  embedMode: EmbedMode;
  embedWidth: string;
  embedHeight: string;
  embedButtonText: string;
  embedButtonColor: string;
}

// ─── Workspace (folder with custom domain) ───

export interface Workspace {
  id: string;
  name: string;
  domain: string; // e.g. "denisbugatti.com.br"
  description: string;
  designDefaults: FormDesignSettings;
  formIds: string[];
  createdAt: string;
}

export interface BuilderForm {
  id: string;
  title: string;
  description: string;
  questions: BuilderQuestion[];
  design: FormDesignSettings;
  webhook: WebhookSettings;
  sharing: SharingSettings;
  workspaceId: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Category Data ───

export const questionCategories: CategoryInfo[] = [
  { id: "contact", label: "Informações de Contato", icon: "user" },
  { id: "text", label: "Texto e Conteúdo", icon: "type" },
  { id: "choice", label: "Escolha e Seleção", icon: "list" },
  { id: "rating", label: "Avaliação e Escala", icon: "star" },
  { id: "date", label: "Data", icon: "calendar" },
  { id: "media", label: "Mídia e Arquivos", icon: "paperclip" },
  { id: "special", label: "Telas Especiais", icon: "layout" },
];

// ─── All 28 Question Types ───

export const questionTypes: QuestionTypeInfo[] = [
  // Contact Info
  { type: "name", label: "Nome próprio", icon: "user", description: "Campo para nome completo", category: "contact", hasConditionalLogic: true },
  { type: "email", label: "E-mail", icon: "mail", description: "Campo com validação de e-mail", category: "contact", hasConditionalLogic: true },
  { type: "phone", label: "Telefone", icon: "phone", description: "Campo com máscara de telefone", category: "contact", hasConditionalLogic: true },
  { type: "cpf", label: "CPF", icon: "fingerprint", description: "Com validação real de CPF", category: "contact", hasConditionalLogic: true },
  { type: "cnpj", label: "CNPJ", icon: "building-2", description: "Com validação de CNPJ", category: "contact", hasConditionalLogic: true },
  { type: "identity-doc", label: "Documento de Identidade", icon: "id-card", description: "RG ou outro documento", category: "contact", hasConditionalLogic: true },
  { type: "address", label: "Endereço", icon: "map-pin", description: "Busca automática por CEP", category: "contact", hasConditionalLogic: true },
  // Text & Content
  { type: "short-text", label: "Resposta curta", icon: "minus", description: "Texto de uma linha", category: "text", hasConditionalLogic: true },
  { type: "long-text", label: "Texto longo", icon: "align-left", description: "Área de texto expandida", category: "text", hasConditionalLogic: true },
  { type: "statement", label: "Mensagem", icon: "message-square", description: "Tela informativa sem input", category: "text" },
  { type: "number", label: "Número", icon: "hash", description: "Campo numérico", category: "text", hasConditionalLogic: true },
  { type: "currency", label: "Valor Monetário", icon: "dollar-sign", description: "Campo com máscara R$", category: "text", hasConditionalLogic: true },
  { type: "link", label: "Link / Website", icon: "link", description: "Campo para URL", category: "text", hasConditionalLogic: true },
  // Choice & Selection
  { type: "multiple-choice", label: "Múltipla Escolha", icon: "circle-dot", description: "Selecionar uma opção", category: "choice", hasChoices: true, hasConditionalLogic: true },
  { type: "dropdown", label: "Seleção de Lista", icon: "chevron-down", description: "Lista suspensa", category: "choice", hasChoices: true, hasConditionalLogic: true },
  { type: "image-choice", label: "Seleção de Imagem", icon: "image", description: "Opções com imagens", category: "choice", hasChoices: true, hasConditionalLogic: true },
  { type: "yes-no", label: "Sim / Não", icon: "toggle-left", description: "Pergunta binária", category: "choice", hasConditionalLogic: true },
  { type: "checkbox", label: "Checkbox", icon: "check-square", description: "Marcar múltiplas opções", category: "choice", hasChoices: true, hasConditionalLogic: true },
  // Rating & Scale
  { type: "satisfaction", label: "Escala de Satisfação", icon: "smile", description: "Escala visual com emojis", category: "rating", hasConditionalLogic: true },
  { type: "rating", label: "Rating (Estrelas)", icon: "star", description: "Avaliação com estrelas", category: "rating", hasConditionalLogic: true },
  { type: "nps", label: "NPS", icon: "gauge", description: "Net Promoter Score (0-10)", category: "rating", hasConditionalLogic: true },
  { type: "ranking", label: "Ranking", icon: "arrow-up-down", description: "Ordenar por preferência", category: "rating", hasConditionalLogic: true },
  { type: "matrix", label: "Matrix", icon: "grid-3x3", description: "Tabela de avaliação", category: "rating", hasConditionalLogic: true },
  // Date
  { type: "date", label: "Data", icon: "calendar", description: "Seletor de data", category: "date", hasConditionalLogic: true },
  // Media
  { type: "file-upload", label: "Arquivo Anexo", icon: "upload", description: "Upload de arquivos", category: "media", hasConditionalLogic: true },
  // Special Screens
  { type: "welcome", label: "Boas-vindas", icon: "hand", description: "Tela inicial do formulário", category: "special" },
  { type: "thank-you", label: "Agradecimento", icon: "heart", description: "Tela final após envio", category: "special" },
  { type: "legal", label: "Termos de Uso", icon: "shield-check", description: "Aceite de termos obrigatório", category: "special", hasConditionalLogic: true },
];

// ─── Helper: Create a new question with defaults ───

let questionCounter = 0;

export function createDefaultQuestion(type: BuilderQuestionType): BuilderQuestion {
  questionCounter++;
  const _typeInfo = questionTypes.find((t) => t.type === type)!;
  const id = `q_${Date.now()}_${questionCounter}`;

  const base: BuilderQuestion = {
    id,
    type,
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
    conditionalLogic: { enabled: false, branches: [], rules: [], scoreRules: [], defaultGoTo: "next" },
    image: "",
    imageUrl: "",
    iconName: "",
    motionIconUrl: "",
    buttonText: "Continuar",
    showButton: true,
    redirectUrl: "",
    scoringEnabled: false,
    questionScore: 0,
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

  // Set sensible defaults per type
  switch (type) {
    case "name":
      base.title = "Qual é o seu nome?";
      base.placeholder = "Digite seu nome completo...";
      base.required = true;
      break;
    case "email":
      base.title = "Qual é o seu e-mail?";
      base.placeholder = "seu@email.com";
      base.required = true;
      break;
    case "phone":
      base.title = "Qual é o seu telefone?";
      base.placeholder = "(00) 00000-0000";
      base.required = true;
      break;
    case "cpf":
      base.title = "Qual é o seu CPF?";
      base.placeholder = "000.000.000-00";
      base.required = true;
      break;
    case "cnpj":
      base.title = "Qual é o CNPJ da empresa?";
      base.placeholder = "00.000.000/0000-00";
      base.required = true;
      break;
    case "identity-doc":
      base.title = "Qual é o seu documento de identidade?";
      base.placeholder = "Digite o número do documento...";
      break;
    case "address":
      base.title = "Qual é o seu endereço?";
      base.placeholder = "Digite o CEP...";
      base.required = true;
      break;
    case "short-text":
      base.title = "Sua pergunta aqui";
      base.placeholder = "Digite sua resposta...";
      break;
    case "long-text":
      base.title = "Sua pergunta aqui";
      base.placeholder = "Escreva sua resposta...";
      break;
    case "statement":
      base.title = "Sua mensagem aqui";
      base.subtitle = "Texto informativo para o respondente";
      break;
    case "number":
      base.title = "Digite um número";
      base.placeholder = "0";
      break;
    case "currency":
      base.title = "Qual é o valor?";
      base.placeholder = "R$ 0,00";
      break;
    case "link":
      base.title = "Compartilhe um link";
      base.placeholder = "https://...";
      break;
    case "multiple-choice":
      base.title = "Escolha uma opção";
      base.choices = [
        { id: `c_${Date.now()}_1`, label: "Opção 1" },
        { id: `c_${Date.now()}_2`, label: "Opção 2" },
        { id: `c_${Date.now()}_3`, label: "Opção 3" },
      ];
      break;
    case "dropdown":
      base.title = "Selecione uma opção";
      base.choices = [
        { id: `c_${Date.now()}_1`, label: "Opção 1" },
        { id: `c_${Date.now()}_2`, label: "Opção 2" },
        { id: `c_${Date.now()}_3`, label: "Opção 3" },
      ];
      break;
    case "image-choice":
      base.title = "Escolha uma imagem";
      base.choices = [
        { id: `c_${Date.now()}_1`, label: "Opção 1", imageUrl: "" },
        { id: `c_${Date.now()}_2`, label: "Opção 2", imageUrl: "" },
      ];
      break;
    case "yes-no":
      base.title = "Sua pergunta sim ou não";
      break;
    case "checkbox":
      base.title = "Selecione todas que se aplicam";
      base.choices = [
        { id: `c_${Date.now()}_1`, label: "Opção 1" },
        { id: `c_${Date.now()}_2`, label: "Opção 2" },
        { id: `c_${Date.now()}_3`, label: "Opção 3" },
      ];
      break;
    case "satisfaction":
      base.title = "Qual é o seu nível de satisfação?";
      base.maxRating = 5;
      break;
    case "rating":
      base.title = "Como você avalia?";
      base.maxRating = 5;
      break;
    case "nps":
      base.title = "De 0 a 10, o quanto você recomendaria?";
      break;
    case "ranking":
      base.title = "Ordene por preferência";
      base.rankItems = ["Item 1", "Item 2", "Item 3"];
      break;
    case "matrix":
      base.title = "Avalie cada item";
      break;
    case "date":
      base.title = "Selecione uma data";
      base.placeholder = "DD/MM/AAAA";
      break;
    case "file-upload":
      base.title = "Envie seu arquivo";
      base.subtitle = "Arraste ou clique para enviar";
      break;
    case "welcome":
      base.title = "Bem-vindo!";
      base.subtitle = "Responda algumas perguntas rápidas.";
      base.buttonText = "Começar";
      base.showButton = true;
      break;
    case "thank-you":
      base.title = "Obrigado!";
      base.subtitle = "Suas respostas foram enviadas com sucesso.";
      base.buttonText = "Enviar outra resposta";
      base.showButton = false;
      base.redirectUrl = "";
      break;
    case "legal":
      base.title = "Termos de Uso";
      base.legalText = "Li e aceito os termos de uso e a política de privacidade.";
      base.required = true;
      break;
  }

  return base;
}

// ─── Helper: Create a new empty form ───

export const defaultDesignSettings: FormDesignSettings = {
  buttonColor: "#3B82F6",
  buttonTextColor: "#FFFFFF",
  questionColor: "#1E293B",
  answerColor: "#3B82F6",
  backgroundColor: "#FFFFFF",
  backgroundType: "solid",
  backgroundImage: "",
  webglEffect: "gradient-flow",
  webglIntensity: 50,
  logoUrl: "",
  ogTitle: "",
  ogDescription: "",
  ogImage: "",
  fontFamily: "Plus Jakarta Sans",
};

export const defaultWebhookSettings: WebhookSettings = {
  enabled: false,
  url: "",
  method: "POST",
  headers: [],
  sendOnComplete: true,
  sendOnPartial: false,
  integrations: {
    rdStation: { enabled: false, apiToken: "", conversionIdentifier: "" },
    whatsapp: { enabled: false, phoneNumber: "", message: "Nova resposta recebida no formulário!" },
    email: { enabled: false, recipients: "", subject: "Nova resposta no formulário" },
    googleSheets: { enabled: false, spreadsheetUrl: "", sheetName: "Respostas" },
    crmManus: { enabled: false, webhookUrl: "", funnelName: "", stageName: "" },
  },
  tracking: {
    gtm: { enabled: false, containerId: "" },
    googleAnalytics: { enabled: false, measurementId: "" },
    facebookPixel: { enabled: false, pixelId: "" },
    tiktokPixel: { enabled: false, pixelId: "" },
  },
};

export const defaultSharingSettings: SharingSettings = {
  slug: "",
  isPublished: false,
  embedMode: "normal",
  embedWidth: "100",
  embedHeight: "600",
  embedButtonText: "Responder formulário",
  embedButtonColor: "#3B82F6",
};

export function createEmptyForm(): BuilderForm {
  const welcomeQ = createDefaultQuestion("welcome");
  const thankYouQ = createDefaultQuestion("thank-you");
  const slug = `form-${Date.now().toString(36)}`;

  return {
    id: `form_${Date.now()}`,
    title: "Novo Formulário",
    description: "",
    questions: [welcomeQ, thankYouQ],
    design: { ...defaultDesignSettings },
    webhook: { ...defaultWebhookSettings },
    sharing: { ...defaultSharingSettings, slug },
    workspaceId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

// ─── Sample Workspaces ───

export const sampleWorkspaces: Workspace[] = [
  {
    id: "ws_1",
    name: "Denis Bugatti",
    domain: "denisbugatti.com.br",
    description: "Formulários do Denis",
    designDefaults: { ...defaultDesignSettings },
    formIds: ["form_1", "form_2"],
    createdAt: new Date().toISOString(),
  },
  {
    id: "ws_2",
    name: "Felipe Galvão",
    domain: "felipegalvao.com.br",
    description: "Formulários do Felipe",
    designDefaults: { ...defaultDesignSettings, buttonColor: "#10B981" },
    formIds: ["form_3"],
    createdAt: new Date().toISOString(),
  },
];
