
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const path = require('path');

// Serve static files from Vite build (dist)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback for SPA (though we don't have routing, it ensures index serves)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const io = new Server(server, {
    cors: {
        origin: "*", // For prototype flexibility
        methods: ["GET", "POST"]
    }
});

const PORT = 3000;

const connectedUsers = new Set();

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    connectedUsers.add(socket.id);

    // Broadcast user count
    io.emit('room_state', {
        userCount: connectedUsers.size,
        serverTime: Date.now()
    });

    // Interactive Hooks
    socket.on('holding_hand', (isHolding) => {
        socket.data.isHolding = isHolding;

        // Check if at least 2 users are holding
        let holdingCount = 0;
        const sockets = io.sockets.sockets; // Map of sockets
        for (const [id, s] of sockets) {
            if (s.data.isHolding) holdingCount++;
        }

        const isGlow = holdingCount >= 2;
        io.emit('glow_state', isGlow);
    });

    socket.on('heartbeat_accelerate', () => {
        io.emit('accelerate', { duration: 5000 });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        connectedUsers.delete(socket.id);
        io.emit('room_state', {
            userCount: connectedUsers.size,
            serverTime: Date.now()
        });
    });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
