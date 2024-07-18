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
class WorkpackageHandler
{
    constructor(app, db)
    {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        app.get('/Workpackage', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/Workpackage', async (req, res)=>{
            try
            {
                let query = `
                    SELECT InfoSrcRef.WP as Workpackage FROM InfoSrcRef GROUP BY InfoSrcRef.WP;
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
    }
}

module.exports = WorkpackageHandler;