// Импорт необходимых модулей
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path'); // Импортируем модуль path
const session = require('express-session'); // Подключаем express-session
const https = require('https'); // Импортируем модуль https
const fs = require('fs'); // Импортируем модуль fs для работы с файловой системой

const app = express();
const port = 3000; // Порт для HTTPS

// Замените пути к вашим сертификатам на актуальные
const sslOptions = {
  key: fs.readFileSync('./ssl/private.key'), // Путь к вашему приватному ключу
  cert: fs.readFileSync('./ssl/certificate.crt') // Путь к вашему сертификату
};

// Подключение к базе данных SQLite
const db = new sqlite3.Database('./school.db', (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite установлено.');
  }
});

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

// Создание таблицы Users, если она не существует
db.run(`
  CREATE TABLE IF NOT EXISTS Users (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    PhoneNumber TEXT UNIQUE NOT NULL,
    Password TEXT NOT NULL,
    Email TEXT NOT NULL,
    FirstName TEXT NOT NULL,
    LastName TEXT NOT NULL
  )
`);

// Получение списка всех пользователей
app.get('/api/users', (req, res) => {
  db.all('SELECT * FROM Users', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Получение пользователя по ID
app.get('/api/users/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM Users WHERE ID = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json(row);
  });
});

// Логика авторизации
app.post('/api/login', (req, res) => {
  const { phoneNumber, password } = req.body;

  // Проверяем, существует ли пользователь с указанным номером телефона и паролем
  db.get('SELECT * FROM Users WHERE PhoneNumber = ? AND Password = ?', [phoneNumber, password], (err, user) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Ошибка сервера' });
      return;
    }
    if (!user) {
      res.json({ success: false, error: 'Неверный номер телефона или пароль' });
      return;
    }

    // Проверяем, является ли пользователь администратором
    db.get('SELECT * FROM Admins WHERE UserID = ?', [user.ID], (err, admin) => {
      if (err) {
        res.status(500).json({ success: false, error: 'Ошибка сервера' });
        return;
      }

      if (admin) {
        // Сохраняем роль в сессии
        req.session.user = { id: user.ID, role: 'admin' };
        res.json({ success: true, role: 'admin' }); // Администратор найден
        return;
      }

      // Проверяем, является ли пользователь владельцем
      db.get('SELECT * FROM Owners WHERE UserID = ?', [user.ID], (err, owner) => {
        if (err) {
          res.status(500).json({ success: false, error: 'Ошибка сервера' });
          return;
        }

        if (owner) {
          // Сохраняем роль в сессии
          req.session.user = { id: user.ID, role: 'owner' };
          res.json({ success: true, role: 'owner' }); // Владелец найден
        } else {
          res.json({ success: false, error: 'Доступ запрещён. Вы не являетесь администратором или владельцем.' });
        }
      });
    });
  });
});

// Эндпоинт для получения роли пользователя
app.get('/api/get-role', (req, res) => {
  if (req.session.user) {
    res.json({ role: req.session.user.role });
  } else {
    res.status(401).json({ error: 'Пользователь не авторизован' });
  }
});



// Добавление нового пользователя
app.post('/api/users', (req, res) => {
  const { PhoneNumber, Password, Email, FirstName, LastName } = req.body;
  db.run(
    `INSERT INTO Users (PhoneNumber, Password, Email, FirstName, LastName) VALUES (?, ?, ?, ?, ?)`,
    [PhoneNumber, Password, Email, FirstName, LastName],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});
// Обновление данных пользователя
app.put('/api/users/:id', (req, res) => {
  const { id } = req.params;
  const { PhoneNumber, Password, Email, FirstName, LastName } = req.body;

  // Если пароль передан, обновляем его, иначе не обновляем
  const updateQuery = `
    UPDATE Users 
    SET PhoneNumber = ?, Email = ?, FirstName = ?, LastName = ? ${Password ? ', Password = ?' : ''}
    WHERE ID = ?
  `;

  const params = Password ? [PhoneNumber, Email, FirstName, LastName, Password, id] : [PhoneNumber, Email, FirstName, LastName, id];

  db.run(updateQuery, params, function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json({ updated: this.changes });
  });
});


