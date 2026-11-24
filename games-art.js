/* 游戏封面：每个游戏一张小插画（SVG，北欧奶油配色）。
   想换成自己的图片：把图片放进 img/games/，然后把对应的一行改成
   poison: '<img src="img/games/poison.png" alt="">', */
(function () {
  const C = { terra: '#D9734E', terraT: '#F6E2D8', terraD: '#B9573A', mus: '#E3B23C', musT: '#F7EBCB', musD: '#A67C14',
    blue: '#7FA3C7', blueT: '#E3ECF5', blueD: '#4E7397', sage: '#9DB5A0', sageT: '#E3EBE2', sageD: '#5F7F65',
    ink: '#1F2A44', paper: '#F6F1E9', lilac: '#A58CB8', lilacT: '#EEE7F3', lilacD: '#76598C', w: '#FFFFFF' };
  const PY = "font-family:Andika,ui-rounded,sans-serif";
  const KAI = "font-family:'Kaiti SC',STKaiti,KaiTi,serif";
  const svg = (bg, body) => `<svg viewBox="0 0 320 160" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="320" height="160" fill="${bg}"/>${body}</svg>`;
  const card = (x, y, w, h, txt, o = {}) => `<g transform="translate(${x} ${y}) rotate(${o.r || 0})"><rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="12" fill="${o.fill || C.w}" stroke="${o.stroke || '#E7DFD3'}" stroke-width="2"/>
    ${txt ? `<text x="0" y="${o.dy || 10}" text-anchor="middle" style="${o.font || PY};font-size:${o.size || 28}px" fill="${o.color || C.ink}">${txt}</text>` : ''}</g>`;
  const plane = (x, y, s, r = -8) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(${s})"><use href="#yy" width="240" height="160" x="-120" y="-80"/></g>`;
  const tzg = (x, y, s, col) => `<g transform="translate(${x} ${y})"><rect width="${s}" height="${s}" fill="${C.w}" stroke="${col}" stroke-width="2"/>
    <path d="M${s / 2} 0V${s}M0 ${s / 2}H${s}M0 0L${s} ${s}M${s} 0L0 ${s}" stroke="${col}" stroke-width="1" stroke-dasharray="3 3" fill="none" opacity=".6"/></g>`;
  const spark = (x, y, s, col) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 -10 L2.5 -2.5 L10 0 L2.5 2.5 L0 10 L-2.5 2.5 L-10 0 L-2.5 -2.5Z" fill="${col}"/>`;

  window.GAME_ART = {
    poison: svg(C.terraT, `
      ${card(70, 60, 74, 50, 'mā')}${card(150, 52, 74, 50, 'bō', { r: -4 })}${card(80, 118, 74, 50, 'tù', { r: 3, fill: '#EAF1E8', stroke: C.sageD })}
      <g transform="translate(238 92)"><rect x="-12" y="-62" width="24" height="18" rx="4" fill="${C.musD}"/>
        <path d="M-14 -46 H14 V-30 Q40 -14 40 14 Q40 52 0 52 Q-40 52 -40 14 Q-40 -14 -14 -30Z" fill="${C.lilac}"/>
        <path d="M-37 14 Q-37 49 0 49 Q37 49 37 14 Q20 24 0 14 Q-20 4 -37 14Z" fill="${C.lilacD}"/>
        <circle cx="-6" cy="6" r="13" fill="${C.w}"/><circle cx="-11" cy="4" r="3.4" fill="${C.ink}"/><circle cx="-1" cy="4" r="3.4" fill="${C.ink}"/>
        <rect x="-11" y="12" width="10" height="4" rx="1.5" fill="${C.ink}"/>
        <circle cx="22" cy="-8" r="5" fill="${C.w}" opacity=".7"/><circle cx="30" cy="-30" r="4" fill="${C.lilac}"/><circle cx="20" cy="-50" r="6" fill="${C.lilac}" opacity=".8"/></g>`),
    fly: svg(C.sageT, `
      <path d="M30 128 C90 128 90 92 150 92 S220 56 290 52" fill="none" stroke="${C.w}" stroke-width="18" stroke-linecap="round"/>
      <path d="M30 128 C90 128 90 92 150 92 S220 56 290 52" fill="none" stroke="${C.sage}" stroke-width="2" stroke-dasharray="2 12" stroke-linecap="round"/>
      <circle cx="30" cy="128" r="12" fill="${C.blue}"/><text x="284" y="44" style="font-size:26px">🏁</text>
      ${plane(160, 62, 0.42)}
      <g transform="translate(62 50) rotate(-12)"><rect x="-26" y="-26" width="52" height="52" rx="12" fill="${C.w}" stroke="#E7DFD3" stroke-width="2"/>
        <circle cx="-12" cy="-12" r="5" fill="${C.ink}"/><circle cx="12" cy="-12" r="5" fill="${C.ink}"/><circle cx="0" cy="0" r="5" fill="${C.terra}"/><circle cx="-12" cy="12" r="5" fill="${C.ink}"/><circle cx="12" cy="12" r="5" fill="${C.ink}"/></g>
      ${spark(246, 118, 1.1, C.mus)}`),
    line: svg(C.blueT, `
      <rect x="92" y="14" width="136" height="136" rx="16" fill="${C.w}" opacity=".7"/>
      ${[0, 1, 2].map((r) => [0, 1, 2].map((c) => `<rect x="${100 + c * 42}" y="${22 + r * 42}" width="36" height="36" rx="9" fill="${r === c ? C.terra : (r + c) % 3 === 1 && r !== c ? C.mus : C.w}" stroke="#D9CFC0" stroke-width="1.5"/>`).join('')).join('')}
      <path d="M118 40 L202 124" stroke="${C.ink}" stroke-width="5" stroke-linecap="round" opacity=".85"/>
      ${spark(254, 40, 1.2, C.mus)}${spark(66, 120, 0.9, C.terra)}${spark(262, 120, 0.7, C.blueD)}`),
    mole: svg(C.musT, `
      <ellipse cx="160" cy="138" rx="120" ry="16" fill="#B89B7A"/>
      <g transform="translate(160 96)"><ellipse cx="0" cy="10" rx="40" ry="38" fill="#C99A7A"/><ellipse cx="0" cy="20" rx="24" ry="22" fill="#F2DCC8"/>
        <circle cx="-14" cy="-4" r="5" fill="${C.ink}"/><circle cx="14" cy="-4" r="5" fill="${C.ink}"/><ellipse cx="0" cy="8" rx="8" ry="6" fill="${C.terraD}"/>
        <circle cx="-30" cy="-26" r="10" fill="#C99A7A"/><circle cx="30" cy="-26" r="10" fill="#C99A7A"/></g>
      ${card(64, 70, 64, 42, 'gē', { r: -6 })}${card(258, 70, 64, 42, 'kē', { r: 6 })}
      <path d="M232 22 l18 18 M250 22 l-18 18" stroke="${C.terra}" stroke-width="5" stroke-linecap="round"/>`),
    listen: svg(C.musT, `
      ${plane(108, 74, 0.5)}
      <path d="M200 52 Q214 74 200 96 M216 40 Q238 74 216 108 M232 28 Q262 74 232 120" fill="none" stroke="${C.musD}" stroke-width="5" stroke-linecap="round"/>
      ${card(282, 56, 54, 38, 'bā', { size: 22, dy: 8 })}${card(282, 108, 54, 38, 'pā', { size: 22, dy: 8, fill: '#EAF1E8', stroke: C.sageD })}`),
    gone: svg(C.blueT, `
      ${card(60, 58, 64, 46, 'b')}${card(134, 58, 64, 46, 'd')}${card(60, 116, 64, 46, 'p')}${card(208, 116, 64, 46, 'q')}
      <rect x="176" y="35" width="64" height="46" rx="12" fill="none" stroke="${C.blueD}" stroke-width="2.5" stroke-dasharray="6 5"/>
      <text x="208" y="70" text-anchor="middle" style="${PY};font-size:30px;font-weight:700" fill="${C.blueD}">?</text>
      ${card(134, 116, 64, 46, 'm')}
      <g transform="translate(276 62)"><circle r="24" fill="${C.w}" stroke="${C.ink}" stroke-width="5"/><path d="M17 17 L34 34" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><circle r="12" fill="${C.blueT}"/></g>`),
    memo: svg(C.blueT, `
      ${[[64, 80, -8], [128, 76, 4]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><rect x="-28" y="-38" width="56" height="76" rx="12" fill="${C.blueD}"/>
        ${[0, 1, 2, 3].map((i) => [0, 1, 2, 3, 4].map((j) => `<circle cx="${-18 + i * 12}" cy="${-28 + j * 14}" r="1.6" fill="${C.w}" opacity=".3"/>`).join('')).join('')}</g>`).join('')}
      <g transform="translate(196 80) rotate(-3)"><rect x="-28" y="-38" width="56" height="76" rx="12" fill="${C.w}" stroke="${C.sageD}" stroke-width="2.5"/><text x="0" y="10" text-anchor="middle" style="${PY};font-size:28px" fill="${C.ink}">gē</text></g>
      <g transform="translate(262 80) rotate(6)"><rect x="-28" y="-38" width="56" height="76" rx="12" fill="${C.w}" stroke="${C.sageD}" stroke-width="2.5"/>
        <ellipse cx="0" cy="4" rx="16" ry="12" fill="#BFC8D6"/><circle cx="12" cy="-8" r="9" fill="#BFC8D6"/><circle cx="14" cy="-9" r="2" fill="${C.ink}"/><path d="M20 -8 l7 2 -7 2Z" fill="${C.mus}"/></g>
      <path d="M222 30 q6 -14 12 0" fill="none" stroke="${C.terra}" stroke-width="4" stroke-linecap="round"/>${spark(229, 20, 0.8, C.mus)}`),
    peng: svg(C.sageT, `
      <g transform="translate(96 82) rotate(-6)"><rect x="-44" y="-36" width="80" height="72" rx="14" fill="${C.blueT}" stroke="${C.blueD}" stroke-width="2.5"/><circle cx="36" cy="0" r="12" fill="${C.blueT}" stroke="${C.blueD}" stroke-width="2.5"/><rect x="22" y="-12" width="14" height="24" fill="${C.blueT}"/>
        <text x="-6" y="13" text-anchor="middle" style="${PY};font-size:40px" fill="${C.blueD}">b</text></g>
      <g transform="translate(214 82) rotate(6)"><rect x="-36" y="-36" width="80" height="72" rx="14" fill="${C.terraT}" stroke="${C.terraD}" stroke-width="2.5"/><circle cx="-36" cy="0" r="12" fill="${C.sageT}" stroke="${C.terraD}" stroke-width="2.5"/>
        <text x="6" y="13" text-anchor="middle" style="${PY};font-size:40px" fill="${C.terraD}">a</text></g>
      ${spark(156, 30, 1.2, C.mus)}${spark(156, 134, 0.8, C.mus)}`),
    post: svg(C.sageT, `
      <g transform="translate(232 80)"><path d="M-48 -18 L0 -52 L48 -18Z" fill="${C.terra}"/><rect x="-40" y="-18" width="80" height="66" fill="${C.w}"/><rect x="-14" y="12" width="28" height="36" rx="4" fill="${C.sage}"/>
        <rect x="-30" y="-10" width="60" height="18" rx="4" fill="${C.ink}"/><text x="0" y="5" text-anchor="middle" style="${PY};font-size:14px" fill="${C.w}">b p m f</text></g>
      <g transform="translate(92 86) rotate(-10)"><rect x="-46" y="-30" width="92" height="60" rx="8" fill="${C.w}" stroke="#D9CFC0" stroke-width="2"/><path d="M-46 -30 L0 6 L46 -30" fill="none" stroke="#D9CFC0" stroke-width="2"/>
        <rect x="18" y="-24" width="20" height="24" rx="3" fill="${C.musT}" stroke="${C.mus}" stroke-width="2"/><text x="-12" y="24" text-anchor="middle" style="${PY};font-size:20px" fill="${C.terraD}">bā</text></g>
      <path d="M150 80 h26" stroke="${C.sageD}" stroke-width="4" stroke-dasharray="4 6" stroke-linecap="round"/>`),
    magic: svg(C.lilacT, `
      ${tzg(30, 34, 92, C.terra)}<text x="76" y="110" text-anchor="middle" style="${KAI};font-size:76px" fill="${C.ink}">人</text>
      <text x="146" y="92" text-anchor="middle" style="font-size:30px;font-weight:700" fill="${C.lilacD}">+</text>
      <rect x="166" y="64" width="26" height="40" rx="8" fill="${C.w}" stroke="${C.lilacD}" stroke-width="2"/><path d="M171 84 h16" stroke="${C.terra}" stroke-width="5" stroke-linecap="round"/>
      ${tzg(206, 34, 92, C.terra)}<text x="252" y="110" text-anchor="middle" style="${KAI};font-size:76px" fill="${C.ink}">大</text>
      <path d="M224 63 h56" stroke="${C.terra}" stroke-width="9" stroke-linecap="round" opacity=".9"/>
      ${spark(300, 30, 1.1, C.mus)}${spark(196, 140, 0.8, C.mus)}${spark(140, 40, 0.7, C.lilac)}`),
    xiang: svg(C.lilacT, `
      <g transform="translate(84 80)"><circle r="30" fill="${C.mus}"/>${[0, 45, 90, 135, 180, 225, 270, 315].map((a) => `<rect x="-3" y="-50" width="6" height="13" rx="3" fill="${C.mus}" transform="rotate(${a})"/>`).join('')}
        <circle cx="-9" cy="-4" r="3.5" fill="${C.ink}"/><circle cx="9" cy="-4" r="3.5" fill="${C.ink}"/><path d="M-9 8 q9 8 18 0" stroke="${C.ink}" stroke-width="3" fill="none" stroke-linecap="round"/></g>
      <path d="M140 80 h40" stroke="${C.lilacD}" stroke-width="4" stroke-linecap="round" stroke-dasharray="1 9"/>
      ${card(240, 80, 90, 104, '日', { font: KAI, size: 70, dy: 24 })}`),
    relay: svg(C.lilacT, `
      ${tzg(56, 22, 116, C.terra)}
      <path d="M78 58 H150" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/><path d="M114 40 V136" stroke="${C.ink}" stroke-width="10" stroke-linecap="round"/>
      <path d="M96 100 L80 128" stroke="${C.terra}" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 7"/>
      <g transform="translate(226 84) rotate(32)"><rect x="-9" y="-58" width="18" height="86" rx="3" fill="${C.mus}"/><path d="M-9 28 L0 46 L9 28Z" fill="#F2DCC8"/><path d="M-3 40 L0 46 L3 40Z" fill="${C.ink}"/><rect x="-9" y="-58" width="18" height="14" rx="3" fill="${C.terra}"/></g>
      <circle cx="274" cy="36" r="11" fill="${C.terra}"/><circle cx="296" cy="56" r="11" fill="${C.mus}"/><circle cx="272" cy="130" r="11" fill="${C.blue}"/>`),
  };
})();
