const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require('express-session');
const path = require('path');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key',
    resave: false,
    saveUninitialized: true
}));

// Подключение роутов
const userRoutes = require('./routes/userRoute');
const authRoutes = require('./routes/authRoute');
const centerRoutes = require('./routes/centerRoute');
const subjectRoutes = require('./routes/subjectRoute');
const groupRoutes = require('./routes/groupRoute');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/groups', groupRoutes);

module.exports = app;