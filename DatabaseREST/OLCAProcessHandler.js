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
var debug = require('debug')('OLCAProcessHandler')

var http = require('http');
var OwnerHandler = require('./OwnerHandler')
const { request } = require('express');
const ProcessHandler = require('./ProcessHandler');
const config_file = require("./Config.js");

class OLCAProcessHandler {

    async create(db, req, id, name, confidentiality, owner_id) {
        let query = `
            INSERT INTO OLCAProcess
            (
                olca_id, name, confidentiality, owner_id
            )
            VALUES
            (
                ${id}, '${name}',
                '${confidentiality}', ${owner_id}
            )
            RETURNING id
            `
        let result = await db.query(query, req);
        let olcaprocess_id = parseInt(result.rows[0].id);
        return olcaprocess_id;
    }

    async update(db, req, old_id, id, name, confidentiality,
        owner_id) {

        let query = `
            UPDATE OLCAProcess
            SET
                olca_id=${id},
                name='${name}',
                confidentiality='${confidentiality}',
                owner_id=${owner_id}
            WHERE
                olca_id =${old_id};`
        let result = await db.query(query, req);
        console.log(query);
        console.log(result);
        return;
    }

    async isVerified(db, req, olca_id)
    {
        let query = `
        SELECT id
        FROM olcaprocess
        WHERE
            id = ${olca_id}
            AND
            verified = true;`;
        let result = await db.query(query, req);

        // console.log(query);
        // console.log(result)

        let is_verified = (result.rows.length !== 0)
        return is_verified;
    }

    async updateTechnology(db, req, olca_id, technology_id) {
        // remove previous assignment  
        let query = `
             UPDATE Process 
             SET 
                olcaprocess=NULL
             WHERE 
                olcaprocess=${olca_id};`  
        let result = await db.query(query, req);
 
        if (technology_id) { 
            query = `
            UPDATE Process
            SET 
                olcaprocess=${olca_id}          
            WHERE
                id=${technology_id};`
            result = await db.query(query, req);
        }
        return;
    }

    async delete(db, req, id) {
        let query = `DELETE FROM OLCAProcess WHERE olca_id=${id}`
        await db.query(query, req);
    }

    //param id: openlca process id
    async updateLCIAResults(db, req, id, reference_unit, reference_value) {
        let delQuery = `DELETE FROM LCIA_Result WHERE olcaprocess=${id};`
        await db.query(delQuery, req);

        let unitsQuery = `UPDATE olcaprocess SET reference=${reference_value}, reference_unit='${reference_unit}' WHERE olca_id=${id}`;
        await db.query(unitsQuery, req);

        let lciaMethods = await ProcessHandler.getLCIAMethods(db, req)

        for (let m of lciaMethods) {
            let olcaMethodName = m.olca_name
            let indicatorNames = m.indicator_olca_names
            let buff = new Buffer.from(olcaMethodName);
            let b64MethodName = buff.toString('base64');

            let options = {
                host: config_file.OLCA.ip,
                port: config_file.OLCA.port,
                path: '/impact/calculate?id=' + id + '&impactMethod=' + b64MethodName,
                method: 'GET'
            };

            let p = new Promise((resolve, reject) => http.request(options, r => {
                let data = '';
                r.setEncoding('utf8');
                r.on('data', (chunk) => {
                    data += chunk
                });
                r.on('end', async () => {
                    let result = JSON.parse(data);
                    if (result.error == false) {
                        for (let indicatorResult of result.results) {
                            // TODO fix quadratic(?) runtime
                            let nameId = indicatorNames.indexOf(indicatorResult.name)
                            let olca_process_id = id
                            if (nameId >= 0) {
                                let indicator_id = m.indicator_ids[nameId]
                                let value = indicatorResult.value
                                let query = `INSERT INTO LCIA_Result (olcaprocess,indicator, value) VALUES
                                (${olca_process_id},${indicator_id},${value})`

                                //console.log("query")
                                //console.log(query)
                                await db.query(query, req);
                            }
                        }
                    }
                    resolve()
                })
                r.on('error', (e) => {
                    console.log("error");
                    console.log(e);
                    resolve()
                })

            }).end());
            await p;

        }
    }

