# FormFlow Builder — Todo List

## Fase 1: Tipos e Interfaces
- [ ] Definir interface QuestionType com todos os 28 tipos
- [ ] Definir interface FormBuilder (estado do builder)
- [ ] Definir interface ConditionalLogic (branching)
- [ ] Criar dados de categorias e tipos de pergunta para o sidebar

## Fase 2: Layout do Builder
- [ ] Criar página /builder/:id com layout 3 colunas (sidebar tipos + canvas + config)
- [ ] Sidebar esquerdo: lista de tipos de pergunta por categoria
- [ ] Canvas central: lista de perguntas adicionadas (drag-and-drop)
- [ ] Painel direito: configurações da pergunta selecionada
- [ ] Header do builder com nome do formulário, preview e salvar

## Fase 3: 28 Tipos de Pergunta
- [ ] Nome próprio
- [ ] E-mail
- [ ] Telefone
- [ ] CPF (com validação)
- [ ] CNPJ (com validação)
- [ ] Documento de Identidade
- [ ] Endereço (busca por CEP)
- [ ] Resposta curta
- [ ] Texto longo
- [ ] Mensagem/Statement
- [ ] Número
- [ ] Valor Monetário
- [ ] Link/Website
- [ ] Múltipla Escolha
- [ ] Seleção de Lista (Dropdown)
- [ ] Seleção de Imagem
- [ ] Sim/Não
- [ ] Checkbox
- [ ] Escala de Satisfação
- [ ] Rating (Estrelas)
- [ ] NPS
- [ ] Ranking
- [ ] Matrix
- [ ] Data
- [ ] Arquivo Anexo (Upload)
- [ ] Boas-vindas (Welcome Screen)
- [ ] Agradecimento (End Screen)
- [ ] Termos de Uso (Legal)

## Fase 4: Lógica Condicional
- [ ] UI para definir condições em múltipla escolha
- [ ] Mapeamento: opção → próxima pergunta
- [ ] Visualização do fluxo condicional
- [ ] Engine de navegação condicional no formulário

## Fase 5: Validações Especiais
- [ ] Validação de CPF (algoritmo real)
- [ ] Validação de CNPJ
- [ ] Busca de endereço por CEP (API ViaCEP)
- [ ] Máscara de telefone
- [ ] Máscara de valor monetário

## Fase 6: Preview e Integração
- [ ] Botão de preview que abre o formulário conversacional
- [ ] Conectar dados do builder ao FormContainer existente
- [ ] Rota /form/:id renderiza formulário criado

## Fase 7: Polimento
- [ ] Animações de drag-and-drop
- [ ] Responsividade
- [ ] Testes de fluxo completo
