// Initialize ROT.js display
const display = new ROT.Display({
    width: 40,
    height: 20,
    layout: "term",
    fontSize: 16,
    fontFamily: "monospace",
    fg: "#fff",
    bg: "#000"
});
document.getElementById("game").appendChild(display.getContainer());

// Game state
let map = [];
let player = { x: 5, y: 5, hp: 20, maxHp: 20, level: 1, xp: 0, inventory: [] };

// Generate dungeon map
function generateMap() {
    map = [];
    const digger = new ROT.Map.Digger(40, 20);
    digger.create((x, y, value) => {
        map.push({ x, y, value });
        const char = value === 1 ? "#" : ".";
        display.draw(x, y, char);
    });
}

// Draw player
function drawPlayer() {
    display.draw(player.x, player.y, "@", "#ff0");
}

// Start game
function startGame() {
    generateMap();
    drawPlayer();
}

// Load game
function loadGame() {
    const savedData = JSON.parse(localStorage.getItem("gameData"));
    if (savedData) {
        player = savedData.player;
        generateMap();
        drawPlayer();
    } else {
        alert("No saved game found.");
    }
}

// Save game
function saveGame() {
    const gameData = { player };
    localStorage.setItem("gameData", JSON.stringify(gameData));
}

// Show options
function showOptions() {
    alert("Options menu is under construction.");
}

// Consent Management Platform (CMP)
if (!localStorage.getItem("user-consent")) {
    document.getElementById("cmp-banner").style.display = "block";
}

document.getElementById("accept-consent").addEventListener("click", () => {
    const analyticsConsent = document.getElementById("analytics-consent").checked;
    const marketingConsent = document.getElementById("marketing-consent").checked;
    localStorage.setItem("user-consent", JSON.stringify({ analytics: analyticsConsent, marketing: marketingConsent }));
    document.getElementById("cmp-banner").style.display = "none";
});

document.getElementById("decline-consent").addEventListener("click", () => {
    localStorage.setItem("user-consent", JSON.stringify({ analytics: false, marketing: false }));
    document.getElementById("cmp-banner").style.display = "none";
});
