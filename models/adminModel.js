const db = require('../config/db')

class Admin {
    static getAll(callback) {
        db.all(`SELECT Admins.ID, Users.FirstName, Users.LastName, Users.Email, 
            Users.PhoneNumber, Centers.Name AS CenterName
            FROM Admins
            JOIN Users ON Admins.UserID = Users.ID
            LEFT JOIN Centers ON Admins.CenterID = Centers.ID`, [], callback)
    }

    static getById(id, callback) {
        db.get(`SELECT Admins.ID, Users.FirstName, Users.LastName, Users.Email, Users.PhoneNumber, Admins.CenterID
    FROM Admins
    JOIN Users ON Admins.UserID = Users.ID
    WHERE Admins.ID = ?`, [id], callback)
    }

    static create(admin, callback) {
        const { UserID, CenterID } = admin
        db.run(
            'INSERT INTO Admins (UserID, CenterID) VALUES (?, ?)',
            [UserID, CenterID],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, group, callback) {
        const { UserID, CenterID } = group
        const query = "UPDATE Admins SET UserID = ?, CenterID = ? WHERE ID = ?"

        const params = [UserID, CenterID, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Admins WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Admin