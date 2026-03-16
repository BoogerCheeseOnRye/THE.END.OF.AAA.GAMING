export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `<div id="loading-container" style="position:absolute;inset:0;width:100vw;height:100vh;perspective:3200px;overflow:hidden"></div>`;

  const container = document.getElementById('loading-container');

  // === 3D ANGELIC CSS INJECT (exact OG nucleus + tilted rings + individual dance) ===
  const style = document.createElement('style');
  style.textContent = `
    #loading-container { perspective:3200px; }
    .nucleus { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%) scale(0); width:168px; height:268px; background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff); clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%); box-shadow:0 0 90px #fff,0 0 240px #00ffff,inset 0 0 120px #ffff00; animation:nucleusPulse 1.6s ease-in-out forwards; z-index:10; }
    @keyframes nucleusPulse { to { transform:translate(-50%,-50%) scale(1); box-shadow:0 0 120px #fff,0 0 360px #ffff00,inset 0 0 180px #00ffff; } }
    .nucleus::before,.nucleus::after { content:''; position:absolute; inset:0; background:inherit; clip-path:inherit; animation:facetSwirl 2.6s ease-in-out infinite alternate; opacity:0.65; }
    @keyframes facetSwirl { 0%{transform:scale(1) rotate(0deg);filter:hue-rotate(0deg)} 100%{transform:scale(1.28) rotate(42deg);filter:hue-rotate(260deg)} }
    .ring-group { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); transform-style:preserve-3d; }
    .crystal { position:absolute; width:38px; height:38px; background:conic-gradient(currentColor,#fff,currentColor); clip-path:polygon(50% 6%,88% 29%,94% 55%,82% 84%,50% 95%,18% 84%,6% 55%,13% 29%); box-shadow:0 0 16px #fff,0 0 38px currentColor; animation:faceCycle 1.3s linear infinite,crystalWobble 0.9s ease-in-out infinite alternate; transform-style:preserve-3d; }
    @keyframes faceCycle { 0%{filter:hue-rotate(0deg)} 100%{filter:hue-rotate(360deg)} }
    @keyframes crystalWobble { 0%{transform:rotateY(0deg) rotateX(0deg)} 100%{transform:rotateY(18deg) rotateX(12deg)} }
  `;
  document.head.appendChild(style);

  // CENTRAL NUCLEUS POPS FIRST (exact OG style, dramatic pop)
  const nucleus = document.createElement('div');
  nucleus.className = 'nucleus';
  container.appendChild(nucleus);

  // WAIT FOR POP THEN FLY-INS + RING FORMATION
  setTimeout(() => {
    const colors = ['#00f0ff','#ff00cc','#ccff00','#00ff88','#ff0088'];
    const tilts = [8, 34, 52, 71, 89];
    const speeds = [12.4, 15.8, 19.2, 23.6, 28.1]; // outer rings faster
    const radii = [195, 275, 355, 445, 535];

    // 340 flying crystals — spawn from edges + behind camera
    for (let i = 0; i < 340; i++) {
      const fly = document.createElement('div');
      fly.className = 'crystal';
      fly.style.color = colors[i % 5];
      fly.style.left = `${Math.random() * 100}vw`;
      fly.style.top = `${Math.random() * 100}vh`;
      fly.style.transform = `translateZ(-1200px) scale(0.15)`;
      fly.style.opacity = '0';
      container.appendChild(fly);

      setTimeout(() => {
        fly.style.transition = `all ${1.6 + Math.random() * 1.1}s cubic-bezier(0.23,1,0.32,1)`;
        fly.style.opacity = '1';
        fly.style.transform = `translateZ(0) scale(1)`;
      }, i * 6);
    }

    // after fly-ins converge → form the 5 tilted rings
    setTimeout(() => {
      for (let r = 0; r < 5; r++) {
        const ringGroup = document.createElement('div');
        ringGroup.className = 'ring-group';
        ringGroup.style.width = ringGroup.style.height = `${radii[r]}px`;
        ringGroup.style.transform = `translate(-50%,-50%) rotateX(${tilts[r]}deg)`;
        ringGroup.style.animation = `ringRotate ${speeds[r]}s linear infinite`;
        container.appendChild(ringGroup);

        // assign 68 crystals per ring with dance
        for (let i = 0; i < 68; i++) {
          const crystal = document.createElement('div');
          crystal.className = 'crystal';
          crystal.style.color = colors[r % 5];
          crystal.style.left = '50%';
          crystal.style.top = '50%';
          crystal.style.transform = `rotate(${i * (360/68)}deg) translateX(${radii[r]/2}px) rotateY(92deg)`;
          ringGroup.appendChild(crystal);
        }
      }
    }, 2200);
  }, 900);

  // auto to bloody menu after full dance
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 9800);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
