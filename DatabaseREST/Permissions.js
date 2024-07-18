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
var debug = require('debug')('Permissions')
var Utility = require("./Utility.js");

var instance = null

function initialisePermissions(db) {
    instance = new Permissions(db);
}

function getPermissionsInstance() {
    return instance;
}

class Permissions {
    constructor(db) {
        this.db = db;
    }

    /*
    Returns all permissions-ids of a user by user-id
    */
    async getRoleIdsByUserid(id) {
        id = parseInt(id)
        let query = `
            SELECT 
                first(role.id) role_id
            FROM login
            LEFT JOIN login_role_link as lrl ON lrl.login_id = login.id
            LEFT JOIN role as role ON role.id=lrl.role_id
            WHERE 
                login.id = ${id}
            group by
                role_id
        `;
        let result = (await this.db.query(query)).rows.map(d => d['role_id'])
        return Array.from(new Set(result));
    }

    /*
    Returns all permissions of a user by user-id
    */
    async getPermissionsById(id) {
        id = parseInt(id)
        let query = `
            SELECT permission.name as name
            FROM login
            LEFT JOIN login_role_link as lrl ON lrl.login_id = login.id
            LEFT JOIN role_permission_link as lpl ON lpl.role_id = lrl.role_id
            LEFT JOIN permission ON permission.id = lpl.permission_id
            WHERE 
                login.id = ${id};
        `;
        let result = (await this.db.query(query)).rows.map(d => d['name'])
        return Array.from(new Set(result));
    }

    /*
    Returns all permissions of a user by login-name
    */
    async getPermissionsByName(user) {
        user = Utility.mysql_real_escape_string(user)
        let query = `
            SELECT permission.name as name
            FROM login
            LEFT JOIN login_role_link as lrl ON lrl.login_id = login.id
            LEFT JOIN role_permission_link as lpl ON lpl.role_id = lrl.role_id
            LEFT JOIN permission ON permission.id = lpl.permission_id
            WHERE 
                login.login = '${user}';
        `;
        let result = (await this.db.query(query)).rows.map(d => d['name'])
        return Array.from(new Set(result));
    }

    /*
    Checks if a user has the permission
    */
    async allowed(userid, permission) {
        let user = parseInt(userid)
        permission = Utility.mysql_real_escape_string(permission)
        let query = `
            SELECT *
            FROM login
            LEFT JOIN login_role_link as lrl ON lrl.login_id = login.id
            LEFT JOIN role_permission_link as lpl ON lpl.role_id = lrl.role_id
            LEFT JOIN permission ON permission.id = lpl.permission_id
            WHERE 
                login.id = '${user}' 
            AND
                permission.name = '${permission}';
        `;
        let result = await this.db.query(query)
        return result.rows.length > 0;
    }

    /*
    Checks if a user can edit the entities of an owner
    */
    async checkGroupPermission(req, owner_name) {
        console.log("checked permissions")
        console.log(['edit_entities_of_' + owner_name, 'edit_all_entities']);
        let checker = this.orPermissionsChecker(['edit_entities_of_' + owner_name, 'edit_all_entities'])
        let allowed = await checker(req, null, null)
        return allowed;
    }


    async checkPermission(req, res, permission) {
        if (!req.session) {
            if (res) res.send(401)
            return false;
        }
        else if (!req.session.logedin) {
            if (res) res.send(401)
            return false;
        }
        else {
            let uid = req.session.userid
            let ret = await this.allowed(uid, permission)
            if (!ret)
                if (res) res.send(401)
            return ret
        }
    }

    /*
    Express.js middleware to check for a single permission
    */
    singlePermissionChecker(permission) {
        return async (req, res, next) => {
            try {
                if (await this.checkPermission(req, res, permission)) {
                    if (next) 
                    {
                        next();
                    }
                    else return true;
                } else {
                    console.log("failed to check permission")
                    console.log(permission)
                }
            } catch (e) {
                console.log(e);
                debug(e);
            }
            return false;
        }
    }

    /*
    Express.js middleware to check for multiple permissions
    */
    orPermissionsChecker(permissions) {
        return async (req, res, next) => {
            try {
                if (!req.session) {
                    if (res) res.send(401)
                    return false;
                }
                else if (!req.session.logedin) {
                    if (res) res.send(401)
                    return false;
                }
                else {
                    let uid = req.session.userid

                    let allowed = false;
                    for (let permission of permissions) {
                        allowed = allowed || await this.allowed(uid, permission)
                    }
                    if (allowed) {
                        if (next) next();
                        else return true;
                    } else {
                        if (res) res.send(401)
                        return false;
                    }
                }

            } catch (e) {
                console.log(e);
                debug(e);
                if (res) res.send(500);
                return false;
            }
            return true;
        }
    }

    /*
    * This checks if the user can edit a row of a sql-table, that has an owner.
    * owner_query is a function that takes the entity-id and
    *    returns the query for the owner names of the entity where the row name contains the ownernames
    * idfn is a function that takes the request and returns
    *    the entity-id  
    */
    editEntityPermissionChecker(owner_queryfn, idfn) {
        return async (req, res, next) => {
            try {
                let id = req.session.userid;
                let permissions = req.session.permissions;
                let entity_id = idfn(req);
                let query = owner_queryfn(entity_id);
                let owner_names = (await this.db.query(query)).rows;
                let required_permissions = ['edit_all_entities'];
                for (let i = 0; i < owner_names.length; i++) {
                    let owner_name = owner_names[i].name;
                    if (owner_name) {
                        required_permissions.push('edit_entities_of_' + owner_name);
                    }
                }
                return await instance.orPermissionsChecker(required_permissions)(req, res, next);
            } catch (e) {
                console.log(e);
                debug(e)
                if(res) res.send(500);
                else return false;
            }
        }
    }

