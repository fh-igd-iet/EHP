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
var debug = require('debug')('VEESHandler')

class VEESHandler
{
    constructor(app, db)
    {
        let pI = require("./Permissions.js")[0]()

        app.get('/budgetsums/spd', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/budgetsums/spd',async (req, res)=>{
            try
            {
                let result = await db.query(`
                    SELECT 
                        FIRST(pr.SPD_id) as SPD, 
                        SUM(pr.A) as A, 
                        SUM(pr.B) as B, 
                        SUM(pr.C) as C, 
                        SUM(pr.D) as D, 
                        SUM(pr.REUP) as REUP, 
                        SUM(pr.EoL) as EoL, 
                        SUM(pr.ADS) as ADS, 
                        SUM(pr.ASA) as ASA
                    FROM 
                        process_eco_content as pr
                    GROUP BY
                        pr.SPD_id
                    `, req);
                res.send(result.rows);
                
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
        
        app.get('/budgetsums/cohort', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/budgetsums/cohort',async (req, res)=>{
            try
            {
                let result = await db.query(`
                    SELECT 
                        FIRST(Cohort_Inventory.letter) as COHORT, 
                        SUM(pr.A*Process_Cohort_Inventory_Link.proportion) as A, 
                        SUM(pr.B*Process_Cohort_Inventory_Link.proportion) as B, 
                        SUM(pr.C*Process_Cohort_Inventory_Link.proportion) as C, 
                        SUM(pr.D*Process_Cohort_Inventory_Link.proportion) as D, 
                        SUM(pr.REUP*Process_Cohort_Inventory_Link.proportion) as REUP, 
                        SUM(pr.EoL*Process_Cohort_Inventory_Link.proportion) as EoL, 
                        SUM(pr.ADS*Process_Cohort_Inventory_Link.proportion) as ADS, 
                        SUM(pr.ASA*Process_Cohort_Inventory_Link.proportion) as ASA
                    FROM 
                        process_eco_content as pr
                    INNER JOIN 
                        Process_Cohort_Inventory_Link ON pr.id=Process_Cohort_Inventory_Link.Process_id
                    INNER JOIN
                        Cohort_Inventory ON Cohort_Inventory.id=Process_Cohort_Inventory_Link.Cohort_Inventory_id
                    GROUP BY
                        Cohort_Inventory.id
                    `, req);
                res.send(result.rows);
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
        
        app.get('/budgetsums/wp', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/budgetsums/wp',async (req, res)=>{
            try
            {
                let result = await db.query(`
                    SELECT 
                        FIRST(InfoSrcRef.WP) as WP, 
                        SUM(pr.A) as A, 
                        SUM(pr.B) as B, 
                        SUM(pr.C) as C, 
                        SUM(pr.D) as D, 
                        SUM(pr.REUP) as REUP, 
                        SUM(pr.EoL) as EoL, 
                        SUM(pr.ADS) as ADS, 
                        SUM(pr.ASA) as ASA
                    FROM 
                        process_eco_content as pr
                    INNER JOIN 
                        InfoSrcRef ON pr.id=InfoSrcRef.id
                    GROUP BY
                        InfoSrcRef.WP
                    `, req);
                res.send(result.rows);
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
        
        app.get('/budgetsums/owner', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/budgetsums/owner',async (req, res)=>{
            try
            {
                let result = await db.query(`
                    SELECT 
                        FIRST(Owner) as OWNER, 
                        SUM(pr.A) as A, 
                        SUM(pr.B) as B, 
                        SUM(pr.C) as C, 
                        SUM(pr.D) as D, 
                        SUM(pr.REUP) as REUP, 
                        SUM(pr.EoL) as EoL, 
                        SUM(pr.ADS) as ADS, 
                        SUM(pr.ASA) as ASA
                    FROM 
                        process_eco_content as pr
                    GROUP BY
                        pr.Owner
                    `, req);
                res.send(result.rows);
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
        
        app.get('/budgetsums/owner-spd', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/budgetsums/owner-spd',async (req, res)=>{
            try
            {
                let rows = await db.query(`
                    SELECT 
                        first(Owner) as OWNER, 
                        first(pr.SPD_id) as SPD,
                        CONCAT(Owner,',',pr.SPD_id) as cr,
                        SUM(pr.A) as A, 
                        SUM(pr.B) as B, 
                        SUM(pr.C) as C, 
                        SUM(pr.D) as D, 
                        SUM(pr.REUP) as REUP, 
                        SUM(pr.EoL) as EoL, 
                        SUM(pr.ADS) as ADS, 
                        SUM(pr.ASA) as ASA
                    FROM 
                        process_eco_content as pr
                    GROUP BY
                        cr;
                    `, req);
                rows = rows.rows;
				let map = {}
				let owners = new Set()
				let spds = new Set()
				for(let row of rows)
				{
					if(!(row['owner'] in map))
						map[row['owner']] = {}
					let sum = parseFloat(row['a'])+parseFloat(row['b'])+parseFloat(row['c'])+parseFloat(row['d'])+parseFloat(row['reup'])+parseFloat(row['eol'])+parseFloat(row['ads'])+parseFloat(row['asa'])
					map[row['owner']][row['spd']] = sum
					owners.add(row['owner'])
					spds.add(row['spd'])
				}
				let table = []
				for(let spd of spds)
				{
					let row = {'spd':spd}
					for(let owner of owners)
					{
						row[owner] = 0
						if(spd in map[owner])
							row[owner] = map[owner][spd]
					}
					table.push(row)
				}
				res.send(table);
            }
            catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
    }
}

module.exports = VEESHandler;