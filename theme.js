/**
 * 纸盒人网站 — 主题切换系统
 * 在深色赛博科技 / 白色科技感 之间切换
 * 偏好保存在 localStorage，所有页面共享
 */
(function () {
  'use strict';

  const STORAGE_KEY = 'zhir_theme';
  const THEME_DARK = 'dark';
  const THEME_LIGHT = 'light';

  // ----- 读取已保存的主题 -----
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === THEME_DARK || saved === THEME_LIGHT) return saved;
    } catch (e) { /* localStorage 不可用 */ }
    return null;
  }

  // ----- 应用主题 -----
  function setTheme(theme) {
    const html = document.documentElement;
    if (theme === THEME_LIGHT) {
      html.setAttribute('data-theme', THEME_LIGHT);
    } else {
      html.removeAttribute('data-theme');
    }
    // 更新按钮图标
    const btn = document.getElementById('themeToggle');
    if (btn) {
      btn.innerHTML = theme === THEME_LIGHT
        ? '<i class="fas fa-moon"></i>'
        : '<i class="fas fa-sun"></i>';
      btn.setAttribute('aria-label', theme === THEME_LIGHT ? '切换到深色模式' : '切换到亮色模式');
    }
    // 持久化
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  // ----- 切换 -----
  function toggleTheme() {
    const html = document.documentElement;
    const isLight = html.getAttribute('data-theme') === THEME_LIGHT;
    setTheme(isLight ? THEME_DARK : THEME_LIGHT);
  }

  // ----- 创建切换按钮 -----
  function createToggleButton() {
    if (document.getElementById('themeToggle')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggle';
    btn.style.cssText = [
      'position:fixed',
      'bottom:24px',
      'right:24px',
      'z-index:999',
      'width:44px',
      'height:44px',
      'border-radius:50%',
      'border:1px solid var(--border-glass)',
      'background:var(--bg-glass-strong)',
      'backdrop-filter:blur(12px)',
      '-webkit-backdrop-filter:blur(12px)',
      'color:var(--text-secondary)',
      'font-size:1.15rem',
      'cursor:pointer',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'box-shadow:0 4px 16px rgba(0,0,0,0.15),0 0 10px rgba(0,212,255,0.05)'
    ].join(';');

    btn.addEventListener('click', toggleTheme);

    // 初始图标与当前主题匹配
    const isLight = document.documentElement.getAttribute('data-theme') === THEME_LIGHT;
    btn.innerHTML = isLight ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
    btn.setAttribute('aria-label', isLight ? '切换到深色模式' : '切换到亮色模式');

    document.body.appendChild(btn);
  }

  // ----- 设置当前年份 -----
  function setCurrentYear() {
    const el = document.getElementById('cyear');
    if (el) el.textContent = String(new Date().getFullYear());
  }

  // ----- 初始化 -----
  function init() {
    setCurrentYear();
    const saved = getSavedTheme();
    if (saved) {
      setTheme(saved);
    } else {
      setTheme(THEME_DARK);
    }
    createToggleButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
