'use strict';
(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.querySelector('#letter-dialog');
  const envelope = document.querySelector('.envelope');
  const closeLetter = document.querySelector('#close-letter');
  const message = document.querySelector('#personal-message');
  const signature = document.querySelector('#personal-signature');
  const letter = window.birthdayLetter || {};
  const paragraphs = Array.isArray(letter.paragraphs) ? letter.paragraphs.filter(p => typeof p === 'string' && p.trim()) : [];
  for (const text of paragraphs) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.append(paragraph);
  }
  document.querySelector('#blank-letter').hidden = paragraphs.length > 0;
  if (typeof letter.signature === 'string' && letter.signature.trim()) {
    signature.textContent = letter.signature;
    signature.hidden = false;
  }
  let lastOpener = null;
  let openingTimer = null;
  let oldOverflow = '';
  function openLetter(event) {
    if (dialog.open || openingTimer !== null) return;
    lastOpener = event.currentTarget;
    envelope.classList.add('is-opening');
    openingTimer = window.setTimeout(() => {
      openingTimer = null;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      dialog.scrollTop = 0;
    }, reducedMotion.matches ? 0 : 680);
  }
  document.querySelectorAll('[data-open-letter]').forEach(button => button.addEventListener('click', openLetter));
  closeLetter.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = oldOverflow;
    envelope.classList.remove('is-opening');
    lastOpener?.focus({ preventScroll: true });
  });

  const cake = document.querySelector('#cake-button');
  const blowButton = document.querySelector('#blow-button');
  const wishStatus = document.querySelector('#wish-status');
  let candleLit = true;
  function toggleCandle() {
    candleLit = !candleLit;
    cake.classList.toggle('is-out', !candleLit);
    blowButton.replaceChildren(document.createTextNode(candleLit ? 'Задмухнути свічку ' : 'Запалити ще раз '));
    const icon = document.createElement('span');
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = candleLit ? '✧' : '↻';
    blowButton.append(icon);
    cake.setAttribute('aria-label', candleLit ? 'Задмухнути свічку й запустити конфеті' : 'Запалити свічку ще раз');
    wishStatus.textContent = candleLit ? 'Свічка знову горить. Можна загадати ще одне!' : 'Бажання загадано. Одарко, з твоїм днем!';
    if (!candleLit) celebrate();
  }
  cake.addEventListener('click', toggleCandle);
  blowButton.addEventListener('click', toggleCandle);

  const canvas = document.querySelector('#confetti');
  const context = canvas.getContext('2d');
  const celebrationStatus = document.querySelector('#celebration-status');
  const colors = ['#c75146', '#edce7d', '#b8a6cf', '#f8f4e9', '#6f947b'];
  let particles = [];
  let frame = 0;
  let lastTime = 0;
  let statusTimer;
  function resizeCanvas() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * scale);
    canvas.height = Math.round(innerHeight * scale);
    if (context) context.setTransform(scale, 0, 0, scale, 0, 0);
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas, { passive: true });
  function celebrate() {
    celebrationStatus.textContent = 'З днем народження, Одарко! Святкове конфеті!';
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => { celebrationStatus.textContent = ''; }, 2200);
    if (!context) return;
    if (reducedMotion.matches) {
      context.clearRect(0, 0, innerWidth, innerHeight);
      for (let i = 0; i < 32; i++) {
        context.fillStyle = colors[i % colors.length];
        context.fillRect(Math.random() * innerWidth, Math.random() * innerHeight, 6, 9);
      }
      setTimeout(() => context.clearRect(0, 0, innerWidth, innerHeight), 650);
      return;
    }
    const count = innerWidth < 700 ? 100 : 180;
    for (let i = 0; i < count; i++) {
      const left = i % 2 === 0;
      particles.push({ x: left ? innerWidth * .06 : innerWidth * .94, y: innerHeight * .68,
        vx: (left ? 1 : -1) * (2 + Math.random() * 9), vy: -7 - Math.random() * 12,
        rotation: Math.random() * Math.PI * 2, spin: (Math.random() - .5) * .24,
        size: 4 + Math.random() * 5, color: colors[i % colors.length], life: 0, round: i % 5 === 0 });
    }
    particles = particles.slice(-600);
    if (!frame) { lastTime = performance.now(); frame = requestAnimationFrame(drawConfetti); }
  }
  function drawConfetti(time) {
    const delta = Math.min((time - lastTime) / 16.667, 2);
    lastTime = time;
    context.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(particle => particle.life < 240 && particle.y < innerHeight + 35);
    for (const particle of particles) {
      particle.life += delta;
      particle.x += particle.vx * delta;
      particle.y += particle.vy * delta;
      particle.vy += .18 * delta;
      particle.vx *= Math.pow(.992, delta);
      particle.rotation += particle.spin * delta;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = Math.min(1, (240 - particle.life) / 40);
      context.fillStyle = particle.color;
      if (particle.round) { context.beginPath(); context.ellipse(0, 0, particle.size, particle.size * .45, 0, 0, Math.PI * 2); context.fill(); }
      else context.fillRect(-particle.size / 2, -particle.size, particle.size, particle.size * 1.8 * Math.cos(particle.rotation));
      context.restore();
    }
    frame = particles.length ? requestAnimationFrame(drawConfetti) : 0;
  }
  document.querySelectorAll('[data-confetti]').forEach(button => button.addEventListener('click', celebrate));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; particles = []; context?.clearRect(0, 0, innerWidth, innerHeight); }
  });
  reducedMotion.addEventListener('change', () => {
    cancelAnimationFrame(frame); frame = 0; particles = []; context?.clearRect(0, 0, innerWidth, innerHeight);
  });
  if ('IntersectionObserver' in window && !reducedMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); } });
    }, { threshold: .12 });
    document.documentElement.classList.add('js-ready');
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
  }
})();
