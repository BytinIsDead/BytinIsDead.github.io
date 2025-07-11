// File: core.js
(() => {
  // ROT.js Display Setup
  const display = new ROT.Display({ width: 40, height: 20, fontSize: 16, fg: '#ccc', bg: '#222' });
  document.getElementById('game').appendChild(display.getContainer());

  // Game State
  let map = {};
  let items = [];
  let enemies = [];
  let scheduler, engine;
  const player = { x: 0, y: 0, hp: 20, maxHp: 20, level: 1, xp: 0, inventory: [] };

  // Initialize Game
  window.initGame = function(resume) {
    if (resume && loadState()) return;
    generateMap();
    placePlayer();
    generateItems();
    generateEnemies();
    drawAll();
    setupEngine();
  };

  // Map Generation
  function generateMap() {
    map = {};
    const digger = new ROT.Map.Digger(40, 20);
    digger.create((x, y, val) => { map[`${x},${y}`] = (val === 0); });
  }

  // Player Placement
  function placePlayer() {
    const free = Object.keys(map).filter(k => map[k]);
    const [x, y] = free[Math.floor(Math.random() * free.length)].split(',').map(Number);
    player.x = x; player.y = y;
  }

  // Item Generation
  function generateItems(count = 5) {
    items = [];
    const types = ['Sword','Potion','Armor','Ring','Amulet'];
    for (let i = 0; i < count; i++) {
      const [x, y] = [rand(0,39), rand(0,19)];
      const name = types[rand(0, types.length-1)];
      const bonus = rand(1,5);
      if (map[`${x},${y}`]) items.push({ x,y,name,bonus });
    }
  }

  // Enemy Generation
  function generateEnemies(count = 5) {
    enemies = [];
    for (let i = 0; i < count; i++) {
      const [x, y] = [rand(0,39), rand(0,19)];
      if (map[`${x},${y}`]) enemies.push({ x,y,hp:5+rand(0,5),char:'g' });
    }
  }

  // Drawing
  function drawAll() {
    display.clear();
    for (const key in map) {
      const [x,y] = key.split(',').map(Number);
      display.draw(x,y, map[key] ? '.' : '#');
    }
    items.forEach(it => display.draw(it.x,it.y,'*','#0f0'));
    enemies.forEach(e => display.draw(e.x,e.y,e.char,'#f00'));
    display.draw(player.x,player.y,'@','#ff0');
    document.getElementById('log').innerText =
      `HP:${player.hp}/${player.maxHp} Lv:${player.level} XP:${player.xp}`;
  }

  // Game Engine
  function setupEngine() {
    scheduler = new ROT.Scheduler.Simple();
    scheduler.add({ act: playerAct }, true);
    enemies.forEach(e => scheduler.add({ act: () => enemyAct(e) }, true));
    engine = new ROT.Engine(scheduler);
    engine.start();
  }

  // Player Turn
  function playerAct() {
    window.addEventListener('keydown', onKey);
    engine.lock();
  }
  function onKey(e) {
    const keyMap = { ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0] };
    if (!keyMap[e.key]) return;
    movePlayer(...keyMap[e.key]);
    window.removeEventListener('keydown',onKey);
    engine.unlock();
  }

  // Player Move & Combat
  function movePlayer(dx,dy) {
    const nx = player.x+dx, ny = player.y+dy;
    const enemy = enemies.find(e => e.x===nx && e.y===ny);
    if (enemy) { attack(enemy); }
    else if (map[`${nx},${ny}`]) { player.x=nx;player.y=ny; collectItem(); }
    drawAll(); saveState();
  }
  function attack(enemy) {
    enemy.hp -= rand(3,6);
    if (enemy.hp<=0) {
      player.xp+=5; enemies = enemies.filter(e=>e!==enemy); levelUp();
    }
  }

  // Enemy AI
  function enemyAct(e) {
    const dx = Math.sign(player.x-e.x), dy = Math.sign(player.y-e.y);
    const nx=e.x+dx, ny=e.y+dy;
    if (nx===player.x&&ny===player.y) { player.hp -= rand(1,3); }
    else if (map[`${nx},${ny}`] && !enemies.some(en=>en.x===nx&&en.y===ny)) {
      e.x=nx; e.y=ny;
    }
    drawAll(); saveState();
  }

  // Items & Leveling
  function collectItem() {
    const idx = items.findIndex(it=>it.x===player.x&&it.y===player.y);
    if (idx>=0) { player.xp+=items[idx].bonus; items.splice(idx,1); levelUp(); }
  }
  function levelUp() {
    const need = player.level*10;
    if (player.xp>=need) { player.xp-=need;player.level++;player.maxHp+=5;player.hp=player.maxHp; }
  }

  // Save/Load
  function saveState() { localStorage.setItem('gameState',JSON.stringify({ player,map,items,enemies })); }
  function loadState() {
    const d=JSON.parse(localStorage.getItem('gameState')); if(!d) return false;
    Object.assign(player,d.player); map=d.map; items=d.items; enemies=d.enemies;
    drawAll(); setupEngine(); return true;
  }

  // Utils
  function rand(min,max){return Math.floor(Math.random()*(max-min+1))+min;}

})();
