document.addEventListener('DOMContentLoaded', () => {
  const normalizePath = (path) => {
    if (!path || path === '/') return '/index.html';
    return path.toLowerCase();
  };

  document.body.classList.add('js-enabled');

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  const currentPath = normalizePath(window.location.pathname);
  document.querySelectorAll('nav a[href]').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href.startsWith('http') || href.startsWith('#')) return;
    const resolved = new URL(href, window.location.href);
    if (normalizePath(resolved.pathname) === currentPath) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });

  const sections = document.querySelectorAll('section');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    sections.forEach((sec) => {
      sec.style.opacity = 1;
      sec.style.transform = 'none';
    });
    return;
  }

  const onScroll = () => {
    sections.forEach((sec) => {
      const top = sec.getBoundingClientRect().top;
      const windowH = window.innerHeight || document.documentElement.clientHeight;
      if (top < windowH - 100) {
        sec.classList.add('is-visible');
      }
    });
  };

  window.addEventListener('scroll', onScroll);
  onScroll();
});
