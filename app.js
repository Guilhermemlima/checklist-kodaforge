/* ══════════════════════════════════════════
   Koda Forge Dashboard — app.js
   ══════════════════════════════════════════ */

// ── State ──────────────────────────────────
const state = {
  partners: { socio1: 'Sócio 1', socio2: 'Sócio 2', socio3: 'Sócio 3', socio4: 'Sócio 4' },
  checklists: { socio1: [], socio2: [], socio3: [], socio4: [] },
  igPrompts: [],
  convPrompts: [],
  activePartnerFilter: 'all',
  activeIGFilter: 'all',
  activeConvType: 'inicio',
};

// ── Helpers ────────────────────────────────
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  setTimeout(() => (el.className = 'toast'), 2400);
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = '✓ Copiado!';
    setTimeout(() => (btn.textContent = orig), 1500);
    toast('Copiado para a área de transferência!', 'success');
  });
}

function saveToStorage(key, val) {
  localStorage.setItem('koda_' + key, JSON.stringify(val));
}
function loadFromStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem('koda_' + key)) ?? fallback; } catch { return fallback; }
}

function tagClass(format) {
  const map = { post:'tag-post', reel:'tag-reel', story:'tag-story', carrossel:'tag-carrossel',
                inicio:'tag-inicio', retomada:'tag-retomada', followup:'tag-followup' };
  return map[format] ?? 'tag-default';
}

// ── Date ───────────────────────────────────
function setDate() {
  const d = new Date();
  const day  = d.toLocaleDateString('pt-BR', { weekday:'long', day:'2-digit', month:'long' });
  const el = document.getElementById('currentDate');
  if (el) {
    el.innerHTML = `${day.charAt(0).toUpperCase() + day.slice(1)}<span>${d.getFullYear()}</span>`;
  }
}

// ── Nav ────────────────────────────────────
document.querySelectorAll('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
  });
});

// ── Partner modal ──────────────────────────
document.getElementById('editPartnersBtn').addEventListener('click', () => {
  document.getElementById('nameS1').value = state.partners.socio1;
  document.getElementById('nameS2').value = state.partners.socio2;
  document.getElementById('nameS3').value = state.partners.socio3;
  document.getElementById('nameS4').value = state.partners.socio4;
  document.getElementById('partnersModal').classList.add('open');
});
document.getElementById('closeModal').addEventListener('click', () =>
  document.getElementById('partnersModal').classList.remove('open'));
document.getElementById('savePartners').addEventListener('click', () => {
  const n1 = document.getElementById('nameS1').value.trim() || 'Sócio 1';
  const n2 = document.getElementById('nameS2').value.trim() || 'Sócio 2';
  const n3 = document.getElementById('nameS3').value.trim() || 'Sócio 3';
  const n4 = document.getElementById('nameS4').value.trim() || 'Sócio 4';
  state.partners = { socio1: n1, socio2: n2, socio3: n3, socio4: n4 };
  saveToStorage('partners', state.partners);
  document.getElementById('btn-socio1').textContent = n1;
  document.getElementById('btn-socio2').textContent = n2;
  document.getElementById('btn-socio3').textContent = n3;
  document.getElementById('btn-socio4').textContent = n4;
  document.querySelectorAll('[data-partner]').forEach(b => {
    if (b.dataset.partner === 'socio1') b.textContent = n1;
    if (b.dataset.partner === 'socio2') b.textContent = n2;
    if (b.dataset.partner === 'socio3') b.textContent = n3;
    if (b.dataset.partner === 'socio4') b.textContent = n4;
  });
  document.querySelectorAll('option[value="socio1"]').forEach(o => o.textContent = n1);
  document.querySelectorAll('option[value="socio2"]').forEach(o => o.textContent = n2);
  document.querySelectorAll('option[value="socio3"]').forEach(o => o.textContent = n3);
  document.querySelectorAll('option[value="socio4"]').forEach(o => o.textContent = n4);
  document.getElementById('partnersModal').classList.remove('open');
  renderChecklists();
  toast('Nomes atualizados!', 'success');
});

// ── Partner filter ─────────────────────────
document.querySelectorAll('.partner-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.partner-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activePartnerFilter = btn.dataset.partner;
    renderChecklists();
  });
});

// ── IG filter ──────────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeIGFilter = btn.dataset.format;
    renderIGPrompts();
  });
});

// ── Conv type tabs ─────────────────────────
document.querySelectorAll('.conv-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.conv-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.activeConvType = btn.dataset.convtype;
    document.getElementById('convType').value = btn.dataset.convtype;
    renderConvPrompts();
  });
});

// ══════════════════════════════════════════
// ── AI ENGINE (local, deterministic) ──────
// ══════════════════════════════════════════

