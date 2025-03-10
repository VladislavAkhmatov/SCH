const Parent = require('../models/parentModel')

exports.getAllParent = (req, res) => {
    Parent.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getParentById = (req, res) => {
    const { id } = req.params
    Parent.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Родитель не найден(а)' });
            return
        }
        res.json(row)
    })
}

exports.createParent = (req, res) => {
    const parent = req.body

    Parent.create(parent, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateParent = (req, res) => {
    const { id } = req.params
    const parent = req.body
    Parent.update(id, parent, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Родитель не найден(а)' })
            return
        }
        res.json(result)
    })
}

exports.deleteParent = (req, res) => {
    const { id } = req.params
    Parent.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Родитель не найден(а)' })
            return
        }
        res.json(result)
    })
}