// Удаление пользователя
app.delete('/api/users/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM Users WHERE ID = ?`, [id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Пользователь не найден' });
      return;
    }
    res.json({ deleted: this.changes });
  });
});

// Создание таблицы Centers, если она не существует
db.run(`
  CREATE TABLE IF NOT EXISTS Centers (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Address TEXT NOT NULL
  )
`);

// Получение списка всех центров
app.get('/api/centers', (req, res) => {
  db.all('SELECT * FROM Centers', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Получение центра по ID
app.get('/api/centers/:id', (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM Centers WHERE ID = ?', [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Центр не найден' });
      return;
    }
    res.json(row);
  });
});

// Добавление нового центра
app.post('/api/centers', (req, res) => {
  const { Name, Address } = req.body;
  db.run(
    `INSERT INTO Centers (Name, Address) VALUES (?, ?)`,
    [Name, Address],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Обновление данных центра
app.put('/api/centers/:id', (req, res) => {
  const { id } = req.params;
  const { Name, Address } = req.body;

  db.run(
    `UPDATE Centers SET Name = ?, Address = ? WHERE ID = ?`,
    [Name, Address, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Центр не найден' });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
});

// Удаление центра
app.delete('/api/centers/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM Centers WHERE ID = ?`, [id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Центр не найден' });
      return;
    }
    res.json({ deleted: this.changes });
  });
});


// Создание таблицы Admins, если она не существует
db.run(`
  CREATE TABLE IF NOT EXISTS Admins (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    UserID INTEGER NOT NULL,
    CenterID INTEGER,
    FOREIGN KEY (UserID) REFERENCES Users (ID),
    FOREIGN KEY (CenterID) REFERENCES Centers (ID)
  )
`);

// Получение списка всех администраторов
app.get('/api/admins', (req, res) => {
  db.all(`
    SELECT Admins.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber, Centers.Name AS CenterName
    FROM Admins
    JOIN Users ON Admins.UserID = Users.ID
    LEFT JOIN Centers ON Admins.CenterID = Centers.ID
  `, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

// Получение администратора по ID
app.get('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  db.get(`
    SELECT Admins.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber, Admins.CenterID
    FROM Admins
    JOIN Users ON Admins.UserID = Users.ID
    WHERE Admins.ID = ?
  `, [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Администратор не найден' });
      return;
    }
    res.json(row);
  });
});

// Добавление нового администратора
app.post('/api/admins', (req, res) => {
  const { UserID, CenterID } = req.body;
  db.run(
    `INSERT INTO Admins (UserID, CenterID) VALUES (?, ?)`,
    [UserID, CenterID],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      res.json({ id: this.lastID });
    }
  );
});

// Обновление данных администратора
app.put('/api/admins/:id', (req, res) => {
  const { id } = req.params;
  const { UserID, CenterID } = req.body;

  db.run(
    `UPDATE Admins SET UserID = ?, CenterID = ? WHERE ID = ?`,
    [UserID, CenterID, id],
    function (err) {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      if (this.changes === 0) {
        res.status(404).json({ error: 'Администратор не найден' });
        return;
      }
      res.json({ updated: this.changes });
    }
  );
});


// Удаление администратора
app.delete('/api/admins/:id', (req, res) => {
  const { id } = req.params;

  db.run(`DELETE FROM Admins WHERE ID = ?`, [id], function (err) {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ error: 'Администратор не найден' });
      return;
    }
    res.json({ deleted: this.changes });
  });
});



// Создание таблицы предметов
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS Subjects (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          SubjectName TEXT NOT NULL
      )
  `);
});

// Получение всех предметов
app.get('/api/subjects', (req, res) => {
  db.all(`SELECT ID, SubjectName FROM Subjects`, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      res.json(rows);
  });
});

