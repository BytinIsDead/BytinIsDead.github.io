// Constants
const WIDTH = 40;
const HEIGHT = 20;
const PLAYER = { x: 5, y: 5, hp: 20, maxHp: 20, level: 1, xp: 0, inventory: [] };

// Game State
let map = [];
let items = [];
let enemies = [];
let logEl = document.getElementById("log");

// Generate Map with Rooms and Corridors
function generateMap() {
    map = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('#'));

    // Create Rooms
    for (let i = 0; i < 8; i++) {
        const rw = Math.floor(Math.random() * 6) + 4;
        const rh = Math.floor(Math.random() * 4) + 3;
        const rx = Math.floor(Math.random() * (WIDTH - rw - 2)) + 1;
        const ry = Math.floor(Math.random() * (HEIGHT - rh - 2)) + 1;

        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                map[y][x] = '.';
            }
        }
    }

    // Create Corridors (Random Walk)
    let lastX = Math.floor(Math.random() * WIDTH);
    let lastY = Math.floor(Math.random() * HEIGHT);
    for (let i = 0; i < 10; i++) {
        const length = Math.floor(Math.random() * 10) + 5;
        const direction = Math.floor(Math.random() * 4);
        let dx = 0, dy = 0;

        switch (direction) {
            case 0: dx = 1; break; // Right
            case 1: dx = -1; break; // Left
            case 2: dy = 1; break; // Down
            case 3: dy = -1; break; // Up
        }

        for (let j = 0; j < length; j++) {
            lastX += dx;
            lastY += dy;
            if (lastX >= 0 && lastX < WIDTH && lastY >= 0 && lastY < HEIGHT) {
                map[lastY][lastX] = '.';
            }
        }
    }
}

// Generate Items
function generateItems(count = 5) {
    items = [];
    const types = ["Sword", "Potion", "Armor", "Ring", "Amulet"];
    for (let i = 0; i < count; i++) {
        let item = {
            x: rand(1, WIDTH - 2),
            y: rand(1, HEIGHT - 2),
            name: types[rand(0, types.length - 1)],
            bonus: rand(1, 5)
        };
        if (map[item.y][item.x] === '.') items.push(item);
    }
}

// Generate Enemies
function generateEnemies(count = 5) {
    enemies = [];
    for (let i = 0; i < count; i++) {
        let enemy = {
            x: rand(1, WIDTH - 2),
            y: rand(1, HEIGHT - 2),
            hp: 5 + rand(0, 5),
            char: "g"
        };
        if (map[enemy.y][enemy.x] === '.') enemies.push(enemy);
    }
}

// Draw Game State
function draw() {
    let output = "";
    for (let y = 0; y < HEIGHT; y++) {
        for (let x = 0; x < WIDTH; x++) {
            if (x === PLAYER.x && y === PLAYER.y) output += "@";
            else if (enemies.some(e => e.x === x && e.y === y)) output += "g";
            else if (items.some(it => it.x === x && it.y === y)) output += "*";
            else output += map[y][x];
        }
        output += "\n";
    }
    document.getElementById("game").innerText = output;
    log(`HP: ${PLAYER.hp}/${PLAYER.maxHp}  Level: ${PLAYER.level} XP: ${PLAYER.xp}`);
}

// Attack Enemy
function attackEnemy(ex, ey) {
    const enemy = enemies.find(e => e.x === ex && e.y === ey);
    if (!enemy) return;
    enemy.hp -= rand(3, 6);
    log("You hit the enemy!");
    if (enemy.hp <= 0) {
        PLAYER.xp += 5;
        enemies = enemies.filter(e => e !== enemy);
        log("Enemy defeated! Gained 5 XP.");
        checkLevelUp();
    }
}

// Level Up Logic
function checkLevelUp() {
    let nextXp = PLAYER.level * 10;
    if (PLAYER.xp >= nextXp) {
        PLAYER.xp -= nextXp;
        PLAYER.level++;
        PLAYER.maxHp += 5;
        PLAYER.hp = PLAYER.maxHp;
        log(`Leveled up! Now level ${PLAYER.level}. HP restored.`);
    }
}

// Item Pickup
function checkItem() {
    let idx = items.findIndex(it => it.x === PLAYER.x && it.y === PLAYER.y);
    if (idx !== -1) {
        const item = items[idx];
        PLAYER.inventory.push(item);
        log(`Picked up ${item.name} (+${item.bonus}).`);
        items.splice(idx, 1);
    }
}

// Enemy AI
function moveEnemies() {
    for (let e of enemies) {
        const dx = Math.sign(PLAYER.x - e.x);
        const dy = Math.sign(PLAYER.y - e.y);
        const tx = e.x + dx;
        const ty = e.y + dy;

        if (tx === PLAYER.x && ty === PLAYER.y) {
            PLAYER.hp -= rand(1, 3);
            log("You were hit by an enemy!");
            if (PLAYER.hp <= 0) {
                log("You died. Game Over.");
                document.removeEventListener("keydown", keyHandler);
            }
            continue;
        }

        if (map[ty]?.[tx] === '.' && !enemies.some(en => en.x === tx && en.y === ty)) {
            e.x = tx;
            e.y = ty;
        }
    }
}

// Player Movement
function move(dx, dy) {
    const nx = PLAYER.x + dx;
    const ny = PLAYER.y + dy;

    if (enemies.some(e => e.x === nx && e.y === ny)) {
        attackEnemy(nx, ny);
    } else if (map[ny]?.[nx] === '.') {
        PLAYER.x = nx;
        PLAYER.y = ny;
        checkItem();
    }

    moveEnemies();
    draw();
}

// Key Handler
function keyHandler(e) {
    switch (e.key) {
        case "ArrowUp": move(0, -1); break;
        case "ArrowDown": move(0, 1); break;
        case "ArrowLeft": move(-1, 0); break;
        case "ArrowRight": move(1, 0); break;
    }
}

// Random Number Generator
function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Log Messages
function log(msg) {
    logEl.innerText = msg;
}

// Save Game
function saveGame() {
    localStorage.setItem("roguelikeSave", JSON.stringify({ map, PLAYER, items, enemies }));
    log("Game saved.");
}

// Load Game
function loadGame() {
    const data = JSON.parse(localStorage.getItem("roguelikeSave"));
    if (!data) return;
    map = data.map;
    PLAYER = data.PLAYER;
    items = data.items;
    enemies = data.enemies;
    draw();
    log("Game loaded.");
}

// Start Game
function startGame() {
    generateMap();
    generateItems();
    generateEnemies();
    draw();
}

// Event Listeners
document.addEventListener("keydown", keyHandler);
window.addEventListener("beforeunload", saveGame);

// Initialize
startGame();
