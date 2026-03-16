export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `
    <div id="loading-container" style="position:relative;width:620px;height:620px"></div>
    <div id="stage-text" style="margin-top:40px;font-size:26px;color:#00ffff;text-shadow:0 0 25px #00ffff"></div>
  `;

  const container = document.getElementById('loading-container');
  const stageText = document.getElementById('stage-text');

  // 28 neon crystals (way more than prototype, faster orbits)
  for (let i = 0; i < 28; i++) {
    const c = document.createElement('div');
    c.style.position = 'absolute';
    c.style.width = c.style.height = '22px';
    c.style.background = ['#00ffff','#ff00ff','#ffff00'][i%3];
    c.style.boxShadow = '0 0 22px currentColor';
    c.style.borderRadius = '4px';
    c.style.left = '310px';
    c.style.top = '310px';
    container.appendChild(c);

    setTimeout(() => {
      const radius = 85 + Math.floor(i/7)*58;
      const angle = (i % 7) * (Math.PI * 2 / 7) + i * 0.4;
      c.style.transition = `all ${1.05}s cubic-bezier(0.68,-0.55,0.27,1.55)`;
      c.style.left = `${310 + Math.cos(angle) * radius}px`;
      c.style.top = `${310 + Math.sin(angle) * radius}px`;
    }, i * 38);
  }

  stageText.textContent = "NEON CRYSTALS ALIGNING...";
  setTimeout(() => stageText.textContent = "MULTIVERSE NODES PULSING", 2200);
  setTimeout(() => stageText.textContent = "GAMESIR READY • RT TO BLAST", 4800);
  setTimeout(() => stageText.innerHTML = "THE.END.OF.AAA.GAMING<br><small>ENTER THE MULTIVERSE</small>", 8200);

  // spiral particles + final blood rain
  setTimeout(() => {
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.style.cssText = `position:absolute;width:5px;height:5px;background:#ffff00;left:310px;top:310px;`;
      container.appendChild(p);
      setTimeout(() => {
        const a = Math.random() * Math.PI * 2;
        p.style.transition = 'all 1.6s linear';
        p.style.left = `${310 + Math.cos(a) * 320}px`;
        p.style.top = `${310 + Math.sin(a) * 320}px`;
        p.style.opacity = '0';
      }, i * 55);
    }
  }, 6500);

  setTimeout(() => {
    for (let i = 0; i < 28; i++) {
      const drop = document.createElement('div');
      drop.className = 'blood-drop';
      drop.style.left = Math.random() * 100 + 'vw';
      drop.style.animationDuration = (700 + Math.random() * 600) + 'ms';
      loading.appendChild(drop);
    }
    setTimeout(() => { loading.classList.add('hidden'); }, 1600);
  }, 13000);

  // click anywhere to skip (exactly like old prototype)
  loading.onclick = () => loading.classList.add('hidden');
}
