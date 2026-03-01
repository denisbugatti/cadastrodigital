# FormFlow - Melhorias v3

## Editor Estilo Typeform (3 colunas)
- [ ] Redesign do Builder.tsx para layout 3 colunas: sidebar perguntas | preview central | painel configurações
- [ ] Sidebar esquerda: lista de perguntas com ícones de tipo, drag-and-drop, botão "+ Add content"
- [ ] Centro: preview live da pergunta selecionada (editável inline)
- [ ] Direita: painel de configurações (tipo de resposta, branching, obrigatório, etc.)

## Visual do Formulário (Preview/Respondente)
- [x] Bordas dos botões de múltipla escolha → brancas (rgba 0.5→0.7, hover 0.9)
- [x] Melhorar contraste geral — bordas mais visíveis em MultipleChoice, MultipleSelect, YesNo
- [x] Motion/animações suaves ao mudar de pergunta (slide + fade) — já implementado
- [x] Barra de progresso "Pergunta X de Y" no topo esquerdo do formulário
- [x] Botão voltar (seta para cima) funcional — já implementado

## Tipo Capa/Statement
- [ ] Adicionar tipo "statement" ao builder (pergunta divisória com título + descrição + botão continuar)
- [ ] Redesign visual do statement/capa — mais elegante, com ícone ou imagem opcional
- [ ] Atualizar o Check List do One Innovation para usar o novo visual

## Gráficos na Aba Respostas
- [x] Gráfico de pizza: distribuição por pergunta selecionável (recharts PieChart donut)
- [x] Gráfico de barras: respostas por dia últimos 14 dias (recharts BarChart)
- [x] Componente ResponseCharts integrado na aba de Respostas

## Duplicar Formulário
- [ ] Botão de duplicar/clonar formulário no dashboard

## Salvar Respostas Parciais
- [x] Salvar progresso no localStorage ao responder — já implementado
- [x] Ao reabrir o formulário, restaura automaticamente de onde parou — já implementado
- [x] Limpar dados salvos ao completar o formulário — já implementado

## Full-Stack Migration (Database + S3)
- [x] Create database schema (forms, questions, responses, versions, files)
- [x] Create backend API routes (forms CRUD, responses, file uploads)
- [x] Update frontend to use tRPC API instead of localStorage
- [x] Integrate S3 file storage for form file uploads
- [x] Test full-stack integration (28 tests passing)

## Remover Login
- [x] Remover página de login e redirecionamentos de autenticação
- [x] Fazer Dashboard e Editor funcionarem sem login obrigatório
- [x] Remover botões/links de login da interface

## Galeria de Templates
- [x] Criar galeria de templates no Dashboard com o formulário One Innovation como template pré-configurado
- [x] Permitir clonar template para o banco de dados com um clique

## Remover Rodapé do Formulário
- [x] Remover rodapé com botões de voltar e OK/Continuar do FormContainer

## Posicionamento dos Ícones no Mobile
- [x] Ajustar posição dos ícones de navegação no mobile (estão muito pra cima)

## Bug: Clonar Formulário
- [x] Corrigir funcionalidade de clonar formulário que está com erro (estava funcionando, botão agora visível)

## Botões Visíveis nos Cards
- [x] Adicionar botão visível de clonar nos cards dos formulários
- [x] Adicionar botão visível de excluir nos cards dos formulários
- [x] Permitir renomear o formulário diretamente no card do Dashboard

## Recriar Formulário One Innovation do Respondi
- [x] Acessar Respondi e extrair todas as perguntas e lógica condicional
- [x] Criar formulário idêntico no FormFlow com mesmas perguntas e lógica (52 perguntas)
- [x] Usar mesma fonte e tamanhos do Respondi (Montserrat, 32/24/16px)
- [x] Preview mobile já existia no editor (toggle Desktop/Mobile com frame iPhone)
- [x] Verificar que o formulário funciona corretamente (welcome → PF/PJ → lógica condicional OK)

## Bug: Erro Intermitente no Dashboard
- [x] Investigar e corrigir erro intermitente que faz formulários não aparecerem às vezes (retry + reset conexão DB + UI de erro)

## Bug: Formulários não aparecem no iPhone/Safari
- [x] Investigar e corrigir erro de conexão DB (ECONNRESET) — implementado pool MySQL2 com keepalive + retry automático em todas as queries

