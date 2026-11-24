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
  /* 先认两个字母的声母 zh ch sh，再认一个字母的 */
  const iniOf = (k) => (INITIALS.includes(k.slice(0, 2)) ? k.slice(0, 2) : INITIALS.includes(k[0]) ? k[0] : '');
  const isIn = (i, list) => !!i && list.includes(i);
  const JQX = ['j', 'q', 'x'], NL = ['n', 'l'], GKH = ['g', 'k', 'h'], ZCSR = ['zh', 'ch', 'sh', 'r'];
  const GROUP_NAME = (g) => g.join(' ');
  const finOf = (k) => { const f = k.slice(iniOf(k).length); return f === 'v' ? 'ü' : f; };
  const keyOf = (i, f) => i + (f === 'ü' ? 'v' : f);
  function show(k, t) {
    const i = iniOf(k); let f = finOf(k);
    if (f === 'ü' && isIn(i, JQX)) f = 'u';
    if (t) f = MARKS[f][t - 1];
    return i + f;
  }
  const hasTone = (k, t) => !!(SYL[k] && SYL[k][t - 1]);
  const firstTone = (k) => [1, 2, 3, 4].find((t) => hasTone(k, t));

  /* ================= 进度 ================= */
  /* 预览以后的进度：网址后面加 ?today=2026-11-28 */
  const qDay = new URLSearchParams(location.search).get('today');
  const today = /^\d{4}-\d{2}-\d{2}$/.test(qDay || '') ? qDay : new Date().toISOString().slice(0, 10);
  /* 老师用的主站：data.js 里写好的周全部解锁（包括还没上的课）；家长用的 biao.html 按日期解锁 */
  const openDay = window.ONLY || qDay ? today : '9999-12-31';
  const learned = new Set(WEEKS.filter((w) => w.date <= openDay).flatMap((w) => w.learn));
  const learnedIni = INITIALS.filter((i) => learned.has(i));
  const nextWeek = WEEKS.find((w) => w.date >= today) || WEEKS[WEEKS.length - 1];
  const fmt = (d) => { const [, m, dd] = d.split('-'); return `${+m}月${+dd}日`; };

  const RANGES = [
    { id: 'all', name: '全部学过的', inis: ['', ...learnedIni] },
    { id: 'fin', name: '单韵母 a o e i u ü', inis: [''] },
    { id: 'bpmf', name: 'b p m f d t n l', inis: ['b', 'p', 'm', 'f', 'd', 't', 'n', 'l'] },
    { id: 'gkhjqx', name: 'g k h j q x', inis: ['g', 'k', 'h', 'j', 'q', 'x'] },
    { id: 'zhchshr', name: 'zh ch sh r', inis: ZCSR },
  ].map((r) => ({ ...r, inis: r.inis.filter((i) => i === '' || learned.has(i)) })).filter((r) => r.inis.length);
  /* “比一比”：一对一对的易混音节，两个都学过、都有老师录音才出现 */
  const pairPool = () => (window.PAIRS || []).filter((pr) => pr.every((x) => learned.has(iniOf(x)) && REC.has(x)))
    .map((pr) => pr.map((x) => [x.slice(0, -1), +x.slice(-1)]));
  const PAIR_RANGE = { id: 'pair', name: '比一比 zh/j ch/q sh/x r/l' };
  function pool(rangeId, recOnly) {
    if (rangeId === 'pair') return pairPool().flat();
    const r = RANGES.find((x) => x.id === rangeId) || RANGES[0], out = [];
    Object.keys(SYL).forEach((k) => {
      if (!r.inis.includes(iniOf(k))) return;
      if (iniOf(k) === '' && !learned.has(finOf(k))) return;
      [1, 2, 3, 4].forEach((t) => { if (hasTone(k, t) && (!recOnly || REC.has(k + t))) out.push([k, t]); });
    });
    return out;
  }
  const rangeBar = (cur, recOnly, withPair) => `<div class="ranges">${[...RANGES, ...(withPair && learned.has('zh') ? [PAIR_RANGE] : [])].filter((r) => !recOnly || pool(r.id, true).length >= 4).map((r) =>
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
  const recSyl = (k, t) => { if (REC.has(k + t)) playFile(k + t, () => {}); };
  const recLetter = (x) => { const n = 'letter-' + (x === 'ü' ? 'v' : x); if (REC.has(n)) playFile(n, () => {}); };
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
    '🎀': 'Ribbon', '🍗': 'Poultry leg', '😉': 'Winking face', '👉': 'Backhand index pointing right*', '🎋': 'Tanabata tree', '🍲': 'Pot of food',
    '🕷️': 'Spider', '📄': 'Page facing up', '🍴': 'Fork and knife', '🍵': 'Teacup without handle', '🚗': 'Automobile', '🚪': 'Door',
    '🍳': 'Cooking', '📏': 'Straight ruler', '🪽': 'Wing', '🏖️': 'Beach with umbrella', '🤪': 'Zany face', '🐍': 'Snake', '🐭': 'Mouse face',
    '🌳': 'Deciduous tree', '🦁': 'Lion', '🔟': 'Keycap 10', '✅': 'Check mark button', '☀️': 'Sun', '🌅': 'Sunrise', '🍎': 'Red apple',
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
      ${LETTER[x] ? `<div class="mn">${LETTER[x][1]}</div>` : ''}${LETTER[x] && LETTER[x][2] ? `<div class="act">${ic('hand-finger')} 动作：${LETTER[x][2]}</div>` : ''}
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
    const note = f === 'ü' && isIn(i, JQX) ? `<p class="note">${ic('eye')} 小 ü 见了 j q x，去掉两点还读 ü</p>`
      : f === 'ü' && isIn(i, NL) ? `<p class="note">${ic('diamond')} 小 ü 见了 n l，两点不能丢</p>`
      : f === 'i' && isIn(i, ZCSR) ? `<p class="note">${ic('sparkles')} ${show(k)} 要整个读，i 不读成“衣”</p>` : '';
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
    const last = [...WEEKS].reverse().find((w) => w.date <= openDay && w.learn.length);
    const grp = [['单韵母', FINALS], ...INITIAL_GROUPS.map((g) => [GROUP_NAME(g), g])];
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
        <ul>${GAME_CATS.map((c) => `<li>${ic(c[4])}${c[1]} · ${GAME_LIST.filter((g) => g.cat === c[0]).map((g) => g.name.replace('拼音', '')).join('、')}</li>`).join('')}</ul><span class="more">去玩游戏 ${ic('arrow-right')}</span></a>
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
    ['gkhjqx', 'g k h j q x', ['g', 'k', 'h', 'j', 'q', 'x']], ['zhchshr', 'zh ch sh r', ZCSR],
  ].filter((t) => t[2].some((i) => learned.has(i)));
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
        if (SYL[k]) rows += `<button class="ch ok g${gi}l" data-k="${k}"><span class="py">${show(k)}</span>${f === 'ü' && isIn(i, JQX) ? '<em>ü 去两点</em>' : f === 'i' && isIn(i, ZCSR) ? '<em>整个读</em>' : ''}</button>`;
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
        <div>${ic('ban')} <b>f</b> 不和 <span class="py">i</span> 碰；<b>b p m f d t</b> 不和 <span class="py">ü</span> 碰</div>
        ${learned.has('zh') ? `<div>${ic('arrow-big-up-lines')} <b>zh ch sh r</b> 舌头翘起来；和 g k h 一样，不和 <span class="py">ü</span> 碰</div>
        <div>${ic('sparkles')} <span class="py">zhi chi shi ri</span> 整个读，i 不读成“衣”</div>` : ''}</div></section>`;
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
        if (mode === 'ini') { const x = pick(learnedIni); cur = ['l', x]; f.textContent = x; s.textContent = LETTER[x] ? LETTER[x][1] + (LETTER[x][2] ? ' · ' + LETTER[x][2] : '') : ''; }
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
    html: () => `<div class="grp-in"><label>名字（每行一个，只保存在这台电脑上，不会上传）<textarea id="names" rows="8" placeholder="不写名字也可以：用下面的人数，按号码分组"></textarea></label>
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
  const GAMES = {};
  /* 游戏设置面板：可以收起来（投影时省地方），开关状态记在这台电脑上 */
  const conf = (rangeHtml, ...opts) => `<details class="gconf" ${store.get('confOpen', true) ? 'open' : ''}><summary>${ic('adjustments-horizontal')}游戏设置<span class="gconf-tip">点这里收起 / 打开</span></summary>
    <div class="gconf-in">${rangeHtml || ''}<div class="gset">${opts.join('')}</div></div></details>`;
  const optSeg = (label, key, list, cur) => `<div class="gopt"><span>${label}</span><div class="seg">${list.map(([v, n]) =>
    `<button data-opt="${key}" data-v="${v}" class="${String(v) === String(cur) ? 'sel' : ''}">${n}</button>`).join('')}</div></div>`;
  const optHit = (r, b) => { $$(`[data-opt="${b.dataset.opt}"]`, r).forEach((x) => x.classList.toggle('sel', x === b)); const v = b.dataset.v; return /^\d+$/.test(v) ? +v : v; };
  const teamBar = (key, cur, solo) => `<div class="gopt"><span>队伍</span><div class="seg">${(solo ? [1, 2, 3, 4] : [2, 3, 4]).map((n) =>
    `<button class="${n === cur ? 'sel' : ''}" data-teams="${n}">${n === 1 ? '个人' : n + ' 队'}</button>`).join('')}</div></div>`;
  const scoreBoard = (n, sc, turn) => TEAMS.slice(0, n).map((t, i) => `<span class="tsc ${turn === i ? 'on' : ''}" style="--c:${t[1]}">${t[0]} <b>${sc[i]}</b></span>`).join('');
  const winner = (n, sc) => { const m = Math.max(...sc), w = TEAMS.slice(0, n).filter((_, i) => sc[i] === m).map((t) => t[0]);
    return w.length === n ? '平局！每个队都很棒 🎉' : w.length > 1 ? `${w.join('、')}并列第一！🏆` : `${w[0]}赢啦！🏆`; };

  GAMES.mole = {
    html: () => `${conf(rangeBar(store.get('moleR', 'all'), true), teamBar('moleT', store.get('moleT', 2)))}
      <div class="mole-top"><div class="team-score" id="ts"></div><button class="ear" id="ear">${ic('volume')}再听一次</button><div class="round" id="rd"></div></div>
      <div class="field" id="field"></div><div class="msg" id="msg"></div>`,
    mount(r) {
      let ROUNDS = 10, NT = store.get('moleT', 2), range = store.get('moleR', 'all'), P, round, sc, turn, target, tries, lock;
      const holes = () => $('#field');
      const hud = () => {
        $('#ts').innerHTML = scoreBoard(NT, sc, turn);
        $('#rd').textContent = `第 ${Math.min(round + 1, ROUNDS)} / ${ROUNDS} 轮`;
      };
      const ask = () => {
        tries = 0; lock = false; $('#msg').textContent = `${TEAMS[turn][0]}，仔细听！`;
        target = pick(P);
        const others = shuffle(P.filter(([k]) => k !== target[0])), opts = [target];
        others.forEach((o) => { if (opts.length < 4 && !opts.some(([k]) => k === o[0])) opts.push(o); });
        const spots = shuffle([0, 1, 2, 3, 4, 5]).slice(0, opts.length); const cells = Array(6).fill(null);
        opts.forEach((o, i) => { cells[spots[i]] = o; });
        holes().innerHTML = cells.map((o) => `<div class="hole">${o ? `<button class="mole up py" data-k="${o[0]}" data-t="${o[1]}"><span class="face">${fl('🐹')}</span><span class="lbl">${show(o[0], o[1])}</span></button>` : ''}<div class="dirt"></div></div>`).join('');
        hud(); setTimeout(() => playSyl(...target), 450);
      };
      const start = () => {
        P = pool(range, true); round = 0; sc = Array(NT).fill(0); turn = 0; ROUNDS = NT * ({ 2: 5, 3: 4, 4: 3 }[NT] || 4);
        if (P.length < 4) { holes().innerHTML = ''; $('#msg').textContent = '这一组还没有老师的录音'; return; }
        ask();
      };
      const end = () => {
        const w = winner(NT, sc);
        holes().innerHTML = `<div class="win">${w}<br><button class="go" id="again">再玩一次</button></div>`; $('#msg').textContent = ''; beep(true);
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = b.dataset.range; store.set('moleR', range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.dataset.teams) { NT = +b.dataset.teams; store.set('moleT', NT); $$('[data-teams]', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.id === 'ear' && target) return playSyl(...target);
        if (b.id === 'again') return start();
        if (b.classList.contains('mole') && !lock) {
          if (b.dataset.k === target[0] && +b.dataset.t === target[1]) {
            lock = true; b.classList.add('hit'); beep(true); sc[turn]++; $('#msg').textContent = '打中啦！⭐';
            round++; turn = (turn + 1) % NT; hud();
            setTimeout(() => (round >= ROUNDS ? end() : ask()), 1100);
          } else {
            tries++; b.classList.add('miss'); beep(false);
            if (tries >= 2) {
              lock = true; $$('.mole', r).forEach((m) => { if (m.dataset.k === target[0]) m.classList.add('hit'); });
              $('#msg').textContent = `是 ${show(...target)}，换下一队！`; round++; turn = (turn + 1) % NT; hud();
              setTimeout(() => (round >= ROUNDS ? end() : ask()), 1800);
            } else { $('#msg').textContent = '不对哦，再听一次 👂'; setTimeout(() => playSyl(...target), 350); }
          }
        }
      });
      start();
    },
  };

  function whyNot(i, f) {
    if (isIn(i, ZCSR) && f === 'ü') return 'zh ch sh r 和 g k h 一样，不和 ü 做朋友';
    if (isIn(i, ZCSR)) return `${i} 和 ${f} 不能拼在一起`;
    if (isIn(i, GKH)) return `g k h 不和 i、ü 做朋友`;
    if (isIn(i, JQX)) return `j q x 只和 i、ü 做朋友`;
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
          const drop = B === 'ü' && isIn(A, JQX), whole = B === 'i' && isIn(A, ZCSR);
          res.innerHTML = `<div class="big py">${show(k)}</div>${drop ? `<p class="note">${ic('eye')} ü 遇到 ${A}，去掉两点：<span class="py">${A}ü → ${show(k)}</span></p>` : ''}${whole ? `<p class="note">${ic('sparkles')} ${show(k)} 要整个读，i 不读成“衣”</p>` : ''}
            <div class="tones">${[1, 2, 3, 4].map((t) => `<button class="tone t${t} ${hasTone(k, t) && REC.has(k + t) ? '' : 'dim'}" data-t="${t}"><span class="py">${show(k, t)}</span></button>`).join('')}</div>
            <button class="go ghost" id="card">${ic('photo')}看例词和图片</button>`;
          res.classList.add('pop'); beep(true); const ft = [1, 2, 3, 4].find((t) => REC.has(k + t)); if (ft) recSyl(k, ft);
          res.onclick = (e) => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.t) recSyl(k, +b.dataset.t); if (b.id === 'card') sylCard(k); };
        } else if (EXTRA_VALID.includes(k)) {
          res.innerHTML = `<div class="big py">${k}</div><p class="note">能拼，这个音节一般读轻声。</p>`; res.classList.add('pop');
        } else {
          res.innerHTML = `<div class="nope">🙅 不碰！</div><p class="why">${whyNot(A, B)}</p>`; res.classList.add('shake'); beep(false);
        }
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b || b.closest('#res')) return;
        if (b.classList.contains('ini')) { A = b.dataset.v; recLetter(A); }
        else if (b.classList.contains('fin')) { B = b.dataset.v; recLetter(B); }
        else if (b.id === 'go') return bang();
        else if (b.id === 'rnd') { A = pick(learnedIni); B = pick(FINALS); sync(); return bang(); }
        sync();
      });
    },
  };

  GAMES.listen = {
    html: () => `${conf(rangeBar(store.get('listenR', 'all'), true, true), teamBar('listenT', store.get('listenT', 1), true))}<div id="track"></div>
      <div class="q"><button class="ear" id="ear">${ic('volume')}再听一次</button></div><div class="opts" id="opts"></div><div class="msg" id="msg"></div>
      <p class="muted center">${ic('star')} 这台设备上一共得到 <b id="stars">${store.get('stars', 0)}</b> 颗星星</p>`,
    mount(r) {
      // 个人：一架飞机飞 8 格；分队：每队一条航线、一架飞机，第一次就听对才前进 1 格，先到终点的队赢
      let NT = store.get('listenT', 1), N = 8, range = store.get('listenR', 'all'), P = [], steps = [0], target = null, tries = 0, turn = 0, busy = false;
      const lane = (i) => `<div class="track ${NT > 1 ? 'lane' : ''} ${NT > 1 && turn === i ? 'on' : ''}" style="--c:${TEAMS[i][1]};grid-template-columns:${NT > 1 ? '5.5rem ' : ''}repeat(${N + 1},1fr)">
        ${NT > 1 ? `<span class="lname">${TEAMS[i][0]}</span>` : ''}${Array.from({ length: N + 1 }, (_, c) =>
          `<span class="cell ${c < steps[i] ? 'done' : ''} ${c === N ? 'goal' : ''}">${c === steps[i] ? plane : c === N ? '🏁' : ''}</span>`).join('')}</div>`;
      const track = () => { $('#track').innerHTML = steps.map((_, i) => lane(i)).join(''); };
      const ask = () => {
        tries = 0; busy = false; $('#msg').textContent = NT > 1 ? `${TEAMS[turn][0]}，仔细听！` : ''; track();
        let opts;
        if (range === 'pair') { opts = pick(pairPool()); target = pick(opts); } else {
          target = pick(P);
          const others = shuffle(P.filter(([k]) => k !== target[0]));
          const near = others.filter(([k]) => iniOf(k) === iniOf(target[0]) || finOf(k) === finOf(target[0]));
          opts = [target]; [...near, ...others].forEach((o) => { if (opts.length < 3 && !opts.some(([k]) => k === o[0])) opts.push(o); });
        }
        $('#opts').innerHTML = shuffle(opts).map(([k, t]) => `<button class="opt py" data-k="${k}" data-t="${t}">${show(k, t)}</button>`).join('');
        setTimeout(() => playSyl(...target), 300);
      };
      const start = () => {
        P = pool(range, true); N = NT > 1 ? 6 : 8; steps = Array(NT).fill(0); turn = 0; track();
        if (range === 'pair' ? !pairPool().length : P.length < 3) { $('#opts').innerHTML = ''; $('#msg').textContent = '这一组还没有老师的录音'; return; }
        ask();
      };
      const finish = (i) => {
        $('#opts').innerHTML = `<div class="win">🏁 ${NT > 1 ? `${TEAMS[i][0]}先飞到终点，赢啦！🏆` : '飞到终点啦！'}<br><button class="go" id="again">再飞一次</button></div>`;
        $('#msg').textContent = ''; beep(true);
      };
      const next = () => { if (NT > 1) turn = (turn + 1) % NT; ask(); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = b.dataset.range; store.set('listenR', range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.dataset.teams) { NT = +b.dataset.teams; store.set('listenT', NT); $$('[data-teams]', r).forEach((x) => x.classList.toggle('sel', x === b)); return start(); }
        if (b.id === 'ear' && target) return playSyl(...target);
        if (b.id === 'again') return start();
        if (!b.classList.contains('opt') || busy) return;
        if (b.dataset.k === target[0] && +b.dataset.t === target[1]) {
          b.classList.add('right'); beep(true); busy = true;
          const move = NT === 1 || tries === 0;
          if (tries === 0) { const s = store.get('stars', 0) + 1; store.set('stars', s); $('#stars').textContent = s; }
          if (move) steps[turn]++;
          if (NT > 1) $('#msg').textContent = move ? `${TEAMS[turn][0]}前进一格！✈️` : '答对啦，但这次不前进';
          track();
          if (steps[turn] >= N) return finish(turn);
          setTimeout(next, 1000);
        } else {
          tries++; b.classList.add('wrong'); beep(false);
          if (tries >= 2) {
            $$('.opt', r).forEach((o) => { if (o.dataset.k === target[0] && +o.dataset.t === target[1]) o.classList.add('right'); });
            if (NT > 1) { busy = true; $('#msg').textContent = `是 ${show(...target)}，换下一队！`; setTimeout(() => playSyl(...target), 400); return setTimeout(next, 2200); }
            $('#msg').textContent = `是 ${show(...target)}，听一听`;
          } else $('#msg').textContent = '再听一次，仔细听 👂';
          setTimeout(() => playSyl(...target), 400);
        }
      });
      start();
    },
  };

  /* 拼音小邮差：看拼音和图，把“信”送到声母车站（不需要录音；有录音就点喇叭听） */
  GAMES.post = {
    html: () => `<p class="muted">看拼音和图，把信送到它的声母车站 · Bring brevet til den rigtige station</p>
      <div class="mole-top"><div class="team-score"><span class="tsc on" style="--c:var(--mustard-d)">${ic('star')} <b id="pstar">0</b></span></div><div class="round" id="rd"></div></div>
      <div class="post-card" id="pcard"></div><div class="post-st" id="pst"></div><div class="msg" id="msg"></div>`,
    mount(r) {
      const groups = INITIAL_GROUPS.map((g) => g.filter((i) => learned.has(i))).filter((g) => g.length);
      const P = [];
      Object.keys(SYL).forEach((k) => { const i = iniOf(k); if (!i || !learned.has(i) || !learned.has(finOf(k))) return;
        [1, 2, 3, 4].forEach((t) => { if (EX[k + t] && SYL[k][t - 1]) P.push([k, t]); }); });
      const ROUNDS = 10; let round, stars, target, tries, lock, last = [];
      if (groups.length < 2 || P.length < 4) { $('#msg').textContent = '再学几个声母就能玩啦'; return; }
      $('#pst').innerHTML = groups.map((g, gi) => `<button class="station g${INITIAL_GROUPS.findIndex((x) => x.includes(g[0]))}" data-g="${gi}">${ic('building-store')}<span class="py">${g.join(' ')}</span><small>站</small></button>`).join('');
      const ask = () => {
        tries = 0; lock = false; $('#msg').textContent = '这封信送到哪个车站？';
        do { target = pick(P); } while (last.includes(target[0]) && P.length > 6);
        last = [...last, target[0]].slice(-4);
        const ex = EX[target[0] + target[1]], rec = REC.has(target[0] + target[1]);
        const c = $('#pcard'); c.innerHTML = `<div class="pic">${pic(ex[1])}</div><div class="py big">${show(...target)}</div><div class="word">${esc(ex[0])}</div>
          ${rec ? `<button class="go ghost" id="pear">${ic('volume')}听一听</button>` : ''}`;
        c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
        $$('.station', r).forEach((b) => b.classList.remove('right', 'wrong'));
        $('#rd').textContent = `第 ${round + 1} / ${ROUNDS} 封信`;
        if (rec) recSyl(...target);
      };
      const start = () => { round = 0; stars = 0; $('#pstar').textContent = 0; ask(); };
      const next = () => { round++; if (round >= ROUNDS) { $('#pcard').innerHTML = `<div class="win">送完 ${ROUNDS} 封信，得到 ${stars} 颗星！🏆<br><button class="go" id="again">再送一次</button></div>`; $('#msg').textContent = ''; beep(true); return; } ask(); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.id === 'again') return start();
        if (b.id === 'pear') return recSyl(...target);
        if (!b.classList.contains('station') || lock || round >= ROUNDS) return;
        const ok = groups[+b.dataset.g].includes(iniOf(target[0]));
        if (ok) {
          lock = true; b.classList.add('right'); beep(true);
          if (tries === 0) { stars++; $('#pstar').textContent = stars; }
          $('#msg').textContent = `送到啦！${show(...target)} 是 ${iniOf(target[0])} 开头的 ⭐`; setTimeout(next, 1300);
        } else {
          tries++; b.classList.add('wrong'); beep(false);
          if (tries >= 2) {
            lock = true; $$('.station', r).forEach((x) => { if (groups[+x.dataset.g].includes(iniOf(target[0]))) x.classList.add('right'); });
            $('#msg').textContent = `${show(...target)} 的声母是 ${iniOf(target[0])}，送到这里哦`; setTimeout(next, 2200);
          } else $('#msg').textContent = `再看看，${show(...target)} 的声母是谁？`;
        }
      });
      start();
    },
  };

  /* ---------- 新游戏共用的小零件 ---------- */
  const judgeBox = (k, t, q) => `<div class="judge pop"><div class="jq">${q || '读一读'}</div><div class="jbig py">${show(k, t)}</div>
    <div class="jbtn"><button class="go ghost" data-j="ear">${ic('volume')}听老师读</button>
      <button class="go yes" data-j="yes">${ic('check')}读对了</button><button class="go no" data-j="no">${ic('x')}没读对</button></div></div>`;
  const winBox = (txt, btn) => `<div class="gwin"><div class="gwin-in pop"><div class="trophy">${fl('🏆')}</div><div class="wt">${txt}</div>
    <button class="go" id="again">${ic('refresh')}${btn || '再玩一次'}</button></div></div>`;
  const rangeHit = (r, b, key) => { store.set(key, b.dataset.range); $$('.rg', r).forEach((x) => x.classList.toggle('sel', x === b)); return b.dataset.range; };
  const cycle = (P, n) => { const out = []; let d = []; while (out.length < n) { if (!d.length) d = shuffle(P); out.push(d.pop()); } return out; };

  /* ---------- 拼音毒药：先读再翻，翻到毒药扣分 ---------- */
  GAMES.poison = {
    html: () => `${conf(rangeBar(store.get('poiR', 'all'), true),
      optSeg('队伍', 'T', [[2, '2 队'], [3, '3 队'], [4, '4 队']], store.get('poiT', 3)),
      optSeg('毒药', 'N', [[1, '1 瓶'], [2, '2 瓶'], [3, '3 瓶']], store.get('poiN', 2)),
      optSeg('谁来下毒', 'M', [['pc', '电脑'], ['me', '老师']], store.get('poiM', 'pc')))}
      <div class="ghud"><div class="team-score" id="ts"></div><div class="round" id="rd"></div></div>
      <div class="msg big" id="msg"></div><div class="stagebox"><div class="pgrid" id="grid"></div></div>`,
    mount(r) {
      let range = store.get('poiR', 'all'), NT = store.get('poiT', 3), NP = store.get('poiN', 2), MODE = store.get('poiM', 'pc');
      let cards = [], bad = new Set(), who = [], sc = [], turn = 0, phase = 'set', lock = false, np = 0;
      const left = () => cards.filter((_, i) => !bad.has(i) && !who[i]).length;
      const say = (t) => { $('#msg').textContent = t; };
      const hud = () => { $('#ts').innerHTML = scoreBoard(NT, sc, phase === 'play' ? turn : -1); $('#rd').textContent = phase === 'play' ? `还有 ${left()} 张安全卡` : ''; };
      const draw = () => {
        const g = $('#grid'); g.style.setProperty('--cols', cards.length > 9 ? 4 : 3);
        g.innerHTML = cards.map(([k, t], i) => {
          const w = who[i], b = bad.has(i) && (w || phase === 'end');
          return `<button class="pcard ${w || b ? 'open' : ''} ${b ? 'bad' : w ? 'safe' : ''}" data-i="${i}" ${w && !b ? `style="--c:${TEAMS[w - 1][1]}"` : ''}>
            <span class="py">${show(k, t)}</span>${b ? `<em>☠️${w ? ` ${TEAMS[w - 1][0]}` : ''}</em>` : w ? `<em>${ic('check')}${TEAMS[w - 1][0]}</em>` : ''}</button>`;
        }).join('');
      };
      const start = () => {
        $('.gwin', r)?.remove(); const P = pool(range, true); phase = 'set'; lock = false; turn = 0; sc = Array(NT).fill(0); who = []; bad = new Set();
        if (P.length < 6) { cards = []; draw(); hud(); return say('这一组还没有足够的老师录音'); }
        cards = shuffle(P).slice(0, 16); np = Math.min(NP, cards.length - 3);
        if (MODE === 'pc') { shuffle([...cards.keys()]).slice(0, np).forEach((i) => bad.add(i)); phase = 'play'; say(`电脑偷偷放好了 ${np} 瓶毒药 🤫 ${TEAMS[0][0]}先来：先读，再翻！`); }
        else say(`🙈 小朋友闭上眼睛！老师点 ${np} 张卡放毒药`);
        draw(); hud();
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = rangeHit(r, b, 'poiR'); return start(); }
        if (b.dataset.opt) { const v = optHit(r, b), o = b.dataset.opt; store.set('poi' + o, v); if (o === 'T') NT = v; if (o === 'N') NP = v; if (o === 'M') MODE = v; return start(); }
        if (b.id === 'again') return start();
        if (!b.classList.contains('pcard') || lock) return;
        const i = +b.dataset.i;
        if (phase === 'set') {
          if (bad.has(i)) return; bad.add(i); b.classList.remove('tap'); void b.offsetWidth; b.classList.add('tap');
          if (bad.size >= np) { phase = 'play'; hud(); say(`毒药放好啦！睁开眼睛 👀 ${TEAMS[turn][0]}先来：先读，再翻！`); } else say(`🙈 还要放 ${np - bad.size} 瓶`);
          return;
        }
        if (phase !== 'play' || who[i]) return;
        who[i] = turn + 1; lock = true; const isBad = bad.has(i);
        if (isBad) { sc[turn] = Math.max(0, sc[turn] - 2); beep(false); say(`☠️ 哎呀！${TEAMS[turn][0]}中毒了，扣 2 分`); }
        else { sc[turn]++; beep(true); say(`${TEAMS[turn][0]} +1 ⭐`); }
        setTimeout(() => recSyl(...cards[i]), 350);
        draw(); $(`.pcard[data-i="${i}"]`, r).classList.add(isBad ? 'shake' : 'pop'); hud();
        setTimeout(() => {
          lock = false;
          if (!left()) { phase = 'end'; draw(); hud(); say(''); $('.stagebox', r).insertAdjacentHTML('beforeend', winBox(winner(NT, sc))); return beep(true); }
          turn = (turn + 1) % NT; hud(); say(`${TEAMS[turn][0]}：先读，再翻！`);
        }, 1500);
      });
      start();
    },
  };

  /* ---------- 拼音不见了：记住卡片，猜猜哪一张不见了 ---------- */
  GAMES.gone = {
    html: () => {
      const m = store.get('goneM', 'syl');
      return `${conf(`<div id="gr" ${m === 'syl' ? '' : 'hidden'}>${rangeBar(store.get('goneR', 'all'), true)}</div>`,
        optSeg('卡片', 'M', [['syl', '音节'], ['ini', '声母'], ['fin', '韵母']], m),
        optSeg('张数', 'N', [[4, '4 张'], [6, '6 张'], [9, '9 张']], store.get('goneN', 6)),
        optSeg('记忆时间', 'S', [[3, '3 秒'], [5, '5 秒'], [8, '8 秒']], store.get('goneS', 5)),
        optSeg('位置', 'X', [[0, '不动'], [1, '打乱']], store.get('goneX', 0)),
        optSeg('队伍', 'T', [[1, '全班'], [2, '2 队'], [3, '3 队'], [4, '4 队']], store.get('goneT', 1)))}
        <div class="ghud"><div class="team-score" id="ts"></div><div class="round" id="rd"></div><div class="cdown" id="cd"></div></div>
        <div class="stagebox"><div class="ggrid" id="grid"></div></div><div class="msg big" id="msg"></div><div class="cm-btns" id="ctl"></div>`;
    },
    mount(r) {
      const S = (k, d) => store.get('gone' + k, d);
      let M = S('M', 'syl'), N = S('N', 6), SEC = S('S', 5), MIX = S('X', 0), NT = S('T', 1), range = S('R', 'all');
      let items = [], pos = [], hide = -1, deck = [], phase = 'idle', sc = [], turn = 0, round = 0, timer = null;
      const ROUNDS = () => NT * 3;
      const src = () => (M === 'ini' ? learnedIni.map((x) => ['l', x]) : M === 'fin' ? FINALS.filter((x) => learned.has(x)).map((x) => ['l', x])
        : pool(range, true).map(([k, t]) => ['s', k, t]));
      const label = (it) => (it[0] === 'l' ? it[1] : show(it[1], it[2]));
      const sound = (it) => (it[0] === 'l' ? recLetter(it[1]) : recSyl(it[1], it[2]));
      const say = (t) => { $('#msg').textContent = t; };
      const ctl = (h) => { $('#ctl').innerHTML = h; };
      const hud = () => {
        $('#ts').innerHTML = NT > 1 ? scoreBoard(NT, sc, phase === 'guess' || phase === 'show' ? turn : -1) : '';
        $('#rd').textContent = NT > 1 && phase !== 'idle' ? `第 ${Math.min(round + 1, ROUNDS())} / ${ROUNDS()} 轮` : '';
      };
      const draw = () => {
        const g = $('#grid'); g.style.setProperty('--cols', items.length <= 4 ? 2 : 3);
        g.innerHTML = pos.map((ix) => (ix === hide && phase === 'guess' ? '<div class="gc gap">?</div>'
          : `<button class="gc py ${ix === hide && phase === 'show' ? 'found pop' : ''}" data-ix="${ix}">${label(items[ix])}</button>`)).join('');
      };
      const stop = () => { clearInterval(timer); timer = null; $('#cd').innerHTML = ''; };
      const start = () => {
        stop(); $('.gwin', r)?.remove(); const s = src(); sc = Array(NT).fill(0); turn = 0; round = 0; hide = -1; phase = 'idle'; deck = [];
        if (s.length < 3) { items = []; pos = []; draw(); hud(); ctl(''); return say('这一组还没有足够的卡片（或老师录音）'); }
        items = shuffle(s).slice(0, Math.min(N, s.length)); pos = items.map((_, i) => i);
        draw(); hud(); say('看一看，准备好了就按「开始」'); ctl(`<button class="go" data-a="look">${ic('player-play')}开始</button>`);
      };
      const vanish = () => {
        if (!deck.length) deck = shuffle(items.map((_, i) => i).filter((i) => i !== hide));
        hide = deck.pop(); if (MIX) pos = shuffle(pos); phase = 'guess'; draw(); hud(); beep(true);
        say(NT > 1 ? `${TEAMS[turn][0]}：谁不见了？` : '谁不见了？🤔'); ctl(`<button class="go" data-a="show">${ic('bulb')}揭晓答案</button>`);
      };
      const look = () => {
        stop(); phase = 'look'; hide = -1; draw(); hud(); say('记住它们！👀'); ctl('');
        let s = SEC; const tick = () => { $('#cd').innerHTML = `<span class="cd pop">${s}</span>`; }; tick();
        timer = setInterval(() => { s--; if (s <= 0) { stop(); vanish(); } else tick(); }, 1000);
      };
      const reveal = () => {
        phase = 'show'; draw(); hud(); sound(items[hide]); say(`是 ${label(items[hide])}！`);
        ctl(NT > 1 ? `<button class="go yes" data-a="yes">${ic('check')}答对了 +1</button><button class="go no" data-a="no">${ic('x')}没答对</button>`
          : `<button class="go" data-a="next">${ic('arrow-right')}下一轮</button>`);
      };
      const next = (ok) => {
        if (NT > 1) {
          if (ok) { sc[turn]++; beep(true); }
          round++; turn = (turn + 1) % NT;
          if (round >= ROUNDS()) { phase = 'end'; hud(); ctl(''); say(''); return $('.stagebox', r).insertAdjacentHTML('beforeend', winBox(winner(NT, sc))); }
        }
        look();
      };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = rangeHit(r, b, 'goneR'); return start(); }
        if (b.dataset.opt) {
          const v = optHit(r, b), o = b.dataset.opt; store.set('gone' + o, v);
          if (o === 'M') { M = v; $('#gr').hidden = v !== 'syl'; } if (o === 'N') N = v; if (o === 'S') SEC = v; if (o === 'X') { MIX = v; return; } if (o === 'T') NT = v;
          return start();
        }
        if (b.id === 'again') return start();
        if (b.dataset.a === 'look') return look();
        if (b.dataset.a === 'show') return reveal();
        if (b.dataset.a === 'next') return next(false);
        if (b.dataset.a === 'yes') return next(true);
        if (b.dataset.a === 'no') return next(false);
        if (b.dataset.ix != null && phase !== 'look') sound(items[+b.dataset.ix]);
      });
      start();
      return stop;
    },
  };

  /* ---------- 拼音飞行棋：掷骰子，停在哪格读哪格 ---------- */
  const FLY_SPECIAL = { 18: { 5: 'star', 11: 'wind' }, 24: { 5: 'star', 10: 'wind', 15: 'star', 19: 'wind' } };
  const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
  const dice = (n) => `<div class="dice">${Array.from({ length: 9 }, (_, i) => `<i class="${PIPS[n] && PIPS[n].includes(i) ? 'on' : ''}"></i>`).join('')}</div>`;
  GAMES.fly = {
    html: () => `${conf(rangeBar(store.get('flyR', 'all'), true),
      optSeg('队伍', 'T', [[2, '2 队'], [3, '3 队'], [4, '4 队']], store.get('flyT', 3)),
      optSeg('跑道', 'L', [[18, '短 · 18 格'], [24, '长 · 24 格']], store.get('flyL', 18)))}
      <div class="gplay"><div class="stagebox"><div class="fboard" id="board"></div></div>
        <aside class="gside"><div class="team-score col" id="ts"></div><div class="gpanel" id="fp"></div><div class="msg" id="msg"></div></aside></div>`,
    mount(r) {
      let range = store.get('flyR', 'all'), NT = store.get('flyT', 3), L = store.get('flyL', 18);
      let cells = [], at = [], turn = 0, from = 0, phase = 'roll', busy = false, alive = true;
      const SP = () => FLY_SPECIAL[L] || {};
      const say = (t) => { $('#msg').textContent = t; };
      const place = (i) => { const c = L / 3, row = Math.floor(i / c), col = row % 2 ? c - 1 - (i % c) : i % c; return `grid-row:${row + 1};grid-column:${col + 1}`; };
      const draw = () => {
        const bd = $('#board'); bd.style.setProperty('--cols', L / 3);
        bd.innerHTML = cells.map((c, i) => {
          const s = SP()[i], toks = at.map((p, t) => (p === i ? `<span class="tok ${t === turn ? 'me' : ''}" style="--c:${TEAMS[t][1]}">${ic('plane')}</span>` : '')).join('');
          const face = i === 0 ? `<b>${ic('plane-departure')}</b><small>起点</small>` : i === L - 1 ? '<b>🏁</b><small>终点</small>'
            : s === 'star' ? '<b>⭐</b><small>前进 2 格</small>' : s === 'wind' ? '<b>🌪️</b><small>后退 2 格</small>' : `<span class="py">${show(...c)}</span>`;
          return `<div class="fcell ${i === 0 ? 'start' : ''} ${i === L - 1 ? 'goal' : ''} ${s || ''} ${phase === 'read' && at[turn] === i ? 'cur' : ''}" style="${place(i)}">
            ${face}<span class="n">${i > 0 && i < L - 1 ? i : ''}</span><div class="toks">${toks}</div></div>`;
        }).join('');
        $('#ts').innerHTML = TEAMS.slice(0, NT).map((t, i) => `<span class="tsc ${i === turn && phase !== 'end' ? 'on' : ''}" style="--c:${t[1]}">${ic('plane')} ${t[0]}<b>${at[i]}<small>格</small></b></span>`).join('');
      };
      const panelRoll = () => { phase = 'roll'; busy = false; $('#fp').innerHTML = `${dice(0)}<button class="go big" data-a="roll">${ic('dice-5')}掷骰子</button><p class="muted small">也可以按空格键</p>`; say(`${TEAMS[turn][0]}掷骰子！`); draw(); };
      const wait = (ms) => new Promise((ok) => setTimeout(ok, ms));
      const walk = async (to) => { const d = to > at[turn] ? 1 : -1; while (alive && at[turn] !== to) { at[turn] += d; draw(); await wait(230); } };
      const roll = async () => {
        if (busy || phase !== 'roll') return; busy = true; phase = 'move';
        const box = $('#fp'); let n = 1;
        for (let k = 0; k < 9; k++) { n = 1 + Math.floor(Math.random() * 6); box.innerHTML = `${dice(n)}<p class="muted small">…</p>`; await wait(70); }
        box.innerHTML = `${dice(n)}<p class="dnum">${n} 点</p>`; beep(true); from = at[turn]; await wait(400);
        await walk(Math.min(at[turn] + n, L - 1)); if (!alive) return;
        if (at[turn] >= L - 1) return win();
        const s = SP()[at[turn]];
        if (s) { say(s === 'star' ? '⭐ 幸运星！再前进 2 格' : '🌪️ 大风来了！后退 2 格'); await wait(900); await walk(at[turn] + (s === 'star' ? 2 : -2)); if (!alive) return; if (at[turn] >= L - 1) return win(); }
        phase = 'read'; draw(); $('#fp').innerHTML = judgeBox(...cells[at[turn]], `${TEAMS[turn][0]}读一读`); say('先读出来，老师再判断'); busy = false;
      };
      const nextTurn = () => { turn = (turn + 1) % NT; panelRoll(); };
      const win = () => { phase = 'end'; draw(); $('#fp').innerHTML = ''; say(''); beep(true); $('.stagebox', r).insertAdjacentHTML('beforeend', winBox(`${TEAMS[turn][0]}先飞到终点，赢啦！🏆`)); };
      const start = () => {
        $('.gwin', r)?.remove(); const P = pool(range, true); turn = 0; at = Array(NT).fill(0);
        if (P.length < 4) { cells = []; draw(); $('#fp').innerHTML = ''; return say('这一组还没有足够的老师录音'); }
        const syl = cycle(P, L); cells = syl.map((c, i) => (i === 0 || i === L - 1 || SP()[i] ? null : c));
        panelRoll();
      };
      r.addEventListener('click', async (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = rangeHit(r, b, 'flyR'); return start(); }
        if (b.dataset.opt) { const v = optHit(r, b), o = b.dataset.opt; store.set('fly' + o, v); if (o === 'T') NT = v; if (o === 'L') L = v; return start(); }
        if (b.id === 'again') return start();
        if (b.dataset.a === 'roll') return roll();
        if (phase !== 'read' || busy) return;
        const c = cells[at[turn]];
        if (b.dataset.j === 'ear') return recSyl(...c);
        if (b.dataset.j === 'yes') { busy = true; beep(true); setTimeout(() => recSyl(...c), 300); say('读对了！停在这里 ✈️'); await wait(1500); if (alive) nextTurn(); }
        if (b.dataset.j === 'no') {
          busy = true; recSyl(...c); say('听一听老师怎么读，飞回原来的位置'); await wait(1600); if (!alive) return;
          phase = 'move'; await walk(from); if (alive) nextTurn();
        }
      });
      keys(r, (e) => { if (e.key === ' ' && phase === 'roll') { e.preventDefault(); roll(); } });
      start();
      return () => { alive = false; };
    },
  };

  /* ---------- 拼音翻翻乐：翻两张，找出一对 ---------- */
  GAMES.memo = {
    html: () => `${conf(rangeBar(store.get('memoR', 'all'), true),
      optSeg('玩法', 'M', [['pic', '拼音配图片'], ['same', '找相同']], store.get('memoM', 'pic')),
      optSeg('几对', 'N', [[6, '6 对'], [8, '8 对']], store.get('memoN', 6)),
      optSeg('队伍', 'T', [[1, '个人'], [2, '2 队'], [3, '3 队'], [4, '4 队']], store.get('memoT', 2)))}
      <div class="ghud"><div class="team-score" id="ts"></div><div class="round" id="rd"></div></div>
      <div class="stagebox"><div class="mgrid" id="grid"></div></div><div class="msg big" id="msg"></div>`,
    mount(r) {
      let range = store.get('memoR', 'all'), M = store.get('memoM', 'pic'), N = store.get('memoN', 6), NT = store.get('memoT', 2);
      let cards = [], open = [], done = [], sc = [], turn = 0, lock = false, tries = 0, pairs = 0;
      const say = (t) => { $('#msg').textContent = t; };
      const found = () => done.filter(Boolean).length / 2;
      const hud = () => {
        $('#ts').innerHTML = NT > 1 ? scoreBoard(NT, sc, turn) : `<span class="tsc on" style="--c:var(--sage-d)">${ic('cards')} 找到 <b>${found()}</b> / ${pairs} 对</span>`;
        $('#rd').textContent = `翻了 ${tries} 次`;
      };
      const face = (c) => {
        if (c.kind === 's') return `<span class="py">${show(...c.p)}</span>`;
        const ex = EX[c.p[0] + c.p[1]]; return `<span class="mpic">${pic(ex[1])}</span><small>${esc(ex[0])}</small>`;
      };
      const draw = () => {
        const g = $('#grid'); g.style.setProperty('--cols', 4);
        g.innerHTML = cards.map((c, i) => `<button class="mcard ${open.includes(i) || done[i] ? 'open' : ''} ${done[i] ? 'done' : ''} ${c.kind === 'p' ? 'pc2' : ''}" data-i="${i}" ${done[i] ? `style="--c:${NT > 1 ? TEAMS[done[i] - 1][1] : 'var(--sage-d)'}"` : ''}>
          <span class="mback"><svg viewBox="0 0 240 160"><use href="#yy"/></svg></span><span class="mfront">${face(c)}</span></button>`).join('');
      };
      const start = () => {
        $('.gwin', r)?.remove(); let P = shuffle(pool(range, true));
        if (M === 'pic') { const seen = new Set(); P = P.filter(([k, t]) => { const ex = EX[k + t]; if (!ex || seen.has(ex[1])) return false; seen.add(ex[1]); return true; }); }
        open = []; done = []; sc = Array(NT).fill(0); turn = 0; lock = false; tries = 0;
        if (P.length < 3) { cards = []; pairs = 0; draw(); hud(); return say(M === 'pic' ? '这一组有图片的录音还不够，试试“找相同”' : '这一组还没有足够的老师录音'); }
        const ps = P.slice(0, N); pairs = ps.length;
        cards = shuffle(ps.flatMap((p, id) => [{ id, p, kind: 's' }, { id, p, kind: M === 'pic' ? 'p' : 's' }]));
        draw(); hud(); say(NT > 1 ? `${TEAMS[0][0]}先翻两张` : '翻开两张，找一样的一对');
      };
      const sound = (c) => { const key = c.p[0] + c.p[1]; if (c.kind === 'p' && REC.has('w-' + key)) playFile('w-' + key, () => {}); else recSyl(...c.p); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = rangeHit(r, b, 'memoR'); return start(); }
        if (b.dataset.opt) { const v = optHit(r, b), o = b.dataset.opt; store.set('memo' + o, v); if (o === 'M') M = v; if (o === 'N') N = v; if (o === 'T') NT = v; return start(); }
        if (b.id === 'again') return start();
        if (!b.classList.contains('mcard') || lock) return;
        const i = +b.dataset.i; if (open.includes(i) || done[i]) return;
        open.push(i); b.classList.add('open'); sound(cards[i]);
        if (open.length < 2) return;
        tries++; const [x, y] = open; lock = true;
        if (cards[x].id === cards[y].id) {
          done[x] = done[y] = turn + 1; sc[turn]++; open = [];
          setTimeout(() => {
            beep(true); draw(); hud(); lock = false;
            if (found() >= pairs) { say(''); return $('.stagebox', r).insertAdjacentHTML('beforeend', winBox(NT > 1 ? winner(NT, sc) : `翻了 ${tries} 次，找到全部 ${pairs} 对！🏆`)); }
            say(NT > 1 ? `${TEAMS[turn][0]}找到一对！⭐ 再翻一次` : '找到一对！⭐');
          }, 700);
        } else {
          hud(); say('不一样，记住它们在哪里 👀');
          setTimeout(() => {
            open = []; lock = false; if (NT > 1) turn = (turn + 1) % NT;
            $$('.mcard', r).forEach((m) => { if (!done[+m.dataset.i]) m.classList.remove('open'); });
            hud(); say(NT > 1 ? `轮到${TEAMS[turn][0]}` : '再翻两张');
          }, 1700);
        }
      });
      start();
    },
  };

  /* ---------- 拼音连三子：读对了占一格，先连成三个的队赢 ---------- */
  GAMES.line = {
    html: () => `${conf(rangeBar(store.get('lineR', 'all'), true),
      optSeg('队伍', 'T', [[2, '2 队'], [3, '3 队'], [4, '4 队']], store.get('lineT', 2)),
      optSeg('棋盘', 'S', [[4, '4 × 4'], [5, '5 × 5']], store.get('lineS', 4)))}
      <div class="gplay"><div class="stagebox"><div class="lboard" id="board"></div></div>
        <aside class="gside"><div class="team-score col" id="ts"></div><div class="gpanel" id="fp"></div><div class="msg" id="msg"></div></aside></div>`,
    mount(r) {
      let range = store.get('lineR', 'all'), NT = store.get('lineT', 2), S = store.get('lineS', 4);
      let cells = [], own = [], sel = -1, turn = 0, busy = false, over = false, wl = [];
      const say = (t) => { $('#msg').textContent = t; };
      const counts = () => TEAMS.slice(0, NT).map((_, t) => own.filter((o) => o === t + 1).length);
      const draw = () => {
        const bd = $('#board'); bd.style.setProperty('--cols', S);
        bd.innerHTML = cells.map((c, i) => `<button class="lcell ${own[i] ? 'own' : ''} ${i === sel ? 'sel' : ''} ${wl.includes(i) ? 'win' : ''}" data-i="${i}" ${own[i] ? `style="--c:${TEAMS[own[i] - 1][1]}"` : ''}>
          <span class="py">${show(...c)}</span>${own[i] ? `<em>${TEAMS[own[i] - 1][0]}</em>` : ''}</button>`).join('');
        $('#ts').innerHTML = scoreBoard(NT, counts(), over ? -1 : turn);
      };
      const panel = () => { $('#fp').innerHTML = sel < 0 ? `<div class="jq big"><span class="tdot" style="--c:${TEAMS[turn][1]}"></span>${TEAMS[turn][0]}<br>选一格，读出来</div>` : judgeBox(...cells[sel], `${TEAMS[turn][0]}读一读`); };
      const line = (i) => {
        const t = own[i], x = i % S, y = Math.floor(i / S);
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
          const got = [i];
          for (const s of [1, -1]) { let k = 1; for (;;) { const nx = x + dx * k * s, ny = y + dy * k * s; if (nx < 0 || ny < 0 || nx >= S || ny >= S || own[ny * S + nx] !== t) break; got.push(ny * S + nx); k++; } }
          if (got.length >= 3) return got;
        }
        return null;
      };
      const start = () => {
        $('.gwin', r)?.remove(); const P = pool(range, true); own = []; sel = -1; turn = 0; busy = false; over = false; wl = [];
        if (P.length < 4) { cells = []; draw(); $('#fp').innerHTML = ''; return say('这一组还没有足够的老师录音'); }
        cells = cycle(P, S * S); draw(); panel(); say('');
      };
      const next = () => { sel = -1; turn = (turn + 1) % NT; busy = false; draw(); panel(); say(''); };
      const end = (txt) => { over = true; draw(); $('#fp').innerHTML = ''; say(''); beep(true); $('.stagebox', r).insertAdjacentHTML('beforeend', winBox(txt)); };
      r.addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        if (b.dataset.range) { range = rangeHit(r, b, 'lineR'); return start(); }
        if (b.dataset.opt) { const v = optHit(r, b), o = b.dataset.opt; store.set('line' + o, v); if (o === 'T') NT = v; if (o === 'S') S = v; return start(); }
        if (b.id === 'again') return start();
        if (over || busy) return;
        if (b.classList.contains('lcell')) { const i = +b.dataset.i; if (own[i]) return; sel = i; draw(); panel(); return; }
        if (sel < 0) return;
        const c = cells[sel];
        if (b.dataset.j === 'ear') return recSyl(...c);
        if (b.dataset.j === 'yes') {
          busy = true; own[sel] = turn + 1; beep(true); setTimeout(() => recSyl(...c), 300);
          const got = line(sel); sel = -1; draw();
          if (got) { wl = got; return setTimeout(() => end(`${TEAMS[turn][0]}连成三个，赢啦！🏆`), 900); }
          if (own.filter(Boolean).length >= cells.length) return setTimeout(() => end(`格子占满啦！${winner(NT, counts())}`), 900);
          say(`${TEAMS[turn][0]}占下一格 ⭐`); setTimeout(next, 1300);
        }
        if (b.dataset.j === 'no') { busy = true; recSyl(...c); say('听老师读一遍，这一格先空着'); setTimeout(next, 1800); }
      });
      start();
    },
  };

  /* ---------- 游戏页：分类卡片 + 每个游戏的顶栏 ---------- */
  const GAME_CATS = [
    ['team', '团队对抗', 'Holdkamp', 'terra', 'swords', '分 2–4 队比赛，适合全班一起玩'],
    ['listen', '听音选择', 'Lyt og vælg', 'mustard', 'ear', '听老师的录音，选出对的拼音'],
    ['memory', '记忆游戏', 'Hukommelse', 'blue', 'brain', '看一看、记一记，第三节课也不累'],
    ['spell', '拼一拼', 'Stav', 'sage', 'puzzle', '声母和韵母碰一碰，认识声母车站'],
  ];
  const GAME_LIST = [
    { id: 'poison', cat: 'team', icon: 'flask', name: '拼音毒药', fresh: 1, tags: ['2–4 队'], desc: '先读再翻，小心翻到毒药！', rule: '读出卡片上的拼音再点开：安全卡 +1，毒药 −2。' },
    { id: 'fly', cat: 'team', icon: 'plane', name: '拼音飞行棋', fresh: 1, tags: ['2–4 队'], desc: '掷骰子往前飞，停在哪格读哪格。', rule: '掷骰子前进，读对了留下，没读对飞回原来的位置。先到终点的队赢。' },
    { id: 'line', cat: 'team', icon: 'grid-dots', name: '拼音连三子', fresh: 1, tags: ['2–4 队'], desc: '读对了占一格，连成三个就赢。', rule: '每队选一格读出来，读对了占下这一格。横、竖、斜连成三个就赢。' },
    { id: 'mole', cat: 'listen', icon: 'target-arrow', name: '拼音打地鼠', tags: ['2–4 队'], desc: '听老师读，打中对的那只地鼠。', rule: '听录音，点出读的那个拼音。每队轮流，打中得 1 分。' },
    { id: 'listen', cat: 'listen', icon: 'ear', name: '听音找飞机', tags: ['个人 / 2–4 队', '比一比'], desc: '听一听，选对了飞机往前飞。', rule: '听录音选拼音，选对了飞机前进一格。可以选“比一比”练易混音。' },
    { id: 'gone', cat: 'memory', icon: 'eye-off', name: '拼音不见了', fresh: 1, tags: ['全班 / 2–4 队'], desc: '记住卡片，猜猜哪一张不见了。', rule: '先记住所有卡片，倒数结束后有一张会消失，大家猜一猜是哪一张。' },
    { id: 'memo', cat: 'memory', icon: 'cards', name: '拼音翻翻乐', fresh: 1, tags: ['个人 / 2–4 队'], desc: '翻两张牌，找出拼音和图片的一对。', rule: '每次翻两张，一样的一对就得分，还能再翻一次；不一样就翻回去，换下一队。' },
    { id: 'peng', cat: 'spell', icon: 'puzzle', name: '碰一碰', tags: ['老师演示'], desc: '声母加韵母，看看能不能拼。', rule: '点一个声母和一个韵母，按“碰！”看能不能拼在一起。' },
    { id: 'post', cat: 'spell', icon: 'mail', name: '拼音小邮差', tags: ['个人'], desc: '看拼音和图，把信送到声母车站。', rule: '看拼音和图片，把信送到它的声母车站。' },
  ];
  const catOf = (g) => GAME_CATS.find((c) => c[0] === g.cat);
  V.games = (sub) => {
    if (!GAMES[sub]) {
      const tile = (g) => { const c = catOf(g); return `<a class="gtile k-${c[3]}" href="#games/${g.id}" data-cat="${g.cat}">
        <div class="gt-top"><span class="gico">${ic(g.icon)}</span><span class="gt-cat">${c[1]}</span>${g.fresh ? '<span class="gnew">NEW</span>' : ''}</div>
        <h3>${g.name}</h3><p>${g.desc}</p><div class="gt-foot"><div class="gt-tags">${g.tags.map((t) => `<span>${ic('users')}${t}</span>`).join('')}</div><span class="gt-go">${ic('arrow-right')}</span></div></a>`; };
      return `<section><div class="sec"><h2>拼音游戏</h2><small>${GAME_LIST.length} 个游戏 · 游戏里只播放老师的录音 · Lyt, læs og leg</small></div>
        <div class="gfilter"><button class="sel" data-cat="">${ic('layout-grid')}全部 <b>${GAME_LIST.length}</b></button>${GAME_CATS.map((c) => `<button class="k-${c[3]}" data-cat="${c[0]}" title="${c[5]}">${ic(c[4])}${c[1]} <b>${GAME_LIST.filter((g) => g.cat === c[0]).length}</b></button>`).join('')}</div>
        <div class="ghub">${GAME_LIST.map(tile).join('')}</div></section>`;
    }
    const g = GAME_LIST.find((x) => x.id === sub), c = catOf(g);
    return `<section class="card tool-page game-page"><div class="gbar">
      <a class="gback" href="#games">${ic('layout-grid')}<span>全部游戏</span></a>
      <div class="gname k-${c[3]}"><span class="gico">${ic(g.icon)}</span><div><h2>${g.name}</h2><p>${g.rule}</p></div></div>
      <div class="gjump" aria-label="换一个游戏">${GAME_LIST.map((x) => `<a href="#games/${x.id}" class="k-${catOf(x)[3]} ${x.id === sub ? 'on' : ''}" title="${x.name}">${ic(x.icon)}</a>`).join('')}</div>
      <button class="fs" data-fs>${ic('maximize')}<span>全屏</span></button></div><div class="tool-body">${GAMES[sub].html()}</div></section>`;
  };
  V.games.mount = (r, sub) => {
    fsBind(r);
    if (!GAMES[sub]) {
      return r.addEventListener('click', (e) => { const b = e.target.closest('.gfilter button'); if (!b) return;
        $$('.gfilter button', r).forEach((x) => x.classList.toggle('sel', x === b));
        $$('.gtile', r).forEach((t) => { t.hidden = !!b.dataset.cat && t.dataset.cat !== b.dataset.cat; }); });
    }
    r.addEventListener('toggle', (e) => { if (e.target.classList && e.target.classList.contains('gconf')) store.set('confOpen', e.target.open); }, true);
    return GAMES[sub].mount(r);
  };

  /* ---------- 汉字卡（笔顺动画：Hanzi Writer，MIT 授权） ---------- */
  /* 库和字的数据放在 lib/ 里；lib/hanzi-data 里没有的字，自动从网上取 */
  const HW_JS = 'lib/hanzi-writer.min.js';
  const HW_DATA = (c) => fetch(`lib/hanzi-data/${encodeURIComponent(c)}.json`).then((x) => { if (!x.ok) throw 0; return x.json(); })
    .catch(() => fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${encodeURIComponent(c)}.json`).then((x) => x.json()));
  let hwLoad = null;
  const loadHW = () => hwLoad || (hwLoad = new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = HW_JS; sc.onload = ok; sc.onerror = () => { hwLoad = null; no(); }; document.head.appendChild(sc); }));
  const hzList = () => {
    const seen = [], when = {}; WEEKS.forEach((w) => { if (w.hanzi && w.date <= openDay && !seen.includes(w.hanzi)) { seen.push(w.hanzi); if (w.date > today) when[w.hanzi] = fmt(w.date); } });
    const up = nextWeek.hanzi && nextWeek.date > openDay && !seen.includes(nextWeek.hanzi) ? nextWeek.hanzi : null;
    if (up) when[up] = '下一次课';
    return { seen, up, when };
  };
  V.hanzi = (sub) => {
    const { seen, up, when } = hzList(); const all = up ? [...seen, up] : seen;
    let c = decodeURIComponent(sub || ''); if (!all.includes(c)) c = seen.filter((x) => !when[x]).pop() || seen[0] || up;
    if (!c) return '<section class="card"><h2>汉字</h2><p class="muted">还没有学汉字</p></section>';
    const info = HANZI[c] || ['', []], pair = (window.HANZI_PAIRS || []).find((pr) => pr.includes(c));
    return `<section class="card hz-page"><div class="head-row"><h2>汉字卡</h2><small class="muted">每周一个字 · Ugens tegn</small></div>
      <div class="ranges">${all.map((x) => `<a class="rg hzc ${x === c ? 'sel' : ''}" href="#hanzi/${encodeURIComponent(x)}">${x}${when[x] ? `<small>${when[x]}</small>` : ''}</a>`).join('')}</div>
      <div class="hz-main"><div class="tzg"><svg viewBox="0 0 100 100" aria-hidden="true"><rect x="1" y="1" width="98" height="98"/><path d="M50 1V99M1 50H99M1 1L99 99M99 1L1 99"/></svg><div id="hw"></div><div class="hz-fb" id="hzfb">${c}</div></div>
        <div class="hz-side"><div class="hz-py py">${info[0]}</div>
          <ol class="strokes" id="sl">${info[1].map((n, i) => `<li data-i="${i}"><b>${i + 1}</b>${n}</li>`).join('')}</ol>
          <div class="cm-btns"><button class="go" id="hplay">${ic('player-play')}看笔顺</button><button class="go ghost" id="hstep">${ic('hand-finger')}一笔一笔</button>
            <button class="go ghost" id="hquiz">${ic('pencil')}我来写</button><button class="go ghost" id="hsay">${ic('volume')}读一读</button></div>
          <p class="muted" id="hmsg">${info[1].length ? `一共 ${info[1].length} 笔` : ''}</p>
          ${pair ? `<div class="hz-pair">${ic('arrows-left-right')} 比一比：${pair.map((x) => `<a href="#hanzi/${encodeURIComponent(x)}" class="${x === c ? 'on' : ''}">${x} <span class="py">${(HANZI[x] || [''])[0]}</span></a>`).join('')}</div>` : ''}
        </div></div></section>`;
  };
  V.hanzi.mount = (r, sub) => {
    const { seen, up, when } = hzList(); const all = up ? [...seen, up] : seen;
    let c = decodeURIComponent(sub || ''); if (!all.includes(c)) c = seen.filter((x) => !when[x]).pop() || seen[0] || up; if (!c) return;
    const n = ((HANZI[c] || [])[1] || []).length; let w = null, step = 0, alive = true;
    const mark = (i) => $$('#sl li', r).forEach((li) => { li.classList.toggle('on', +li.dataset.i === i); li.classList.toggle('done', +li.dataset.i < i); });
    const msg = (t) => { $('#hmsg').textContent = t; };
    loadHW().then(() => {
      if (!alive) return;
      const box = $('#hw'), size = box.clientWidth || 280;
      w = HanziWriter.create(box, c, { width: size, height: size, padding: size * 0.08, showOutline: true, strokeColor: '#1F2A44', outlineColor: '#E4DED3',
        highlightColor: '#D9734E', drawingColor: '#D9734E', strokeAnimationSpeed: 0.8, delayBetweenStrokes: 450,
        charDataLoader: (ch, onLoad, onErr) => HW_DATA(ch).then(onLoad).catch(onErr),
        onLoadCharDataSuccess: () => { $('#hzfb').style.display = 'none'; }, onLoadCharDataError: () => { w = null; msg('笔顺动画加载不了，先看字和笔画名称'); } });
    }).catch(() => msg('笔顺动画加载不了，先看字和笔画名称'));
    r.addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.id === 'hsay') return HANZI[c] ? speak(c) : null;
      if (!w) return toast('笔顺动画还没加载好');
      if (b.id === 'hplay') { step = 0; w.cancelQuiz(); w.hideCharacter(); let i = 0; mark(0);
        w.animateCharacter({ onComplete: () => { mark(n); msg('写完啦！'); } });
        const tick = setInterval(() => { i++; if (i >= n || !alive) return clearInterval(tick); mark(i); }, 1250); msg('看老师写'); }
      if (b.id === 'hstep') { w.cancelQuiz(); if (step === 0 || step >= n) { w.hideCharacter(); step = 0; }
        mark(step); const name = (HANZI[c][1] || [])[step] || ''; w.animateStroke(step); step++;
        msg(step >= n ? `第 ${step} 笔：${name}。写完啦！再点一次从头开始` : `第 ${step} 笔：${name}`); }
      if (b.id === 'hquiz') { step = 0; mark(0); w.showOutline(); w.hideCharacter();
        w.quiz({ onCorrectStroke: (d) => { mark(d.strokeNum + 1); msg(`第 ${d.strokeNum + 1} 笔写对了！`); },
          onMistake: () => msg('不对哦，看看橙色的提示再写'), onComplete: () => { beep(true); mark(n); msg('写对啦！⭐'); } });
        msg('用手指或鼠标在田字格里写'); }
    });
    return () => { alive = false; };
  };

  /* ---------- 家长专区 ---------- */
  const fileList = (files) => (files ? `<div class="dl">${files.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${ic('file-type-pdf')}${t}</a>`).join('')}</div>` : '');
  V.parents = () => `<section><div class="sec"><h2>每周课程</h2><small>这周学了什么 · 在家怎么练 · Ugens pinyin</small></div>
    <div class="card tips"><h3>${ic('bulb')} 在家陪练小贴士</h3><ul>
      <li>每天 5–10 分钟，比一周一次练很久更有效。</li>
      <li>拼读口诀：<b>前音轻短后音重，两音相连猛一碰</b>。先拆（g—ē），再拼（gē），最后说一个词（鸽子）。</li>
      <li>孩子能听懂中文是很大的优势：拼出一个音节，就问“这是哪个词里的音？”</li>
      <li>可以用 <a href="#chart">拼音表</a> 和 <a href="#games/listen">听音找飞机</a> 在家练。游戏里只播放老师的录音；拼音表里还没有录音的音节由浏览器朗读，个别声调可能不准，以老师课上读音为准。</li></ul></div>
    ${WEEKS.slice().reverse().map((w) => `<article class="card week ${w === nextWeek ? 'now' : ''}">
      <div class="wd">${fmt(w.date)}${w === nextWeek ? ' <span class="badge">下一次课</span>' : ''}${w.hanzi ? ` <a class="hz" href="#hanzi/${encodeURIComponent(w.hanzi)}">汉字 ${w.hanzi}</a>` : ''}</div>
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
