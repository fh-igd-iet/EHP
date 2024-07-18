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
var debug = require('debug')('CohortHandler')
var ActivityHandler = require("./ActivityHandler.js");

class ComponentHandler {
    async updateActivityLinks(db, req, Component_id, links, cohort_id) {
        let editableActivities = await ActivityHandler.getOwnedActivitieIds(db, req);
        let query1 = `DELETE FROM Activitie_Component_Link WHERE 
                        component_id=${Component_id} 
                        AND Cohort_Inventory_id=${cohort_id}
                        AND activitie_id IN (${editableActivities.join(',')})`
        let query2 = `INSERT INTO Activitie_Component_Link
                        (Activitie_id, Component_id, Cohort_Inventory_id)
                    VALUES `;
        let i = 0;
        for (let link of links) {
            let activity = link
            query2 += `(${activity}, ${Component_id}, ${cohort_id})`
            if (i != links.length - 1)
                query2 += ","
            i++;
        }
        query2 += ';'
        await db.query(query1, req)
        if (links.length > 0)
            await db.query(query2, req)
    }

    async updateLinks(db, req, Component_id, body) {
        let mapfn = d => {
            if (typeof d == 'number')
                return d
            return parseInt(d['key'])
        }
        let editableActivities = new Set(await ActivityHandler.getOwnedActivitieIds(db, req));
        let linkOwnedfn = d => {
            return editableActivities.has(d)
        }
        if ('activity_id_a' in body &&
            typeof body.activity_id_a != 'string') {
            console.log(body.activity_id_a)
            let links = body.activity_id_a.map(mapfn).filter(linkOwnedfn);
            console.log(links)
            await this.updateActivityLinks(db, req, Component_id, links, 1)
        }
        if ('activity_id_b' in body && typeof body.activity_id_b != 'string') {
            let links = body.activity_id_b.map(mapfn).filter(linkOwnedfn);
            await this.updateActivityLinks(db, req, Component_id, links, 2)
        }
        if ('activity_id_c' in body && typeof body.activity_id_c != 'string') {
            let links = body.activity_id_c.map(mapfn).filter(linkOwnedfn);
            await this.updateActivityLinks(db, req, Component_id, links, 3)
        }
        if ('activity_id_d' in body && typeof body.activity_id_d != 'string') {
            let links = body.activity_id_d.map(mapfn).filter(linkOwnedfn);
            await this.updateActivityLinks(db, req, Component_id, links, 4)
        }
        if ('activity_id_e' in body && typeof body.activity_id_e != 'string') {
            let links = body.activity_id_e.map(mapfn).filter(linkOwnedfn);
            await this.updateActivityLinks(db, req, Component_id, links, 5)
        }
        console.log('updated');
    }

    async createComponent(db, req, demo_nr, name, spd_id, is_demo, image_id) {
        let query = `
            INSERT INTO Component
            (
                demo_nr, code, name, spd_id, is_demo, image_id
            )
            VALUES
            (
                '${demo_nr}',
                'D-${spd_id + '-' + demo_nr}',
                '${name}',
                '${spd_id}',
                ${is_demo},
                ${image_id || 'null'}
            ) RETURNING id;
        `
        console.log(query);
        let result = await db.query(query, req);
        return result.rows[0]['id'];
    }

    async updateComponent(db, req, id, demo_nr, name, spd_id, is_demo, image_id) {

        // Delete old images
        // TODO this needs to be deleted if other tables
        // start using the image-table
        let query = `DELETE FROM Image WHERE 
            id = (SELECT image_id FROM Component WHERE id=${id})`;
        if (image_id != null) {
            query += ` AND id != ${image_id}`
        }
        query += ';';
        await db.query(query, req);
        query = `
            UPDATE Component
            SET
                demo_nr='${demo_nr}',
                code='D-${spd_id + '-' + demo_nr}',
                name='${name}',
                spd_id='${spd_id}',
                is_demo=${is_demo},
                image_id=${image_id || 'null'}
            WHERE
                id=${id}
        `
        await db.query(query, req);
    }

