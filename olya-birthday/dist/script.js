(() => {
  'use strict';
  document.documentElement.classList.add('js');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const dialog = document.getElementById('letter-dialog');
  const envelope = document.querySelector('.envelope');
  const openButtons = [...document.querySelectorAll('[data-open-letter]')];
  const cakeButton = document.getElementById('cake-button');
  const blowButton = document.getElementById('blow-button');
  const relightButton = document.getElementById('relight-button');
  const wishStatus = document.getElementById('wish-status');
  const celebrationStatus = document.getElementById('celebration-status');
  let letterTrigger = null;
  let openingLetter = false;
  let candleLit = true;

  const letter = window.birthdayLetter || {};
  const paragraphs = Array.isArray(letter.paragraphs)
    ? letter.paragraphs.filter(value => typeof value === 'string' && value.trim()) : [];
  const message = document.getElementById('personal-message');
  for (const text of paragraphs) {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    message.appendChild(paragraph);
  }
  const signature = typeof letter.signature === 'string' ? letter.signature.trim() : '';
  document.getElementById('blank-letter').hidden = paragraphs.length > 0;
  const signatureElement = document.getElementById('personal-signature');
  signatureElement.textContent = signature;
  signatureElement.hidden = !signature;

  function openLetter(event) {
    if (openingLetter || dialog.open) return;
    openingLetter = true;
    letterTrigger = event.currentTarget;
    envelope.classList.add('is-opening');
    openButtons.forEach(button => button.setAttribute('aria-busy', 'true'));
    window.setTimeout(() => {
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      openingLetter = false;
      openButtons.forEach(button => button.removeAttribute('aria-busy'));
    }, motionPreference.matches ? 0 : 900);
  }
  openButtons.forEach(button => button.addEventListener('click', openLetter));
  document.getElementById('close-letter').addEventListener('click', () => dialog.close());
  let backdropPointer = false;
  function outsideDialog(event) {
    const bounds = dialog.getBoundingClientRect();
    return event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
  }
  dialog.addEventListener('pointerdown', event => { backdropPointer = outsideDialog(event); });
  dialog.addEventListener('click', event => {
    if (backdropPointer && outsideDialog(event)) dialog.close();
    backdropPointer = false;
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    envelope.classList.remove('is-opening');
    letterTrigger?.focus({ preventScroll: true });
  });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(element => observer.observe(element));
  } else {
    reveals.forEach(element => element.classList.add('is-visible'));
  }

  const canvas = document.getElementById('confetti');
  const context = canvas.getContext('2d');
  const colors = ['#344da2', '#b5c7e3', '#e4b044', '#bda9dc', '#efb2bd', '#fff3bf'];
  let particles = [];
  let frame = null;
  let lastTime = 0;
  let viewWidth = 0;
  let viewHeight = 0;
  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    viewWidth = window.innerWidth;
    viewHeight = window.innerHeight;
    canvas.width = Math.round(viewWidth * ratio);
    canvas.height = Math.round(viewHeight * ratio);
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function stopConfetti() {
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    lastTime = 0;
    particles = [];
    context?.clearRect(0, 0, viewWidth, viewHeight);
  }
  function drawConfetti(time) {
    const step = lastTime ? Math.min((time - lastTime) / 16.667, 2) : 1;
    lastTime = time;
    context.clearRect(0, 0, viewWidth, viewHeight);
    particles = particles.filter(particle => particle.life > 0 && particle.y < viewHeight + 40);
    for (const particle of particles) {
      particle.x += particle.vx * step;
      particle.y += particle.vy * step;
      particle.vy += 0.075 * step;
      particle.vx *= Math.pow(0.992, step);
      particle.rotation += particle.spin * step;
      particle.life -= step;
      context.save();
      context.translate(particle.x, particle.y);
      context.rotate(particle.rotation);
      context.globalAlpha = Math.min(particle.life / 35, 0.9);
      context.fillStyle = particle.color;
      if (particle.round) {
        context.beginPath();
        context.ellipse(0, 0, particle.size / 2, particle.size, 0, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size,
          particle.size * (0.55 + Math.abs(Math.cos(particle.rotation))));
      }
      context.restore();
    }
    if (particles.length) frame = requestAnimationFrame(drawConfetti);
    else stopConfetti();
  }
  function celebrate(originElement) {
    celebrationStatus.textContent = '';
    window.setTimeout(() => { celebrationStatus.textContent = 'З днем народження, Олю! Час святкувати!'; }, 30);
    if (motionPreference.matches || !context) return;
    const bounds = originElement?.getBoundingClientRect();
    const x = bounds ? bounds.left + bounds.width / 2 : viewWidth / 2;
    const y = bounds ? Math.max(40, Math.min(bounds.top + bounds.height / 3, viewHeight * 0.75)) : viewHeight * 0.35;
    const count = viewWidth < 760 ? 115 : 170;
    for (let i = 0; i < count; i++) {
      particles.push({ x, y, vx: (Math.random() - 0.5) * 13, vy: -3 - Math.random() * 9,
        rotation: Math.random() * Math.PI * 2, spin: (Math.random() - 0.5) * 0.14,
        size: 4 + Math.random() * 5, life: 180 + Math.random() * 50,
        color: colors[Math.floor(Math.random() * colors.length)], round: Math.random() < 0.25 });
    }
    particles = particles.slice(-350);
    if (frame === null) { lastTime = 0; frame = requestAnimationFrame(drawConfetti); }
  }
  document.querySelectorAll('[data-celebrate]').forEach(button => {
    button.addEventListener('click', () => celebrate(button));
  });
  function blowCandle() {
    if (!candleLit) { celebrate(cakeButton); return; }
    candleLit = false;
    cakeButton.classList.add('is-blown');
    cakeButton.setAttribute('aria-label', 'Свічку задмухнуто. Натисни для ще одного залпу конфеті');
    blowButton.textContent = 'Бажання загадано ✓';
    blowButton.disabled = true;
    relightButton.hidden = false;
    wishStatus.textContent = 'Свічку задмухнуто. Нехай бажання здійсниться!';
    celebrate(cakeButton);
  }
  blowButton.addEventListener('click', blowCandle);
  cakeButton.addEventListener('click', blowCandle);
  relightButton.addEventListener('click', () => {
    candleLit = true;
    cakeButton.classList.remove('is-blown');
    cakeButton.setAttribute('aria-label', 'Задмухнути свічку та запустити конфеті');
    blowButton.replaceChildren(document.createTextNode('Задмухнути свічку '));
    const star = document.createElement('span');
    star.textContent = '✧';
    star.setAttribute('aria-hidden', 'true');
    blowButton.appendChild(star);
    blowButton.disabled = false;
    relightButton.hidden = true;
    wishStatus.textContent = 'Свічка знову горить. Можна загадати ще одне бажання.';
    blowButton.focus({ preventScroll: true });
  });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopConfetti(); });
  motionPreference.addEventListener('change', event => { if (event.matches) stopConfetti(); });
  resizeCanvas();
})();