// Получение предмета по ID
app.get('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM Subjects WHERE ID = ?`, [id], (err, row) => {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      if (!row) {
          res.status(404).json({ error: 'Предмет не найден' });
          return;
      }
      res.json(row);
  });
});

// Добавление нового предмета
app.post('/api/subjects', (req, res) => {
  const { SubjectName } = req.body;
  db.run(`INSERT INTO Subjects (SubjectName) VALUES (?)`, [SubjectName], function(err) {
      if (err) {
          res.status(400).json({ error: err.message });
          return;
      }
      res.status(201).json({ ID: this.lastID });
  });
});

// Обновление предмета
app.put('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  const { SubjectName } = req.body;

  db.run(`UPDATE Subjects SET SubjectName = ? WHERE ID = ?`, [SubjectName, id], function(err) {
      if (err) {
          res.status(400).json({ error: err.message });
          return;
      }
      if (this.changes === 0) {
          res.status(404).json({ error: 'Предмет не найден' });
          return;
      }
      res.json({ updated: this.changes });
  });
});

// Удаление предмета
app.delete('/api/subjects/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM Subjects WHERE ID = ?`, [id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
          return;
      }
      if (this.changes === 0) {
          res.status(404).json({ error: 'Предмет не найден' });
          return;
      }
      res.json({ deleted: this.changes });
  });
});

// Создание таблицы учителей
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS Teachers (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          SubjectID INTEGER NOT NULL,
          FOREIGN KEY (UserID) REFERENCES Users (ID),
          FOREIGN KEY (SubjectID) REFERENCES Subjects (ID)
      )
  `);
});

// Получение списка учителей
app.get('/api/teachers', (req, res) => {
  db.all(`
      SELECT Teachers.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber, Subjects.SubjectName
      FROM Teachers
      JOIN Users ON Teachers.UserID = Users.ID
      JOIN Subjects ON Teachers.SubjectID = Subjects.ID
  `, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});

// Получение учителя по ID
app.get('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM Teachers WHERE ID = ?`, [id], (err, row) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(row);
      }
  });
});

// Добавление нового учителя
app.post('/api/teachers', (req, res) => {
  const { UserID, SubjectID } = req.body;
  db.run(`INSERT INTO Teachers (UserID, SubjectID) VALUES (?, ?)`, [UserID, SubjectID], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(201).json({ id: this.lastID });
      }
  });
});

// Обновление учителя
app.put('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  const { UserID, SubjectID } = req.body;
  db.run(`UPDATE Teachers SET UserID = ?, SubjectID = ? WHERE ID = ?`, [UserID, SubjectID, id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Удаление учителя
app.delete('/api/teachers/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM Teachers WHERE ID = ?`, [id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Создание таблицы родителей
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS Parents (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          FOREIGN KEY (UserID) REFERENCES Users (ID)
      )
  `);
});

// Получение списка родителей
app.get('/api/parents', (req, res) => {
  db.all(`
      SELECT Parents.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber
      FROM Parents
      JOIN Users ON Parents.UserID = Users.ID
  `, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});

// Получение родителя по ID
app.get('/api/parents/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM Parents WHERE ID = ?`, [id], (err, row) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(row);
      }
  });
});

// Добавление нового родителя
app.post('/api/parents', (req, res) => {
  const { UserID } = req.body;
  db.run(`INSERT INTO Parents (UserID) VALUES (?)`, [UserID], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(201).json({ id: this.lastID });
      }
  });
});

