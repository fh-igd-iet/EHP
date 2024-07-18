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
var debug = require('debug')('EDASProcessHandler')
class EDASProcessHandler {
    async createProcess(db, req, Owner_id, Demo, PD, Explanation, SPD_id, ITD_id, workpackage) {
        let query = `
            INSERT INTO EDAS_Process 
            (
                Owner_id, 
                Demo, 
                PD, 
                Explanation, 
                SPD_id,
                Excelfile_id
            )
            VALUES
            (
                ${Owner_id},
                '${Demo}',
                '${PD}',
                '${Explanation}',
                '${SPD_id}',
                1
            ) RETURNING id;
        `
        console.log(query);
        let result = await db.query(query,req);
        let processId = result.rows[0]['id'];

        let infoSrcRefQuery = `
            INSERT INTO InfoSrcRef
            (
                id,
                WP,
                source,
                SPD_id
            )
            VALUES
            (
                ${processId},
                '${workpackage}',
                '',
                '${ITD_id}'
            );
        `
        console.log(infoSrcRefQuery)
        await db.query(infoSrcRefQuery,req);
        return processId;
    }

    async createBudget(db, req, processId, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor) {
        let query = `
            INSERT INTO Process_Budget
            (
                id, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor
            )
            VALUES
            (
                ${processId}, ${A}, ${B}, ${C}, ${D}, ${REUP}, ${EoL}, ${ADS}, ${ASA}, ${grossfactor} 
            )
        `
        await db.query(query, req)
    }

    async updateBudget(db, req, processId, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor) {
        let query = `
            UPDATE Process_Budget
            SET
                A=${A},
                B=${B},
                C=${C},
                D=${D},
                REUP=${REUP},
                EoL=${EoL},
                ADS=${ADS},
                ASA=${ASA},
                grossfactor=${grossfactor}
            WHERE
                id=${processId}
        `
        await db.query(query, req)
    }

    async updateCohortLinks(db, req, Process_id, links) {
        let query1 = `DELETE FROM Process_Cohort_Inventory_Link WHERE Process_id=${Process_id}`
        let query2 = `INSERT INTO Process_Cohort_Inventory_Link
                        (Process_id, Cohort_Inventory_id, proportion)
                    VALUES `;
        let i = 0;
        for (let link of links) {
            let Cohort_Inventory_id = link
            let proportion = 1.0
            query2 += `(${Process_id}, ${Cohort_Inventory_id}, ${proportion})`
            if (i != links.length - 1)
                query2 += ","
            i++;
        }
        query2 += ';'
        await db.query(query1, req)
        if (links.length > 0)
            await db.query(query2, req)
    }

    async updateMaterialLinks(db, req, Process_id, links, insertions) {
        let query1 = `DELETE FROM Process_Material_Link WHERE Process_id=${Process_id}`
        let query2 = `INSERT INTO Process_Material_Link
                        (Process_id, Material_id)
                    VALUES `;
        let i = 0;
        for (let link of links) {
            let Material_id = link
            query2 += `(${Process_id}, ${Material_id})`
            if (i != links.length - 1)
                query2 += ","
            i++;
        }
        query2 += ';'
        await db.query(query1, req)
        for (let insertion of insertions) {
            let info = await db.query(`INSERT INTO Material (name) VALUES ('${insertion}') RETURNING id`, req);
            let id = info.rows[0]['id'];
            await db.query(`INSERT INTO Process_Material_Link (Process_id, Material_id) 
                        VALUES (${Process_id}, ${id})`, req)
        }
        if (links.length > 0)
            await db.query(query2, req)
    }

    async updateKeywordLinks(db, req, Process_id, links, insertions) {
        let query1 = `DELETE FROM Process_Keyword_Link WHERE Process_id=${Process_id}`
        let query2 = `INSERT INTO Process_Keyword_Link
                        (Process_id, Keyword_id)
                    VALUES `;
        let i = 0;
        for (let link of links) {
            let Keyword_id = link
            query2 += `(${Process_id}, ${Keyword_id})`
            if (i != links.length - 1)
                query2 += ','
            i++;
        }
        query2 += ';'
        await db.query(query1, req)
        for (let insertion of insertions) {
            let info = await db.query(`INSERT INTO Keyword (keyword) VALUES ('${insertion}') RETURNING id`, req);
            let id = info.rows[0]['id'];
            await db.query(`INSERT INTO Process_Keyword_Link (Process_id, Keyword_id) 
                        VALUES (${Process_id}, ${id})`, req)
        }
        if (links.length > 0)
            await db.query(query2, req)
    }

