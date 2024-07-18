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
var debug = require('debug')('ProcessReconstructionHandler')

class ProcessReconstructionHandler
{
    constructor(app, db)
    {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()
        /*
        app.post('/ProcessReconstruction', (req, res)=>{
            let Owner_id = parseInt(req.body.Owner_id)
            let Demo = Utility.mysql_real_escape_string(req.body.Demo)
            let PD = Utility.mysql_real_escape_string(req.body.PD)
            let Explanation = Utility.mysql_real_escape_string(req.body.Explanation)
            let SPD_id = Utility.mysql_real_escape_string(req.body.SPD_id)

            let A = parseFloat(req.body.A)
            let B = parseFloat(req.body.B)
            let C = parseFloat(req.body.C)
            let D = parseFloat(req.body.D)
            let REUP = parseFloat(req.body.REUP)
            let EoL = parseFloat(req.body.EoL)
            let ADS = parseFloat(req.body.ADS)
            let ASA = parseFloat(req.body.ASA)
            let grossfactor = parseFloat(req.body.grossfactor)

            let Excelfile_id = parseInt(req.body.Excelfile_id)
            let query = `
                INSERT INTO Process 
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
                    "${Demo}",
                    "${PD}",
                    "${Explanation}",
                    "${SPD_id}",
                    1
                );
            `
            
            db.run(query,function(result){
                if(result==null)
                {
                    let processId = this.lastID;
                    let query2 = `
                        INSERT INTO Process_Budget
                        (
                            id, A, B, C, D, REUP, EoL, ADS, ASA, grossfactor
                        )
                        VALUES
                        (
                            ${processId}, ${A}, ${B}, ${C}, ${D}, ${REUP}, ${EoL}, ${ADS}, ${ASA}, ${grossfactor} 
                        )
                    `
                    console.log(query2)
                    db.run(query2, (result2)=>{
                        console.log(result2);
                        res.send(result2)
                    })
                }else
                {
                    console.log(result)
                    res.send(result)
                }
                
            })
            
        });
        */
        app.get('/ProcessReconstruction', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/ProcessReconstruction', async (req, res)=>{
            try
            {
                let query = `
                    SELECT 
                        *
                    FROM RekonstruktionView
                `;
                let result = await db.query(query, req)
                res.send(result.rows)
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
        /*
        app.put('/Process/:id', (req, res)=>{
            let id = parseInt(req.params.id)
            let Owner_id = parseInt(req.body.Owner_id)
            let Demo = Utility.mysql_real_escape_string(req.body.Demo)
            let PD = Utility.mysql_real_escape_string(req.body.PD)
            let Explanation = Utility.mysql_real_escape_string(req.body.Explanation)
            let SPD_id = Utility.mysql_real_escape_string(req.body.SPD_id)
            let query = `
                UPDATE
                    Process
                SET
                    Owner_id=${Owner_id},
                    Demo="${Demo}",
                    PD="${PD}",
                    Explanation="${Explanation}",
                    SPD_id="${SPD_id}"
                WHERE
                    Process.id==${id}`
            console.log(query);
            db.run(query,function(result){
                res.send(result);
            });
        });

        app.delete('/Process/:id', (req, res)=>{
            let id = parseInt(req.params.id)
            let query = `
                DELETE FROM
                    Process
                WHERE
                    Process.id==${id}`
            console.log(query);
            db.run(query,function(result){
                res.send(result);
            });
        })
        */
    }
}

module.exports = ProcessReconstructionHandler;