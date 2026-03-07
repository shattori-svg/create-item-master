/**
 * 多言語切り替え（基本設計書 8）
 * 初期表示は日本語。
 */
let currentLang = 'ja';
let messages = { ja: {}, th: {} };

export async function initI18n() {
  const [ja, th] = await Promise.all([
    fetch('/src/locales/ja.json').then((r) => r.json()),
    fetch('/src/locales/th.json').then((r) => r.json()),
  ]);
  messages.ja = ja;
  messages.th = th;
  return messages;
}

export function setLanguage(lang) {
  if (lang !== 'ja' && lang !== 'th') return;
  currentLang = lang;
  document.documentElement.lang = lang === 'ja' ? 'ja' : 'th';
  applyToPage();
}

export function t(key) {
  const parts = key.split('.');
  let v = messages[currentLang];
  for (const p of parts) {
    v = v?.[p];
  }
  return v != null ? String(v) : key;
}

function applyToPage() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (el.tagName === 'BUTTON' || el.tagName === 'INPUT' && el.type === 'submit') {
      el.textContent = t(key);
    } else if (el.tagName === 'LABEL' && !el.querySelector('input')) {
      el.textContent = t(key);
    } else {
      const target = el.getAttribute('data-i18n-target') ? el.querySelector(el.getAttribute('data-i18n-target')) : el;
      if (target && target.placeholder !== undefined) target.placeholder = t(key);
      else if (target) target.textContent = t(key);
    }
  });
}

export function getLang() {
  return currentLang;
}
