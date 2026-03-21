#!/usr/bin/env node
/**
 * FauxPVP Game Server – Tribes-style authoritative arena server
 * Usage: node server.js [port]   (default: 7777)
 * Pkg:   pkg server.js --target node18-win-x64 -o server.exe
 *
 * Architecture: single Room per process (one hosted session per port).
 * Inputs are queued per player and consumed deterministically in the 40Hz tick.
 * Ghost broadcast is delta-only (only changed fields sent each tick).
 */

import { WebSocketServer, WebSocket } from 'ws';
import { networkInterfaces } from 'os';

const PORT = parseInt(process.argv[2] || process.env.PORT || '7777', 10);

// ── Constants ────────────────────────────────────────────────────────────────
const TICK_HZ        = 40;
const TICK_MS        = 1000 / TICK_HZ;
const MAX_INPUT_QUEUE = 8;      // max pending inputs per player
const MAX_PLAYERS    = 8;
const ARENA_SIZE     = 32;
const PLAYER_HEIGHT  = 1.8;
const PLAYER_RADIUS  = 0.5;
const PROJ_RADIUS    = 0.3;
const PROJ_SPEED     = 34;
const PROJ_DAMAGE    = 18;
const PROJ_LIFETIME  = 3.0;
const PLAYER_HP      = 100;
const RESPAWN_DELAY  = 3.0;
const COUNTDOWN_SEC  = 5;
const MATCH_DURATION = 300;
const ARENA_FLOOR_Y  = 1.5 + PLAYER_HEIGHT;   // 3.3
const MOVE_SPEED     = 8;
const JUMP_VEL       = 12;
const GRAVITY        = -22;

// ── Room ─────────────────────────────────────────────────────────────────────
function createRoom() {
    return {
        players:      new Map(),   // id -> Player
        projectiles:  new Map(),   // id -> Projectile
        state:        'lobby',
        tick:         0,
        countdownEnd: 0,
        matchStart:   0,
        matchEnd:     0,
        killFeed:     [],
        nextPlayerId: 1,
        nextProjId:   1,
        lastSnap:     new Map(),   // id -> last-sent snapshot (for delta compression)
    };
}

const ROOM = createRoom();

// ── Arena ─────────────────────────────────────────────────────────────────────
function buildArenaData() {
    const blocks = [];
    const S = ARENA_SIZE;
    for (let x = 0; x < S; x++) {
        for (let z = 0; z < S; z++) {
            blocks.push({ x, y: 0, z, hue: 0.6 + (((x + z) % 4) / 4) * 0.15 });
        }
    }
    for (let x = 0; x < S; x++) {
        for (let h = 1; h <= 2; h++) {
            blocks.push({ x, y: h, z: 0,     hue: 0.75 });
            blocks.push({ x, y: h, z: S - 1, hue: 0.75 });
        }
    }
    for (let z = 1; z < S - 1; z++) {
        for (let h = 1; h <= 2; h++) {
            blocks.push({ x: 0,     y: h, z, hue: 0.75 });
            blocks.push({ x: S - 1, y: h, z, hue: 0.75 });
        }
    }
    return blocks;
}

const ARENA_BLOCKS = buildArenaData();

function getSpawnPositions() {
    const S = ARENA_SIZE;
    const cx = S / 2, cz = S / 2;
    const r  = S / 2 - 4;
    return Array.from({ length: MAX_PLAYERS }, (_, i) => {
        const ang = (i / MAX_PLAYERS) * Math.PI * 2;
        return { x: cx + Math.cos(ang) * r, y: ARENA_FLOOR_Y, z: cz + Math.sin(ang) * r };
    });
}
const SPAWN_POSITIONS = getSpawnPositions();

// ── Helpers ───────────────────────────────────────────────────────────────────
function send(ws, obj) {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(obj));
}

function broadcast(room, obj, excludeId) {
    for (const p of room.players.values()) {
        if (excludeId !== undefined && p.id === excludeId) continue;
        send(p.ws, obj);
    }
}

function now() { return Date.now() / 1000; }

