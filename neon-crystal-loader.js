export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `
    <div id="loading-container">
      <div id="rings-container"></div>
      <div id="central-crystal"></div>
    </div>
    <div class="onboarding-text" id="stage-text"></div>
  `;

  const container = document.getElementById('loading-container');
  const rings = document.getElementById('rings-container');
  const crystal = document.getElementById('central-crystal');
  const stageText = document.getElementById('stage-text');

  // 28 neon crystals (3x prototype) + spiral particles
  const crystals = [];
  for (let i = 0; i < 28; i++) {
    const c = document.createElement('div');
    c.className = `loading-shape shape-${i % 9}`;
    c.style.left = `${Math.random()*100}vw`;
    c.style.top = `-100px`;
    container.appendChild(c);
    crystals.push(c);
  }

  // stage 1: crystal drop + faster orbits (1.8s spin vs prototype 11s)
  stageText.textContent = "NEON CRYSTALS ALIGNING...";
  let idx = 0;
  const drop = setInterval(() => {
    if (idx >= crystals.length) { clearInterval(drop); arrangeCrystals(); return; }
    const c = crystals[idx];
    c.style.transition = 'all 0.9s cubic-bezier(0.68,-0.55,0.27,1.55)';
    c.style.left = `${200 + Math.random()*240}px`;
    c.style.top = `${140 + Math.random()*260}px`;
    c.style.opacity = 1;
    idx++;
  }, 80);

  function arrangeCrystals() {
    // 4 rings (more than prototype) with faster rotation
    [70, 130, 190, 250].forEach((radius, ring) => {
      crystals.slice(ring*7, (ring+1)*7).forEach((c, i) => {
        const angle = (i * (360/7)) * Math.PI / 180 + ring*0.8;
        const x = Math.cos(angle) * radius + 310;
        const y = Math.sin(angle) * radius + 310;
        c.style.transition = `all ${1.4 - ring*0.2}s cubic-bezier(0.23,1,0.32,1)`;
        c.style.left = `${x}px`;
        c.style.top = `${y}px`;
      });
    });

    // spiral particle bursts (extra sauce)
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'loading-shape';
      p.style.background = '#ffff00';
      p.style.width = p.style.height = '6px';
      p.style.left = '310px'; p.style.top = '310px';
      container.appendChild(p);
      setTimeout(() => {
        const a = Math.random()*Math.PI*2;
        p.style.transition = 'all 1.8s linear';
        p.style.left = `${310 + Math.cos(a)*280}px`;
        p.style.top = `${310 + Math.sin(a)*280}px`;
        p.style.opacity = 0;
      }, i*60);
    }

    // stage 2: controls hint
    setTimeout(() => {
      stageText.textContent = "WASD / GameSir sticks • RT to blast";
    }, 2800);

    // stage 3: title reveal + checkboxes
    setTimeout(() => {
      stageText.innerHTML = `THE.END.OF.AAA.GAMING<br><span style="font-size:18px">HARDCORE? TIPS? MUSIC?</span>`;
      crystal.style.animation = 'crystalRotateSmooth 9s linear infinite, crystalGlow 1.1s ease-in-out infinite alternate';
    }, 6200);

    // stage 4: final flash + blood drips + hide
    setTimeout(() => {
      stageText.textContent = "ENTER THE MULTIVERSE";
      for (let i = 0; i < 22; i++) {
        const drop = document.createElement('div');
        drop.className = 'blood-drop';
        drop.style.left = Math.random()*100 + 'vw';
        drop.style.animationDuration = (800 + Math.random()*900) + 'ms';
        loading.appendChild(drop);
      }
      setTimeout(() => {
        loading.classList.add('hidden');
        window.startGame();
      }, 2200);
    }, 11000);
  }

  // click to skip (like prototype)
  loading.onclick = () => {
    loading.classList.add('hidden');
    window.startGame();
  };
}