    async updateLinks(db, req, processId, body) {
        if ('cohort_ids' in body && typeof body.cohort_ids != 'string') {
            let links = body.cohort_ids.map(d => parseInt(d['key']));
            await this.updateCohortLinks(db, req, processId, links)
        }
        if ('material_ids' in body && typeof body.material_ids != 'string') {
            let links = body.material_ids.filter((e) => {
                return parseInt(e['key']) >= 0
            }).map(d => parseInt(d['key']));
            let insertions = body.material_ids.filter((e) => {
                return parseInt(e['key']) < 0
            }).map(d => {
                return Utility.mysql_real_escape_string(d['value'])
            });
            await this.updateMaterialLinks(db, req, processId, links, insertions)
        }
        if ('keyword_ids' in body && typeof body.keyword_ids != 'string') {
            let links = body.keyword_ids.filter((e) => {
                return parseInt(e['key']) >= 0
            }).map(d => parseInt(d['key']));
            let insertions = body.keyword_ids.filter((e) => {
                return parseInt(e['key']) < 0
            }).map(d => {
                return Utility.mysql_real_escape_string(d['value'])
            });
            await this.updateKeywordLinks(db, req, processId, links, insertions)
        }
    }

    static async getProcesses(db, req) {
        let query = `
        SELECT 
            Process.id,
            Process.Demo as Demo,
            Process.PD as PD,
            Process.Explanation as Explanation,
            Owner.Owner_id as Owner_id,
            Owner.name as Owner_name,
            SPD.id as SPD_id,
            SPD.name as SPD_name,
            SPD.type as SPD_type,
            InfoSrcRef.WP as Workpackage,
            SPD2.id as ITD_id,
            SPD2.name as ITD_name,
            Process_Budget.A as A,
            Process_Budget.B as B,
            Process_Budget.C as C,
            Process_Budget.D as D,
            Process_Budget.REUP as REUP,
            Process_Budget.EoL as EoL,
            Process_Budget.ADS as ADS,
            Process_Budget.ASA as ASA,
            Process_Budget.grossfactor as grossfactor,
            aggs.ci_ids as Cohort_ids,
            aggs.ci_letters as Cohort_letter,
            aggs.mat_ids as Material_ids,
            aggs.mname as Material,
            aggs.kw_ids as Keyword_ids,
            aggs.kws as Keyword_names,
            xls.fileName as ExcelFile
        FROM EDAS_Process as Process
            LEFT JOIN Owner ON Owner.Owner_id=Process.Owner_id
            LEFT JOIN SPD ON SPD.id=Process.SPD_id
            LEFT JOIN InfoSrcRef ON InfoSrcRef.id=Process.id
            LEFT JOIN SPD as SPD2 ON SPD2.id=InfoSrcRef.SPD_id
            LEFT JOIN excelfile as xls ON xls.id = Process.excelfile_id
            INNER JOIN Process_Budget ON Process.id=Process_Budget.id
            LEFT JOIN
            (
            SELECT 
                pr.id p_id,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT ci.id),',') ci_ids,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT ci.letter),',') ci_letters,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT pml.Material_id),',') mat_ids,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT mat.name),',') mname,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT kw.id),',') kw_ids,
                ARRAY_TO_STRING(ARRAY_AGG(DISTINCT kw.keyword),',') kws
            FROM EDAS_Process as pr
                LEFT JOIN Process_Cohort_Inventory_Link pcl ON pcl.Process_id=pr.id
                LEFT JOIN Process_Material_Link pml ON pml.Process_id=pr.id
                LEFT JOIN Material mat ON mat.id=pml.Material_id
                LEFT JOIN Process_Keyword_Link pkl ON pkl.Process_id=pr.id
                LEFT JOIN Cohort_Inventory ci ON pcl.Cohort_Inventory_id=ci.id
                LEFT JOIN Keyword kw ON kw.id=pkl.Keyword_id
            GROUP BY 
                pr.id
            ) aggs on aggs.p_id=Process.id
        `;
        //let queryView = 'SELECT * from process_eco_content';
        let result = await db.query(query, req);
        return result;
    }

