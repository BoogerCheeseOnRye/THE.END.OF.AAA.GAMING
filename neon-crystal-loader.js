export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `
    <div id="loading-container" style="position:relative;width:620px;height:620px;perspective:1600px"></div>
    <div id="stage-text" style="margin-top:40px;font-size:26px;color:#00ffff;text-shadow:0 0 25px #00ffff"></div>
  `;

  const container = document.getElementById('loading-container');
  const stageText = document.getElementById('stage-text');

  // === UPGRADED TO 280+ GEOMETRIC SHAPES (exact prototype clip-path style) ===
  // 5 rings with 45-55 shapes each + 120 burst flyers
  const ringConfigs = [
    { radius: 88, count: 45, color: '#00f0ff', duration: 3.8 },
    { radius: 155, count: 52, color: '#ff00cc', duration: 6.2 },
    { radius: 228, count: 58, color: '#ccff00', duration: 9.8 },
    { radius: 305, count: 65, color: '#00ff88', duration: 13.2 },
    { radius: 390, count: 72, color: '#ff0088', duration: 17.5 }
  ];

  ringConfigs.forEach((cfg, ringIdx) => {
    const ring = document.createElement('div');
    ring.style.position = 'absolute';
    ring.style.left = '50%'; ring.style.top = '50%';
    ring.style.transform = 'translate(-50%, -50%)';
    ring.style.width = ring.style.height = `${cfg.radius * 2}px`;
    ring.style.border = '2.5px solid rgba(255,255,255,0.12)';
    ring.style.borderRadius = '50%';
    ring.style.animation = `ringOrbit ${cfg.duration}s linear infinite`;
    container.appendChild(ring);

    for (let i = 0; i < cfg.count; i++) {
      const shape = document.createElement('div');
      shape.className = 'loading-shape';
      shape.style.setProperty('--orbit-radius', `${cfg.radius}px`);
      shape.style.setProperty('--start-angle', `${(i * (360 / cfg.count)) + (Math.random()*12 - 6)}deg`);
      shape.style.color = cfg.color;
      // exact prototype crystal geometry
      shape.style.clipPath = 'polygon(50% 6%, 88% 29%, 94% 55%, 82% 84%, 50% 95%, 18% 84%, 6% 55%, 13% 29%)';
      shape.style.background = 'conic-gradient(currentColor, #ffffff, currentColor)';
      shape.style.boxShadow = '0 0 12px #fff, 0 0 28px currentColor, 0 0 62px currentColor, inset 0 0 24px rgba(255,255,255,0.85)';
      ring.appendChild(shape);
    }
  });

  // extra 120 flying burst particles (10x sauce)
  for (let i = 0; i < 120; i++) {
    const p = document.createElement('div');
    p.className = 'loading-shape';
    p.style.width = p.style.height = '18px';
    p.style.left = `${Math.random()*620}px`;
    p.style.top = '-80px';
    p.style.opacity = '0';
    container.appendChild(p);
    setTimeout(() => {
      p.style.transition = `all ${0.9 + Math.random()}s cubic-bezier(0.68,-0.55,0.27,1.55)`;
      p.style.left = `${280 + Math.random()*60}px`;
      p.style.top = `${180 + Math.random()*260}px`;
      p.style.opacity = '1';
    }, i * 12);
  }

  stageText.textContent = "NEON CRYSTALS ALIGNING...";
  setTimeout(() => stageText.textContent = "MULTIVERSE NODES PULSING", 1400);
  setTimeout(() => stageText.textContent = "GAMESIR READY • RT TO BLAST", 3200);

  // auto hide + transition to menu (no blood here)
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 9200);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
