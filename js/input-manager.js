export class InputManager {
    constructor(camera, player) {
        this.keys = {}; this.mouse = {x:0,y:0}; this.gamepads = [];
        this.pointerLocked = false;

        document.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        document.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);

        // mouse look + pointerlock (fixed)
        document.addEventListener('mousemove', e => {
            if (this.pointerLocked) {
                camera.rotation.y -= e.movementX * 0.002;
                camera.rotation.x = Math.max(-1.5, Math.min(1.5, camera.rotation.x - e.movementY * 0.002));
            }
        });
        document.addEventListener('click', () => document.body.requestPointerLock());

        // GameSir / any gamepad (native, no libs)
        window.addEventListener('gamepadconnected', e => {
            this.gamepads[e.gamepad.index] = e.gamepad;
            console.log('GameSir connected 🔥');
        });
        window.addEventListener('gamepaddisconnected', e => delete this.gamepads[e.gamepad.index]);
    }

    update(delta, playerPos) {
        // keyboard fallback
        if (this.keys['w']) playerPos.z -= 40 * delta;
        if (this.keys['s']) playerPos.z += 40 * delta;
        if (this.keys['a']) playerPos.x -= 40 * delta;
        if (this.keys['d']) playerPos.x += 40 * delta;

        // Gamepad (Gamesir sticks + buttons)
        this.gamepads.forEach(gp => {
            if (!gp) return;
            const lx = gp.axes[0], ly = gp.axes[1];
            if (Math.abs(lx) > 0.1) playerPos.x += lx * 50 * delta;
            if (Math.abs(ly) > 0.1) playerPos.z += ly * 50 * delta;

            if (gp.buttons[0].pressed) playerPos.y += 30 * delta; // A jump
            if (gp.buttons[7].value > 0.5) console.log('ATTACK - RT pressed'); // right trigger
        });
    }
}
