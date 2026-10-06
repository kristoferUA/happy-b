(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
  let paused = motionQuery.matches;
  let starFrame = 0;
  let confettiFrame = 0;
  let confettiParticles = [];
  const starCanvas = $('starfield');
  const starCtx = starCanvas.getContext('2d');
  const confettiCanvas = $('confetti');
  const confettiCtx = confettiCanvas.getContext('2d');
  let width = innerWidth, height = innerHeight;
  let stars = [];
  let pointer = { x: 0, y: 0 };

  function resize() {
    width = innerWidth; height = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    for (const canvas of [starCanvas, confettiCanvas]) {
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    stars = Array.from({length: Math.min(160, Math.round(width * height / 6500))}, () => ({
      x: Math.random() * width, y: Math.random() * height, radius: Math.random() * 1.1 + .3,
      phase: Math.random() * Math.PI * 2, speed: Math.random() * .0005 + .0003,
      depth: Math.random() * 12
    }));
    if (paused) drawStars(0);
  }
  function drawStars(time) {
    if (!starCtx) return;
    starCtx.clearRect(0, 0, width, height);
    for (const star of stars) {
      const alpha = .2 + (Math.sin(time * star.speed + star.phase) + 1) * .27;
      starCtx.fillStyle = `rgba(201,221,255,${alpha})`;
      starCtx.beginPath();
      starCtx.arc(star.x + pointer.x * star.depth, star.y + pointer.y * star.depth, star.radius, 0, Math.PI * 2);
      starCtx.fill();
    }
    // A quiet shooting star passes across the starfield every fourteen seconds.
    const phase = time % 14000;
    if (!paused && phase > 11000 && phase < 11900) {
      const progress = (phase - 11000) / 900;
      const x = width * (.65 - .35 * progress), y = height * (.12 + .28 * progress);
      const gradient = starCtx.createLinearGradient(x, y, x + 100, y - 55);
      gradient.addColorStop(0, `rgba(244,203,155,${Math.sin(progress * Math.PI)})`);
      gradient.addColorStop(1, 'rgba(244,203,155,0)');
      starCtx.strokeStyle = gradient; starCtx.lineWidth = 1.2;
      starCtx.beginPath(); starCtx.moveTo(x,y); starCtx.lineTo(x + 100,y - 55); starCtx.stroke();
    }
  }
  function animateStars(time) {
    drawStars(time);
    if (!paused && !document.hidden) starFrame = requestAnimationFrame(animateStars);
  }
  function clearConfetti() {
    cancelAnimationFrame(confettiFrame); confettiFrame = 0;
    confettiParticles = [];
    if (confettiCtx) confettiCtx.clearRect(0, 0, width, height);
  }
  function syncMotion() {
    paused = motionQuery.matches;
    document.documentElement.classList.toggle('motion-paused', paused);
    cancelAnimationFrame(starFrame);
    if (paused) { drawStars(0); clearConfetti(); }
    else if (!document.hidden) starFrame = requestAnimationFrame(animateStars);
  }
  motionQuery.addEventListener('change', syncMotion);
  addEventListener('resize', resize, {passive:true});
  addEventListener('pointermove', (event) => {
    if (!paused && event.pointerType === 'mouse') pointer = {x:event.clientX/width-.5,y:event.clientY/height-.5};
  }, {passive:true});
  document.addEventListener('visibilitychange', () => {
    cancelAnimationFrame(starFrame);
    if (!document.hidden && !paused) starFrame = requestAnimationFrame(animateStars);
    if (document.hidden) clearConfetti();
  });
  resize(); syncMotion();

  if ('IntersectionObserver' in window) {
    document.documentElement.classList.add('js-ready');
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('visible'); observer.unobserve(entry.target);
      }
    }, {threshold:.08});
    document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
  }

  const letter = window.birthdayLetter || {};
  const paragraphs = Array.isArray(letter.paragraphs) ? letter.paragraphs.filter((text) => typeof text === 'string' && text.trim()) : [];
  for (const text of paragraphs) {
    const paragraph = document.createElement('p'); paragraph.textContent = text;
    $('personalMessage').append(paragraph);
  }
  $('blankLetter').hidden = paragraphs.length > 0;
  const signature = typeof letter.signature === 'string' ? letter.signature.trim() : '';
  $('personalSignature').textContent = signature;
  $('personalSignature').hidden = !signature;

  const dialog = $('letterDialog');
  const closeLetter = () => dialog.close();
  $('openLetter').addEventListener('click', () => {
    dialog.showModal(); document.body.style.overflow = 'hidden';
    $('closeLetter').focus({preventScroll:true});
  });
  $('closeLetter').addEventListener('click', closeLetter);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) closeLetter();
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = '';
    $('openLetter').focus({preventScroll:true});
  });

  function burst() {
    if (paused || !confettiCtx) return;
    clearConfetti();
    const colors = ['#f0b779','#ffe9ba','#8ac9ff','#dfebfa','#c79362'];
    confettiParticles = Array.from({length:width < 700 ? 100 : 170}, () => {
      const side = Math.random() > .5;
      return {x:side ? width*.9 : width*.1, y:height*.72,
        vx:(side?-1:1)*(Math.random()*8+2), vy:-Math.random()*12-5,
        size:Math.random()*5+3, angle:Math.random()*6.28, spin:(Math.random()-.5)*.14,
        color:colors[Math.floor(Math.random()*colors.length)], life:1, star:Math.random()<.2};
    });
    let previousTime = 0; let startedAt = 0;
    function render(time) {
      if (!startedAt) startedAt = time;
      const delta = Math.min((time - (previousTime || time))/16.67, 2);
      previousTime = time;
      confettiCtx.clearRect(0,0,width,height);
      for (const p of confettiParticles) {
        p.x += p.vx*delta; p.y += p.vy*delta; p.vy += .16*delta; p.vx *= .997;
        p.angle += p.spin*delta; p.life = Math.max(0, 1-(time-startedAt)/5500);
        confettiCtx.save(); confettiCtx.translate(p.x,p.y); confettiCtx.rotate(p.angle);
        confettiCtx.globalAlpha = Math.min(1,p.life*3); confettiCtx.fillStyle = p.color;
        if (p.star) {
          confettiCtx.beginPath();
          for (let j=0;j<8;j++) { const radius = j%2 ? p.size*.28 : p.size; const angle=j*Math.PI/4;
            confettiCtx.lineTo(Math.cos(angle)*radius,Math.sin(angle)*radius); }
          confettiCtx.closePath(); confettiCtx.fill();
        } else confettiCtx.fillRect(-p.size/2,-p.size/3,p.size,p.size*.65);
        confettiCtx.restore();
      }
      if (time-startedAt < 5500 && !paused) confettiFrame = requestAnimationFrame(render);
      else clearConfetti();
    }
    confettiFrame = requestAnimationFrame(render);
  }
  let candleLit = true;
  function blow() {
    if (!candleLit) return;
    candleLit = false; document.querySelector('.cake-scene').classList.add('candle-out');
    $('cakeButton').setAttribute('aria-label', 'Свічку задмухнуто. Запалити її ще раз');
    $('wishStatus').textContent = 'Бажання вирушило до зірок. З днем народження, Іване!';
    $('blowButton').hidden = true; $('relightButton').hidden = false;
    if (document.activeElement === $('blowButton')) $('relightButton').focus({preventScroll:true});
    burst();
  }
  function relight() {
    candleLit = true; document.querySelector('.cake-scene').classList.remove('candle-out');
    $('cakeButton').setAttribute('aria-label', 'Задмухнути свічку та запустити конфеті');
    $('wishStatus').innerHTML = 'Заплющ очі. Збережи бажання в таємниці.<br>А потім натисни на свічку.';
    $('blowButton').hidden = false; $('relightButton').hidden = true;
    if (document.activeElement === $('relightButton')) $('blowButton').focus({preventScroll:true});
    clearConfetti();
  }
  $('cakeButton').addEventListener('click', () => candleLit ? blow() : relight());
  $('blowButton').addEventListener('click', blow);
  $('relightButton').addEventListener('click', relight);
})();
