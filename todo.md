# FormFlow - Melhorias v3

## Editor Estilo Typeform (3 colunas)
- [ ] Redesign do Builder.tsx para layout 3 colunas: sidebar perguntas | preview central | painel configurações
- [ ] Sidebar esquerda: lista de perguntas com ícones de tipo, drag-and-drop, botão "+ Add content"
- [ ] Centro: preview live da pergunta selecionada (editável inline)
- [ ] Direita: painel de configurações (tipo de resposta, branching, obrigatório, etc.)

## Visual do Formulário (Preview/Respondente)
- [ ] Bordas dos botões de múltipla escolha → brancas (não azul escuro)
- [ ] Melhorar contraste geral — textos mais legíveis
- [ ] Motion/animações suaves ao mudar de pergunta (slide + fade)
- [ ] Barra de progresso "Pergunta X de Y" no rodapé
- [ ] Botão voltar (seta para cima) funcional

## Tipo Capa/Statement
- [ ] Adicionar tipo "statement" ao builder (pergunta divisória com título + descrição + botão continuar)
- [ ] Redesign visual do statement/capa — mais elegante, com ícone ou imagem opcional
- [ ] Atualizar o Check List do One Innovation para usar o novo visual

## Gráficos na Aba Respostas
- [ ] Gráfico de pizza: distribuição PF vs PJ
- [ ] Gráfico de barras: respostas por dia
- [ ] Cards de estatísticas melhorados

## Duplicar Formulário
- [ ] Botão de duplicar/clonar formulário no dashboard

## Salvar Respostas Parciais
- [ ] Salvar progresso no localStorage ao responder
- [ ] Ao reabrir o formulário, perguntar se quer continuar de onde parou
- [ ] Limpar dados salvos ao completar o formulário

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
