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
- [ ] Fix: Garantir que a edição de slug funcione corretamente no editor de formulários (escolher slug customizado)

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
- [ ] Aba Permissões: configurar o que gerentes e corretores podem ver/editar
- [ ] Aba Usuários: gerar convites (corretor ou gerente), desativar usuário (temporário ou definitivo)
- [ ] Aba Exportação: exportar respostas com filtros (validados, completas, incompletas, por formulário, por gerente, por corretor)

### Validação de Respostas (Workflow do Corretor)
- [ ] Ao validar resposta, corretor deve digitar nome do projeto de interesse do cliente
- [ ] Salvar nomes de projetos para reutilização (autocomplete com projetos já usados)
- [ ] Após validar, marcar resposta com check de "Validado" no sistema
- [ ] Filtrar cadastros por projeto no Dashboard do corretor
- [ ] Somente após validação: permitir gerar PDF com respostas
- [ ] PDF: visualizar, baixar, compartilhar e editar
- [ ] Adicionar páginas ao PDF

### Controle de Acesso por Papel (RBAC)
- [ ] Corretores e gerentes NÃO têm acesso ao editor de formulários
- [ ] Corretores e gerentes veem apenas respostas dos seus próprios formulários
- [ ] Corretores e gerentes podem acessar preview do formulário

### Edição de Formulário (Dashboard)
- [ ] Poder alterar o nome do formulário no Dashboard
- [ ] Poder alterar a URL/slug do formulário no Dashboard

## Reimplementação pós-rollback (v0f052237)

### Edição inline de nome/slug no Dashboard
- [x] Editar nome do formulário diretamente no card do Dashboard (click-to-edit)
- [x] Editar slug/URL do formulário diretamente no card do Dashboard (click-to-edit)
- [x] Backend: tRPC mutation para atualizar nome e slug do formulário

### Geração de PDF restrita a respostas validadas
- [x] Desabilitar botão "Gerar Ficha" quando resposta não está validada
- [x] Mostrar tooltip/mensagem explicando que precisa validar antes de gerar PDF

### Bug Fixes
- [x] Fix Framer Motion spring animation error on editor page (keyframes 0,-4,4,-4,4,0 not supported with spring)

### SharingPanel Fixes
- [x] Slug não aparece para edição no SharingPanel (slug was visible but domain prefix was wrong)
- [x] Domínio do formulário deve ser one.cadastrodigital.com.br/slug (hardcoded custom domain)

### Validação de Respostas no ResponsesPanel (Editor)
- [x] Botão "Validar Respostas" na tabela de respostas do editor
- [x] Tela de validação campo a campo com aprovar/reprovar individual
- [x] Validação de arquivos anexados com preview e aprovar/reprovar
- [x] Justificativa obrigatória ao reprovar campo
- [x] Aprovar cadastro completo ao final da validação
- [x] Botão "Gerar PDF" só aparece quando cadastro está aprovado

### Animação de Intro
- [x] Remover animação de loading/intro da página inicial pública
- [x] Manter animação de loading/intro apenas para área logada (corretores/gerentes)

### Bug Fixes (cont.)
- [x] Fix invalid hook call: trpc.useUtils() called inside mutation onSuccess in ResponsesPanel ValidationDrawer
- [x] Remover botão "Aprovar todos os pendentes" do drawer de validação (validação deve ser campo a campo)
- [x] Redesenhar drawer de validação com design mais limpo, bonito e intuitivo
- [x] Formatar exibição de respostas no drawer de validação (remover JSON bruto, aspas, colchetes)
- [x] Preview expandido de anexos (imagens/PDFs) diretamente no drawer de validação sem abrir outra aba
- [x] Remover animação splash do logo FormFlow no início do site (formulário público)
- [x] Corrigir anexos no drawer de validação - agora detecta URLs do S3 nas respostas e mostra preview inline
- [x] FileUploadInput agora faz upload real para S3 via tRPC (antes só salvava o nome do arquivo)

### Preview de Link de Compartilhamento (Open Graph)
- [x] Configurar OG meta tags dinâmicos para formulários compartilhados (título, descrição, imagem)
- [x] Garantir que WhatsApp, Facebook, etc. mostrem preview correto ao compartilhar link do formulário

### Animação Splash
- [x] Remover animação splash do logo no formulário público (desktop/browser)
- [x] Manter animação splash apenas na abertura do web app mobile (PWA standalone)

### Imagem de Capa para Preview WhatsApp
- [x] Adicionar campo de upload de imagem de capa no editor de design do formulário (já existia na seção social)
- [x] Salvar imagem de capa no campo design do formulário (design.ogImage)
- [x] Integrar imagem de capa com middleware OG para preview do WhatsApp
- [x] Preview da imagem de capa no SharingPanel (já existia no DesignEditor seção social)

### Bug Fixes (cont.)
- [x] Menu de configurações não abre (reescrito sem DashboardLayout genérico, layout próprio com botão voltar)

### Configurações - Funcionalidades Reais
- [x] Backend: tabela de permissões por papel (Gerente/Corretor) no banco de dados (já existia)
- [x] Backend: tRPC procedures para CRUD de permissões por papel (já existia)
- [x] Frontend: Settings aba Permissões conectada ao backend real
- [x] Backend: exportação CSV de respostas com filtros por status e formulário (apenas master)
- [x] Frontend: Settings aba Exportação com seleção de formulário, filtros e download CSV
- [x] Backend: tRPC procedure para convite de novos usuários (gerar link ou enviar email) (já existia)
- [x] Frontend: Settings aba Usuários com listagem real e funcionalidade de convite
- [x] Restrição: apenas master pode acessar exportação (via ownerFallbackProcedure)

