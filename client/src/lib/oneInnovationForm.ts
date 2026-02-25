/**
 * FormFlow — One Innovation Cadastro Online
 * Formulário pré-criado idêntico ao Respondi da One Innovation
 * com todas as perguntas, cores, logo e lógica condicional PF/PJ.
 */

import type { BuilderForm, BuilderQuestion } from "./builderTypes";

const ONE_LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310519663342930280/FrkRifsSVZQkhZrL.webp";

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
      title: "Bem vindos ao cadastro Digital",
      subtitle: "Seu cadastro levará 5 minutos para ser concluído.",
      buttonText: "começar",
      showButton: true,
    }),

    // ─── 1. Tipo de pessoa (com lógica condicional) ───
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
          { choiceId: "c_pf", goToQuestionId: "one_q2_nome" },
          { choiceId: "c_pj", goToQuestionId: "one_pj_razao_social" },
        ],
        defaultGoTo: "next",
      },
    }),

    // ═══════════════════════════════════════════════
    // FLUXO PESSOA FÍSICA (PF)
    // ═══════════════════════════════════════════════

    // 2. Nome completo (PF)
    makeQ({
      id: "one_q2_nome",
      type: "name",
      title: "Nome completo",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // 3. CPF (PF) — com validação real
    makeQ({
      id: "one_q3_cpf",
      type: "cpf",
      title: "CPF",
      placeholder: "000.000.000-00",
      required: true,
    }),

    // 4. Data de nascimento (PF)
    makeQ({
      id: "one_q4_nascimento",
      type: "date",
      title: "Data de nascimento",
      placeholder: "DD/MM/AAAA",
      required: true,
    }),

    // 5. Sexo (PF)
    makeQ({
      id: "one_q5_sexo",
      type: "multiple-choice",
      title: "Sexo",
      required: true,
      choices: [
        { id: "c_masc", label: "Masculino" },
        { id: "c_fem", label: "Feminino" },
      ],
    }),

    // 6. Nacionalidade (PF)
    makeQ({
      id: "one_q6_nacionalidade",
      type: "short-text",
      title: "Nacionalidade",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // 7. Estado civil (PF)
    makeQ({
      id: "one_q7_estado_civil",
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

    // 8. Identidade (RG) (PF)
    makeQ({
      id: "one_q8_rg",
      type: "short-text",
      title: "Identidade nº (RG)",
      placeholder: "Um número...",
      required: true,
    }),

    // 9. Órgão expedidor (PF)
    makeQ({
      id: "one_q9_orgao",
      type: "short-text",
      title: "Órgão expedidor",
      placeholder: "Ex: SSP/SP",
      required: true,
    }),

    // 10. E-mail (PF) — pula para perguntas comuns
    makeQ({
      id: "one_q10_email",
      type: "email",
      title: "E-mail",
      placeholder: "seu@email.com",
      required: true,
      conditionalLogic: {
        enabled: false,
        branches: [],
        defaultGoTo: "next",
      },
    }),

    // 11. Telefone / WhatsApp (PF) — vai para perguntas comuns
    makeQ({
      id: "one_q11_telefone",
      type: "phone",
      title: "Telefone / WhatsApp",
      placeholder: "(00) 00000-0000",
      required: true,
    }),

    // 12. Profissão (PF)
    makeQ({
      id: "one_q12_profissao",
      type: "short-text",
      title: "Profissão",
      placeholder: "Sua resposta...",
      required: true,
    }),

    // 13. Renda mensal (PF) — pula para perguntas comuns (endereço)
    makeQ({
      id: "one_q13_renda",
      type: "multiple-choice",
      title: "Faixa de renda mensal",
      required: true,
      choices: [
        { id: "c_r1", label: "Até R$ 5.000" },
        { id: "c_r2", label: "R$ 5.000 a R$ 10.000" },
        { id: "c_r3", label: "R$ 10.000 a R$ 20.000" },
        { id: "c_r4", label: "R$ 20.000 a R$ 50.000" },
        { id: "c_r5", label: "Acima de R$ 50.000" },
      ],
      // After renda, skip PJ section and go to common endereço
      conditionalLogic: {
        enabled: true,
        branches: [
          { choiceId: "c_r1", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_r2", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_r3", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_r4", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_r5", goToQuestionId: "one_common_endereco" },
        ],
        defaultGoTo: "next",
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

    // PJ-8. Faturamento mensal — after this, go to common section (endereço)
    makeQ({
      id: "one_pj_faturamento",
      type: "multiple-choice",
      title: "Faixa de faturamento mensal",
      required: true,
      choices: [
        { id: "c_fat1", label: "Até R$ 50.000" },
        { id: "c_fat2", label: "R$ 50.000 a R$ 200.000" },
        { id: "c_fat3", label: "R$ 200.000 a R$ 500.000" },
        { id: "c_fat4", label: "R$ 500.000 a R$ 1.000.000" },
        { id: "c_fat5", label: "Acima de R$ 1.000.000" },
      ],
      // After faturamento, jump to common endereço section
      conditionalLogic: {
        enabled: true,
        branches: [
          { choiceId: "c_fat1", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_fat2", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_fat3", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_fat4", goToQuestionId: "one_common_endereco" },
          { choiceId: "c_fat5", goToQuestionId: "one_common_endereco" },
        ],
        defaultGoTo: "next",
      },
    }),

    // ═══════════════════════════════════════════════
    // PERGUNTAS COMUNS (PF e PJ convergem aqui)
    // ═══════════════════════════════════════════════

    // 14. Endereço
    makeQ({
      id: "one_common_endereco",
      type: "address",
      title: "Endereço",
      placeholder: "Digite o CEP...",
      required: true,
    }),

    // 15. Empreendimento de interesse
    makeQ({
      id: "one_common_empreendimento",
      type: "multiple-choice",
      title: "Qual empreendimento você tem interesse?",
      required: true,
      choices: [
        { id: "c_emp1", label: "One Innovation" },
        { id: "c_emp2", label: "One Tower" },
        { id: "c_emp3", label: "One Residence" },
        { id: "c_emp4", label: "Outro" },
      ],
    }),

    // 16. Como conheceu
    makeQ({
      id: "one_common_como_conheceu",
      type: "multiple-choice",
      title: "Como você conheceu a One Innovation?",
      required: false,
      choices: [
        { id: "c_ck1", label: "Redes Sociais" },
        { id: "c_ck2", label: "Indicação de amigo" },
        { id: "c_ck3", label: "Google" },
        { id: "c_ck4", label: "Corretor" },
        { id: "c_ck5", label: "Evento" },
        { id: "c_ck6", label: "Outro" },
      ],
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
      questionColor: "#FFFFFF",
      answerColor: "#FFFFFF",
      backgroundColor: "#0D8BD9",
      backgroundImage: "",
      logoUrl: ONE_LOGO_URL,
      ogTitle: "Cadastro Online | One Innovation",
      ogDescription: "Seu cadastro levará 5 minutos para ser concluído.",
      ogImage: "",
      fontFamily: "Plus Jakarta Sans",
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
