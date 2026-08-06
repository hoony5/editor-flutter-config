const s = (d: string): string =>
  `<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;

export const IC = {
  refresh: s('<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"/>'),
  save: s('<path d="M12.5 15.5h-9a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h7l3 3v11a1 1 0 0 1-1 1z"/><path d="M10.5 15.5v-5h-5v5M5.5 1.5v3h4"/>'),
  x: s('<path d="M4 4l8 8M12 4l-8 8"/>'),
  plus: s('<path d="M8 3v10M3 8h10"/>'),
  play: s('<path d="M5 3l7 5-7 5z" fill="currentColor" stroke="none"/>'),
  loop: s('<path d="M2.5 8a5.5 5.5 0 0 1 9.3-4M13.5 8a5.5 5.5 0 0 1-9.3 4"/><path d="M12 1v3.5H8.5M4 15v-3.5h3.5"/>'),
  eye: s('<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>'),
  copy: s('<rect x="5.5" y="5.5" width="9" height="9" rx="1.5"/><path d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"/>'),
  chev: '<svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>',
} as const;

export const iconsJs = `
const _i=d=>'<svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">'+d+'</svg>';
const IC={
refresh:_i('<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"/>'),
save:_i('<path d="M12.5 15.5h-9a1 1 0 0 1-1-1v-13a1 1 0 0 1 1-1h7l3 3v11a1 1 0 0 1-1 1z"/><path d="M10.5 15.5v-5h-5v5M5.5 1.5v3h4"/>'),
x:_i('<path d="M4 4l8 8M12 4l-8 8"/>'),
plus:_i('<path d="M8 3v10M3 8h10"/>'),
play:_i('<path d="M5 3l7 5-7 5z" fill="currentColor" stroke="none"/>'),
loop:_i('<path d="M2.5 8a5.5 5.5 0 0 1 9.3-4M13.5 8a5.5 5.5 0 0 1-9.3 4"/><path d="M12 1v3.5H8.5M4 15v-3.5h3.5"/>'),
eye:_i('<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>'),
copy:_i('<rect x="5.5" y="5.5" width="9" height="9" rx="1.5"/><path d="M10.5 5.5v-3a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h3"/>'),
chev:'<svg width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5"/></svg>',
};
`;
