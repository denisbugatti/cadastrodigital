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
