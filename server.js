require('dotenv').config(); 
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
    maxHttpBufferSize: 1e7, // 10MB для картинок
    cors: { origin: "*" } 
});

// 1. Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('База данных MongoDB подключена!'))
  .catch(err => console.log('Ошибка подключения к БД:', err));

// 2. Схема сообщения ( clientId ОБЯЗАТЕЛЕН )
const messageSchema = new mongoose.Schema({
  type: String,
  content: String,
  clientId: String, // Вот это поле отвечает за цвет сообщений
  timestamp: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

app.use(express.static('public'));

io.on('connection', async (socket) => {
    // 3. Загрузка истории
    try {
        // Находим сообщения и убеждаемся, что clientId передается
        const history = await Message.find().sort({timestamp: 1}).limit(100);
        socket.emit('load history', history);
    } catch (err) {
        console.error('Ошибка загрузки истории:', err);
    }

    // 4. Получение нового сообщения
    socket.on('chat message', async (data) => {
        try {
            // Сохраняем в базу ВСЕ данные, включая clientId
            const newMsg = new Message({ 
                type: data.type, 
                content: data.content,
                clientId: data.clientId 
            });
            await newMsg.save();
            
            // Отправляем всем сообщение в реальном времени
            io.emit('chat message', data);
        } catch (err) {
            console.error('Ошибка сохранения сообщения:', err);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Сервер летит на порту ${PORT}`));