// ── PATRÍCIO IA v6 — SHARED UTILITIES ──

const QUOTES = [
  {q:'A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.',a:'Albert Einstein'},
  {q:'Conhece-te a ti mesmo.',a:'Sócrates'},
  {q:'A simplicidade é o último grau de sofisticação.',a:'Leonardo da Vinci'},
  {q:'O tempo é o recurso mais escasso e, se não for gerido, nada mais pode ser gerido.',a:'Peter Drucker'},
  {q:'A qualidade nunca é um acidente; é sempre o resultado de esforço inteligente.',a:'John Ruskin'},
  {q:'Não basta ter boas intenções; é preciso também ter bons métodos.',a:'Aristóteles'},
  {q:'O maior risco é não correr nenhum risco.',a:'Mark Zuckerberg'},
  {q:'Não é o mais forte que sobrevive, mas aquele que melhor se adapta.',a:'Charles Darwin'},
  {q:'O sucesso é a soma de pequenos esforços repetidos dia após dia.',a:'Robert Collier'},
  {q:'Sê a mudança que queres ver no mundo.',a:'Mahatma Gandhi'},
  {q:'A coragem não é a ausência do medo, mas a decisão de que algo é mais importante.',a:'Ambrose Redmoon'},
  {q:'O futuro pertence àqueles que acreditam na beleza dos seus sonhos.',a:'Eleanor Roosevelt'},
];

// ── STORAGE ──
const PA = {
  get: (k, def) => { try { const v = localStorage.getItem('pa_' + k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem('pa_' + k, JSON.stringify(v)); } catch(e) { console.error('Storage error', e); } },
};

// ── SESSION AUTH ──
// Uses sessionStorage so auth clears when browser closes but persists between page navigations
function isAuthenticated() {
  return sessionStorage.getItem('pa_auth') === 'true';
}

function setAuthenticated() {
  sessionStorage.setItem('pa_auth', 'true');
}

function initLock(onUnlock) {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const el = document.getElementById('lqText');
  if (el) el.innerHTML = `"${q.q}"<div class="lock-author">— ${q.a}</div>`;

  // If already authenticated this session, skip lock
  if (isAuthenticated()) {
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('app').classList.add('on');
    if (onUnlock) onUnlock();
    return;
  }

  window._onUnlock = onUnlock;
  const input = document.getElementById('lkInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doUnlock(); });
}

function doUnlock() {
  const pwd = PA.get('pwd', '1234');
  const val = document.getElementById('lkInput')?.value;
  if (val === pwd) {
    setAuthenticated();
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('app').classList.add('on');
    if (window._onUnlock) window._onUnlock();
  } else {
    const err = document.getElementById('lkErr');
    if (err) { err.textContent = 'Password incorreta'; setTimeout(() => err.textContent = '', 2000); }
    const input = document.getElementById('lkInput');
    if (input) input.value = '';
  }
}

// ── API ──
async function callAPI(system, messages, maxT = 2000, useSearch = false) {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, max_tokens: maxT, useSearch })
  });
  const data = await res.json();
  if (data.usage) {
    const c = (data.usage.input_tokens * 0.000003) + (data.usage.output_tokens * 0.000015);
    trackCost(c);
  }
  if (data.content && Array.isArray(data.content)) {
    data._text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  }
  return data;
}

function getReply(data) {
  if (data._text) return data._text;
  if (data.content?.[0]?.text) return data.content[0].text;
  if (data.error) return `Erro: ${data.error.message || JSON.stringify(data.error)}`;
  return 'Sem resposta.';
}

// ── COST ──
function trackCost(c) {
  const today = new Date().toISOString().split('T')[0];
  const month = today.slice(0, 7);
  const costs = PA.get('costs', { total: 0, month: {}, day: {} });
  costs.day[today] = (costs.day[today] || 0) + c;
  costs.month[month] = (costs.month[month] || 0) + c;
  costs.total += c;
  PA.set('costs', costs);
  window._sessC = (window._sessC || 0) + c;
  updateCostDisplay();
}

function updateCostDisplay() {
  const today = new Date().toISOString().split('T')[0], month = today.slice(0, 7);
  const costs = PA.get('costs', { total: 0, month: {}, day: {} });
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = '€' + Number(v).toFixed(3); };
  set('cSess', window._sessC || 0);
  set('cDay', costs.day[today] || 0);
  set('cMonth', costs.month[month] || 0);
  set('cTotal', costs.total || 0);
}

// ── SYSTEM PROMPT ──
function getSys() {
  const a = PA.get('adn', {});
  const themes = PA.get('themes', ['Holdings', 'Pactos de Sócios', 'SPVs', 'Fix & Flip', 'Proteção de Ativos', 'Imobiliário']);
  return `És o assistente pessoal e estratégico de Patrício Ferreira. Responde SEMPRE em português de Portugal.

IDENTIDADE: ${a.identidade || 'Solicitador e Partner na P&A Legal. Especialista em arquitetura empresarial, holdings, pactos de sócios, SPVs e proteção de ativos.'}
VISÃO: ${a.visao || 'A referência em Portugal em arquitetura empresarial para empreendedores.'}
VOZ: ${a.voz || 'Editorial, provocatório, calmo, autoritário. Referências: Financial Times, Monocle.'}
NUNCA: ${a.nunca || 'Nunca usar bullet points, emojis, em-dashes, linguagem de coaching ou influencer.'}
NICHO: ${a.nicho || 'Arquitetura empresarial para empreendedores e PMEs.'}
DIFERENCIAÇÃO: ${a.diferenciacao || 'Não é apenas jurista — é arquiteto de negócios.'}
PÚBLICO: ${a.publico || 'Empreendedores com empresas entre 500k e 5M de faturação.'}
OBJETIVOS: ${a.objetivos || 'Autoridade digital. Lançar o livro O Jogo das Empresas.'}
TEMAS: ${themes.join(', ')}

PERSONALIDADE: Consultor sénior, direto, exigente, criativo. Vai ao ponto.`;
}

