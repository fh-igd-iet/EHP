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
var debug = require('debug')('RoleHandler')

class RoleHandler {
    async createRole(db, req, name, permission_ids) {
        let query = `
            INSERT INTO Role 
            (
                name
            )
            VALUES
            (
                '${name}'
            ) RETURNING id;
        `
        console.log(query);
        let result = await db.query(query, req);
        let processId = result.rows[0]['id'];
        this.setRolePermissions(db, req, processId, permission_ids);
        return processId;
    }

    async updateRole(db, req, id, name, permission_ids) {
        let query = `
            UPDATE Role
            SET
                name='${name}'
            WHERE id=${id}`
        await db.query(query, req);
        this.setRolePermissions(db, req, id, permission_ids);
    }

    async setRolePermissions(db, req, id, permission_ids) {
        let query = `
            BEGIN;
            DELETE FROM role_permission_link WHERE role_id=${id};`
        if (permission_ids.length > 0) {
            query += `
            INSERT INTO role_permission_link
                (role_id, permission_id)
            VALUES
            `;
            for (let perm_id of permission_ids) {
                query += `(${id},${perm_id})`
                if (perm_id != permission_ids[permission_ids.length - 1]) {
                    query += ',';
                }
            }
            query += ';'
        }
        query += 'END;'
        await db.query(query, req);
    }

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        app.get('/Roles', pI.orPermissionsChecker(["user_management_me", "user_management_view"]))
        app.get('/Roles', async (req, res) => {
            try {
                let query = `
                    SELECT * FROM role order by name;
                `;
                let result = await db.query(query, req)
                res.send(result.rows)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.delete('/Roles/:id', pI.singlePermissionChecker(
            "user_management_edit"))
        app.delete('/Roles/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let query = `DELETE FROM Role WHERE Role.id=${id}`
                await db.query(query, req);
                res.send(null)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.post('/Roles', pI.singlePermissionChecker(
            "user_management_edit"))
        app.post('/Roles', async (req, res) => {
            try {
                let name = Utility.mysql_real_escape_string(req.body.name)
                let permission_ids = [];
                if (typeof req.body.permission_ids == 'string') {
                    permission_ids = req.body.permission_ids.split(',').map(d => parseInt(d));
                } else {
                    permission_ids = req.body.permission_ids.map(d => parseInt(d.key));
                }

                console.log('start create')
                let processId = await this.createRole(db, req, name, permission_ids)
                res.send(null)
            }
            catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.put('/Roles/:id', pI.singlePermissionChecker(
            "user_management_edit"))
        app.put('/Roles/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let name = Utility.mysql_real_escape_string(req.body.name)
                let permission_ids = [];
                if (typeof req.body.permission_ids == 'string') {
                    permission_ids = req.body.permission_ids.split(',').map(d => parseInt(d));
                } else {
                    permission_ids = req.body.permission_ids.map(d => parseInt(d.key));
                }

                let processId = await this.updateRole(db, req, id, name, permission_ids)
                res.send(null)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.post('/Roles/unique', pI.singlePermissionChecker(
            "user_management_edit"))
        app.post('/Roles/unique', async (req, res) => {
            try {
                let name = Utility.mysql_real_escape_string(req.body.name)
                let query = `SELECT name from role WHERE name='${name}';`
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

        app.get('/Roles/permission', pI.singlePermissionChecker(
            "user_management_view"))
        app.get('/Roles/permission', async (req, res) => {
            try {
                let query = `
                    SELECT 
                        first(role.id) as id,
                        first(role.name) as name,
                        ARRAY_TO_STRING(ARRAY_AGG(DISTINCT p.id), ',') AS permission_ids,
                        ARRAY_TO_STRING(ARRAY_AGG(DISTINCT p.name), ',') AS permission_names
                    FROM role
                    LEFT JOIN role_permission_link as rpl 
                        ON rpl.role_id = role.id
                    LEFT JOIN permission as p
                        ON rpl.permission_id = p.id
                    GROUP BY role.id
                `;
                let result = await db.query(query, req)
                res.send(result.rows)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = RoleHandler;