### Tema Escuro/Claro (Toggle de Tema)
- [x] Adicionar variáveis CSS dark mode no index.css (.dark { ... })
- [x] Habilitar switchable no ThemeProvider (persistir no localStorage)
- [x] Adicionar aba "Aparência" nas Configurações com toggle de tema
- [x] Garantir que Dashboard, Editor, Settings e componentes funcionem em ambos os temas
- [x] Testar transição suave entre temas

### Bug: Formulários não aparecem no Dashboard (intermitente)
- [x] Investigar logs do servidor e banco de dados
- [x] Identificar causa raiz: ownerFallbackProcedure falhava quando DB demorava a responder, sem fallback adequado
- [x] Corrigir: getOrCreateOwnerUser agora NUNCA falha — usa 4 camadas de fallback (cache → DB retry → stale cache → synthetic owner)
- [x] Cache TTL aumentado para 30 min, retry com backoff exponencial, 3 testes de resiliência adicionados (193 testes passando)

### Feature: Configurações de Compartilhamento Social (OG Tags)
- [x] Adicionar aba "Social" nas Configurações com preview de como o link aparece no WhatsApp
- [x] Campos editáveis: título da página, descrição, imagem de capa (upload para S3)
- [x] Backend: salvar OG tags no banco de dados (tabela site_settings)
- [x] Backend: servir OG meta tags dinamicamente no HTML baseado nas configurações salvas (ogMiddleware atualizado)
- [x] Preview em tempo real do card de compartilhamento
- [x] 13 testes novos para siteSettings (206 testes totais passando)

### Fix: Splash screen apenas no PWA (web app instalado)
- [x] Remover splash/logo de carregamento ao abrir no navegador normal
- [x] Manter splash apenas quando aberto como PWA standalone (display-mode: standalone + navigator.standalone)

### Feature: OG Tags por formulário (compartilhamento individual)
- [x] Campos ogTitle, ogDescription, ogImage já existiam no FormDesignSettings (builderTypes.ts)
- [x] Criar seção "Compartilhamento social" no SharingPanel com preview do WhatsApp em tempo real
- [x] Upload de imagem de capa por formulário (S3 via siteSettings.uploadImage)
- [x] ogMiddleware já servia OG tags específicos de cada formulário (design.ogTitle/ogDescription/ogImage)
- [x] 6 novos testes adicionados (212 testes totais passando)

### Feature: Opção "Sistema" no toggle de tema
- [x] Adicionar terceira opção "Sistema" ao ThemeContext (light/dark/system)
- [x] Detectar prefers-color-scheme do dispositivo e reagir a mudanças em tempo real (addEventListener)
- [x] Atualizar aba Aparência nas Configurações com 3 opções visuais (Claro, Escuro, Sistema) em grid 3 colunas
- [x] Persistir preferência no localStorage (theme-mode) com migração da chave antiga
- [x] 19 testes atualizados para cobrir sistema (219 testes totais passando)

### Bug: OG tags não aparecem no WhatsApp
- [x] Investigar: produção não tinha o código mais recente do ogMiddleware (precisa publicar)
- [x] ogMiddleware funciona corretamente no dev (confirmado via curl com WhatsApp UA)
- [x] Atualizar index.html estático com OG tags corretas da One Innovation como fallback
- [x] Título, descrição e twitter:card atualizados no HTML estático

### Feature: Renomear formulário no editor
- [x] Adicionar campo editável inline para o nome do formulário no Builder (Pencil icon + input)
- [x] Salvar nome via updateFormMeta mutation ao confirmar edição

### Feature: Fundo WebGL animado nos formulários
- [x] Criar componente WebGLBackground com 5 efeitos (gradient-flow, particles, aurora, waves, mesh-gradient)
- [x] Adicionar seletor backgroundType (solid/image/webgl) + efeito + intensidade no DesignEditor
- [x] Integrar WebGLBackground no FormContainer como opção de background

### Melhoria: Redesign da página de respostas
- [x] Cards de estatísticas no topo (total, completas, tempo médio, validadas)
- [x] Filtros por status (todos, completas, parciais, validadas, pendentes)
- [x] Cards de resposta redesenhados com ValidationBadge e animações
- [x] Visualização expandida com layout pergunta/resposta lado a lado
- [x] Design responsivo e consistente com tema escuro/claro
- [x] 15 novos testes (234 testes totais passando)

### Bug: Página de aceitar convite com link inválido
- [x] Investigado: comportamento correto — página mostra "Link inválido" quando acessada sem token (só funciona pelo link do email de convite)

### Feature: Editar e excluir usuários na Equipe
- [x] Botões de editar (lápis) e excluir (lixeira) visíveis diretamente em cada membro
- [x] Diálogo de edição com nome, email, telefone, cargo e status ativo/inativo (Switch)
- [x] Confirmação antes de excluir com AlertDialog
- [x] Campo email adicionado ao backend staff.update
- [x] Tema escuro aplicado na página de Equipe (bg-background, bg-card, text-foreground)