## Bug: Formulários não carregam (persistente)
- [x] Investigar e corrigir erro persistente que impede formulários de aparecerem no Dashboard

## Fix: Erro persistente de carregamento (iPhone/Safari)
- [x] Simplificar ownerFallbackProcedure para não depender do DB para auth
- [x] Melhorar resiliência da conexão com banco de dados
- [x] Adicionar melhor tratamento de erros no frontend com retry automático
- [x] Garantir que formulários carreguem consistentemente em todos os dispositivos

## Bug: TypeError in SortableQuestionItem (conditionalLogic.branches.length)
- [x] Fix null access on question.conditionalLogic.branches when conditionalLogic is undefined

## Visual: DatePickerInput white text colors
- [x] Change calendar icon color to white
- [x] Change input font color to white
- [x] Change date display paragraph color to white

## Bug: Uncontrolled-to-controlled input warning on /editor page
- [x] Fix input values changing from undefined to defined (controlled/uncontrolled mismatch)

## Feature: Exportar respostas para CSV/Excel
- [x] Backend: criar procedimento tRPC para gerar CSV das respostas de um formulário
- [x] Frontend: adicionar botão de exportar na aba de respostas do Dashboard

## Feature: Notificação ao owner quando formulário for respondido
- [x] Backend: chamar notifyOwner ao receber nova resposta completa

## Feature: Duplicar formulário no Dashboard
- [x] Backend: criar procedimento tRPC para duplicar formulário existente (já existia)
- [x] Frontend: adicionar botão de duplicar no card do formulário no Dashboard (já existia)

## Bug: ConditionalLogicEditor crash (logic.branches.find undefined)
- [x] Fix null access on logic.branches in ConditionalLogicEditor component

## Bug: Botão de publicar formulário com erro
- [x] Investigar e corrigir o botão de publicar formulário
- [x] Verificar se o salvamento de alterações está funcionando corretamente

## Feature: Integrações de respostas
- [x] Webhook genérico — conectar respostas via webhook customizável
- [x] RD Station — integração para enviar respostas ao RD Station
- [x] WhatsApp — enviar arquivo com respostas via WhatsApp
- [x] Email — enviar respostas por email

## Feature: Botões de ação em cada formulário
- [x] Botão de editar em cada card de formulário
- [x] Botão de duplicar em cada card de formulário
- [x] Botão de excluir em cada card de formulário

## Feature: Geração automática de PDF (Cadastro de Interesse) a partir das respostas
- [x] Backend: instalar biblioteca PDF e criar endpoint de geração
- [x] Backend: implementar layout do Cadastro de Interesse PF (editável)
- [x] Backend: implementar layout do Cadastro de Interesse PJ (editável)
- [x] Backend: mesclar arquivos anexados (CNH, comprovantes) no PDF final
- [x] Backend: aplicar regras de negócio (PF casado = cônjuge como Proponente 2, PJ sem estado civil)
- [x] Frontend: adicionar botão "Gerar Ficha" nas respostas do formulário (página /responses/:formId)
- [x] Garantir que funciona em formulários duplicados (baseado em perguntas, não ID fixo)

## Bug: Uncontrolled-to-controlled input warning on /editor (recorrente)
- [x] Fix undefined input values via deep merge in dbFormToBuilderForm (webhook integrations, design, sharing)

## Feature: Design responsivo para mobile e web app
- [x] Dashboard: sidebar colapsável/drawer no mobile, grid de cards adaptável
- [x] Dashboard: header e filtros empilhados no mobile
- [x] Editor/Builder: toolbar e painéis adaptáveis para telas pequenas
- [x] Responses page: tabela responsiva com scroll horizontal ou cards no mobile
- [x] PWA meta tags (viewport, theme-color, apple-mobile-web-app)
- [x] Formulário de preenchimento: verificar e ajustar se necessário

## Bug: Preview não carrega e formulários não funcionam
- [x] Investigar logs do servidor e console do navegador (API retornando 500 na versão publicada)
- [x] Identificar e corrigir a causa raiz (erro de conexão DB na ownerFallbackProcedure)
- [x] Melhorar resiliência: retry com backoff, fallback sintético, pool maior com SSL
- [x] Verificar que preview e formulários voltam a funcionar (dev server OK, 45 testes passando)

