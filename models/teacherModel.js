const db = require('../config/db')

class Teacher {
    static getAll(callback) {
        db.all(`SELECT Teachers.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber, Subjects.SubjectName
      FROM Teachers
      JOIN Users ON Teachers.UserID = Users.ID
      JOIN Subjects ON Teachers.SubjectID = Subjects.ID`, [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Teachers WHERE ID = ?', [id], callback)
    }

    static create(teacher, callback) {
        const { UserID, SubjectID } = teacher
        db.run(
            'INSERT INTO Teachers (UserID, SubjectID) VALUES (?, ?)',
            [UserID, SubjectID],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, teacher, callback) {
        const { UserID, SubjectID } = teacher
        const query = "UPDATE Teachers SET UserID = ?, SubjectID = ? WHERE ID = ?"

        const params = [UserID, SubjectID, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Teachers WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Teacher