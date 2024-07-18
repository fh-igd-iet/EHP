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
var debug = require('debug')('OwnerHandler')
var Utility = require("./Utility.js");
pI = null;

class OwnerHandler {
    async updateOwner(db, req, id, name) {
        let permission_name = `edit_entities_of_${name}`
        let query = `
            UPDATE permission
            SET
                name='${permission_name}'
            WHERE id=${id}`
        await db.query(query, req);
    }

    static async isOwnerIDAllowed(db, req, owner_id) {
        console.log("OWNER ID ALLOWED?")
        let query = `SELECT name FROM Owner WHERE Owner.owner_id=${owner_id}`;
        let owner_name = (await db.query(query, req)).rows[0].name;
        return await pI.checkGroupPermission(req, owner_name)
    }

    static async getOwnerID(db, req, owner) {
        let query = `SELECT owner_id FROM Owner WHERE Owner.name='${owner}'`;
        let result = await db.query(query, req)
        if (result.rows.length <= 0 || !('owner_id' in result.rows[0])) {
            return null
        }
        return result.rows[0].owner_id
    }

    static async createOwner(db, req, owner) {
        let esc = Utility.mysql_real_escape_string
        let query     = `INSERT INTO Owner (name)      VALUES ('${esc(owner)}') RETURNING owner_id;`
        let queryPerm = `INSERT INTO permission (name) VALUES ('edit_entities_of_${esc(owner)}') ON CONFLICT DO NOTHING`
        let result = await db.query(query, req)
        let ownerID = result.rows[0]['owner_id'];
        await db.query(queryPerm, req)
        return ownerID
    }

    constructor(app, db) {
        if (pI == null)
            pI = require("./Permissions.js")[0]()

        app.get('/Owner', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/Owner', async (req, res) => {
            try {
                let query = `
                    SELECT * FROM Owner order by name;
                `;
                let result = await db.query(query, req);
                res.send(result.rows)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.post('/Owners/unique', pI.singlePermissionChecker(
            "user_management_edit"))
        app.post('/Owners/unique', async (req, res) => {
            try {
                let name = Utility.mysql_real_escape_string(req.body.name)
                let query_permission = `SELECT name FROM permission WHERE name='edit_entities_of_${name}';`
                let query_owner      = `SELECT name FROM owner      WHERE name='${name}';`
                let result_permission = await db.query(query_permission, req);
                let result_owner      = await db.query(query_owner, req);
                console.log(query_permission)
                console.log(result_permission)
                if (result_permission.rows.length == 0 &&
                    result_owner.rows.length      == 0)
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
        
        app.post('/Owners', pI.singlePermissionChecker(
            "user_management_edit"))
        app.post('/Owners', async (req, res) => {
            try {
                let name = Utility.mysql_real_escape_string(req.body.name)
                console.log('start create owner')
                let o_id = await OwnerHandler.createOwner(db, req, name)
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

        app.put('/Owners/:id', pI.singlePermissionChecker(
            "user_management_edit"))
        app.put('/Owners/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let name = Utility.mysql_real_escape_string(req.body.name)
                await this.updateOwner(db, req, id, name)
                res.send(null)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.delete('/Owners/:id', pI.singlePermissionChecker(
            "user_management_edit"))
        app.delete('/Owners/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let query = `DELETE FROM permission WHERE id=${id}`
                console.log(query);
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

        app.get('/Owners/permission', pI.singlePermissionChecker(
            "user_management_view"))
        app.get('/Owners/permission', async (req, res) => {
            try {
                let query = `
                    SELECT 
                        p.id,
                        split_part(p.name, 'edit_entities_of_', 2) as "name",
                        p.name as "permission_name"
                    FROM permission as p
                    WHERE p.name like 'edit_entities_of_%'
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

        app.get('/EditableOwners', pI.singlePermissionChecker(
            "login"))
        app.get('/EditableOwners', async (req, res) => {
            try {
                let query = `
                    SELECT * FROM Owner;
                `;
                let result = await db.query(query, req);
                result = await pI.filterEntityByEditableOwner(req.session.userid, result.rows, e => e.name, e => e.owner_id)
                res.send(result)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = OwnerHandler;