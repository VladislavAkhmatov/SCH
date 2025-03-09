const db = require('../config/db');

class Subject {
    static getAll(callback) {
        db.all('SELECT * FROM Subjects', [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Subjects WHERE id = ?', [id], callback)
    }

    static create(subject, callback) {
        const { SubjectName } = subject
        db.run(
            'INSERT INTO Subjects (SubjectName) VALUES (?)',
            [SubjectName],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, subject, callback) {
        const { SubjectName } = subject
        const query = "UPDATE Subjects SET SubjectName = ? WHERE ID = ?"

        const params = [SubjectName, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Subjects WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Subject