/**
 * FormFlow Dashboard Data
 * User forms data for the dashboard.
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
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export const defaultFolders: Folder[] = [
  { id: "folder-imobiliario", name: "Imobiliário", color: "#0D8BD9", createdAt: "2026-02-01" },
  { id: "folder-pesquisas", name: "Pesquisas", color: "#22c55e", createdAt: "2026-02-05" },
];

export const userForms: UserForm[] = [
  {
    id: "one_innovation_form",
    title: "Cadastro Online - One Innovation",
    description: "Cadastro digital para aquisição de imóveis",
    questionsCount: 16,
    responsesCount: 324,
    status: "published",
    createdAt: "2026-02-15",
    updatedAt: "2026-02-24",
    color: "#0D8BD9",
    folderId: "folder-imobiliario",
  },
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
    folderId: "folder-pesquisas",
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
    folderId: "folder-pesquisas",
  },
];
