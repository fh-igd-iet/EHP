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

class CohortHandler
{
    constructor(app, db)
    {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        app.get('/Cohort', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/Cohort', async (req, res)=>{
            try
            {
                const query = `
                    SELECT * FROM Cohort_Inventory;
                `;
                const result = await db.query(query, req)
                res.send(result.rows)
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });

        app.get('/CohortDemonstrators', pI.singlePermissionChecker("rest_visualization_get"))
        app.get('/CohortDemonstrators', async (req, res)=>{
            try
            {
                const query = `
                SELECT DISTINCT ON (comp.id)
                    coh.id as cohort_id,
                    coh.letter as cohort_letter,
                    coh.description as cohort_description,
                    comp.id as demo_id,
                    comp.demo_nr as demo_nr,
                    comp.code as code,
                    comp.name as name,
                    comp.spd_id as spd_id,
                    spd.name as spd_name,
                    comp.image_id as image_id
                FROM cohort_inventory as coh
                LEFT JOIN activitie_component_link as alink on coh.id = alink.cohort_inventory_id
                LEFT JOIN component as comp ON alink.component_id = comp.id and comp.is_demo
                LEFT JOIN spd on comp.spd_id=spd.id
                ORDER BY demo_id ASC
                `;
                const result = await db.query(query, req)
                let aggregated = []
                let currID = -1
                result.rows.sort((a,b) => Number(a['cohort_id']) - Number(b['cohort_id']))
                for (let row of result.rows) {
                    if(currID != Number(row['cohort_id'])){
                        currID = Number(row['cohort_id'])
                        aggregated.push({
                            cohort_id: currID,
                            custom_id: row['cohort_letter'],
                            name: row['cohort_description'],
                            children: []
                        })
                    }
                    if(row['demo_id'] != null) {
                        let cohort = aggregated[aggregated.length-1]
                        cohort.children.push({
                            demo_id: row['demo_id'],
                            custom_id: row['demo_nr'],
                            code: row['code'],
                            name: row['name'],
                            spd_id: row['spd_id'],
                            spd_name: row['spd_name'],
                            image_id: row['image_id'],
                        })
                    }
                }
                res.send(aggregated)
            }catch(e)
            {
                debug(e)
                res.send(
                    {error:'Unknown Error'}
                )
            }
        });
    }
}

module.exports = CohortHandler;
