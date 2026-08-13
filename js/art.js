// Hand-built neon vector art for every shop item.
// Each entry is the inner SVG markup for a 0 0 200 200 viewBox.

function pistolGroup(bodyFill, accentStroke, opts = {}) {
  const suppressor = opts.suppressor
    ? `<rect x="172" y="93" width="34" height="8" rx="4" fill="${bodyFill}" stroke="${accentStroke}" stroke-width="1.5"/>`
    : "";
  return `
    <rect x="110" y="90" width="${opts.barrelLen || 62}" height="14" rx="2" fill="${bodyFill}" stroke="${accentStroke}" stroke-width="1.5" filter="url(#neonGlow)"/>
    ${suppressor}
    <rect x="52" y="78" width="76" height="30" rx="5" fill="${bodyFill}" stroke="${accentStroke}" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="70,108 96,108 90,165 63,150" fill="${bodyFill}" stroke="${accentStroke}" stroke-width="1.5"/>
    <path d="M84,108 q-9,16 0,26" fill="none" stroke="${accentStroke}" stroke-width="2"/>
    <rect x="82" y="112" width="4" height="10" fill="${accentStroke}"/>
  `;
}

const ITEM_ART = {
  // ---------- WEAPONS ----------
  w1: `<g opacity="0.95">${pistolGroup("#6b5a4a", "var(--neon-red)")}
    <line x1="60" y1="85" x2="120" y2="100" stroke="#3a2f24" stroke-width="1"/>
    <line x1="65" y1="100" x2="115" y2="90" stroke="#3a2f24" stroke-width="1"/></g>`,

  w2: pistolGroup("#1a1a22", "var(--neon-teal)", { suppressor: true }),

  w3: `
    <polygon points="18,96 55,92 55,112 22,116" fill="#22222c" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <rect x="52" y="86" width="46" height="26" rx="4" fill="#22222c" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="90" y="95" width="94" height="10" rx="2" fill="#22222c" stroke="var(--neon-gold)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <rect x="112" y="91" width="32" height="17" rx="3" fill="#14141a" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <polygon points="60,112 76,112 71,150 58,140" fill="#22222c" stroke="var(--neon-gold)" stroke-width="1.5"/>
  `,

  w4: `
    <path d="M28,86 L70,86 L70,112 L28,112 L28,104 L34,104 L34,94 L28,94 Z" fill="none" stroke="var(--neon-purple)" stroke-width="2.5" filter="url(#neonGlow)"/>
    <rect x="68" y="83" width="72" height="26" rx="4" fill="#1c1c26" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="138" y="90" width="34" height="10" rx="2" fill="#1c1c26" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <rect x="95" y="109" width="15" height="48" rx="2" fill="#1c1c26" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <polygon points="114,109 129,109 125,144 111,136" fill="#1c1c26" stroke="var(--neon-purple)" stroke-width="1.5"/>
  `,

  w5: `
    <polygon points="8,90 42,88 42,112 13,116" fill="#16161e" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <rect x="40" y="88" width="52" height="22" rx="4" fill="#16161e" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="58" y="97" width="128" height="8" rx="2" fill="#16161e" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <rect x="52" y="72" width="44" height="11" rx="5" fill="#101017" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <circle cx="58" cy="77" r="5.5" fill="none" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <circle cx="90" cy="77" r="5.5" fill="none" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <line x1="150" y1="105" x2="140" y2="140" stroke="var(--neon-teal)" stroke-width="2"/>
    <line x1="160" y1="105" x2="170" y2="140" stroke="var(--neon-teal)" stroke-width="2"/>
    <polygon points="64,110 78,110 74,146 61,138" fill="#16161e" stroke="var(--neon-teal)" stroke-width="1.5"/>
  `,

  w6: `
    <rect x="40" y="88" width="52" height="22" rx="4" fill="#101018" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="58" y="97" width="108" height="8" rx="2" fill="#101018" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <rect x="164" y="94" width="30" height="14" rx="6" fill="#101018" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <rect x="50" y="70" width="46" height="12" rx="6" fill="#0b0b10" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <circle cx="57" cy="76" r="6" fill="none" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <circle cx="90" cy="76" r="6" fill="none" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <polygon points="8,90 40,88 40,112 13,116" fill="#101018" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <line x1="150" y1="105" x2="138" y2="142" stroke="var(--neon-purple)" stroke-width="2"/>
    <line x1="162" y1="105" x2="174" y2="142" stroke="var(--neon-purple)" stroke-width="2"/>
    <polygon points="64,110 78,110 74,146 61,138" fill="#101018" stroke="var(--neon-purple)" stroke-width="1.5"/>
  `,

  w7: `
    <g transform="rotate(18 100 100)">${pistolGroup("#caa136", "var(--neon-gold)", { barrelLen: 55 })}</g>
    <g transform="rotate(-18 100 100) translate(-6 6)">${pistolGroup("#e8c563", "var(--neon-gold)", { barrelLen: 55 })}</g>
  `,

  // ---------- CARS ----------
  car1: `
    <path d="M18,142 L18,122 Q22,102 44,100 L74,82 L138,82 L164,100 Q182,102 184,122 L184,142 Z" fill="#5a5248" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="80,84 132,84 126,100 86,100" fill="#2a2a34"/>
    <circle cx="56" cy="145" r="18" fill="#101014" stroke="#888" stroke-width="2"/>
    <circle cx="152" cy="145" r="18" fill="#101014" stroke="#888" stroke-width="2"/>
    <circle cx="56" cy="145" r="7" fill="#3a3a44"/>
    <circle cx="152" cy="145" r="7" fill="#3a3a44"/>
  `,

  car2: `
    <circle cx="48" cy="150" r="24" fill="#0d0d12" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="160" cy="150" r="24" fill="#0d0d12" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="48" cy="150" r="6" fill="#2a2a34"/>
    <circle cx="160" cy="150" r="6" fill="#2a2a34"/>
    <path d="M48,150 L95,112 L140,110 L160,150" fill="none" stroke="var(--neon-purple)" stroke-width="3" filter="url(#neonGlow)"/>
    <rect x="88" y="100" width="42" height="14" rx="4" fill="#15151c" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <line x1="140" y1="110" x2="160" y2="90" stroke="var(--neon-purple)" stroke-width="2.5"/>
  `,

  car3: `
    <path d="M14,146 L20,128 Q42,104 72,100 L102,84 L152,90 Q177,96 186,126 L186,146 Z" fill="#8a1730" stroke="var(--neon-red)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="106,87 148,92 141,108 114,105" fill="#2a1015"/>
    <circle cx="56" cy="148" r="17" fill="#101014" stroke="#999" stroke-width="2"/>
    <circle cx="154" cy="148" r="17" fill="#101014" stroke="#999" stroke-width="2"/>
    <circle cx="56" cy="148" r="6.5" fill="#3a1a20"/>
    <circle cx="154" cy="148" r="6.5" fill="#3a1a20"/>
  `,

  car4: `
    <path d="M10,148 L15,132 Q50,108 90,104 L160,96 Q180,100 190,128 L190,148 Z" fill="#0d0d12" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <path d="M120,100 L142,132" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="95,105 138,99 132,122 100,122" fill="#1a1a22"/>
    <circle cx="52" cy="150" r="16" fill="#0a0a0e" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <circle cx="166" cy="150" r="16" fill="#0a0a0e" stroke="var(--neon-purple)" stroke-width="1.5"/>
  `,

  car5: `
    <path d="M10,145 Q15,120 55,108 Q110,95 165,105 Q188,112 192,140 L192,145 Z" fill="#eef0f2" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <ellipse cx="24" cy="132" rx="10" ry="7" fill="#111"/>
    <polygon points="95,100 158,107 150,124 100,120" fill="#dfe3e6" opacity="0.6"/>
    <circle cx="56" cy="148" r="17" fill="#101014" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <circle cx="160" cy="148" r="17" fill="#101014" stroke="var(--neon-gold)" stroke-width="1.5"/>
  `,

  car6: `
    <path d="M15,145 L15,120 Q18,105 35,102 L60,85 L110,85 L110,105 L185,105 L185,145 Z" fill="#3a4a3a" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="65,87 105,87 105,103 72,103" fill="#1a1a1a"/>
    <line x1="112" y1="107" x2="182" y2="107" stroke="#1a2a1a" stroke-width="1"/>
    <circle cx="55" cy="148" r="17" fill="#101014" stroke="#888" stroke-width="2"/>
    <circle cx="160" cy="148" r="17" fill="#101014" stroke="#888" stroke-width="2"/>
    <circle cx="55" cy="148" r="6.5" fill="#3a3a44"/>
    <circle cx="160" cy="148" r="6.5" fill="#3a3a44"/>
  `,

  car7: `
    <path d="M12,142 L16,124 Q30,106 55,103 L78,88 L128,88 L152,104 Q176,107 188,124 L188,142 Z" fill="#12182c" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="82,90 126,90 121,104 88,104" fill="#2a2a3a"/>
    <circle cx="54" cy="145" r="17" fill="#101014" stroke="#aaa" stroke-width="2"/>
    <circle cx="152" cy="145" r="17" fill="#101014" stroke="#aaa" stroke-width="2"/>
    <circle cx="54" cy="145" r="6.5" fill="#2a2a3a"/>
    <circle cx="152" cy="145" r="6.5" fill="#2a2a3a"/>
  `,

  car8: `
    <path d="M12,146 L18,126 Q45,100 85,96 L115,82 L155,90 Q180,98 190,126 L190,146 Z" fill="#a3220f" stroke="var(--neon-red)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="100,85 148,92 141,110 107,107" fill="#1a0805"/>
    <path d="M155,90 L172,80" stroke="var(--neon-gold)" stroke-width="2"/>
    <circle cx="54" cy="149" r="16" fill="#0a0a0e" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <circle cx="162" cy="149" r="16" fill="#0a0a0e" stroke="var(--neon-gold)" stroke-width="1.5"/>
  `,

  car9: `
    <path d="M8,148 L12,128 Q52,102 95,98 L165,90 Q186,96 192,126 L192,148 Z" fill="#151515" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="100,96 140,90 134,112 106,112" fill="#0a1a1a"/>
    <rect x="150" y="72" width="38" height="6" fill="#0a0a0a" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <line x1="160" y1="78" x2="160" y2="92" stroke="var(--neon-teal)" stroke-width="2"/>
    <line x1="178" y1="78" x2="178" y2="92" stroke="var(--neon-teal)" stroke-width="2"/>
    <circle cx="50" cy="150" r="16" fill="#050505" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <circle cx="166" cy="150" r="16" fill="#050505" stroke="var(--neon-teal)" stroke-width="1.5"/>
  `,

  // ---------- WATCHES ----------
  watch1: `
    <rect x="85" y="8" width="30" height="46" rx="6" fill="#2a2a34"/>
    <rect x="85" y="136" width="30" height="56" rx="6" fill="#2a2a34"/>
    <circle cx="100" cy="100" r="48" fill="#c8c8d0" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="38" fill="#16161c"/>
    <line x1="100" y1="100" x2="100" y2="75" stroke="#e8e8f0" stroke-width="2"/>
    <line x1="100" y1="100" x2="120" y2="110" stroke="#e8e8f0" stroke-width="2"/>
  `,

  watch2: `
    <rect x="83" y="8" width="34" height="44" rx="6" fill="var(--neon-gold)"/>
    <rect x="83" y="138" width="34" height="54" rx="6" fill="var(--neon-gold)"/>
    <circle cx="100" cy="100" r="48" fill="#f0c76a" stroke="var(--neon-gold)" stroke-width="2.5" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="37" fill="#1a1508"/>
    <line x1="100" y1="100" x2="100" y2="76" stroke="var(--neon-gold)" stroke-width="2.5"/>
    <line x1="100" y1="100" x2="118" y2="112" stroke="var(--neon-gold)" stroke-width="2.5"/>
  `,

  watch3: `
    <rect x="84" y="10" width="32" height="44" rx="6" fill="#3a3a44"/>
    <rect x="84" y="136" width="32" height="54" rx="6" fill="#3a3a44"/>
    <circle cx="100" cy="100" r="48" fill="#d8d0b8" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="37" fill="#151016"/>
    <g fill="#fff">
      <circle cx="100" cy="56" r="3"/><circle cx="140" cy="70" r="3"/><circle cx="144" cy="100" r="3"/>
      <circle cx="140" cy="130" r="3"/><circle cx="100" cy="144" r="3"/><circle cx="60" cy="130" r="3"/>
      <circle cx="56" cy="100" r="3"/><circle cx="60" cy="70" r="3"/>
    </g>
    <line x1="100" y1="100" x2="100" y2="78" stroke="#fff" stroke-width="2"/>
    <line x1="100" y1="100" x2="115" y2="108" stroke="#fff" stroke-width="2"/>
  `,

  watch4: `
    <rect x="88" y="12" width="24" height="42" rx="5" fill="#241a10"/>
    <rect x="88" y="140" width="24" height="52" rx="5" fill="#241a10"/>
    <circle cx="100" cy="100" r="40" fill="#dbb254" stroke="var(--neon-gold)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="34" fill="#0f0c06"/>
    <line x1="100" y1="100" x2="100" y2="82" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <line x1="100" y1="100" x2="112" y2="106" stroke="var(--neon-gold)" stroke-width="1.5"/>
  `,

  watch5: `
    <rect x="82" y="10" width="36" height="42" rx="10" fill="#1c1c26"/>
    <rect x="82" y="140" width="36" height="52" rx="10" fill="#1c1c26"/>
    <rect x="58" y="60" width="84" height="80" rx="20" fill="#0e0e14" stroke="var(--neon-teal)" stroke-width="2.5" filter="url(#neonGlow)"/>
    <g fill="#fff">
      <circle cx="72" cy="68" r="2.5"/><circle cx="100" cy="64" r="2.5"/><circle cx="128" cy="68" r="2.5"/>
      <circle cx="66" cy="100" r="2.5"/><circle cx="134" cy="100" r="2.5"/>
      <circle cx="72" cy="132" r="2.5"/><circle cx="100" cy="136" r="2.5"/><circle cx="128" cy="132" r="2.5"/>
    </g>
    <circle cx="90" cy="95" r="8" fill="none" stroke="var(--neon-teal)" stroke-width="1.2"/>
    <circle cx="112" cy="108" r="6" fill="none" stroke="var(--neon-teal)" stroke-width="1.2"/>
    <line x1="100" y1="100" x2="100" y2="82" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <line x1="100" y1="100" x2="114" y2="112" stroke="var(--neon-teal)" stroke-width="1.5"/>
  `,

  watch6: `
    <rect x="86" y="10" width="28" height="44" rx="6" fill="#2a2a34"/>
    <rect x="86" y="136" width="28" height="54" rx="6" fill="#2a2a34"/>
    <circle cx="100" cy="100" r="46" fill="#1e1e26" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="37" fill="#0e0e14"/>
    <circle cx="85" cy="100" r="9" fill="none" stroke="#888" stroke-width="1.2"/>
    <circle cx="115" cy="100" r="9" fill="none" stroke="#888" stroke-width="1.2"/>
    <line x1="100" y1="100" x2="100" y2="78" stroke="#e8e8f0" stroke-width="2"/>
    <line x1="100" y1="100" x2="116" y2="112" stroke="#e8e8f0" stroke-width="2"/>
  `,

  watch7: `
    <rect x="85" y="10" width="30" height="42" rx="6" fill="#1a1a1a"/>
    <rect x="85" y="138" width="30" height="52" rx="6" fill="#1a1a1a"/>
    <circle cx="100" cy="100" r="47" fill="#0a0a0a" stroke="#999" stroke-width="3" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="37" fill="#050505"/>
    <g stroke="#ccc" stroke-width="1.5">
      <line x1="100" y1="58" x2="100" y2="65"/><line x1="100" y1="135" x2="100" y2="142"/>
      <line x1="58" y1="100" x2="65" y2="100"/><line x1="135" y1="100" x2="142" y2="100"/>
    </g>
    <line x1="100" y1="100" x2="100" y2="80" stroke="var(--neon-teal)" stroke-width="2"/>
    <line x1="100" y1="100" x2="114" y2="110" stroke="var(--neon-teal)" stroke-width="2"/>
  `,

  watch8: `
    <rect x="84" y="10" width="32" height="42" rx="6" fill="#3a3a3a"/>
    <rect x="84" y="138" width="32" height="52" rx="6" fill="#3a3a3a"/>
    <polygon points="100,52 130,64 142,94 142,106 130,136 100,148 70,136 58,106 58,94 70,64" fill="#4a4a4a" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="34" fill="#1a1a1a"/>
    <line x1="100" y1="100" x2="100" y2="80" stroke="var(--neon-gold)" stroke-width="2"/>
    <line x1="100" y1="100" x2="112" y2="110" stroke="var(--neon-gold)" stroke-width="2"/>
  `,

  watch9: `
    <rect x="85" y="12" width="30" height="40" rx="6" fill="#1a2a3a"/>
    <rect x="85" y="138" width="30" height="50" rx="6" fill="#1a2a3a"/>
    <circle cx="100" cy="100" r="46" fill="#26466b" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="70" cy="82" r="5" fill="none" stroke="var(--neon-gold)" stroke-width="2"/>
    <circle cx="130" cy="118" r="5" fill="none" stroke="var(--neon-gold)" stroke-width="2"/>
    <circle cx="100" cy="100" r="36" fill="#1a3552"/>
    <g stroke="#2a4a6b" stroke-width="1.5">
      <line x1="68" y1="88" x2="132" y2="88"/><line x1="66" y1="100" x2="134" y2="100"/><line x1="68" y1="112" x2="132" y2="112"/>
    </g>
    <line x1="100" y1="100" x2="100" y2="82" stroke="#fff" stroke-width="2"/>
    <line x1="100" y1="100" x2="113" y2="109" stroke="#fff" stroke-width="2"/>
  `,

  // ---------- NECKLACES ----------
  neck1: `
    <path d="M40,28 Q60,110 100,148" fill="none" stroke="#c4c4cc" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 4"/>
    <path d="M160,28 Q140,110 100,148" fill="none" stroke="#c4c4cc" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 4" filter="url(#neonGlow)"/>
    <circle cx="100" cy="152" r="6" fill="#e8e8f0"/>
  `,

  neck2: `
    <path d="M36,26 Q58,112 100,152" fill="none" stroke="var(--neon-gold)" stroke-width="9" stroke-linecap="round" stroke-dasharray="10 5" filter="url(#neonGlow)"/>
    <path d="M164,26 Q142,112 100,152" fill="none" stroke="var(--neon-gold)" stroke-width="9" stroke-linecap="round" stroke-dasharray="10 5" filter="url(#neonGlow)"/>
  `,

  neck3: `
    <path d="M40,28 Q60,108 100,140" fill="none" stroke="var(--neon-gold)" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 4"/>
    <path d="M160,28 Q140,108 100,140" fill="none" stroke="var(--neon-gold)" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 4"/>
    <polygon points="100,140 112,158 100,180 88,158" fill="#dff7f5" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
  `,

  neck4: `
    <path d="M34,24 Q58,112 100,150" fill="none" stroke="var(--neon-gold)" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <path d="M166,24 Q142,112 100,150" fill="none" stroke="var(--neon-gold)" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <g fill="#fff">
      <circle cx="45" cy="45" r="2.5"/><circle cx="62" cy="80" r="2.5"/><circle cx="80" cy="115" r="2.5"/>
      <circle cx="155" cy="45" r="2.5"/><circle cx="138" cy="80" r="2.5"/><circle cx="120" cy="115" r="2.5"/>
    </g>
  `,

  neck5: `
    <path d="M30,22 Q58,114 100,145" fill="none" stroke="var(--neon-gold)" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <path d="M170,22 Q142,114 100,145" fill="none" stroke="var(--neon-gold)" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <g fill="#fff">
      <circle cx="42" cy="42" r="2.5"/><circle cx="58" cy="76" r="2.5"/><circle cx="78" cy="112" r="2.5"/>
      <circle cx="158" cy="42" r="2.5"/><circle cx="142" cy="76" r="2.5"/><circle cx="122" cy="112" r="2.5"/>
    </g>
    <polygon points="100,142 122,162 100,192 78,162" fill="#dff7f5" stroke="var(--neon-teal)" stroke-width="2.5" filter="url(#neonGlow)"/>
    <polygon points="100,150 111,163 100,178 89,163" fill="#fff" opacity="0.6"/>
  `,

  neck6: `
    <g fill="#f0ead6">
      <circle cx="42" cy="32" r="6"/><circle cx="50" cy="52" r="6.5"/><circle cx="60" cy="72" r="7"/>
      <circle cx="73" cy="92" r="7.5"/><circle cx="88" cy="112" r="8"/><circle cx="100" cy="128" r="8"/>
      <circle cx="112" cy="112" r="8"/><circle cx="127" cy="92" r="7.5"/><circle cx="140" cy="72" r="7"/>
      <circle cx="150" cy="52" r="6.5"/><circle cx="158" cy="32" r="6"/>
    </g>
  `,

  neck7: `
    <path d="M38,26 Q60,112 100,150" fill="none" stroke="#e8e8f0" stroke-width="8" stroke-linecap="round" filter="url(#neonGlow)"/>
    <path d="M162,26 Q140,112 100,150" fill="none" stroke="#e8e8f0" stroke-width="8" stroke-linecap="round" filter="url(#neonGlow)"/>
    <g fill="var(--neon-teal)">
      <circle cx="44" cy="45" r="2.5"/><circle cx="58" cy="78" r="2.5"/><circle cx="76" cy="112" r="2.5"/>
      <circle cx="156" cy="45" r="2.5"/><circle cx="142" cy="78" r="2.5"/><circle cx="124" cy="112" r="2.5"/>
    </g>
  `,

  neck8: `
    <path d="M34,24 Q58,112 100,150" fill="none" stroke="#dfe6ea" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <path d="M166,24 Q142,112 100,150" fill="none" stroke="#dfe6ea" stroke-width="12" stroke-linecap="round" filter="url(#neonGlow)"/>
    <g fill="#fff">
      <circle cx="45" cy="45" r="2.5"/><circle cx="62" cy="80" r="2.5"/><circle cx="80" cy="115" r="2.5"/>
      <circle cx="155" cy="45" r="2.5"/><circle cx="138" cy="80" r="2.5"/><circle cx="120" cy="115" r="2.5"/>
    </g>
    <polygon points="100,145 108,155 100,168 92,155" fill="var(--neon-teal)" opacity="0.8"/>
  `,

  // ---------- CLOTHES ----------
  cloth1: `
    <path d="M70,40 Q100,20 130,40 L150,50 L140,80 L128,68 L128,180 L72,180 L72,68 L60,80 L50,50 Z" fill="#1c1c24" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <path d="M85,38 Q100,55 115,38" fill="none" stroke="#0c0c10" stroke-width="10"/>
    <line x1="94" y1="60" x2="90" y2="95" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <line x1="106" y1="60" x2="110" y2="95" stroke="var(--neon-teal)" stroke-width="1.5"/>
  `,

  cloth2: `
    <path d="M70,40 Q100,24 130,40 L148,52 L138,78 L128,66 L128,180 L72,180 L72,66 L62,78 L52,52 Z" fill="#241429" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <line x1="100" y1="46" x2="100" y2="178" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <line x1="72" y1="90" x2="52" y2="130" stroke="var(--neon-gold)" stroke-width="4"/>
    <line x1="128" y1="90" x2="148" y2="130" stroke="var(--neon-gold)" stroke-width="4"/>
  `,

  cloth3: `
    <path d="M68,42 L100,58 L132,42 L152,54 L142,82 L130,70 L130,180 L70,180 L70,70 L58,82 L48,54 Z" fill="#0e0e12" stroke="var(--neon-gold)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="100,58 82,44 92,90 100,72" fill="#e8e8f0"/>
    <polygon points="100,58 118,44 108,90 100,72" fill="#e8e8f0"/>
    <line x1="100" y1="70" x2="100" y2="140" stroke="var(--neon-gold)" stroke-width="4"/>
  `,

  cloth4: `
    <path d="M68,40 Q100,22 132,40 L150,52 L140,80 L128,68 L128,180 L72,180 L72,68 L60,80 L50,52 Z" fill="#20141c" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <g stroke="var(--neon-gold)" stroke-width="1.2">
      <line x1="78" y1="80" x2="90" y2="80"/><line x1="98" y1="80" x2="110" y2="80"/><line x1="118" y1="80" x2="122" y2="80"/>
      <line x1="78" y1="100" x2="90" y2="100"/><line x1="98" y1="100" x2="110" y2="100"/><line x1="118" y1="100" x2="122" y2="100"/>
      <line x1="78" y1="120" x2="90" y2="120"/><line x1="98" y1="120" x2="110" y2="120"/><line x1="118" y1="120" x2="122" y2="120"/>
      <line x1="78" y1="140" x2="90" y2="140"/><line x1="98" y1="140" x2="110" y2="140"/><line x1="118" y1="140" x2="122" y2="140"/>
    </g>
  `,

  cloth5: `
    <path d="M62,44 L100,60 L138,44 L158,58 L146,88 L132,74 L132,192 L68,192 L68,74 L54,88 L42,58 Z" fill="#2a0e18" stroke="var(--neon-red)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#c9a3ac">
      <circle cx="72" cy="50" r="6"/><circle cx="84" cy="46" r="6"/><circle cx="96" cy="44" r="6"/>
      <circle cx="104" cy="44" r="6"/><circle cx="116" cy="46" r="6"/><circle cx="128" cy="50" r="6"/>
    </g>
    <g fill="var(--neon-gold)">
      <circle cx="100" cy="90" r="3"/><circle cx="100" cy="112" r="3"/><circle cx="100" cy="134" r="3"/><circle cx="100" cy="156" r="3"/>
    </g>
  `,
  // ---------- HOUSES ----------
  rent1: `
    <rect x="55" y="75" width="90" height="105" fill="#1c1c24" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="75" y="95" width="20" height="20" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1.2"/>
    <rect x="105" y="95" width="20" height="20" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1.2"/>
    <rect x="88" y="145" width="24" height="35" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1.2"/>
  `,

  rent2: `
    <rect x="45" y="55" width="110" height="125" fill="#1c1c24" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1">
      <rect x="60" y="70" width="18" height="18"/><rect x="90" y="70" width="18" height="18"/><rect x="120" y="70" width="18" height="18"/>
      <rect x="60" y="98" width="18" height="18"/><rect x="90" y="98" width="18" height="18"/><rect x="120" y="98" width="18" height="18"/>
    </g>
    <rect x="88" y="150" width="24" height="30" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1.2"/>
  `,

  rent3: `
    <rect x="60" y="20" width="80" height="160" fill="#151018" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#0c0c10" stroke="var(--neon-purple)" stroke-width="1">
      <rect x="70" y="35" width="14" height="14"/><rect x="93" y="35" width="14" height="14"/><rect x="116" y="35" width="14" height="14"/>
      <rect x="70" y="58" width="14" height="14"/><rect x="93" y="58" width="14" height="14"/><rect x="116" y="58" width="14" height="14"/>
      <rect x="70" y="81" width="14" height="14"/><rect x="93" y="81" width="14" height="14"/><rect x="116" y="81" width="14" height="14"/>
      <rect x="70" y="104" width="14" height="14"/><rect x="93" y="104" width="14" height="14"/><rect x="116" y="104" width="14" height="14"/>
      <rect x="70" y="127" width="14" height="14"/><rect x="93" y="127" width="14" height="14"/><rect x="116" y="127" width="14" height="14"/>
    </g>
  `,

  rent4: `
    <rect x="55" y="10" width="90" height="170" fill="#141018" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1">
      <rect x="65" y="22" width="16" height="16"/><rect x="87" y="22" width="16" height="16"/><rect x="109" y="22" width="16" height="16"/>
      <rect x="65" y="44" width="16" height="16"/><rect x="87" y="44" width="16" height="16"/><rect x="109" y="44" width="16" height="16"/>
      <rect x="65" y="66" width="16" height="16"/><rect x="87" y="66" width="16" height="16"/><rect x="109" y="66" width="16" height="16"/>
      <rect x="65" y="88" width="16" height="16"/><rect x="87" y="88" width="16" height="16"/><rect x="109" y="88" width="16" height="16"/>
      <rect x="65" y="110" width="16" height="16"/><rect x="87" y="110" width="16" height="16"/><rect x="109" y="110" width="16" height="16"/>
      <rect x="65" y="132" width="16" height="16"/><rect x="87" y="132" width="16" height="16"/><rect x="109" y="132" width="16" height="16"/>
    </g>
    <rect x="90" y="155" width="20" height="25" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
  `,

  buy1: `
    <polygon points="100,45 40,95 160,95" fill="#2a1a10" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="50" y="95" width="100" height="80" fill="#1c1c24" stroke="var(--neon-gold)" stroke-width="2"/>
    <rect x="65" y="112" width="22" height="22" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
    <rect x="113" y="112" width="22" height="22" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
    <rect x="90" y="140" width="20" height="35" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
  `,

  buy2: `
    <rect x="55" y="18" width="90" height="162" fill="#181820" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <g stroke="var(--neon-gold)" stroke-width="1">
      <line x1="55" y1="45" x2="145" y2="45"/><line x1="55" y1="72" x2="145" y2="72"/>
      <line x1="55" y1="99" x2="145" y2="99"/><line x1="55" y1="126" x2="145" y2="126"/><line x1="55" y1="153" x2="145" y2="153"/>
    </g>
    <rect x="60" y="30" width="30" height="10" fill="none" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="60" y="57" width="30" height="10" fill="none" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="60" y="84" width="30" height="10" fill="none" stroke="var(--neon-teal)" stroke-width="1"/>
  `,

  buy3: `
    <rect x="35" y="90" width="130" height="85" fill="#1c1810" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="100,55 35,90 165,90" fill="#2a2010" stroke="var(--neon-gold)" stroke-width="2"/>
    <g fill="none" stroke="var(--neon-gold)" stroke-width="2">
      <line x1="55" y1="95" x2="55" y2="175"/><line x1="80" y1="95" x2="80" y2="175"/>
      <line x1="120" y1="95" x2="120" y2="175"/><line x1="145" y1="95" x2="145" y2="175"/>
    </g>
    <rect x="90" y="130" width="20" height="45" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
  `,

  buy4: `
    <ellipse cx="100" cy="178" rx="90" ry="8" fill="var(--neon-teal)" opacity="0.15"/>
    <rect x="45" y="105" width="110" height="70" fill="#161a1a" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="100,80 45,105 155,105" fill="#1c2222" stroke="var(--neon-teal)" stroke-width="2"/>
    <rect x="60" y="120" width="20" height="20" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="120" y="120" width="20" height="20" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1"/>
    <path d="M22,178 Q26,120 34,100 Q38,120 30,178 Z" fill="#0f3d2e" stroke="var(--neon-teal)" stroke-width="1"/>
    <path d="M178,178 Q174,120 166,100 Q162,120 170,178 Z" fill="#0f3d2e" stroke="var(--neon-teal)" stroke-width="1"/>
  `,

  // ---------- ARMS TRAFFICKING ----------
  pistol: pistolGroup("#2a2a30", "var(--neon-red)"),

  revolver: `
    <rect x="115" y="94" width="55" height="12" rx="2" fill="#2a2a30" stroke="var(--neon-gold)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <circle cx="100" cy="100" r="22" fill="#2a2a30" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <circle cx="100" cy="88" r="4" fill="#14141a"/><circle cx="112" cy="96" r="4" fill="#14141a"/>
    <circle cx="108" cy="111" r="4" fill="#14141a"/><circle cx="92" cy="111" r="4" fill="#14141a"/>
    <circle cx="88" cy="96" r="4" fill="#14141a"/>
    <polygon points="82,112 100,112 94,165 72,150" fill="#2a2a30" stroke="var(--neon-gold)" stroke-width="1.5"/>
    <path d="M88,112 q-8,15 0,25" fill="none" stroke="var(--neon-gold)" stroke-width="2"/>
  `,

  shotgun: `
    <polygon points="18,96 55,92 55,112 22,116" fill="#1c1c22" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <rect x="52" y="86" width="46" height="26" rx="4" fill="#1c1c22" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <rect x="90" y="95" width="94" height="10" rx="2" fill="#1c1c22" stroke="var(--neon-purple)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <rect x="112" y="91" width="32" height="17" rx="3" fill="#0f0f14" stroke="var(--neon-purple)" stroke-width="1.5"/>
    <polygon points="60,112 76,112 71,150 58,140" fill="#1c1c22" stroke="var(--neon-purple)" stroke-width="1.5"/>
  `,

  buy5: `
    <rect x="45" y="60" width="110" height="120" fill="#1a1a22" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1">
      <rect x="55" y="75" width="24" height="20"/><rect x="88" y="75" width="24" height="20"/><rect x="121" y="75" width="24" height="20"/>
      <rect x="55" y="105" width="24" height="20"/><rect x="88" y="105" width="24" height="20"/><rect x="121" y="105" width="24" height="20"/>
      <rect x="55" y="135" width="24" height="20"/><rect x="88" y="135" width="24" height="20"/><rect x="121" y="135" width="24" height="20"/>
    </g>
    <line x1="45" y1="97" x2="155" y2="97" stroke="var(--neon-teal)" stroke-width="1" opacity="0.5"/>
    <line x1="45" y1="127" x2="155" y2="127" stroke="var(--neon-teal)" stroke-width="1" opacity="0.5"/>
  `,

  buy6: `
    <rect x="30" y="110" width="140" height="65" fill="#16181a" stroke="var(--neon-teal)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="30,110 60,85 150,85 170,110" fill="#1c2224" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <rect x="45" y="125" width="22" height="22" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="90" y="125" width="22" height="22" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="133" y="125" width="22" height="22" fill="#0c0c10" stroke="var(--neon-teal)" stroke-width="1"/>
    <ellipse cx="100" cy="185" rx="60" ry="8" fill="#0a3d5c" stroke="var(--neon-teal)" stroke-width="1" opacity="0.7"/>
  `,

  buy7: `
    <rect x="20" y="95" width="160" height="80" fill="#1c1810" stroke="var(--neon-gold)" stroke-width="2" filter="url(#neonGlow)"/>
    <polygon points="100,55 20,95 180,95" fill="#2a2010" stroke="var(--neon-gold)" stroke-width="2"/>
    <g fill="none" stroke="var(--neon-gold)" stroke-width="2">
      <line x1="40" y1="100" x2="40" y2="175"/><line x1="65" y1="100" x2="65" y2="175"/>
      <line x1="135" y1="100" x2="135" y2="175"/><line x1="160" y1="100" x2="160" y2="175"/>
    </g>
    <rect x="88" y="130" width="24" height="45" fill="#0c0c10" stroke="var(--neon-gold)" stroke-width="1"/>
    <circle cx="100" cy="185" r="8" fill="none" stroke="var(--neon-teal)" stroke-width="1.5"/>
  `,

  buy8: `
    <rect x="60" y="5" width="80" height="175" fill="#0e0e14" stroke="var(--neon-purple)" stroke-width="2" filter="url(#neonGlow)"/>
    <g fill="#1a1a26" stroke="var(--neon-purple)" stroke-width="0.8">
      <rect x="68" y="18" width="14" height="14"/><rect x="86" y="18" width="14" height="14"/><rect x="104" y="18" width="14" height="14"/><rect x="122" y="18" width="14" height="14"/>
      <rect x="68" y="38" width="14" height="14"/><rect x="86" y="38" width="14" height="14"/><rect x="104" y="38" width="14" height="14"/><rect x="122" y="38" width="14" height="14"/>
      <rect x="68" y="58" width="14" height="14"/><rect x="86" y="58" width="14" height="14"/><rect x="104" y="58" width="14" height="14"/><rect x="122" y="58" width="14" height="14"/>
    </g>
    <rect x="60" y="80" width="80" height="30" fill="#1c1c2a" stroke="var(--neon-teal)" stroke-width="1.5"/>
    <line x1="70" y1="95" x2="130" y2="95" stroke="var(--neon-teal)" stroke-width="1"/>
    <rect x="70" y="115" width="60" height="65" fill="#151520" stroke="var(--neon-purple)" stroke-width="1"/>
  `,

  jet1: `
    <path d="M18,102 L155,97 Q188,97 194,103 Q188,109 155,106 L18,108 Z" fill="#e9ebf0" stroke="var(--neon-teal)" stroke-width="1.5" filter="url(#neonGlow)"/>
    <polygon points="155,97 194,103 155,106" fill="#c3c8d4"/>
    <polygon points="68,107 36,66 63,100" fill="#cfd3dd" opacity="0.9"/>
    <polygon points="68,109 36,150 63,111" fill="#cfd3dd" opacity="0.9"/>
    <polygon points="22,103 6,86 26,102" fill="#aeb4c4"/>
    <circle cx="12" cy="105" r="3" fill="var(--neon-gold)"/>
    <line x1="30" y1="105" x2="180" y2="105" stroke="#9aa0b0" stroke-width="0.75" opacity="0.6"/>
  `,
};

