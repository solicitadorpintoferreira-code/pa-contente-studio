// ── PATRÍCIO IA v7 — SHARED ──

// ── STORAGE ──
const PA = {
  get: (k, def) => { try { const v = localStorage.getItem('pa_' + k); return v !== null ? JSON.parse(v) : def; } catch { return def; } },
  set: (k, v) => { try { localStorage.setItem('pa_' + k, JSON.stringify(v)); } catch(e) {} },
};

// ── SESSION AUTH ──
function isAuthenticated() { return sessionStorage.getItem('pa_auth') === 'true'; }
function setAuthenticated() { sessionStorage.setItem('pa_auth', 'true'); }

const QUOTES = [
  {q:'A mente que se abre a uma nova ideia jamais volta ao seu tamanho original.',a:'Albert Einstein'},
  {q:'O tempo é o recurso mais escasso; se não for gerido, nada mais pode ser gerido.',a:'Peter Drucker'},
  {q:'A qualidade nunca é um acidente; é sempre resultado de esforço inteligente.',a:'John Ruskin'},
  {q:'O maior risco é não correr nenhum risco.',a:'Mark Zuckerberg'},
  {q:'O sucesso é a soma de pequenos esforços repetidos dia após dia.',a:'Robert Collier'},
  {q:'Sê a mudança que queres ver no mundo.',a:'Mahatma Gandhi'},
  {q:'Conhece-te a ti mesmo.',a:'Sócrates'},
  {q:'A simplicidade é o último grau de sofisticação.',a:'Leonardo da Vinci'},
];

function initLock(onUnlock) {
  const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  const el = document.getElementById('lqText');
  if (el) el.innerHTML = `"${q.q}"<div class="lock-author">— ${q.a}</div>`;
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
    const inp = document.getElementById('lkInput'); if (inp) inp.value = '';
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
  const today = new Date().toISOString().split('T')[0], month = today.slice(0,7);
  const costs = PA.get('costs', { total:0, month:{}, day:{} });
  costs.day[today] = (costs.day[today]||0) + c;
  costs.month[month] = (costs.month[month]||0) + c;
  costs.total += c;
  PA.set('costs', costs);
  window._sessC = (window._sessC||0) + c;
  updateCostDisplay();
}

function updateCostDisplay() {
  const today = new Date().toISOString().split('T')[0], month = today.slice(0,7);
  const costs = PA.get('costs', { total:0, month:{}, day:{} });
  const set = (id, v) => { const el = document.getElementById(id); if(el) el.textContent = '€' + Number(v).toFixed(3); };
  set('cSess', window._sessC||0);
  set('cDay', costs.day[today]||0);
  set('cMonth', costs.month[month]||0);
  set('cTotal', costs.total||0);
}

// ── SYSTEM PROMPT ──
function getSys() {
  const a = PA.get('adn', {});
  const themes = PA.get('themes', ['Holdings','Pactos de Sócios','SPVs','Fix & Flip','Proteção de Ativos','Imobiliário']);
  return `És o assistente pessoal e estratégico de Patrício Ferreira. Responde SEMPRE em português de Portugal.

IDENTIDADE: ${a.identidade||'Solicitador e Partner na P&A Legal. Especialista em arquitetura empresarial, holdings, pactos de sócios, SPVs e proteção de ativos.'}
VISÃO: ${a.visao||'A referência em Portugal em arquitetura empresarial para empreendedores.'}
VOZ: ${a.voz||'Editorial, provocatório, calmo, autoritário. Referências: Financial Times, Monocle.'}
NUNCA: ${a.nunca||'Nunca usar bullet points, emojis, em-dashes, linguagem de coaching ou influencer.'}
PÚBLICO: ${a.publico||'Empreendedores com empresas entre 500k e 5M de faturação.'}
TEMAS: ${themes.join(', ')}`;
}

// ── UI UTILS ──
function toast(msg, type='') {
  let el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id='toast'; document.body.appendChild(el); }
  el.textContent = msg;
  el.className = 'toast on' + (type?' toast-'+type:'');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => el.classList.remove('on'), 2600);
}

function openModal(id) { document.getElementById(id)?.classList.add('on'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('on'); }
function toggleChip(el) { el.classList.toggle('on'); }
function autoH(el) { el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,140)+'px'; }
function renderMd(t) { return (t||'').replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\*(.*?)\*/g,'<em>$1</em>').replace(/\n/g,'<br>'); }
function esc(s) { return (s||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;').replace(/\n/g,' '); }

document.addEventListener('click', e => { if(e.target.classList.contains('modal-bg')) e.target.classList.remove('on'); });

// ── NAV ──
const PAGES = {
  'profissional.html': 'Profissional',
  'pessoal.html': 'Pessoal',
  'livro.html': 'O Livro',
  'despesas.html': 'Despesas',
  'adn.html': 'ADN',
};

function buildNav(current) {
  const nav = document.getElementById('mainNav'); if(!nav) return;
  nav.innerHTML = Object.entries(PAGES).map(([page,label]) =>
    `<a href="${page}" class="nav-page${page===current?' active':''}">${label}</a>`
  ).join('');
}
