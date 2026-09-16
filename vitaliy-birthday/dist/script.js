document.documentElement.classList.add("js-ready");

const cakeColumn = document.querySelector("#cakeColumn");
const cakeButton = document.querySelector("#cakeButton");
const micButton = document.querySelector("#micButton");
const micButtonLabel = micButton.querySelector("span");
const tapBlowButton = document.querySelector("#tapBlowButton");
const wishStatus = document.querySelector("#wishStatus");
const cardButton = document.querySelector("#cardButton");
const cakeHint = document.querySelector(".cake-hint");
const soundToggle = document.querySelector("#soundToggle");
const cardDialog = document.querySelector("#cardDialog");
const dialogClose = document.querySelector("#dialogClose");
const envelopeStage = document.querySelector("#envelopeStage");
const openEnvelopeButton = document.querySelector("#openEnvelopeButton");
const letter = document.querySelector("#letter");
const confettiCanvas = document.querySelector("#confetti");
const confettiContext = confettiCanvas.getContext("2d");

let hasBlown = false;
let soundEnabled = true;
let audioContext;
let mediaStream;
let microphoneAnimation;

function getAudioContext() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (Context) audioContext = new Context();
  }
  return audioContext;
}

function playCelebrationTone() {
  if (!soundEnabled) return;
  const context = getAudioContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  const notes = [392, 493.88, 587.33, 783.99];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const startsAt = context.currentTime + index * 0.09;
    oscillator.type = index === notes.length - 1 ? "sine" : "triangle";
    oscillator.frequency.setValueAtTime(frequency, startsAt);
    gain.gain.setValueAtTime(0.0001, startsAt);
    gain.gain.exponentialRampToValueAtTime(0.1, startsAt + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + 0.7);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start(startsAt);
    oscillator.stop(startsAt + 0.72);
  });
}

function stopMicrophone() {
  if (microphoneAnimation) cancelAnimationFrame(microphoneAnimation);
  microphoneAnimation = undefined;
  if (mediaStream) mediaStream.getTracks().forEach((track) => track.stop());
  mediaStream = undefined;
  micButton.classList.remove("is-listening");
}

async function startListening() {
  if (hasBlown) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    wishStatus.textContent = "Мікрофон недоступний — задуй свічку дотиком";
    return;
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const context = getAudioContext();
    const source = context.createMediaStreamSource(mediaStream);
    const analyser = context.createAnalyser();
    const samples = new Uint8Array(analyser.fftSize);
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.45;
    source.connect(analyser);

    micButton.classList.add("is-listening");
    micButtonLabel.textContent = "Слухаю… дмухай!";
    wishStatus.textContent = "Загадай бажання й подуй у мікрофон";

    let loudSince = 0;
    const warmupUntil = performance.now() + 700;
    const listen = (now) => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const sample of samples) {
        const normalized = (sample - 128) / 128;
        energy += normalized * normalized;
      }
      const volume = Math.sqrt(energy / samples.length);

      if (now > warmupUntil && volume > 0.115) {
        if (!loudSince) loudSince = now;
        if (now - loudSince > 170) {
          blowCandle("microphone");
          return;
        }
      } else {
        loudSince = 0;
      }
      microphoneAnimation = requestAnimationFrame(listen);
    };
    microphoneAnimation = requestAnimationFrame(listen);
  } catch (error) {
    stopMicrophone();
    micButtonLabel.textContent = "Спробувати ще раз";
    wishStatus.textContent = "Доступ не надано — задуй свічку дотиком";
  }
}

function blowCandle(source) {
  if (hasBlown) return;
  hasBlown = true;
  stopMicrophone();
  cakeColumn.classList.add("is-blown");
  micButton.disabled = true;
  micButton.hidden = true;
  tapBlowButton.hidden = true;
  cardButton.disabled = false;
  wishStatus.textContent = "Бажання загадано. Нехай обов’язково здійсниться ✦";
  cakeHint.innerHTML = '<span class="pulse-dot"></span> Бажання вже летить до зірок';
  launchConfetti(source === "microphone" ? 190 : 150);
  playCelebrationTone();
}

function sizeConfettiCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  confettiCanvas.width = Math.floor(window.innerWidth * ratio);
  confettiCanvas.height = Math.floor(window.innerHeight * ratio);
  confettiCanvas.style.width = `${window.innerWidth}px`;
  confettiCanvas.style.height = `${window.innerHeight}px`;
  confettiContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function launchConfetti(count) {
  sizeConfettiCanvas();
  const colors = ["#f4c66f", "#fff3c8", "#2470ff", "#78a7ff", "#ffffff"];
  const particles = Array.from({ length: count }, () => ({
    x: window.innerWidth * (0.42 + Math.random() * 0.28),
    y: window.innerHeight * (0.32 + Math.random() * 0.18),
    size: 4 + Math.random() * 7,
    vx: (Math.random() - 0.5) * 15,
    vy: -7 - Math.random() * 12,
    gravity: 0.22 + Math.random() * 0.13,
    rotation: Math.random() * Math.PI,
    spin: (Math.random() - 0.5) * 0.32,
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 1,
  }));

  const startedAt = performance.now();
  const draw = (now) => {
    confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += particle.gravity;
      particle.vx *= 0.992;
      particle.rotation += particle.spin;
      if (now - startedAt > 1900) particle.opacity -= 0.015;

      confettiContext.save();
      confettiContext.globalAlpha = Math.max(0, particle.opacity);
      confettiContext.translate(particle.x, particle.y);
      confettiContext.rotate(particle.rotation);
      confettiContext.fillStyle = particle.color;
      confettiContext.fillRect(-particle.size / 2, -particle.size / 4, particle.size, particle.size / 2);
      confettiContext.restore();
    });

    if (particles.some((particle) => particle.opacity > 0 && particle.y < window.innerHeight + 40)) {
      requestAnimationFrame(draw);
    } else {
      confettiContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }
  };
  requestAnimationFrame(draw);
}

function openCard() {
  if (!hasBlown) return;
  envelopeStage.classList.remove("is-opening", "is-hidden");
  letter.classList.remove("is-visible");
  cardDialog.showModal();
  openEnvelopeButton.focus();
}

function revealLetter() {
  if (envelopeStage.classList.contains("is-opening")) return;
  envelopeStage.classList.add("is-opening");
  setTimeout(() => {
    envelopeStage.classList.add("is-hidden");
    letter.classList.add("is-visible");
    letter.querySelector("h2").focus?.();
  }, 820);
}

function closeCard() {
  cardDialog.close();
  cardButton.focus();
}

micButton.addEventListener("click", startListening);
tapBlowButton.addEventListener("click", () => blowCandle("touch"));
cakeButton.addEventListener("click", () => blowCandle("touch"));
cardButton.addEventListener("click", openCard);
openEnvelopeButton.addEventListener("click", revealLetter);
dialogClose.addEventListener("click", closeCard);

cardDialog.addEventListener("click", (event) => {
  if (event.target === cardDialog) closeCard();
});

cardDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeCard();
});

soundToggle.addEventListener("click", () => {
  soundEnabled = !soundEnabled;
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
  soundToggle.setAttribute("aria-label", soundEnabled ? "Вимкнути звукові ефекти" : "Увімкнути звукові ефекти");
  soundToggle.style.opacity = soundEnabled ? "1" : "0.46";
});

if (window.matchMedia("(pointer: fine)").matches && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  cakeColumn.addEventListener("pointermove", (event) => {
    if (hasBlown) return;
    const bounds = cakeColumn.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width - 0.5;
    const y = (event.clientY - bounds.top) / bounds.height - 0.5;
    cakeButton.style.transform = `translateY(${1 + y * 0.35}rem) rotateX(${-y * 3}deg) rotateY(${x * 4}deg)`;
  });
  cakeColumn.addEventListener("pointerleave", () => {
    cakeButton.style.transform = "";
  });
}

window.addEventListener("resize", sizeConfettiCanvas, { passive: true });
window.addEventListener("beforeunload", stopMicrophone);
