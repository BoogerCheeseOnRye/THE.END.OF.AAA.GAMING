export class UIManager {
    constructor() {
        this.overlay = document.getElementById('overlay');
        this.loading = document.getElementById('loading-screen');
        // paste all your OG neon-crystal-loader animation logic here + blood drip spawner
        // exact #overlay HTML with TO VALHALLA + FAUXPVP + VOID ARCHIVES + HALL OF VALOR buttons
        // checkboxes (hardcore/tips/music) + save icon
        // coward-screen, honor-screen, health crystals, stamina, XP wave, hotbar
    }
    showLoading() { this.loading.classList.remove('hidden'); }
    hideLoading() { this.loading.classList.add('hidden'); }
    startGame(hardcore, tips, music) {
        this.overlay.classList.add('hidden');
        // trigger pointerlock + multiverse sky + acid enemies
    }
}
