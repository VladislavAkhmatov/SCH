const Student = require('../models/studentModel')

exports.getAllStudent = (req, res) => {
    Student.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getStundentById = (req, res) => {
    const { id } = req.params
    Student.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Студент не найден' });
            return
        }
        res.json(row)
    })
}

exports.createStudent = (req, res) => {
    const group = req.body

    Student.create(group, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateStudent = (req, res) => {
    const { id } = req.params
    const student = req.body
    Student.update(id, student, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Студент не найден' })
            return
        }
        res.json(result)
    })
}

exports.deleteStudent = (req, res) => {
    const { id } = req.params
    Student.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Студент не найден' })
            return
        }
        res.json(result)
    })
}