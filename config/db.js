const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./school.db', (err) => {
    if (err) {
        console.error('Ошибка при подключении к базе данных:', err.message);
    } else {
        console.log('Подключение к базе данных SQLite установлено.');
    }
});

module.exports = db;