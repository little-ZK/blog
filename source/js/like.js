// 文章点赞功能 —— 前端逻辑（兼容 pjax）
// 与 Cloudflare Pages Functions /api/like 交互
(function () {
  'use strict';

  function getCurrentPath() {
    // 文章页路径，如 /2026/10/17/hello-world/
    return window.location.pathname;
  }

  // 点亮/熄灭按钮样式
  function render(btn, count, liked) {
    var badge = btn.querySelector('.like-count');
    if (badge) badge.textContent = count;
    btn.classList.toggle('liked', !!liked);
    btn.setAttribute('aria-pressed', liked ? 'true' : 'false');
  }

  // 初始化某个点赞按钮：加载计数
  function loadCount(btn) {
    var container = btn.closest('.post-like-wrap');
    var path = getCurrentPath();
    fetch('/api/like?path=' + encodeURIComponent(path))
      .then(function (res) {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then(function (data) {
        render(btn, data.count, data.liked);
        if (container) container.classList.add('loaded');
      })
      .catch(function () {
        // 查询失败（如未部署 Functions），隐藏按钮
        if (container) container.style.display = 'none';
      });
  }

  function like(btn) {
    if (btn.classList.contains('liked') || btn.classList.contains('processing')) return; // 每人一次
    var path = getCurrentPath();
    btn.classList.add('processing');
    fetch('/api/like?path=' + encodeURIComponent(path), { method: 'POST' })
      .then(function (res) {
        if (!res.ok) throw new Error('bad status');
        return res.json();
      })
      .then(function (data) {
        render(btn, data.count, data.liked);
        btn.classList.remove('processing');
      })
      .catch(function () {
        btn.classList.remove('processing');
      });
  }

  // 事件委托到 document，pjax 切换后依然有效
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.post-like-btn');
    if (btn) like(btn);
  });

  // pjax / 首次加载后初始化计数
  function bind() {
    var btns = document.querySelectorAll('.post-like-wrap .post-like-btn');
    btns.forEach(function (btn) {
      if (!btn.dataset.initialized) {
        btn.dataset.initialized = '1';
        loadCount(btn);
      }
    });
  }

  // 监听 pjax 完成事件（butterfly 主题）
  var pjaxReady = function () { bind(); };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  document.addEventListener('pjax:complete', pjaxReady);
})();