const TASK_BANK = {
  vendas: [
    { text: 'Prospectar 5 novos leads no Instagram', tag: 'prospecção' },
    { text: 'Enviar follow-up para leads em aberto', tag: 'follow-up' },
    { text: 'Atualizar pipeline de vendas no CRM', tag: 'CRM' },
    { text: 'Preparar proposta comercial para lead quente', tag: 'proposta' },
    { text: 'Ligar para 3 clientes antigos para reengajamento', tag: 'reengajamento' },
    { text: 'Analisar métricas de conversão da semana', tag: 'métricas' },
    { text: 'Definir meta de vendas para os próximos 7 dias', tag: 'meta' },
    { text: 'Pesquisar concorrentes e atualizar comparativo', tag: 'mercado' },
  ],
  marketing: [
    { text: 'Criar 1 post de conteúdo educativo para o Instagram', tag: 'conteúdo' },
    { text: 'Gravar ou roteirizar 1 reel de autoridade', tag: 'reel' },
    { text: 'Interagir com 10 perfis do nicho (curtir/comentar)', tag: 'engajamento' },
    { text: 'Responder todos os comentários e DMs em aberto', tag: 'comunidade' },
    { text: 'Analisar métricas do Instagram (alcance, seguidores)', tag: 'métricas' },
    { text: 'Planejar pauta de conteúdo para os próximos 7 dias', tag: 'planejamento' },
    { text: 'Publicar story mostrando bastidores do trabalho', tag: 'story' },
    { text: 'Pesquisar 3 tendências do nicho para conteúdo', tag: 'tendências' },
  ],
  produto: [
    { text: 'Revisar backlog e priorizar top 3 funcionalidades', tag: 'backlog' },
    { text: 'Fazer code review de PR pendente', tag: 'código' },
    { text: 'Escrever ou atualizar documentação técnica', tag: 'docs' },
    { text: 'Corrigir bug crítico reportado por usuário', tag: 'bugfix' },
    { text: 'Testar fluxo principal do produto como usuário', tag: 'QA' },
    { text: 'Pesquisar feedback de clientes e registrar insights', tag: 'feedback' },
    { text: 'Planejar sprint da próxima semana', tag: 'sprint' },
    { text: 'Configurar ou revisar integração de sistema', tag: 'integração' },
  ],
  financeiro: [
    { text: 'Conferir entradas e saídas do dia no fluxo de caixa', tag: 'caixa' },
    { text: 'Emitir notas fiscais / cobranças pendentes', tag: 'NF' },
    { text: 'Revisar despesas fixas e buscar otimizações', tag: 'custos' },
    { text: 'Atualizar planilha de métricas financeiras', tag: 'planilha' },
    { text: 'Verificar inadimplências e acionar cobrança se necessário', tag: 'cobrança' },
    { text: 'Calcular MRR / ARR atualizado', tag: 'MRR' },
    { text: 'Planejar alocação do orçamento da semana', tag: 'orçamento' },
    { text: 'Avaliar ROI de campanhas ativas', tag: 'ROI' },
  ],
  geral: [
    { text: 'Revisar e responder e-mails / mensagens urgentes', tag: 'comunicação' },
    { text: 'Fazer check-in com o time e alinhar prioridades', tag: 'equipe' },
    { text: 'Reservar 30 min para aprendizado / leitura', tag: 'crescimento' },
    { text: 'Revisar metas da semana e ajustar plano se necessário', tag: 'metas' },
    { text: 'Organizar arquivos e notas do projeto', tag: 'organização' },
    { text: 'Criar relatório rápido de progresso para os sócios', tag: 'relatório' },
    { text: 'Identificar 1 gargalo no processo e propor solução', tag: 'processo' },
    { text: 'Bloquear tempo para trabalho profundo sem interrupções', tag: 'foco' },
  ],
};

function pickTasks(focus, count = 5, seed = 0) {
  const pool = TASK_BANK[focus] ?? TASK_BANK.geral;
  const result = [];
  const used = new Set();
  // deterministic shuffle per seed
  for (let i = 0; i < count; i++) {
    let idx = (seed * 3 + i * 7 + i) % pool.length;
    let tries = 0;
    while (used.has(idx) && tries < pool.length) { idx = (idx + 1) % pool.length; tries++; }
    used.add(idx);
    result.push({ ...pool[idx], done: false, id: `${focus}_${seed}_${i}` });
  }
  return result;
}

function generateChecklists(focus, targetPartner, context) {
  const partners = targetPartner === 'all'
    ? ['socio1', 'socio2', 'socio3', 'socio4']
    : [targetPartner];

  const today = new Date();
  const seed = today.getDate() + today.getMonth() * 31;

  partners.forEach((p, pi) => {
    // 5 focus tasks + 1 or 2 contextual if context provided
    const tasks = pickTasks(focus, 5, seed + pi * 13);
    if (context && context.trim()) {
      tasks.push({ text: `[Contexto] ${context.trim()}`, tag: 'urgente', done: false, id: 'ctx_' + pi });
    }
    state.checklists[p] = tasks;
  });

  saveToStorage('checklists', state.checklists);
  renderChecklists();
}