## Feature: PWA — Instalar como app nativo no celular
- [x] Gerar ícones PWA em múltiplos tamanhos (72, 96, 128, 144, 152, 192, 384, 512px)
- [x] Criar manifest.json com nome, cores, ícones e configuração standalone
- [x] Criar service worker básico para cache offline (cache-first para assets, network-first para API)
- [x] Integrar manifest e SW no index.html (+ apple-touch-icon, favicon)
- [x] Testar instalação como PWA (45 testes passando, dev server OK)

## Feature: Splash screen personalizada para PWA
- [x] Criar splash screen com logo, nome e animação no index.html
- [x] Esconder splash automaticamente quando o React montar (MutationObserver + fallback 8s)
- [x] Garantir transição suave (fade-out 0.5s)

## Feature: Notificações push via Service Worker
- [x] Backend: criar tabela push_subscriptions no schema (drizzle + db:push)
- [x] Backend: tRPC procedures (push.subscribe, push.unsubscribe, push.status, push.vapidPublicKey)
- [x] Backend: enviar push notification quando nova resposta for recebida (notifyOwnerNewResponse)
- [x] Frontend: hook usePushNotifications (solicitar permissão, registrar subscription)
- [x] Frontend: NotificationBell component no Dashboard header (ativar/desativar)
- [x] Service Worker: push event handler + notificationclick handler
- [x] Testes unitários: 6 testes para pushNotification module (51 testes totais passando)

## Fix: Splash screen apenas no web app (não no formulário)
- [x] Esconder splash screen nas rotas de preenchimento de formulário (/f/, /form/, /form-preview)
- [x] Aumentar logo da One Innovation no mobile (h-20 no mobile, h-32 no loading)
- [x] Formulário de preenchimento: tela fixa (html fixed, form-viewport-lock, overflow-hidden), apenas perguntas rolam internamente

## Bug: Editor não salva as alterações feitas (lógica condicional)
- [x] Investigar fluxo de salvamento da lógica condicional (conditionalLogic)
- [x] Causa raiz: BuilderConfigPanel escrevia em `branches`, FormEngine lia de `rules` — campos desconectados
- [x] Fix: FormEngine agora usa `branches` com fallback para `rules` (backwards compatible)
- [x] Fix: builderToForm e FormView agora exportam ambos `branches` e `rules`
- [x] Fix: ensureQuestionDefaults faz deep-merge do conditionalLogic (branches ← rules)
- [x] Fix: updateQuestion sincroniza `rules` automaticamente quando `branches` é atualizado
- [x] Migração: dados existentes no DB sincronizados (branches ↔ rules)
- [x] 45 testes passando, sem erros TypeScript

## Feature: Pixel-perfect audit e correções visuais
- [x] P0: Landing Page não rola — corrigido (min-h-screen + removido overflow:hidden global)
- [x] P0: Input de texto no formulário com borda tracejada laranja — corrigido (outline:none !important no form-viewport-lock)
- [x] P1: Dashboard cards com alturas desiguais — corrigido (min-h para descrição)
- [x] P1: Dashboard borda azul no topo do card cortada — corrigido (overflow-visible)
- [x] P1: Placeholder do input muito claro no fundo azul — corrigido (opacity 0.25→0.4 em todos os inputs)
- [x] P2: Dashboard hover state mais elegante — corrigido (clean-card hover)
- [x] P2: Micro-animações e transições mais suaves — já implementado (framer-motion)

## Feature: Código de protocolo único no final do cadastro
- [x] Backend: adicionar campo protocolCode na tabela responses
- [x] Backend: gerar código único aleatório ao salvar resposta (formato OI-XXXXXX)
- [x] Backend: retornar protocolCode na resposta da API
- [x] Frontend: tela de conclusão com código de protocolo, mensagem motivacional e hierarquia visual limpa
- [x] Frontend: botão copiar código de protocolo na tela de conclusão
- [x] Admin: código de protocolo visível na página de respostas com botão copiar
- [x] Testes unitários para geração de protocolo (55 testes passando)

## Feature: Busca por código de protocolo na página de respostas
- [x] Backend: adicionar filtro de busca por protocolCode no endpoint listByForm (getResponsesByFormWithSearch)
- [x] Frontend: campo de busca na página de respostas com filtro por protocolo, nome ou e-mail (debounced)
- [x] Frontend: empty state diferenciado para busca sem resultados vs sem respostas
- [x] Testes unitários para busca por protocolo (2 novos testes: search param e empty results)