// Обновление родителя
app.put('/api/parents/:id', (req, res) => {
  const { id } = req.params;
  const { UserID } = req.body;
  db.run(`UPDATE Parents SET UserID = ? WHERE ID = ?`, [UserID, id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Удаление родителя
app.delete('/api/parents/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM Parents WHERE ID = ?`, [id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Создание таблицы учеников
db.serialize(() => {
  db.run(`
      CREATE TABLE IF NOT EXISTS Students (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          UserID INTEGER NOT NULL,
          ParentID INTEGER NOT NULL,
          FOREIGN KEY (UserID) REFERENCES Users (ID),
          FOREIGN KEY (ParentID) REFERENCES Parents (ID)
      )
  `);
});

// Получение всех учеников
app.get('/api/students', (req, res) => {
  db.all(`
      SELECT 
          Students.ID, 
          Students.UserID, 
          Users.FirstName AS StudentFirstName, 
          Users.LastName AS StudentLastName, 
          Parents.ID AS ParentID, 
          ParentUsers.FirstName AS ParentFirstName, 
          ParentUsers.LastName AS ParentLastName,
          Users.Email AS StudentEmail,
          Users.PhoneNumber AS StudentPhoneNumber
      FROM 
          Students
      JOIN 
          Users ON Students.UserID = Users.ID
      JOIN 
          Parents ON Students.ParentID = Parents.ID
      JOIN 
          Users AS ParentUsers ON Parents.UserID = ParentUsers.ID`, [], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});


// Получение ученика по ID
app.get('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.get(`SELECT * FROM Students WHERE ID = ?`, [id], (err, row) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(row);
      }
  });
});

// Создание нового ученика
app.post('/api/students', (req, res) => {
  const { UserID, ParentID } = req.body;
  db.run(`INSERT INTO Students (UserID, ParentID) VALUES (?, ?)`, [UserID, ParentID], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(201).json({ ID: this.lastID });
      }
  });
});