    /*
    * This checks if the user can delete a row of a table.
    * owner_query is a function that takes the entity-id and
    *    returns the query for the owner names of the entity
    * idfn is a function that takes the request and returns
    *    the entity-id  
    */
    deleteEntityPermissionChecker(owner_queryfn, idfn) {
        return async (req, res, next) => {
            try {
                if (await instance.singlePermissionChecker('edit_all_entities')(req, null, null)) {
                    if(next) next();
                    return true;
                }

                let entity_id = idfn(req);
                let query = owner_queryfn(entity_id);
                let owner_names = (await this.db.query(query)).rows;
                let ownerset = new Set(owner_names.filter(name => name != null))
                console.log(owner_names)
                console.log(new Set(owner_names.filter(name => name != null)))

                let isSingleOwner = ownerset.size <= 1;
                if (!isSingleOwner) {
                    if(res) res.send(500)
                    return false;
                }

                let owner = Array.from(ownerset)[0].name;
                console.log("owner:")
                console.log(owner)
                if (await instance.singlePermissionChecker('edit_entities_of_' + owner)(req, null, null)) {
                    if(next) next();
                    return true;
                }
                console.log("failed to check permission")
                if(res) res.send(500);
                return false;
            } catch (e) {
                console.log(e);
                debug(e)
                if(res) res.send(500);
                return false
            }
        }
    }

    /**
     * filters an array of objects so that only
     * entities that the current user can edit are contained by it.
     * ownerfn takes an object of the array and returns the ownername as string.
     */
    async filterEntityByEditableOwner(uid, entities, ownerfn, idfn = e => e.id) {
        if (await this.allowed(uid, 'edit_all_entities')) {
            return entities
        }
        let rtn = [];
        let ids_contained = new Set();
        for (let i = 0; i < entities.length; i++) {
            let id = idfn(entities[i])
            let owner = ownerfn(entities[i])

            if (!Array.isArray(owner))
                owner = [owner]
            for (let o of owner) {
                if (ids_contained.has(id))
                    break;

                if (o != null && await this.allowed(uid, 'edit_entities_of_' + o)) {
                    rtn.push(entities[i])
                    ids_contained.add(id)
                }
            }
        }
        return rtn;
    }

    /**
     * Applies function fn to each entitie the user can edit. This is userful
     * to set additional attributes like editable:true with the json returned
     * by the api.
     * ownerfn takes an object of the array and returns the ownername as string.
     */
    async foreachEditableEntity(uid, entities, ownerfn, idfn = e => e.id, fn) {
        console.log("foreach")
        if (await this.allowed(uid, 'edit_all_entities')) {
            console.log("allowed")
            entities.forEach(fn)
            return
        }
        let rtn = [];
        let ids_contained = new Set();
        for (let i = 0; i < entities.length; i++) {
            let id = idfn(entities[i])
            if (id == 41) {
                console.log("CHECKING....")
                console.log(entities[i])
            }
            let owner = ownerfn(entities[i])
            if (id == 41) {
                console.log("OWNER")
                console.log(owner)
            }

            if (!Array.isArray(owner))
                owner = [owner]
            for (let o of owner) {
                if (ids_contained.has(id))
                    break;

                if (o != null && await this.allowed(uid, 'edit_entities_of_' + o)) {
                    fn(entities[i])
                    ids_contained.add(id)
                }
            }
        }
        return rtn;
    }

    /**
     * filters an array of confidential objects such that only
     * entities that are visible for the current user are contained by it.
     * ownerfn takes an object of the array and returns the ownername as string.
     */
    async filterVisibleConfidentialEntities(uid, entities, ownerfn, idfn = e => e.id) {
        if (await this.allowed(uid, 'edit_all_entities')) {
            return entities
        }
        let rtn = [];
        let ids_contained = new Set();
        for (let i = 0; i < entities.length; i++) {
            let id = idfn(entities[i])
            let owner = ownerfn(entities[i])
            if (!Array.isArray(owner))
                owner = [owner]
            console.log(owner);
            for (let o of owner) {
                if (ids_contained.has(id))
                    break;
                if (o != null && (
                    ((entities[i].confidentiality == 'COA, confidential' || entities[i].confidentiality == 'Private (no COA)')
                        && await this.allowed(uid, 'edit_entities_of_' + o)) ||
                    (entities[i].confidentiality == 'COA, non-confidential' && await this.allowed(uid, 'is_coa_member')) /*||
                    (entities[i].confidentiality == 'Shared' && await this.allowed(uid, 'rest_visualization_get'))*/)) {
                    rtn.push(entities[i])
                    ids_contained.add(id)
                }
            }
        }
        return rtn;
    }
}

class PermissionsHandler {
    constructor(app, db) {
        this.db = db
        initialisePermissions(db);
        let pI = getPermissionsInstance();

        app.get('/Permissions', pI.singlePermissionChecker('user_management_me'));
        app.get('/Permissions', async (req, res) => {
            try {
                let id = req.session.userid;
                res.send(await instance.getPermissionsById(parseInt(id)));
            } catch (e) {
                debug(e)
                console.log(e);
                console.log(req.session);
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Permissions/:id(\\d+)/', pI.singlePermissionChecker('user_management_edit'));
        app.get('/Permissions/:id(\\d+)/', async (req, res) => {
            try {
                res.send(await instance.getPermissionsById(parseInt(req.params.id)));
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Permissions/all', async (req, res) => {
            try {
                let query = 'SELECT * FROM permission order by name';
                let result = await this.db.query(query);
                res.send(result.rows);
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = [getPermissionsInstance, PermissionsHandler, initialisePermissions];
