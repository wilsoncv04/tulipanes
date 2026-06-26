const canvas = document.getElementById('tulipCanvas');
const ctx = canvas.getContext('2d');

let mouseX = -1000;
let mouseY = -1000;

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});
window.addEventListener('touchmove', (e) => {
    mouseX = e.touches[0].clientX;
    mouseY = e.touches[0].clientY;
});
window.addEventListener('touchend', () => {
    mouseX = -1000;
    mouseY = -1000;
});
resize();

// ================= STARS =================
class Star {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height * 0.7; // mostly in the upper 70%
        this.size = Math.random() * 1.5 + 0.5;
        this.baseAlpha = Math.random() * 0.5 + 0.1;
        this.blinkSpeed = Math.random() * 0.003 + 0.001;
        this.timeOff = Math.random() * Math.PI * 2;
    }
    draw(ctx, time) {
        let alpha = this.baseAlpha + Math.sin(time * this.blinkSpeed + this.timeOff) * 0.3;
        if (alpha < 0) alpha = 0;
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ShootingStar {
    constructor() {
        this.reset();
    }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = 0;
        this.length = Math.random() * 80 + 40;
        this.speedX = (Math.random() - 0.5) * 10;
        this.speedY = Math.random() * 5 + 10;
        this.active = false;
        this.timer = Math.random() * 5000 + 2000; // time until next shoot
    }
    update(dt) {
        if (!this.active) {
            this.timer -= dt;
            if (this.timer <= 0) {
                this.active = true;
                // Spawn randomly on the top edge or upper sides
                if (Math.random() > 0.5) {
                    this.x = Math.random() * canvas.width;
                    this.y = 0;
                } else {
                    this.x = Math.random() > 0.5 ? 0 : canvas.width;
                    this.y = Math.random() * canvas.height * 0.3;
                    this.speedX = this.x === 0 ? Math.abs(this.speedX) : -Math.abs(this.speedX);
                }
            }
        } else {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.y > canvas.height || this.x < 0 || this.x > canvas.width) {
                this.reset();
            }
        }
    }
    draw(ctx) {
        if (!this.active) return;
        ctx.save();
        let grad = ctx.createLinearGradient(this.x, this.y, this.x - this.speedX * 4, this.y - this.speedY * 4);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x - this.speedX * 4, this.y - this.speedY * 4);
        ctx.stroke();
        ctx.restore();
    }
}

