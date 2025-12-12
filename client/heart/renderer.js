export class ECGRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.scanX = 0;
        this.speed = 200;

        this.color = '#ff3333';
        this.glowActive = false;
        this.lineWidth = 3;
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    draw(dt, time, simulation) {
        const { width, height } = this.canvas;
        const centerY = height / 2;

        // 1. Fade / Glow Background
        // Always use the standard dark fade to keep contrast high
        this.ctx.fillStyle = 'rgba(13, 13, 13, 0.1)';
        this.ctx.fillRect(0, 0, width, height);

        // If glow active, simpler vignette or just rely on line glow
        // Removing the full screen wash to improve text readability

        // 2. Calculate Position
        const x = (time * this.speed) % width;

        // 3. Update Sim and Get Y
        simulation.update(dt);
        const y = centerY + simulation.getSample(time);

        // 4. Draw Line
        if (this.prevX !== undefined) {
            if (x >= this.prevX) { // No wrap
                this.ctx.beginPath();
                this.ctx.moveTo(this.prevX, this.prevY);
                this.ctx.lineTo(x, y);
                this.ctx.strokeStyle = this.color;
                this.ctx.lineWidth = this.lineWidth;
                this.ctx.lineCap = 'round';
                this.ctx.shadowBlur = this.glowActive ? 30 : 10;
                this.ctx.shadowColor = this.glowActive ? '#ffffff' : this.color; // White hot glow
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
            }
        }

        this.prevX = x;
        this.prevY = y;

        // Leading Dot
        this.ctx.beginPath();
        this.ctx.arc(x, y, 4, 0, Math.PI * 2);
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fill();
    }
}