### Feature: Tipo Statement/Capa no Builder
- [x] Tipo statement já existia no builderTypes.ts com defaults (título, subtítulo, botão Continuar)
- [x] Já existia no menu "Adicionar pergunta" como "Mensagem" na categoria texto
- [x] Melhorar visual do StatementScreen — título maior (28-36px responsivo), decorações visuais, ícone com gradiente
- [x] Suporte a imagem customizada e botão com efeito hover (ArrowRight + whileHover)
- [x] Adicionar campos específicos no BuilderConfigPanel (texto do botão, mostrar botão)
- [x] Statement não gera resposta (apenas visual/divisória) — já implementado
- [x] 10 novos testes (244 testes totais passando)

### Bug Fix: Aviso "Existe um rascunho não publicado" no SharingPanel
- [x] Investigar por que o aviso aparece e como o fluxo de publicação funciona
- [x] Garantir que o botão de publicar funcione corretamente para aplicar mudanças
- [x] Fix: dbFormToBuilderForm agora define isPublished baseado no status do form no DB
- [x] Fix: handlePublish agora atualiza sharing.isPublished ao publicar/despublicar

### Bug Fix: OG Tags globais do site (Settings > Social)
- [x] Verificar se Settings > Social está salvando corretamente no banco (já funciona)
- [x] Garantir que ogMiddleware usa os OG globais como fallback para todas as páginas (já funciona)
- [x] OG da homepage deve usar as configurações globais de Settings > Social (já funciona)
- [x] Nota: Para aplicar, ir em Configurações > Social, preencher campos e clicar Salvar

### Bug Fix: Página de Respostas não responsiva (mobile/iPhone)
- [x] Auditar layout da página Responses em telas pequenas
- [x] Corrigir cards de estatísticas para mobile (padding, font-size, icon-size reduzidos)
- [x] Corrigir lista de respostas para mobile (cards empilhados, botões em linha separada)
- [x] Corrigir detalhes expandidos para mobile (flex-col, font-size menor)
- [x] Header responsivo (h1 menor, botões compactos)
- [x] Filtros com scroll horizontal no mobile (-mx-3 px-3 scrollbar-none)
- [x] Corretores panel responsivo

### Bug Fix: Modo escuro/claro inconsistente em todas as páginas
- [x] Auditar Dashboard para cores hardcoded
- [x] Auditar Builder/Editor para cores hardcoded (BuilderConfigPanel, BuilderSidebar, BuilderCanvas, BuilderPreview, DesignEditor, ScoringPanel, WebhookPanel, WorkspaceManager)
- [x] Auditar Settings para cores hardcoded
- [x] Auditar Responses para cores hardcoded (ResponsesPanel)
- [x] Auditar StaffManagement para cores hardcoded (Corretores, PermissionsPage)
- [x] Auditar Home/Landing page para cores hardcoded (Landing usa bg-white/X que é OK para dark bg)
- [x] Auditar FormContainer/FormEngine para cores hardcoded (FormView bg-background)
- [x] Corrigir todas as cores hardcoded para usar variáveis semânticas (bg-card, bg-input, bg-secondary, text-foreground, text-muted-foreground, etc.)
- [x] Corrigido: ResponseValidation, ClientPortal, ClientRegister, AcceptInvite/Login (usam bg-white/X sobre fundo escuro = OK)

### Bug Fix: ResponsesPanel (Editor) péssima experiência no mobile
- [x] Tabela de respostas fica cortada no mobile — cards empilhados com preview de campos
- [x] Redesenhar para mobile-first: ResponseCard component com data, status badge, preview fields, botões
- [x] Stats cards responsivos: grid-cols-3 no mobile, grid-cols-5 no desktop
- [x] Busca e filtros adaptados para mobile: empilhados verticalmente
- [x] Validation Drawer full-screen no mobile (w-full sm:max-w-[520px])
- [x] Reject modal como bottom sheet no mobile
- [x] Paginação compacta no mobile
- [x] Todos os 244 testes passando

### Feature: Colunas específicas no ResponsesPanel
- [x] Colunas desktop: Data, CPF/CNPJ, Nome, Telefone (link WhatsApp), Validação, Ações
- [x] Cards mobile: mostrar Data, CPF/CNPJ, Nome, Telefone (link WhatsApp), status, botões
- [x] Telefone clicável abre conversa no WhatsApp (wa.me link com +55)
- [x] Smart field detection: busca por tipo (cpf, cnpj, name, phone) e por título (keywords)

### Feature: Filtros rápidos por status no ResponsesPanel
- [x] Stats cards agora são clicáveis como filtros (desktop): ring-2 com cor do status quando ativo
- [x] Pills de filtro rápido no mobile: Todos, Aprovados, Reprovados, Revisão, Pendentes
- [x] Filtro ativo tem destaque visual com cor do status (bg + border)
- [x] Funciona tanto no mobile (pills) quanto no desktop (stats cards clicáveis)
- [x] Paginação reseta ao trocar filtro
- [x] Clicar novamente no mesmo filtro volta para "Todos"

### Feature: Notificação push quando nova resposta chegar ao formulário
- [x] Verificar infraestrutura existente de push notifications (VAPID, service worker) — JÁ IMPLEMENTADO
- [x] Disparar notificação push para o owner quando nova resposta for submetida — notifyOwnerNewResponse() já chamada em routers.ts
- [x] Incluir informações úteis na notificação (nome do formulário, nome do respondente) — já inclui
- [x] Email para corretores ativos do formulário — notifyCorretoresNewSubmission() já implementado

