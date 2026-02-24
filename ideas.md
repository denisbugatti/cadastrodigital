# FormFlow — Brainstorm de Design

## Objetivo
Criar uma plataforma de formulários interativos com interface conversacional, mostrando uma pergunta por vez com animações suaves e design premium. Inspirado no Typeform, com foco em experiência do usuário e design minimalista.

---

<response>
## Ideia 1 — "Cinematic Immersion"

<text>
**Design Movement:** Cinema-inspired editorial design com influências de motion graphics e storytelling visual.

**Core Principles:**
1. Cada pergunta é uma "cena" — com sua própria atmosfera visual
2. Transições cinematográficas entre perguntas (fade + slide vertical suave)
3. Tipografia dramática com hierarquia forte
4. Fundo escuro com acentos luminosos que guiam o olhar

**Color Philosophy:** Paleta escura (deep navy #0A0E27) com acentos em coral vibrante (#FF6B6B) e branco puro. A escuridão cria foco e imersão, enquanto o coral atrai atenção para elementos interativos. O contraste alto transmite confiança e modernidade.

**Layout Paradigm:** Full-viewport vertical — cada pergunta ocupa 100vh com a pergunta centralizada verticalmente mas deslocada para a esquerda (60/40 split). O lado direito pode conter elementos visuais decorativos ou indicadores de progresso verticais.

**Signature Elements:**
1. Barra de progresso lateral vertical com glow effect
2. Números de pergunta grandes e semi-transparentes como watermark
3. Cursor personalizado que reage ao hover sobre elementos interativos

**Interaction Philosophy:** Cada interação deve sentir como avançar em uma narrativa. Cliques produzem ripple effects suaves, transições são cinematográficas com easing personalizado.

**Animation:** Perguntas entram com slide-up + fade (400ms, cubic-bezier(0.16, 1, 0.3, 1)). Elementos de resposta aparecem em cascata com stagger de 80ms. Ao avançar, a pergunta atual sai com fade-out + scale down sutil.

**Typography System:** Display: "Space Grotesk" (bold, 48-64px para perguntas). Body: "Inter" (regular, 16-18px para opções e labels). Monospace accent: "JetBrains Mono" para numeração.
</text>
<probability>0.06</probability>
</response>

---

<response>
## Ideia 2 — "Organic Flow"

<text>
**Design Movement:** Scandinavian minimalism encontra design orgânico — inspirado em interfaces naturais e fluidas como água.

**Core Principles:**
1. Fluidez absoluta — nada é estático, tudo respira
2. Formas suaves e orgânicas, sem cantos retos agressivos
3. Espaço generoso que transmite calma e clareza
4. Micro-animações que fazem a interface parecer viva

**Color Philosophy:** Base em off-white quente (#FAFAF8) com tons de verde-salvia (#7C9082) como cor primária e terracota suave (#C4956A) como acento. Inspirado em materiais naturais — linho, cerâmica, madeira clara. Transmite acolhimento e confiança sem ser frio ou corporativo.

**Layout Paradigm:** Centro flutuante — a pergunta vive em um card flutuante centralizado que se expande e contrai organicamente conforme o tipo de pergunta. O fundo tem texturas sutis (grain noise) que mudam suavemente entre perguntas. Progresso indicado por uma linha orgânica que cresce na parte inferior.

**Signature Elements:**
1. Card de pergunta com sombra suave e borda quase imperceptível que "respira" (pulse sutil)
2. Indicador de progresso como uma linha orgânica que se desenha progressivamente
3. Ícones hand-drawn style para tipos de input

**Interaction Philosophy:** Tudo responde ao toque como se fosse material real. Botões têm spring physics, cards têm elasticidade. A interface convida ao toque com affordances claras mas nunca grita.

**Animation:** Spring-based animations (framer-motion spring config: stiffness 300, damping 30). Perguntas transitam com morphing suave do card. Elementos aparecem com scale(0.95→1) + opacity(0→1) com timing orgânico (não linear). Background grain se move sutilmente.

**Typography System:** Display: "DM Serif Display" (44-56px, para perguntas — serif elegante que transmite humanidade). Body: "DM Sans" (16-18px, para opções — sans-serif limpa que complementa). Peso variável para criar hierarquia sem trocar fontes.
</text>
<probability>0.08</probability>
</response>

---

<response>
## Ideia 3 — "Swiss Precision"

<text>
**Design Movement:** Neo-Brutalism Suíço — a precisão do design suíço com toques contemporâneos de neo-brutalism (bordas definidas, tipografia bold, grid rigoroso).

**Core Principles:**
1. Grid matemático rigoroso — cada pixel tem propósito
2. Tipografia como elemento gráfico principal
3. Contraste máximo entre elementos
4. Funcionalidade elevada a arte

**Color Philosophy:** Preto (#000000) e branco (#FFFFFF) como base absoluta, com uma única cor de acento — amarelo elétrico (#FFE600). O amarelo é usado cirurgicamente: apenas em CTAs, progresso e estados ativos. A restrição cromática cria sofisticação e foco.

**Layout Paradigm:** Grid assimétrico dividido — a tela é cortada por uma linha vertical no terço esquerdo. O número da pergunta e metadados ficam no terço esquerdo (fundo preto), enquanto a pergunta e inputs ocupam os dois terços direitos (fundo branco). Cria tensão visual e hierarquia clara.

**Signature Elements:**
1. Números de pergunta gigantes (200px+) no painel esquerdo como elemento gráfico
2. Linha divisória vertical animada que pulsa sutilmente
3. Cursor que muda de forma conforme o contexto (seta, mão, texto)

**Interaction Philosophy:** Precisão mecânica — cada clique tem feedback imediato e definitivo. Sem ambiguidade. Hover states são instantâneos com mudança de cor hard-cut (sem fade). A interface comunica eficiência e competência.

**Animation:** Transições rápidas e decisivas (200ms, ease-out). Perguntas entram com clip-path reveal de baixo para cima. Números no painel esquerdo fazem counter animation. Sem bounce, sem spring — tudo é preciso e intencional.

**Typography System:** Display: "Instrument Serif" (64-96px para números, 36-48px para perguntas). Body: "Geist" (16-18px para opções). A combinação serif gigante + sans-serif limpa cria o contraste suíço clássico.
</text>
<probability>0.04</probability>
</response>
