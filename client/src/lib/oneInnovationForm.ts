/**
 * FormFlow — One Innovation Cadastro Online
 * Formulário pré-criado idêntico ao Respondi da One Innovation
 * com todas as perguntas, cores, logo e lógica condicional PF/PJ.
 *
 * Ordem e tipos replicados fielmente do original:
 * https://one.cadastroonline.com.br/vNdwk1kr
 */

import type { BuilderForm, BuilderQuestion } from "./builderTypes";

const ONE_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663342930280/idQysuOkKZvswPXU.png";

function makeQ(overrides: Partial<BuilderQuestion> & { id: string; type: BuilderQuestion["type"]; title: string }): BuilderQuestion {
  return {
    subtitle: "",
    placeholder: "",
    required: false,
    choices: [],
    maxRating: 5,
    ratingLabels: { low: "Ruim", high: "Excelente" },
    npsLabels: { low: "Nada provável", mid: "Neutro", high: "Muito provável" },
    matrix: { rows: [], columns: [] },
    rankItems: [],
    validation: {},
    conditionalLogic: { enabled: false, branches: [], defaultGoTo: "next" },
    image: "",
    imageUrl: "",
    iconName: "",
    motionIconUrl: "",
    buttonText: "Avançar",
    showButton: true,
    redirectUrl: "",
    scoringEnabled: false,
    questionScore: 0,
    legalText: "",
    addressFields: {
      cep: true, street: true, number: true, complement: true,
      neighborhood: true, city: true, state: true,
    },
    ...overrides,
  };
}