### Feature: Filtro por corretor/responsável no ResponsesPanel
- [x] Verificar se respostas têm campo de responsável/corretor atribuído (reviewedBy = staff_users.id)
- [x] Adicionar dropdown de filtro por corretor no ResponsesPanel (entre busca e data)
- [x] Coluna "Responsável" na tabela desktop + info no card mobile
- [x] Listar staff users + corretores no dropdown com avatar e role
- [x] Opções: Todos, Sem responsável, e cada staff/corretor individualmente
- [x] Todos os 244 testes passando

### Feature: Excluir e editar convites pendentes
- [x] Adicionar botão de excluir convite pendente (com confirmação AlertDialog)
- [x] Adicionar botão de editar convite pendente (alterar email, nome, telefone, role)
- [x] Criar procedures no backend: staff.deleteInvite e staff.updateInvite
- [x] DB helpers: deleteInvite, updateInvite, getInviteById em staffDb.ts
- [x] UI com botões Pencil e Trash2 em cada convite pendente
- [x] Validação: não permite editar/excluir convites já utilizados
- [x] Todos os 244 testes passando

### Feature: Reenviar convite pendente/expirado
- [x] Criar procedure backend staff.resendInvite que regenera token e reenvia email
- [x] Adicionar botão de reenviar (RotateCw icon) na UI de convites pendentes/expirados
- [x] Atualizar data de expiração ao reenviar (+7 dias) e gerar novo token
- [x] Toast de sucesso/erro ao reenviar
- [x] Loading spinner durante o envio
- [x] Todos os 244 testes passando

### Deep Audit: Botões e funcionalidades quebradas
- [x] Auditar todas as páginas para botões que não funcionam
- [x] Auditar toasts "Feature coming soon" — nenhum encontrado (limpo)
- [x] Verificar OG tags (site-wide e por formulário) — middleware OK, homepage + slugs funcionam
- [x] FIX: Builder navegava para /form (inexistente) — corrigido para /dashboard
- [x] FIX: ClientPortal rota /portal adicionada ao App.tsx
- [x] FIX: ClientRegister rota /cadastro-cliente adicionada ao App.tsx
- [x] FIX: Login navega para /portal e /cadastro-cliente — rotas agora existem
- [x] FIX: Landing navegava para /f/:slug — corrigido para /:slug
- [x] FIX: PermissionsPage e Corretores são usados inline dentro de Settings/StaffManagement (não precisam de rota)
- [x] Implementar portal do cliente para continuar formulários incompletos
- [x] Backend: responses.getForContinue procedure para carregar respostas parciais
- [x] FormContainer: suporta initialAnswers + continueResponseId para retomar formulários
- [x] SlugResolver: suporta ?continue=responseId na URL
- [x] ClientPortal: redesenhado com stats, lista de formulários, botão Continuar
- [x] Adicionar rotas faltantes no App.tsx (/portal, /cadastro-cliente)
- [x] Adicionar rotas no ogMiddleware appRoutes list
- [x] Todos os 244 testes passando

### Bug Fix: Resend não está enviando emails de convite
- [x] Auditar configuração do Resend (API key OK, domínio cadastrodigital.com.br verificado)
- [x] Verificar logs de erro: "You can only send testing emails to your own email" — from address era onboarding@resend.dev
- [x] Corrigir: atualizar todos os from para one@cadastrodigital.com.br (emailService, corretorNotification, test)

### Feature: Email de boas-vindas ao se cadastrar
- [x] Enviar email de protocolo quando cliente completa formulário (já implementado - sendProtocolEmail)
- [x] Template profissional com código de protocolo e informações do formulário

### Feature: Follow-up para cadastros incompletos
- [x] sendFollowUpEmail: template com botão "Continuar meu cadastro" e link direto
- [x] followUp.sendFollowUps: procedure que busca incompletos >24h e envia follow-up
- [x] followUp.getPendingCount: query para ver quantos follow-ups pendentes
- [x] DB: campo followUpSentAt + getIncompleteResponsesForFollowUp + markFollowUpSent
- [x] Migration aplicada com sucesso

### Feature: Email de aprovação/rejeição pelo corretor
- [x] sendApprovalEmail: enviado automaticamente quando todos os campos são aprovados
- [x] sendRejectionEmail: enviado automaticamente quando algum campo é rejeitado (com motivos)
- [x] Todos os emails agora usam one@cadastrodigital.com.br como remetente
- [x] Todos os 244 testes passando


## Email Templates - Design One Innovation
- [x] Template base com design One Innovation (cores, fonte, layout)
- [x] Email 1: Convite para Corretores/Gerentes (boas-vindas, aceitar convite, definir senha)
- [x] Email 2: Cadastro Completo Pendente (protocolo, "falta pouco para próxima conquista")
- [x] Email 3: Cadastro Aprovado ("Parabéns! Seu cadastro foi aprovado com sucesso!")
- [x] Email 4: Reenvio de Documento/Correção de Dados
- [x] Email 5: Cadência de Abandono (3x/semana seg/qua/sex às 9h por 2 meses)
- [x] Email 6: Cadência de Reprovação (mesma cadência para quem precisa corrigir)
- [x] Sistema de cadência: tabela no banco para rastrear envios
- [x] Endpoint de cron para disparar cadência automaticamente
- [x] Testes para todos os templates e lógica de cadência

## Migração Templates Resend + Cron Cadência
- [x] Pesquisar API de templates do Resend
- [x] Criar os 11 templates no Resend via API (6 email types + variações + corretor)
- [x] Atualizar emailService.ts para usar templates do Resend
- [x] Configurar cron interno para cadência de emails às 9h BRT (enrollIncomplete + processDue)
- [x] Testes e validação (276 testes passando)

