export class ECGSimulation {
    constructor() {
        this.baseBPM = 60;
        this.targetBPM = 60;
        this.currentBPM = 60;

        this.amplitude = 100;
        this.noiseLevel = 0.05;

        this.accumulatedPhase = 0;
        this.lastTime = null;
    }

    setBPM(bpm, duration = 0) {
        this.targetBPM = bpm;
        // We could implement smooth transition logic here or in update
        // For now, simpler: instant target set, update handles smoothing
    }

    update(dt) {
        // Smoothly interpolate currentBPM towards targetBPM
        if (this.currentBPM !== this.targetBPM) {
            const diff = this.targetBPM - this.currentBPM;
            // Move 60 BPM per second for smooth ramp
            const change = diff * 5 * dt;

            if (Math.abs(change) > Math.abs(diff)) {
                this.currentBPM = this.targetBPM;
            } else {
                this.currentBPM += change;
            }
        }

        // Integrate Phase
        // phase += 2 * PI * f * dt
        const freq = this.currentBPM / 60;
        this.accumulatedPhase += 2 * Math.PI * freq * dt;
    }

    getSample(t) { // t is global time, used for noise but not phase
        // Add noise
        const noise = (Math.sin(t * 0.5) + Math.sin(t * 0.23)) * this.noiseLevel;
        const aliveAmp = this.amplitude * (1 + noise);

        return aliveAmp * Math.sin(this.accumulatedPhase);
    }
}