// ── Render Checklists ──────────────────────
function renderChecklists() {
  const grid = document.getElementById('checklistGrid');
  const filter = state.activePartnerFilter;
  const partners = filter === 'all'
    ? ['socio1', 'socio2', 'socio3', 'socio4']
    : [filter];

  const avClass = { socio1:'av-1', socio2:'av-2', socio3:'av-3', socio4:'av-4' };

  const anyTasks = partners.some(p => state.checklists[p].length > 0);
  if (!anyTasks) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🤖</div>
        <p>Clique em <strong>"Gerar Checklist"</strong> para a IA criar tarefas personalizadas para hoje.</p>
      </div>`;
    return;
  }

  grid.innerHTML = partners.map(p => {
    const tasks = state.checklists[p];
    if (!tasks.length) return '';
    const done  = tasks.filter(t => t.done).length;
    const pct   = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    const initials = state.partners[p].split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    return `
      <div class="partner-card" data-p="${p}">
        <div class="partner-card-header">
          <div class="partner-name">
            <div class="partner-avatar ${avClass[p]}">${initials}</div>
            ${state.partners[p]}
          </div>
          <div class="progress-wrap">
            <span class="progress-text">${done}/${tasks.length}</span>
            <div class="progress-bar-track">
              <div class="progress-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>
        </div>
        <ul class="task-list">
          ${tasks.map((t, i) => `
            <li class="task-item ${t.done ? 'done' : ''}" data-partner="${p}" data-idx="${i}">
              <div class="task-check">${t.done ? '✓' : ''}</div>
              <span class="task-text">${t.text}</span>
              <span class="task-tag">${t.tag}</span>
            </li>`).join('')}
        </ul>
      </div>`;
  }).join('');

  // toggle done
  grid.querySelectorAll('.task-item').forEach(item => {
    item.addEventListener('click', () => {
      const p = item.dataset.partner;
      const i = parseInt(item.dataset.idx);
      state.checklists[p][i].done = !state.checklists[p][i].done;
      saveToStorage('checklists', state.checklists);
      renderChecklists();
    });
  });
}

document.getElementById('generateChecklist').addEventListener('click', () => {
  const focus = document.getElementById('focusSelect').value;
  const partner = document.getElementById('partnerSelect').value;
  const context = document.getElementById('contextInput').value;
  generateChecklists(focus, partner, context);
  toast('Checklist gerada com sucesso!', 'success');
});

// ══════════════════════════════════════════
// ── INSTAGRAM PROMPTS ─────────────────────
// ══════════════════════════════════════════

const IG_TEMPLATES = {
  post: {
    engajamento: (niche, tone) => ({
      title: 'Post de Engajamento — Pergunta Estratégica',
      body: `📢 [PERGUNTA PROVOCATIVA SOBRE ${niche.toUpperCase()}]

Você já parou pra pensar em quanto tempo está perdendo sem automatizar isso?

Me conta nos comentários: qual é o maior desafio que você enfrenta hoje com ${niche}?

👇 Deixa aqui embaixo — prometo responder todo mundo!

#${slugify(niche)} #empreendedorismo #negociosonline #marketingdigital`,
    }),
    autoridade: (niche, tone) => ({
      title: 'Post de Autoridade — Insight Exclusivo',
      body: `💡 ${niche.toUpperCase()}: o que ninguém te conta

Depois de trabalhar com +50 clientes neste mercado, percebi um padrão claro:

→ 80% dos erros vêm de 3 problemas específicos
→ A solução é simples, mas pouca gente aplica
→ Quem aplica, cresce 3x mais rápido

Salva esse post porque vou detalhar cada ponto.

#autoridade #${slugify(niche)} #resultados`,
    }),
    vendas: (niche, tone) => ({
      title: 'Post de Vendas — Oferta com Prova',
      body: `✅ Se você trabalha com ${niche}, isso é pra você.

Nosso cliente [Nome] estava exatamente onde você está:
→ Sem processo definido
→ Perdendo tempo com tarefas manuais
→ Sem previsibilidade de receita

Em 60 dias com a gente: +R$15k no faturamento.

Quer entender como? Manda "QUERO" no direct 👇

#${slugify(niche)} #resultados #casodesuesso`,
    }),
    educativo: (niche, tone) => ({
      title: 'Post Educativo — 3 Dicas Práticas',
      body: `📚 3 dicas de ${niche} que mudaram o jogo pra mim:

1️⃣ [Dica 1 — seja específico e direto]
2️⃣ [Dica 2 — traga dado ou exemplo real]
3️⃣ [Dica 3 — finaliza com ação prática]

Qual dessas você já usa? Conta aqui 👇

#${slugify(niche)} #aprendizado #dicas #marketing`,
    }),
    bastidores: (niche, tone) => ({
      title: 'Post de Bastidores — Humaniza a Marca',
      body: `🎬 Por trás dos panos de ${niche}…

Hoje quero mostrar como é um dia típico aqui na [empresa]:

→ [Hora] — começa com [rotina/tarefa]
→ [Hora] — foco em ${niche}
→ [Hora] — [resultado do dia]

Acha que parece fácil? Olha o que rola por trás 😅

Salva se quiser ver mais bastidores!

#bastidores #empreendedorismo #${slugify(niche)}`,
    }),
    'social proof': (niche, tone) => ({
      title: 'Post de Social Proof — Depoimento Real',
      body: `⭐ O que nossos clientes falam sobre ${niche}:

"[Depoimento real do cliente — quanto mais específico, mais poderoso]"
— [Nome, cargo/empresa]

Esse resultado veio após [X semanas/meses] usando [solução].

Quer o próximo case ser o seu? Fala no direct 👇

#${slugify(niche)} #depoimento #resultados #prova`,
    }),
  },
  reel: {
    engajamento: (niche) => ({
      title: 'Reel de Engajamento — Gancho Forte',
      body: `🎬 ROTEIRO DO REEL

GANCHO (0-3s): "Você está perdendo dinheiro com ${niche} e nem sabe."

DESENVOLVIMENTO (3-25s):
→ Problema: [descreve o problema que o público tem]
→ Agitação: [mostra a consequência de não resolver]
→ Solução: [apresenta a virada ou insight]

CTA FINAL (últimos 3s): "Salva esse reel e me manda DM com '${niche.split(' ')[0].toUpperCase()}'"

LEGENDA: Coloca pergunta de engajamento + 3 hashtags principais`,
    }),
    autoridade: (niche) => ({
      title: 'Reel de Autoridade — Desmistificando',
      body: `🎬 ROTEIRO — MITO vs VERDADE

GANCHO: "MITO: [crença popular errada sobre ${niche}]"

VIRADA: "Na verdade, depois de [X experiências], aprendi que..."

PONTOS (pode ser texto na tela):
• Mito 1 → Verdade 1
• Mito 2 → Verdade 2
• Mito 3 → Verdade 3

ENCERRAMENTO: "Salva pra não esquecer + comenta qual mito te surpreendeu mais!"

TOM: ${niche} — confiante, direto, sem enrolação`,
    }),
    educativo: (niche) => ({
      title: 'Reel Educativo — Tutorial Rápido',
      body: `🎬 ROTEIRO — PASSO A PASSO

GANCHO (0-3s): "Em 30 segundos vou te ensinar [resultado específico com ${niche}]"

PASSOS (3-25s):
PASSO 1: [ação clara e simples]
PASSO 2: [ação clara e simples]
PASSO 3: [ação clara e simples]

RESULTADO: "Só isso já vai [benefício tangível]"

CTA: "Segue pra mais dicas de ${niche} toda semana!"

TRILHA: Use música trending com ritmo médio/rápido`,
    }),
    vendas: (niche) => ({
      title: 'Reel de Vendas — Antes e Depois',
      body: `🎬 ROTEIRO — TRANSFORMAÇÃO

GANCHO: "Isso foi o resultado de 30 dias com [solução] para ${niche}"

ANTES (10s): [descreve situação inicial do cliente — dor real]

DEPOIS (10s): [resultado concreto com números se possível]

COMO: "O que mudou foi [mecanismo único da sua solução]"

CTA: "Quer o mesmo resultado? Link na bio ou manda 'QUERO' no direct"

DICA: Use texto animado na tela + voz over`,
    }),
    bastidores: (niche) => ({
      title: 'Reel de Bastidores — Day in the Life',
      body: `🎬 ROTEIRO — DIA A DIA

GANCHO: "Como é trabalhar com ${niche} na prática 👇"

CENAS (pode ser câmera rápida / cortes):
→ [Cena 1: início do dia / setup]
→ [Cena 2: trabalhando em ${niche}]
→ [Cena 3: resultado ou entrega]
→ [Cena 4: bastidor real / desafio]

LEGENDA: "Salva se quiser ver mais do dia a dia aqui!"

TOM: autêntico, real, humanizado`,
    }),
    'social proof': (niche) => ({
      title: 'Reel de Social Proof — Reação de Cliente',
      body: `🎬 ROTEIRO — REAÇÃO / DEPOIMENTO

GANCHO: "Olha a reação do [cliente] depois de [X tempo] com a gente..."

DEPOIMENTO (pode ser clip do cliente ou texto na tela):
"[Depoimento real — quanto mais emotivo e específico, melhor]"

CONTEXTO: Antes: [situação] → Depois: [resultado]

CTA: "Quer ser o próximo? Manda DM com '${niche.split(' ')[0].toUpperCase()}'"

DICA: Legendas sempre ativadas — 85% assiste sem som`,
    }),
  },
  story: {
    engajamento: (niche) => ({
      title: 'Story de Engajamento — Enquete / Quiz',
      body: `📲 SEQUÊNCIA DE STORIES (3-4 stories)

STORY 1 — Contexto:
"[Pergunta ou afirmação instigante sobre ${niche}]"
→ Use fonte grande, fundo colorido

STORY 2 — Enquete/Caixinha:
Enquete: "[Opção A] ou [Opção B]?"
OU Caixinha: "Me conta seu maior desafio com ${niche}..."

STORY 3 — CTA:
"Respondendo todas as caixinhas hoje 🔥"
"Manda no direct que te respondo pessoalmente"

STORY 4 — Engajamento ativo:
Responde stories de quem interagiu com menção`,
    }),
    autoridade: (niche) => ({
      title: 'Story de Autoridade — Dica Rápida',
      body: `📲 STORY DE DICA (2-3 stories)

STORY 1:
"⚡ Dica rápida de ${niche} que uso todo dia:"
[Fundo escuro + texto branco = alto contraste]

STORY 2:
"→ [A dica em si — específica e aplicável agora]"
"→ Por que funciona: [explicação em 1 linha]"

STORY 3 — CTA:
"Salva esses stories! Volto mais dicas essa semana"
"Alguma dúvida sobre ${niche}? Manda aqui 👆"`,
    }),
    vendas: (niche) => ({
      title: 'Story de Vendas — Oferta Relâmpago',
      body: `📲 STORY DE OFERTA (3 stories)

STORY 1 — Urgência:
"⏰ Só hoje / Só até [hora]:"
"[Oferta ou bônus especial relacionado a ${niche}]"

STORY 2 — Benefício:
"Quem fechar hoje leva:"
"✅ [Benefício 1]"
"✅ [Benefício 2]"
"✅ [Benefício 3]"

STORY 3 — CTA direto:
"Manda 'QUERO' no direct AGORA"
"Respondo todos na ordem que chegar 📩"`,
    }),
    bastidores: (niche) => ({
      title: 'Story de Bastidores — Processo Real',
      body: `📲 BASTIDORES EM STORIES (2-4 stories)

STORY 1 — Introdução:
"Mostrando como a gente [faz X com ${niche}] na prática 🎬"

STORY 2-3 — O processo:
[Foto/vídeo real da execução]
Texto overlay: "[Contexto breve do que está acontecendo]"

STORY FINAL — Resultado:
"E foi assim que [resultado concreto]"
"Tem dúvida sobre o processo? Pergunta aqui 👆"

DICA: Autenticidade > perfeição em bastidores`,
    }),
    educativo: (niche) => ({
      title: 'Story Educativo — Mini Tutorial',
      body: `📲 MINI TUTORIAL EM STORIES (4-5 stories)

STORY 1 — Promessa:
"Vou te ensinar [resultado] em 4 stories 📚"
"Salva essa sequência!"

STORIES 2-4 — Passo a passo:
Story 2: "PASSO 1: [ação simples]"
Story 3: "PASSO 2: [ação simples]"
Story 4: "PASSO 3: [ação simples + resultado]"

STORY 5 — CTA:
"Testou? Me conta o resultado! 🔥"
"Manda DM com sua dúvida sobre ${niche}"`,
    }),
    'social proof': (niche) => ({
      title: 'Story de Social Proof — Print de Resultado',
      body: `📲 STORY DE PROVA SOCIAL (2-3 stories)

STORY 1 — Contexto:
"Olha o que o [cliente/parceiro] me mandou hoje 👇"
[Tom: surpreso/orgulhoso]

STORY 2 — O print/resultado:
[Compartilha o print, resultado ou depoimento]
Texto: "[Dado concreto: X% de crescimento, R$X a mais, etc.]"

STORY 3 — CTA:
"Quer o mesmo resultado com ${niche}?"
"Manda 'EU QUERO' aqui 📩"`,
    }),
  },
  carrossel: {
    engajamento: (niche) => ({
      title: 'Carrossel de Engajamento — Lista Poderosa',
      body: `📊 CARROSSEL (6-8 slides)

SLIDE 1 — CAPA (mais importante):
Título: "[Número] [promessa forte sobre ${niche}]"
Ex: "7 erros que estão travando seu ${niche}"
Visual: Bold, contraste alto, texto grande

SLIDES 2-7 — Conteúdo:
Cada slide = 1 ponto
Estrutura: ícone + título curto + 2 linhas de explicação

SLIDE FINAL — CTA:
"Salva esse carrossel + comenta qual slide te pegou mais!"
"Manda DM se quiser aprofundar em ${niche}"

DICAS TÉCNICAS:
→ Fonte mínima 24px
→ Consistência visual em todos os slides
→ Seta ou indicação "arrasta →" no slide 1`,
    }),
    autoridade: (niche) => ({
      title: 'Carrossel de Autoridade — Guia Definitivo',
      body: `📊 CARROSSEL GUIA (7-10 slides)

SLIDE 1 — CAPA:
"O guia definitivo de [aspecto específico de ${niche}]"
Subtítulo: "Tudo que você precisa saber em [X] slides"

SLIDES 2-8 — Conteúdo por seção:
• Slide 2: O problema / contexto
• Slide 3-6: Os pilares / etapas principais
• Slide 7: Os erros mais comuns
• Slide 8: O framework completo

SLIDE FINAL:
"Agora você tem o mapa. O próximo passo é agir."
CTA: "Salva + me conta qual parte vai aplicar primeiro 👇"`,
    }),
    educativo: (niche) => ({
      title: 'Carrossel Educativo — Passo a Passo',
      body: `📊 CARROSSEL TUTORIAL (6 slides)

SLIDE 1 — CAPA:
"Como [resultado desejado] com ${niche} em [X passos]"

SLIDES 2-5 — Os passos:
Cada slide = 1 passo
Estrutura:
• Número grande (visual)
• Título do passo
• 2-3 linhas explicando
• Dica ou exemplo concreto

SLIDE 6 — RESULTADO + CTA:
"Seguindo esses passos, você vai [benefício final]"
"Dúvidas? Comenta aqui ou manda DM 📩"

IMPORTANTE: Use icons ou ilustrações para facilitar leitura`,
    }),
    vendas: (niche) => ({
      title: 'Carrossel de Vendas — Problema → Solução',
      body: `📊 CARROSSEL DE VENDAS (6 slides)

SLIDE 1 — CAPA (gancho):
"Você está cometendo esses erros com ${niche}?"

SLIDE 2 — Problema:
"A maioria enfrenta: [lista de 3 dores reais]"

SLIDE 3 — Por que acontece:
"O motivo real é [causa raiz — não o sintoma]"

SLIDE 4 — A solução:
"A virada acontece quando você [mecanismo único]"

SLIDE 5 — Prova:
"[Cliente X] foi de [antes] para [depois] em [tempo]"

SLIDE 6 — CTA:
"Quer esse resultado para ${niche}?"
"Manda 'QUERO' no direct ou clica no link da bio"`,
    }),
    bastidores: (niche) => ({
      title: 'Carrossel de Bastidores — Processo Revelado',
      body: `📊 CARROSSEL BASTIDORES (5-7 slides)

SLIDE 1 — CAPA:
"Como a gente [entrega resultado] com ${niche} — revelando o processo"

SLIDES 2-5 — O processo real:
• Etapa 1: [fase inicial — o que acontece]
• Etapa 2: [fase de execução]
• Etapa 3: [fase de refinamento]
• Etapa 4: [entrega / resultado]

SLIDE 6 — O diferencial:
"O que torna nosso processo único: [diferencial real]"

SLIDE FINAL — CTA:
"Quer entender como aplicamos isso no seu negócio?"
"Comenta 'PROCESSO' ou manda DM 📩"`,
    }),
    'social proof': (niche) => ({
      title: 'Carrossel de Social Proof — Cases de Sucesso',
      body: `📊 CARROSSEL CASES (5-6 slides)

SLIDE 1 — CAPA:
"[X] resultados reais de quem trabalha com a gente em ${niche}"

SLIDES 2-4 — Cases:
Cada slide = 1 case
Estrutura: Nome/empresa → Antes → Depois → Depoimento em aspas

SLIDE 5 — Padrão nos resultados:
"O que todos esses cases têm em comum:"
→ [insight sobre o que une os sucessos]

SLIDE FINAL — CTA:
"O próximo case pode ser o seu."
"Manda DM ou acessa o link na bio para conversar"`,
    }),
  },
};