## Feature: Notificação por e-mail com código de protocolo
- [x] Investigar opções de integração de e-mail (Resend escolhido)
- [x] Implementar emailService.ts com template HTML profissional
- [x] Integrar envio automático no responses.submit (quando respondentEmail presente)
- [x] Testes unitários: mock do emailService nos testes existentes (57 testes passando)
- [ ] PENDENTE: Configurar RESEND_API_KEY via webdev_request_secrets para ativar envio

## Feature: Melhorar padding, margin e grid layout das perguntas do formulário
- [x] Auditar componentes de perguntas atuais (QuestionRenderer, FormContainer, inputs)
- [x] FormContainer: padding top/bottom aumentado (3rem/5rem), max-width 640px, padding lateral 6/8
- [x] QuestionHeader: margin-bottom mb-8, subtitle mt-3
- [x] TextInput: space-y-4, cores adaptativas, py-4
- [x] LongTextInput: space-y-4, cores adaptativas
- [x] PhoneInput: space-y-4, cores adaptativas
- [x] CPFInput: space-y-4, cores adaptativas
- [x] CNPJInput: space-y-4, cores adaptativas
- [x] AddressInput: grid gap-6, labels adaptativas, space-y-6
- [x] MultipleChoiceInput: gap-3, py-3.5 nos botões
- [x] MultipleSelectInput: space-y-3, py-3.5 nos botões
- [x] YesNoInput: gap-3, py-4 nos botões
- [x] RatingInput: space-y-5, gap-3 entre estrelas
- [x] NPSInput: space-y-4, gap-2 entre números
- [x] SatisfactionInput: gap-4 entre emojis, p-3
- [x] CurrencyInput: space-y-4, cores adaptativas
- [x] DatePickerInput: space-y-4, cores adaptativas
- [x] DropdownInput: space-y-4, dropdown escuro com backdrop-blur
- [x] LegalInput: space-y-6, cores adaptativas
- [x] FileUploadInput: space-y-4, cores adaptativas
- [x] ImageChoiceInput: gap-4, cores adaptativas
- [x] RankingInput: space-y-3, gap-3.5, cores adaptativas
- [x] MatrixInput: cores adaptativas, border rgba
- [x] Hints "Enter ↵" padronizados (text-xs opacity-30, kbd com border rgba)
- [x] Todos os 57 testes passando

## Feature: Notificações para corretores quando novo cadastro é feito
- [x] Backend: tabela de corretores (nome, email, telefone, ativo) + tabela form_corretores
- [x] Backend: associar corretores a formulários (setFormCorretores, getCorretoresByForm, getActiveCorretoresByForm)
- [x] Backend: enviar notificação por email ao corretor quando novo cadastro é feito (corretorNotification.ts com template HTML profissional)
- [x] Backend: tRPC procedures para CRUD de corretores e associação com formulários (corretores router)
- [x] Frontend: página de gerenciamento de corretores (/corretores) com CRUD completo
- [x] Frontend: botão Corretores no Dashboard header
- [x] Frontend: painel de associação corretor-formulário na página de Respostas (toggle switch animável)
- [x] Testes unitários: 14 novos testes de corretores (70 testes totais passando)

## Renomear: FormFlow → Cadastro Digital
- [x] index.html: title, apple-mobile-web-app-title, splash screen
- [x] manifest.json: name, short_name
- [x] sw.js: cache name, notification title, tag
- [x] Dashboard.tsx: header brand name, import error message
- [x] Builder.tsx: import error message
- [x] Landing.tsx: nav brand, features section, benefits section, footer
- [x] emailService.ts: fromName → "Cadastro Digital"
- [x] corretorNotification.ts: fromName + footer texts
- [x] SharingPanel.tsx: window.open name
- [x] formStorage.ts: console error message
- [x] Todos os 70 testes passando

