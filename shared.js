// ── PATRÍCIO IA — SHARED UTILITIES ──
// Included via <script src="shared.js"> in every page

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
  {q:'A coragem não é a ausência do medo, mas a decisão de que algo é mais importante que o medo.',a:'Ambrose Redmoon'},
  {q:'O futuro pertence àqueles que acreditam na beleza dos seus sonhos.',a:'Eleanor Roosevelt'},
];

// ── STORAGE HELPERS ──
const PA = {
  get: (k, def) => { try { return JSON.parse(localStorage.getItem('pa_' + k)) ?? def; } catch { return def; } },
  set: (k, v) => localStorage.setItem('pa_' + k, JSON.stringify(v)),
};

// ── AUTH ──
function initLock(onUnlock) {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const el = document.getElementById('lqText');
  if (el) el.innerHTML = `"${q.q}"<div class="lock-author">— ${q.a}</div>`;

  window._onUnlock = onUnlock;

  const input = document.getElementById('lkInput');
  if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') doUnlock(); });
}

function doUnlock() {
  const pwd = PA.get('pwd', '1234');
  const val = document.getElementById('lkInput').value;
  if (val === pwd) {
    document.getElementById('lockScreen').style.display = 'none';
    document.getElementById('app').classList.add('on');
    if (window._onUnlock) window._onUnlock();
  } else {
    document.getElementById('lkErr').textContent = 'Password incorreta';
    document.getElementById('lkInput').value = '';
    setTimeout(() => document.getElementById('lkErr').textContent = '', 2000);
  }
}

// ── API ──
async function callAPI(system, messages, maxT = 2000, useSearch = false) {
  const res = await fetch('/.netlify/functions/claude', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
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

// ── COST TRACKING ──
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
  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = '€' + v.toFixed(3); };
  set('cSess', window._sessC || 0);
  set('cDay', costs.day[today] || 0);
  set('cMonth', costs.month[month] || 0);
  set('cTotal', costs.total || 0);
}

// ── SYSTEM PROMPT ──
function getSys() {
  const a = PA.get('adn', {});
  const themes = PA.get('themes', ['Holdings', 'Pactos de Sócios', 'SPVs', 'Fix & Flip', 'Proteção de Ativos', 'Imobiliário']);
  return `És o assistente pessoal e estratégico de Patrício Ferreira.

IDENTIDADE: ${a.identidade || 'Solicitador e Partner na P&A Legal. Especialista em arquitetura empresarial, holdings, pactos de sócios, SPVs e proteção de ativos.'}
VISÃO: ${a.visao || 'A referência em Portugal em arquitetura empresarial para empreendedores.'}
VOZ: ${a.voz || 'Editorial, provocatório, calmo, autoritário. Referências: Financial Times, Monocle.'}
NUNCA: ${a.nunca || 'Nunca usar bullet points, emojis, em-dashes, linguagem de coaching ou influencer.'}
NICHO: ${a.nicho || 'Arquitetura empresarial para empreendedores e PMEs.'}
DIFERENCIAÇÃO: ${a.diferenciacao || 'Não é apenas jurista — é arquiteto de negócios.'}
PÚBLICO: ${a.publico || 'Empreendedores com empresas entre 500k e 5M de faturação.'}
OBJETIVOS: ${a.objetivos || 'Autoridade digital. Lançar o livro O Jogo das Empresas.'}
TEMAS: ${themes.join(', ')}

PERSONALIDADE: Consultor sénior, direto, exigente, criativo. Vai ao ponto.
Responde sempre em português de Portugal.`;
}

// ── TOAST ──
function toast(msg, type = 'default') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'toast on' + (type === 'error' ? ' toast-error' : '');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

// ── UTILS ──
function toggleChip(el) { el.classList.toggle('on'); }
function esc(s) { return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, ' '); }
function openModal(id) { document.getElementById(id)?.classList.add('on'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('on'); }
function autoH(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
function fmt(n) { return (n || 0).toLocaleString('pt-PT'); }

function renderMd(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

// Close modals on overlay click
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-bg')) e.target.classList.remove('on');
});

// ── NAV ──
const PAGES = {
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
