const socketio = require('socket.io');

let io;

const init = (server) => {
    io = socketio(server, {
        cors: {
            origin: "*", // Adjust as per frontend URL in production
            methods: ["GET", "POST", "PUT"]
        }
    });

    io.on('connection', (socket) => {
        console.log(`[SOCKET] User connected: ${socket.id}`);

        socket.on('join', (userId) => {
            socket.join(userId);
            console.log(`[SOCKET] User ${userId} joined their private room.`);
        });

        socket.on('disconnect', () => {
            console.log(`[SOCKET] User disconnected: ${socket.id}`);
        });
    });

    return io;
};

const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized');
    }
    return io;
};

const emitUpdate = (room, event, data) => {
    if (io) {
        io.to(room).emit(event, data);
        console.log(`[SOCKET] Emitted ${event} to room ${room}`);
    }
};

module.exports = { init, getIO, emitUpdate };