function getLanIPs() {
    const ips = [];
    const ifaces = networkInterfaces();
    for (const iface of Object.values(ifaces)) {
        for (const addr of iface) {
            if (addr.family === 'IPv4' && !addr.internal) ips.push(addr.address);
        }
    }
    return ips;
}

// ── Match lifecycle ───────────────────────────────────────────────────────────
function startCountdown(room) {
    if (room.state !== 'lobby') return;
    room.state        = 'countdown';
    room.countdownEnd = now() + COUNTDOWN_SEC;
    broadcast(room, { type: 'matchCountdown', endsAt: room.countdownEnd, sec: COUNTDOWN_SEC });
    console.log(`[Match] Countdown ${COUNTDOWN_SEC}s, players: ${room.players.size}`);
}

function startMatch(room) {
    room.state      = 'live';
    room.matchStart = now();
    room.matchEnd   = room.matchStart + MATCH_DURATION;
    room.killFeed   = [];
    room.lastSnap.clear();
    let spawnIdx = 0;
    for (const p of room.players.values()) {
        const sp = SPAWN_POSITIONS[spawnIdx++ % SPAWN_POSITIONS.length];
        Object.assign(p, {
            x: sp.x, y: sp.y, z: sp.z, vx: 0, vy: 0, vz: 0,
            hp: PLAYER_HP, alive: true, kills: 0, deaths: 0, respawnAt: 0
        });
        p.inputQueue = [];
    }
    broadcast(room, { type: 'matchStart', startedAt: room.matchStart, endsAt: room.matchEnd });
    console.log('[Match] Started!');
}

function endMatch(room) {
    if (room.state !== 'live') return;
    room.state = 'ended';
    const scores = [...room.players.values()]
        .map(p => ({ id: p.id, name: p.name, kills: p.kills, deaths: p.deaths }))
        .sort((a, b) => b.kills - a.kills);
    broadcast(room, { type: 'matchEnd', scores });
    console.log('[Match] Ended. Top:', scores[0]?.name || 'none');
}

function resetMatch(room) {
    room.state = 'lobby';
    room.projectiles.clear();
    room.lastSnap.clear();
    for (const p of room.players.values()) {
        Object.assign(p, { hp: PLAYER_HP, alive: true, kills: 0, deaths: 0, respawnAt: 0 });
        p.inputQueue = [];
    }
    broadcast(room, { type: 'matchReset' });
    console.log('[Match] Reset to lobby');
}

// ── Physics ───────────────────────────────────────────────────────────────────
function clampToArena(p) {
    const S = ARENA_SIZE;
    if (p.x < 0.6)     { p.x = 0.6;     p.vx = 0; }
    if (p.x > S - 0.6) { p.x = S - 0.6; p.vx = 0; }
    if (p.z < 0.6)     { p.z = 0.6;     p.vz = 0; }
    if (p.z > S - 0.6) { p.z = S - 0.6; p.vz = 0; }
    if (p.y <= ARENA_FLOOR_Y) { p.y = ARENA_FLOOR_Y; p.vy = 0; }
}

function applyInput(p, input) {
    if (!p.alive) return;
    const dt  = Math.min(input.dt || (1 / TICK_HZ), 0.1);
    const yaw = input.yaw || 0;

    const fwd   = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
    const right = { x:  Math.cos(yaw), z: -Math.sin(yaw) };
    let mx = 0, mz = 0;
    if (input.w) { mx += fwd.x;   mz += fwd.z;   }
    if (input.s) { mx -= fwd.x;   mz -= fwd.z;   }
    if (input.a) { mx -= right.x; mz -= right.z; }
    if (input.d) { mx += right.x; mz += right.z; }
    const len = Math.hypot(mx, mz);
    if (len > 0) { mx /= len; mz /= len; }
    const sp = input.shift ? MOVE_SPEED * 1.6 : MOVE_SPEED;
    p.vx = mx * sp;
    p.vz = mz * sp;

    const onGround = p.y <= ARENA_FLOOR_Y + 0.05;
    if (input.jump && onGround) p.vy = JUMP_VEL;
    p.vy += GRAVITY * dt;
    p.x  += p.vx * dt;
    p.y  += p.vy * dt;
    p.z  += p.vz * dt;
    p.yaw   = yaw;
    p.pitch = input.pitch || 0;
    clampToArena(p);
}

