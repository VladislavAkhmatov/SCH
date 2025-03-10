const Admin = require('../models/adminModel')

exports.getAllAdmin = (req, res) => {
    Admin.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getAdminById = (req, res) => {
    const { id } = req.params
    Admin.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Администратор не найден(а)' });
            return
        }
        res.json(row)
    })
}

exports.createAdmin = (req, res) => {
    const admin = req.body

    Admin.create(admin, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateAdmin = (req, res) => {
    const { id } = req.params
    const admin = req.body
    Admin.update(id, admin, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Администратор не найден(а)' })
            return
        }
        res.json(result)
    })
}

exports.deleteAdmin = (req, res) => {
    const { id } = req.params
    Admin.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Администратор не найден(а)' })
            return
        }
        res.json(result)
    })
}