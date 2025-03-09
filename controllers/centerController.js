const Center = require('../models/centerModel');

exports.getAllCenters = (req, res) => {
    Center.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
};

exports.getCenterById = (req, res) => {
    const { id } = req.params;
    Center.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Пользователь не найден' });
            return
        }
        res.json(row)
    })
}

exports.createCenter = (req, res) => {
    const center = req.body
    Center.create(center, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateCenter = (req, res) => {
    const { id } = req.params
    const center = req.body
    Center.update(id, center, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Центр не найден' })
            return
        }
        res.json(result)
    })
}

exports.deleteCenter = (req, res) => {
    const { id } = req.params
    Center.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'центр не найден' })
            return
        }
        res.json(result)
    })
}