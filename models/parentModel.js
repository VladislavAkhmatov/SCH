const db = require('../config/db')

class Parent {
    static getAll(callback) {
        db.all(`SELECT Parents.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber
        FROM Parents
        JOIN Users ON Parents.UserID = Users.ID`, [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Parents WHERE ID = ?', [id], callback)
    }

    static create(parent, callback) {
        const { UserID } = parent
        db.run(
            'INSERT INTO Parents (UserID) VALUES (?)',
            [UserID],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, parent, callback) {
        const { UserID } = parent
        const query = "UPDATE Parents SET UserID = ? WHERE ID = ?"

        const params = [UserID, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Parents WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Parent