## Feature: Lógica por pontuação em perguntas de múltipla escolha
- [x] Tipos: score opcional em BuilderChoice/Choice, scoringEnabled em BuilderQuestion/Question
- [x] builderToForm: converter score e scoringEnabled para o form engine
- [x] Builder UI: toggle "Pontuação" com ícone amber na aba Geral (visível para multiple-choice, multiple-select, yes-no, dropdown)
- [x] Builder UI: campo numérico de score ao lado de cada opção (quando ativado)
- [x] Builder UI: dica explicativa sobre pontuação
- [x] FormContainer: cálculo de pontuação total baseado nas respostas (single choice + multiple select)
- [x] ThankYouScreen: exibição da pontuação total com design amber/gold animado
- [x] Suporte a single choice (por id e label) e multiple select (array)
- [x] Suporte a scores negativos e zero
- [x] Testes unitários: 11 testes de scoring (81 testes totais passando)

## Feature: Expandir pontuação para TODOS os tipos de pergunta
- [x] Tipos: questionScore em BuilderQuestion e Question (pontuação fixa por resposta)
- [x] builderToForm: converter questionScore para o form engine
- [x] Builder UI: toggle "Pontuação" disponível para TODOS os tipos de pergunta (não apenas múltipla escolha)
- [x] Builder UI: campo "Pontos ao responder" para perguntas sem opções (texto, email, telefone, CPF, endereço, etc.)
- [x] Builder UI: pontuação por opção mantida para perguntas com choices
- [x] FormContainer: cálculo expandido - choice-based (por opção) + non-choice (questionScore fixo)
- [x] Suporte a respostas de texto, número, objeto (endereço), etc.
- [x] Testes unitários: 19 testes de scoring (89 testes totais passando)

## Feature: Lógica condicional para TODOS os tipos de pergunta
- [x] Tipos: ConditionalRule com ConditionOperator (equals, contains, greater_than, less_than, is_answered, is_empty, etc.)
- [x] hasConditionalLogic habilitado para todos os tipos (exceto welcome, thank-you, statement)
- [x] Builder UI: aba Lógica com branches (choice-based) + rules (condition-based) + defaultGoTo
- [x] Builder UI: operadores disponíveis por tipo de pergunta (texto: equals/contains, número: greater_than/less_than, etc.)
- [x] Builder UI: campo de valor condicional + seletor de destino para cada regra
- [x] Form Engine: evaluateRule com suporte a 10 operadores
- [x] Form Engine: resolveTarget com suporte a "next", "end", e IDs de pergunta
- [x] Form Engine: getNextIndexForValue unificado (branches → rules → defaultGoTo)
- [x] Testes: 37 testes de lógica condicional (126 testes totais passando)

## Bug: Erro ao salvar formulário no editor ("The string did not match the expected pattern")
- [x] Investigar causa raiz: superjson criava referências compartilhadas entre branches e rules quando arrays eram a mesma instância
- [x] Corrigir: ensureQuestionDefaults (Editor.tsx) agora cria arrays separados para branches e rules com spread operator
- [x] Corrigir: updateQuestion (useBuilder.ts) agora copia branches/rules com map/spread para evitar referências compartilhadas
- [x] Corrigir: FormView.tsx agora mapeia branches e rules separadamente com defaults
- [x] Corrigir: todos os defaultCL objects agora incluem campo rules: []
- [x] Testar salvamento do formulário no editor — 200 OK, sem erros no console, 126 testes passando

## Feature: Lógica condicional baseada em pontuação total
- [x] Tipos: ScoreRule com campos id, scoreMin, scoreMax, goToQuestionId em builderTypes.ts
- [x] Tipos: scoreRules adicionado ao ConditionalLogic em builderTypes.ts e formTypes.ts
- [x] Todos os defaults atualizados: Editor.tsx, useBuilder.ts, BuilderConfigPanel.tsx, FormView.tsx, oneInnovationForm.ts
- [x] Form Engine: calculateCurrentScore calcula pontuação acumulada (choice-based + questionScore)
- [x] Form Engine: getNextIndexForValue avalia scoreRules após branches e rules (primeira regra que corresponder vence)
- [x] Builder UI: seção "Regras por pontuação total" na aba Lógica (disponível para TODAS as perguntas)
- [x] Builder UI: inputs de pontuação mínima e máxima + seletor de destino com design amber/gold
- [x] builderToForm.ts: conversão de scoreRules para o form engine
- [x] FormView.tsx: mapeamento de scoreRules + campos scoring (scoringEnabled, questionScore, choice.score)
- [x] updateQuestion: preserva scoreRules como array separado (evita referências compartilhadas)
- [x] Testes unitários: 18 novos testes para lógica de pontuação (144 testes totais passando)

