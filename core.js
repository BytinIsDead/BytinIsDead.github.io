// core.js
// Game state
const gameState = {
    level: 1,
    player: {
        x: 5,
        y: 5,
        hp: 20,
        maxHp: 20,
        attack: 5,
        defense: 2,
        gold: 0,
        ore: 0,
        equipped: {
            weapon: null,
            armor: null
        },
        inventory: [
            { id: 'pickaxe', name: 'Rusty Pickaxe', type: 'tool', quantity: 1, equipped: true, effect: 'Mine walls' },
            { id: 'potion', name: 'Health Potion', type: 'consumable', quantity: 3, effect: 'Heal 15 HP' },
            { id: 'sword', name: 'Iron Sword', type: 'weapon', quantity: 1, equipped: false, effect: 'ATK +3' },
            { id: 'armor', name: 'Leather Armor', type: 'armor', quantity: 1, equipped: true, effect: 'DEF +2' }
        ]
    },
    map: [],
    entities: [],
    log: []
};

// Game symbols
const symbols = {
    player: '@',
    wall: '#',
    floor: '.',
    enemy: [
        'k', // kobold
        'o', // orc
        'z', // zombie
        's', // snake
        'D'  // dragon
    ],
    treasure: [
        '$',
        '*'
    ],
    potion: '!',
    stairs: '>',
    shop: 'S',
    ore: '♦'
};

// Initialize the game
function initGame() {
    generateMap();
    spawnEntities();
    updateUI();
    renderInventory();
}

// Generate a dungeon map
function generateMap() {
    const width = 21;
    const height = 15;
    gameState.map = [];
    
    // Create empty map with borders
    for (let y = 0; y < height; y++) {
        const row = [];
        for (let x = 0; x < width; x++) {
            if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
                row.push(symbols.wall);
            } else {
                // Random floor or wall
                row.push(Math.random() > 0.7 ? symbols.wall : symbols.floor);
            }
        }
        gameState.map.push(row);
    }
    
    // Ensure player position is walkable
    gameState.map[gameState.player.y][gameState.player.x] = symbols.floor;
}

// Spawn entities (enemies, items, etc)
function spawnEntities() {
    gameState.entities = [];
    
    // Spawn enemies
    for (let i = 0; i < 5; i++) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        // Don't spawn on walls or player
        if (gameState.map[y][x] === symbols.floor && 
            !(x === gameState.player.x && y === gameState.player.y)) {
            gameState.entities.push({
                type: 'enemy',
                symbol: symbols.enemy[Math.floor(Math.random() * symbols.enemy.length)],
                name: ['Kobold', 'Orc', 'Zombie', 'Snake', 'Dragon'][Math.floor(Math.random() * 5)],
                x: x,
                y: y,
                hp: 8 + Math.floor(Math.random() * 10),
                attack: 3 + Math.floor(Math.random() * 5),
                xp: 10 + Math.floor(Math.random() * 15)
            });
        }
    }
    
    // Spawn treasure
    for (let i = 0; i < 3; i++) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        if (gameState.map[y][x] === symbols.floor && 
            !gameState.entities.some(e => e.x === x && e.y === y)) {
            gameState.entities.push({
                type: 'treasure',
                symbol: symbols.treasure[Math.floor(Math.random() * symbols.treasure.length)],
                name: ['Gold coins', 'Gems'][Math.floor(Math.random() * 2)],
                x: x,
                y: y,
                value: Math.floor(Math.random() * 20) + 10
            });
        }
    }
    
    // Spawn health potions
    for (let i = 0; i < 2; i++) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        if (gameState.map[y][x] === symbols.floor && 
            !gameState.entities.some(e => e.x === x && e.y === y)) {
            gameState.entities.push({
                type: 'potion',
                symbol: symbols.potion,
                name: 'Health Potion',
                x: x,
                y: y,
                heal: 5 + Math.floor(Math.random() * 10)
            });
        }
    }
    
    // Add stairs
    let stairsPlaced = false;
    while (!stairsPlaced) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        if (gameState.map[y][x] === symbols.floor && 
            !gameState.entities.some(e => e.x === x && e.y === y)) {
            gameState.entities.push({
                type: 'stairs',
                symbol: symbols.stairs,
                name: 'Stairs down',
                x: x,
                y: y
            });
            stairsPlaced = true;
        }
    }
    
    // Add shop
    let shopPlaced = false;
    while (!shopPlaced) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        if (gameState.map[y][x] === symbols.floor && 
            !gameState.entities.some(e => e.x === x && e.y === y)) {
            gameState.entities.push({
                type: 'shop',
                symbol: symbols.shop,
                name: 'Shop',
                x: x,
                y: y
            });
            shopPlaced = true;
        }
    }
    
    // Add ore deposits
    for (let i = 0; i < 4; i++) {
        const x = Math.floor(Math.random() * 19) + 1;
        const y = Math.floor(Math.random() * 13) + 1;
        
        if (gameState.map[y][x] === symbols.wall) {
            gameState.entities.push({
                type: 'ore',
                symbol: symbols.ore,
                name: 'Ore Deposit',
                x: x,
                y: y,
                quantity: 1 + Math.floor(Math.random() * 3)
            });
        }
    }
}