// ── Input queue: consumed in 40Hz tick ────────────────────────────────────────
function flushInputQueues(room) {
    for (const p of room.players.values()) {
        if (!p.inputQueue || p.inputQueue.length === 0) continue;
        // Process all queued inputs in order (deterministic)
        for (const inp of p.inputQueue) {
            applyInput(p, inp);
            p.lastInputSeq  = inp.seq;
            p.lastInputTime = now();
        }
        p.inputQueue = [];
    }
}

// ── Projectiles ───────────────────────────────────────────────────────────────
function spawnProjectile(room, player, msg) {
    if (!player.alive) return null;
    const id    = room.nextProjId++;
    const yaw   = msg.yaw   || 0;
    const pitch = msg.pitch || 0;
    const cy = Math.cos(pitch), sy = Math.sin(pitch);
    const dx = -Math.sin(yaw) * cy, dy = sy, dz = -Math.cos(yaw) * cy;
    const len = Math.hypot(dx, dy, dz) || 1;
    const proj = {
        id, ownerId: player.id,
        x: player.x, y: player.y + 0.6, z: player.z,
        dx: (dx / len) * PROJ_SPEED,
        dy: (dy / len) * PROJ_SPEED,
        dz: (dz / len) * PROJ_SPEED,
        damage: PROJ_DAMAGE, born: now(), seq: msg.seq || 0
    };
    room.projectiles.set(id, proj);
    return proj;
}

function tickProjectiles(room, dt) {
    const t = now();
    const toRemove  = [];
    const hitEvents = [];

    for (const [id, proj] of room.projectiles) {
        if (t - proj.born > PROJ_LIFETIME) { toRemove.push(id); continue; }
        proj.x += proj.dx * dt;
        proj.y += proj.dy * dt;
        proj.z += proj.dz * dt;
        const S = ARENA_SIZE;
        if (proj.x < 0 || proj.x > S || proj.z < 0 || proj.z > S || proj.y < 0 || proj.y > 20) {
            toRemove.push(id); continue;
        }
        for (const [pid, target] of room.players) {
            if (pid === proj.ownerId || !target.alive) continue;
            const dist = Math.hypot(
                proj.x - target.x,
                proj.y - (target.y - PLAYER_HEIGHT * 0.5),
                proj.z - target.z
            );
            if (dist < PLAYER_RADIUS + PROJ_RADIUS) {
                toRemove.push(id);
                target.hp -= proj.damage;
                const killed = target.hp <= 0;
                if (killed) {
                    target.alive     = false;
                    target.hp        = 0;
                    target.deaths   += 1;
                    target.respawnAt = t + RESPAWN_DELAY;
                    const atk = room.players.get(proj.ownerId);
                    if (atk) atk.kills += 1;
                    const entry = {
                        type: 'kill', projId: id, targetId: pid, attackerId: proj.ownerId,
                        dmg: proj.damage, killerName: atk?.name || '?', victimName: target.name, t
                    };
                    room.killFeed.push(entry);
                    if (room.killFeed.length > 20) room.killFeed.shift();
                    hitEvents.push(entry);
                } else {
                    hitEvents.push({ type: 'hit', projId: id, targetId: pid, attackerId: proj.ownerId, dmg: proj.damage });
                }
                break;
            }
        }
    }
    for (const id of toRemove) room.projectiles.delete(id);
    return hitEvents;
}

function tickRespawns(room) {
    const t = now();
    let spawnIdx = 0;
    for (const p of room.players.values()) {
        if (!p.alive && p.respawnAt > 0 && t >= p.respawnAt) {
            const sp = SPAWN_POSITIONS[spawnIdx++ % SPAWN_POSITIONS.length];
            Object.assign(p, { x: sp.x, y: sp.y, z: sp.z, vx: 0, vy: 0, vz: 0, hp: PLAYER_HP, alive: true, respawnAt: 0 });
            broadcast(room, { type: 'respawn', id: p.id, x: p.x, y: p.y, z: p.z, hp: p.hp });
        }
    }
}

