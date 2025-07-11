// Expanded ASCII Roguelike (all features in one file for simplicity)

const width = 40;
const height = 20;
let map = [];
let player = { x: 5, y: 5, hp: 20, maxHp: 20, level: 1, xp: 0, inventory: [] };
let items = [];
let enemies = [];
let logEl = document.getElementById("log");

// Generate rooms and corridors using simple random walk + rooms
function generateMap() {
    map = Array.from({ length: height }, () => Array(width).fill('#'));

    // Carve out random rooms
    for (let i = 0; i < 8; i++) {
        const rw = Math.floor(Math.random() * 6) + 4;
        const rh = Math.floor(Math.random() * 4) + 3;
        const rx = Math.floor(Math.random() * (width - rw - 2)) + 1;
        const ry = Math.floor(Math.random() * (height - rh - 2)) + 1;

        for (let y = ry; y < ry + rh; y++) {
            for (let x = rx; x < rx + rw; x++) {
                map[y][x] = '.';
            }
        }
    }
}

// Generate random items
function generateItems(count = 5) {
    items = [];
    const types = ["Sword", "Potion", "Armor", "Ring", "Amulet"];
    for (let i = 0; i < count; i++) {
        let item = {
            x: rand(1, width - 2),
            y: rand(1, height - 2),
            name: types[rand(0, types.length - 1)],
            bonus: rand(1, 5)
        };
        if (map[item.y][item.x] === '.') items.push(item);
    }
}

// Generate enemies
function generateEnemies(count = 5) {
    enemies = [];
    for (let i = 0; i < count; i++) {
        let enemy = {
            x: rand(1, width - 2),
            y: rand(1, height - 2),
            hp: 5 + rand(0, 5),
            char: "g"
        };
        if (map[enemy.y][enemy.x] === '.') enemies.push(enemy);
    }
}

// Drawing function
function draw() {
    let output = "";
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (x === player.x && y === player.y) output += "@";
            else if (enemies.some(e => e.x === x && e.y === y)) output += "g";
            else if (items.some(it => it.x === x && it.y === y)) output += "*";
            else output += map[y][x];
        }
        output += "\n";
    }
    document.getElementById("game").innerText = output;
    log(`HP: ${player.hp}/${player.maxHp}  Level: ${player.level} XP: ${player.xp}`);
}

// Combat
function attackEnemy(ex, ey) {
    const enemy = enemies.find(e => e.x === ex && e.y === ey);
    if (!enemy) return;
    enemy.hp -= rand(3, 6);
    log("You hit the enemy!");
    if (enemy.hp <= 0) {
        player.xp += 5;
        enemies = enemies.filter(e => e !== enemy);
        log("Enemy defeated! Gained 5 XP.");
        checkLevelUp();
    }
}

// Level up logic
function checkLevelUp() {
    let nextXp = player.level * 10;
    if (player.xp >= nextXp) {
        player.xp -= nextXp;
        player.level++;
        player.maxHp += 5;
        player.hp = player.maxHp;
        log(`Leveled up! Now level ${player.level}. HP restored.`);
    }
}

// Item pickup and inventory
function checkItem() {
    let idx = items.findIndex(it => it.x === player.x && it.y === player.y);
    if (idx !== -1) {
        const item = items[idx];
        player.inventory.push(item);
        log(`Picked up ${item.name} (+${item.bonus}).`);
        items.splice(idx, 1);
    }
}

// Simple AI: enemies move toward the player
function moveEnemies() {
    for (let e of enemies) {
        const dx = Math.sign(player.x - e.x);
        const dy = Math.sign(player.y - e.y);
        const tx = e.x + dx;
        const ty = e.y + dy;

        if (tx === player.x && ty === player.y) {
            player.hp -= rand(1, 3);
            log("You were hit by an enemy!");
            if (player.hp <= 0) {
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

// Player movement & attack
function move(dx, dy) {
    const nx = player.x + dx;
    const ny = player.y + dy;

    if (enemies.some(e => e.x === nx && e.y === ny)) {
        attackEnemy(nx, ny);
    } else if (map[ny]?.[nx] === '.') {
        player.x = nx;
        player.y = ny;
        checkItem();
    }

    moveEnemies();
    draw();
}

function keyHandler(e) {
    switch (e.key) {
        case "ArrowUp": move(0, -1); break;
        case "ArrowDown": move(0, 1); break;
        case "ArrowLeft": move(-1, 0); break;
        case "ArrowRight": move(1, 0); break;
    }
}

function rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function log(msg) {
    logEl.innerText = msg;
}

// Save/load functions
function saveGame() {
    localStorage.setItem("roguelikeSave", JSON.stringify({ map, player, items, enemies }));
    log("Game saved.");
}

function loadGame() {
    const data = JSON.parse(localStorage.getItem("roguelikeSave"));
    if (!data) return;
    map = data.map;
    player = data.player;
    items = data.items;
    enemies = data.enemies;
    draw();
    log("Game loaded.");
}

// Initialize game
function startGame() {
    generateMap();
    generateItems();
    generateEnemies();
    draw();
}

document.addEventListener("keydown", keyHandler);
window.addEventListener("beforeunload", saveGame);

startGame();
