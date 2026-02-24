# Preview Progress Notes

## Status: Working!
- Preview overlay opens correctly from Builder
- Welcome screen shows with "Começar" button
- Clicking "Começar" navigates to first question "Qual é o seu nome?"
- Input field shows with placeholder "Digite seu nome completo..."
- Progress bar shows "01" with line
- Navigation controls (Enviar, Voltar) appear at bottom right
- Fechar button works to close preview
- FormFlow logo link visible at top left

## Issues to fix:
- The builder panels (sidebar, canvas, config) are still visible behind the preview overlay - need to increase z-index or make backdrop more opaque
- The preview should hide the builder elements completely

## Next steps:
- Need to fix the FormView.tsx import error in App.tsx
- Need to ensure builderToForm.ts properly converts all 28 question types
- Need to add more question types to the preview renderer (QuestionRenderer)
- The current QuestionRenderer only supports: short-text, email, long-text, multiple-choice, multiple-select, rating, yes-no, date, phone, number
- Missing from renderer: cpf, cnpj, identity-doc, address, statement, currency, link, dropdown, image-choice, checkbox, satisfaction, nps, ranking, matrix, file-upload, legal
