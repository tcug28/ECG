import './style.css';
import { io } from "socket.io-client";
import { ECGSimulation } from './heart/simulation.js';
import { ECGRenderer } from './heart/renderer.js';

// Setup
const canvas = document.getElementById('ecgCanvas');
const statusText = document.getElementById('status-text');

const simulation = new ECGSimulation();
const renderer = new ECGRenderer(canvas);

// State
let timeOffset = 0;
let lastFrameTime = Date.now();
const socket = io('http://localhost:3000');

// Socket Events
socket.on('connect', () => {
    console.log('Connected to server');
});

socket.on('room_state', ({ userCount, serverTime }) => {
    const now = Date.now();
    timeOffset = serverTime - now;

    if (userCount >= 2) {
        statusText.innerText = `Connected (Users: ${userCount}) - SYNCHRONIZED`;
        statusText.style.color = '#ffd700';
        renderer.color = '#ffd700';
    } else {
        statusText.innerText = `Waiting for Partner...`;
        statusText.style.color = '#ff3333';
        renderer.color = '#ff3333';
    }
});

socket.on('glow_state', (isActive) => {
    renderer.glowActive = isActive;
});

socket.on('accelerate', ({ duration }) => {
    simulation.setBPM(120);

    // Singleton Label Pattern
    let label = document.getElementById('miss-you-label');

    if (!label) {
        label = document.createElement('div');
        label.id = 'miss-you-label';
        label.innerText = "Miss you";
        label.style.position = 'absolute';
        label.style.top = '50%';
        label.style.left = '50%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.color = 'rgba(255, 255, 255, 0.9)';
        label.style.fontFamily = 'Courier New';
        label.style.fontSize = '24px';
        // Reduced shadow to prevent blowout, and used distinct text color
        label.style.textShadow = '0 0 5px rgba(255, 255, 255, 0.5)';
        label.style.pointerEvents = 'none';
        label.style.transition = 'opacity 0.2s';
        label.style.opacity = '0';
        document.body.appendChild(label);

        // Force reflow
        void label.offsetWidth;
    }

    // Reset any pending removal
    if (label.removeTimeout) {
        clearTimeout(label.removeTimeout);
    }

    // Show
    label.style.opacity = '1';

    // Revert after duration
    label.removeTimeout = setTimeout(() => {
        simulation.setBPM(60);
        if (label) {
            label.style.opacity = '0';
            // We don't remove from DOM immediately to smooth repeat clicks, or we can.
            // Let's remove after fade out.
            setTimeout(() => { if (label.parentNode) label.remove(); }, 500);
        }
    }, duration);
});

// Input Handling
let holdStart = 0;

function onDown(e) {
    //   e.preventDefault(); // Prevent text selection etc
    holdStart = Date.now();
    socket.emit('holding_hand', true);
}

function onUp(e) {
    //   e.preventDefault();
    const dur = Date.now() - holdStart;
    socket.emit('holding_hand', false);

    if (dur < 300) {
        // Treat as click
        socket.emit('heartbeat_accelerate');
    }
}

window.addEventListener('mousedown', onDown);
window.addEventListener('mouseup', onUp);
window.addEventListener('touchstart', (e) => onDown(e.touches[0]));
window.addEventListener('touchend', onUp);

// Animation Loop
function loop() {
    requestAnimationFrame(loop);

    const now = Date.now();
    const dt = (now - lastFrameTime) / 1000;
    lastFrameTime = now;

    const syncedTime = (now + timeOffset) / 1000;

    renderer.draw(dt, syncedTime, simulation);
}

loop();
