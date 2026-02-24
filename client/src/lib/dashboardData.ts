/**
 * FormFlow — Dark Futuristic Design
 * Dashboard data: user forms, templates, and categories.
 */

export interface UserForm {
  id: string;
  title: string;
  description: string;
  questionsCount: number;
  responsesCount: number;
  status: "published" | "draft" | "closed";
  createdAt: string;
  updatedAt: string;
  color: string;
}

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: TemplateCategory;
  questionsCount: number;
  estimatedTime: string;
  popularity: "trending" | "popular" | "new";
  icon: string;
  color: string;
}

export type TemplateCategory =
  | "all"
  | "feedback"
  | "research"
  | "registration"
  | "quiz"
  | "hr"
  | "marketing";

export const templateCategories: { id: TemplateCategory; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "feedback", label: "Feedback" },
  { id: "research", label: "Pesquisa" },
  { id: "registration", label: "Cadastro" },
  { id: "quiz", label: "Quiz" },
  { id: "hr", label: "RH" },
  { id: "marketing", label: "Marketing" },
];

export const userForms: UserForm[] = [
  {
    id: "form-1",
    title: "Pesquisa de Satisfação",
    description: "Avaliação da experiência do cliente com nosso produto",
    questionsCount: 7,
    responsesCount: 142,
    status: "published",
    createdAt: "2026-02-10",
    updatedAt: "2026-02-22",
    color: "oklch(0.65 0.2 250)",
  },
  {
    id: "form-2",
    title: "Feedback do Evento",
    description: "Coleta de impressões sobre o workshop de inovação",
    questionsCount: 5,
    responsesCount: 38,
    status: "published",
    createdAt: "2026-02-15",
    updatedAt: "2026-02-20",
    color: "oklch(0.75 0.15 195)",
  },
  {
    id: "form-3",
    title: "Onboarding de Clientes",
    description: "Formulário de boas-vindas para novos clientes",
    questionsCount: 10,
    responsesCount: 0,
    status: "draft",
    createdAt: "2026-02-20",
    updatedAt: "2026-02-24",
    color: "oklch(0.55 0.2 290)",
  },
  {
    id: "form-4",
    title: "NPS Trimestral",
    description: "Net Promoter Score — avaliação trimestral",
    questionsCount: 4,
    responsesCount: 256,
    status: "closed",
    createdAt: "2026-01-05",
    updatedAt: "2026-01-31",
    color: "oklch(0.65 0.12 180)",
  },
  {
    id: "form-5",
    title: "Pesquisa de Mercado",
    description: "Análise de preferências e comportamento do consumidor",
    questionsCount: 12,
    responsesCount: 89,
    status: "published",
    createdAt: "2026-02-01",
    updatedAt: "2026-02-18",
    color: "oklch(0.7 0.18 220)",
  },
];

export const formTemplates: FormTemplate[] = [
  {
    id: "tpl-1",
    title: "Pesquisa de Satisfação",
    description: "Meça a satisfação dos seus clientes com perguntas estratégicas",
    category: "feedback",
    questionsCount: 8,
    estimatedTime: "2 min",
    popularity: "trending",
    icon: "star",
    color: "oklch(0.65 0.2 250)",
  },
  {
    id: "tpl-2",
    title: "Formulário de Contato",
    description: "Capture leads e informações de contato de forma elegante",
    category: "registration",
    questionsCount: 5,
    estimatedTime: "1 min",
    popularity: "popular",
    icon: "mail",
    color: "oklch(0.75 0.15 195)",
  },
  {
    id: "tpl-3",
    title: "Quiz de Conhecimento",
    description: "Teste o conhecimento da sua equipe de forma interativa",
    category: "quiz",
    questionsCount: 10,
    estimatedTime: "5 min",
    popularity: "new",
    icon: "brain",
    color: "oklch(0.55 0.2 290)",
  },
  {
    id: "tpl-4",
    title: "Pesquisa de Clima",
    description: "Avalie o clima organizacional e engajamento dos colaboradores",
    category: "hr",
    questionsCount: 15,
    estimatedTime: "4 min",
    popularity: "popular",
    icon: "users",
    color: "oklch(0.65 0.12 180)",
  },
  {
    id: "tpl-5",
    title: "Feedback de Produto",
    description: "Colete insights valiosos sobre seu produto ou serviço",
    category: "feedback",
    questionsCount: 7,
    estimatedTime: "2 min",
    popularity: "trending",
    icon: "message-square",
    color: "oklch(0.7 0.18 220)",
  },
  {
    id: "tpl-6",
    title: "Pesquisa de Mercado",
    description: "Entenda seu público-alvo e tendências do mercado",
    category: "research",
    questionsCount: 12,
    estimatedTime: "3 min",
    popularity: "popular",
    icon: "bar-chart",
    color: "oklch(0.6 0.15 150)",
  },
  {
    id: "tpl-7",
    title: "Inscrição em Evento",
    description: "Gerencie inscrições para eventos e workshops",
    category: "registration",
    questionsCount: 6,
    estimatedTime: "2 min",
    popularity: "new",
    icon: "calendar",
    color: "oklch(0.7 0.2 30)",
  },
  {
    id: "tpl-8",
    title: "Avaliação de Desempenho",
    description: "Avaliação 360° para desenvolvimento profissional",
    category: "hr",
    questionsCount: 20,
    estimatedTime: "6 min",
    popularity: "popular",
    icon: "award",
    color: "oklch(0.65 0.18 80)",
  },
  {
    id: "tpl-9",
    title: "Lead Generation",
    description: "Capture e qualifique leads para seu funil de vendas",
    category: "marketing",
    questionsCount: 6,
    estimatedTime: "1 min",
    popularity: "trending",
    icon: "target",
    color: "oklch(0.6 0.22 340)",
  },
  {
    id: "tpl-10",
    title: "Pesquisa Acadêmica",
    description: "Template otimizado para pesquisas acadêmicas e científicas",
    category: "research",
    questionsCount: 18,
    estimatedTime: "5 min",
    popularity: "new",
    icon: "book-open",
    color: "oklch(0.55 0.15 260)",
  },
];
