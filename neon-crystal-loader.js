export default async function runOnboarding() {
  const loading = document.getElementById('loading-screen');
  if (!loading) return;
  loading.classList.remove('hidden');
  loading.innerHTML = `<div id="loading-container" style="position:absolute;inset:0;width:100vw;height:100vh;perspective:3200px;overflow:hidden;background:#000"></div>`;

  const container = document.getElementById('loading-container');

  // OG central crystal pop (exact prototype style)
  setTimeout(() => {
    const nucleus = document.createElement('div');
    nucleus.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(0);width:148px;height:248px;background:conic-gradient(#ff00ff,#00ffff,#ffff00,#00ff88,#ff0088,#0088ff,#8800ff,#ff00ff);clip-path:polygon(50% 0%,85% 20%,100% 50%,85% 80%,50% 100%,15% 80%,0% 50%,15% 20%);box-shadow:0 0 80px #fff,0 0 220px #00ffff;animation:nucleusPop 2s ease-out forwards;z-index:5;`;
    container.appendChild(nucleus);
  }, 2000);

  // 12 blobby vertices with AcidDreamEnemy-style blobbing
  const vertices = [];
  const colors = ['#00ffff','#ff00ff','#ffff00','#00ff88'];
  let delay = 4200;

  for (let i = 0; i < 12; i++) {
    setTimeout(() => {
      const v = document.createElement('div');
      v.className = 'blobby-vertex';
      v.style.color = colors[i % 4];
      v.style.left = `${Math.random() * 100}vw`;
      v.style.top = `${Math.random() * 100}vh`;
      v.style.transform = `translateZ(-1200px) scale(0.2)`;
      container.appendChild(v);
      vertices.push(v);

      // Enemy-style blobbing fly-in + lock
      let t = 0;
      const offset = Math.random() * 20;
      const targetX = (Math.random() - 0.5) * 340;
      const targetY = (Math.random() - 0.5) * 260;
      const targetZ = (Math.random() - 0.5) * 120;

      const interval = setInterval(() => {
        t += 0.05;
        const progress = Math.min(t / 2.4, 1);
        const mx = Math.sin(t * 4.1 + offset) * 12;
        const my = Math.cos(t * 3.3 + offset) * 8;
        const scale = 0.8 + Math.sin(t * 6 + offset) * 0.22;
        v.style.left = `calc(50% + ${targetX * progress + mx}px)`;
        v.style.top = `calc(50% + ${targetY * progress + my}px)`;
        v.style.transform = `translateZ(${targetZ * progress}px) scale(${scale})`;
        if (progress >= 1) clearInterval(interval);
      }, 16);
    }, delay);
    delay += 680;
  }

  // After all locked → slow rotation + continuous blobbing (like enemies)
  setTimeout(() => {
    // keep every vertex blobbing forever
    let globalT = 0;
    setInterval(() => {
      globalT += 0.05;
      vertices.forEach((v, i) => {
        const offset = i * 3;
        const scale = 1 + Math.sin(globalT * 5 + offset) * 0.18;
        v.style.transform = `scale(${scale})`;
      });
    }, 16);
  }, 10500);

  // full formed shape then menu
  setTimeout(() => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  }, 13800);

  loading.onclick = () => {
    loading.classList.add('hidden');
    window.showMenuWithBlood();
  };
}
