const Group = require('../models/groupModel')

exports.getAllGroups = (req, res) => {
    Group.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getGroupById = (req, res) => {
    const { id } = req.params
    Group.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Группа не найдена' });
            return
        }
        res.json(row)
    })
}

exports.createGroup = (req, res) => {
    const group = req.body

    Group.create(group, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateGroup = (req, res) => {
    const { id } = req.params
    const group = req.body
    Group.update(id, group, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Группа не найдена' })
            return
        }
        res.json(result)
    })
}

exports.deleteGroup = (req, res) => {
    const { id } = req.params
    Group.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Группа не найдена' })
            return
        }
        res.json(result)
    })
}