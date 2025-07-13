// Tiny helper to show/hide nav on small screens
document.getElementById('navToggle').addEventListener('click', () => {
  document.getElementById('siteNav').classList.toggle('open');
});

// PROJECT-LEVEL toggles
document.querySelectorAll('.project-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const project = btn.closest('.project');
    const isOpen = project.classList.toggle('open');
    btn.setAttribute('aria-expanded', isOpen);
  });
});