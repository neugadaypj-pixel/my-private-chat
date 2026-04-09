require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e7, // Лимит 10мб для передачи фото
    cors: { origin: "*" } 
});

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('База данных MongoDB подключена!'))
  .catch(err => console.log('Ошибка подключения к БД:', err));

// Схема сообщения
const messageSchema = new mongoose.Schema({
  type: String,
  content: String,
  clientId: String,
  replyTo: String, 
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Функция автоочистки (лимит 500 сообщений)
async function cleanupDatabase() {
    try {
        const count = await Message.countDocuments();
        if (count > 500) {
            const oldest = await Message.find().sort({timestamp: 1}).limit(50);
            const idsToDelete = oldest.map(m => m._id);
            await Message.deleteMany({ _id: { $in: idsToDelete } });
            console.log('--- Авто-очистка: удалено 50 старых сообщений ---');
        }
    } catch (err) {
        console.error('Ошибка при очистке БД:', err);
    }
}

app.use(express.static('public'));

io.on('connection', async (socket) => {
    // Уведомляем собеседника об онлайн-статусе
    socket.broadcast.emit('user status', 'online');
    if (io.engine.clientsCount > 1) {
        socket.emit('user status', 'online');
    }

    // Загрузка истории
    try {
        const history = await Message.find().sort({timestamp: 1}).limit(100);
        socket.emit('load history', history);
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }

    // Индикатор печати
    socket.on('typing', () => socket.broadcast.emit('typing'));
    socket.on('stop typing', () => socket.broadcast.emit('stop typing'));

    // Статус "не в сети" при выходе
    socket.on('disconnect', () => socket.broadcast.emit('user status', 'offline'));

    // Обработка сообщения
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

    // Полная очистка чата вручную
    socket.on('clear chat', async () => {
        try {
            await Message.deleteMany({});
            io.emit('chat cleared');
        } catch (err) {
            console.error('Ошибка при ручной очистке:', err);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер запущен на порту ${PORT}`));