function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '').slice(0, 20);
}

function generateIGPrompt() {
  const format = document.getElementById('igFormat').value;
  const goal   = document.getElementById('igGoal').value;
  const tone   = document.getElementById('igTone').value;
  const niche  = document.getElementById('igNiche').value.trim() || 'seu negócio';

  const templateFn = IG_TEMPLATES[format]?.[goal];
  if (!templateFn) { toast('Combinação não disponível ainda.', ''); return; }

  const { title, body } = templateFn(niche, tone);
  const id = Date.now();
  state.igPrompts.unshift({ id, title, body, format, goal, tone, niche, saved: false });
  saveToStorage('igPrompts', state.igPrompts);
  renderIGPrompts();
  toast('Prompt gerado!', 'success');
}

function renderIGPrompts() {
  const grid = document.getElementById('igPromptsGrid');
  const filter = state.activeIGFilter;
  const list = filter === 'all' ? state.igPrompts : state.igPrompts.filter(p => p.format === filter);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">📸</div>
      <p>Configure os campos acima e clique em <strong>"Gerar Prompt"</strong> para criar seu primeiro prompt de conteúdo.</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="prompt-card" data-id="${p.id}">
      <div class="prompt-card-tags">
        <span class="tag ${tagClass(p.format)}">${p.format}</span>
        <span class="tag tag-default">${p.goal}</span>
        <span class="tag tag-default">${p.tone}</span>
      </div>
      <div class="prompt-title">${p.title}</div>
      <div class="prompt-body">${p.body}</div>
      <div class="prompt-actions">
        <button class="btn-copy" data-copy="${encodeURIComponent(p.body)}">📋 Copiar</button>
        <button class="btn-save ${p.saved ? 'saved' : ''}" data-save="${p.id}">${p.saved ? '✓ Salvo' : '🔖 Salvar'}</button>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => copyText(decodeURIComponent(btn.dataset.copy), btn));
  });
  grid.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.save);
      const p = state.igPrompts.find(x => x.id === id);
      if (p) { p.saved = !p.saved; saveToStorage('igPrompts', state.igPrompts); renderIGPrompts(); }
    });
  });
}