// Render the map
function renderMap() {
    let mapDisplay = '';
    
    for (let y = 0; y < gameState.map.length; y++) {
        let row = '';
        for (let x = 0; x < gameState.map[y].length; x++) {
            // Check if player is here
            if (x === gameState.player.x && y === gameState.player.y) {
                row += `<span style="color:#FFD700">${symbols.player}</span>`;
                continue;
            }
            
            // Check for entities
            const entity = gameState.entities.find(e => e.x === x && e.y === y);
            if (entity) {
                let color = '#FFFFFF';
                switch (entity.type) {
                    case 'enemy': 
                        color = entity.symbol === 'D' ? '#FF6347' : '#FFA500'; 
                        break;
                    case 'treasure': color = '#FFD700'; break;
                    case 'potion': color = '#7CFC00'; break;
                    case 'stairs': color = '#ADD8E6'; break;
                    case 'shop': color = '#FF69B4'; break;
                    case 'ore': color = '#CD7F32'; break;
                }
                row += `<span style="color:${color}">${entity.symbol}</span>`;
                continue;
            }
            
            // Default to map tile
            row += gameState.map[y][x] === symbols.wall 
                ? `<span style="color:#5555AA">${symbols.wall}</span>` 
                : `<span style="color:#888888">${symbols.floor}</span>`;
        }
        mapDisplay += row + '\n';
    }
    
    document.getElementById('map-display').innerHTML = mapDisplay;
}

// Update UI elements
function updateUI() {
    document.getElementById('level').textContent = gameState.level;
    document.getElementById('hp').textContent = gameState.player.hp;
    document.getElementById('max-hp').textContent = gameState.player.maxHp;
    document.getElementById('gold').textContent = gameState.player.gold;
    document.getElementById('attack').textContent = gameState.player.attack;
    document.getElementById('defense').textContent = gameState.player.defense;
    
    renderMap();
}

// Render inventory items
function renderInventory() {
    const container = document.getElementById('inventory-items');
    container.innerHTML = '';
    
    gameState.player.inventory.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = `item ${item.equipped ? 'equipped' : ''}`;
        itemElement.dataset.index = index;
        itemElement.textContent = item.name;
        
        if (item.quantity > 1) {
            const quantity = document.createElement('div');
            quantity.className = 'quantity';
            quantity.textContent = item.quantity;
            itemElement.appendChild(quantity);
        }
        
        container.appendChild(itemElement);
    });
    
    // Add event listeners to items
    document.querySelectorAll('.item').forEach(item => {
        item.addEventListener('click', function() {
            const index = this.dataset.index;
            useItem(index);
        });
    });
}

// Use an item
function useItem(index) {
    const item = gameState.player.inventory[index];
    
    switch (item.id) {
        case 'potion':
            const healAmount = 15;
            gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmount);
            addLog(`Drank Health Potion. <span class="heal">+${healAmount} HP</span>`, 'heal');
            break;
            
        case 'sword':
            gameState.player.attack += 3;
            item.equipped = true;
            addLog(`Equipped Iron Sword. <span class="loot">ATK +3</span>`, 'loot');
            break;
            
        case 'armor':
            gameState.player.defense += 2;
            item.equipped = true;
            addLog(`Equipped Leather Armor. <span class="loot">DEF +2</span>`, 'loot');
            break;
    }
    
    renderInventory();
}

