const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const restartBtn = document.getElementById("restartBtn");

// ==========================================
// GAME STATE (APPLICATION STAGE DATA)
// ==========================================
let ball, orb, monsters, score, gameOver;

function init() {
    ball = {
        x: canvas.width / 2, 
        y: canvas.height / 2,
        vx: 4, 
        vy: -4,
        radius: 20,
        sides: 6,
        angle: 0,
        rotationSpeed: 0.05,
        color: "#58a6ff"
    };

    orb = {
        x: canvas.width / 2, 
        y: canvas.height - 50,
        radius: 25,
        color: "#3fb950"
    };

    monsters = [];
    score = 0;
    gameOver = false;
    restartBtn.style.display = "none";
}

// Track mouse movement for the Orb
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    orb.x = e.clientX - rect.left;
    orb.y = e.clientY - rect.top;
});

function resetGame() {
    init();
}

// ==========================================
// 1. APPLICATION STAGE (CPU PHYSICS & LOGIC)
// ==========================================
function updateApplicationState() {
    if (gameOver) return;

    // A. Ball Physics & Movement
    ball.x += ball.vx;
    ball.y += ball.vy;
    ball.angle += ball.rotationSpeed;

    // B. Wall Collisions (Left, Right, Top)
    if (ball.x + ball.radius > canvas.width) {
        ball.x = canvas.width - ball.radius;
        ball.vx *= -1;
    } else if (ball.x - ball.radius < 0) {
        ball.x = ball.radius;
        ball.vx *= -1;
    }
    if (ball.y - ball.radius < 0) {
        ball.y = ball.radius;
        ball.vy *= -1;
    }

    // C. Game Over Condition (Falls into the unknown)
    if (ball.y - ball.radius > canvas.height) {
        gameOver = true;
        restartBtn.style.display = "block";
    }

    // D. Collision: Ball vs Orb (Circle vs Circle)
    let dx = ball.x - orb.x;
    let dy = ball.y - orb.y;
    let distance = Math.hypot(dx, dy);
    
    if (distance < ball.radius + orb.radius) {
        // Calculate bounce normal
        let nx = dx / distance;
        let ny = dy / distance;
        
        // Maintain constant speed while changing direction based on where it hit the orb
        let speed = Math.hypot(ball.vx, ball.vy);
        // Slightly increase speed over time for difficulty
        speed = Math.min(speed + 0.1, 12); 

        ball.vx = nx * speed;
        ball.vy = ny * speed;

        // Push ball out of the orb to prevent getting stuck
        ball.x = orb.x + nx * (ball.radius + orb.radius + 1);
        ball.y = orb.y + ny * (ball.radius + orb.radius + 1);
    }

    // E. Monster Logic (Spawning & Moving)
    if (Math.random() < 0.03) { // 3% chance per frame to spawn a monster
        monsters.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: -30,
            radius: 12,
            speed: Math.random() * 2 + 1,
            color: "#ff7b72"
        });
    }

    // Move monsters and check collisions with ball
    for (let i = monsters.length - 1; i >= 0; i--) {
        let m = monsters[i];
        m.y += m.speed;

        // Check collision: Ball vs Monster
        let mdx = ball.x - m.x;
        let mdy = ball.y - m.y;
        let mDist = Math.hypot(mdx, mdy);

        if (mDist < ball.radius + m.radius) {
            // Destroy monster, add score, slight ball deflection
            monsters.splice(i, 1);
            score += 10;
            ball.vy *= -1; // Bounce off the monster
            continue;
        }

        // Remove monsters if they fall off screen naturally
        if (m.y > canvas.height + 30) {
            monsters.splice(i, 1);
        }
    }
}

// ==========================================
// 2 & 3. GEOMETRY & RASTERIZATION STAGES
// ==========================================
function renderScene() {
    updateApplicationState();

    // Clear Screen
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Monsters
    monsters.forEach(m => drawMonster(m));

    // Draw Player Orb & Bouncing Ball
    drawOrb(orb);
    drawPolygon(ball);
    
    // Draw UI Text
    drawUI();

    requestAnimationFrame(renderScene);
}

// Renders the Ball
function drawPolygon(obj) {
    ctx.save();
    
    // GEOMETRY STAGE
    ctx.translate(obj.x, obj.y);
    ctx.rotate(obj.angle);
    ctx.beginPath();
    for (let i = 0; i < obj.sides; i++) {
        let theta = (i * 2 * Math.PI) / obj.sides;
        let px = obj.radius * Math.cos(theta);
        let py = obj.radius * Math.sin(theta);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();

    // RASTERIZATION STAGE
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();
    ctx.restore();
}

// Renders the glowing controller
function drawOrb(obj) {
    // GEOMETRY STAGE
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);

    // RASTERIZATION STAGE
    ctx.fillStyle = obj.color;
    ctx.shadowBlur = 20;
    ctx.shadowColor = obj.color;
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow
}

// Renders the enemies
function drawMonster(obj) {
    // GEOMETRY STAGE (Drawing spiky triangles)
    ctx.save();
    ctx.translate(obj.x, obj.y);
    ctx.beginPath();
    ctx.moveTo(0, -obj.radius);
    ctx.lineTo(obj.radius, obj.radius);
    ctx.lineTo(-obj.radius, obj.radius);
    ctx.closePath();

    // RASTERIZATION STAGE
    ctx.fillStyle = obj.color;
    ctx.fill();
    ctx.restore();
}

// Renders Score and Game Over text
function drawUI() {
    // RASTERIZATION STAGE (Text Rendering)
    ctx.fillStyle = "#ffffff";
    ctx.font = "20px Arial";
    ctx.textAlign = "left";
    ctx.fillText("Score: " + score, 20, 30);

    if (gameOver) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ff7b72";
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "20px Arial";
        ctx.fillText("Final Score: " + score, canvas.width / 2, canvas.height / 2 + 20);
    }
}

// Boot game
init();
renderScene();