# Análise dos PDFs de Ficha

## FICHA PF (Pessoa Física) - Intenção de Compra
Campos do PDF:
- **Header**: Logo Innova, DATA DO CADASTRO
- **Empreendimento**: Empreendimento, Bloco/Unidade, Nº da FAC, End. do Imóvel, Tipo de Planta

### PROPONENTE 1:
- Nome, Sexo (MASC/FEM), CPF Nº, Nacionalidade, Data de Nasc.
- Identidade Nº, I DIG., Profissão
- EST. CIVIL: SOLTEIRO / CASADO / UNIÃO ESTÁVEL / DIVORCIADO / VIUVO
- DATA DE CASAM./U.E.
- REGIME DE CASAMENTO: COMUNHÃO PARCIAL DE BENS / COMUNHÃO UNIVERSAL DE BENS / SEPARAÇÃO TOTAL DE BENS / PACTO NUPCIAL
- Renda Mensal R$, Tel. Residencial, Celular
- Endereço Residencial / Nº / Complemento, CEP
- Bairro Residencial, Cidade Residencial, Estado
- E-mail

### PROPONENTE 2 (mesmos campos do Proponente 1):
- Mesma estrutura completa

### CHECK LIST DE DOCUMENTOS:
- Proponente 1: RG E CPF (ou CNH), Comprovante de Residência, Comprovante de Estado Civil
- Proponente 2: mesmos documentos

---

## FICHA PJ (Pessoa Jurídica) - Cadastro de Interesse
Campos do PDF:
- **Header**: Logo Innova, DATA DO CADASTRO
- **Empreendimento**: Empreendimento, Bloco/Unidade, Nº da FAC, End. do Imóvel, Tipo de Planta

### EMPRESA:
- Empresa (nome), CNPJ/MF
- Endereço / Nº / Complemento, CEP
- Bairro, Cidade, Estado
- Contato, Recado, E-mail

### SÓCIO 1:
- Nome, Sexo (MASC/FEM), CPF/MF Nº, Nacionalidade, Data de Nasc.
- Identidade Nº, E DIG.
- Renda Mensal R$, Tel. Residencial, Celular
- Endereço Residencial / Nº / Complemento, CEP
- Bairro Residencial, Cidade Residencial, Estado
- E-mail

### SÓCIO 2 (mesmos campos do Sócio 1)

### CHECK LIST DE DOCUMENTOS:
- CNPJ, Contrato Social, Alteração Contratual
- Sócio 1: RG E CPF (ou CNH), Comprovante de Residência, Comprovante de Estado Civil
- Sócio 2: mesmos documentos

---

## Lógica de preenchimento:
- Se resposta tem CPF → gerar FICHA PF
- Se resposta tem CNPJ → gerar FICHA PJ
- Estado civil no formulário é uma pergunta única, mas na ficha PF se desdobra em:
  1. EST. CIVIL (checkbox: solteiro/casado/união estável/divorciado/viúvo)
  2. REGIME DE CASAMENTO (se casado/união estável): comunhão parcial/universal/separação total/pacto nupcial
  - DATA DE CASAM./U.E. (se aplicável)
- Proponente 2 na PF = cônjuge/companheiro (se casado/união estável)
- Sócio 2 na PJ = segundo sócio (se houver)
