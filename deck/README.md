# Deck de Vendas Vitacon — Gerador de PDF (template 16:9)

Gera o PDF de apresentação de um empreendimento Vitacon (padrão **ON Paulista**)
a partir de um arquivo de dados + uma pasta de fotos. Saída em **16:9 (1920×1080)**,
na identidade visual da Vitacon (preto + azul elétrico `#2800FF`, wordmark, Archivo).

## Como gerar

```bash
node deck/build.mjs on-paulista
# → deck/empreendimentos/on-paulista/on-paulista.pdf
```

Não precisa instalar nada: usa o Chromium já presente no ambiente
(`--print-to-pdf`). Se o binário estiver em outro lugar, defina `CHROME_BIN`.

## Estrutura

```
deck/
├── build.mjs                     # motor: dados.json → HTML → PDF
├── template/
│   ├── styles.css                # tokens da marca + estilos dos componentes
│   ├── components.mjs            # 1 função de render por tipo de slide
│   └── fonts/                    # Archivo (400–800), embutida
├── assets-fixos/                 # institucional (igual p/ TODO prédio)
│   ├── vitacon-wordmark.png
│   ├── inst-ultimas-entregas.jpg · inst-mural-parceiros.jpg
│   ├── inst-92-valorizacao.jpg · inst-housi-appspace.jpg
│   ├── inst-cafe-manha.jpg · inst-housi-housekeeping.jpg
│   └── inst-superior-concorrentes.jpg
└── empreendimentos/
    └── on-paulista/
        ├── dados.json            # TODO o conteúdo variável do prédio
        ├── fotos/                # renders + fotos do entorno do prédio
        └── on-paulista.pdf       # saída
```

## Criar um prédio novo

1. `cp -r deck/empreendimentos/on-paulista deck/empreendimentos/<novo-slug>`
2. Troque as fotos em `fotos/` (mesmos nomes) e edite `dados.json`.
3. `node deck/build.mjs <novo-slug>`

> No fluxo com a Vitacon: você me manda as fotos e os dados **soltos no chat**
> e eu preencho o `dados.json` + coloco as fotos com os nomes certos.

## O que é FIXO × VARIÁVEL

| | Conteúdo | Onde fica |
|---|---|---|
| 🔵 **Fixo** | Números Vitacon (15 anos/+25 mil/+100), últimas entregas, mural de parceiros, 92% de valorização (VN), HOUSI Appspace, café da manhã, housekeeping, concorrentes | `assets-fixos/` |
| 🔴 **Variável** | Nome, localização, POIs, geradores de demanda do entorno, renders/fotos, tabela de rentabilidade, plano de pagamento, simulação, texto legal | `dados.json` + `fotos/` |

## Tipos de slide (`dados.json → slides[].tipo`)

`capa` · `imagem` (full-bleed, `chrome:false`; `fixo` p/ institucional ou `imagem` p/ foto do prédio; `fit:"contain"` p/ plantas) · `estatistica` · `lista` · `institucional` · `divisor` (`fundo:"azul"|"preto"`, `destaque:true`) · `demanda` · `comparativo` · `plano` · `simulacao` · `cadastro` · `juridico`.

Formatação: use `**texto**` em títulos para destacar em azul.

## Kit que preciso por prédio (o que você manda)

- **Localização**: nome + endereço, fluxo de pessoas da via, frase-âncora, POIs próximos com distâncias, fotos do entorno + 1 aérea.
- **Demanda**: geradores de demanda do entorno (universidades, arenas, polos) com números.
- **Produto**: renders (fachada, apto, plantas, áreas comuns), metragem/tipologia, tabela ocupação/diária/rentabilidade.
- **Dados**: valor do imóvel, % entrada, prazo/taxa, diária, ocupação e taxas → a simulação eu calculo.
- **Cadastro**: texto legal da incorporação (matrícula/CRECI) e link/QR do cadastro.
