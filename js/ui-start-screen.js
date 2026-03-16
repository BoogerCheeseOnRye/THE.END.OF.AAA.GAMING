export function createStartScreen() {
    const screen = document.getElementById('start-screen');
    screen.innerHTML = `
        <div id="game-title">THE.END.OF.AAA.GAMING</div>
        <div class="title-button" onclick="startGame()">TO VALHALLA</div>
    `;
    // blood drips spawn every 300ms
}
