// Optional support stays outside the tuner and disappears while listening.
(() => {
  const storageKey = 'tuner-support-dismissed-v1';
  try { if (sessionStorage.getItem(storageKey)) return; } catch (_) {}
  const original = document.querySelector('.footer .support-link');
  if (!original) return;

  const banner = document.createElement('aside');
  banner.className = 'support-banner is-hidden';
  banner.setAttribute('aria-label', 'Support this free tuner');
  const link = original.cloneNode(true);
  link.className = 'support-banner-link';
  const close = document.createElement('button');
  close.className = 'support-banner-close';
  close.type = 'button';
  close.setAttribute('aria-label', 'Dismiss support banner');
  close.textContent = '\u00d7';
  banner.append(link, close);
  document.body.append(banner);
  document.body.classList.add('has-support-banner');

  const tuner = document.querySelector('.tuner-card');
  const toggle = document.querySelector('#toggleButton');
  let dismissed = false;
  let frame = 0;
  function update() {
    frame = 0;
    if (dismissed) return;
    const box = banner.getBoundingClientRect();
    // Reserve the full banner height, including the phone's safe-area inset.
    const space = Math.ceil(box.height + innerHeight - box.bottom + 12) + 'px';
    if (document.body.style.getPropertyValue('--support-space') !== space) {
      document.body.style.setProperty('--support-space', space);
    }
    const tool = tuner && tuner.getBoundingClientRect();
    const overlaps = tool && tool.left < box.right + 12 && tool.right > box.left - 12 &&
      tool.top < box.bottom + 12 && tool.bottom > box.top - 12;
    const listening = toggle && toggle.getAttribute('aria-pressed') === 'true';
    const keyboard = window.visualViewport && innerHeight - window.visualViewport.height > 120;
    banner.classList.toggle('is-hidden', Boolean(overlaps || listening || keyboard));
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  close.addEventListener('click', () => {
    dismissed = true;
    try { sessionStorage.setItem(storageKey, '1'); } catch (_) {}
    // Keep keyboard users at the equivalent footer support link.
    if (document.activeElement === close) original.focus({ preventScroll: true });
    banner.remove();
    document.body.classList.remove('has-support-banner');
    document.body.style.removeProperty('--support-space');
  });
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', schedule);
  if (toggle) new MutationObserver(schedule).observe(toggle, { attributes: true, attributeFilter: ['aria-pressed'] });
  if (window.ResizeObserver) {
    const observer = new ResizeObserver(schedule);
    observer.observe(banner);
    if (tuner) observer.observe(tuner);
  }
  update();
})();