## Feature: Reordenar perguntas via drag-and-drop no editor
- [x] Já implementado: drag-and-drop com @dnd-kit na sidebar de perguntas
- [x] Já implementado: handle GripVertical visível ao hover
- [x] Já implementado: proteção contra mover Welcome e Thank You screens
- [x] Já implementado: auto-save após reordenação

## Feature: Painel centralizado de pontuação (estilo Respondi)
- [x] Criar componente ScoringPanel como modal Dialog com animações
- [x] Toggle global "Habilitar pontuação" que ativa/desativa scoring para todas as perguntas
- [x] Lista de todas as perguntas de múltipla escolha com faixa de pontos ("0 → 9 PONTOS")
- [x] Expandir/colapsar perguntas para ver opções com campos de pontuação
- [x] Toggle individual por pergunta para ativar/desativar scoring
- [x] Botão Salvar no final do painel
- [x] Integrado no menu ⋮ do Builder como "Pontuação"
- [x] Testado: panel abre, toggles funcionam, scores editáveis, salva sem erros (200 OK)
- [x] 144 testes passando

## Feature: Endpoint fixo por formulário (URL permanente)
- [x] Sistema de slug já existe no banco (campo unique slug na tabela forms)
- [x] Rota /f/:slug já existe no frontend (App.tsx) e backend (getBySlug)
- [x] SharingPanel usa window.location.origin (reflete domínio real automaticamente)
- [x] Backend: endpoint checkSlugAvailable com validação de unicidade
- [x] Backend: slug sincronizado ao salvar formulário (sharing.slug → forms.slug)
- [x] Rota /:slug no App.tsx via SlugResolver (URLs limpas sem /f/ prefix)
- [x] SharingPanel: campo editável com feedback verde/vermelho (disponível/indisponível)
- [x] SharingPanel: debounce de 500ms na verificação de slug
- [x] Testado: /vitoria carrega formulário, /f/vitoria também funciona, 144 testes passando

## Feature: Melhorar responsividade e UX do web app
- [x] Audit completo: Dashboard, Editor, Builder, FormView, Responses, Corretores
- [x] Dashboard: header mobile simplificado com menu dropdown, sidebar overlay, cards grid responsivo
- [x] Editor/Builder: mobile bottom bar + Sheet panels para sidebar e config, tabs só ícones no mobile
- [x] Formulário: QuestionHeader fontes responsivas, WelcomeScreen/ThankYouScreen responsivos
- [x] Inputs: MultipleChoiceInput touch targets maiores (min-h-48px), TextInput 16px no mobile (evita zoom iOS)
- [x] BuilderLivePreview: padding responsivo (p-2 sm:p-4 md:p-8)
- [x] Responses: padding responsivo no detalhe expandido
- [x] viewport-fit=cover para phones com notch + safe area CSS utilities
- [x] Touch-action improvements no CSS global
- [x] 144 testes passando

## Feature: Duplicar formulário com renomear e escolher pasta
- [ ] Backend: criar procedure duplicateForm (copia form + questions + settings)
- [ ] Backend: gerar novo slug único para o formulário duplicado
- [ ] Frontend: dialog de duplicação com campo de nome e seletor de pasta
- [ ] Frontend: integrar dialog no botão de duplicar do Dashboard
- [ ] Testar fluxo completo de duplicação

## Feature: Upload de imagem no DesignEditor (logo)
- [x] Adicionar input file para upload de imagem no campo de logo do DesignEditor
- [x] Fazer upload da imagem para S3 via backend
- [x] Exibir preview da imagem selecionada
- [x] Testar upload e exibição da imagem

## Feature: Configurar RESEND_API_KEY
- [x] Configurar secret RESEND_API_KEY via webdev_request_secrets
- [x] Testar envio de email com protocolo

## Feature: Sistema de autenticação próprio (substituir Manus OAuth)
- [x] Criar tabela platform_users (email, passwordHash, role, name, phone, active, invitedBy)
- [x] Criar tabela invites (email, token, role, invitedBy, expiresAt, usedAt)
- [x] Criar tabela client_users (cpf_cnpj, passwordHash, name, email, phone)
- [x] Implementar hash de senha com bcrypt
- [x] Backend: login endpoint (email/senha para staff, CPF/CNPJ para clientes)
- [x] Backend: register endpoint (apenas via convite para staff)
- [x] Backend: invite endpoint (master envia convite por email)
- [x] Backend: session/JWT management próprio
- [x] Frontend: página de login (staff e cliente)
- [x] Frontend: página de registro via convite (definir senha)
- [x] Frontend: página de login do cliente (CPF/CNPJ)
- [x] Seed do master: contato@denisbugatti.com.br / WdZQ7eQJXJ
- [ ] Remover dependência do Manus OAuth (mantido como fallback)

