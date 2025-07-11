(() => {
  const WIDTH=60, HEIGHT=25;
  const display = new ROT.Display({ width: WIDTH, height: HEIGHT, fontSize:16, fg:'#ccc', bg:'#000' });
  document.getElementById('game').appendChild(display.getContainer());
  const player = { x:0,y:0,hp:20,maxHp:20,level:1,xp:0,inventory:[] };
  let map={}, items=[], enemies=[], scheduler, engine, fov, memory={};

  window.initGame = (resume)=>{
    if(resume && loadState()) return;
    map={}; memory={}; items=[]; enemies=[];
    generateMap(); placePlayer(); generateItems(); generateEnemies();
    drawAll(); setupEngine();
  };

  function generateMap(){
    const digger=new ROT.Map.Digger(WIDTH,HEIGHT);
    digger.create((x,y,val)=>{ map[`${x},${y}`]= (val===0); memory[`${x},${y}`]=false; });
    fov=new ROT.FOV.PreciseShadowcasting((x,y)=>map[`${x},${y}`]);
  }
  function placePlayer(){
    const free=Object.keys(map).filter(k=>map[k]);
    const [x,y]=free[Math.floor(Math.random()*free.length)].split(',').map(Number);
    player.x=x; player.y=y;
  }
  function generateItems(count=8){ const types=['Healing Potion','Scroll','Sword','Shield'];
    while(items.length<count){ const x=rand(0,WIDTH-1),y=rand(0,HEIGHT-1);
      if(map[`${x},${y}`]&&!(x===player.x&&y===player.y)){
        items.push({x,y,name:types[rand(0,types.length-1)],bonus:rand(5,15)});
      }} }
  function generateEnemies(count=6){ while(enemies.length<count){ const x=rand(0,WIDTH-1),y=rand(0,HEIGHT-1);
      if(map[`${x},${y}`]&&!(x===player.x&&y===player.y)) enemies.push({x,y,hp:10,char:'o'});
    }}

  function drawAll(){ display.clear();
    // FOV and memory
    fov.compute(player.x,player.y,(x,y,r)=>{
      if(map[`${x},${y}`]) display.draw(x,y,'.'); else display.draw(x,y,'#');
      memory[`${x},${y}`]=true;
    });
    Object.keys(memory).forEach(k=>{ if(memory[k]&&!fov._lightPasses(k.split(',')[0],k.split(',')[1])){
      const [x,y]=k.split(',').map(Number); display.draw(x,y,' ',undefined,'#111'); }});
    items.forEach(it=>{ if(memory[`${it.x},${it.y}`]) display.draw(it.x,it.y,'!','#0f0'); });
    enemies.forEach(e=>{ if(memory[`${e.x},${e.y}`]) display.draw(e.x,e.y,e.char,'#f00'); });
    display.draw(player.x,player.y,'@','#ff0');
    document.getElementById('log').innerText=`HP:${player.hp}/${player.maxHp} Lv:${player.level} XP:${player.xp}`;
  }

  function setupEngine(){ scheduler=new ROT.Scheduler.Simple();
    scheduler.add({act:playerAct},true);
    enemies.forEach(e=>scheduler.add({act:()=>enemyAct(e)},true));
    engine=new ROT.Engine(scheduler); engine.start(); }

  function playerAct(){ window.addEventListener('keydown',onKey); engine.lock(); }
  function onKey(e){ const moves={'ArrowUp':[0,-1],'ArrowDown':[0,1],'ArrowLeft':[-1,0],'ArrowRight':[1,0],'>':['descend'], 'i':['inventory']};
    if(!moves[e.key]) return; const cmd=moves[e.key];
    if(cmd==='descend'){ /* stairs logic */ }
    else if(cmd==='inventory'){ toggleInv(); }
    else movePlayer(...cmd);
    window.removeEventListener('keydown',onKey); engine.unlock(); }

  function movePlayer(dx,dy){ const nx=player.x+dx,ny=player.y+dy;
    const enemy=enemies.find(e=>e.x===nx&&e.y===ny);
    if(enemy) attack(enemy);
    else if(map[`${nx},${ny}`]){ player.x=nx;player.y=ny; collectItem(); }
    drawAll(); saveState(); }
  function attack(e){ e.hp-=rand(2,5); if(e.hp<=0) { player.xp+=10; enemies=enemies.filter(x=>x!==e); levelUp(); }}
  function enemyAct(e){ const dx=Math.sign(player.x-e.x),dy=Math.sign(player.y-e.y);
    const nx=e.x+dx, ny=e.y+dy;
    if(nx===player.x&&ny===player.y) player.hp-=rand(1,3);
    else if(map[`${nx},${ny}`]&&!enemies.some(x=>x.x===nx&&x.y===ny)) { e.x=nx; e.y=ny; }
    drawAll(); saveState(); }

  function collectItem(){ const idx=items.findIndex(i=>i.x===player.x&&i.y===player.y);
    if(idx>=0){ player.inventory.push(items[idx]); player.xp+=items[idx].bonus; items.splice(idx,1); levelUp(); }}
  function levelUp(){ const need=player.level*20; if(player.xp>=need){ player.xp-=need; player.level++; player.maxHp+=5; player.hp=player.maxHp; }}

  function toggleInv(){ const invDiv=document.getElementById('inv');
    if(invDiv.style.display==='block'){ invDiv.style.display='none'; return; }
    invDiv.innerHTML='<b>Inventory</b><br>'+(player.inventory.map(i=>i.name).join('<br>')||'(empty)'); invDiv.style.display='block'; }

  function saveState(){ localStorage.setItem('gameState',JSON.stringify({player,map,items,enemies})); }
  function loadState(){ const d=JSON.parse(localStorage.getItem('gameState')); if(!d) return false;
    Object.assign(player,d.player); map=d.map; items=d.items; enemies=d.enemies; drawAll(); setupEngine(); return true; }
  function rand(a,b){return Math.floor(Math.random()*(b-a+1))+a; }
})();
