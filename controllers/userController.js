const User = require('../models/userModel');

exports.getAllUsers = (req, res) => {
    User.getAll((err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
};

exports.getUserById = (req, res) => {
    const { id } = req.params;
    User.getById(id, (err, row) => {
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
};

exports.createUser = (req, res) => {
    const user = req.body;
    User.create(user, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        res.json(result);
    });
};

exports.updateUser = (req, res) => {
    const { id } = req.params;
    const user = req.body;
    User.update(id, user, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }
        res.json(result);
    });
};

exports.deleteUser = (req, res) => {
    const { id } = req.params;
    User.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message });
            return;
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return;
        }
        res.json(result);
    });
};