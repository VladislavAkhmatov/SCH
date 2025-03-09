// Импорт необходимых модулей
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Импортируем модуль path
const session = require('express-session'); // Подключаем express-session
const app = require('./app');
const port = 3000;


// Используем CORS для разрешения запросов с других доменов (например, если фронтенд на другом порту)
app.use(cors());

// Используем bodyParser для обработки JSON-запросов
app.use(bodyParser.json());

// Настройка для обслуживания статических файлов из папки public
app.use(express.static(path.join(__dirname, 'public')));

// Использование сессий для хранения данных о пользователе
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));

// Запуск сервера
app.listen(3000, '0.0.0.0', () => {
  console.log('Сервер запущен на http://localhost:3000');
});

