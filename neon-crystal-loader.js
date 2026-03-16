export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `<div id="loading-container" style="position:relative;width:620px;height:620px;margin:auto;perspective:1600px"></div>`;

  const container = document.getElementById('loading-container');

  // === EXACT OG CSS INJECTED (from prototype.html + ncl.js) ===
  const style = document.createElement('style');
  style.textContent = `
    #loading-container { perspective:1600px; }
    .loading-shape { position:absolute; width:54px; height:54px; background:conic-gradient(currentColor,#fff,currentColor); clip-path:polygon(50% 6%,88% 29%,94% 55%,82% 84%,50% 95%,18% 84%,6% 55%,13% 29%); box-shadow:0 0 12px #fff,0 0 28px currentColor,0 0 62px currentColor,inset 0 0 24px rgba(255,255,255,0.85); filter:drop-shadow(0 0 22px currentColor); animation:shapeSpin 2.75s linear infinite; }
    @keyframes shapeSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
    #central-crystal { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:92px; height:195px; background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff); clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%); box-shadow:0 0 40px #fff,0 0 90px #00ffff,inset 0 0 60px #ffff00; animation:crystalRotateSmooth 18s linear infinite,crystalGlow 2.2s ease-in-out infinite alternate; z-index:10; }
    @keyframes crystalRotateSmooth { from{transform:translate(-50%,-50%) rotateY(0deg)} to{transform:translate(-50%,-50%) rotateY(360deg)} }
    @keyframes crystalGlow { from{filter:brightness(1) hue-rotate(0deg);box-shadow:0 0 40px #fff,0 0 90px #00ffff} to{filter:brightness(2.2) hue-rotate(360deg);box-shadow:0 0 90px #fff,0 0 160px #ffff00,inset 0 0 110px #00ffff} }
    #central-crystal::before,#central-crystal::after { content:''; position:absolute; inset:0; background:inherit; clip-path:inherit; animation:facetSwirl 3.1s ease-in-out infinite alternate; opacity:0.55; }
    #central-crystal::before { animation-delay:0.4s; transform:scale(1.12) rotate(12deg); }
    #central-crystal::after  { animation-delay:0.9s; transform:scale(0.88) rotate(-12deg); }
    @keyframes facetSwirl { 0%{transform:scale(1) rotate(0deg);filter:hue-rotate(0deg)} 100%{transform:scale(1.18) rotate(32deg);filter:hue-rotate(240deg)} }
  `;
  document.head.appendChild(style);

  // central crystal (exact OG)
  const crystal = document.createElement('div');
  crystal.id = 'central-crystal';
  container.appendChild(crystal);

  // 280+ orbiting crystals (10x OG) — rings invisible paths only
  const colors = ['#00f0ff','#ff00cc','#ccff00','#00ff88','#ff0088'];
  const counts = [45,52,58,65,72];
  let total = 0;
  for (let r = 0; r < 5; r++) {
    const radius = 88 + r * 67;
    for (let i = 0; i < counts[r]; i++) {
      const shape = document.createElement('div');
      shape.className = 'loading-shape';
      shape.style.color = colors[r % colors.length];
      shape.style.setProperty('--orbit-radius', `${radius}px`);
      shape.style.setProperty('--start-angle', `${(i * 360 / counts[r]) + (Math.random()*12-6)}deg`);
      shape.style.left = '50%'; shape.style.top = '50%';
      container.appendChild(shape);
      total++;
    }
  }

  // flying burst (extra 120 from edges)
  for (let i = 0; i < 120; i++) {
    const f = document.createElement('div');
    f.className = 'loading-shape';
    f.style.left = `${Math.random()*620}px`; f.style.top = '-80px';
    f.style.opacity = '0';
    container.appendChild(f);
    setTimeout(() => {
      f.style.transition = `all ${0.8 + Math.random()}s cubic-bezier(0.68,-0.55,0.27,1.55)`;
      f.style.left = '310px'; f.style.top = `${180 + Math.random()*260}px`;
      f.style.opacity = '1';
    }, i * 9);
  }

  // auto finish after 9.2s (faster than OG)
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 9200);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
