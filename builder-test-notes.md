# Builder Test Notes — 2026-02-24

## Estado Atual
- Builder com 3 painéis funcionando: Sidebar (tipos) | Canvas (fluxo) | Config (configurações)
- Múltipla Escolha adicionada com sucesso
- Aba Lógica mostra as 3 opções (A, B, C) com dropdowns para direcionar cada uma
- Lógica condicional ativada via switch — mostra ícone de branching no canvas
- Dropdowns mostram: "Próxima pergunta (padrão)", "Ir para agradecimento", "Obrigado!"
- Nota: O dropdown precisa listar as outras perguntas do formulário, não só "agradecimento"
- Quando mais perguntas forem adicionadas, o dropdown deve mostrar todas elas como destino

## Issues Encontrados
1. O tipo mostrado no canvas diz "Seleção de Lista" mas deveria ser "Múltipla Escolha" — preciso verificar se o tipo está sendo mapeado corretamente
2. Os dropdowns de destino só mostram "Obrigado!" como opção além do padrão — correto pois só temos Welcome e Thank You no form. Quando adicionarmos mais perguntas, aparecerão mais opções.

## Próximos Passos
- Testar o Preview com formulário montado
- Adicionar mais tipos de pergunta e testar o fluxo completo
- Polir a UI do builder
