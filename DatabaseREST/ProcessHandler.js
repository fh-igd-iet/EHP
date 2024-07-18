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
var debug = require('debug')('ProcessHandler')
var ActivityHandler = require("./ActivityHandler.js");
const { parse } = require('uuid');

class ProcessHandler {

    async canHaveParent(db, req, id) {
        const query = `
            SELECT * FROM Process 
            WHERE parent_id = ${id} 
            ORDER BY extern_id
        `
        const result = await db.query(query, req)
        return result.rows.length == 0
    }

    async validParent(db, req, parent_id) {
        const query = `
            SELECT * FROM Process 
            WHERE parent_id IS NULL
            AND id = ${parent_id} 
            ORDER BY extern_id
        `;
        const result = await db.query(query, req)
        if (result.rows.length == 1) {
            return true;
        }
        return false;
    }

    async createProcess(db, req, name, extern_id,
        spd_id, activity_id, parent_id, olcaprocess_id) {

        // removing previous assigment of olcaprocess
        let query = `
            UPDATE Process 
            SET 
                olcaprocess=NULL
            WHERE 
                olcaprocess=${olcaprocess_id};`  
        let result = await db.query(query, req);

        if (isNaN(parent_id))
            parent_id = null
        if (isNaN(activity_id))
            activity_id = null
        query = `
            INSERT INTO Process
            (
                extern_id, name, spd_id, activitie_id, parent_id, olcaprocess
            )
            VALUES
            (
                '${extern_id}', '${name}',
                '${spd_id}',${activity_id}, ${parent_id}, ${olcaprocess_id}
            ) RETURNING id;
        `
        console.log(query);
        result = await db.query(query, req);
        let processId = result.rows[0]['id'];

        return processId;
    }

    async updateProcess(db, req, id, extern_id, name,
         spd_id, activity_id, parent_id, olcaprocess_id) {

        // removing previous assigment of olcaprocess
        let query = `
            UPDATE Process 
            SET 
               olcaprocess=NULL
            WHERE 
               olcaprocess=${olcaprocess_id};`  
        let result = await db.query(query, req);

        if (isNaN(parent_id))
            parent_id = null
        if (isNaN(activity_id))
            activity_id = null

        query = `
            UPDATE Process
            SET
                extern_id='${extern_id}',
                name='${name}',
                spd_id='${spd_id}',
                activitie_id=${activity_id},
                parent_id=${parent_id}, 
                olcaprocess=${olcaprocess_id}
            WHERE
                id =${id};`
        result = await db.query(query, req);
        return;
    }

    async deleteProcess(db, req, id) {
        let query = `DELETE FROM Process WHERE id=${id}`
        await db.query(query, req);
    }

    makeResultsRelative(results) {
        let indicator_max_vals = {}
        for (let r of results) {
            for (let i in r.indicator_name_result) {
                if (!(i in indicator_max_vals)) {
                    indicator_max_vals[i] = Math.abs(r.indicator_name_result[i])
                } else {
                    if (indicator_max_vals[i] < Math.abs(r.indicator_name_result[i])) {
                        indicator_max_vals[i] = Math.abs(r.indicator_name_result[i])
                    }
                }
            }
        }
        for (let i in results) {
            for (let j in results[i].indicator_name_result) {
                results[i].indicator_name_result[j] = results[i].indicator_name_result[j] / indicator_max_vals[j]
            }
        }
    }