    async isOwnerIdSwitchAllowed(db, req, id) {
        let q = `SELECT o.name FROM OLCAProcess as p
                    LEFT JOIN Owner as o ON p.owner_id = o.owner_id 
                WHERE p.id=${id}`;
        let name = (await db.query(q, req)).rows[0].name;

        let checker = pI.orPermissionsChecker(['edit_entities_of_' + name, 'edit_all_entities'])
        let allowed = await checker(req, null, null)
        return allowed;
    }

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()
        app.get('/OLCAProcess', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/OLCAProcess', async (req, res) => {
            try {
                const query = `
                    SELECT DISTINCT ON (p.id)
                        p.*, 
                        p.confidentiality as confidentiality,
                        o.name as owner,
                        o.owner_id as owner_id,
                        aud.action_tstamp_tx as edit_tstamp,
                        aud.editor_id as editor_id,
                        aud.event_id as event_id,
                        aud.changed_fields as changed_fields,
                        l.login as editor_name,
                        t.id as technology_id,
                        aud_tech.id as technology_id_tech,
                        aud_tech.changed_fields as changed_fields_tech,
                        aud_tech.event_id as event_id_tech,
                        aud_tech.action_tstamp_tx as edit_tstamp_tech,
                        aud_tech.editor_id_tech as editor_id_tech
                    FROM OLCAProcess as p
                    LEFT JOIN (
                        SELECT 
                            action_tstamp_tx,
                            row_data,
                            event_id, 
                            changed_fields,
                            application_name as editor_id,
                            SUBSTRING(audit.logged_actions.row_data::text, '\"id"=>\"([0-9]*)\"') as id 
                        FROM audit.logged_actions
                        WHERE 
                            table_name='olcaprocess'
                            AND (action='I' OR action='U')
                    ) as aud ON aud.id = p.id::text
                    LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                    LEFT JOIN login as l ON l.id::text=aud.editor_id
                    LEFT JOIN Process as t ON t.olcaprocess=p.id
                    LEFT JOIN (
                        SELECT 
                            action_tstamp_tx,
                            row_data,
                            application_name as editor_id_tech,
                            changed_fields,
                            event_id,
                            SUBSTRING(audit.logged_actions.row_data::text, '\"id"=>\"([0-9]*)\"') as id
                        FROM audit.logged_actions
                        WHERE 
                            table_name='process'
                            AND (action='I' OR action='U')
                        ORDER BY event_id DESC LIMIT 1
                    )  as aud_tech ON aud_tech.id = t.id::text
                    ORDER BY p.id, aud.action_tstamp_tx DESC
                `;

                let result = await db.query(query, req)
                result = await pI.filterVisibleConfidentialEntities(req.session.userid, result.rows, e => [e.owner])

                result = await Promise.all(result.map(async v => {
                    v['owner_changeable'] = await this.isOwnerIdSwitchAllowed(db, req, v.id)
                    return v;
                }))

                let ids = Array.from(new Set(result.map(v => v.olca_id)))
                if (ids.length > 0) {
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/impact/processByIds?ids=' + ids.join(),
                        method: 'GET'
                    };
                    let p = new Promise((resolve, reject) => http.request(options, r => {
                        let data = '';
                        r.setEncoding('utf8');
                        r.on('data', (chunk) => {
                            data += chunk
                        });
                        r.on('end', () => {
                            let j = JSON.parse(data);
                            if ('processList' in j) {
                                let processLookup = {}
                                j.processList.forEach(e => processLookup[e.intern_id] = e)
                                result.forEach(process => {
                                    if (parseInt(process.olca_id) in processLookup) {
                                        process['lcaProcess'] = processLookup[parseInt(process.olca_id)]
                                    }
                                    else
                                        console.log('no process: ' + process.id)
                                });
                            }
                            resolve()
                        })
                        r.on('error', (e) => {
                            console.log("error");
                            console.log(e);
                        })

                    }).end());
                    await p;
                }
                console.log("sending resonse...")
                res.send(result.filter(e => { return 'lcaProcess' in e }))
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });


        app.get('/OLCAProcessFiltered', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/OLCAProcessFiltered', async (req, res) => {
            try {
                const query = `
                    SELECT DISTINCT ON (p.id)
                        p.*, 
                        p.confidentiality as confidentiality,
                        o.name as owner,
                        o.owner_id as owner_id,
                        aud.action_tstamp_tx as edit_tstamp,
                        aud.editor_id as editor_id,
                        aud.event_id as event_id,
                        aud.changed_fields as changed_fields,
                        l.login as editor_name,
                        t.id as technology_id,
                        aud_tech.id as technology_id_tech,
                        aud_tech.changed_fields as changed_fields_tech,
                        aud_tech.event_id as event_id_tech,
                        aud_tech.action_tstamp_tx as edit_tstamp_tech,
                        aud_tech.editor_id_tech as editor_id_tech
                    FROM OLCAProcess as p
                    LEFT JOIN (
                        SELECT 
                            action_tstamp_tx,
                            row_data,
                            event_id, 
                            changed_fields,
                            application_name as editor_id,
                            SUBSTRING(audit.logged_actions.row_data::text, '\"id"=>\"([0-9]*)\"') as id 
                        FROM audit.logged_actions
                        WHERE 
                            table_name='olcaprocess'
                            AND (action='I' OR action='U')
                    ) as aud ON aud.id = p.id::text
                    LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                    LEFT JOIN login as l ON l.id::text=aud.editor_id
                    LEFT JOIN Process as t ON t.olcaprocess=p.id
                    LEFT JOIN (
                        SELECT 
                            action_tstamp_tx,
                            row_data,
                            application_name as editor_id_tech,
                            changed_fields,
                            event_id,
                            SUBSTRING(audit.logged_actions.row_data::text, '\"id"=>\"([0-9]*)\"') as id
                        FROM audit.logged_actions
                        WHERE 
                            table_name='process'
                            AND (action='I' OR action='U')
                        ORDER BY event_id DESC LIMIT 1
                    )  as aud_tech ON aud_tech.id = t.id::text
                    ORDER BY p.id, aud.action_tstamp_tx DESC
                `;

                let result = await db.query(query, req)
                result = await pI.filterVisibleConfidentialEntities(req.session.userid, result.rows, e => [e.owner])

                result = await Promise.all(result.map(async v => {
                    v['owner_changeable'] = await this.isOwnerIdSwitchAllowed(db, req, v.id)
                    return v;
                }))

                result = result.filter(r => {
                    if (r.owner_changeable) {
                        return r;
                    }
                })

                console.log("sending resonse...")
                res.send(result)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });


        app.post('/OLCAProcess/verify/:id', async (req, res) => {
            if (!await pI.allowed(req.session.userid, 'is_qa_member')) {
                console.log(`User ${id} has insufficient permissions to change verification status`)
                res.sendStatus(401)
                return
            }

            const id = req.params.id;
            const new_status = req.body['verified'];

            console.log("Verify OLCAProcess " + req.params.id);

            const query = `UPDATE public.olcaprocess
                           SET verified = ${new_status}
                           WHERE id = ${id};`
            const result = await db.query(query, req)

            console.log(query)
            console.log(result);

            res.sendStatus(200);
        })
        app.post('/OLCAProcess', pI.singlePermissionChecker(
            "rest_visualization_post"));
        app.post('/OLCAProcess', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name
                FROM Process as p
                LEFT JOIN Activitie as a ON p.activitie_id=a.id
                LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                WHERE p.id=${id}`,
            req => req.body.technology_id ? parseInt(req.body.technology_id) : null
        ))
        app.post('/OLCAProcess', async (req, res) => {
            try {
                console.log(req.body);
                let esc = Utility.mysql_real_escape_string
                let confidential = esc(req.body.confidentiality)
                let owner_id = parseInt(req.body.owner_id);
                let file = req.body.file;
                let technology_id = req.body.technology_id ? parseInt(req.body.technology_id) : null 
                if (typeof file == 'string' && file.includes("base64")) {
                    let filen = Buffer.from(file.split(",")[1], 'base64')
                    file = filen
                } else {
                    res.send(500)
                    return;
                }

                if (!await OwnerHandler.isOwnerIDAllowed(db, req, owner_id)) {
                    res.send(500)
                    return;
                }

                if (!['Private (no COA)', 'COA, confidential', 'COA, non-confidential', 'Shared'].includes(confidential)) {
                    console.log("error3: " + confidential);
                    res.send(500)
                    return;
                }

                // check if file is valid
                let validFile = false;
                let processName = null;
                if (typeof file != 'string') {
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/import/singletry/',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="export.zip"',
                            'Content-Length': file.length
                        }
                    };
                    let p = new Promise((resolve, reject) => {
                        let request = http.request(options, r => {
                            let data = '';
                            r.setEncoding('utf8');
                            r.on('data', (chunk) => {
                                data += chunk
                            });
                            r.on('end', () => {
                                let j = JSON.parse(data);
                                if ('error' in j) {
                                    validFile = !j.error
                                    if (!j.error)
                                        processName = esc(j.name)
                                }
                                resolve()
                            })

                        })
                        request.write(file)
                        request.end()
                    });
                    await p;
                }

                let uploadError = true;
                let processID = null;
                let reference_unit = "";
                let reference_value = 0;
                let id;
                if (validFile) {
                    // import process
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/import/single/',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="export.zip"',
                            'Content-Length': file.length
                        }
                    };

                    let p = new Promise((resolve, reject) => {
                        let request = http.request(options, r => {
                            let data = '';
                            r.setEncoding('utf8');
                            r.on('data', (chunk) => {
                                data += chunk
                            });
                            r.on('end', () => {
                                let j = JSON.parse(data);
                                if ('error' in j) {
                                    uploadError = j.error
                                    if (!uploadError)
                                    {
                                        processID = parseInt(j.id)
                                        reference_unit = esc(j.reference_unit)
                                        reference_value = parseFloat(j.reference_amount)
                                    }
                                }
                                console.log("upload returned ")
                                console.log(j)
                                console.log(reference_unit)
                                console.log(reference_value)
                                resolve()
                            })
                        })
                        request.write(file)
                        request.end()
                    });
                    await p;
                }

                // TODO is the right condition: !validFile || (validFile && uploadError) ?
                if (!validFile || (validFile && uploadError)) {
                    res.send(
                        { error: 'Unknown Error' }
                    )
                    return;
                }

                try {
                    console.log("updating results")
                    id = await this.create(db, req, processID, processName, confidential, owner_id);
                    console.log("created")
                    await this.updateLCIAResults(db, req, processID, reference_unit, reference_value)
                    console.log("updated results")
                } catch (e) {
                    console.log(e)
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/import/delete/?id=' + processID,
                        method: 'GET'
                    };

                    let request = http.request(options).end()
                    await this.delete(db, req, processID);
                    res.send(
                        { error: 'Unknown Error' }
                    )
                    return;
                }

                if (technology_id) {
                    if (!await this.isVerified(db, req, id)) {
                        res.send({ error: "Can't update technology, because process is not verified." });
                        return;
                    }
                    await this.updateTechnology(db, req, id, technology_id);
                }

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

        app.put('/OLCAProcess/:id', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name,
                    confidentiality as confidentiality
                FROM OLCAProcess as p
                LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                WHERE p.id=${id}`,
            req => parseInt(req.params.id)
        ))
        app.put('/OLCAProcess/:id', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name
                FROM Process as p
                LEFT JOIN Activitie as a ON p.activitie_id=a.id
                LEFT JOIN Owner as o ON o.owner_id=a.owner_id
                WHERE p.id=${id}`,
            req => req.body.technology_id ? parseInt(req.body.technology_id) : null
        ))
        app.put('/OLCAProcess/:id', pI.singlePermissionChecker(
            "rest_visualization_put"))
        app.put('/OLCAProcess/:id', async (req, res) => {
            try {
                let esc = Utility.mysql_real_escape_string
                let confidential = esc(req.body.confidentiality)
                let owner_id = req.body.owner_id ? parseInt(req.body.owner_id) : null;
                let id = parseInt(req.params.id)
                let technology_id = req.body.technology_id ? parseInt(req.body.technology_id) : null
                let file = req.body.file;
                if (typeof file == 'string' && file.includes("base64")) {
                    let filen = Buffer.from(file.split(",")[1], 'base64')
                    file = filen
                }

                let oldProcessQuery = `
                    SELECT id, olca_id, name, confidentiality, owner_id FROM OLCAProcess
                    WHERE id=${id};
                `;
                console.log("given request id")
                console.log(id);
                let result = await db.query(oldProcessQuery, req);
                let oldProcess = result.rows[0]
                console.log("oldProcess")
                console.log(oldProcess);

                if (!await this.isOwnerIdSwitchAllowed(db, req, id) || owner_id == null) {
                    owner_id = oldProcess.owner_id;
                }
                if (owner_id != oldProcess.owner_id &&
                    !await OwnerHandler.isOwnerIDAllowed(db, req, owner_id)) {
                    res.send(500)
                    return;
                }

                if (!['Private (no COA)', 'COA, confidential', 'COA, non-confidential', 'Shared'].includes(confidential)) {
                    res.send(500)
                    return;
                }

                // check if file is valid
                let validFile = false;
                if (typeof file != 'string') {
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/import/singletry/',
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="export.zip"',
                            'Content-Length': file.length
                        }
                    };
                    let p = new Promise((resolve, reject) => {
                        let request = http.request(options, r => {
                            let data = '';
                            r.setEncoding('utf8');
                            r.on('data', (chunk) => {
                                data += chunk
                            });
                            r.on('end', () => {
                                let j = JSON.parse(data);
                                if ('error' in j) {
                                    validFile = !j.error
                                }
                                resolve()
                            })

                        })
                        request.write(file)
                        request.end()
                    });
                    await p;
                }

                let uploadError = true;
                let processID = null;
                let processName = null;
                let reference_unit = "";
                let reference_value = 0;
                if (validFile) {
                    // import process
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: `/import/updatesingle/${oldProcess.olca_id}`,
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/octet-stream',
                            'Content-Disposition': 'attachment; filename="export.zip"',
                            'Content-Length': file.length
                        }
                    };

                    let p = new Promise((resolve, reject) => {
                        let request = http.request(options, r => {
                            let data = '';
                            r.setEncoding('utf8');
                            r.on('data', (chunk) => {
                                data += chunk
                            });
                            r.on('end', () => {
                                let j = JSON.parse(data);
                                if ('error' in j) {
                                    uploadError = j.error
                                    if (!uploadError) {
                                        processID = parseInt(j.id)
                                        processName = esc(j.name)
                                        reference_unit = esc(j.reference_unit)
                                        reference_value = parseFloat(j.reference_amount)
                                    }
                                }
                                resolve()
                            })
                        })
                        request.write(file)
                        request.end()
                    });
                    await p;
                }

                // TODO is the right condition: !validFile || (validFile && uploadError) ?
                if (validFile && uploadError) {
                    res.send(500)
                    return;
                }
                if (!validFile) {
                    console.log("no valid file");
                    console.log(oldProcess)
                    console.log(oldProcess)
                    await this.update(db, req, oldProcess.olca_id, oldProcess.olca_id, oldProcess.name, confidential,
                        owner_id);
                } else {
                    console.log("valid file")
                    console.log("old Process")
                    console.log(oldProcess.olca_id)
                    console.log("new Process")
                    console.log(processID);
                    try {
                        await this.update(db, req, oldProcess.olca_id, processID, processName, confidential,
                            owner_id);
                        await this.updateLCIAResults(db, req, processID, reference_unit, reference_value)
                    } catch (e) {
                        let options = {
                            host: config_file.OLCA.ip,
                            port: config_file.OLCA.port,
                            path: '/import/delete/?id=' + processID,
                            method: 'GET'
                        };

                        let request = http.request(options).end()
                        await this.delete(db, req, processID);
                        await this.delete(db, req, oldProcess.olca_id);
                        res.send(
                            { error: 'Unknown Error' }
                        )
                        return null;
                    }
                }
                await this.updateTechnology(db, req, id, technology_id);
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

        app.delete('/OLCAProcess/:id', pI.editEntityPermissionChecker(
            id => `SELECT 
                    o.name as name,
                    confidentiality as confidentiality
                FROM OLCAProcess as p
                LEFT JOIN Owner as o ON o.owner_id=p.owner_id
                WHERE p.id=${id}`,
            req => parseInt(req.params.id)
        ))
        app.delete('/OLCAProcess/:id', pI.singlePermissionChecker(
            "rest_visualization_delete"))
        app.delete('/OLCAProcess/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)

                let oldProcessQuery = `
                    SELECT id, olca_id, name, confidentiality, owner_id FROM OLCAProcess
                    WHERE id=${id};
                `;
                let result = await db.query(oldProcessQuery, req);
                console.log("delete old result")
                console.log(result)
                if (result.rows.length != 1) {
                    res.send(
                        { error: 'No such process found.' }
                    )
                } else {
                    let oldProcess = result.rows[0]

                    // delete the old process
                    console.log("deleting olca_id " + oldProcess.olca_id)
                    let options = {
                        host: config_file.OLCA.ip,
                        port: config_file.OLCA.port,
                        path: '/import/delete/?id=' + oldProcess.olca_id,
                        method: 'GET'
                    };

                    let request = http.request(options).end()
                    await this.delete(db, req, oldProcess.olca_id);

                    console.log('all fine')
                    res.send(null);
                }

            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/OLCAProcess/bycomponent/:code', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/OLCAProcess/bycomponent/:code', async (req, res) => {
            try {
                let code = Utility.mysql_real_escape_string(req.params.code)
                let query = `
                SELECT
                    first(TAB1.activity_id) as activity_id,
                    first(TAB1.activity_name) as activity_name,
                    first(TAB1.activity_extern_id) as activity_extern_id,
                    json_agg(TAB1.id) as olca_ids,
                    json_agg(TAB1.name) as olca_names,
                    json_agg(TAB1.code) as codes,
                    json_agg(TAB1.process_id) as process_ids,
                    json_agg(TAB1.extern_id) as extern_ids,
                    json_agg(TAB1.process_name) as process_names
                FROM
                    (
                        SELECT
                            first(olcap.id) as id,
                            first(olcap.name) as name,
                            first(a.id) as activity_id,
                            first(a.extern_id) as activity_extern_id,
                            first(a.title) as activity_name,
                            first(c.code) as code,
                            first(p.id) as process_id,
                            first(p.extern_id) as extern_id,
                            first(p.name) as process_name
                        FROM component as c
                        LEFT JOIN 
                            spd as s on c.spd_id=s.id
                        LEFT JOIN
                            activitie_component_link as acl ON acl.component_id=c.id
                        LEFT JOIN
                            activitie as a ON a.id=acl.activitie_id
                        LEFT JOIN
                            process as p on p.activitie_id =a.id 
                        LEFT JOIN
                            olcaprocess as olcap on p.olcaprocess=olcap.id 
                        where olcap.id is not null AND c.code='${code}'
                        group by olcap.id
                        ORDER BY olcap.name
                    )
                AS
                    TAB1
                GROUP BY TAB1.activity_id
                ORDER BY activity_extern_id`
                let result = await db.query(query, req)
                res.send(result.rows)
            } catch (e) {
                console.log(e)
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })
    }
}

module.exports = OLCAProcessHandler;
