export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `<div id="loading-container" style="position:absolute;inset:0;width:100vw;height:100vh;perspective:2800px;overflow:hidden"></div>`;

  const container = document.getElementById('loading-container');

  // === FULL 3D ANGELIC WHEELS CSS (exact OG nucleus + tilted rings + Z-depth) ===
  const style = document.createElement('style');
  style.textContent = `
    #loading-container { perspective:2800px; }
    .nucleus { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:148px; height:248px; background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff); clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%); box-shadow:0 0 80px #fff,0 0 220px #00ffff,inset 0 0 110px #ffff00; animation:nucleusSpin 24s linear infinite,nucleusPulse 1.8s ease-in-out infinite alternate; z-index:10; }
    @keyframes nucleusSpin { from{transform:translate(-50%,-50%) rotateY(0deg) rotateX(8deg)} to{transform:translate(-50%,-50%) rotateY(360deg) rotateX(8deg)} }
    @keyframes nucleusPulse { from{filter:brightness(1) hue-rotate(0deg);box-shadow:0 0 80px #fff,0 0 220px #00ffff} to{filter:brightness(3.2) hue-rotate(360deg);box-shadow:0 0 280px #fff,0 0 420px #ffff00,inset 0 0 180px #00ffff} }
    .ring-group { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); transform-style:preserve-3d; }
    .crystal { position:absolute; width:42px; height:42px; background:conic-gradient(currentColor,#fff,currentColor); clip-path:polygon(50% 6%,88% 29%,94% 55%,82% 84%,50% 95%,18% 84%,6% 55%,13% 29%); box-shadow:0 0 18px #fff,0 0 42px currentColor; animation:faceCycle 1.35s linear infinite; transform-style:preserve-3d; }
    @keyframes faceCycle { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
  `;
  document.head.appendChild(style);

  // BIG CENTRAL NUCLEUS (exact old prototype but bigger + stronger glow)
  const nucleus = document.createElement('div');
  nucleus.className = 'nucleus';
  container.appendChild(nucleus);

  // 5 tilted angelic rings (different axes + outer rings faster)
  const tilts = [12, 38, 55, 72, 88];        // different rotateX for 3D wheel-within-wheel depth
  const speeds = [11, 14.5, 17.8, 21.5, 26]; // outer rings noticeably faster
  const radii = [210, 290, 370, 460, 550];

  for (let r = 0; r < 5; r++) {
    const ringGroup = document.createElement('div');
    ringGroup.className = 'ring-group';
    ringGroup.style.width = ringGroup.style.height = `${radii[r]}px`;
    ringGroup.style.transform = `translate(-50%,-50%) rotateX(${tilts[r]}deg)`;
    ringGroup.style.animation = `ringRotate ${speeds[r]}s linear infinite`;
    container.appendChild(ringGroup);

    // 64+ colorful “eyes” per ring
    for (let i = 0; i < 64; i++) {
      const crystal = document.createElement('div');
      crystal.className = 'crystal';
      crystal.style.color = ['#00f0ff','#ff00cc','#ccff00','#00ff88','#ff0088'][r % 5];
      crystal.style.left = '50%';
      crystal.style.top = '50%';
      crystal.style.transform = `rotate(${i * (360/64)}deg) translateX(${radii[r]/2}px) rotateY(90deg) translateZ(${Math.random()*40 - 20}px)`;
      ringGroup.appendChild(crystal);
    }
  }

  // dramatic 3D fly-ins from sides + behind + over shoulder (Z-depth)
  for (let i = 0; i < 120; i++) {
    const fly = document.createElement('div');
    fly.className = 'crystal';
    fly.style.color = '#ffff00';
    fly.style.left = `${Math.random()*100}vw`;
    fly.style.top = `${Math.random()*100}vh`;
    fly.style.transform = `translateZ(-800px) scale(0.2)`;
    fly.style.opacity = '0';
    container.appendChild(fly);
    setTimeout(() => {
      fly.style.transition = `all ${1.8 + Math.random()*1.2}s cubic-bezier(0.23,1,0.32,1)`;
      fly.style.opacity = '1';
      fly.style.transform = `translateZ(0) scale(1)`;
    }, i * 7);
  }

  // auto to menu after 9.8s (faster dramatic build-up)
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 9800);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
