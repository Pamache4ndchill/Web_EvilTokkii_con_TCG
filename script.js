const root = document.documentElement;
const themeToggle = document.querySelector('[data-theme-toggle]');
const modal = document.querySelector('[data-modal]');
const openButtons = document.querySelectorAll('[data-open-modal]');
const closeButton = document.querySelector('[data-close-modal]');

let theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
root.dataset.theme = theme;

themeToggle?.addEventListener('click', () => {
  theme = theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = theme;
  themeToggle.textContent = theme === 'dark' ? '☾' : '☀';
  themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro');
});

openButtons.forEach((button) => button.addEventListener('click', () => modal?.showModal()));
closeButton?.addEventListener('click', () => modal?.close());
modal?.addEventListener('click', (event) => {
  if (event.target === modal) modal.close();
});

document.querySelectorAll('.nav a').forEach((link) => {
  link.addEventListener('click', () => {
    document.querySelectorAll('.nav a').forEach((item) => item.classList.remove('active'));
    link.classList.add('active');
  });
});
