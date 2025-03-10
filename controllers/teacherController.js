const Teacher = require('../models/teacherModel')

exports.getAllTeacher = (req, res) => {
    Teacher.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getTeacherById = (req, res) => {
    const { id } = req.params
    Teacher.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Учитель не найден(а)' });
            return
        }
        res.json(row)
    })
}

exports.createTeacher = (req, res) => {
    const teacher = req.body

    Teacher.create(teacher, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateTeacher = (req, res) => {
    const { id } = req.params
    const teacher = req.body
    Teacher.update(id, teacher, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Учитель не найден(а)' })
            return
        }
        res.json(result)
    })
}

exports.deleteTeacher = (req, res) => {
    const { id } = req.params
    Teacher.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Учитель не найден(а)' })
            return
        }
        res.json(result)
    })
}