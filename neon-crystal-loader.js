export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `<div id="loading-container" style="position:absolute;inset:0;width:100vw;height:100vh;perspective:2200px;overflow:hidden"></div>`;

  const container = document.getElementById('loading-container');

  // === INJECT EXACT OG + ATOMIC UPGRADE CSS ===
  const style = document.createElement('style');
  style.textContent = `
    #loading-container { perspective:2200px; }
    .nucleus { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:128px; height:248px; background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff); clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%); box-shadow:0 0 80px #fff,0 0 180px #00ffff,inset 0 0 90px #ffff00; animation:nucleusSpin 24s linear infinite,nucleusPulse 1.8s ease-in-out infinite alternate; z-index:10; }
    @keyframes nucleusSpin { from{transform:translate(-50%,-50%) rotateY(0deg)} to{transform:translate(-50%,-50%) rotateY(360deg)} }
    @keyframes nucleusPulse { from{filter:brightness(1) hue-rotate(0deg);box-shadow:0 0 80px #fff,0 0 180px #00ffff} to{filter:brightness(3) hue-rotate(360deg);box-shadow:0 0 240px #fff,0 0 380px #ffff00,inset 0 0 160px #00ffff} }
    .nucleus::before,.nucleus::after { content:''; position:absolute; inset:0; background:inherit; clip-path:inherit; animation:facetSwirl 2.8s ease-in-out infinite alternate; opacity:0.6; }
    @keyframes facetSwirl { 0%{transform:scale(1) rotate(0deg);filter:hue-rotate(0deg)} 100%{transform:scale(1.25) rotate(48deg);filter:hue-rotate(280deg)} }

    .crystal { position:absolute; width:42px; height:42px; background:conic-gradient(currentColor,#fff,currentColor); clip-path:polygon(50% 6%,88% 29%,94% 55%,82% 84%,50% 95%,18% 84%,6% 55%,13% 29%); box-shadow:0 0 18px #fff,0 0 42px currentColor; animation:faceCycle 1.4s linear infinite,orbitSpin var(--orbit-speed) linear infinite; }
    @keyframes faceCycle { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
    @keyframes orbitSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
  `;
  document.head.appendChild(style);

  // BIG CENTRAL NUCLEUS (exact OG but atomic-sized)
  const nucleus = document.createElement('div');
  nucleus.className = 'nucleus';
  container.appendChild(nucleus);

  // 320+ colorful crystals — fly in wide from edges + settle into wide elliptical shells
  const colors = ['#00f0ff','#ff00cc','#ccff00','#00ff88','#ff0088','#8800ff'];
  const shellRadii = [180, 260, 340, 430, 520]; // wide spread across full screen
  const shellSpeeds = ['9.2s', '14.8s', '11.3s', '18.7s', '7.9s'];

  for (let shell = 0; shell < 5; shell++) {
    for (let i = 0; i < 64; i++) { // 320 total
      const crystal = document.createElement('div');
      crystal.className = 'crystal';
      crystal.style.color = colors[(shell + i) % colors.length];
      crystal.style.setProperty('--orbit-speed', shellSpeeds[shell]);
      crystal.style.left = `${Math.random() * 100}vw`;
      crystal.style.top = `${-80 - Math.random() * 120}px`; // fly in from top + random edges
      container.appendChild(crystal);

      // wide fly-in then orbital lock
      setTimeout(() => {
        const angle = i * (360 / 64) + shell * 22;
        const radius = shellRadii[shell] + Math.random() * 38;
        crystal.style.transition = `all ${1.4 + Math.random() * 0.9}s cubic-bezier(0.23,1,0.32,1)`;
        crystal.style.left = `calc(50% + ${Math.cos(angle * Math.PI / 180) * radius}px)`;
        crystal.style.top = `calc(50% + ${Math.sin(angle * Math.PI / 180) * radius * 0.68}px)`; // elliptical wide
      }, i * 8 + shell * 120);
    }
  }

  // auto → menu after 9.8s (faster + dramatic)
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 9800);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
