# Field Mapping: Form Questions → PDF Fields

## Estado Civil choices → PDF checkboxes mapping:
- "Solteiro(a)" → SOLTEIRO checkbox
- "Casado(a) (União estável)" → CASADO checkbox + COMUNHÃO PARCIAL regime (default for UE)
  - Actually it's "União Estável" so → CASADO checkbox (since PDF has no UE checkbox, map to closest)
  - Wait, PDF HAS: SOLTEIRO / CASADO / UNIÃO ESTÁVEL / DIVORCIADO / VIUVO
  - So: "Casado(a) (União estável)" → UNIÃO ESTÁVEL checkbox
- "casado(a) (separação total)" → CASADO checkbox + SEPARAÇÃO TOTAL regime
- "casado(a) (comunhão total)" → CASADO checkbox + COMUNHÃO UNIVERSAL regime  
- "casado(a) (comunhão parcial)" → CASADO checkbox + COMUNHÃO PARCIAL regime
- "separado(a) judicialmente" → DIVORCIADO checkbox (closest match)
- "Divorciado(a)" → DIVORCIADO checkbox
- "Viúvo(a)" → VIUVO checkbox

## Needs cônjuge (Proponente 2):
- c_casado_ue, c_casado_st, c_casado_ct, c_casado_cp → YES, fill Proponente 2
- Others → NO, leave Proponente 2 blank

## PF Form Questions → PDF PF Fields:
| Question ID | Form Label | PDF Field |
|---|---|---|
| q23_pf_nome | Nome completo | Proponente 1 Nome |
| q24_pf_cpf | CPF | CPF Nº |
| q25_pf_nascimento | Data de nascimento | Data de Nasc. |
| q27_pf_nacionalidade | Nacionalidade | Nacionalidade |
| q28_pf_estado_civil | Estado civil | EST. CIVIL checkboxes + REGIME |
| q29_pf_rg | Identidade nº (RG) | Identidade Nº |
| q30_pf_celular | Celular | Celular |
| q31_pf_email | E-mail | E-mail |
| q32_pf_endereco | Endereço residencial | Endereço + CEP + Bairro + Cidade + Estado |
| q33_pf_profissao | Profissão | Profissão |
| q34_pf_renda | Renda mensal | Renda Mensal R$ |

## Cônjuge (Proponente 2) - same address + estado civil as P1:
| Question ID | Form Label | PDF Field |
|---|---|---|
| q41_conjuge_nome | Nome completo do cônjuge | Proponente 2 Nome |
| q42_conjuge_cpf | CPF | CPF Nº |
| q43_conjuge_nascimento | Data de nascimento | Data de Nasc. |
| q44_conjuge_celular | Celular | Celular |
| q45_conjuge_email | E-mail | E-mail |
| q47_conjuge_nacionalidade | Nacionalidade | Nacionalidade |
| q48_conjuge_rg | Identidade nº (RG) | Identidade Nº |
| q49_conjuge_profissao | Profissão | Profissão |
| (copy from P1) | - | Endereço, CEP, Bairro, Cidade, Estado |
| (copy from P1) | - | EST. CIVIL + REGIME |

## PJ Form Questions → PDF PJ Fields:
| Question ID | Form Label | PDF Field |
|---|---|---|
| q3_pj_nome_socio | Nome completo do sócio | Socio_1 (name) |
| q4_pj_cpf | CPF | CPF_Socio_1 |
| q5_pj_nascimento | Data de nascimento | Nasc_Socio1_dia/mes/ano |
| q7_pj_nacionalidade | Nacionalidade | Nacion_Socio_1 |
| q8_pj_rg | Identidade nº (RG) | RG_Socio_1 |
| q9_pj_celular | Celular | Cel_Socio_1 |
| q10_pj_email | E-mail | Email_Socio_1 |
| q11_pj_endereco | Endereço residencial | End_Socio_1 + Cep/Bairro/Cidade/Estado |
| q12_pj_renda | Renda mensal | Renda_Socio_1 |
| q14_pj_nome_empresa | Nome da empresa | Empresa |
| q15_pj_cnpj | CNPJ/MF | CNPJ_Empresa |
| q16_pj_email_comercial | E-mail comercial | E-mail_Empresa |