// Mine a wall
function mineWall() {
    const directions = [
        {dx: -1, dy: 0}, // left
        {dx: 1, dy: 0},  // right
        {dx: 0, dy: -1}, // up
        {dx: 0, dy: 1}   // down
    ];
    
    const pickaxe = gameState.player.inventory.find(i => i.id === 'pickaxe' && i.equipped);
    
    if (!pickaxe) {
        addLog("You need to equip a pickaxe to mine!", 'damage');
        return;
    }
    
    let mined = false;
    
    for (const dir of directions) {
        const x = gameState.player.x + dir.dx;
        const y = gameState.player.y + dir.dy;
        
        // Check if there's a wall
        if (gameState.map[y] && gameState.map[y][x] === symbols.wall) {
            // Check if there's ore deposit
            const oreIndex = gameState.entities.findIndex(e => 
                e.type === 'ore' && e.x === x && e.y === y);
            
            if (oreIndex !== -1) {
                // Mine ore deposit
                const ore = gameState.entities[oreIndex];
                gameState.player.ore += ore.quantity;
                gameState.entities.splice(oreIndex, 1);
                addLog(`Mined ore deposit! <span class="mining">+${ore.quantity} ore</span>`, 'mining');
            } else {
                // Mine regular wall
                gameState.player.ore += 1;
                gameState.map[y][x] = symbols.floor;
                addLog(`Mined wall. <span class="mining">+1 ore</span>`, 'mining');
            }
            
            mined = true;
            break;
        }
    }
    
    if (!mined) {
        addLog("No wall to mine nearby!", 'info');
    }
    
    updateUI();
}

// Move player
function movePlayer(dx, dy) {
    const newX = gameState.player.x + dx;
    const newY = gameState.player.y + dy;
    
    // Check if move is valid
    if (gameState.map[newY] && gameState.map[newY][newX] !== symbols.wall) {
        // Check for entity interaction
        const entityIndex = gameState.entities.findIndex(e => e.x === newX && e.y === newY);
        
        if (entityIndex !== -1) {
            const entity = gameState.entities[entityIndex];
            
            switch (entity.type) {
                case 'enemy':
                    // Combat
                    const playerDamage = Math.max(1, gameState.player.attack - Math.floor(Math.random() * 2));
                    const enemyDamage = Math.max(1, entity.attack - Math.floor(Math.random() * gameState.player.defense));
                    
                    entity.hp -= playerDamage;
                    gameState.player.hp -= enemyDamage;
                    
                    // Add to log
                    addLog(`You hit ${entity.name} for <span class="damage">${playerDamage} damage</span>`, 'damage');
                    addLog(`${entity.name} hit you for <span class="damage">${enemyDamage} damage</span>`, 'damage');
                    
                    if (entity.hp <= 0) {
                        // Enemy defeated
                        gameState.entities.splice(entityIndex, 1);
                        addLog(`${entity.name} defeated! <span class="loot">+${entity.xp} XP</span>`, 'info');
                        
                        // Drop gold
                        const goldDrop = Math.floor(Math.random() * 10) + 5;
                        gameState.player.gold += goldDrop;
                        addLog(`Found <span class="loot">${goldDrop} gold</span>`, 'loot');
                        
                        // Level up
                        if (gameState.player.xp >= gameState.level * 20) {
                            gameState.level++;
                            gameState.player.maxHp += 5;
                            gameState.player.hp = gameState.player.maxHp;
                            gameState.player.attack += 1;
                            addLog(`<span class="special">You reached level ${gameState.level}!</span>`, 'special');
                        }
                    }
                    break;
                    
                case 'treasure':
                    gameState.player.gold += entity.value;
                    addLog(`Found ${entity.name}! <span class="loot">+${entity.value} gold</span>`, 'loot');
                    gameState.entities.splice(entityIndex, 1);
                    break;
                    
                case 'potion':
                    gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + entity.heal);
                    addLog(`Drank health potion. <span class="heal">+${entity.heal} HP</span>`, 'heal');
                    gameState.entities.splice(entityIndex, 1);
                    break;
                    
                case 'stairs':
                    gameState.level++;
                    addLog(`Descending to level <span class="info">${gameState.level}</span>...`, 'info');
                    generateMap();
                    spawnEntities();
                    gameState.player.x = 5;
                    gameState.player.y = 5;
                    break;
                    
                case 'shop':
                    addLog("Welcome to the shop! (Coming soon)", 'info');
                    break;
            }
        } else {
            // Move player
            gameState.player.x = newX;
            gameState.player.y = newY;
            
            // Random events
            if (Math.random() < 0.1) {
                const events = [
                    { text: "You hear strange noises in the distance", type: "info" },
                    { text: "The torch flickers, casting eerie shadows", type: "info" },
                    { text: "You find some loose coins on the ground", type: "loot", gold: Math.floor(Math.random() * 3) + 1 }
                ];
                
                const event = events[Math.floor(Math.random() * events.length)];
                if (event.gold) {
                    gameState.player.gold += event.gold;
                    addLog(`${event.text} <span class="loot">+${event.gold} gold</span>`, event.type);
                } else {
                    addLog(event.text, event.type);
                }
            }
        }
        
        // Move enemies randomly
        moveEnemies();
        
        // Check if player died
        if (gameState.player.hp <= 0) {
            gameState.player.hp = 0;
            addLog(`<span class="damage">You died! Game over.</span>`, 'damage');
            setTimeout(() => {
                alert("Game Over! You were defeated in the dungeon.");
                resetGame();
            }, 500);
        }
        
        updateUI();
    }
}