// Обновление ученика
app.put('/api/students/:id', (req, res) => {
  const { id } = req.params;
  const { UserID, ParentID } = req.body;
  db.run(`UPDATE Students SET UserID = ?, ParentID = ? WHERE ID = ?`, [UserID, ParentID, id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Удаление ученика
app.delete('/api/students/:id', (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM Students WHERE ID = ?`, [id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(204).send();
      }
  });
});

// Получение всех групп
app.get('/api/groups', (req, res) => {
  db.all("SELECT * FROM Groups", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Добавление новой группы
app.post('/api/groups', (req, res) => {
  const { Name } = req.body;
  db.run("INSERT INTO Groups (Name) VALUES (?)", [Name], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ ID: this.lastID });
    }
  });
});

// Обновление информации о группе
app.put('/api/groups/:id', (req, res) => {
  const { Name } = req.body;
  const { id } = req.params;
  db.run("UPDATE Groups SET Name = ? WHERE ID = ?", [Name, id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ changedRows: this.changes });
    }
  });
});

// Удаление группы
app.delete('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM Groups WHERE ID = ?", [id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ deletedRows: this.changes });
    }
  });
});

// Получение данных о конкретной группе по ID
app.get('/api/groups/:id', (req, res) => {
  const { id } = req.params;
  db.get("SELECT * FROM Groups WHERE ID = ?", [id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!row) {
      res.status(404).json({ error: "Группа не найдена" });
    } else {
      res.json(row);
    }
  });
});

// Получение списка учеников, которые не входят в указанную группу
app.get('/api/groups/:id/available-students', (req, res) => {
  const { id } = req.params;
  db.all(`
      SELECT 
          Students.ID, 
          Users.FirstName AS StudentFirstName, 
          Users.LastName AS StudentLastName 
      FROM 
          Students 
      JOIN 
          Users ON Students.UserID = Users.ID 
      LEFT JOIN 
          StudentGroups ON Students.ID = StudentGroups.StudentID AND StudentGroups.GroupID = ? 
      WHERE 
          StudentGroups.GroupID IS NULL
  `, [id], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});


// Получение всех учеников, состоящих в группе
app.get('/api/groups/:id/students', (req, res) => {
  const { id } = req.params;
  db.all(`
      SELECT 
          Students.ID, 
          Users.FirstName AS StudentFirstName, 
          Users.LastName AS StudentLastName 
      FROM 
          StudentGroups 
      JOIN 
          Students ON StudentGroups.StudentID = Students.ID 
      JOIN 
          Users ON Students.UserID = Users.ID 
      WHERE 
          StudentGroups.GroupID = ?`, [id], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});

// Добавление ученика в группу
app.post('/api/groups/:id/students', (req, res) => {
  const { studentId } = req.body;
  const { id } = req.params;
  db.run(`INSERT INTO StudentGroups (StudentID, GroupID) VALUES (?, ?)`, [studentId, id], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.status(201).json({ ID: this.lastID });
      }
  });
});

// Удаление ученика из группы
app.delete('/api/groups/:groupId/students/:studentId', (req, res) => {
  const { groupId, studentId } = req.params;
  db.run(`DELETE FROM StudentGroups WHERE GroupID = ? AND StudentID = ?`, [groupId, studentId], function(err) {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json({ deletedRows: this.changes });
      }
  });
});


// Проверка конфликтов расписания
app.post('/api/schedule/check', (req, res) => {
  const { date, time, groupId, teacherId } = req.body;
  db.all(`
      SELECT * FROM Schedule
      WHERE Date = ? AND Time = ? 
        AND (GroupID = ? OR TeacherID = ?)
  `, [date, time, groupId, teacherId], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json({ isConflict: rows.length > 0 });
      }
  });
});

/// Создание новой записи или обновление
app.post('/api/schedule', async (req, res) => {
  const schedules = req.body.schedules; // Получаем массив расписаний

  // Проверка на конфликты перед сохранением
  for (const schedule of schedules) {
      const { date, time, groupId, teacherId } = schedule;
      const conflict = await new Promise((resolve) => {
          db.get(`
              SELECT * FROM Schedule
              WHERE Date = ? AND Time = ?
              AND (GroupID = ? OR TeacherID = ?)
          `, [date, time, groupId, teacherId], (err, row) => {
              if (err) {
                  return resolve({ error: err.message });
              }
              resolve(row);
          });
      });
      
      if (conflict) {
          return res.status(409).json({ error: `Конфликт: Группа или преподаватель уже имеют занятие на ${date} в ${time}` });
      }
  }

  // Если конфликты не найдены, продолжаем с транзакцией
  db.exec("BEGIN TRANSACTION", (err) => {
      if (err) {
          return res.status(500).json({ error: err.message });
      }

      const promises = schedules.map(schedule => {
          return new Promise((resolve, reject) => {
              // Проверка существующей записи
              db.get(`
                  SELECT * FROM Schedule 
                  WHERE Date = ? AND GroupID = ? AND SubjectID = ?
              `, [schedule.date, schedule.groupId, schedule.subjectId], (err, row) => {
                  if (err) {
                      return reject(err);
                  }

                  if (row) {
                      // Если запись существует, обновляем её
                      db.run(`
                          UPDATE Schedule 
                          SET Time = ?, TeacherID = ?, CenterID = ? 
                          WHERE Date = ? AND GroupID = ? AND SubjectID = ?
                      `, [schedule.time, schedule.teacherId, schedule.centerId, schedule.date, schedule.groupId, schedule.subjectId], (err) => {
                          if (err) {
                              return reject(err);
                          }
                          resolve();
                      });
                  } else {
                      // Если записи нет, вставляем новую
                      db.run(`
                          INSERT INTO Schedule (Date, Time, GroupID, TeacherID, SubjectID, CenterID) 
                          VALUES (?, ?, ?, ?, ?, ?)
                      `, [schedule.date, schedule.time, schedule.groupId, schedule.teacherId, schedule.subjectId, schedule.centerId], (err) => {
                          if (err) {
                              return reject(err);
                          }
                          resolve();
                      });
                  }
              });
          });
      });

      Promise.all(promises).then(() => {
          db.run("COMMIT", (err) => {
              if (err) {
                  return res.status(500).json({ error: err.message });
              }
              res.json({ message: 'Расписание успешно сохранено' });
          });
      }).catch(err => {
          db.run("ROLLBACK");
          res.status(500).json({ error: err.message });
      });
  });
});



// Получение списка учителей с учетом выбранного предмета
app.get('/api/teachers', (req, res) => {
  const subjectId = req.query.subjectId;
  let query = `
      SELECT Teachers.ID, Users.FirstName, Users.LastName
      FROM Teachers
      JOIN Users ON Teachers.UserID = Users.ID
  `;
  let params = [];

  if (subjectId) {
      query += ` WHERE Teachers.SubjectID = ?`;
      params.push(subjectId);
  }

  db.all(query, params, (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});


// Получение расписания для конкретной группы, периода и предмета
app.get('/api/schedule', (req, res) => {
  const { groupId, subjectId, month, year } = req.query;
  db.all(`
      SELECT Schedule.*, Users.FirstName AS TeacherFirstName, Users.LastName AS TeacherLastName
      FROM Schedule
      LEFT JOIN Teachers ON Schedule.TeacherID = Teachers.ID
      LEFT JOIN Users ON Teachers.UserID = Users.ID
      WHERE Schedule.GroupID = ? AND Schedule.SubjectID = ?
      AND strftime('%m', Schedule.Date) = ?
      AND strftime('%Y', Schedule.Date) = ?
  `, [groupId, subjectId, month.padStart(2, '0'), year], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});


// Сохранение оценок и присутствия
app.post('/api/grades', (req, res) => {
  const { gradesData, subjectId } = req.body;

  const query = `
  INSERT INTO Grades (StudentID, SubjectID, Date, Presence, HomeworkGrade, ActivityGrade)
  VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(StudentID, SubjectID, Date) DO UPDATE SET 
      Presence = excluded.Presence,
      HomeworkGrade = excluded.HomeworkGrade,
      ActivityGrade = excluded.ActivityGrade;
  `;

  const stmt = db.prepare(query);

  db.serialize(() => {
      gradesData.forEach(({ studentId, date, presence, homework, activity }) => {
          stmt.run([studentId, subjectId, date, presence ? 1 : 0, homework, activity], (err) => {
              if (err) {
                  console.error(err.message);
              }
          });
      });
      stmt.finalize();
  });

  res.json({ message: "Оценки успешно сохранены" });
});

// Получение оценок учеников по группе, предмету, учителю и месяцу
app.get('/api/grades', (req, res) => {
  const { groupId, subjectId, teacherId, month, year } = req.query;

  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  const query = `
    SELECT 
      Students.ID AS StudentID,
      Users.FirstName AS StudentFirstName, 
      Users.LastName AS StudentLastName,
      Grades.Date,
      Grades.Presence,
      Grades.HomeworkGrade,
      Grades.ActivityGrade
    FROM 
      Grades
    JOIN 
      Students ON Grades.StudentID = Students.ID
    JOIN 
      Users ON Students.UserID = Users.ID
    JOIN 
      StudentGroups ON Students.ID = StudentGroups.StudentID
    JOIN 
      Groups ON StudentGroups.GroupID = Groups.ID
    WHERE 
      Groups.ID = ? AND 
      Grades.SubjectID = ? AND 
      Grades.Date BETWEEN ? AND ?
  `;

  db.all(query, [groupId, subjectId, startDate, endDate], (err, rows) => {
      if (err) {
          res.status(500).json({ error: err.message });
      } else {
          res.json(rows);
      }
  });
});





// Запуск HTTPS сервера
https.createServer(sslOptions, app).listen(port, '0.0.0.0', () => {
  console.log(`Сервер запущен на https://localhost:${port}`);
});

// HTTP сервер для перенаправления на HTTPS
const http = require('http');
http.createServer((req, res) => {
  res.writeHead(301, { "Location": `https://${req.headers.host}${req.url}` });
  res.end();
}).listen(80); // Порт 80 для HTTP

