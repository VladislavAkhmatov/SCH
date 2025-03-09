const db = require('../config/db');

class User {
    static getAll(callback) {
        db.all('SELECT * FROM Users', [], callback);
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Users WHERE ID = ?', [id], callback);
    }

    static create(user, callback) {
        const { PhoneNumber, Password, Email, FirstName, LastName } = user;
        db.run(
            `INSERT INTO Users (PhoneNumber, Password, Email, FirstName, LastName) VALUES (?, ?, ?, ?, ?)`,
            [PhoneNumber, Password, Email, FirstName, LastName],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, user, callback) {
        const { PhoneNumber, Password, Email, FirstName, LastName } = user;
        const updateQuery = `
      UPDATE Users 
      SET PhoneNumber = ?, Email = ?, FirstName = ?, LastName = ? ${Password ? ', Password = ?' : ''}
      WHERE ID = ?
    `;
        const params = Password ? [PhoneNumber, Email, FirstName, LastName, Password, id] : [PhoneNumber, Email, FirstName, LastName, id];
        db.run(updateQuery, params, function (err) {
            callback(err, { updated: this.changes });
        });
    }

    static delete(id, callback) {
        db.run(`DELETE FROM Users WHERE ID = ?`, [id], function (err) {
            callback(err, { deleted: this.changes });
        });
    }
}

module.exports = User;