// Move enemies randomly
function moveEnemies() {
    gameState.entities.forEach(entity => {
        if (entity.type === 'enemy' && Math.random() < 0.6) {
            const directions = [
                {dx: -1, dy: 0},
                {dx: 1, dy: 0},
                {dx: 0, dy: -1},
                {dx: 0, dy: 1}
            ];
            
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const newX = entity.x + dir.dx;
            const newY = entity.y + dir.dy;
            
            if (gameState.map[newY] && gameState.map[newY][newX] !== symbols.wall) {
                entity.x = newX;
                entity.y = newY;
            }
        }
    });
}

// Add message to game log
function addLog(message, type) {
    const logElement = document.getElementById('log');
    const entry = document.createElement('div');
    entry.className = `log-entry ${type}`;
    entry.innerHTML = message;
    logElement.prepend(entry);
    
    // Keep log to 6 entries
    if (logElement.children.length > 6) {
        logElement.removeChild(logElement.lastChild);
    }
}

// Reset game
function resetGame() {
    gameState.level = 1;
    gameState.player = {
        x: 5,
        y: 5,
        hp: 20,
        maxHp: 20,
        attack: 5,
        defense: 2,
        gold: 0,
        ore: 0,
        equipped: {
            weapon: null,
            armor: null
        },
        inventory: [
            { id: 'pickaxe', name: 'Rusty Pickaxe', type: 'tool', quantity: 1, equipped: true, effect: 'Mine walls' },
            { id: 'potion', name: 'Health Potion', type: 'consumable', quantity: 3, effect: 'Heal 15 HP' },
            { id: 'sword', name: 'Iron Sword', type: 'weapon', quantity: 1, equipped: false, effect: 'ATK +3' },
            { id: 'armor', name: 'Leather Armor', type: 'armor', quantity: 1, equipped: true, effect: 'DEF +2' }
        ]
    };
    
    document.getElementById('log').innerHTML = `
        <div class="log-entry info">Welcome to the dungeon!</div>
        <div class="log-entry info">Use buttons or swipe to move</div>
    `;
    
    generateMap();
    spawnEntities();
    updateUI();
    renderInventory();
}

// Set up controls
function setupControls() {
    // Arrow keys
    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowUp': movePlayer(0, -1); break;
            case 'ArrowDown': movePlayer(0, 1); break;
            case 'ArrowLeft': movePlayer(-1, 0); break;
            case 'ArrowRight': movePlayer(1, 0); break;
            case ' ': 
            case 'Enter': 
                mineWall();
                break;
        }
    });
    
    // Touch controls
    document.getElementById('up').addEventListener('click', () => movePlayer(0, -1));
    document.getElementById('down').addEventListener('click', () => movePlayer(0, 1));
    document.getElementById('left').addEventListener('click', () => movePlayer(-1, 0));
    document.getElementById('right').addEventListener('click', () => movePlayer(1, 0));
    document.getElementById('action').addEventListener('click', mineWall);
    
    // Touch swipe support
    let touchStartX = 0;
    let touchStartY = 0;
    
    document.getElementById('map').addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, false);
    
    document.getElementById('map').addEventListener('touchmove', (e) => {
        e.preventDefault();
    }, false);
    
    document.getElementById('map').addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;
        
        // Minimum swipe distance
        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0) movePlayer(1, 0);
                else movePlayer(-1, 0);
            } else {
                // Vertical swipe
                if (dy > 0) movePlayer(0, 1);
                else movePlayer(0, -1);
            }
        }
        e.preventDefault();
    }, false);
}

// Initialize game when page loads
window.onload = function() {
    initGame();
    setupControls();
    
    // Initialize AdSense
    (adsbygoogle = window.adsbygoogle || []).push({});
};