document.getElementById('generateIG').addEventListener('click', generateIGPrompt);

// ══════════════════════════════════════════
// ── CONVERSATION PROMPTS ──────────────────
// ══════════════════════════════════════════

const CONV_TEMPLATES = {
  inicio: {
    WhatsApp: (lead, context) => ({
      title: 'Início de Conversa — WhatsApp',
      body: `Oi [Nome]! Tudo bem? 👋

Passei pelo seu perfil e vi que você trabalha com ${lead || '[área do lead]'} — ${context ? `vi que ${context} e fiquei` : 'fiquei'} com muita curiosidade.

A gente tem ajudado pessoas do seu segmento a [resultado específico] de um jeito que costuma surpreender bastante.

Posso te mostrar em 5 minutinhos como funciona? Sem compromisso nenhum 😉`,
    }),
    'Instagram DM': (lead, context) => ({
      title: 'Início de Conversa — Instagram DM',
      body: `Oi [Nome]! Vi seu perfil aqui no Instagram e ${context ? context : 'me identifiquei muito com o que você faz'} 🔥

Trabalho com ${lead || '[solução]'} e tenho ajudado profissionais do seu nicho a [resultado].

Posso te contar como em 2 minutinhos? Prometo que vai valer a pena 👇`,
    }),
    LinkedIn: (lead, context) => ({
      title: 'Início de Conversa — LinkedIn',
      body: `Olá [Nome], tudo certo?

${context ? `Vi que ${context} —` : ''} Seu perfil chamou minha atenção porque atuamos bastante com profissionais de ${lead || 'sua área'}.

Tenho ajudado [perfil similar] a resolver [problema específico] de forma bastante concreta. Seria interessante trocar uma ideia rápida?

Fico à disposição 🤝`,
    }),
    'E-mail': (lead, context) => ({
      title: 'Início de Conversa — E-mail Frio',
      body: `Assunto: [Resultado específico] para quem trabalha com ${lead || 'seu segmento'}

Olá [Nome],

${context ? `Encontrei seu contato após ${context}.` : 'Cheguei até você buscando profissionais de referência na área.'}

Direto ao ponto: tenho ajudado empresas de ${lead || 'seu segmento'} a [resultado concreto com número]. O processo é simples e os resultados costumam aparecer em [prazo].

Faria sentido uma conversa de 15 minutos para entender se faz sentido para você?

Abraços,
[Seu nome]`,
    }),
  },
  retomada: {
    WhatsApp: (lead, context) => ({
      title: 'Retomada de Conversa — WhatsApp',
      body: `Oi [Nome], sumido(a)! 😄

Tava aqui pensando em você — ${context ? context : 'a gente tinha conversado um tempo atrás sobre [assunto]'}.

Queria saber como você está e se aquele desafio que você mencionou com ${lead || '[área]'} evoluiu de alguma forma.

Qualquer coisa que puder ajudar, me chama! 🤜🤛`,
    }),
    'Instagram DM': (lead, context) => ({
      title: 'Retomada de Conversa — Instagram DM',
      body: `Oi [Nome]! Vi um post seu hoje e lembrei da nossa última conversa 👀

${context ? context : 'Como tá rolando com ' + (lead || 'seu projeto') + '?'}

Tinha ficado pensando se você conseguiu resolver aquilo que a gente tinha discutido. Se quiser continuar de onde paramos, é só falar! 💪`,
    }),
    LinkedIn: (lead, context) => ({
      title: 'Retomada de Conversa — LinkedIn',
      body: `Olá [Nome], como vai?

Repassando minhas conversas por aqui e acabei voltando à nossa troca sobre ${lead || 'seu segmento'}.

${context ? context : 'Imagino que muita coisa evoluiu desde então.'}

Tenho alguns insights novos que podem ser relevantes para você — seria interessante retomar? Fico à disposição para uma conversa rápida quando quiser 🙂`,
    }),
    'E-mail': (lead, context) => ({
      title: 'Retomada de Conversa — E-mail',
      body: `Assunto: Retomando nossa conversa sobre ${lead || 'seu projeto'}

Olá [Nome],

Tudo bem? Faz um tempo que não nos falamos e queria dar um oi.

${context ? context : 'Tínhamos conversado sobre [assunto] e imagino que muito evoluiu desde então.'}

Teria algum momento essa semana para uma conversa rápida? Tenho novidades que podem ser relevantes para o que discutimos antes.

Abraços,
[Seu nome]`,
    }),
  },
  followup: {
    WhatsApp: (lead, context) => ({
      title: 'Follow-up Pós-Reunião — WhatsApp',
      body: `Oi [Nome]! Obrigado pela conversa de hoje 🙏

Como prometido, vou te mandar um resumo rápido do que discutimos:

✅ [Ponto 1 alinhado]
✅ [Ponto 2 alinhado]
✅ [Próximo passo definido]

${context ? context : 'Qualquer dúvida que surgir, me chama aqui!'}

Fico no aguardo para avançarmos 🤝`,
    }),
    'Instagram DM': (lead, context) => ({
      title: 'Follow-up Pós-Reunião — Instagram DM',
      body: `[Nome]! Valeu demais pela nossa conversa hoje 🔥

Fiquei animado(a) com o que discutimos sobre ${lead || 'seu projeto'}.

${context ? context : 'Assim que tiver a proposta/material pronto, te mando aqui!'}

Qualquer dúvida é só chamar, ok? 💬`,
    }),
    LinkedIn: (lead, context) => ({
      title: 'Follow-up Pós-Reunião — LinkedIn',
      body: `Olá [Nome],

Muito obrigado(a) pelo nosso papo de hoje! Foi muito produtivo.

Conforme combinamos:
→ [Ação 1 — quem faz e quando]
→ [Ação 2 — quem faz e quando]
→ Próxima conversa: [data/prazo]

${context ? context : ''}

Qualquer dúvida, fico à disposição. Até breve!

[Seu nome]`,
    }),
    'E-mail': (lead, context) => ({
      title: 'Follow-up Pós-Reunião — E-mail',
      body: `Assunto: Resumo da nossa reunião + próximos passos

Olá [Nome],

Obrigado(a) pelo tempo dedicado à nossa conversa hoje.

📋 RESUMO DOS PONTOS DISCUTIDOS:
• [Ponto 1]
• [Ponto 2]
• [Ponto 3]

✅ PRÓXIMOS PASSOS:
→ [Ação] — [Responsável] até [data]
→ [Ação] — [Responsável] até [data]

${context ? context : ''}

Qualquer ajuste ou dúvida, é só responder este e-mail.

Até breve!
[Seu nome]`,
    }),
  },
};

