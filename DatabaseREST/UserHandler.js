/**
 * Eco Hybrid Platform - A tool to visualize LCIA Impacts and organize ILCD files
 * Copyright (C) 2024 Fraunhofer IGD
 * 
 * This program is free software: you can redistribute it and/or modify it under 
 * the terms of the GNU General  * Public License as published by the Free Software 
 * Foundation, either version 3 of the License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; 
 * without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR 
 * PURPOSE. See the GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License along with this program. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

let Utility = require("./Utility.js");
var debug = require('debug')('UserHandler')
class UserHandler {
    async createUser(db, req, login, role_ids, hash) {
        let query = `
            INSERT INTO Login 
            (
                login,
                password
            )
            VALUES
            (
                '${login}',
                '${hash}'
            ) RETURNING id;
        `
        console.log(query);
        let result = await db.query(query, req);
        let processId = result.rows[0]['id'];
        this.setUsersRoles(db, req, processId, role_ids);
        return processId;
    }

    async updateUser(db, req, id, login, role_ids, hash = null) {
        let query = `
            UPDATE Login 
            SET
                login='${login}'`
        if (hash != null) {
            query += `,password='${hash}' `
        }
        query += `WHERE id=${id}`
        await db.query(query, req);
        this.setUsersRoles(db, req, id, role_ids);
    }

    async setUsersRoles(db, req, id, role_ids) {
        let query = `
            BEGIN;
            DELETE FROM login_role_link WHERE login_id=${id};`
        if (role_ids.length > 0) {
            query += `
            INSERT INTO login_role_link
                (login_id, role_id)
            VALUES
            `;
            for (let role_id of role_ids) {
                query += `(${id},${role_id})`
                if (role_id != role_ids[role_ids.length - 1]) {
                    query += ',';
                }
            }
            query += ';'
        }
        query += 'END;'
        await db.query(query, req);
    }

    constructor(app, db, config) {
        let pI = require("./Permissions.js")[0]()

        app.post('/User', pI.singlePermissionChecker(
            "user_management_edit"))
        app.post('/User', async (req, res) => {
            try {
                console.log(req.body)
                let login = Utility.mysql_real_escape_string(req.body.login)
                let hash = config.hash(config.salt + req.body.password)
                let role_ids = [];
                if (typeof req.body.role_id == 'string') {
                    role_ids = req.body.role_id.split(',').map(d => parseInt(d));
                } else {
                    role_ids = req.body.role_id.map(d => parseInt(d.key));
                }

                console.log('start create')
                let processId = await this.createUser(db, req, login, role_ids, hash)
                res.send(null)
            }
            catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }

        });

        app.get('/User', pI.orPermissionsChecker([
            "user_management_me", "user_management_view", "user_management_edit"]))
        app.get('/User', async (req, res) => {
            try {
                let query = `
                SELECT 
                    first(Login.id) as id,first(Login.login) AS login,
                    ARRAY_TO_STRING(ARRAY_AGG(DISTINCT role.id), ',') AS role_ids,
                    ARRAY_TO_STRING(ARRAY_AGG(DISTINCT role.name), ',') AS role_names
                FROM Login
                LEFT JOIN login_role_link AS lrl ON lrl.login_id=Login.id
                LEFT JOIN role ON role.id = lrl.role_id `;
                if (!await pI.allowed(req.session.userid, "user_management_view") &&
                    !await pI.allowed(req.session.userid, "user_management_edit")) {
                    query += `
                    WHERE Login.id = ${req.session.userid} 
                    `;
                }
                query += `GROUP BY Login.id;
                `;
                let result = await db.query(query, req)
                res.send(result.rows)
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.put('/User/:id', pI.orPermissionsChecker(
            ["user_management_edit", "user_management_me"]))
        app.put('/User/:id', async (req, res) => {
            try {
                let role_ids = []
                if ('role_id' in req.body) {
                    if (typeof req.body.role_id == 'string') {
                        role_ids = req.body.role_id.split(',').map(d => parseInt(d));
                    } else {
                        role_ids = req.body.role_id.map(d => parseInt(d.key));
                    }
                }
                let id = parseInt(req.params.id);

                if (!await pI.allowed(req.session.userid, "user_management_edit")) {
                    console.log("user can cont edit")
                    if (id != req.session.userid) {
                        res.send(null)
                        return;
                    }
                    role_ids = await pI.getRoleIdsByUserid(req.session.userid)
                }
                console.log(req.body)

                let login = Utility.mysql_real_escape_string(req.body.login)
                let hash = config.hash(config.salt + req.body.password)

                if (req.body.password == "")
                    await this.updateUser(db, req, id, login, role_ids)
                else
                    await this.updateUser(db, req, id, login, role_ids, hash)

                if (id == req.session.userid)
                    req.session.login = login;
                res.send(null)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.delete('/User/:id', pI.singlePermissionChecker(
            "user_management_edit"))
        app.delete('/User/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let query = `DELETE FROM Login WHERE Login.id=${id} AND
                    Login.id != ${req.session.userid}`
                await db.query(query, req);
                res.send(null)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.post('/User/unique', pI.orPermissionsChecker(
            ["user_management_edit", "user_management_view", "user_management_me"]))
        app.post('/User/unique', async (req, res) => {
            try {
                let login = Utility.mysql_real_escape_string(req.body.name)
                let query = `SELECT login from Login WHERE login='${login}';`
                let result = await db.query(query, req);
                if (result.rows.length == 0)
                    res.send('{"unique":true}')
                else
                    res.send('{"unique":false}')
            }
            catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })
    }
}

module.exports = UserHandler;