// ── Delta broadcast ───────────────────────────────────────────────────────────
// Only send fields that changed since the last snapshot for each player
function buildPlayerDelta(p, lastSnap) {
    const THRESHOLD = 0.005;
    const delta = { id: p.id, seq: p.lastInputSeq };
    let hasChange = false;

    function maybeAdd(key, val, threshold) {
        const prev = lastSnap[key];
        if (prev === undefined || (threshold ? Math.abs(val - prev) > threshold : val !== prev)) {
            delta[key] = val;
            hasChange  = true;
        }
    }

    maybeAdd('x',       p.x,       THRESHOLD);
    maybeAdd('y',       p.y,       THRESHOLD);
    maybeAdd('z',       p.z,       THRESHOLD);
    maybeAdd('yaw',     p.yaw,     0.01);
    maybeAdd('pitch',   p.pitch,   0.01);
    maybeAdd('hp',      p.hp,      false);
    maybeAdd('kills',   p.kills,   false);
    maybeAdd('deaths',  p.deaths,  false);
    maybeAdd('alive',   p.alive,   false);
    maybeAdd('name',    p.name,    false);
    maybeAdd('hue',     p.hue,     false);
    if (p.respawnAt !== (lastSnap.respawnAt || 0)) {
        delta.respawnAt = p.respawnAt; hasChange = true;
    }

    return hasChange ? delta : null;
}

// ── Main tick ─────────────────────────────────────────────────────────────────
function tick(room) {
    room.tick++;
    const dt = TICK_MS / 1000;
    const t  = now();

    if (room.state === 'countdown' && t >= room.countdownEnd) startMatch(room);
    if (room.state === 'live'      && t >= room.matchEnd)     endMatch(room);
    if (room.state !== 'live') return;

    // 1. Consume queued inputs deterministically
    flushInputQueues(room);

    // 2. Step projectiles and detect hits
    const hitEvents = tickProjectiles(room, dt);

    // 3. Respawn dead players
    tickRespawns(room);

    // 4. Build delta snapshots per receiver
    const playerDeltas = [];
    const newSnaps     = new Map();

    for (const p of room.players.values()) {
        const lastSnap = room.lastSnap.get(p.id) || {};
        const delta    = buildPlayerDelta(p, lastSnap);
        // Update our snapshot record whether we send or not
        const snap = {
            x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch,
            hp: p.hp, kills: p.kills, deaths: p.deaths, alive: p.alive,
            respawnAt: p.respawnAt, name: p.name, hue: p.hue
        };
        newSnaps.set(p.id, snap);
        if (delta) playerDeltas.push(delta);
    }
    room.lastSnap = newSnaps;

    const projStates = [];
    for (const proj of room.projectiles.values()) {
        projStates.push({
            id: proj.id, ownerId: proj.ownerId,
            x: +proj.x.toFixed(3), y: +proj.y.toFixed(3), z: +proj.z.toFixed(3),
            dx: +proj.dx.toFixed(3), dy: +proj.dy.toFixed(3), dz: +proj.dz.toFixed(3),
            seq: proj.seq
        });
    }

    // 5. Send per-player state (self auth + delta ghosts + projs)
    for (const p of room.players.values()) {
        const selfDelta = playerDeltas.find(d => d.id === p.id);
        send(p.ws, {
            type: 'state',
            tick: room.tick,
            t,
            self: {
                seq: p.lastInputSeq,
                x: p.x, y: p.y, z: p.z,
                hp: p.hp, alive: p.alive
            },
            deltas: playerDeltas,    // all player deltas (client filters self for reconcile)
            projs:  projStates,
            hits:   hitEvents
        });
    }
}

// ── WebSocket server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT });

wss.on('listening', () => {
    const ips = getLanIPs();
    console.log(`[FauxPVP] Listening on port ${PORT}`);
    console.log(`[FauxPVP] LAN: ${ips.map(ip => `${ip}:${PORT}`).join(', ') || `localhost:${PORT}`}`);
    console.log(`[FauxPVP] Tick: ${TICK_HZ}Hz  MaxPlayers: ${MAX_PLAYERS}  Arena: ${ARENA_SIZE}x${ARENA_SIZE}`);
});

