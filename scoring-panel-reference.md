# Respondi Scoring Panel Reference

## From IMG_0955.png (full panel view):
- Modal dialog titled "Pontuação" with X close button
- Toggle at top: "Habilitar pontuação" with subtitle "Atribua uma pontuação para cada resposta enviada."
- Lists ALL multiple-choice questions from the form
- Each question shows: question title + point range badge (e.g., "0 → 1 PONTOS", "0 → 9 PONTOS")
- Collapsed questions show just title + range
- Expanded question (Estado civil) shows all options with number inputs:
  - Solteiro(a) = 9
  - Casado(a) (União estável) = 2
  - casado(a) (separação total) = 9
  - casado(a) (comunhão total) = 2
  - casado(a) (comunhão parcial) = 2
  - separado(a) judicialmente = 9
  - Divorciado(a) = 9
  - Viuvo(a) = 9
- "Salvar" button at bottom (blue)

## From IMG_0956.png (expanded view):
- Same modal but scrolled down
- Shows the expanded Estado civil question with all options and scores
- Below it: "Sexo" with "0 → 0 PONTOS"
- Below: "Quantas unidade você tem interesse?" with "0 → 0 PONTOS"
- Salvar button at bottom

## Key Design Elements:
- Clean white modal with subtle borders
- Question titles are bold/medium weight
- Point range badges are small, gray, right-aligned
- Number inputs are small, right-aligned, with border
- Click on question row to expand/collapse
- Global toggle enables/disables ALL scoring at once