## Feature: Níveis de acesso (Master, Diretor, Gerente, Corretor)
- [x] Enum de roles: master, diretor, gerente, corretor
- [x] Tabela de permissões por role (permissions matrix)
- [x] Backend: middleware de verificação de permissões
- [x] Frontend: página de gerenciamento de permissões (master only)
- [x] Frontend: hierarquia visual de acesso (como na imagem)
- [x] Frontend: checkboxes editáveis por recurso/role

## Feature: Portal do cliente (CPF/CNPJ)
- [x] Login do cliente por CPF/CNPJ + senha
- [x] Dashboard do cliente: ver status do cadastro
- [x] Cliente pode finalizar cadastro incompleto
- [x] Cliente recebe email de status (aprovado/reprovado/pendente)
- [x] Cliente NÃO vê quem é o corretor responsável

## Feature: Validação de respostas pelo corretor
- [x] Tabela response_validations (responseId, questionId, status, justification, validatedBy)
- [x] Backend: endpoints de validação (aprovar/reprovar resposta individual)
- [x] Frontend: interface de validação para corretor (check verde / X vermelho com justificativa)
- [x] Backend: calcular status geral (aprovado quando todas validadas)
- [x] Email de aprovação (parabéns, apto para comprar imóvel One Innovation)
- [x] Email de reprovação (justificativa, solicitar novo documento/dado)

## Feature: Landing page incrível
- [x] Design premium da landing page (estilo Halo dark theme)
- [x] Botão "Preencher para Lançamento" no header (chamativo)
- [x] Ao clicar: modal com campo de corretor e telefone do corretor
- [x] Após selecionar corretor: abre o formulário vinculado ao corretor
- [x] Botões de login (staff e cliente) no header
- [x] Informações sobre LGPD e proteção de dados

## Feature: Vinculação corretor-formulário
- [ ] Cada formulário vinculado a um corretor específico (userId do corretor)
- [ ] Corretor vê apenas seus formulários e respostas
- [ ] Ao criar formulário: obrigatório informar número e email do corretor

## Feature: Duplicar formulário melhorado
- [ ] Dialog de duplicação com campo de nome
- [ ] Seletor de pasta de destino no dialog
- [ ] Integrar dialog no botão de duplicar do Dashboard
- [ ] Testar fluxo completo

## Bug Fix: Slug não editável no SharingPanel
- [x] Corrigir campo de slug no SharingPanel para permitir edição (testado — funciona corretamente)

## Feature: Landing page animações extraordinárias (estilo Halo)
- [x] Cursor glow effect (brilho que segue o mouse)
- [x] Blobs animados no fundo (gradientes flutuantes)
- [x] Parallax scroll em múltiplas camadas
- [x] Hover effects com energia/glow nas bordas dos cards
- [x] Scroll-triggered animations (fade in, slide up, scale)
- [x] Marquee/ticker infinito com "ONE INNOVATION"
- [x] Micro-interações em botões (pulse, glow, scale)
- [x] Loading animation na entrada da página
- [x] Gradient mesh animado no hero
- [x] Cards com border-glow que segue o cursor
- [x] Números animados (counter up) ao entrar na viewport
- [x] Smooth scroll entre seções

## Bug Fix: Formulário da One Innovation não aparece no Dashboard
- [x] Investigar por que o formulário não está aparecendo (context.ts não reconhecia JWT custom auth)
- [x] Corrigir o problema (context.ts atualizado para mapear staff user → owner user)

## Bug Fix: Landing page lenta e travada
- [x] Remover blobs pesados e animações que causam lag (538→7 CSS animations)
- [x] Otimizar todas as animações para fluidez máxima (GPU-accelerated, will-change)
- [x] Reduzir loading screen para algo leve e rápido
- [x] Garantir 60fps em todas as interações

