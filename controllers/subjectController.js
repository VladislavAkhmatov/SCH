const Subject = require('../models/subjectModel')

exports.getAllSubjects = (req, res) => {
    Subject.getAll((err, row) => {
        if (err) {
            res.status(500).json({ error: err.message })
            return
        }
        res.json(row)
    })
}

exports.getSubjectById = (req, res) => {
    const { id } = req.params
    Subject.getById(id, (err, row) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return
        }
        if (!row) {
            res.status(404).json({ error: 'Предмет не найден' });
            return
        }
        res.json(row)
    })
}

exports.createSubject = (req, res) => {
    const subject = req.body

    Subject.create(subject, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        res.json(result);
    });
};

exports.updateSubject = (req, res) => {
    const { id } = req.params
    const subject = req.body
    Subject.update(id, subject, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.updated === 0) {
            res.status(404).json({ error: 'Предмет не найден' })
            return
        }
        res.json(result)
    })
}

exports.deleteSubject = (req, res) => {
    const { id } = req.params
    Subject.delete(id, (err, result) => {
        if (err) {
            res.status(400).json({ error: err.message })
            return
        }
        if (result.deleted === 0) {
            res.status(404).json({ error: 'Предмет не найден' })
            return
        }
        res.json(result)
    })
}