const ITEM_PHOTO = {
  w1: "assets/items/w1.jpg",
  w2: "assets/items/w2.jpg",
  w3: "assets/items/w3.webp",
  w4: "assets/items/w4.webp",
  w5: "assets/items/w5.jpg",
  w7: "assets/items/w7.webp",
  w6: "assets/items/rifle.webp",
  watch1: "assets/items/watch1.webp",
  watch2: "assets/items/watch2.webp",
  watch3: "assets/items/watch3.webp",
  watch4: "assets/items/watch4.webp",
  watch5: "assets/items/watch5.webp",
  car1: "assets/items/car1.webp",
  car2: "assets/items/car2.jpg",
  car3: "assets/items/car3.avif",
  car4: "assets/items/car4.webp",
  car5: "assets/items/car5.webp",
  neck1: "assets/items/neck1.webp",
  neck2: "assets/items/neck2.webp",
  neck3: "assets/items/neck3.avif",
  neck4: "assets/items/neck4.webp",
  neck5: "assets/items/neck5.jpg",
  cloth1: "assets/items/cloth1.jpg",
  cloth2: "assets/items/cloth2.jpg",
  cloth4: "assets/items/cloth4.avif",
  cloth5: "assets/items/cloth5.avif",
  rent1: "assets/items/rent1.jpg",
  rent2: "assets/items/rent2.webp",
  rent3: "assets/items/rent3.jpg",
  buy1: "assets/items/buy1.jpg",
  buy2: "assets/items/buy2.jpg",
  buy3: "assets/items/buy3.jpeg",
  buy4: "assets/items/buy4.avif",
  buy5: "assets/items/buy5.jpg",
  buy6: "assets/items/buy6.jpg",
  buy7: "assets/items/buy7.jpg",
  buy8: "assets/items/buy8.jpg",
  car8: "assets/items/car8.jpg",
  car9: "assets/items/car9.avif",
  watch6: "assets/items/watch6.jpg",
  cloth3: "assets/items/cloth3.avif",
  rifle: "assets/items/rifle.webp",
  smg: "assets/items/smg.webp",
  sniper: "assets/items/smg.webp",
  pistol: "assets/items/w2.jpg",
  shotgun: "assets/items/w3.webp",
  watchcheap: "assets/items/watch1.webp",
  watchsteel: "assets/items/watch6.jpg",
  watchgold: "assets/items/watch2.webp",
  watchdiamond: "assets/items/watch3.webp",
  watchiced: "assets/items/watch5.webp",
  car10: "assets/items/car10.webp",
  car11: "assets/items/car11.webp",
  car12: "assets/items/car12.webp",
  watch10: "assets/items/watch10.png",
  watch11: "assets/items/watch11.jpg",
  watch12: "assets/items/watch12.jpg",
  watch13: "assets/items/watch13.avif",
  cloth6: "assets/items/cloth6.avif",
  cloth7: "assets/items/cloth7.avif",
  buy9: "assets/items/buy9.jpg",
  jet1: "assets/items/jet1.webp",
  jet2: "assets/items/jet2.jpg",
  jet3: "assets/items/jet3.jpeg",
  jet4: "assets/items/jet4.webp",
  car6: "assets/items/car6.jpg",
  car7: "assets/items/car7.jpg",
  watch7: "assets/items/watch7.jpg",
  watch8: "assets/items/watch8.webp",
  watch9: "assets/items/watch9.jpg",
  neck7: "assets/items/neck7.webp",
  neck8: "assets/items/neck8.jpg",
  rent4: "assets/items/rent4.webp",
  car13: "assets/items/car13.jpg",
  car14: "assets/items/car14.jpg",
  car15: "assets/items/car15.jpg",
  cloth8: "assets/items/cloth8.jpg",
  buy10: "assets/items/buy10.jpg",
  jet5: "assets/items/jet5.jpg",
};

function itemArtSVG(id, size = 64) {
  if (ITEM_PHOTO[id]) {
    return `<img src="${ITEM_PHOTO[id]}" width="${size}" height="${size}" class="item-art item-photo" alt="" />`;
  }
  const inner = ITEM_ART[id];
  if (!inner) return "";
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" class="item-art">${inner}</svg>`;
}