## Bug Fix: Formulário não aparece após login do staff
- [x] Corrigir context.ts para reconhecer JWT custom auth e mapear para owner user
- [x] Garantir que forms.list retorna formulários para staff logado
- [x] Testar fluxo completo: login staff → dashboard → ver formulários (OK)

## Feature: Vincular corretores a formulários (Preencher para Lançamento)
- [ ] Backend: endpoint público para listar corretores ativos com formulários vinculados
- [ ] Backend: garantir que form_corretores já vincula corretores a formulários
- [ ] Frontend: modal "Preencher para Lançamento" busca corretores reais do backend
- [ ] Frontend: ao selecionar corretor, abre o formulário vinculado a ele
- [ ] Frontend: campo de telefone do corretor exibido no modal
- [ ] Testar fluxo completo: landing → selecionar corretor → abrir formulário
- [ ] Bug Fix: Slug não pode ser alterado — investigar e corrigir edição de slug
- [x] Aumentar borda dos campos de upload de arquivos no formulário (7px)
- [x] Feature: Seletor de bandeira/país no campo de telefone (Brasil padrão, permite alterar)
- [x] Feature: Formulários acessíveis via /{slug} diretamente (ex: one.cadastrodigital.com.br/vitoria) sem precisar de /f/{slug}
- [x] Fix: Garantir que a edição de slug funcione corretamente no editor de formulários (layout corrigido — slug não fica mais cortado)

## Reestruturação do Sistema (01/03/2026)

### Limpeza de Rotas/Páginas
- [x] Remover rota /cadastro-cliente (ClientRegister) — será implementada depois
- [x] Remover rota /portal (ClientPortal) — será implementada depois
- [x] Remover rota /form (duplicata do Dashboard)
- [x] Remover rota /:slug (SlugResolver catch-all) — mantido como catch-all para resolver slugs
- [x] Remover rota /corretores (página separada) — movido para Settings
- [x] Remover rota /f/:slug (duplicata)
- [x] Remover rota /form/:id
- [x] Remover rota /form-preview
- [x] Remover rota /editor sem ID
- [x] Remover rota /landing (duplicata de /)
- [x] Remover rota /permissoes — movido para Settings
- [x] Remover rota /dashboard — mantido como rota principal do staff

### Página de Configurações (Settings)
- [x] Criar página de Configurações unificada (placeholder com 3 abas)
- [x] Aba Permissões: configurar o que gerentes e corretores podem ver/editar
- [x] Aba Usuários: gerar convites (corretor ou gerente), desativar usuário (temporário ou definitivo)
- [x] Aba Exportação: exportar respostas com filtros (validados, completas, incompletas, por formulário, por gerente, por corretor)

### Validação de Respostas (Workflow do Corretor)
- [x] Ao validar resposta, corretor deve digitar nome do projeto de interesse do cliente
- [x] Salvar nomes de projetos para reutilização (autocomplete com projetos já usados)
- [x] Após validar, marcar resposta com check de "Validado" no sistema
- [ ] Filtrar cadastros por projeto no Dashboard do corretor
- [ ] Somente após validação: permitir gerar PDF com respostas
- [ ] PDF: visualizar, baixar, compartilhar e editar
- [ ] Adicionar páginas ao PDF

### Controle de Acesso por Papel (RBAC)
- [x] Corretores e gerentes NÃO têm acesso ao editor de formulários (Editor redireciona para dashboard)
- [x] Corretores e gerentes veem apenas respostas dos seus próprios formulários (Dashboard RBAC)
- [x] Corretores e gerentes podem acessar preview do formulário

### Edição de Formulário (Dashboard)
- [ ] Poder alterar o nome do formulário no Dashboard
- [ ] Poder alterar a URL/slug do formulário no Dashboard
- [x] Fix: SharingPanel mostra URL de dev em vez de one.cadastrodigital.com.br — agora mostra domínio real na preview
- [x] Fix: Remover animação de splash/loading ao abrir o site — ir direto para o conteúdo
- [x] Fix: Settings navigate-in-render React error (mover navigate para useEffect)
- [x] Fix: Usuário já é master no banco (Denis Bugatti)
- [x] Feature: Validação funciona para TODAS as respostas incluindo arquivos/uploads (imagens, PDFs, múltiplos)
- [x] Feature: Campo de observação/orientação em cada pergunta para guiar o corretor na validação (como é a resposta certa)