function generateConvPrompt() {
  const type    = document.getElementById('convType').value;
  const channel = document.getElementById('convChannel').value;
  const lead    = document.getElementById('convLead').value.trim();
  const context = document.getElementById('convContext').value.trim();

  const templateFn = CONV_TEMPLATES[type]?.[channel];
  if (!templateFn) { toast('Combinação não disponível.', ''); return; }

  const { title, body } = templateFn(lead, context);
  const id = Date.now();
  state.convPrompts.unshift({ id, title, body, type, channel, lead, saved: false });
  saveToStorage('convPrompts', state.convPrompts);
  renderConvPrompts();
  toast('Prompt gerado!', 'success');
}

function renderConvPrompts() {
  const grid = document.getElementById('convPromptsGrid');
  const filter = state.activeConvType;
  const list = state.convPrompts.filter(p => p.type === filter);

  if (!list.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">💬</div>
      <p>Configure os campos acima e clique em <strong>"Gerar Prompt"</strong> para criar uma mensagem personalizada.</p>
    </div>`;
    return;
  }

  grid.innerHTML = list.map(p => `
    <div class="prompt-card" data-id="${p.id}">
      <div class="prompt-card-tags">
        <span class="tag ${tagClass(p.type)}">${p.type === 'inicio' ? 'início' : p.type === 'followup' ? 'follow-up' : p.type}</span>
        <span class="tag tag-default">${p.channel}</span>
        ${p.lead ? `<span class="tag tag-default">${p.lead.slice(0,20)}</span>` : ''}
      </div>
      <div class="prompt-title">${p.title}</div>
      <div class="prompt-body">${p.body}</div>
      <div class="prompt-actions">
        <button class="btn-copy" data-copy="${encodeURIComponent(p.body)}">📋 Copiar</button>
        <button class="btn-save ${p.saved ? 'saved' : ''}" data-save="${p.id}">${p.saved ? '✓ Salvo' : '🔖 Salvar'}</button>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => copyText(decodeURIComponent(btn.dataset.copy), btn));
  });
  grid.querySelectorAll('.btn-save').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.dataset.save);
      const p = state.convPrompts.find(x => x.id === id);
      if (p) { p.saved = !p.saved; saveToStorage('convPrompts', state.convPrompts); renderConvPrompts(); }
    });
  });
}

document.getElementById('generateConv').addEventListener('click', generateConvPrompt);

// ── Init ───────────────────────────────────
function init() {
  setDate();

  // load persisted state
  const savedPartners = loadFromStorage('partners', null);
  if (savedPartners) {
    state.partners = { socio4: 'Sócio 4', ...savedPartners };
    ['socio1','socio2','socio3','socio4'].forEach(k => {
      const btn = document.getElementById('btn-' + k);
      if (btn) btn.textContent = state.partners[k];
      document.querySelectorAll(`[data-partner="${k}"]`).forEach(e => { if (e.tagName === 'BUTTON') e.textContent = state.partners[k]; });
      document.querySelectorAll(`option[value="${k}"]`).forEach(o => o.textContent = state.partners[k]);
    });
  }

  state.checklists = loadFromStorage('checklists', { socio1:[], socio2:[], socio3:[], socio4:[] });
  state.igPrompts  = loadFromStorage('igPrompts', []);
  state.convPrompts = loadFromStorage('convPrompts', []);

  renderChecklists();
  renderIGPrompts();
  renderConvPrompts();
}

init();