    async deleteComponent(db, req, id) {
        /* TODO this needs to be deleted if other tables use
            the image table.*/
        let query = `DELETE FROM Image WHERE id = 
                        (SELECT image_id from Component WHERE id=${id});`;
        await db.query(query, req);
        query = `
            DELETE FROM Component WHERE id=${id}
        `
        await db.query(query, req);
    }

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        app.get('/Component', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component', async (req, res) => {
            try {
                const query = `
                SELECT
                    first(c.id) as id,
                    first(c.demo_nr) as demo_nr,
                    first(c.code) as code,
                    first(c.name) as name,
                    first(c.spd_id) as spd_id,
                    first(s.name) as spd_name,
                    first(s.type) as spd_type,
                    first(c.is_demo) as is_demo,
                    first(c.image_id) as image_id,
                    json_agg(o.owner_id) as owner_id,
                    json_agg(o.name) as owner_name,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.id) as activity_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.title) as activity_name_a,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.id) as activity_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.title) as activity_name_b,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.id) as activity_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.title) as activity_name_c,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.id) as activity_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.title) as activity_name_d,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.id) as activity_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.title) as activity_name_e
                FROM component as c
                LEFT JOIN 
                    spd as s on c.spd_id=s.id
                LEFT JOIN
                    activitie_component_link as acl ON acl.component_id=c.id
                LEFT JOIN
                    activitie as a ON a.id=acl.activitie_id
                LEFT JOIN
                    owner as o ON a.owner_id=o.owner_id
                GROUP BY
                    c.id
                ORDER BY code
                `;
                const result = await db.query(query, req)
                let rows = await pI.filterEntityByEditableOwner(req.session.userid, result.rows, r => r.owner_name);
                res.send(rows)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Component/fsd', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component/fsd', async (req, res) => {
            try {
                const query = `
                SELECT 
                    first(TAB2.id) as id,
                    first(TAB2.demo_nr) as demo_nr,
                    first(TAB2.code) as code,
                    first(TAB2.name) as name,
                    first(TAB2.spd_id) as spd_id,
                    first(TAB2.spd_name) as spd_name,
                    first(TAB2.spd_type) as spd_type,
                    first(TAB2.is_demo) as is_demo,
                    first(TAB2.image_id) as image_id,
                    json_agg(TAB2.activity_id) as activity_ids,
                    json_agg(TAB2.activity_name) as activity_names,
                    json_agg(TAB2.activity_id_extern) as activity_id_externs,
                    json_agg(TAB2.technology_ids) as technology_ids,
                    json_agg(TAB2.technology_names) as technology_names,
                    json_agg(TAB2.technology_process_ids) as technology_process_ids,
                    json_agg(TAB2.component_codes) as component_codes,
                    json_agg(TAB2.component_names) as component_names
                FROM
                    (SELECT
                        first(TAB1.id) as id,
                        first(TAB1.demo_nr) as demo_nr,
                        first(TAB1.code) as code,
                        first(TAB1.name) as name,
                        first(TAB1.spd_id) as spd_id,
                        first(TAB1.spd_name) as spd_name,
                        first(TAB1.spd_type) as spd_type,
                        first(TAB1.is_demo) as is_demo,
                        first(TAB1.image_id) as image_id,
                        first(TAB1.activity_id) as activity_id,
                        first(TAB1.activity_name) as activity_name,
                        first(TAB1.activity_id_extern) as activity_id_extern,
                        first(TAB1.technology_ids) as technology_ids,
                        first(TAB1.technology_names) as technology_names,
                        first(TAB1.technology_process_ids) as technology_process_ids,
                        json_agg(c.code) as component_codes,
                        json_agg(c.name) as component_names
                        FROM
                            (SELECT
                                first(c.id) as id,
                                first(c.demo_nr) as demo_nr,
                                first(c.code) as code,
                                first(c.name) as name,
                                first(c.spd_id) as spd_id,
                                first(s.name) as spd_name,
                                first(s.type) as spd_type,
                                first(c.is_demo) as is_demo,
                                first(c.image_id) as image_id,
                                first(a.id) as activity_id,
                                first(a.title) as activity_name,
                                first(a.extern_id) as activity_id_extern,
                                json_agg(p.extern_id) as technology_ids,
                                json_agg(p.name) as technology_names,
                                json_agg(p.id) as technology_process_ids
                            FROM component as c
                            LEFT JOIN 
                                spd as s on c.spd_id=s.id
                            LEFT JOIN
                                activitie_component_link as acl ON acl.component_id=c.id
                            LEFT JOIN
                                activitie as a ON a.id=acl.activitie_id
                            LEFT JOIN
                                process as p ON p.activitie_id = a.id
                            WHERE c.is_demo is TRUE
                            GROUP BY
                                c.id,a.id
                            ORDER BY c.id) 
                        as TAB1
                        LEFT JOIN
                            activitie_component_link as acl ON acl.activitie_id = TAB1.activity_id
                        LEFT JOIN
                            component as c ON c.id = acl.component_id
                        GROUP BY
                            TAB1.id,activity_id)
                    as TAB2
                GROUP BY
                    TAB2.id
                `;
                const result = await db.query(query, req)
                res.send(result.rows)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Component/all', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component/all', async (req, res) => {
            try {
                const query = `
                SELECT
                    first(c.id) as id,
                    first(c.demo_nr) as demo_nr,
                    first(c.code) as code,
                    first(c.name) as name,
                    first(c.spd_id) as spd_id,
                    first(s.name) as spd_name,
                    first(s.type) as spd_type,
                    first(c.is_demo) as is_demo,
                    first(c.image_id) as image_id,
                    json_agg(o.owner_id) as owner_id,
                    json_agg(o.name) as owner_name,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.id) as activity_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.title) as activity_name_a,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.id) as activity_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.title) as activity_name_b,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.id) as activity_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.title) as activity_name_c,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.id) as activity_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.title) as activity_name_d,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.id) as activity_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.title) as activity_name_e
                FROM component as c
                LEFT JOIN 
                    spd as s on c.spd_id=s.id
                LEFT JOIN
                    activitie_component_link as acl ON acl.component_id=c.id
                LEFT JOIN
                    activitie as a ON a.id=acl.activitie_id
                LEFT JOIN
                    owner as o ON a.owner_id=o.owner_id
                GROUP BY
                    c.id
                ORDER BY code
                `;
                const result = await db.query(query, req)
                await pI.foreachEditableEntity(
                    req.session.userid,
                    result.rows,
                    e => e.owner_name,
                    e => e.id,
                    (e) => {
                        e['editable'] = true
                    })
                res.send(result.rows)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Component/:id', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                const query = `
                SELECT
                    first(c.id) as id,
                    first(c.demo_nr) as demo_nr,
                    first(c.code) as code,
                    first(c.name) as name,
                    first(c.spd_id) as spd_id,
                    first(s.name) as spd_name,
                    first(s.type) as spd_type,
                    first(c.is_demo) as is_demo,
                    first(c.image_id) as image_id,
                    json_agg(o.owner_id) as owner_id,
                    json_agg(o.name) as owner_name,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.id) as activity_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.title) as activity_name_a,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.id) as activity_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.title) as activity_name_b,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.id) as activity_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.title) as activity_name_c,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.id) as activity_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.title) as activity_name_d,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.id) as activity_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.title) as activity_name_e
                FROM component as c
                LEFT JOIN 
                    spd as s on c.spd_id=s.id
                LEFT JOIN
                    activitie_component_link as acl ON acl.component_id=c.id
                LEFT JOIN
                    activitie as a ON a.id=acl.activitie_id
                LEFT JOIN
                    owner as o ON a.owner_id=o.owner_id
                WHERE c.id=${id}
                GROUP BY
                    c.id
                ORDER BY code
                `;
                const result = await db.query(query, req)
                let rows = await pI.filterEntityByEditableOwner(req.session.userid, result.rows, r => r.owner_name);
                if (rows.length == 1)
                    res.send(rows[0])
                else
                    res.send({})
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Component/code/:code/processes', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component/code/:code/processes', async (req, res) => {
            try {
                let code = Utility.mysql_real_escape_string(req.params.code)
                const query = `
                SELECT
                    first(p.id) as id,
                    first(p.name) as name,
                    first(p.extern_id) as extern_id,
                    first(olcaprocess) as olcaprocess
                FROM process as p
                LEFT JOIN
                    activitie a ON p.activitie_id=a.id
                LEFT JOIN
                    activitie_component_link as acl ON acl.activitie_id=a.id
                LEFT JOIN
                    component as c ON acl.component_id=c.id
                WHERE c.code='${code}'
                GROUP BY
                    p.id
                ORDER BY extern_id
                `;
                console.log(query)
                const rows = (await db.query(query, req)).rows
                res.send(rows)
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Component/code/:code', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Component/code/:code', async (req, res) => {
            try {
                let code = Utility.mysql_real_escape_string(req.params.code)
                console.log("code:")
                console.log(code)
                const query = `
                SELECT
                    first(c.id) as id,
                    first(c.demo_nr) as demo_nr,
                    first(c.code) as code,
                    first(c.name) as name,
                    first(c.spd_id) as spd_id,
                    first(s.name) as spd_name,
                    first(s.type) as spd_type,
                    first(c.is_demo) as is_demo,
                    first(c.image_id) as image_id,
                    json_agg(o.owner_id) as owner_id,
                    json_agg(o.name) as owner_name,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.id) as activity_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_a,
                    public.demo_cohort_select_a(acl.cohort_inventory_id, a.title) as activity_name_a,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.id) as activity_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_b,
                    public.demo_cohort_select_b(acl.cohort_inventory_id, a.title) as activity_name_b,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.id) as activity_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_c,
                    public.demo_cohort_select_c(acl.cohort_inventory_id, a.title) as activity_name_c,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.id) as activity_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_d,
                    public.demo_cohort_select_d(acl.cohort_inventory_id, a.title) as activity_name_d,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.id) as activity_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.extern_id) as activity_extern_id_e,
                    public.demo_cohort_select_e(acl.cohort_inventory_id, a.title) as activity_name_e
                FROM component as c
                LEFT JOIN 
                    spd as s on c.spd_id=s.id
                LEFT JOIN
                    activitie_component_link as acl ON acl.component_id=c.id
                LEFT JOIN
                    activitie as a ON a.id=acl.activitie_id
                LEFT JOIN
                    owner as o ON a.owner_id=o.owner_id
                WHERE c.code='${code}'
                GROUP BY
                    c.id
                ORDER BY code
                `;
                const rows = (await db.query(query, req)).rows
                //let rows = await pI.filterEntityByEditableOwner(req.session.userid, result.rows, r => r.owner_name);
                if (rows.length == 1)
                    res.send(rows[0])
                else
                    res.send({})
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.post('/Component', pI.singlePermissionChecker(
            "rest_visualization_post"));
        app.post('/Component', async (req, res) => {
            try {
                let esc = Utility.mysql_real_escape_string
                let demo_nr = esc(req.body.demo_nr)
                let name = esc(req.body.name)
                let spd_id = esc(req.body.spd_id)
                let is_demo = (req.body.is_demo == 1) ? 'TRUE' : 'FALSE'
                let image_id = null;
                if (typeof req.body.image_id == 'number' ||
                    typeof req.body.image_id == 'string')
                    image_id = parseInt(req.body.image_id);

                let id = await this.createComponent(db, req, demo_nr, name, spd_id, is_demo, image_id);
                await this.updateLinks(db, req, id, req.body)
                res.send(null)
            }
            catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.put('/Component/:id', pI.editEntityPermissionChecker(
            id => `SELECT o.name as name FROM component as c
                    LEFT JOIN activitie_component_link as acl
                    ON c.id=acl.component_id
                    LEFT JOIN activitie as a
                    ON a.id=acl.activitie_id
                    LEFT JOIN owner as o
                    ON o.owner_id=a.owner_id
                    WHERE c.id=${id} AND a.owner_id IS NOT NULL`,
            req => parseInt(req.params.id)
        ))
        app.put('/Component/:id', pI.singlePermissionChecker(
            "rest_visualization_put"))
        app.put('/Component/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let esc = Utility.mysql_real_escape_string

                let demo_nr = esc(req.body.demo_nr)
                let name = esc(req.body.name)
                let spd_id = esc(req.body.spd_id)
                let is_demo = (req.body.is_demo == 1) ? 'TRUE' : 'FALSE'
                let image_id = null;
                if (typeof req.body.image_id == 'number' ||
                    typeof req.body.image_id == 'string')
                    image_id = parseInt(req.body.image_id);

                await this.updateComponent(db, req, id, demo_nr, name, spd_id, is_demo, image_id);
                await this.updateLinks(db, req, id, req.body)

                //await db.query(infosrcRefUpdate);
                //await db.query(query);
                res.send(null);
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.delete('/Component/:id', pI.deleteEntityPermissionChecker(
            id => `SELECT o.name as name FROM component as c
                    LEFT JOIN activitie_component_link as acl
                    ON c.id=acl.component_id
                    LEFT JOIN activitie as a
                    ON a.id=acl.activitie_id
                    LEFT JOIN owner as o
                    ON o.owner_id=a.owner_id
                    WHERE c.id=${id} AND a.owner_id IS NOT NULL`,
            req => parseInt(req.params.id)
        ))
        app.delete('/Component/:id', pI.singlePermissionChecker(
            "rest_visualization_delete"))
        app.delete('/Component/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                await this.deleteComponent(db, req, id);
                res.send(null);
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = ComponentHandler;