## Logo nos Templates de Email
- [x] Trocar logo nos 11 templates do Resend pelo logo branco sem fundo da One Innovation + redesign completo com fundo azul #0D8BD9

## Reorganizar Navegação: Dashboard → Respostas de cada formulário
- [x] Renomear aba "Dashboard" (lista de formulários) para "Formulários"
- [x] Mover conceito de "Dashboard" para dentro de cada formulário (página de respostas/analytics)
- [x] Atualizar navegação, rotas e referências

## Redesign Dashboard de Respostas (dentro de cada formulário)
- [x] Cards verticais para cada resposta (nome, telefone, protocolo, status, validação)
- [x] Busca por número de protocolo
- [x] Painel de cadência de email visível no card do cliente
- [x] Filtros avançados (por data, status de aprovação, corretor responsável)
- [x] Geração de PDF do cadastro completo do cliente

## Melhorias Dashboard Respostas v2
- [x] Paginação nos cards de respostas (12 por página, com navegação)
- [x] Número de protocolo visível na página inicial do card (sem precisar expandir)
- [x] Após validar respostas, visualizar todas no card expandido
- [x] Timeline de atividades no card expandido (emails enviados, aprovação, rejeição, etc.)

## Exportação CSV/Excel com Filtros
- [x] Backend: endpoint para exportar respostas filtradas em CSV (com filtros de data, status, corretor, busca)
- [x] Frontend: botão de exportar na página de Dashboard do formulário
- [x] Aplicar filtros ativos (data, status, corretor) na exportação

## Notificações em Tempo Real
- [x] Backend: campo lastSeenResponseCount na tabela forms + endpoint markSeen
- [x] Frontend: badge com contagem de novas respostas no card do formulário (Dashboard principal)
- [x] Marcar respostas como vistas automaticamente ao entrar no Dashboard do formulário

## Dashboard de Métricas com Gráficos de Conversão
- [x] Backend: endpoint getConversionStats (iniciados, completos, aprovados, rejeitados por período)
- [x] Frontend: funil de conversão com barras animadas + taxas de conversão
- [x] Filtro por período (7d, 30d, 90d, tudo)

