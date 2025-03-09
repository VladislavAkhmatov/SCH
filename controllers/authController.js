const db = require('../config/db');

exports.getRole = (req, res) => {
    if (req.session.user) {
        res.json({ role: req.session.user.role });
    } else {
        res.status(401).json({ error: 'Пользователь не авторизован' });
    }
};

exports.login = (req, res) => {
    const { phoneNumber, password } = req.body;

    db.get('SELECT * FROM Users WHERE PhoneNumber = ? AND Password = ?', [phoneNumber, password], (err, user) => {
        if (err) {
            res.status(500).json({ success: false, error: 'Ошибка сервера' });
            return;
        }
        if (!user) {
            res.json({ success: false, error: 'Неверный номер телефона или пароль' });
            return;
        }

        // Проверка роли пользователя
        db.get('SELECT * FROM Admins WHERE UserID = ?', [user.ID], (err, admin) => {
            if (err) {
                res.status(500).json({ success: false, error: 'Ошибка сервера' });
                return;
            }

            if (admin) {
                req.session.user = { id: user.ID, role: 'admin' };
                res.json({ success: true, role: 'admin' });
                return;
            }

            db.get('SELECT * FROM Owners WHERE UserID = ?', [user.ID], (err, owner) => {
                if (err) {
                    res.status(500).json({ success: false, error: 'Ошибка сервера' });
                    return;
                }

                if (owner) {
                    req.session.user = { id: user.ID, role: 'owner' };
                    res.json({ success: true, role: 'owner' });
                } else {
                    res.json({ success: false, error: 'Доступ запрещён. Вы не являетесь администратором или владельцем.' });
                }
            });
        });
    });
};

