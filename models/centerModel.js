const db = require('../config/db');

class Center {
    static getAll(callback) {
        db.all('SELECT * FROM Centers', [], callback)
    }

    static getById(id, callback) {
        db.get('SELECT * FROM Centers WHERE id = ?', [id], callback)
    }

    static create(center, callback) {
        const { Name, Address } = center
        db.run(
            'INSERT INTO Centers (Name, Address) VALUES (?, ?)',
            [Name, Address],
            function (err) {
                callback(err, { id: this.lastID });
            }
        );
    }

    static update(id, center, callback) {
        const { Name, Address } = center
        const query = "UPDATE Centers SET Name = ?, Address = ? WHERE ID = ?"

        const params = [Name, Address, id]
        db.run(query, params, function (err) {
            callback(err, { updated: this.changes })
        })
    }

    static delete(id, callback) {
        db.run('DELETE FROM Centers WHERE ID = ?', [id], function (err) {
            callback(err, { deleted: this.changes })
        })
    }
}

module.exports = Center