// ================= FIREFLIES =================
class Firefly {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 1;
        this.vy = (Math.random() - 0.5) * 1;
        this.size = Math.random() * 2 + 1.5;
        // Golden or pinkish magic sparks
        let isGold = Math.random() > 0.4;
        this.color = isGold ? '255, 215, 0' : '255, 105, 180';
        this.timeOff = Math.random() * Math.PI * 2;
    }
    update(dt, time) {
        // Organic wandering
        this.vx += (Math.random() - 0.5) * 0.1;
        this.vy += (Math.random() - 0.5) * 0.1;
        
        // speed limit
        let speed = Math.hypot(this.vx, this.vy);
        if (speed > 1.2) {
            this.vx = (this.vx / speed) * 1.2;
            this.vy = (this.vy / speed) * 1.2;
        }
        
        // Mouse interaction (repel)
        let dx = this.x - mouseX;
        let dy = this.y - mouseY;
        let dist = Math.hypot(dx, dy);
        if (dist < 150) {
            let force = (150 - dist) / 150;
            this.vx += (dx / dist) * force * 1.5;
            this.vy += (dy / dist) * force * 1.5;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls gently
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw(ctx, time) {
        let alpha = 0.4 + Math.sin(time * 0.005 + this.timeOff) * 0.6;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, 1)`;
        ctx.shadowColor = `rgba(${this.color}, 1)`;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
    }
}

// ================= TULIP CLASS =================
class PremiumTulip {
    constructor(x, y, targetHeight, scale, angle, colorHue, delay) {
        this.x = x;
        this.y = y;
        this.targetHeight = targetHeight;
        this.scale = scale;
        this.angle = angle; 
        this.curveOffset = angle === 0 ? (Math.random() > 0.5 ? 40 : -40) : Math.sign(angle) * 60;
        
        this.currentHeight = 0;
        this.bloomProgress = 0;
        this.delay = delay;
        this.elapsed = 0;
        
        // Colors exactly from the repo's stem (.flower__line)
        this.stemBaseColor = '#14757a';
        this.stemTopColor = '#39c6d6';
        
        // Colors for tulips
        this.baseHue = colorHue;
        this.petalBack = `hsl(${this.baseHue}, 80%, 40%)`;
        this.petalSide = `hsl(${this.baseHue}, 85%, 55%)`;
        this.petalFront = `hsl(${this.baseHue}, 90%, 65%)`;
        this.glow = `hsla(${this.baseHue}, 100%, 60%, 0.5)`;
        
        // Small leaves along the stem exactly like the repo
        this.stemLeaves = [];
        let numLeaves = Math.floor(Math.random() * 2) + 3; 
        for(let i=0; i<numLeaves; i++) {
            this.stemLeaves.push({
                yOffset: 0.3 + (i * 0.15),
                side: i % 2 === 0 ? 1 : -1,
                progress: 0
            });
        }
    }
    
    update(dt) {
        this.elapsed += dt;
        if (this.elapsed < this.delay) return;
        
        if (this.currentHeight < this.targetHeight) {
            this.currentHeight += (this.targetHeight - this.currentHeight) * 0.015 + 0.5;
            if (this.currentHeight > this.targetHeight) this.currentHeight = this.targetHeight;
        } else {
            if (this.bloomProgress < 1) {
                this.bloomProgress += 0.008;
                if(this.bloomProgress > 1) this.bloomProgress = 1;
            }
        }
    }
    
    draw(ctx) {
        if (this.elapsed < this.delay) return;

        ctx.save();
        ctx.translate(this.x, this.y);
        
        // Calculate endpoints and slight curvature
        let endX = Math.sin(this.angle) * this.currentHeight;
        let endY = -Math.cos(this.angle) * this.currentHeight;
        let cpX = endX * 0.5 + this.curveOffset * this.scale * (this.currentHeight / this.targetHeight);
        let cpY = endY * 0.5;
        
        // Draw stem (curved)
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(cpX, cpY, endX, endY);
        
        let stemGrad = ctx.createLinearGradient(0, 0, endX, endY);
        stemGrad.addColorStop(0, this.stemBaseColor);
        stemGrad.addColorStop(1, this.stemTopColor);
        
        ctx.lineWidth = 14 * this.scale;
        ctx.strokeStyle = stemGrad;
        ctx.lineCap = 'round';
        
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0; 
        
        // Draw small repo-style leaves on the stem
        this.stemLeaves.forEach(leaf => {
            if (this.currentHeight > this.targetHeight * leaf.yOffset) {
                leaf.progress = Math.min(1, leaf.progress + 0.03);
                
                let t = (this.targetHeight * leaf.yOffset) / this.currentHeight;
                // Position on quadratic curve
                let leafX = Math.pow(1-t, 2) * 0 + 2*(1-t)*t * cpX + Math.pow(t, 2) * endX;
                let leafY = Math.pow(1-t, 2) * 0 + 2*(1-t)*t * cpY + Math.pow(t, 2) * endY;

                ctx.save();
                ctx.translate(leafX, leafY);
                ctx.rotate(this.angle + (leaf.side * Math.PI / 2.5 * leaf.progress));
                
                // Gradient for the leaf like the repo (#5ed639 and teal) - INCREASED SIZE
                let leafGrad = ctx.createLinearGradient(0, 0, leaf.side * 65 * this.scale, -65 * this.scale);
                leafGrad.addColorStop(0, 'rgba(20, 117, 122, 0.4)');
                leafGrad.addColorStop(1, '#5ed639');
                ctx.fillStyle = leafGrad;
                
                ctx.beginPath();
                ctx.moveTo(0, 0);
                // Leaf shape (scaled up by ~1.6x)
                ctx.quadraticCurveTo(leaf.side * 65 * this.scale, 15 * this.scale, leaf.side * 80 * this.scale * leaf.progress, -50 * this.scale * leaf.progress);
                ctx.quadraticCurveTo(leaf.side * 15 * this.scale, -35 * this.scale, 0, 0);
                ctx.fill();

                ctx.restore();
            }
        });

        // Draw Bloom (Tulip heads)
        if (this.bloomProgress > 0) {
            ctx.translate(endX, endY);
            ctx.rotate(this.angle);
            ctx.scale(this.scale * this.bloomProgress, this.scale * this.bloomProgress);
            
            ctx.shadowColor = this.glow;
            ctx.shadowBlur = 40;

            // Back Petal
            ctx.fillStyle = this.petalBack;
            ctx.beginPath();
            ctx.moveTo(-15, 10);
            ctx.bezierCurveTo(-20, -40, -30, -80, 0, -100);
            ctx.bezierCurveTo(30, -80, 20, -40, 15, 10);
            ctx.fill();

            // Left Petal
            ctx.fillStyle = this.petalSide;
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.bezierCurveTo(-50, 10, -70, -40, -50, -90);
            ctx.bezierCurveTo(-20, -40, 0, -50, 0, -20);
            ctx.fill();

            // Right Petal
            ctx.fillStyle = this.petalSide;
            ctx.beginPath();
            ctx.moveTo(0, 20);
            ctx.bezierCurveTo(50, 10, 70, -40, 50, -90);
            ctx.bezierCurveTo(20, -40, 0, -50, 0, -20);
            ctx.fill();

            // Front Petal
            ctx.fillStyle = this.petalFront;
            ctx.beginPath();
            ctx.moveTo(-20, 15);
            ctx.bezierCurveTo(-35, -20, -20, -70, 0, -85);
            ctx.bezierCurveTo(20, -70, 35, -20, 20, 15);
            ctx.bezierCurveTo(10, 30, -10, 30, -20, 15);
            ctx.fill();
            
            ctx.shadowBlur = 0; 
        }

        ctx.restore();
    }
}

// ================= INITIALIZATION & LOOP =================
const tulips = [];
const stars = [];
const shootingStars = [];
const fireflies = [];

function init() {
    tulips.length = 0;
    stars.length = 0;
    shootingStars.length = 0;
    fireflies.length = 0;
    
    // Create Background elements
    for(let i=0; i<150; i++) stars.push(new Star());
    for(let i=0; i<3; i++) shootingStars.push(new ShootingStar());
    for(let i=0; i<40; i++) fireflies.push(new Firefly());

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight + 10;
    
    // Initial 3 Tulips Bouquet
    tulips.push(new PremiumTulip(cx - 50, cy, window.innerHeight * 0.55, 0.85, -0.25, 335, 400));
    tulips.push(new PremiumTulip(cx + 50, cy, window.innerHeight * 0.6, 0.9, 0.25, 345, 800));
    tulips.push(new PremiumTulip(cx, cy, window.innerHeight * 0.7, 1.1, 0, 340, 0));
}

init();

let lastTime = 0;
function animate(time) {
    if (!lastTime) lastTime = time;
    let dt = time - lastTime;
    lastTime = time;
    
    // Slight trail effect for movement (instead of pure clearRect)
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw sky
    stars.forEach(s => s.draw(ctx, time));
    shootingStars.forEach(s => {
        s.update(dt);
        s.draw(ctx);
    });

    // Draw fireflies
    fireflies.forEach(f => {
        f.update(dt, time);
        f.draw(ctx, time);
    });
    
    // Draw tulips
    tulips.forEach(t => {
        t.update(dt);
        t.draw(ctx);
    });
    
    requestAnimationFrame(animate);
}

// Start animation
setTimeout(() => {
    requestAnimationFrame(animate);
}, 200);

// ================= INTERACTIVE GARDEN =================
canvas.addEventListener('click', (e) => {
    const cx = e.clientX;
    const cy = window.innerHeight + 10;
    
    // Target height ensures the flower blooms exactly where the user clicked!
    let targetH = (window.innerHeight + 10) - e.clientY;
    
    // Limits
    if (targetH < 100) targetH = 100;
    if (targetH > window.innerHeight * 0.95) targetH = window.innerHeight * 0.95;
    
    let scale = 0.6 + Math.random() * 0.5;
    let angle = (Math.random() - 0.5) * 0.5; // random tilt
    let colorHue = 330 + Math.random() * 20; // random pink hue
    
    // No delay so it grows immediately on click
    tulips.push(new PremiumTulip(cx, cy, targetH, scale, angle, colorHue, 0));
    
    // Re-sort to maintain depth (smallest behind)
    tulips.sort((a,b) => a.scale - b.scale);
});
