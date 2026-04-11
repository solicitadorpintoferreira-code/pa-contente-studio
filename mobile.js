// ── PATRÍCIO IA — MOBILE INTERFACE ──
// Activo apenas quando window.innerWidth < 768px

(function() {
  if (window.innerWidth >= 768) return;

  const isMobile = true;
  let mCurrentTab = 'conteudo';
  let mCalDate = new Date();
  let mActivePostId = null;
  let mAIMode = 'legenda'; // 'legenda' | 'guiao'

  const STATUS_COLORS = {
    conceito: { badge: 'm-badge-gray', label: 'Conceito', dot: '#636366' },
    ideia: { badge: 'm-badge-red', label: 'Ideia', dot: '#ff3b30' },
    copy: { badge: 'm-badge-orange', label: 'Copy', dot: '#ff9500' },
    gravado: { badge: 'm-badge-blue', label: 'Gravado', dot: '#007aff' },
    editado: { badge: 'm-badge-green', label: 'Editado', dot: '#34c759' },
    publicado: { badge: 'm-badge-gold', label: 'Publicado', dot: '#b8922a' },
  };

  // ── INIT ──
  window.addEventListener('DOMContentLoaded', () => {
    // Only run on mobile
    if (window.innerWidth >= 768) return;

    injectMobileShell();
    mShowTab('conteudo');
  });

  // ── SHELL ── inject bottom nav + main container
  function injectMobileShell() {
    // Add mobile.css
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/mobile.css';
    document.head.appendChild(link);

    // Hide desktop app structure
    const appBody = document.querySelector('.app-body');
    if (appBody) appBody.style.display = 'block';

    // Create mobile container
    const container = document.createElement('div');
    container.id = 'mobileApp';
    container.style.cssText = 'background:#f2f2f7;min-height:100vh;padding-bottom:80px';
    document.getElementById('app').innerHTML = '';
    document.getElementById('app').appendChild(container);

    // Bottom nav
    const nav = document.createElement('nav');
    nav.className = 'm-bottom-nav';
    nav.id = 'mBottomNav';
    nav.innerHTML = `
      <a class="m-bn-item active" id="mbn-conteudo" href="#" onclick="mNavTo('conteudo');return false">
        <div class="m-bn-icon">📅</div><div class="m-bn-label">Conteúdo</div>
      </a>
      <a class="m-bn-item" id="mbn-negocio" href="#" onclick="mNavTo('negocio');return false">
        <div class="m-bn-icon">💼</div><div class="m-bn-label">Negócio</div>
      </a>
      <a class="m-bn-item" id="mbn-pessoal" href="#" onclick="mNavTo('pessoal');return false">
        <div class="m-bn-icon">🎯</div><div class="m-bn-label">Pessoal</div>
      </a>
      <a class="m-bn-item" id="mbn-livro" href="#" onclick="mNavTo('livro');return false">
        <div class="m-bn-icon">📖</div><div class="m-bn-label">Livro</div>
      </a>
      <a class="m-bn-item" id="mbn-ia" href="#" onclick="mNavTo('ia');return false">
        <div class="m-bn-icon">✦</div><div class="m-bn-label">IA</div>
      </a>`;
    document.body.appendChild(nav);

    // Post sheet
    const sheet = document.createElement('div');
    sheet.className = 'm-sheet-overlay';
    sheet.id = 'mPostSheet';
    sheet.innerHTML = `
      <div class="m-sheet" id="mSheetInner">
        <div class="m-sheet-handle"></div>
        <div class="m-sheet-header">
          <button class="m-sheet-cancel" onclick="mCloseSheet()">Cancelar</button>
          <span class="m-sheet-title" id="mSheetTitle">Post</span>
          <button class="m-sheet-save" onclick="mSavePost()">Guardar</button>
        </div>
        <div class="m-sheet-body" id="mSheetBody"></div>
        <div id="mSheetWarn"></div>
        <div style="padding:0 16px;margin-top:12px">
          <button class="m-btn-primary" style="background:#ff3b30;margin-top:0" onclick="mDeletePost()">Apagar post</button>
        </div>
      </div>`;
    sheet.addEventListener('click', e => { if(e.target === sheet) mCloseSheet(); });
    document.body.appendChild(sheet);
  }

  // ── NAVIGATION ──
  window.mNavTo = function(tab) {
    mCurrentTab = tab;
    document.querySelectorAll('.m-bn-item').forEach(b => b.classList.remove('active'));
    const btn = document.getElementById('mbn-' + tab);
    if (btn) btn.classList.add('active');
    mShowTab(tab);
    window.scrollTo(0, 0);
  };

  function mShowTab(tab) {
    const app = document.getElementById('mobileApp');
    if (!app) return;
    app.innerHTML = '';

    // Remove old FAB
    const oldFab = document.getElementById('mFab');
    if (oldFab) oldFab.remove();

    switch(tab) {
      case 'conteudo': renderConteudo(app); break;
      case 'negocio': renderNegocio(app); break;
      case 'pessoal': renderPessoal(app); break;
      case 'livro': renderLivro(app); break;
      case 'ia': renderIA(app); break;
    }
  }

  // ── HELPERS ──
  function el(tag, cls, html) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }
  function div(cls, html) { return el('div', cls, html); }

  function mHeader(title, sub, actionLabel, actionFn) {
    const h = div('m-header');
    const row = div('m-header-row');
    const titleEl = div('');
    titleEl.innerHTML = `<div class="m-header-title">${title}</div>${sub ? `<div class="m-header-sub">${sub}</div>` : ''}`;
    row.appendChild(titleEl);
    if (actionLabel) {
      const btn = el('button', 'm-header-action', actionLabel);
      btn.onclick = actionFn;
      row.appendChild(btn);
    }
    h.appendChild(row);
    return h;
  }

  function mSecHeader(text) { return div('m-sec-header', text); }

  function mStatGrid(stats) {
    // stats = [{label, val, sub, color}]
    const grid = div('m-stat-grid');
    stats.forEach(s => {
      const card = div('m-stat-card');
      card.innerHTML = `
        <div class="m-stat-label">${s.label}</div>
        <div class="m-stat-val" style="${s.color ? 'color:'+s.color : ''}">${s.val}</div>
        ${s.sub ? `<div class="m-stat-sub">${s.sub}</div>` : ''}
        ${s.progress !== undefined ? `<div class="m-progress"><div class="m-progress-fill" style="width:${s.progress}%;background:${s.color||'#1a2a4a'}"></div></div>` : ''}`;
      grid.appendChild(card);
    });
    return grid;
  }

  // ── CONTEÚDO ──
  function renderConteudo(app) {
    app.appendChild(mHeader('Conteúdo', null, null, null));

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    // Calendar
    renderMiniCal(scroll);

    // This week posts
    const posts = PA.get('posts', []);
    const today = new Date();
    const weekEnd = new Date(today); weekEnd.setDate(weekEnd.getDate() + 7);
    const upcoming = posts
      .filter(p => p.dataPub && new Date(p.dataPub) >= new Date(today.toISOString().split('T')[0]))
      .sort((a,b) => new Date(a.dataPub) - new Date(b.dataPub))
      .slice(0, 10);

    scroll.appendChild(mSecHeader('Próximos'));

    if (upcoming.length) {
      const group = div('m-group');
      upcoming.forEach(p => {
        const s = STATUS_COLORS[p.status] || STATUS_COLORS.ideia;
        const daysLeft = p.dataPub ? Math.ceil((new Date(p.dataPub) - new Date()) / 86400000) : null;
        const dateStr = p.dataPub ? new Date(p.dataPub).toLocaleDateString('pt-PT',{day:'numeric',month:'short'}) : '';
        const row = div('m-row');
        row.innerHTML = `
          <div class="m-row-icon" style="background:${s.dot}20">
            <div style="width:10px;height:10px;border-radius:50%;background:${s.dot}"></div>
          </div>
          <div class="m-row-body">
            <div class="m-row-title">${p.title || 'Sem título'}</div>
            <div class="m-row-sub">${p.plat || 'Instagram'} · ${daysLeft === 0 ? 'hoje' : daysLeft === 1 ? 'amanhã' : dateStr}</div>
          </div>
          <div class="m-row-right">
            <span class="m-badge ${s.badge}">${s.label}</span>
            <span class="m-chevron">›</span>
          </div>`;
        row.onclick = () => mOpenPost(p.id);
        group.appendChild(row);
      });
      scroll.appendChild(group);
    } else {
      const empty = div('m-group');
      empty.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:#aeaeb2;font-family:-apple-system,sans-serif">Sem posts agendados</div>`;
      scroll.appendChild(empty);
    }

    // FAB
    const fab = el('button', 'm-fab');
    fab.id = 'mFab';
    fab.innerHTML = `<svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`;
    fab.onclick = () => mNewPost();
    document.body.appendChild(fab);
  }

  function renderMiniCal(container) {
    const card = div('m-cal-card');
    const y = mCalDate.getFullYear(), m = mCalDate.getMonth();
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const today = new Date();

    card.innerHTML = `
      <div class="m-cal-head">
        <div class="m-cal-month">${months[m]} ${y}</div>
        <div class="m-cal-nav">
          <button onclick="mCalMove(-1)">‹</button>
          <button onclick="mCalMove(1)">›</button>
        </div>
      </div>
      <div class="m-cal-grid" id="mCalGrid">
        <div class="m-cg-h">D</div><div class="m-cg-h">S</div><div class="m-cg-h">T</div>
        <div class="m-cg-h">Q</div><div class="m-cg-h">Q</div><div class="m-cg-h">S</div><div class="m-cg-h">S</div>
      </div>`;
    container.appendChild(card);

    buildCalGrid(y, m, today);
  }

  function buildCalGrid(y, m, today) {
    const grid = document.getElementById('mCalGrid');
    if (!grid) return;
    // Remove day cells only (keep headers)
    const headers = Array.from(grid.querySelectorAll('.m-cg-h'));
    grid.innerHTML = '';
    headers.forEach(h => grid.appendChild(h));

    const first = new Date(y,m,1).getDay();
    const dim = new Date(y,m+1,0).getDate();
    const prev = new Date(y,m,0).getDate();
    const posts = PA.get('posts',[]);

    for (let i = first-1; i >= 0; i--) {
      const d = div('m-cg-d dim');
      d.innerHTML = `<div class="m-day-num">${prev-i}</div>`;
      grid.appendChild(d);
    }
    for (let day = 1; day <= dim; day++) {
      const ds = `${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = today.getFullYear()===y && today.getMonth()===m && today.getDate()===day;
      const hasPosts = posts.some(p => p.dataPub === ds);
      const d = div(`m-cg-d${isToday?' today':''}`);
      d.innerHTML = `<div class="m-day-num">${day}</div>${hasPosts?'<div class="m-cg-dot"></div>':''}`;
      d.onclick = () => mNewPost(ds);
      grid.appendChild(d);
    }
    const rem = 42 - first - dim;
    for (let i = 1; i <= rem; i++) {
      const d = div('m-cg-d dim');
      d.innerHTML = `<div class="m-day-num">${i}</div>`;
      grid.appendChild(d);
    }
  }

  window.mCalMove = function(dir) {
    mCalDate.setMonth(mCalDate.getMonth() + dir);
    const y = mCalDate.getFullYear(), m = mCalDate.getMonth();
    const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const titleEl = document.querySelector('.m-cal-month');
    if (titleEl) titleEl.textContent = `${months[m]} ${y}`;
    buildCalGrid(y, m, new Date());
  };

  // ── POST SHEET ──
  window.mNewPost = function(ds) {
    const p = { id: Date.now(), title:'', status:'ideia', tipo:'Reels', plat:'Instagram', dataPub: ds||'', prazo:'', copy:'', notas:'', created: new Date().toISOString() };
    const posts = PA.get('posts',[]); posts.unshift(p); PA.set('posts', posts);
    mOpenPost(p.id);
  };

  window.mOpenPost = function(id) {
    const p = PA.get('posts',[]).find(x=>x.id===id); if(!p) return;
    mActivePostId = id;
    document.getElementById('mSheetTitle').textContent = p.title || 'Novo post';
    document.getElementById('mSheetBody').innerHTML = `
      <div class="m-field" style="border-radius:10px 10px 0 0">
        <div class="m-field-label">Título</div>
        <input class="m-field-input" id="mft" value="${(p.title||'').replace(/"/g,'&quot;')}" placeholder="Título do post..." oninput="document.getElementById('mSheetTitle').textContent=this.value||'Novo post'">
      </div>
      <div class="m-field-grid">
        <div class="m-field">
          <div class="m-field-label">Status</div>
          <select class="m-field-select" id="mfs">
            ${['conceito','ideia','copy','gravado','editado','publicado'].map(s=>`<option value="${s}" ${p.status===s?'selected':''}>${STATUS_COLORS[s].label}</option>`).join('')}
          </select>
        </div>
        <div class="m-field">
          <div class="m-field-label">Tipo</div>
          <select class="m-field-select" id="mfti">
            ${['Reels','Estático','Autoridade','Q&A','Artigo P&A','Carrossel','Stories','LinkedIn','YouTube'].map(t=>`<option ${p.tipo===t?'selected':''}>${t}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="m-field-grid">
        <div class="m-field">
          <div class="m-field-label">Publicação</div>
          <input class="m-field-input" type="date" id="mfdp" value="${p.dataPub||''}">
        </div>
        <div class="m-field">
          <div class="m-field-label">Prazo copy</div>
          <input class="m-field-input" type="date" id="mfpz" value="${p.prazo||''}">
        </div>
      </div>
      <div class="m-field" style="border-radius:0 0 10px 10px">
        <div class="m-field-label">Copy / Guião</div>
        <textarea class="m-field-textarea" id="mfcp" placeholder="Cola o copy ou guião aqui...">${p.copy||''}</textarea>
      </div>`;

    // Warning
    const daysLeft = p.dataPub ? Math.ceil((new Date(p.dataPub)-new Date())/86400000) : null;
    const warnEl = document.getElementById('mSheetWarn');
    if (daysLeft !== null && daysLeft <= 3 && daysLeft >= 0 && !['publicado','editado','gravado'].includes(p.status)) {
      warnEl.innerHTML = `<div class="m-warn">⚠️ Publicação em ${daysLeft===0?'hoje':daysLeft+'d'} — copy ainda não está pronto</div>`;
    } else { warnEl.innerHTML = ''; }

    document.getElementById('mPostSheet').classList.add('open');
    setTimeout(() => document.getElementById('mft')?.focus(), 300);
  };

  window.mSavePost = function() {
    if (!mActivePostId) return;
    const posts = PA.get('posts',[]);
    const idx = posts.findIndex(p=>p.id===mActivePostId); if(idx<0) return;
    posts[idx].title = document.getElementById('mft')?.value || '';
    posts[idx].status = document.getElementById('mfs')?.value || 'ideia';
    posts[idx].tipo = document.getElementById('mfti')?.value || 'Reels';
    posts[idx].dataPub = document.getElementById('mfdp')?.value || '';
    posts[idx].prazo = document.getElementById('mfpz')?.value || '';
    posts[idx].copy = document.getElementById('mfcp')?.value || '';
    PA.set('posts', posts);
    mCloseSheet();
    mShowTab('conteudo');
    if (typeof toast === 'function') toast('Guardado');
  };

  window.mDeletePost = function() {
    if (!mActivePostId || !confirm('Apagar este post?')) return;
    PA.set('posts', PA.get('posts',[]).filter(p=>p.id!==mActivePostId));
    mCloseSheet();
    mShowTab('conteudo');
  };

  window.mCloseSheet = function() {
    document.getElementById('mPostSheet')?.classList.remove('open');
    mActivePostId = null;
  };

  // ── NEGÓCIO ──
  function renderNegocio(app) {
    const year = new Date().getFullYear().toString();
    const all = PA.get('faturacao', []);
    const data = all.filter(f => f.year === year).sort((a,b)=>a.month.localeCompare(b.month));
    const targets = PA.get('fat_targets', {});
    const target = targets[year] || 0;
    const total = data.reduce((s,f)=>s+(f.amount||0),0);
    const pct = target ? Math.round(total/target*100) : 0;

    app.appendChild(mHeader('Negócio', 'P&A Legal · ' + year, '+ Mês', mOpenFatSheet));

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    scroll.appendChild(mStatGrid([
      { label: 'Total ' + year, val: total.toLocaleString('pt-PT') + '€', sub: data.length + ' meses' },
      { label: 'Objetivo', val: target ? target.toLocaleString('pt-PT') + '€' : '—', color: '#b8922a', progress: Math.min(100,pct), sub: pct ? pct+'% atingido' : '' },
    ]));

    if (data.length) {
      scroll.appendChild(mSecHeader('Por mês'));
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
      const maxAmt = Math.max(...data.map(f=>f.amount||0), 1);
      const group = div('m-group');
      data.forEach(f => {
        const barPct = Math.round((f.amount||0)/maxAmt*100);
        const row = div('m-fin-row');
        row.innerHTML = `
          <div class="m-fin-body">
            <div class="m-fin-title">${months[parseInt(f.month)-1]}</div>
            ${f.note?`<div class="m-fin-meta">${f.note}</div>`:''}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:80px;height:4px;background:rgba(0,0,0,.08);border-radius:2px">
              <div style="width:${barPct}%;height:100%;background:#1a2a4a;border-radius:2px"></div>
            </div>
            <div class="m-fin-amount" style="min-width:46px;text-align:right;color:#1a2a4a">${(f.amount||0).toLocaleString('pt-PT')}€</div>
          </div>`;
        group.appendChild(row);
      });
      scroll.appendChild(group);
    }

    // Multi-year if exists
    const allYears = [...new Set(all.map(f=>f.year))].sort().reverse().slice(0,4);
    if (allYears.length > 1) {
      scroll.appendChild(mSecHeader('Histórico'));
      const group2 = div('m-group');
      allYears.forEach(y => {
        const yTotal = all.filter(f=>f.year===y).reduce((s,f)=>s+(f.amount||0),0);
        const yTarget = targets[y]||0;
        const yPct = yTarget ? Math.round(yTotal/yTarget*100) : null;
        const row = div('m-row');
        row.innerHTML = `
          <div class="m-row-body">
            <div class="m-row-title">${y}</div>
            ${yTarget?`<div class="m-row-sub">${yPct}% do objetivo</div>`:''}
          </div>
          <div class="m-row-right">
            <div style="font-size:14px;font-weight:600;color:#1a2a4a">${yTotal.toLocaleString('pt-PT')}€</div>
          </div>`;
        group2.appendChild(row);
      });
      scroll.appendChild(group2);
    }
  }

  function mOpenFatSheet() {
    // Simple prompt for now
    const month = prompt('Mês (01-12):'); if(!month) return;
    const year = prompt('Ano:', new Date().getFullYear()); if(!year) return;
    const amount = parseFloat(prompt('Faturação (€):')); if(!amount) return;
    const note = prompt('Nota (opcional):') || '';
    const f = { id: Date.now().toString(), month, year, amount, note };
    const all = PA.get('faturacao',[]); all.push(f); PA.set('faturacao', all);
    mShowTab('negocio');
    if (typeof toast === 'function') toast('Mês registado');
  }

  // ── PESSOAL ──
  function renderPessoal(app) {
    const year = new Date().getFullYear().toString();
    const objs = PA.get('objectives',[]).filter(o => (o.year||year) === year);
    const done = objs.filter(o=>o.progress>=100).length;

    app.appendChild(mHeader('Pessoal', 'Objetivos ' + year, '+ Objetivo', mNewObjective));

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    scroll.appendChild(mStatGrid([
      { label: 'Objetivos', val: objs.length, sub: done + ' concluídos' },
      { label: 'Progresso', val: objs.length ? Math.round(objs.reduce((s,o)=>s+(o.progress||0),0)/objs.length)+'%' : '—', color: '#b8922a' },
    ]));

    if (objs.length) {
      scroll.appendChild(mSecHeader('Ativos'));
      objs.sort((a,b)=>(b.progress||0)-(a.progress||0)).forEach(o => {
        const pct = o.progress || 0;
        const color = pct>=100 ? '#34c759' : pct>=50 ? '#1a2a4a' : '#b8922a';
        const card = div('m-obj-card');
        card.innerHTML = `
          <div class="m-obj-header">
            <div class="m-obj-title">${o.title}</div>
            <div class="m-obj-pct" style="color:${color}">${pct}%</div>
          </div>
          <div class="m-obj-meta">${o.type==='pessoal'?'Pessoal':'Profissional'} · ${o.year||year}</div>
          <div class="m-progress"><div class="m-progress-fill" style="width:${pct}%;background:${color}"></div></div>
          ${o.note?`<div style="font-size:12px;color:#636366;margin-top:6px;font-style:italic;font-family:-apple-system,sans-serif">${o.note}</div>`:''}`;
        card.onclick = () => mUpdateObjective(o.id);
        scroll.appendChild(card);
      });
    } else {
      const empty = div('m-group');
      empty.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:#aeaeb2;font-family:-apple-system,sans-serif">Sem objetivos para ${year}</div>`;
      scroll.appendChild(empty);
    }
  }

  function mNewObjective() {
    const title = prompt('Objetivo:'); if(!title) return;
    const type = confirm('É profissional?') ? 'profissional' : 'pessoal';
    const year = new Date().getFullYear().toString();
    const o = { id: Date.now(), title, type, year, progress: 0, date: new Date().toISOString(), subObjectives: [] };
    const objs = PA.get('objectives',[]); objs.push(o); PA.set('objectives', objs);
    mShowTab('pessoal');
    if (typeof toast === 'function') toast('Objetivo criado');
  }

  function mUpdateObjective(id) {
    const objs = PA.get('objectives',[]); const o = objs.find(x=>x.id===id); if(!o) return;
    const pct = parseInt(prompt(`Progresso de "${o.title}" (0-100):`, o.progress)); 
    if (isNaN(pct)) return;
    o.progress = Math.min(100, Math.max(0, pct));
    PA.set('objectives', objs);
    mShowTab('pessoal');
    if (typeof toast === 'function') toast('Atualizado');
  }

  // ── LIVRO ──
  function renderLivro(app) {
    const chapters = PA.get('book_chapters',[]);
    const totalWords = chapters.reduce((s,c)=>s+(c.content?c.content.split(/\s+/).filter(Boolean).length:0),0);
    const totalPages = Math.ceil(totalWords/250);

    app.appendChild(mHeader('O Livro', 'O Jogo das Empresas', '+ Capítulo', mNewChapter));

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    scroll.appendChild(mStatGrid([
      { label: 'Palavras', val: totalWords.toLocaleString('pt-PT'), sub: '~'+totalPages+' pág. A5' },
      { label: 'Capítulos', val: chapters.length, sub: chapters.filter(c=>c.status==='final').length + ' finais' },
    ]));

    const STATUS_CHAP = {
      ideia: { badge: 'm-badge-gray', label: 'Ideia' },
      rascunho: { badge: 'm-badge-orange', label: 'Rascunho' },
      revisao: { badge: 'm-badge-blue', label: 'Revisão' },
      final: { badge: 'm-badge-green', label: 'Final' },
    };

    if (chapters.length) {
      scroll.appendChild(mSecHeader('Capítulos'));
      const group = div('m-group');
      chapters.sort((a,b)=>(a.order!==undefined?a.order:a.num||99)-(b.order!==undefined?b.order:b.num||99)).forEach(c => {
        const s = STATUS_CHAP[c.status||'ideia'];
        const words = c.content ? c.content.split(/\s+/).filter(Boolean).length : 0;
        const typeLabels = {capitulo:'Cap.',seccao:'Sec.',introducao:'Intro',epilogo:'Epílogo',prefacio:'Pref.',outro:''};
        const row = div('m-row');
        row.innerHTML = `
          <div class="m-chap-num">${typeLabels[c.chapType||'capitulo']||''}${c.num?' '+c.num:''}</div>
          <div class="m-row-body">
            <div class="m-chap-title">${c.title}</div>
            <div class="m-chap-meta">${words ? words.toLocaleString('pt-PT') + ' palavras' : 'Em branco'}</div>
          </div>
          <div class="m-row-right">
            <span class="m-badge ${s.badge}">${s.label}</span>
            <span class="m-chevron">›</span>
          </div>`;
        row.onclick = () => mOpenChapter(c.id);
        group.appendChild(row);
      });
      scroll.appendChild(group);
    } else {
      const empty = div('m-group');
      empty.innerHTML = `<div style="padding:20px;text-align:center;font-size:13px;color:#aeaeb2;font-family:-apple-system,sans-serif">Sem capítulos ainda</div>`;
      scroll.appendChild(empty);
    }

    // AI card
    const aiCard = div('m-prompt-card');
    aiCard.innerHTML = `
      <div class="m-prompt-label">IA do Livro</div>
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div class="m-prompt-text">Expandir, rever ou obter conselho de escrita</div>
        <div style="font-size:16px;color:rgba(255,255,255,.4)">›</div>
      </div>`;
    aiCard.onclick = () => mLivroAI();
    scroll.appendChild(aiCard);
  }

  function mNewChapter() {
    const title = prompt('Título do capítulo:'); if(!title) return;
    const num = parseInt(prompt('Número (deixa vazio para secção):') || '0') || null;
    const c = { id: Date.now(), chapType: num ? 'capitulo' : 'seccao', num, title, status: 'ideia', content: '', date: new Date().toISOString() };
    const chapters = PA.get('book_chapters',[]); c.order = chapters.length; chapters.push(c); PA.set('book_chapters', chapters);
    mShowTab('livro');
    if (typeof toast === 'function') toast('Capítulo criado');
  }

  function mOpenChapter(id) {
    const c = PA.get('book_chapters',[]).find(x=>x.id===id); if(!c) return;
    const app = document.getElementById('mobileApp');
    app.innerHTML = '';

    // Header with back
    const header = div('m-header');
    header.innerHTML = `
      <div class="m-header-row">
        <button class="m-header-action" style="color:#1a2a4a" onclick="mNavTo('livro')">‹ Livro</button>
        <div style="display:flex;gap:10px">
          <button class="m-header-action" onclick="mChapterAI(${id})">IA</button>
          <button class="m-header-action" onclick="mSaveChapter(${id})">Guardar</button>
        </div>
      </div>
      <div style="padding:4px 0 8px">
        <div style="font-size:11px;font-weight:600;color:#b8922a;text-transform:uppercase;letter-spacing:.5px">${c.chapType==='capitulo'?'Capítulo '+(c.num||''):'Secção'}</div>
        <div style="font-size:22px;font-weight:700;color:#1c1c1e;letter-spacing:-.3px;font-family:'Cormorant Garamond',Georgia,serif">${c.title}</div>
      </div>`;
    app.appendChild(header);

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    // Status selector
    const statusRow = div('m-group');
    statusRow.style.marginBottom = '8px';
    statusRow.innerHTML = `<div class="m-fin-row" style="border-bottom:none">
      <div class="m-fin-body"><div class="m-fin-title">Estado</div></div>
      <select class="m-field-select" id="mChapStatus" style="color:#1a2a4a;font-weight:600;width:auto;background:transparent">
        ${['ideia','rascunho','revisao','final'].map(s=>`<option value="${s}" ${c.status===s?'selected':''}>${{ideia:'Ideia',rascunho:'Rascunho',revisao:'Revisão',final:'Final'}[s]}</option>`).join('')}
      </select>
    </div>`;
    scroll.appendChild(statusRow);

    // Editor
    const editor = div('m-editor');
    editor.innerHTML = `
      <textarea class="m-editor-textarea" id="mChapEditor" placeholder="Escreve aqui...">${c.content||''}</textarea>
      <div class="m-autosave" id="mChapSaveInd">Guardado</div>`;
    scroll.appendChild(editor);

    // Word count
    const wc = div('', `<div style="font-size:12px;color:#aeaeb2;text-align:right;padding:0 4px;font-family:-apple-system,sans-serif" id="mWC">${c.content?c.content.split(/\s+/).filter(Boolean).length:0} palavras</div>`);
    scroll.appendChild(wc);

    // Autosave
    let saveT;
    document.getElementById('mChapEditor').addEventListener('input', function() {
      const words = this.value.split(/\s+/).filter(Boolean).length;
      const wcEl = document.getElementById('mWC'); if(wcEl) wcEl.textContent = words + ' palavras';
      const ind = document.getElementById('mChapSaveInd'); if(ind) ind.textContent = 'A guardar...';
      clearTimeout(saveT);
      saveT = setTimeout(() => {
        const chapters = PA.get('book_chapters',[]);
        const idx = chapters.findIndex(x=>x.id===id); if(idx<0) return;
        chapters[idx].content = this.value;
        PA.set('book_chapters', chapters);
        const ind2 = document.getElementById('mChapSaveInd'); if(ind2) ind2.textContent = 'Guardado';
      }, 1000);
    });
  }

  window.mSaveChapter = function(id) {
    const chapters = PA.get('book_chapters',[]);
    const idx = chapters.findIndex(x=>x.id===id); if(idx<0) return;
    chapters[idx].content = document.getElementById('mChapEditor')?.value || '';
    chapters[idx].status = document.getElementById('mChapStatus')?.value || 'rascunho';
    PA.set('book_chapters', chapters);
    mNavTo('livro');
    if (typeof toast === 'function') toast('Capítulo guardado');
  };

  window.mChapterAI = async function(id) {
    const c = PA.get('book_chapters',[]).find(x=>x.id===id); if(!c) return;
    const ta = document.getElementById('mChapEditor'); if(!ta) return;
    const ind = document.getElementById('mChapSaveInd'); if(ind) ind.textContent = 'A expandir com IA...';
    const existing = ta.value.trim();
    const chapters = PA.get('book_chapters',[]).filter(ch=>ch.content);
    const ctx = chapters.map(ch=>`[${ch.title}]: ${ch.content.slice(0,400)}`).join('\n\n');
    const sys = getSys() + '\n\nLivro "O Jogo das Empresas".' + (ctx ? '\n\nCONTEÚDO:\n'+ctx : '');
    try {
      const data = await callAPI(sys, [{role:'user',content:`Capítulo "${c.title}": ${existing?'Expande:\n'+existing:'Escreve o início. Sinopse: '+c.synopsis} Tom editorial, sem bullets. Máx 300 palavras.`}], 600);
      const reply = getReply(data);
      ta.value = existing ? existing + '\n\n' + reply : reply;
      const words = ta.value.split(/\s+/).filter(Boolean).length;
      const wc = document.getElementById('mWC'); if(wc) wc.textContent = words + ' palavras';
      if(ind) ind.textContent = 'Expandido';
    } catch(e) { if(ind) ind.textContent = 'Erro'; }
  };

  async function mLivroAI() {
    const chapters = PA.get('book_chapters',[]).filter(c=>c.content);
    if (!chapters.length) { alert('Escreve primeiro algum conteúdo.'); return; }
    const q = prompt('O que queres perguntar sobre o livro?'); if(!q) return;
    const ctx = chapters.map(c=>`[${c.title}]: ${c.content.slice(0,400)}`).join('\n\n');
    const sys = getSys() + '\n\nLivro "O Jogo das Empresas".\n\nCONTEÚDO:\n' + ctx;
    if (typeof toast === 'function') toast('A consultar IA...');
    try {
      const data = await callAPI(sys, [{role:'user',content:q}], 600);
      alert(getReply(data));
    } catch(e) { alert('Erro. Tenta novamente.'); }
  }

  // ── IA RÁPIDA ──
  function renderIA(app) {
    app.appendChild(mHeader('IA', 'Legendas e guiões', null, null));

    const scroll = div('');
    scroll.style.cssText = 'padding:0 16px 100px';
    app.appendChild(scroll);

    // Mode selector
    const modes = div('m-ai-modes');
    modes.innerHTML = `
      <button class="m-ai-mode ${mAIMode==='legenda'?'on':'off'}" onclick="mSetAIMode('legenda')">
        <div class="m-ai-mode-ico">📸</div>
        <div class="m-ai-mode-name">Legenda</div>
        <div class="m-ai-mode-desc">para foto</div>
      </button>
      <button class="m-ai-mode ${mAIMode==='guiao'?'on':'off'}" onclick="mSetAIMode('guiao')">
        <div class="m-ai-mode-ico">🎬</div>
        <div class="m-ai-mode-name">Guião</div>
        <div class="m-ai-mode-desc">copy / vídeo</div>
      </button>`;
    scroll.appendChild(modes);

    // Prompt card
    const promptKey = mAIMode === 'legenda' ? 'prompt_legendas' : 'prompt_guiaos';
    const savedPrompt = PA.get(promptKey, '');
    const promptCard = div('m-prompt-card');
    promptCard.innerHTML = `
      <div class="m-prompt-label">Prompt master ${mAIMode==='legenda'?'— legendas':'— guiões'}</div>
      <div class="m-prompt-text" id="mPromptPreview">${savedPrompt ? savedPrompt.slice(0,80)+'...' : 'Clica para definir...'}</div>`;
    promptCard.onclick = () => mEditPrompt(promptKey);
    scroll.appendChild(promptCard);

    // Input
    const inputGroup = div('m-group');
    if (mAIMode === 'legenda') {
      inputGroup.innerHTML = `
        <div class="m-fin-row" style="flex-direction:column;align-items:flex-start;gap:6px;border-bottom:none">
          <div class="m-field-label">Descrição da foto</div>
          <textarea class="m-field-textarea" id="mAIInput" placeholder="Ex: Escritório, mesa de reunião, terno azul, ambiente profissional..."></textarea>
        </div>`;
    } else {
      inputGroup.innerHTML = `
        <div class="m-fin-row" style="border-bottom:1px solid rgba(60,60,67,.1)">
          <div class="m-fin-body"><div class="m-fin-title">Formato</div></div>
          <select class="m-field-select" id="mAIFormato" style="color:#1a2a4a;font-weight:500;width:auto">
            <option value="reel">Reel (30–60s)</option>
            <option value="reel-longo">Reel longo</option>
            <option value="carrossel">Carrossel</option>
            <option value="copy">Copy post</option>
          </select>
        </div>
        <div class="m-fin-row" style="flex-direction:column;align-items:flex-start;gap:6px;border-bottom:none">
          <div class="m-field-label">Tema</div>
          <textarea class="m-field-textarea" id="mAIInput" placeholder="Ex: Por que 90% dos pactos de sócios não funcionam..."></textarea>
        </div>`;
    }
    scroll.appendChild(inputGroup);

    // Generate button
    const btn = el('button', 'm-btn-primary', `Gerar ${mAIMode==='legenda'?'legenda':'guião'}`);
    btn.id = 'mAIBtn';
    btn.onclick = mGenerateAI;
    scroll.appendChild(btn);

    // Result area
    const resultArea = div('', '');
    resultArea.id = 'mAIResult';
    scroll.appendChild(resultArea);
  }

  window.mSetAIMode = function(mode) {
    mAIMode = mode;
    mShowTab('ia');
  };

  function mEditPrompt(key) {
    const current = PA.get(key, '');
    const newPrompt = prompt('Prompt master:', current);
    if (newPrompt === null) return;
    PA.set(key, newPrompt);
    mShowTab('ia');
  }

  window.mGenerateAI = async function() {
    const input = document.getElementById('mAIInput')?.value.trim();
    if (!input) { if(typeof toast==='function') toast('Preenche o campo'); return; }
    const btn = document.getElementById('mAIBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'A gerar...'; }
    const result = document.getElementById('mAIResult');
    if (result) result.innerHTML = `<div class="m-loading"><div class="m-spin"></div><div class="m-loading-text">A gerar com IA</div></div>`;

    const promptKey = mAIMode === 'legenda' ? 'prompt_legendas' : 'prompt_guiaos';
    const masterPrompt = PA.get(promptKey, '');
    const sys = getSys() + (masterPrompt ? '\n\nINSTRUÇÕES:\n' + masterPrompt : '');

    let prompt;
    if (mAIMode === 'legenda') {
      prompt = `Legenda Instagram para foto: "${input}"\n\nResponde APENAS com JSON:\n{"hook":"gancho (máx 15 palavras)","body":"corpo (máx 100 palavras, sem bullets, sem emojis)","full":"hook + corpo juntos"}`;
    } else {
      const formato = document.getElementById('mAIFormato')?.value || 'reel';
      const fmtLabels = {reel:'Reel 30-60s','reel-longo':'Reel 60-90s',carrossel:'Carrossel',copy:'Copy post'};
      prompt = `${fmtLabels[formato]} para @patriciop_legal. Tema: "${input}"\n\nEscreve em prosa, sem bullets, sem emojis. Tom editorial, autoritário. Máx 200 palavras.`;
    }

    try {
      const data = await callAPI(sys, [{role:'user',content:prompt}], 800);
      const raw = getReply(data);

      if (result) {
        if (mAIMode === 'legenda') {
          try {
            const d = JSON.parse(raw.replace(/```json|```/g,'').trim());
            result.innerHTML = `
              <div class="m-ai-result">
                <div class="m-ai-result-label">Legenda</div>
                <div class="m-ai-result-text">${d.hook ? `<strong>${d.hook}</strong><br><br>` : ''}${d.body||d.full||raw}</div>
                <div class="m-ai-result-actions">
                  <button class="m-ai-btn" onclick="mGenerateAI()">↺ Regenerar</button>
                  <button class="m-ai-btn primary" onclick="navigator.clipboard.writeText(${JSON.stringify((d.full||d.hook+' '+d.body||raw))}).then(()=>{if(typeof toast==='function')toast('Copiado')})">Copiar</button>
                </div>
              </div>`;
          } catch(e) {
            result.innerHTML = `<div class="m-ai-result"><div class="m-ai-result-label">Legenda</div><div class="m-ai-result-text">${raw}</div><div class="m-ai-result-actions"><button class="m-ai-btn primary" onclick="navigator.clipboard.writeText(${JSON.stringify(raw)}).then(()=>{if(typeof toast==='function')toast('Copiado')})">Copiar</button></div></div>`;
          }
        } else {
          result.innerHTML = `
            <div class="m-ai-result">
              <div class="m-ai-result-label">Guião</div>
              <div class="m-ai-result-text" style="font-style:normal">${raw.replace(/\n/g,'<br>')}</div>
              <div class="m-ai-result-actions">
                <button class="m-ai-btn" onclick="mGenerateAI()">↺ Regenerar</button>
                <button class="m-ai-btn primary" onclick="navigator.clipboard.writeText(${JSON.stringify(raw)}).then(()=>{if(typeof toast==='function')toast('Copiado')})">Copiar</button>
              </div>
            </div>`;
        }
      }
    } catch(e) {
      if(result) result.innerHTML = `<div style="padding:16px;text-align:center;font-size:13px;color:#ff3b30">Erro. Tenta novamente.</div>`;
    }

    if (btn) { btn.disabled = false; btn.textContent = `Gerar ${mAIMode==='legenda'?'legenda':'guião'}`; }
  };

})();
