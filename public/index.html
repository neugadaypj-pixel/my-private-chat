<!DOCTYPE html>
<html>
<head>
    <title>Приватный Чат</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        body { font-family: -apple-system, sans-serif; background: #e6ebee; margin: 0; height: 100vh; display: flex; flex-direction: column; }
        #messages { list-style-type: none; padding: 15px; margin: 0; flex-grow: 1; overflow-y: auto; display: flex; flex-direction: column; }
        #messages li { padding: 10px 15px; background: white; margin-bottom: 10px; border-radius: 18px; max-width: 70%; box-shadow: 0 1px 2px rgba(0,0,0,0.1); word-wrap: break-word; }
        #messages img { max-width: 100%; border-radius: 10px; display: block; }
        
        .controls { background: white; padding: 10px; display: flex; align-items: center; border-top: 1px solid #ddd; }
        input[type="text"] { flex-grow: 1; border: 1px solid #ddd; padding: 12px; border-radius: 25px; outline: none; }
        .file-btn { margin-right: 10px; cursor: pointer; font-size: 24px; color: #888; }
        #file-input { display: none; }
        button { background: #0088cc; color: white; border: none; padding: 10px 20px; margin-left: 10px; border-radius: 25px; font-weight: bold; }
    </style>
</head>
<body>
    <ul id="messages"></ul>
    
    <form class="controls" id="form">
        <label class="file-btn" for="file-input">📎</label>
        <input type="file" id="file-input" accept="image/*">
        
        <input id="input" type="text" autocomplete="off" placeholder="Сообщение...">
        <button>➤</button>
    </form>

    <script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    const form = document.getElementById('form');
    const input = document.getElementById('input');
    const fileInput = document.getElementById('file-input');
    const messages = document.getElementById('messages');

    // 1. Генерируем уникальный ID для этого браузера и сохраняем его
    let myId = localStorage.getItem('chat_id');
    if (!myId) {
        myId = Math.random().toString(36).substring(2);
        localStorage.setItem('chat_id', myId);
    }

    // 2. Обновляем функцию отрисовки сообщений
    function renderMessage(data) {
        const item = document.createElement('li');
        
        // Проверяем: если ID из сообщения совпадает с моим — это моё сообщение
        if (data.clientId === myId) {
            item.style.backgroundColor = '#dcf8c6'; // Светло-зеленый (как в WhatsApp)
            item.style.alignSelf = 'flex-end'; // Прижимаем вправо
        } else {
            item.style.backgroundColor = '#ffffff'; // Белый
            item.style.alignSelf = 'flex-start'; // Прижимаем влево
        }

        if (data.type === 'text') {
            item.textContent = data.content;
        } else if (data.type === 'image') {
            const img = document.createElement('img');
            img.src = data.content;
            item.appendChild(img);
        }
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    }

    socket.on('load history', (history) => {
        messages.innerHTML = '';
        history.forEach(renderMessage);
    });

    socket.on('chat message', renderMessage);

    // 3. Отправляем свой ID вместе с текстом
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        if (input.value) {
            socket.emit('chat message', { type: 'text', content: input.value, clientId: myId });
            input.value = '';
        }
    });

    // 4. Отправляем свой ID вместе с фото
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                socket.emit('chat message', { type: 'image', content: event.target.result, clientId: myId });
            };
            reader.readAsDataURL(file);
        }
    });
</script>
</body>
</html>