# PF PDF Verified Field Coordinates

Positions verified - text lands inside the correct boxes. Minor adjustments needed:
- DATA DO CADASTRO: overlaps with label text. Need to shift right to the actual date fields (the __/__/____ area)
- Checkbox X for CASADO: slightly off to the left, needs x+2
- Checkbox X for COMUNHÃO PARCIAL: slightly off, needs x+2
- CELULAR: text overlaps with parentheses, need to shift right

## Proponente 1 verified coordinates (value text inside boxes):
- CPF: x=57, y=607
- NACIONALIDADE: x=282, y=607  
- DATA DE NASC: x=492, y=607
- IDENTIDADE: x=57, y=582
- PROFISSÃO: x=222, y=582
- RENDA MENSAL: x=57, y=507
- CELULAR: x=435, y=507 (shift right to avoid parens)
- ENDEREÇO: x=57, y=487
- CEP: x=502, y=487
- BAIRRO: x=57, y=467
- CIDADE: x=252, y=467
- ESTADO: x=462, y=467
- E-MAIL: x=57, y=447

## Estado Civil checkboxes (y=553):
- SOLTEIRO: x=67
- CASADO: x=139
- UNIÃO ESTÁVEL: x=209
- DIVORCIADO: x=314
- VIUVO: x=404

## Regime de Casamento checkboxes (y=528):
- COMUNHÃO PARCIAL: x=69
- COMUNHÃO UNIVERSAL: x=214
- SEPARAÇÃO TOTAL: x=374
- PACTO NUPCIAL: x=484

## Proponente 2 (same x, y shifted down by ~220)
- Offset from P1: subtract ~220 from y values
- CPF: x=57, y=387
- NACIONALIDADE: x=282, y=387
- etc.

## DATA DO CADASTRO (header):
- Need to find the actual __/__/____ position
- Approximately: day x=460, month x=478, year x=498, all at y=800
