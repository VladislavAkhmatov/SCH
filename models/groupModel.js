const db = require('../config/db')

class Group {
    static getAll(callback) {
        db.all('SELECT * FROM Groups', [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Groups WHERE id = ?', [id], callback)
    }

    static create(group, callback) {
        const { Name } = group
        db.run(
            'INSERT INTO Groups (Name) VALUES (?)',
            [Name],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, group, callback) {
        const { Name } = group
        const query = "UPDATE Groups SET Name = ? WHERE ID = ?"

        const params = [Name, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Groups WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Group