export function createOneInnovationForm(): BuilderForm {
  const questions: BuilderQuestion[] = [
    // ─── Welcome ───
    makeQ({
      id: "one_welcome",
      type: "welcome",
      title: "Bem vindos ao cadastro online",
      subtitle: "Seu cadastro levará 5 minutos para ser concluído.",
      buttonText: "Começar",
      showButton: true,
    }),

    // ─── 1. Tipo de pessoa (com lógica condicional PF/PJ) ───
    makeQ({
      id: "one_q1",
      type: "multiple-choice",
      title: "Você pretende fazer essa aquisição como:",
      required: true,
      choices: [
        { id: "c_pf", label: "Pessoa Física (CPF)" },
        { id: "c_pj", label: "Pessoa Jurídica (CNPJ)" },
      ],
      conditionalLogic: {
        enabled: true,
        branches: [
          { choiceId: "c_pf", goToQuestionId: "one_pf_nome" },
          { choiceId: "c_pj", goToQuestionId: "one_pj_razao_social" },
        ],
        defaultGoTo: "next",
      },
    }),

    // ═══════════════════════════════════════════════
    // FLUXO PESSOA FÍSICA (PF) — ordem idêntica ao Respondi
    // ═══════════════════════════════════════════════

    // PF-1. Nome completo
    makeQ({
      id: "one_pf_nome",
      type: "name",
      title: "Nome completo",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // PF-2. CPF (com validação real de dígito verificador)
    makeQ({
      id: "one_pf_cpf",
      type: "cpf",
      title: "CPF",
      placeholder: "000.000.000-00",
      required: true,
    }),

    // PF-3. Data de nascimento
    makeQ({
      id: "one_pf_nascimento",
      type: "date",
      title: "Data de nascimento",
      placeholder: "DD/MM/AAAA",
      required: true,
    }),

    // PF-4. Sexo
    makeQ({
      id: "one_pf_sexo",
      type: "multiple-choice",
      title: "Sexo",
      required: true,
      choices: [
        { id: "c_masc", label: "Masculino" },
        { id: "c_fem", label: "Feminino" },
      ],
    }),

    // PF-5. Nacionalidade
    makeQ({
      id: "one_pf_nacionalidade",
      type: "short-text",
      title: "Nacionalidade",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // PF-6. Estado civil (8 opções como no original)
    makeQ({
      id: "one_pf_estado_civil",
      type: "multiple-choice",
      title: "Estado civil",
      required: true,
      choices: [
        { id: "c_solteiro", label: "Solteiro(a)" },
        { id: "c_casado_ue", label: "Casado(a) (União estável)" },
        { id: "c_casado_st", label: "Casado(a) (separação total)" },
        { id: "c_casado_ct", label: "Casado(a) (comunhão total)" },
        { id: "c_casado_cp", label: "Casado(a) (comunhão parcial)" },
        { id: "c_separado", label: "Separado(a) judicialmente" },
        { id: "c_divorciado", label: "Divorciado(a)" },
        { id: "c_viuvo", label: "Viúvo(a)" },
      ],
    }),

    // PF-7. Identidade (RG)
    makeQ({
      id: "one_pf_rg",
      type: "number",
      title: "Identidade nº (RG)",
      placeholder: "Um número...",
      required: true,
    }),

    // PF-8. Celular (com seletor de país)
    makeQ({
      id: "one_pf_celular",
      type: "phone",
      title: "Celular",
      placeholder: "(00) 00000-0000",
      required: true,
    }),

    // PF-9. E-mail
    makeQ({
      id: "one_pf_email",
      type: "email",
      title: "E-mail",
      placeholder: "exemplo@exemplo.com",
      required: true,
    }),

    // PF-10. Endereço residencial (CEP com busca automática)
    makeQ({
      id: "one_pf_endereco",
      type: "address",
      title: "Endereço residencial",
      placeholder: "CEP",
      required: true,
    }),

    // PF-11. Profissão
    makeQ({
      id: "one_pf_profissao",
      type: "short-text",
      title: "Profissão",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // PF-12. Renda mensal (campo currency R$, NÃO múltipla escolha)
    makeQ({
      id: "one_pf_renda",
      type: "currency",
      title: "Renda mensal: R$",
      placeholder: "0,00",
      required: true,
      // Após renda, pular PJ e ir para Check List de documentos
      conditionalLogic: {
        enabled: true,
        branches: [],
        defaultGoTo: "one_common_checklist",
      },
    }),

    // ═══════════════════════════════════════════════
    // FLUXO PESSOA JURÍDICA (PJ)
    // ═══════════════════════════════════════════════

    // PJ-1. Razão Social
    makeQ({
      id: "one_pj_razao_social",
      type: "short-text",
      title: "Razão Social da empresa",
      placeholder: "Nome da empresa...",
      required: true,
    }),

    // PJ-2. Nome Fantasia
    makeQ({
      id: "one_pj_nome_fantasia",
      type: "short-text",
      title: "Nome Fantasia",
      placeholder: "Nome fantasia...",
      required: false,
    }),

    // PJ-3. CNPJ (com validação real)
    makeQ({
      id: "one_pj_cnpj",
      type: "cnpj",
      title: "CNPJ",
      placeholder: "00.000.000/0000-00",
      required: true,
    }),

    // PJ-4. Nome do representante legal
    makeQ({
      id: "one_pj_representante",
      type: "name",
      title: "Nome do representante legal",
      placeholder: "Nome completo...",
      required: true,
    }),

    // PJ-5. CPF do representante
    makeQ({
      id: "one_pj_cpf_rep",
      type: "cpf",
      title: "CPF do representante legal",
      placeholder: "000.000.000-00",
      required: true,
    }),

    // PJ-6. E-mail corporativo
    makeQ({
      id: "one_pj_email",
      type: "email",
      title: "E-mail corporativo",
      placeholder: "contato@empresa.com",
      required: true,
    }),

    // PJ-7. Telefone da empresa
    makeQ({
      id: "one_pj_telefone",
      type: "phone",
      title: "Telefone da empresa",
      placeholder: "(00) 00000-0000",
      required: true,
    }),

    // PJ-8. Faturamento mensal (currency, não múltipla escolha)
    makeQ({
      id: "one_pj_faturamento",
      type: "currency",
      title: "Faturamento mensal: R$",
      placeholder: "0,00",
      required: true,
    }),

    // ═══════════════════════════════════════════════
    // PERGUNTAS COMUNS (PF e PJ convergem aqui)
    // ═══════════════════════════════════════════════

    // Check List de documentos (statement)
    makeQ({
      id: "one_common_checklist",
      type: "statement",
      title: "Check List de documentos",
      subtitle: "",
      buttonText: "Subir documentos →",
      showButton: true,
    }),

    // Upload CNH (obrigatório)
    makeQ({
      id: "one_common_cnh",
      type: "file-upload",
      title: "CNH",
      required: true,
    }),

    // Upload RG Frente
    makeQ({
      id: "one_common_rg_frente",
      type: "file-upload",
      title: "RG (Frente)",
      required: false,
    }),

    // Upload RG Verso
    makeQ({
      id: "one_common_rg_verso",
      type: "file-upload",
      title: "RG (Verso)",
      required: false,
    }),

    // Upload Comprovante de Renda
    makeQ({
      id: "one_common_comp_renda",
      type: "file-upload",
      title: "Comprovante de Renda",
      required: false,
    }),

    // Upload Comprovante de Residência
    makeQ({
      id: "one_common_comp_residencia",
      type: "file-upload",
      title: "Comprovante de Residência",
      required: false,
    }),

    // ─── Thank You ───
    makeQ({
      id: "one_thankyou",
      type: "thank-you",
      title: "Parabéns, seu cadastro foi concluído!",
      subtitle: "Em breve entraremos em contato. Obrigado por escolher a One Innovation.",
      buttonText: "Enviar outra resposta",
      showButton: false,
      redirectUrl: "",
    }),
  ];

  return {
    id: "one_innovation_form",
    title: "Cadastro Online - One Innovation",
    description: "Cadastro digital para aquisição de imóveis",
    questions,
    design: {
      buttonColor: "#FFFFFF",
      buttonTextColor: "#0D8BD9",
      questionColor: "#FFFFFF",
      answerColor: "#FFFFFF",
      backgroundColor: "#0D8BD9",
      backgroundImage: "",
      logoUrl: ONE_LOGO_URL,
      ogTitle: "Cadastro Online | One Innovation",
      ogDescription: "Seu cadastro levará 5 minutos para ser concluído.",
      ogImage: "",
      fontFamily: "Inter",
    },
    webhook: {
      enabled: false,
      url: "",
      method: "POST",
      headers: [],
      sendOnComplete: true,
      sendOnPartial: false,
    },
    sharing: {
      slug: "one-innovation-cadastro",
      isPublished: true,
      embedMode: "normal",
      embedWidth: "100",
      embedHeight: "600",
      embedButtonText: "Preencher cadastro",
      embedButtonColor: "#0D8BD9",
    },
    workspaceId: null,
    createdAt: "2026-02-15T10:00:00.000Z",
    updatedAt: "2026-02-24T18:00:00.000Z",
  };
}