    static async getLCIAMethods(db, req) {
        const query = `
                SELECT 
                    first(m.id) as id,
                    first(m.name) as name,
                    first(m.olca_name) as olca_name,
                    json_agg(i.id) as indicator_ids,
                    json_agg(i.name) as indicator_names,
                    json_agg(i.olca_name) as indicator_olca_names
                FROM LCIA_Method AS m
                LEFT JOIN LCIA_Indicator AS i ON i.method=m.id
                GROUP BY m.id
                `;
        console.log("before query")
        let result = await db.query(query, req)
        console.log("after query")
        return result.rows
    }

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        app.get('/Process', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Process', async (req, res) => {
            try {
                const query = `
                    SELECT 
                        p.*, 
                        o.name as owner_name1,
                        o2.name as owner_name2,
                        olcap.name as olca_name,
                        olcap.id as olca_id,
                        olcap.reference as reference,
                        olcap.reference_unit as reference_unit
                    FROM Process as p
                    LEFT JOIN Activitie as a ON p.activitie_id=a.id
                    LEFT JOIN Process as p2 ON p.parent_id=p2.id
                    LEFT JOIN Activitie as a2 ON p2.activitie_id=a2.id
                    LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                    LEFT JOIN Owner as o2 ON o2.owner_id=a2.owner_id
                    LEFT JOIN OLCAProcess as olcap on olcap.id=p.olcaprocess
                    WHERE p.parent_id IS NULL 
                    ORDER BY extern_id
                `;
                let result = await db.query(query, req)
                result = await pI.filterEntityByEditableOwner(
                    req.session.userid,
                    result.rows,
                    e => [e.owner_name1, e.owner_name2])
                res.send(result)
            } catch (e) {
                debug(e)
                console.log(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Process/:id(\\d+)', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Process/:id(\\d+)', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                const query = `
                    SELECT 
                        p.*, 
                        o.name as owner_name1,
                        o2.name as owner_name2,
                        olcap.name as olca_name,
                        olcap.id as olca_id,
                        olcap.reference as reference,
                        olcap.reference_unit as reference_unit
                    FROM Process as p
                    LEFT JOIN Activitie as a ON p.activitie_id=a.id
                    LEFT JOIN Process as p2 ON p.parent_id=p2.id
                    LEFT JOIN Activitie as a2 ON p2.activitie_id=a2.id
                    LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                    LEFT JOIN Owner as o2 ON o2.owner_id=a2.owner_id
                    LEFT JOIN OLCAProcess as olcap on olcap.id=p.olcaprocess
                    WHERE p.id=${id} 
                    ORDER BY extern_id
                `;
                let result = await db.query(query, req)
                res.send(result.rows[0])
            } catch (e) {
                debug(e)
                console.log(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Process/parentfor/:id', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Process/parentfor/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                const processQuery = `
                    SELECT * FROM Process 
                    WHERE parent_id = ${id} 
                    ORDER BY extern_id
                `
                // The process must not have a parent if it is the parent of another process
                // This limits the "generationsize"/treedepth
                const resultQuery = await db.query(processQuery, req)
                if (resultQuery.rows.length > 0) {
                    res.send([])
                    return;
                }
                const query = `
                    SELECT 
                        p.*, 
                        o.name as owner_name1,
                        o2.name as owner_name2,
                        olcap.name as olca_name,
                        olcap.id as olca_id
                    FROM Process as p
                    LEFT JOIN Activitie as a ON p.activitie_id=a.id
                    LEFT JOIN Process as p2 ON p.parent_id=p2.id
                    LEFT JOIN Activitie as a2 ON p2.activitie_id=a2.id
                    LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                    LEFT JOIN Owner as o2 ON o2.owner_id=a2.owner_id
                    LEFT JOIN OLCAProcess as olcap on olcap.id=p.olcaprocess
                    WHERE p.parent_id IS NULL 
                    ORDER BY extern_id
                `;
                let result = await db.query(query, req)
                result = await pI.filterEntityByEditableOwner(req.session.userid, result.rows, e => [e.owner_name1, e.owner_name2])
                res.send(result)
            } catch (e) {
                debug(e)
                console.log(e);
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Process/ofowner', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Process/ofowner', async (req, res) => {
            try {
                const query = `
                SELECT 
                    T.id as id,
                    T.extern_id as extern_id,
                    T.name as name,
                    T.spd_id as spd_id,
                    spd.name as spd_name,
                    T.activitie_id as activity_id,
                    A.title as activity_name,
                    A.extern_id as activity_extern_id,
                    P.id as parent_id,
                    P.name as parent_name,
                    o1.name as owner_name1,
                    o2.name as owner_name2,
                    olcap.name as olca_name,
                    olcap.id as olca_id
                from Process AS T
                LEFT JOIN spd ON spd.id=T.spd_id
                LEFT JOIN activitie AS A ON A.id=T.activitie_id
                LEFT JOIN process AS P ON T.parent_id=P.id
                LEFT JOIN activitie AS A2 ON A2.id=P.activitie_id
                LEFT JOIN Owner AS o1 ON o1.owner_id=A.owner_id
                LEFT JOIN Owner AS o2 ON o2.owner_id=A2.owner_id
                LEFT JOIN OLCAProcess as olcap on olcap.id=T.olcaprocess
                ORDER BY extern_id
                `;
                let result = await db.query(query, req)
                result = await pI.filterEntityByEditableOwner(
                    req.session.userid, 
                    result.rows, 
                    e => [e.owner_name1, e.owner_name2])
                res.send(result)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/Process/all', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Process/all', async (req, res) => {
            try {
                const query = `
                SELECT 
                    T.id as id,
                    T.extern_id as extern_id,
                    T.name as name,
                    T.spd_id as spd_id,
                    spd.name as spd_name,
                    T.activitie_id as activity_id,
                    A.title as activity_name,
                    A.extern_id as activity_extern_id,
                    P.id as parent_id,
                    P.name as parent_name,
                    o1.name as owner_name1,
                    o2.name as owner_name2,
                    olcap.name as olca_name,
                    olcap.id as olca_id
                from Process AS T
                LEFT JOIN spd ON spd.id=T.spd_id
                LEFT JOIN activitie AS A ON A.id=T.activitie_id
                LEFT JOIN process AS P ON T.parent_id=P.id
                LEFT JOIN activitie AS A2 ON A2.id=P.activitie_id
                LEFT JOIN Owner AS o1 ON o1.owner_id=A.owner_id
                LEFT JOIN Owner AS o2 ON o2.owner_id=A2.owner_id
                LEFT JOIN OLCAProcess as olcap on olcap.id=T.olcaprocess
                ORDER BY extern_id
                `;
                let result = await db.query(query, req)
                console.log("First Process")
                console.log(result.rows[0])
                await pI.foreachEditableEntity(
                    req.session.userid,
                    result.rows,
                    e => [e.owner_name1, e.owner_name2],
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

        app.get('/Process/lcia_methods', pI.singlePermissionChecker(
            'rest_visualization_get'));
        app.get('/Process/lcia_methods', async (req, res) => {
            
            try {
                console.log("lcia methods call")
                let result = await ProcessHandler.getLCIAMethods(db, req)
                res.send(result)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.get('/Process/result/all', pI.singlePermissionChecker(
            'rest_visualization_get'));
        app.get('/Process/result/all', async (req, res) => {
            try {
                let query_olca = `
                SELECT * FROM ( 
                    SELECT 
                        first(p.id) as process_id,
                        first(p.extern_id) as extern_id,
                        first(p.name) as process_name,
                        first(m.name) as lcia_method,
                        first(m.id) as lcia_method_id,
                        json_agg(i.id ORDER BY i.id) as indicator_ids,
                        json_object_agg(i.name, r.value ORDER BY i.id) as indicator_name_result,
						first(olcap.reference) as reference,
						first(olcap.reference_unit) as reference_unit
                    FROM LCIA_Result as r
                    LEFT JOIN LCIA_Indicator AS i ON i.id=r.indicator
                    LEFT JOIN LCIA_Method AS m ON i.method=m.id
                    LEFT JOIN OLCAProcess AS olcap ON olcap.olca_id=r.olcaprocess
                    LEFT JOIN Process AS p ON p.olcaprocess=olcap.id
                    where r.olcaprocess is not NULL and p.id is not null and olcap.verified=true
                    GROUP BY r.olcaprocess, m.id
                ) AS result
                `;
                
                console.log("query olca")
                console.log(query_olca)

                let result_olca = await db.query(query_olca, req)
                let jointResults = result_olca.rows

                console.log("joint results")
                console.log(jointResults)

                this.makeResultsRelative(jointResults)
                res.send(jointResults)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.get('/Process/result/qa_all', pI.orPermissionsChecker(['rest_visualization_get', 'is_qa_member']));
        app.get('/Process/result/qa_all', async (req, res) => {
            try {
                let query_olca = `
                SELECT * FROM ( 
                    SELECT 
                        first(olcap.id) as process_id,
                        first(olcap.name) as extern_id,
                        first(olcap.name) as process_name,
                        first(m.name) as lcia_method,
                        first(m.id) as lcia_method_id,
                        json_agg(i.id ORDER BY i.id) as indicator_ids,
                        json_object_agg(i.name, r.value ORDER BY i.id) as indicator_name_result,
						first(olcap.reference) as reference,
						first(olcap.reference_unit) as reference_unit
                    FROM LCIA_Result as r
                    LEFT JOIN LCIA_Indicator AS i ON i.id=r.indicator
                    LEFT JOIN LCIA_Method AS m ON i.method=m.id
                    LEFT JOIN OLCAProcess AS olcap ON olcap.olca_id=r.olcaprocess
                    where r.olcaprocess is not NULL and olcap.verified=false
                    GROUP BY r.olcaprocess, m.id
                ) AS result
                `;
                
                console.log("query olca")
                console.log(query_olca)

                let result_olca = await db.query(query_olca, req)
                let jointResults = result_olca.rows

                console.log("joint results")
                console.log(jointResults)

                this.makeResultsRelative(jointResults)
                res.send(jointResults)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.get('/Process/result/:method_ids', pI.singlePermissionChecker(
            'rest_visualization_get'));
        app.get('/Process/result/:method_ids', async (req, res) => {
            try {
                let method_ids = req.params.method_ids.split(',').map(d => parseInt(d))
                let query_olca = `
                SELECT * FROM ( 
                    SELECT 
                        first(p.id) as process_id,
                        first(p.extern_id) as extern_id,
                        first(p.name) as process_name,
                        first(m.name) as lcia_method,
                        first(m.id) as lcia_method_id,
                        json_agg(i.id ORDER BY i.id) as indicator_ids,
                        json_object_agg(i.name, r.value ORDER BY i.id) as indicator_name_result,
						first(olcap.reference) as reference,
						first(olcap.reference_unit) as reference_unit
                    FROM LCIA_Result as r
                    LEFT JOIN LCIA_Indicator AS i ON i.id=r.indicator
                    LEFT JOIN LCIA_Method AS m ON i.method=m.id
                    LEFT JOIN OLCAProcess AS olcap ON olcap.olca_id=r.olcaprocess
                    LEFT JOIN Process AS p ON p.olcaprocess=olcap.id
                    where r.olcaprocess is not NULL and p.id is not null
                    GROUP BY r.olcaprocess, m.id
                ) AS result WHERE 
                `;
                let where_conditions = '';
                for (let i in method_ids) {
                    let method_id = method_ids[i]
                    where_conditions += `result.lcia_method_id=${method_id} `
                    if (i != method_ids.length - 1)
                        where_conditions += 'OR '
                }
                query_olca += '(' + where_conditions + ') '

                console.log("query olca")
                console.log(query_olca)

                let result_olca = await db.query(query_olca, req)
                let jointResults = result_olca.rows

                console.log("joint results")
                console.log(jointResults)

                this.makeResultsRelative(jointResults)
                res.send(jointResults)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })

        app.get('/Process/result/:process_ids/:method_ids', pI.singlePermissionChecker(
            'rest_visualization_get'));
        app.get('/Process/result/:process_ids/:method_ids', async (req, res) => {
            try {
                let method_ids = req.params.method_ids.split(',').map(d => parseInt(d))
                let process_ids = req.params.process_ids.split(',').map(d => parseInt(d))
                if (!(method_ids.length == process_ids.length))
                    throw "Error: Requiring same amount of method- and process-ids."

                let query_olca = `
                SELECT * FROM ( 
                    SELECT 
                        first(p.id) as process_id,
                        first(p.extern_id) as extern_id,
                        first(p.name) as process_name,
                        first(m.name) as lcia_method,
                        first(m.id) as lcia_method_id,
                        json_agg(i.id ORDER BY i.id) as indicator_ids,
                        json_object_agg(i.name, r.value ORDER BY i.id) as indicator_name_result,
						first(olcap.reference) as reference,
						first(olcap.reference_unit) as reference_unit
                    FROM LCIA_Result as r
                    LEFT JOIN LCIA_Indicator AS i ON i.id=r.indicator
                    LEFT JOIN LCIA_Method AS m ON i.method=m.id
                    LEFT JOIN OLCAProcess AS olcap ON olcap.olca_id=r.olcaprocess
                    LEFT JOIN Process AS p ON p.olcaprocess=olcap.id
                    where r.olcaprocess is not NULL and p.id is not null
                    GROUP BY r.olcaprocess, m.id
                ) AS result WHERE 
                `;
                let where_conditions = '';
                for (let i in method_ids) {
                    let method_id = method_ids[i]
                    let process_id = process_ids[i]
                    where_conditions += `(result.lcia_method_id=${method_id} AND
                                          result.process_id=${process_id})`
                    if (i != method_ids.length - 1)
                        where_conditions += 'OR '
                }
                query_olca += where_conditions
                console.log("RESULTS QUERY")
                console.log(query_olca)
                let result_olca = await db.query(query_olca, req)
                let jointResults = result_olca.rows
                this.makeResultsRelative(jointResults)
                res.send(jointResults)
            } catch (e) {
                debug(e)
                console.log(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })


        app.get('/Process/qa_result/:process_ids/:method_ids', pI.orPermissionsChecker(['rest_visualization_get', 'is_qa_member']));
        app.get('/Process/qa_result/:process_ids/:method_ids', async (req, res) => {
            try {
                let method_ids = req.params.method_ids.split(',').map(d => parseInt(d))
                let process_ids = req.params.process_ids.split(',').map(d => parseInt(d))
                if (!(method_ids.length == process_ids.length))
                    throw "Error: Requiring same amount of method- and process-ids."

                let query_olca = `
                SELECT * FROM ( 
                    SELECT 
                        first(olcap.id) as process_id,
                        first(olcap.name) as extern_id,
                        first(olcap.name) as process_name,
                        first(m.name) as lcia_method,
                        first(m.id) as lcia_method_id,
                        json_agg(i.id ORDER BY i.id) as indicator_ids,
                        json_object_agg(i.name, r.value ORDER BY i.id) as indicator_name_result,
						first(olcap.reference) as reference,
						first(olcap.reference_unit) as reference_unit
                    FROM LCIA_Result as r
                    LEFT JOIN LCIA_Indicator AS i ON i.id=r.indicator
                    LEFT JOIN LCIA_Method AS m ON i.method=m.id
                    LEFT JOIN OLCAProcess AS olcap ON olcap.olca_id=r.olcaprocess
                    where r.olcaprocess is not NULL
                    GROUP BY r.olcaprocess, m.id
                ) AS result WHERE 
                `;
                let where_conditions = '';
                for (let i in method_ids) {
                    let method_id = method_ids[i]
                    let process_id = process_ids[i]
                    where_conditions += `(result.lcia_method_id=${method_id} AND
                                          result.process_id=${process_id})`
                    if (i != method_ids.length - 1)
                        where_conditions += 'OR '
                }
                query_olca += where_conditions
                console.log("RESULTS QUERY")
                console.log(query_olca)
                let result_olca = await db.query(query_olca, req)
                let jointResults = result_olca.rows
                this.makeResultsRelative(jointResults)
                res.send(jointResults)
            } catch (e) {
                debug(e)
                console.log(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })



        app.post('/Process', pI.singlePermissionChecker(
            "rest_visualization_post"));
        app.post('/Process', async (req, res) => {
            try {
                let esc = Utility.mysql_real_escape_string
                let extern_id = esc(req.body.extern_id)
                let name = esc(req.body.name)
                let spd_id = esc(req.body.spd_id)
                let activity_id = parseInt(req.body.activity_id)
                let parent_id = parseInt(req.body.parent_id)
                let olca_id = req.body.olca_id ? parseInt(req.body.olca_id) : null
                if (!isNaN(parent_id) && !await this.validParent(db, req, parent_id)) {
                    res.send(500)
                    return;
                }

                if(olca_id != null)
                {
                    if( !await pI.editEntityPermissionChecker(
                            id => `SELECT 
                                    o.name as name
                                FROM OLCAProcess as p
                                LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                                WHERE p.id=${olca_id}`,
                            req => req.body.olca_id ? parseInt(req.body.olca_id) : null
                        )(req,null,null))
                    {
                        res.send(500)
                        return;
                    }
                }

                // check if activities addressed through activitie_id and parent_id
                // are owned by the current user
                let editableActivities = new Set(await ActivityHandler.getOwnedActivitieIds(db, req));
                if (!isNaN(activity_id) && !editableActivities.has(activity_id)) {
                    res.send(500)
                    return;
                }
                if (!isNaN(parent_id)) {
                    let query = `
                    SELECT first(activitie_id) as a_id FROM Process as p
                    WHERE p.id=${parent_id}
                    GROUP BY activitie_id`
                    const result = await db.query(query, req)
                    if (result.rows.length != 1) {
                        res.send(500)
                        return;
                    }
                    let activity_id = parseInt(result.rows[0].a_id);
                    if (!editableActivities.has(activity_id)) {
                        res.send(500)
                        return;
                    }
                }

                console.log('start create')
                await this.createProcess(db, req, name, extern_id, spd_id,
                    activity_id, parent_id, olca_id);
                console.log('end create');
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

        app.put('/Process/:id', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name
                FROM Process as p
                LEFT JOIN Activitie as a ON p.activitie_id=a.id
                LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                WHERE p.id=${id}`,
            req => parseInt(req.params.id)
        ))
        app.put('/Process/:id', pI.singlePermissionChecker(
            "rest_visualization_put"))
        app.put('/Process/:id', async (req, res) => {
            try {
                console.log('put Process')
                console.log(req.body)
                let id = parseInt(req.params.id)
                let esc = Utility.mysql_real_escape_string
                let extern_id = esc(req.body.extern_id)
                let name = esc(req.body.name)
                let spd_id = esc(req.body.spd_id)
                let activity_id = parseInt(req.body.activity_id)
                let parent_id = parseInt(req.body.parent_id)
                let olca_id = req.body.olca_id ? parseInt(req.body.olca_id) : null
                if (!isNaN(parent_id) && !await this.validParent(db, req, parent_id)) {
                    res.send(500)
                    return;
                }
                if (!isNaN(parent_id) && !await this.canHaveParent(db, req, id)) {
                    res.send(500)
                    return;
                }

                if(olca_id != null)
                {
                    if( !await pI.editEntityPermissionChecker(
                            id => `SELECT 
                                    o.name as name
                                FROM OLCAProcess as p
                                LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                                WHERE p.id=${olca_id}`,
                            req => req.body.olca_id ? parseInt(req.body.olca_id) : null
                        )(req,null,null))
                    {
                        res.send(500)
                        return;
                    }
                }

                // check if activities addressed through activitie_id and parent_id
                // are owned by the current user
                let editableActivities = new Set(await ActivityHandler.getOwnedActivitieIds(db, req));
                if (!isNaN(activity_id) && !editableActivities.has(activity_id)) {
                    res.send(500)
                    return;
                }
                if (!isNaN(parent_id)) {
                    let query = `
                    SELECT first(activitie_id) as a_id FROM Process as p
                    WHERE p.id=${parent_id}
                    GROUP BY activitie_id`
                    const result = await db.query(query, req)
                    if (result.rows.length != 1) {
                        res.send(500)
                        return;
                    }
                    let activity_id = parseInt(result.rows[0].a_id);
                    if (!editableActivities.has(activity_id)) {
                        res.send(500)
                        return;
                    }
                }

                await this.updateProcess(db, req, id, extern_id, name, spd_id,
                   activity_id, parent_id, olca_id);

                //await db.query(infosrcRefUpdate);
                //await db.query(query);
                console.log('all fine')
                res.send(null);
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.delete('/Process/:id', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name
                FROM Process as p
                LEFT JOIN Activitie as a ON p.activitie_id=a.id
                LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                WHERE p.id=${id}`,
            req => parseInt(req.params.id)
        ))
        app.delete('/Process/:id', pI.singlePermissionChecker(
            "rest_visualization_delete"))
        app.delete('/Process/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                await this.deleteProcess(db, req, id);

                console.log('all fine')
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

module.exports = ProcessHandler;