    constructor(app, db) {
        let pI = require("./Permissions.js")[0]()

        app.post('/EDASProcess', pI.singlePermissionChecker(
            "rest_visualization_post"))
        app.post('/EDASProcess', async (req, res) => {
            try {
                console.log(req.body)
                let Owner_id = parseInt(req.body.owner_id)
                let Demo = Utility.mysql_real_escape_string(req.body.demo)
                let PD = Utility.mysql_real_escape_string(req.body.pd)
                let Explanation = Utility.mysql_real_escape_string(req.body.explanation)
                let SPD_id = Utility.mysql_real_escape_string(req.body.spd_id)

                let ITD_id = Utility.mysql_real_escape_string(req.body.itd_id)
                let workpackage = Utility.mysql_real_escape_string(req.body.workpackage)

                let A = parseFloat(req.body.a)
                let B = parseFloat(req.body.b)
                let C = parseFloat(req.body.c)
                let D = parseFloat(req.body.d)
                let REUP = parseFloat(req.body.reup)
                let EoL = parseFloat(req.body.eol)
                let ADS = parseFloat(req.body.ads)
                let ASA = parseFloat(req.body.asa)
                let grossfactor = parseFloat(req.body.grossfactor)

                let Excelfile_id = parseInt(req.body.Excelfile_id)

                console.log('start create')
                let processId = await this.createProcess(db, req, Owner_id, Demo, PD, Explanation, SPD_id, ITD_id, workpackage)
                console.log('end create');
                await this.createBudget(db, req, processId, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor)
                await this.updateLinks(db, req, processId, req.body)
                res.send(null)
            }
            catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }

        });

        app.get('/EDASProcess', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/EDASProcess', async (req, res) => {
            try {
                let result = await EDASProcessHandler.getProcesses(db, req);
                res.send(result.rows)
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.put('/EDASProcess/:id', pI.singlePermissionChecker(
            "rest_visualization_put"))
        app.put('/EDASProcess/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let Owner_id = parseInt(req.body.owner_id)
                let Demo = Utility.mysql_real_escape_string(req.body.demo)
                let PD = Utility.mysql_real_escape_string(req.body.pd)
                let Explanation = Utility.mysql_real_escape_string(req.body.explanation)
                let SPD_id = Utility.mysql_real_escape_string(req.body.spd_id)
                let ITD_id = Utility.mysql_real_escape_string(req.body.itd_id)
                let workpackage = Utility.mysql_real_escape_string(req.body.workpackage)
                let A = parseFloat(req.body.a)
                let B = parseFloat(req.body.b)
                let C = parseFloat(req.body.c)
                let D = parseFloat(req.body.d)
                let REUP = parseFloat(req.body.reup)
                let EoL = parseFloat(req.body.eol)
                let ADS = parseFloat(req.body.ads)
                let ASA = parseFloat(req.body.asa)
                let grossfactor = parseFloat(req.body.grossfactor)
                let query = `
                    UPDATE
                        EDAS_Process as Process 
                    SET
                        Owner_id=${Owner_id},
                        Demo='${Demo}',
                        PD='${PD}',
                        Explanation='${Explanation}',
                        SPD_id='${SPD_id}'
                    WHERE
                        Process.id=${id}`
                let infosrcRefUpdate = `
                    UPDATE
                        InfoSrcRef
                    SET
                        WP='${workpackage}',
                        SPD_id='${ITD_id}'
                    WHERE
                        InfoSrcRef.id=${id};
                `
                await this.updateBudget(db, req, id, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor);
                await this.updateLinks(db, req, id, req.body);
                await db.query(infosrcRefUpdate, req);
                await db.query(query, req);
                res.send(null);
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.delete('/EDASProcess/:id', pI.singlePermissionChecker(
            "rest_visualization_delete"))
        app.delete('/EDASProcess/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id)
                let query = `DELETE FROM EDAS_Process WHERE EDAS_Process.id=${id}`
                await db.query(query, req);
                res.send(null)
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })
    }
}

module.exports = EDASProcessHandler;