// ── TOAST ──
function toast(msg, type = '') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'toast on' + (type ? ' toast-' + type : '');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

// ── UTILS ──
function toggleChip(el) { el.classList.toggle('on'); }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' '); }
function openModal(id) { document.getElementById(id)?.classList.add('on'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('on'); }
function autoH(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
function renderMd(text) {
  return (text || '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
}

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-bg')) e.target.classList.remove('on');
});

// ── NAV ──
const PAGES = {
  'hoje.html': 'Hoje',
  'index.html': 'Conteúdo',
  'pessoal.html': 'Pessoal',
  'negocio.html': 'Negócio',
  'livro.html': 'O Livro',
  'adn.html': 'ADN & Definições',
};

function buildNav(current) {
  const nav = document.getElementById('mainNav');
  if (!nav) return;
  nav.innerHTML = Object.entries(PAGES).map(([page, label]) => {
    const active = page === current;
    return `<a href="${page}" class="nav-page${active ? ' active' : ''}">${label}</a>`;
  }).join('');
}

// ── GLOBAL SEARCH ──
function initGlobalSearch() {
  const btn = document.getElementById('globalSearchBtn');
  const box = document.getElementById('globalSearchBox');
  const input = document.getElementById('globalSearchInput');
  const results = document.getElementById('globalSearchResults');
  if (!btn || !box) return;

  btn.addEventListener('click', () => {
    box.classList.toggle('on');
    if (box.classList.contains('on')) input.focus();
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { results.innerHTML = ''; return; }

    const found = [];
    const archive = PA.get('archive', []);
    archive.forEach(i => {
      if ((i.preview || '').toLowerCase().includes(q) || (i.topic || '').toLowerCase().includes(q))
        found.push({ label: i.preview?.slice(0,60) || i.topic, type: 'Conteúdo', page: 'index.html', section: 'arquivo' });
    });
    const chapters = PA.get('book_chapters', []);
    chapters.forEach(c => {
      if ((c.title || '').toLowerCase().includes(q) || (c.content || '').toLowerCase().includes(q))
        found.push({ label: c.title, type: 'Capítulo', page: 'livro.html', section: 'capitulos' });
    });
    const ideas = PA.get('unified_ideas', []);
    ideas.forEach(i => {
      if ((i.text || '').toLowerCase().includes(q))
        found.push({ label: i.text.slice(0,60), type: 'Ideia', page: i.source === 'livro' ? 'livro.html' : 'index.html', section: 'ideias' });
    });
    const objs = PA.get('objectives', []);
    objs.forEach(o => {
      if ((o.title || '').toLowerCase().includes(q))
        found.push({ label: o.title, type: 'Objetivo', page: 'pessoal.html', section: 'objetivos' });
    });

    if (!found.length) { results.innerHTML = '<div style="padding:12px;color:var(--text-muted);font-size:12px">Sem resultados</div>'; return; }
    results.innerHTML = found.slice(0,8).map(r => `<a href="${r.page}" style="display:flex;align-items:center;gap:10px;padding:10px 14px;text-decoration:none;border-bottom:1px solid var(--border);transition:background 0.1s" onmouseover="this.style.background='var(--bg)'" onmouseout="this.style.background=''"><span style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:var(--gold);min-width:60px">${r.type}</span><span style="font-size:13px;color:var(--text)">${r.label}</span></a>`).join('');
  });

  document.addEventListener('keydown', e => { if (e.key === 'Escape') { box.classList.remove('on'); input.value = ''; results.innerHTML = ''; } });
}

// ── UNIFIED IDEAS ──
function saveUnifiedIdea(text, type, source) {
  const ideas = PA.get('unified_ideas', []);
  ideas.unshift({ id: Date.now(), text, type: type || 'Geral', source: source || 'geral', date: new Date().toISOString() });
  PA.set('unified_ideas', ideas);
}

// ── RSS NEWS ──
async function fetchRSS(query) {
  const topics = query || PA.get('themes', ['holdings portugal', 'arquitetura empresarial']).join(' ');
  const encoded = encodeURIComponent(topics + ' Portugal');
  const url = `https://news.google.com/rss/search?q=${encoded}&hl=pt-PT&gl=PT&ceid=PT:pt`;
  try {
    const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
    const data = await res.json();
    const parser = new DOMParser();
    const xml = parser.parseFromString(data.contents, 'text/xml');
    const items = Array.from(xml.querySelectorAll('item')).slice(0, 10);
    return items.map(item => ({
      title: item.querySelector('title')?.textContent || '',
      link: item.querySelector('link')?.textContent || '',
      date: item.querySelector('pubDate')?.textContent || '',
      source: item.querySelector('source')?.textContent || '',
    }));
  } catch(e) {
    return [];
  }
}
