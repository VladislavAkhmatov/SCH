const db = require('../config/db')

class Student {
    static getAll(callback) {
        db.all(`SELECT Students.ID,
            Students.UserID,
            Users.FirstName AS StudentFirstName,
            Users.LastName AS StudentLastName,
            Parents.ID AS ParentID,
            ParentUsers.FirstName AS ParentFirstName,
            ParentUsers.LastName AS ParentLastName,
            Users.Email AS StudentEmail,
            Users.PhoneNumber AS StudentPhoneNumber
      FROM 
          Students
      JOIN 
          Users ON Students.UserID = Users.ID
      JOIN 
          Parents ON Students.ParentID = Parents.ID
      JOIN 
          Users AS ParentUsers ON Parents.UserID = ParentUsers.ID`, [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Students WHERE ID = ?', [id], callback)
    }

    static create(student, callback) {
        const { UserID, ParentID } = student
        db.run(
            'INSERT INTO Students (UserID, ParentID) VALUES (?, ?)',
            [UserID, ParentID],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, student, callback) {
        const { UserID, ParentID } = student
        const query = "UPDATE Students SET UserID = ?, ParentID = ? WHERE ID = ?"

        const params = [UserID, ParentID, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Students WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Student