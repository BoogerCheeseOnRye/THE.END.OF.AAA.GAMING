export function createStartScreen() {
  const screen = document.getElementById('overlay');
  if (!screen) {
    console.error("overlay div not found — check index.html");
    return;
  }
  screen.innerHTML = `
    <div id="game-title">THE.END.OF.AAA.GAMING</div>
    <div class="title-button" onclick="window.startGame()">TO VALHALLA</div>
  `;
  // blood drips (exact from your prototype.html)
  for (let i = 0; i < 12; i++) {
    const drop = document.createElement('div');
    drop.className = 'blood-drop';
    drop.style.left = Math.random() * 100 + 'vw';
    drop.style.animationDuration = (Math.random() * 800 + 800) + 'ms';
    drop.style.animationDelay = Math.random() * 600 + 'ms';
    screen.appendChild(drop);
  }
  console.log("✅ pixel-perfect start screen loaded (matches prototype.html)");
}