## Relatório de Conversão em PDF
- [x] Backend: endpoint para gerar PDF com funil de conversão e métricas
- [x] Design profissional One Innovation (fundo escuro, azul #0D8BD9, Helvetica Bold)
- [x] Incluir: funil visual, taxas de conversão, breakdown diário (últimos 15 dias), período selecionado
- [x] Frontend: botão de exportar PDF no painel de conversão (2 páginas: capa + funil/tabela)

## Gráfico de Linha Temporal + OG Image
- [x] Gráfico de linha temporal no painel de conversão (SVG com 3 linhas: iniciados, completos, aprovados + tabela detalhada)
- [x] Configurar imagem OG (Open Graph) com imagem da One Innovation para compartilhamento nas redes sociais

## Painel de Gestão de Cadências
- [x] Backend: endpoint para listar todas as cadências com filtros (status, tipo, formulário)
- [x] Backend: endpoint para pausar/retomar/cancelar cadências em lote
- [x] Frontend: página CadenceManagement.tsx com visão geral
- [x] Cards de resumo (ativas, pausadas, finalizadas, total)
- [x] Tabela/lista com todas as cadências e ações (pausar, retomar, cancelar)
- [x] Filtros por status, tipo (abandono/reprovação), formulário
- [x] Adicionar rota e item no menu lateral do dashboard
- [x] Busca por nome/email do destinatário
- [x] Seleção em lote com ações de pausar/encerrar
- [x] Barra de progresso visual (emails enviados / total)
- [x] 311 testes passando (30 novos para cadence management)

## Integração BackgroundPaths na Landing Page
- [x] Criar componente BackgroundPaths em /components/ui/background-paths.tsx
- [x] Integrar animação de linhas flutuantes SVG na seção hero da Landing
- [x] Adaptar cores ao tema dark da One Innovation (azul #70BEFA com opacidade balanceada)
- [x] Manter todos os textos existentes da seção

## BackgroundPaths — Parallax + Ajuste de Opacidade
- [x] Adicionar efeito parallax (scroll) nas linhas do BackgroundPaths (2 camadas: 0.15x e 0.35x)
- [x] Reduzir opacidade/contraste das linhas para não competir com o texto
- [x] Garantir legibilidade total do texto hero sobre as linhas animadas

## GlowingEffect nos Cards de Serviços
- [x] Instalar dependência `motion` (motion/react)
- [x] Criar componente GlowingEffect em /components/ui/glowing-effect.tsx
- [x] Aplicar GlowingEffect nos cards das seções Sobre e Serviços da Landing Page
- [x] Adaptar cores do glow ao tema dark da One Innovation

## Melhorias Visuais Landing Page v3
- [x] Aumentar opacidade das linhas do BackgroundPaths para melhor visibilidade
- [x] Adicionar gradiente radial central no hero para contraste máximo no texto
- [x] Reativar animações scroll-reveal (Reveal) com framer-motion fade-in suave

## Melhorias Visuais Landing Page v4
- [x] Personalizar cores do GlowingEffect para tons de azul (#70BEFA, #3b82f6, #60a5fa, #2563eb)
- [x] AnimatedCounter já estava ativo na seção de estatísticas (verificado e funcionando)
- [x] Adicionar smooth scroll no menu de navegação (Sobre, Serviços, Processo, FAQ) + botão Saiba mais

## Ajustes Landing Page v5
- [x] Remover seção de contato (formulário, telefone, email removidos)
- [x] Mudar texto do FAQ: "Quem tem acesso aos meus documentos?" (sem mencionar corretor)
- [x] Corrigir textos embaralhados no marquee ticker (espaçamento gap-10, estrutura com divs separadas)

## ShinyButton Hero CTA v6
- [x] Criar componente ShinyButton em /components/ui/shiny-button.tsx adaptado ao azul #70BEFA
- [x] Remover botão "Saiba mais" do hero
- [x] Centralizar e destacar botão "Preencher para Lançamento" com ShinyButton

## Landing Page v7 — CTA Redesign + Cards 3D Serviços
- [x] Redesenhar seção CTA final com mesmo design do hero (BackgroundPaths + gradiente radial + ShinyButton)
- [x] Instalar Three.js + @react-three/fiber + @react-three/drei
- [x] Criar componente ServiceIcon3D com ícones 3D metálicos (documento, pessoas, checkmark)
- [x] Criar cards de serviços estilo Resend com Canvas independente por card
- [x] Material meshPhysicalMaterial com metalness, clearcoat, emissive azul
- [x] Iluminação: luz quente dourada + preenchimento azul + pointLight hover
- [x] Animações: rotação orbital, parallax mouse, float, fade-in scroll
- [x] Integrar na seção de serviços da Landing substituindo cards atuais

## Moving Dot Animation nos Cards de Processo
- [x] Criar estilos dot-card com ponto animado que percorre a borda (CSS puro)
- [x] Adicionar keyframe moveDot + estilos dot-card-outer/dot/line no index.css
- [x] Integrar animação nos 4 cards da seção "O processo" (números fora dos cards, sem animação)

## Refinamento Visual — Ícones 3D e Números do Processo
- [x] Reduzir tamanho dos ícones 3D (scale 0.85, container 1.6, aspect 4:3, camera fov 30)
- [x] Refinar visual dos ícones 3D (materiais mais escuros, luzes mais sutis, parallax reduzido)
- [x] Melhorar legibilidade dos números (círculos azuis com borda, texto #70BEFA, linhas conectoras)
- [x] Deixar seção O processo mais bonita (step badges circulares + dot-card animation)

## Redesign Ícones Serviços — Flat Design
- [x] Substituir ícones 3D (Three.js Canvas) por ícones lucide-react flat (FileText, Users, CheckCircle)
- [x] Manter identidade visual azul (#70BEFA) com container squircle e hover glow
- [x] Cards flat com padding, accent line no hover, borda azul interativa

## Limpeza de Dependências
- [x] Analisar package.json e identificar dependências não utilizadas
- [x] Remover 11 dependências não utilizadas + 1 arquivo morto (ServiceIcon3D.tsx)
- [x] Verificar compilação (0 erros TS) e testes (311 passando) após remoção

## Bug Fix — ClientPortal setState during render
- [x] Corrigir erro "Cannot update a component while rendering" no ClientPortal.tsx:98 (useEffect movido antes dos conditional returns)

## Reorganização da Navegação — Formulários + Dashboard
- [x] Reorganizar rotas: Formulários como tela principal (lista de forms), Dashboard como tela de respostas/analytics
- [x] Renomear/reestruturar componentes para refletir nova hierarquia
- [x] Atualizar sidebar/navegação com nova estrutura

## Redesign Responsivo — Experiência Incrível Web + Mobile
- [x] Redesign da tela de Formulários (lista de forms) — cards modernos, filtros, ações rápidas
- [x] Redesign do Dashboard (respostas/analytics) — gráficos, tabelas, métricas
- [x] Navegação mobile — MobileBottomNav compartilhado com ícones e transições
- [x] Layout responsivo completo — AppLayout com sidebar desktop + bottom nav mobile + margin dinâmico
- [x] Stats cards com scroll horizontal no mobile (snap-x)
- [x] Response cards com flex-wrap e touch targets maiores (h-9)
- [x] Header responsivo com truncate e botões compactos
- [x] Scrollbar-none utility para containers de scroll horizontal
- [ ] Micro-interações e animações — hover, tap, loading states, empty states
- [ ] Estados de loading com skeletons elegantes
- [x] Design consistente dark mode com accent azul (#70BEFA)

## Bug Fix — Acesso restrito no login
- [x] Corrigir "Acesso restrito" na página /configuracoes — causa era senha alterada por engano durante debug
- [x] Restaurar senha do admin para a senha correta (WdZQ7eQJXJ) — foi alterada por engano durante debug

## Melhorias no ResponsesPanel
- [x] Adicionar número do protocolo no card de cada resposta (mobile card + desktop table + ValidationDrawer header)
- [x] Transferir aba de cadência para o painel de respostas (CadencePanelInline dentro de cada ResponseCard)
- [x] Adicionar botão "Aprovar Todos" no final de todas as perguntas no ValidationDrawer + indicador "Todas aprovadas"

## Funcionalidades de Cadência Avançadas
- [x] Filtro por cadência ativa — botão "Cadência" no painel de filtros (Todas / Com cadência ativa / Sem cadência)
- [x] Iniciar cadência manualmente — botão "Iniciar Cadência" no card quando não há cadência ativa, com menu para escolher tipo (Abandono/Reprovação)
- [x] Histórico de e-mails enviados — seção expansível "Histórico de e-mails" no painel de cadência com timeline de eventos (enviados, iniciados, pausados)

## Bug Fix — Convite não enviado
- [x] Corrigido: sendTemplateEmail usava template_id/template_data (inválido), agora usa template: { id, variables } (formato correto Resend API)

## Botão Salvar na aba Permissões + Nova Imagem OG
- [x] Adicionar botão de salvar alterações na aba Permissões (batch save em vez de salvar individual por switch)
- [x] Trocar imagem OG pela nova imagem enviada pelo usuário (One Innovation - alta resolução 1200x630)

## Redesign Respostas — Validação, Cadência Automática, Corretor View
- [x] Botão "Aprovar Cadastro" no final da validação — desbloqueado somente após validar TODAS as respostas
- [x] Remover botão "Aprovar Todos" do final das perguntas (substituído pelo Aprovar Cadastro)
- [x] Remover botão manual de iniciar cadência — cadência deve ser automática
- [x] Cadência automática: iniciar somente após corretor validar todas as respostas (aprovação ou reprovação)
- [x] Criar página/aba exclusiva de respostas por formulário para Corretor (única aba com acesso)
- [x] Pixel-perfect redesign da aba de respostas (mobile e web app) — melhorar UX completa

## Notificação Push ao Corretor + Redirect Automático
- [x] Notificação push ao corretor quando nova resposta chegar no formulário atribuído a ele
- [x] Redirecionar corretores automaticamente para /corretor/respostas após login (em vez do dashboard geral)

## Pastas para Corretores Organizarem Respostas
- [x] Criar tabela response_folders no schema (id, staffUserId, name, color, createdAt)
- [x] Adicionar campo folderId na tabela form_responses para associar resposta a pasta
- [x] Criar procedures tRPC para CRUD de pastas (criar, listar, renomear, excluir)
- [x] Criar procedure para mover respostas entre pastas
- [x] Implementar UI de pastas na página CorretorResponses (sidebar/tabs de pastas)
- [x] Permitir criar, renomear e excluir pastas na UI
- [x] Permitir mover respostas para pastas via seleção
- [x] Filtrar respostas por pasta selecionada

## Cópia Automática de Formulário ao Convidar Corretor
- [x] Ao enviar convite para corretor, criar cópia automática do formulário One Innovation
- [x] Nome do formulário copiado = nome de usuário do corretor
- [x] Slug do formulário copiado = nome de usuário do corretor (com - para nomes compostos)
- [x] Atribuir automaticamente o formulário copiado ao corretor convidado
- [x] Corretor ao aceitar convite já vai para dashboard com respostas (mesmo sem respostas)
- [x] Adicionar filtro por data de criação na página de respostas do corretor
- [x] Adicionar filtro por data de edição na página de respostas do corretor
- [x] Manter filtro por status existente

## Sincronização do Formulário Principal com Cópias dos Corretores
- [x] Adicionar campo parentFormId na tabela forms para rastrear cópias
- [x] Ao salvar/atualizar o formulário principal, propagar campos/design para todas as cópias
- [x] Manter slug e assignedCorretorId individuais de cada cópia (não sobrescrever)
- [x] Sincronizar: perguntas, design, configurações, mas preservar nome/slug/corretor da cópia

## Dashboard de Performance por Corretor
- [x] Criar procedure backend para calcular métricas de performance (tempo médio validação, taxa aprovação, respostas processadas)
- [x] Criar página de Dashboard de Performance acessível pelo corretor e pelo admin
- [x] Mostrar: tempo médio de validação, taxa de aprovação/reprovação, quantidade de respostas processadas
- [x] Adicionar gráficos/cards visuais com as métricas

## Indicador de Sincronização no Editor
- [x] Adicionar indicador visual no editor mostrando quantas cópias serão sincronizadas ao salvar
- [x] Mostrar badge/tooltip com número de formulários filhos

## Painel de Gerenciamento de Cópias
- [x] Criar painel para visualizar todos os formulários dos corretores (cópias)
- [x] Mostrar status de sincronização de cada cópia (sincronizado/desatualizado)
- [x] Permitir ações: ver respostas, forçar sincronização manual

## Notificação Automática de Inatividade de Corretor
- [x] Criar função para verificar corretores inativos (7+ dias sem validar respostas)
- [x] Enviar notificação push ao admin quando corretor estiver inativo
- [x] Integrar verificação no cron scheduler existente (execução diária)
- [x] Evitar notificações duplicadas (rastrear última notificação enviada)

## Email Semanal de Resumo ao Admin
- [x] Criar função de coleta de estatísticas semanais (total respostas, taxa validação, corretores mais ativos)
- [x] Criar template HTML de email com design profissional para o resumo semanal
- [x] Enviar email via Resend ao admin toda segunda-feira às 9h BRT
- [x] Integrar job semanal no cron scheduler existente
- [x] Incluir métricas: novas respostas, aprovadas, reprovadas, pendentes, top corretores

## Bugs Reportados
- [x] Página de métricas dos corretores não está abrindo (fix: require() dinâmico → import estático ESM)
- [x] Definir modo escuro como padrão para páginas de corretores (CorretorResponses, CorretorDashboard, ResponseValidation)

## Ajustar Nomes dos Remetentes nos Emails
- [x] Emails de convite: no corpo do template, usar nome de quem convidou (ex: "Denis Bugatti")
- [x] Emails de cadência/sistema/validação/aprovação: no corpo do template, usar "One Innovation"
- [x] Email semanal de resumo: no corpo, usar "One Innovation"
- [x] Fix: cache do owner invalidado automaticamente quando OWNER_NAME muda
- [x] Fix: nome do owner no banco sincronizado com OWNER_NAME env var
- [x] Fix: corretorNotification.ts usando formato correto de template Resend (template: { id, variables })

## Favicon — Usar escudo/logo como favicon
- [x] Configurar o escudo/logo da One Innovation como favicon do site (shield azul com check)
- [x] Atualizar manifest.json, apple-touch-icon, splash screen com novo ícone

## Sessão Persistente — Manter usuário logado
- [x] Após login, manter sessão ativa (cookie com maxAge 1 ano já existia)
- [x] Sessão só encerra com logout explícito

## Fluxo de Navegação — Página inicial baseada no estado de login
- [x] Usuário logado: página inicial redireciona para dashboard (admin/gerente) ou corretor/respostas (corretor) ou portal (cliente)
- [x] Usuário deslogado: página inicial é a landing page
- [x] Logout redireciona para a landing page (window.location.href = "/")

## BUG: Corretores com acesso total (admin)
- [x] Corretores estão conseguindo acessar áreas administrativas (dashboard, equipe, configurações, etc.)
- [x] Backend: staffAdminProcedure criado — bloqueia corretores de TODAS as procedures admin
- [x] Backend: staffAnyProcedure para procedures que corretores precisam (validações, push, files)
- [x] Frontend: navegação sidebar/mobile filtrada por role (corretores não veem itens admin)
- [x] Frontend: AdminRoute component redireciona corretores para /corretor/respostas
- [x] Corretor tem acesso APENAS a: /corretor/respostas, /corretor/performance, /validar/:id
- [x] 382 testes passando, incluindo novos testes de RBAC (role-based access control)

## BUG: Formulários não aparecem após mudanças de RBAC
- [x] Investigar por que formulários não estão sendo listados após troca de ownerFallbackProcedure para staffAdminProcedure
- [x] Causa raiz: staffAdminProcedure dependia de ctx.user que falhava quando context.ts não conseguia mapear staff → owner user
- [x] Fix: extrair getOrCreateOwnerUser para ownerUser.ts (sem circular dependency) e usar como fallback no staffAdminProcedure/staffAnyProcedure

## Permissão intermediária para Gerentes
- [x] Backend: criar staffFormOwnerProcedure (master/diretor only) para criar/editar/deletar formulários
- [x] Backend: manter staffAdminProcedure para gerentes (ver respostas, equipe, cadências, etc.)
- [x] Backend: gerentes podem ver formulários (list) mas não criar/editar/deletar
- [x] Frontend: esconder botões de criar/editar/deletar/importar/duplicar/renomear formulários para gerentes
- [x] Frontend: esconder Nova pasta, Mover para pasta para gerentes
- [x] Frontend: FormOwnerRoute bloqueia gerentes de acessar /editor (redireciona para /dashboard)
- [x] Frontend: gerentes veem "Ver Respostas" ao invés de "Editar" nos cards de formulário
- [x] Testes: 387 testes passando, incluindo 5 novos testes de staffFormOwnerProcedure

## Auditoria de Abas/Navegação
- [x] Verificar todas as abas do sidebar e mobile nav
- [x] Identificar abas que apontam para páginas inexistentes ou vazias (Envios em massa, Gestão Financeira)
- [x] Remover placeholders "Em breve" do mobile nav
- [x] Remover páginas órfãs (Corretores.tsx, ComponentShowcase.tsx, FormPreviewPage.tsx, PermissionsPage.tsx)
- [x] Todas as abas restantes funcionam corretamente (Formulários, Equipe, Performance, Cadências, Configurações, Auditoria)

## Log de Auditoria
- [x] Criar tabela audit_logs no banco (action, category, staffUserId, staffName, staffRole, targetType, targetId, targetName, details, severity, createdAt)
- [x] Backend: registrar ações críticas (form.create/delete/duplicate, staff.invite/update_role/deactivate/activate/delete, access.login/blocked)
- [x] Backend: procedures audit.list (com filtros: category, severity, search, paginação) e audit.stats (24h e 7d)
- [x] Frontend: página /auditoria com cards, filtros, busca, badges de severidade/role, paginação, auto-refresh 30s
- [x] Aba "Auditoria" adicionada ao sidebar com ícone ShieldCheck
- [x] 387 testes passando, 0 erros TypeScript

## Notificações em Tempo Real — Badge no Sidebar
- [x] Backend: notifications.unreadCount (admin/gerente/diretor) e notifications.corretorUnreadCount (corretor)
- [x] Backend: getUnreadResponseCounts() e getCorretorUnreadCount() em db.ts (queries leves)
- [x] Frontend: hook useUnreadResponses com polling a cada 20s (refetchIntervalInBackground)
- [x] Frontend: badge vermelho no sidebar desktop "Formulários" (expandido e colapsado)
- [x] Frontend: badge vermelho no mobile bottom nav "Formulários"
- [x] Frontend: badge por formulário nos cards do dashboard (+N novas em vermelho)
- [x] Frontend: badge desaparece ao acessar o formulário (markSeen já existia)
- [x] Corretor: badge nas respostas do corretor quando há novas atribuições
- [x] 387 testes passando, 0 erros TypeScript
