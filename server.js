require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e7, 
    cors: { origin: "*" } 
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('База данных MongoDB подключена!'))
  .catch(err => console.log('Ошибка подключения к БД:', err));

const messageSchema = new mongoose.Schema({
  type: String,
  content: String,
  clientId: String,
  replyTo: String, 
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

async function cleanupDatabase() {
    try {
        const count = await Message.countDocuments();
        if (count > 500) {
            const oldest = await Message.find().sort({timestamp: 1}).limit(50);
            const idsToDelete = oldest.map(m => m._id);
            await Message.deleteMany({ _id: { $in: idsToDelete } });
            console.log('--- База почищена (удалено 50 старых сообщений) ---');
        }
    } catch (err) {
        console.error('Ошибка при очистке БД:', err);
    }
}

app.use(express.static('public'));

io.on('connection', async (socket) => {
    // 1. Уведомляем собеседника, что мы зашли
    socket.broadcast.emit('user status', 'online');

    // 2. Если в чате уже кто-то есть, помечаем его как "онлайн" для текущего пользователя
    if (io.engine.clientsCount > 1) {
        socket.emit('user status', 'online');
    }

    try {
        const history = await Message.find().sort({timestamp: -1}).limit(100);
socket.emit('load history', history.reverse());
        socket.emit('load history', history);
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }

    socket.on('typing', () => {
        socket.broadcast.emit('typing');
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('stop typing');
    });

    // 3. Уведомляем об уходе пользователя
    socket.on('disconnect', () => {
        socket.broadcast.emit('user status', 'offline');
    });

    socket.on('chat message', async (data) => {
        try {
            await cleanupDatabase();
            const newMsg = new Message({ 
                type: data.type, 
                content: data.content,
                clientId: data.clientId,
                replyTo: data.replyTo 
            });
            await newMsg.save();
            io.emit('chat message', data);
        } catch (err) {
            console.error('Ошибка сохранения:', err);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер летит на порту ${PORT}`));