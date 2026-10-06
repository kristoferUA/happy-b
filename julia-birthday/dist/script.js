(() => {
  'use strict';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.getElementById('letterDialog');
  const cakeButton = document.getElementById('cakeButton');
  const relightButton = document.getElementById('relightButton');
  const status = document.getElementById('wishStatus');
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  let motionEnabled = !reducedMotion.matches;
  let opener = null;
  let pieces = [];
  let frame = 0;
  let lastTime = 0;

  const letter = window.birthdayLetter || { paragraphs: [], signature: '' };
  const paragraphs = Array.isArray(letter.paragraphs) ? letter.paragraphs.filter(text => typeof text === 'string' && text.trim()) : [];
  const message = document.getElementById('personalMessage');
  for (const text of paragraphs) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(paragraph);
  }
  document.getElementById('blankLetter').hidden = paragraphs.length > 0;
  document.getElementById('personalSignature').textContent = typeof letter.signature === 'string' ? letter.signature : '';

  function openLetter(event) {
    opener = event.currentTarget;
    if (dialog.open) return;
    dialog.showModal();
    celebrate(40, innerWidth / 2, innerHeight * .35);
  }
  document.querySelectorAll('[data-open-letter]').forEach(button => button.addEventListener('click', openLetter));
  document.getElementById('closeLetter').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    const bounds = dialog.getBoundingClientRect();
    if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
  });
  dialog.addEventListener('close', () => { if (opener) opener.focus({ preventScroll: true }); });

  cakeButton.addEventListener('click', () => {
    if (cakeButton.classList.contains('is-out')) return;
    cakeButton.classList.add('is-out');
    cakeButton.disabled = true;
    cakeButton.setAttribute('aria-label', 'Свічку задмухнуто. Бажання загадано!');
    cakeButton.querySelector('.cake-lit').alt = '';
    cakeButton.querySelector('.cake-out').alt = 'Святковий торт із задмухнутою свічкою';
    cakeButton.querySelector('.cake-out').removeAttribute('aria-hidden');
    status.textContent = 'Бажання загадано. Нехай здійсниться!';
    relightButton.hidden = false;
    const rect = cakeButton.getBoundingClientRect();
    celebrate(180, rect.left + rect.width / 2, rect.top + rect.height * .12);
    relightButton.focus({ preventScroll: true });
  });
  relightButton.addEventListener('click', () => {
    cakeButton.classList.remove('is-out');
    cakeButton.disabled = false;
    cakeButton.setAttribute('aria-label', 'Задмухнути свічку й запустити конфеті');
    cakeButton.querySelector('.cake-lit').alt = 'Ніжний святковий торт з однією запаленою свічкою';
    cakeButton.querySelector('.cake-out').alt = '';
    cakeButton.querySelector('.cake-out').setAttribute('aria-hidden', 'true');
    status.textContent = 'Натисни на торт, щоб задмухнути свічку.';
    relightButton.hidden = true;
    cakeButton.focus({ preventScroll: true });
  });

  function resizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function stopConfetti() {
    cancelAnimationFrame(frame);
    frame = 0;
    pieces = [];
    if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function celebrate(count, x, y) {
    if (!ctx || !motionEnabled || document.hidden) return;
    const colors = ['#781e36', '#b34c67', '#e2a8b1', '#c49656', '#edd2a8', '#fff9ee'];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 3 + Math.random() * 9;
      pieces.push({ x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity - 5, color: colors[i % colors.length], size: 4 + Math.random() * 5, spin: (Math.random() - .5) * .18, rotation: Math.random() * 6, age: 0, life: 150 + Math.random() * 45 });
    }
    pieces = pieces.slice(-360);
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(draw); }
  }
  function draw(time) {
    const dt = Math.min((time - lastTime) / 16.667, 2);
    lastTime = time;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(p => p.age < p.life && p.y < innerHeight + 30);
    for (const p of pieces) {
      p.age += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += .15 * dt; p.vx *= Math.pow(.993, dt); p.rotation += p.spin * dt;
      ctx.save(); ctx.globalAlpha = Math.min(1, (p.life - p.age) / 35); ctx.translate(p.x, p.y); ctx.rotate(p.rotation); ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); ctx.restore();
    }
    if (pieces.length) frame = requestAnimationFrame(draw); else { frame = 0; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  function updateMotion() {
    document.body.classList.toggle('motion-paused', !motionEnabled);
    if (!motionEnabled) stopConfetti();
  }
  reducedMotion.addEventListener('change', event => { motionEnabled = !event.matches; updateMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopConfetti(); });
  window.addEventListener('resize', resizeCanvas);
  if ('IntersectionObserver' in window) {
    document.body.classList.add('js-ready');
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: .1 });
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }
  resizeCanvas(); updateMotion();
  setTimeout(() => celebrate(60, innerWidth * .65, 30), 900);
})();
