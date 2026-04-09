require('dotenv').config(); // Подключаем чтение .env файла
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 1e7 });

// 1. Подключаемся к MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('База данных MongoDB подключена!'))
  .catch(err => console.log('Ошибка подключения к БД:', err));

// 2. Создаем структуру (схему) того, как выглядит сообщение в базе
const messageSchema = new mongoose.Schema({
  type: String,    // 'text' или 'image'
  content: String, // сам текст или base64 картинки
  timestamp: { type: Date, default: Date.now } // время отправки
});
const Message = mongoose.model('Message', messageSchema);

app.use(express.static('public'));

io.on('connection', async (socket) => {
    // 3. При входе человека достаем из базы последние 100 сообщений
    try {
        const history = await Message.find().sort({timestamp: 1}).limit(100);
        socket.emit('load history', history);
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }

    socket.on('chat message', async (data) => {
        // 4. Сохраняем новое сообщение прямо в облачную базу
        try {
            const newMsg = new Message({ type: data.type, content: data.content });
            await newMsg.save();
            
            // Рассылаем всем в чате
            io.emit('chat message', data);
        } catch (err) {
            console.error('Ошибка сохранения сообщения:', err);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер летит на порту ${PORT}`));