wss.on('connection', (ws, req) => {
    const room = ROOM;
    if (room.players.size >= MAX_PLAYERS) {
        send(ws, { type: 'error', msg: 'Server full' });
        ws.close(); return;
    }

    const id     = room.nextPlayerId++;
    const isHost = room.players.size === 0;
    const player = {
        id, ws, name: `Player${id}`, isHost,
        x: 16, y: ARENA_FLOOR_Y, z: 16,
        yaw: 0, pitch: 0,
        vx: 0, vy: 0, vz: 0,
        hp: PLAYER_HP, kills: 0, deaths: 0,
        alive: true, respawnAt: 0,
        lastInputSeq: 0, lastInputTime: 0,
        hue: (id * 0.137) % 1,
        inputQueue: []
    };
    room.players.set(id, player);

    const ips = getLanIPs();
    console.log(`[+] Player ${id}${isHost ? ' (HOST)' : ''} — ${req.socket.remoteAddress}, total: ${room.players.size}`);

    send(ws, {
        type: 'welcome', id, hue: player.hue, isHost,
        arena: ARENA_BLOCKS,
        matchState:   room.state,
        countdownEnd: room.state === 'countdown' ? room.countdownEnd : 0,
        serverIPs: ips, port: PORT,
        players: [...room.players.values()].map(p => ({
            id: p.id, name: p.name, hue: p.hue,
            x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch,
            hp: p.hp, kills: p.kills, deaths: p.deaths, alive: p.alive
        }))
    });

    broadcast(room, {
        type: 'playerJoined', id, name: player.name,
        hue: player.hue, x: player.x, y: player.y, z: player.z, isHost
    }, id);

    ws.on('message', (raw) => {
        let msg;
        try { msg = JSON.parse(raw); } catch { return; }
        handleMessage(room, player, msg);
    });

    ws.on('close', () => {
        room.players.delete(id);
        broadcast(room, { type: 'playerLeft', id });
        console.log(`[-] Player ${id} disconnected, total: ${room.players.size}`);
        if (room.players.size === 0) {
            if (room.state !== 'lobby') resetMatch(room);
        } else if (player.isHost) {
            // Host left — promote the longest-connected remaining player
            const newHost = room.players.values().next().value;
            newHost.isHost = true;
            send(newHost.ws, { type: 'hostPromoted' });
            broadcast(room, { type: 'playerPromoted', id: newHost.id, name: newHost.name }, newHost.id);
            console.log(`[Host] Promoted player ${newHost.id} (${newHost.name}) to host`);
        }
    });

    ws.on('error', (e) => console.error(`[!] Player ${id} error:`, e.message));
});

function handleMessage(room, player, msg) {
    switch (msg.type) {
        case 'setName':
            player.name = String(msg.name || `Player${player.id}`).slice(0, 24);
            broadcast(room, { type: 'playerName', id: player.id, name: player.name });
            break;

        case 'input':
            // Only accept movement during live state; queue for deterministic processing
            if (room.state === 'live') {
                if (player.inputQueue.length >= MAX_INPUT_QUEUE) {
                    // Queue full: drop oldest to accept latest (anti-cheat bounded accumulation)
                    player.inputQueue.shift();
                }
                player.inputQueue.push(msg);
            }
            break;

        case 'shoot':
            if (room.state === 'live') {
                const proj = spawnProjectile(room, player, msg);
                if (proj) {
                    broadcast(room, {
                        type: 'projSpawn',
                        id: proj.id, ownerId: proj.ownerId,
                        x: proj.x, y: proj.y, z: proj.z,
                        dx: proj.dx, dy: proj.dy, dz: proj.dz,
                        seq: proj.seq
                    });
                }
            }
            break;

        case 'startCountdown':
            if (player.isHost) startCountdown(room);
            break;

        case 'resetMatch':
            if (player.isHost) resetMatch(room);
            break;
    }
}

setInterval(() => tick(ROOM), TICK_MS);
