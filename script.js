const canvas = document.querySelector("#confetti");
const context = canvas.getContext("2d");
const envelope = document.querySelector(".envelope");
const letter = document.querySelector(".letter-card");
const closeLetter = document.querySelector(".letter-card__close");
const letterBackdrop = document.querySelector(".letter-backdrop");
const cake = document.querySelector(".cake");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let pieces = [];
let frameId = 0;

function resizeCanvas() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * ratio;
  canvas.height = window.innerHeight * ratio;
  canvas.style.width = `${window.innerWidth}px`;
  canvas.style.height = `${window.innerHeight}px`;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function makeConfetti(amount = 110, originX = window.innerWidth / 2, originY = window.innerHeight * 0.3) {
  if (reducedMotion.matches) return;
  const colors = ["#e990a9", "#f3c4cf", "#8f72b5", "#c6b4dc", "#d5aa72", "#fff4bd"];
  for (let index = 0; index < amount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    pieces.push({
      x: originX,
      y: originY,
      width: 5 + Math.random() * 7,
      height: 3 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      velocityX: Math.cos(angle) * speed,
      velocityY: Math.sin(angle) * speed - 5,
      gravity: .18 + Math.random() * .09,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - .5) * .25,
      life: 130 + Math.random() * 70,
      opacity: 1,
    });
  }
  if (!frameId) animateConfetti();
}

function animateConfetti() {
  context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  pieces = pieces.filter((piece) => piece.life > 0 && piece.y < window.innerHeight + 40);

  pieces.forEach((piece) => {
    piece.x += piece.velocityX;
    piece.y += piece.velocityY;
    piece.velocityY += piece.gravity;
    piece.velocityX *= .992;
    piece.rotation += piece.rotationSpeed;
    piece.life -= 1;
    piece.opacity = Math.min(1, piece.life / 35);

    context.save();
    context.globalAlpha = piece.opacity;
    context.translate(piece.x, piece.y);
    context.rotate(piece.rotation);
    context.fillStyle = piece.color;
    context.fillRect(-piece.width / 2, -piece.height / 2, piece.width, piece.height);
    context.restore();
  });

  if (pieces.length) {
    frameId = requestAnimationFrame(animateConfetti);
  } else {
    frameId = 0;
    context.clearRect(0, 0, window.innerWidth, window.innerHeight);
  }
}

function openLetter() {
  envelope.setAttribute("aria-expanded", "true");
  letter.setAttribute("aria-hidden", "false");
  letter.classList.add("is-open");
  document.body.classList.add("has-letter");
  closeLetter.focus();
  const rect = envelope.getBoundingClientRect();
  makeConfetti(45, rect.left + rect.width / 2, rect.top + rect.height / 2);
}

function hideLetter() {
  envelope.setAttribute("aria-expanded", "false");
  letter.setAttribute("aria-hidden", "true");
  letter.classList.remove("is-open");
  document.body.classList.remove("has-letter");
  envelope.focus();
}

envelope.addEventListener("click", openLetter);
closeLetter.addEventListener("click", hideLetter);
letterBackdrop.addEventListener("click", hideLetter);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && letter.classList.contains("is-open")) hideLetter();
});

cake.addEventListener("click", () => {
  const rect = cake.getBoundingClientRect();
  cake.classList.add("is-wished");
  cake.setAttribute("aria-label", "Свічку задмухнуто — бажання загадано");
  cake.querySelector(".cake__hint").textContent = "бажання загадано";
  makeConfetti(180, rect.left + rect.width / 2, rect.top + rect.height * .2);
});

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
window.setTimeout(() => makeConfetti(70, window.innerWidth / 2, -10), 850);
