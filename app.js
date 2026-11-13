/* 拼音小飞机 · app.js —— 纯前端，无需安装，数据在 data.js */
(function () {
  'use strict';
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const frag = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content; };
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* ================= 拼音工具 ================= */
  const MARKS = { a: 'āáǎà', o: 'ōóǒò', e: 'ēéěè', i: 'īíǐì', u: 'ūúǔù', 'ü': 'ǖǘǚǜ' };
  const INITIALS = INITIAL_GROUPS.flat();
  const iniOf = (k) => (INITIALS.includes(k[0]) ? k[0] : '');
  const finOf = (k) => { const f = k.slice(iniOf(k).length); return f === 'v' ? 'ü' : f; };
  const keyOf = (i, f) => i + (f === 'ü' ? 'v' : f);
  function show(k, t) {
    const i = iniOf(k); let f = finOf(k);
    if (f === 'ü' && 'jqx'.includes(i)) f = 'u';
    if (t) f = MARKS[f][t - 1];
    return i + f;
  }
  const hasTone = (k, t) => !!(SYL[k] && SYL[k][t - 1]);
  const firstTone = (k) => [1, 2, 3, 4].find((t) => hasTone(k, t));

  /* ================= 进度 ================= */
  const today = new Date().toISOString().slice(0, 10);
  const learned = new Set(WEEKS.filter((w) => w.date <= today).flatMap((w) => w.learn));
  const learnedIni = INITIALS.filter((i) => learned.has(i));
  const nextWeek = WEEKS.find((w) => w.date >= today) || WEEKS[WEEKS.length - 1];
  const fmt = (d) => { const [, m, dd] = d.split('-'); return `${+m}月${+dd}日`; };

  const RANGES = [
    { id: 'all', name: '全部学过的', inis: ['', ...learnedIni] },
    { id: 'fin', name: '单韵母 a o e i u ü', inis: [''] },
    { id: 'bpmf', name: 'b p m f d t n l', inis: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
    { id: 'gkhjqx', name: 'g k h j q x', inis: ['g', 'k', 'h', 'j', 'q', 'x'] },
  ].map((r) => ({ ...r, inis: r.inis.filter((i) => i === '' || learned.has(i)) })).filter((r) => r.inis.length);
  function pool(rangeId) {
    const r = RANGES.find((x) => x.id === rangeId) || RANGES[0], out = [];
    Object.keys(SYL).forEach((k) => {
      if (!r.inis.includes(iniOf(k))) return;
      if (iniOf(k) === '' && !learned.has(finOf(k))) return;
      [1, 2, 3, 4].forEach((t) => { if (hasTone(k, t)) out.push([k, t]); });
    });
    return out;
  }
  const rangeBar = (cur) => `<div class="ranges">${RANGES.map((r) =>
    `<button class="rg ${r.id === cur ? 'sel' : ''}" data-range="${r.id}">${r.name}</button>`).join('')}</div>`;

  const store = {
    get(k, d) { try { const v = localStorage.getItem('pyfj-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('pyfj-' + k, JSON.stringify(v)); } catch (e) { /* 忽略 */ } },
  };

  /* ================= 声音 ================= */
  const missing = new Set();
  let zh = null;
  const loadVoice = () => { const v = speechSynthesis.getVoices(); zh = v.find((x) => /zh[-_]CN/i.test(x.lang)) || v.find((x) => /^zh/i.test(x.lang)) || null; };
  if ('speechSynthesis' in window) { loadVoice(); speechSynthesis.onvoiceschanged = loadVoice; }
  function speak(text) {
    if (!('speechSynthesis' in window)) return toast('这个浏览器不能朗读，请用 Safari 或 Chrome');
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; u.rate = 0.75; if (zh) u.voice = zh;
    speechSynthesis.speak(u);
  }
  /* 先播老师录音 audio/ge1.mp3，没有就让浏览器读代表汉字 */
  const REC = new Set(window.RECORDED || []);
  function playFile(name, fallback) {
    if (!REC.has(name) || missing.has(name)) return fallback();
    const a = new Audio('audio/' + name + '.mp3');
    let done = false; const fb = () => { if (!done) { done = true; missing.add(name); fallback(); } };
    a.onerror = fb; a.play().then(() => { done = true; }).catch(fb);
  }
  const playSyl = (k, t) => playFile(k + t, () => { const c = SYL[k] && SYL[k][t - 1]; c ? speak(c) : toast('这个声调还没有录音'); });
  const playLetter = (x) => (INITIAL_SAY[x] ? playFile('letter-' + x, () => speak(INITIAL_SAY[x])) : playFile('letter-' + (x === 'ü' ? 'v' : x), () => playSyl(x === 'ü' ? 'v' : x, firstTone(x === 'ü' ? 'v' : x) || 1)));
  let actx;
  function beep(ok) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      (ok ? [660, 880] : [300, 220]).forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(); o.frequency.value = f; o.connect(g); g.connect(actx.destination);
        const t = actx.currentTime + i * 0.12; g.gain.setValueAtTime(0.15, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.start(t); o.stop(t + 0.2);
      });
    } catch (e) { /* 忽略 */ }
  }
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('on'), 1800); }
  /* 3D 卡通图：微软 Fluent Emoji（MIT 授权）。加载失败自动显示原 emoji */
  const FL = {
    '👩': 'Woman*', '🐓': 'Rooster', '🦢': 'Swan', '🍽️': 'Fork and knife with plate', '👕': 'T-shirt', '🪑': 'Chair',
    '🔢': 'Input numbers', '🐦': 'Bird', '🖐️': 'Hand with fingers splayed*', '🌫️': 'Fog', '🐟': 'Fish', '🌧️': 'Cloud with rain',
    '🌽': 'Ear of corn', '🐷': 'Pig face', '🥕': 'Carrot', '☂️': 'Umbrella', '👨': 'Man*', '🌊': 'Water wave',
    '🏛️': 'Classical building', '👃': 'Nose*', '✏️': 'Pencil', '🧵': 'Thread', '🧶': 'Yarn', '🐶': 'Dog face',
    '⛰️': 'Mountain', '😨': 'Fearful face', '👵': 'Old woman*', '💔': 'Broken heart', '⚽': 'Soccer ball', '🐎': 'Horse',
    '🦋': 'Butterfly', '🍇': 'Grapes', '🏞️': 'National park', '🥨': 'Pretzel', '🐴': 'Horse face', '🤚': 'Raised back of hand*',
    '🍄': 'Mushroom', '🖋️': 'Fountain pen', '😑': 'Expressionless face', '🧭': 'Compass', '🍯': 'Honey pot', '🍚': 'Cooked rice',
    '🐔': 'Chicken', '🪵': 'Wood', '🛋️': 'Couch and lamp', '🧧': 'Red envelope', '🪓': 'Axe', '🧱': 'Brick', '🥁': 'Drum',
    '🐘': 'Elephant', '🎶': 'Musical notes', '🌍': 'Globe showing europe-africa', '📖': 'Open book', '👦': 'Boy*', '🗼': 'Tokyo tower',
    '🏃': 'Person running*', '🖼️': 'Framed picture', '🪴': 'Potted plant', '🐰': 'Rabbit face', '🤲': 'Palms up together*',
    '🟤': 'Brown circle', '👋': 'Waving hand*', '😡': 'Pouting face', '👧': 'Girl*', '🤝': 'Handshake', '📯': 'Postal horn',
    '🌶️': 'Hot pepper', '😄': 'Grinning face with smiling eyes', '🍐': 'Pear', '🍑': 'Peach', '🧍': 'Person standing*',
    '🦒': 'Giraffe', '🫏': 'Donkey', '🧳': 'Luggage', '🟢': 'Green circle', '🦆': 'Duck', '🕊️': 'Dove', '1️⃣': 'Keycap 1',
    '📚': 'Books', '☕': 'Hot beverage', '🃏': 'Joker', '🥤': 'Cup with straw', '🐸': 'Frog', '🤧': 'Sneezing face', '🏫': 'School',
    '😢': 'Crying face', '🥒': 'Cucumber', '👖': 'Jeans', '😆': 'Grinning squinting face', '🪷': 'Lotus', '🦊': 'Fox',
    '🐯': 'Tiger face', '🍊': 'Tangerine', '🙋': 'Person raising hand*', '7️⃣': 'Keycap 7', '🚲': 'Bicycle', '🛏️': 'Bed',
    '🧼': 'Soap', '🎈': 'Balloon', '🍉': 'Watermelon', '🤫': 'Shushing face', '🐹': 'Hamster', '🧑‍🏫': 'Teacher*',
    '🎮': 'Video game', '🐝': 'Honeybee', '🍝': 'Spaghetti', '🧣': 'Scarf', '📝': 'Memo', '🤸': 'Person cartwheeling*', '💪': 'Flexed biceps*', '🏡': 'House with garden', '🏁': 'Chequered flag', '⭐': 'Star',
  };
  const FLBASE = 'https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/';
  function flUrl(e) {
    let n = FL[e]; if (!n) return null;
    const skin = n.endsWith('*'); n = n.replace('*', '');
    const f = n.toLowerCase().replace(/ /g, '_');
    return skin ? `${FLBASE}${encodeURIComponent(n)}/Default/3D/${f}_3d_default.png` : `${FLBASE}${encodeURIComponent(n)}/3D/${f}_3d.png`;
  }
  window.yyFallback = (img) => { const s = document.createElement('span'); s.textContent = img.dataset.e; img.replaceWith(s); };
  const fl = (e) => { const u = flUrl(e); return u ? `<img src="${u}" alt="" data-e="${e}" loading="lazy" onerror="yyFallback(this)">` : e; };
  const pic = (p) => (p && p.startsWith('img/') ? `<img src="${p}" alt="">` : fl(p || ''));
  const plane = '<svg viewBox="0 0 240 160"><use href="#yy"/></svg>';
  const ic = (n) => `<i class="ti ti-${n}"></i>`;

  /* 字母卡片：老师自制拼音卡片（img/letters/*.jpg） */
  function letterCard(x) {
    const sh = $('#sheet'), f = x === 'ü' ? 'v' : x;
    sh.innerHTML = `<div class="sheet-card letter"><button class="x" aria-label="关闭">${ic('x')}</button>
      <img src="img/letters/${f}.jpg" alt="${x}" onerror="this.outerHTML='<div class=lbig>${x}</div>'">
      ${LETTER[x] ? `<div class="mn">${LETTER[x][1]}</div>` : ''}
      <button class="go" data-say>${ic('volume')}读一读 · Lyt</button></div>`;
    sh.classList.add('on');
    sh.onclick = (e) => {
      const b = e.target.closest('button');
      if (e.target === sh || (b && b.classList.contains('x'))) return sh.classList.remove('on');
      if (b && b.hasAttribute('data-say')) playLetter(x);
    };
    playLetter(x);
  }

  /* ================= 音节卡片（弹出） ================= */
  function sylCard(k) {
    const i = iniOf(k), f = finOf(k);
    const tones = [1, 2, 3, 4].map((t) => {
      const ch = SYL[k] && SYL[k][t - 1], ex = EX[k + t];
      if (!ch) return `<div class="tc dim t${t}"><div class="tc-h py">${show(k, t)}</div><div class="tc-b"><span class="none">—</span></div></div>`;
      return `<button class="tc t${t}" data-t="${t}"><div class="tc-h py">${show(k, t)}</div>
        <div class="tc-b">${ex ? `<div class="pic">${pic(ex[1])}</div>` : `<div class="pic big-ch">${ch}</div>`}
        ${ex ? `<div class="word">${REC.has('w-' + k + t) ? `<span class="wplay" data-w="${k + t}">${ic('volume')}${esc(ex[0])}</span>` : esc(ex[0])}</div>${ex[2] ? `<div class="en">${esc(ex[2])}</div>` : ''}<div class="char">${ch}</div>` : ''}</div></button>`;
    }).join('');
    const split = i ? `<div class="split py"><button data-l="${i}">${i}</button><span>+</span><button data-l="${f}">${f}</button><span>→</span><b>${show(k)}</b></div>`
      : `<div class="split py"><b>${show(k)}</b></div>`;
    const note = f === 'ü' && 'jqx'.includes(i) ? `<p class="note">${ic('eye')} 小 ü 见了 j q x，去掉两点还读 ü</p>`
      : f === 'ü' && 'nl'.includes(i) ? `<p class="note">${ic('diamond')} 小 ü 见了 n l，两点不能丢</p>` : '';
    const sh = $('#sheet');
    sh.innerHTML = `<div class="sheet-card"><button class="x" aria-label="关闭">${ic('x')}</button>${split}${note}<div class="tcs">${tones}</div>
      <p class="hint">点一张卡片听读音 · Tryk og lyt</p></div>`;
    sh.classList.add('on');
    sh.onclick = (e) => {
      const b = e.target.closest('button');
      if (e.target === sh || (b && b.classList.contains('x'))) return sh.classList.remove('on');
      const w = e.target.closest('[data-w]');
      if (w) { playFile('w-' + w.dataset.w, () => {}); return; }
      if (b && b.dataset.t) { playSyl(k, +b.dataset.t); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
      if (b && b.dataset.l) playLetter(b.dataset.l);
    };
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('#sheet').classList.remove('on'); });

  /* ================= 页面 ================= */
  const V = {};

  /* ---------- 首页 ---------- */
  V.home = () => {
    const last = [...WEEKS].reverse().find((w) => w.date <= today && w.learn.length);
    const grp = [['单韵母', FINALS], ['b p m f', INITIAL_GROUPS[0]], ['d t n l', INITIAL_GROUPS[1]], ['g k h', INITIAL_GROUPS[2]], ['j q x', INITIAL_GROUPS[3]]];
    let st = '';
    grp.forEach(([name, ls]) => {
      const got = ls.filter((x) => learned.has(x)); if (!got.length) return;
      const isNew = last && got.some((x) => last.learn.includes(x));
      st += `<div class="grp ${isNew ? 'newg' : ''}"><div class="gl">${name}${isNew ? ' · 最新' : ''}</div><div class="ls">${got.map((x) => `<button class="st" data-l="${x}">${x}</button>`).join('')}</div></div>`;
    });
    st += '<div class="grp nx"><div class="gl">下一站</div><div class="ls"><span class="st" style="display:flex;align-items:center;justify-content:center">?</span></div></div>';
    const [, m, d] = nextWeek.date.split('-');
    return `
    <section class="hero"><div>
      <div class="eyebrow">${SITE.className} · PINYIN FOR KIDS · DANMARK</div>
      <h1>YY <span>Chinese</span></h1>
      <p>和小Y一起，飞过每一个拼音站。<br>课堂上投影，回家也能练。</p>
      <div class="cta"><a class="go" href="#tools">${ic('presentation')}开始上课</a><a class="go ghost" href="#parents">${ic('home-heart')}家长专区</a></div></div>
      <div class="stage">
        <svg class="cl" style="left:8%;top:9%;width:26%;opacity:.9" viewBox="0 0 200 80"><use href="#cloud"/></svg>
        <svg class="cl" style="right:6%;top:15%;width:18%;opacity:.7" viewBox="0 0 200 80"><use href="#cloud"/></svg>
        <svg class="cl" style="left:-4%;top:58%;width:22%;opacity:.6" viewBox="0 0 200 80"><use href="#cloud"/></svg>
        <svg class="path" viewBox="0 0 400 350" preserveAspectRatio="none"><path d="M-10 230 C60 190 80 150 120 135" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="2 10" stroke-linecap="round"/></svg>
        <svg class="yy" viewBox="0 0 240 160" role="img" aria-label="小Y"><use href="#yy"/></svg>
        <a class="nextc" href="#parents"><div class="d">下一次课 · Næste time <b>${+m}.${+d}</b></div><h3>${nextWeek.title}</h3></a>
      </div></section>
    <div class="sec"><h2>今天想做什么？</h2><small>Hvad skal vi lave i dag?</small></div>
    <section class="zones">
      <a class="zone z1" href="#tools"><div class="art">${fl('🧑‍🏫')}</div><div class="who">老师 · LÆRER</div><h3>课堂</h3><p>投影用的大字闪卡、分组和计时工具。</p>
        <ul><li>${ic('cards')}闪卡</li><li>${ic('users-group')}随机分组 · 小组积分</li><li>${ic('chart-donut-3')}拼音转盘 · 倒计时</li></ul><span class="more">进入课堂 ${ic('arrow-right')}</span></a>
      <a class="zone z2" href="#games"><div class="art">${fl('🎮')}</div><div class="who">小朋友 · BØRN</div><h3>游戏</h3><p>听一听、拼一拼，在游戏里练拼读。</p>
        <ul><li>${ic('target-arrow')}拼音打地鼠</li><li>${ic('puzzle')}碰一碰</li><li>${ic('ear')}听音找飞机</li></ul><span class="more">去玩游戏 ${ic('arrow-right')}</span></a>
      <a class="zone z3" href="#parents"><div class="art">${fl('🏡')}</div><div class="who">家长 · FORÆLDRE</div><h3>家长</h3><p>每周学了什么、在家怎么陪练、作业下载。</p>
        <ul><li>${ic('calendar-week')}每周课程</li><li>${ic('folder')}资源库</li><li>${ic('table')}拼音表</li></ul><span class="more">查看本周 ${ic('arrow-right')}</span></a>
    </section>
    <div class="sec"><h2>已经飞过的拼音站</h2><small>点字母看卡片 · Tryk på et bogstav</small></div>
    <section class="card"><div class="stations">${st}</div></section>`;
  };
  V.home.mount = (r) => r.addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b) letterCard(b.dataset.l); });

  /* ---------- 拼音表 ---------- */
  const CHART_TABS = [
    ['all', '全部学过的', INITIALS], ['bpmf', 'b p m f d t n l', ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l']],
    ['gkhjqx', 'g k h j q x', ['g', 'k', 'h', 'j', 'q', 'x']],
  ];
  V.chart = (sub) => {
    const tab = CHART_TABS.find((t) => t[0] === sub) || CHART_TABS[0];
    const head = '<div class="ch corner"></div>' + FINALS.map((f) =>
      `<button class="ch fh py ${learned.has(f) ? '' : 'locked'}" data-k="${f === 'ü' ? 'v' : f}">${f}</button>`).join('');
    let rows = '';
    INITIAL_GROUPS.forEach((grp, gi) => grp.forEach((i) => {
      if (!learned.has(i) || !tab[2].includes(i)) return;
      rows += `<button class="ch ih g${gi} py" data-l="${i}">${i}<i>${ic('photo')}</i></button>`;
      FINALS.forEach((f) => {
        const k = keyOf(i, f);
        if (SYL[k]) rows += `<button class="ch ok g${gi}l" data-k="${k}"><span class="py">${show(k)}</span>${f === 'ü' && 'jqx'.includes(i) ? '<em>ü 去两点</em>' : ''}</button>`;
        else if (EXTRA_VALID.includes(k)) rows += `<div class="ch ok g${gi}l soft"><span class="py">${k}</span><em>轻声</em></div>`;
        else rows += `<div class="ch no">${ic('x')}<em>不碰</em></div>`;
      });
    }));
    const pdfs = { gkhjqx: 'res/1107/pinyin-chart-gkhjqx.pdf', bpmf: 'res/1114/pinyin-chart-bpmfdtnl.pdf' };
    const pdf = pdfs[tab[0]] ? `<a class="pdf" href="${pdfs[tab[0]]}" target="_blank">${ic('printer')}打印版 PDF</a>` : '';
    return `<section class="card"><div class="head-row"><h2>拼音表</h2>${pdf}</div>
      <div class="ranges">${CHART_TABS.map((t) => `<a class="rg ${t === tab ? 'sel' : ''}" href="#chart/${t[0]}">${t[1]}</a>`).join('')}</div>
      <p class="muted">点音节：四个声调的例词和图片 · 点声母：看拼音卡片</p>
      <div class="chart">${head}${rows}</div>
      <div class="rules"><div>${ic('users')} <b>g k h</b> 只和 <span class="py">a e u</span> 碰，不和 <span class="py">i ü</span> 碰</div>
        <div>${ic('eye')} <b>j q x</b> 只和 <span class="py">i ü</span> 碰，ü 去掉两点还读 ü</div>
        <div>${ic('diamond')} <b>n l</b> 和 ü 碰，两点不能丢：<span class="py">nǚ lǜ</span></div>
        <div>${ic('ban')} <b>f</b> 不和 <span class="py">i</span> 碰；<b>b p m f d t</b> 不和 <span class="py">ü</span> 碰</div></div></section>`;
  };
  V.chart.mount = (r) => r.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.l) letterCard(b.dataset.l); else if (b.dataset.k) sylCard(b.dataset.k);
  });

  /* ---------- 课堂工具 ---------- */
  const TOOL_TABS = [['flash', ic('cards') + '闪卡'], ['group', ic('users-group') + '随机分组'], ['score', ic('star') + '小组积分'], ['wheel', ic('chart-donut-3') + '拼音转盘'], ['timer', ic('clock') + '倒计时']];
  const tabs = (base, list, cur) => `<div class="subnav">${list.map(([id, n]) => `<a href="#${base}/${id}" class="${id === cur ? 'on' : ''}">${n}</a>`).join('')}
    <button class="fs" data-fs>${ic('maximize')}全屏</button></div>`;
  const fsBind = (r) => r.addEventListener('click', (e) => {
    if (!e.target.closest('[data-fs]')) return;
    if (document.fullscreenElement) document.exitFullscreen(); else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  });
  const TEAMS = [['红队', 'var(--terra)'], ['黄队', 'var(--mustard-d)'], ['蓝队', 'var(--blue-d)'], ['绿队', 'var(--sage-d)']];

  const TOOLS = {};
  TOOLS.flash = {
    html: () => `${rangeBar(store.get('flashR', 'all'))}
      <div class="seg" id="mode"><button data-m="syl" class="sel">音节</button><button data-m="ini">声母</button><button data-m="fin">韵母</button></div>
      <div class="flash py" id="flash"><svg viewBox="0 0 240 160" style="width:min(40vw,20rem)"><use href="#yy"/></svg></div><div class="flash-sub" id="fsub">按 空格 换下一张 · 按 回车 朗读</div>
      <div class="cm-btns"><button class="go" id="nx">下一张 ${ic('arrow-right')}</button><button class="go ghost" id="say">${ic('volume')}读一读</button><button class="go ghost" id="ex">${ic('photo')}看例词</button></div>`,
    mount(r) {
      let mode = 'syl', cur = null, range = store.get('flashR', 'all'), p = pool(range);
      const next = () => {
        const f = $('#flash'), s = $('#fsub');
        if (mode === 'ini') { const x = pick(learnedIni); cur = ['l', x]; f.textContent = x; s.textContent = LETTER[x] ? LETTER[x][1] : ''; }
        else if (mode === 'fin') { const x = pick(FINALS.filter((y) => learned.has(y))); cur = ['l', x]; f.textContent = x; s.textContent = ''; }
        else { const [k, t] = pick(p); cur = ['s', k, t]; f.textContent = show(k, t); s.textContent = ''; }
        f.classList.remove('pop'); void f.offsetWidth; f.classList.add('pop');
      };
      const say = () => cur && (cur[0] === 'l' ? playLetter(cur[1]) : playSyl(cur[1], cur[2]));
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = b.dataset.range; store.set('flashR', range); p = pool(range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); next(); }
        if (b.dataset.m) { mode = b.dataset.m; $$('#mode button', r).forEach((x) => x.classList.toggle('sel', x === b)); next(); }
        if (b.id === 'nx') next(); if (b.id === 'say') say();
        if (b.id === 'ex') { if (cur && cur[0] === 's') sylCard(cur[1]); else toast('切换到“音节”再看例词'); }
      });
      keys(r, (e) => { if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); next(); } if (e.key === 'Enter') say(); });
    },
  };

  /* 分组规则（写在名字后面，用空格隔开）：男 / 女；"蓝队"等 = 固定在这个队；"分开" = 带这个标记的人各自在不同的队 */
  const parsePerson = (line) => {
    const p = { name: [], g: '', pin: '', sep: false };
    line.split(/\s+/).forEach((t) => {
      if (/^(男|boy|m|dreng)$/i.test(t)) p.g = '男';
      else if (/^(女|girl|f|pige)$/i.test(t)) p.g = '女';
      else if (t === '分开') p.sep = true;
      else if (TEAMS.some((x) => x[0] === t)) p.pin = t;
      else p.name.push(t);
    });
    p.name = p.name.join(' ');
    return p;
  };
  const makeGroups = (people, n) => {
    const g = Array.from({ length: n }, () => []), cap = Math.ceil(people.length / n);
    const notes = [];
    const cnt = (m, gd) => m.filter((x) => x.g === gd).length;
    const place = (p, i) => g[i].push(p);
    // 1. 固定队伍
    people.filter((p) => p.pin).forEach((p) => {
      let i = TEAMS.slice(0, n).findIndex((t) => t[0] === p.pin);
      if (i < 0) { i = Math.min(n - 1, 1); notes.push(`现在只有 ${n} 组，没有${p.pin}，${p.name} 放在${TEAMS[i][0]}`); }
      place(p, i);
    });
    // 2. 必须分开的人：各自去不同的队
    const sep = shuffle(people.filter((p) => p.sep && !p.pin));
    if (sep.length > n) notes.push(`标了“分开”的有 ${sep.length} 人，但只有 ${n} 组，有人只能同组`);
    let order = shuffle([...Array(n).keys()]);
    sep.forEach((p, k) => {
      if (k % n === 0 && k) order = shuffle([...Array(n).keys()]);
      const taken = new Set(people.filter((q) => q.sep).map((q) => g.findIndex((m) => m.includes(q))).filter((i) => i >= 0));
      const free = order.filter((i) => !taken.has(i) && g[i].length < cap);
      place(p, (free.length ? free : order.filter((i) => g[i].length < cap))[0] ?? order[0]);
    });
    // 3. 其他人：男生、女生分别轮流放进同性别最少、人数最少的队
    const rest = people.filter((p) => !p.pin && !p.sep);
    ['男', '女', ''].forEach((gd) => shuffle(rest.filter((p) => p.g === gd)).forEach((p) => {
      const open = [...Array(n).keys()].filter((i) => g[i].length < cap);
      const pool = open.length ? open : [...Array(n).keys()];
      const best = shuffle(pool).sort((x, y) => (cnt(g[x], gd) - cnt(g[y], gd)) || (g[x].length - g[y].length))[0];
      place(p, best);
    }));
    return { g, notes };
  };

  TOOLS.group = {
    html: () => `<div class="grp-in"><label>名字（每行一个，只保存在这台电脑上，不会上传）<textarea id="names" rows="8" placeholder="不写名字也可以：用下面的人数，按号码分组\n可以在名字后面加规则，例如：\nEthel 女 蓝队\nWilliam 男 分开\nAnna 女"></textarea></label>
      <p class="muted" style="margin:.3rem 0 .6rem">规则写在名字后面：<b>男 / 女</b>（每队男女尽量一样多）· <b>蓝队</b>（固定在蓝队，红队/黄队/绿队同理）· <b>分开</b>（标了“分开”的人各在不同的队）</p>
      <div class="row">人数 <input id="cnt" type="number" min="2" max="40" value="12"> 分成
      <button class="go ghost gn" data-n="2">2 组</button><button class="go ghost gn sel" data-n="3">3 组</button><button class="go ghost gn" data-n="4">4 组</button>
      <button class="go" id="mix">${ic('arrows-shuffle')}随机分组</button></div></div><div class="groups" id="groups"></div><p class="muted" id="gnote"></p>`,
    mount(r) {
      let n = 3; $('#names').value = store.get('names', '');
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.n) { n = +b.dataset.n; $$('.gn', r).forEach((x) => x.classList.toggle('sel', x === b)); }
        if (b.id === 'mix') {
          const raw = $('#names').value; store.set('names', raw);
          let people = raw.split('\n').map((s) => s.trim()).filter(Boolean).map(parsePerson).filter((p) => p.name);
          if (!people.length) people = Array.from({ length: Math.max(2, +$('#cnt').value || 12) }, (_, i) => ({ name: `${i + 1} 号`, g: '', pin: '', sep: false }));
          const { g, notes } = makeGroups(people, n);
          $('#groups').innerHTML = g.map((m, i) => `<div class="gcard pop" style="--c:${TEAMS[i][1]}"><h3>${TEAMS[i][0]}</h3>${shuffle(m).map((x) => `<div>${esc(x.name)}</div>`).join('')}</div>`).join('');
          $('#gnote').textContent = notes.join('；');
          beep(true);
        }
      });
    },
  };

  TOOLS.score = {
    html: () => `<div class="row center">队伍数 <button class="go ghost tn" data-n="2">2</button><button class="go ghost tn" data-n="3">3</button><button class="go ghost tn" data-n="4">4</button>
      <button class="go ghost" id="reset">${ic('refresh')}清零</button></div><div class="scores" id="scores"></div>`,
    mount(r) {
      let s = store.get('score', { n: 3, v: [0, 0, 0, 0] });
      const draw = () => {
        store.set('score', s);
        $$('.tn', r).forEach((x) => x.classList.toggle('sel', +x.dataset.n === s.n));
        $('#scores').innerHTML = TEAMS.slice(0, s.n).map(([name, c], i) => `<div class="sc" style="--c:${c}"><h3>${name}</h3>
          <div class="sv">${s.v[i]}</div><div class="stars">${'⭐'.repeat(Math.min(s.v[i], 20))}</div>
          <div class="row center"><button class="pm" data-i="${i}" data-d="-1">−</button><button class="pm plus" data-i="${i}" data-d="1">＋</button></div></div>`).join('');
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.n) s.n = +b.dataset.n;
        if (b.id === 'reset') s.v = [0, 0, 0, 0];
        if (b.dataset.d) { s.v[+b.dataset.i] = Math.max(0, s.v[+b.dataset.i] + +b.dataset.d); if (+b.dataset.d > 0) beep(true); }
        draw();
      });
      draw();
    },
  };

  TOOLS.wheel = {
    html: () => `<div class="seg" id="wm"><button data-w="ini" class="sel">声母</button><button data-w="fin">韵母</button><button data-w="syl">音节</button><button data-w="num">号码</button></div>
      <div class="wheel-wrap"><div class="pointer">▼</div><canvas id="wheel" width="560" height="560"></canvas></div>
      <div class="row center"><button class="go" id="spin">${ic('rotate-clockwise')}转一转</button><span class="wres py" id="wres"></span><button class="go ghost" id="wsay" aria-label="读">${ic('volume')}</button></div>`,
    mount(r) {
      let mode = 'ini', items = [], angle = 0, spinning = false, result = null;
      const cv = $('#wheel'), ctx = cv.getContext('2d');
      const COLORS = ['#D9734E', '#E3B23C', '#7FA3C7', '#9DB5A0', '#1F2A44', '#C99A7A'];
      const build = () => {
        if (mode === 'ini') items = learnedIni.map((x) => ['l', x, x]);
        else if (mode === 'fin') items = FINALS.filter((x) => learned.has(x)).map((x) => ['l', x, x]);
        else if (mode === 'num') items = Array.from({ length: 12 }, (_, i) => ['n', i + 1, String(i + 1)]);
        else items = shuffle(pool('all')).slice(0, 10).map(([k, t]) => ['s', [k, t], show(k, t)]);
        draw();
      };
      function draw() {
        const n = items.length, R = 270, c = 280; ctx.clearRect(0, 0, 560, 560);
        items.forEach((it, i) => {
          const a0 = angle + (i / n) * 2 * Math.PI, a1 = angle + ((i + 1) / n) * 2 * Math.PI;
          ctx.beginPath(); ctx.moveTo(c, c); ctx.arc(c, c, R, a0, a1); ctx.closePath();
          ctx.fillStyle = COLORS[i % COLORS.length]; ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
          ctx.save(); ctx.translate(c, c); ctx.rotate((a0 + a1) / 2); ctx.fillStyle = '#fff';
          ctx.font = `bold ${n > 12 ? 30 : 42}px Andika, sans-serif`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
          ctx.fillText(it[2], R - 22, 0); ctx.restore();
        });
        ctx.beginPath(); ctx.arc(c, c, 34, 0, 2 * Math.PI); ctx.fillStyle = '#fff'; ctx.fill(); ctx.fillStyle = '#D9734E'; ctx.beginPath(); ctx.arc(c, c, 12, 0, 2 * Math.PI); ctx.fill();
      }
      const say = () => { if (!result) return; if (result[0] === 'l') playLetter(result[1]); else if (result[0] === 's') playSyl(...result[1]); else speak(String(result[1])); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.w) { mode = b.dataset.w; $$('#wm button', r).forEach((x) => x.classList.toggle('sel', x === b)); $('#wres').textContent = ''; build(); }
        if (b.id === 'wsay') say();
        if (b.id === 'spin' && !spinning) {
          if (mode === 'syl') build();
          spinning = true; const start = angle, total = 6 * Math.PI + Math.random() * 2 * Math.PI, t0 = performance.now(), dur = 3200;
          const step = (now) => {
            const p = Math.min(1, (now - t0) / dur); angle = start + total * (1 - Math.pow(1 - p, 3)); draw();
            if (p < 1) return requestAnimationFrame(step);
            spinning = false; const n = items.length;
            const at = ((-Math.PI / 2 - angle) % (2 * Math.PI) + 4 * Math.PI) % (2 * Math.PI);
            result = items[Math.floor(at / (2 * Math.PI / n)) % n];
            const w = $('#wres'); w.textContent = result[2]; w.classList.remove('pop'); void w.offsetWidth; w.classList.add('pop'); beep(true); say();
          };
          requestAnimationFrame(step);
        }
      });
      build();
    },
  };

  TOOLS.timer = {
    html: () => `<div class="row center">${[1, 2, 3, 5, 10, 15].map((m) => `<button class="go ghost tm" data-m="${m}">${m} 分钟</button>`).join('')}</div>
      <div class="clock" id="clock">00:00</div><div class="bar"><div id="barf"></div></div>
      <div class="row center"><button class="go" id="pp">${ic('player-play')}开始</button><button class="go ghost" id="rs">${ic('refresh')}重来</button></div>`,
    mount(r) {
      let total = 300, left = 300, iv = null;
      const draw = () => { $('#clock').textContent = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;
        $('#barf').style.width = (100 * left / total) + '%'; $('#clock').classList.toggle('end', left === 0); $('#clock').classList.toggle('warn', left > 0 && left <= 10); };
      const stop = () => { clearInterval(iv); iv = null; $('#pp').innerHTML = ic('player-play') + '开始'; };
      const go = () => { if (iv || left === 0) return; $('#pp').innerHTML = ic('player-pause') + '暂停';
        iv = setInterval(() => { left--; draw(); if (left <= 0) { stop(); beep(true); setTimeout(() => beep(true), 300); setTimeout(() => beep(true), 600); } }, 1000); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.m) { stop(); total = left = +b.dataset.m * 60; draw(); go(); }
        if (b.id === 'pp') iv ? stop() : go();
        if (b.id === 'rs') { stop(); left = total; draw(); }
      });
      draw();
      return () => clearInterval(iv);
    },
  };

  V.tools = (sub) => { const id = TOOLS[sub] ? sub : 'flash'; return `<section class="card tool-page">${tabs('tools', TOOL_TABS, id)}<div class="tool-body">${TOOLS[id].html()}</div></section>`; };
  V.tools.mount = (r, sub) => { fsBind(r); return TOOLS[TOOLS[sub] ? sub : 'flash'].mount(r); };

  /* 键盘快捷键：页面切换时自动解绑 */
  function keys(r, fn) {
    const h = (e) => { if (!document.body.contains(r)) return document.removeEventListener('keydown', h); if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return; fn(e); };
    document.addEventListener('keydown', h);
  }

  /* ---------- 拼音游戏 ---------- */
  const GAME_TABS = [['mole', ic('target-arrow') + '打地鼠'], ['peng', ic('puzzle') + '碰一碰'], ['listen', ic('ear') + '听音找飞机']];
  const GAMES = {};

  GAMES.mole = {
    html: () => `${rangeBar(store.get('moleR', 'all'))}
      <div class="mole-top"><div class="team-score" id="ts"></div><button class="ear" id="ear">${ic('volume')}再听一次</button><div class="round" id="rd"></div></div>
      <div class="field" id="field"></div><div class="msg" id="msg"></div>`,
    mount(r) {
      const ROUNDS = 10; let range = store.get('moleR', 'all'), P, round, sc, turn, target, tries, lock;
      const holes = () => $('#field');
      const hud = () => {
        $('#ts').innerHTML = [0, 1].map((i) => `<span class="tsc ${turn === i ? 'on' : ''}" style="--c:${[TEAMS[0][1], TEAMS[2][1]][i]}">${['红队', '蓝队'][i]} <b>${sc[i]}</b></span>`).join('');
        $('#rd').textContent = `第 ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} 轮`;
      };
      const ask = () => {
        tries = 0; lock = false; $('#msg').textContent = `${['红队', '蓝队'][turn]}，仔细听！`;
        target = pick(P);
        const others = shuffle(P.filter(([k]) => k !== target[0])), opts = [target];
        others.forEach((o) => { if (opts.length < 4 && !opts.some(([k]) => k === o[0])) opts.push(o); });
        const spots = shuffle([0, 1, 2, 3, 4, 5]).slice(0, opts.length); const cells = Array(6).fill(null);
        opts.forEach((o, i) => { cells[spots[i]] = o; });
        holes().innerHTML = cells.map((o) => `<div class="hole">${o ? `<button class="mole up py" data-k="${o[0]}" data-t="${o[1]}"><span class="face">${fl('🐹')}</span><span class="lbl">${show(o[0], o[1])}</span></button>` : ''}<div class="dirt"></div></div>`).join('');
        hud(); setTimeout(() => playSyl(...target), 450);
      };
      const start = () => {
        P = pool(range); round = 0; sc = [0, 0]; turn = 0;
        if (P.length < 4) { holes().innerHTML = ''; $('#msg').textContent = '这一组还没学到哦'; return; }
        ask();
      };
      const end = () => {
        const w = sc[0] === sc[1] ? '平局！两队都很棒 🎉' : `${sc[0] > sc[1] ? '红队' : '蓝队'}赢啦！🏆`;
        holes().innerHTML = `<div class="win">${w}<br><button class="go" id="again">再玩一次</button></div>`; $('#msg').textContent = ''; beep(true);
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = b.dataset.range; store.set('moleR', range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.id === 'ear' && target) return playSyl(...target);
        if (b.id === 'again') return start();
        if (b.classList.contains('mole') && !lock) {
          if (b.dataset.k === target[0] && +b.dataset.t === target[1]) {
            lock = true; b.classList.add('hit'); beep(true); sc[turn]++; $('#msg').textContent = '打中啦！⭐';
            round++; turn = 1 - turn; hud();
            setTimeout(() => (round >= ROUNDS ? end() : ask()), 1100);
          } else {
            tries++; b.classList.add('miss'); beep(false);
            if (tries >= 2) {
              lock = true; $$('.mole', r).forEach((m) => { if (m.dataset.k === target[0]) m.classList.add('hit'); });
              $('#msg').textContent = `是 ${show(...target)}，换另一队！`; round++; turn = 1 - turn; hud();
              setTimeout(() => (round >= ROUNDS ? end() : ask()), 1800);
            } else { $('#msg').textContent = '不对哦，再听一次 👂'; setTimeout(() => playSyl(...target), 350); }
          }
        }
      });
      start();
    },
  };

  function whyNot(i, f) {
    if ('gkh'.includes(i)) return `g k h 不和 i、ü 做朋友`;
    if ('jqx'.includes(i)) return `j q x 只和 i、ü 做朋友`;
    if (i === 'f' && f === 'i') return 'f 不和 i 做朋友';
    if (f === 'ü') return `${i} 不和 ü 做朋友（只有 n l 和 j q x 能和 ü 碰）`;
    return `${i} 和 ${f} 不能拼在一起`;
  }
  GAMES.peng = {
    html: () => `<p class="muted">点一个声母，再点一个韵母，按“碰！”</p>
      <div class="pick-row" id="pi">${learnedIni.map((i) => `<button class="pc ini py" data-v="${i}">${i}</button>`).join('')}</div>
      <div class="pick-row" id="pf">${FINALS.map((f) => `<button class="pc fin py" data-v="${f}">${f}</button>`).join('')}</div>
      <div class="peng-stage"><div class="slot py" id="sa">?</div><span class="plus">+</span><div class="slot py" id="sb">?</div>
        <button class="go" id="go">${ic('bolt')}碰！</button><button class="go ghost" id="rnd">${ic('dice-5')}随机</button></div><div id="res" class="res"></div>`,
    mount(r) {
      let A = null, B = null;
      const sync = () => { $('#sa').textContent = A || '?'; $('#sb').textContent = B || '?';
        $$('#pi .pc', r).forEach((b) => b.classList.toggle('sel', b.dataset.v === A)); $$('#pf .pc', r).forEach((b) => b.classList.toggle('sel', b.dataset.v === B)); };
      const bang = () => {
        if (!A || !B) return toast('先选一个声母和一个韵母');
        const k = keyOf(A, B), res = $('#res'); res.className = 'res'; void res.offsetWidth;
        if (SYL[k]) {
          const drop = B === 'ü' && 'jqx'.includes(A);
          res.innerHTML = `<div class="big py">${show(k)}</div>${drop ? `<p class="note">${ic('eye')} ü 遇到 ${A}，去掉两点：<span class="py">${A}ü → ${show(k)}</span></p>` : ''}
            <div class="tones">${[1, 2, 3, 4].map((t) => `<button class="tone t${t} ${hasTone(k, t) ? '' : 'dim'}" data-t="${t}"><span class="py">${show(k, t)}</span></button>`).join('')}</div>
            <button class="go ghost" id="card">${ic('photo')}看例词和图片</button>`;
          res.classList.add('pop'); beep(true); const ft = firstTone(k); if (ft) playSyl(k, ft);
          res.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.t) playSyl(k, +b.dataset.t); if (b.id === 'card') sylCard(k); };
        } else if (EXTRA_VALID.includes(k)) {
          res.innerHTML = `<div class="big py">${k}</div><p class="note">能拼，这个音节一般读轻声。</p>`; res.classList.add('pop');
        } else {
          res.innerHTML = `<div class="nope">🙅 不碰！</div><p class="why">${whyNot(A, B)}</p>`; res.classList.add('shake'); beep(false);
        }
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.closest('#res')) return;
        if (b.classList.contains('ini')) { A = b.dataset.v; playLetter(A); }
        else if (b.classList.contains('fin')) { B = b.dataset.v; playLetter(B); }
        else if (b.id === 'go') return bang();
        else if (b.id === 'rnd') { A = pick(learnedIni); B = pick(FINALS); sync(); return bang(); }
        sync();
      });
    },
  };

  GAMES.listen = {
    html: () => `${rangeBar(store.get('listenR', 'all'))}<div class="track" id="track"></div>
      <div class="q"><button class="ear" id="ear">${ic('volume')}再听一次</button></div><div class="opts" id="opts"></div><div class="msg" id="msg"></div>
      <p class="muted center">${ic('star')} 这台设备上一共得到 <b id="stars">${store.get('stars', 0)}</b> 颗星星</p>`,
    mount(r) {
      const N = 8; let range = store.get('listenR', 'all'), P = [], step = 0, target = null, tries = 0;
      const track = () => { $('#track').innerHTML = Array.from({ length: N + 1 }, (_, i) => `<span class="cell ${i < step ? 'done' : ''} ${i === N ? 'goal' : ''}">${i === step ? plane : i === N ? '🏁' : ''}</span>`).join(''); };
      const ask = () => {
        tries = 0; $('#msg').textContent = ''; target = pick(P);
        const others = shuffle(P.filter(([k]) => k !== target[0]));
        const near = others.filter(([k]) => iniOf(k) === iniOf(target[0]) || finOf(k) === finOf(target[0]));
        const opts = [target]; [...near, ...others].forEach((o) => { if (opts.length < 3 && !opts.some(([k]) => k === o[0])) opts.push(o); });
        $('#opts').innerHTML = shuffle(opts).map(([k, t]) => `<button class="opt py" data-k="${k}" data-t="${t}">${show(k, t)}</button>`).join('');
        setTimeout(() => playSyl(...target), 300);
      };
      const start = () => { P = pool(range); step = 0; track(); if (P.length < 3) { $('#opts').innerHTML = ''; $('#msg').textContent = '这一组还没学到哦'; return; } ask(); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = b.dataset.range; store.set('listenR', range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.id === 'ear' && target) return playSyl(...target);
        if (b.id === 'again') return start();
        if (!b.classList.contains('opt')) return;
        if (b.dataset.k === target[0] && +b.dataset.t === target[1]) {
          b.classList.add('right'); beep(true); step++;
          if (tries === 0) { const s = store.get('stars', 0) + 1; store.set('stars', s); $('#stars').textContent = s; }
          track();
          if (step >= N) { $('#opts').innerHTML = '<div class="win">🏁 飞到终点啦！<br><button class="go" id="again">再飞一次</button></div>'; }
          else setTimeout(ask, 900);
        } else {
          tries++; b.classList.add('wrong'); beep(false);
          $('#msg').textContent = tries >= 2 ? `是 ${show(...target)}，听一听` : '再听一次，仔细听 👂';
          if (tries >= 2) $$('.opt', r).forEach((o) => { if (o.dataset.k === target[0]) o.classList.add('right'); });
          setTimeout(() => playSyl(...target), 400);
        }
      });
      start();
    },
  };

  V.games = (sub) => { const id = GAMES[sub] ? sub : 'mole'; return `<section class="card tool-page">${tabs('games', GAME_TABS, id)}<div class="tool-body">${GAMES[id].html()}</div></section>`; };
  V.games.mount = (r, sub) => { fsBind(r); return GAMES[GAMES[sub] ? sub : 'mole'].mount(r); };

  /* ---------- 家长专区 ---------- */
  const fileList = (files) => (files ? `<div class="dl">${files.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${ic('file-type-pdf')}${t}</a>`).join('')}</div>` : '');
  V.parents = () => `<section><div class="sec"><h2>每周课程</h2><small>这周学了什么 · 在家怎么练 · Ugens pinyin</small></div>
    <div class="card tips"><h3>${ic('bulb')} 在家陪练小贴士</h3><ul>
      <li>每天 5–10 分钟，比一周一次练很久更有效。</li>
      <li>拼读口诀：<b>前音轻短后音重，两音相连猛一碰</b>。先拆（g—ē），再拼（gē），最后说一个词（鸽子）。</li>
      <li>孩子能听懂中文是很大的优势：拼出一个音节，就问“这是哪个词里的音？”</li>
      <li>可以用 <a href="#chart">拼音表</a> 和 <a href="#games/listen">听音找飞机</a> 在家练。网站读音来自浏览器，个别声调可能不准，以老师课上读音为准。</li></ul></div>
    ${WEEKS.slice().reverse().map((w) => `<article class="card week ${w === nextWeek ? 'now' : ''}">
      <div class="wd">${fmt(w.date)}${w === nextWeek ? ' <span class="badge">下一次课</span>' : ''}${w.hanzi ? ` <span class="hz">汉字 ${w.hanzi}</span>` : ''}</div>
      <h3>${w.title}</h3>
      ${w.learn.length ? `<div class="chips">${w.learn.map((x) => `<button class="chip" data-l="${x}"><span class="py">${x}</span>${LETTER[x] ? ` <small>${LETTER[x][1]}</small>` : ''}</button>`).join('')}</div>` : ''}
      <div class="cols"><div><h4>课上</h4><ul>${w.points.map((p) => `<li>${p}</li>`).join('')}</ul></div>
        <div><h4>在家练</h4><ul>${w.home.map((p) => `<li>${p}</li>`).join('')}</ul></div></div>${fileList(w.files)}</article>`).join('')}</section>`;
  V.parents.mount = (r) => r.addEventListener('click', (e) => { const b = e.target.closest('[data-l]'); if (b) letterCard(b.dataset.l); });

  /* ---------- 资源库 ---------- */
  V.res = () => {
    const done = WEEKS.filter((w) => w.files && w.files.length).slice().reverse();
    return `<section><div class="sec"><h2>资源库</h2><small>按教学进度整理 · 点开就能打印或投影</small></div>
      ${done.map((w) => `<div class="card res-week"><div class="wd">${fmt(w.date)} · ${w.title}</div>${fileList(w.files)}</div>`).join('')}
      <div class="card"><h3>${ic('lock')} 以后会用到</h3><p class="muted">学到对应内容后会自动亮起来。</p>
        <div class="later">${LATER.map((x) => { const ok = x.needs.every((n) => learned.has(n));
          return `<div class="lt ${ok ? 'ok' : ''}">${ok ? ic('circle-check') : ic('lock')} ${x.title}<small>${ok ? (x.file ? `<a href="${x.file}">打开</a>` : '老师课上用') : x.note}</small></div>`; }).join('')}</div></div></section>`;
  };

  /* ================= 路由 ================= */
  let cleanup = null;
  function route() {
    let [name, sub] = (location.hash.slice(1) || 'home').split('/');
    if (window.ONLY) { sub = (name === window.ONLY && sub) ? sub : window.ONLY_SUB; name = window.ONLY; }
    const v = V[name] || V.home;
    if (typeof cleanup === 'function') cleanup(); cleanup = null;
    const main = $('#main'), fresh = main.cloneNode(false); main.replaceWith(fresh);
    fresh.appendChild(frag(v(sub)));
    if (v.mount) cleanup = v.mount(fresh, sub);
    $$('nav a').forEach((a) => a.classList.toggle('on', a.getAttribute('href').slice(1).split('/')[0] === (V[name] ? name : 'home')));
    $('#sheet').classList.remove('on'); window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  route();
})();
