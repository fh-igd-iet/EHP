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
var debug = require('debug')('AircraftPartHandler')

class AircraftPartHandler {
    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]();

        app.get('/AircraftPart/flat', pI.singlePermissionChecker('rest_visualization_get'));
        app.get('/AircraftPart/flat', async (req, res) => {
            try {
                let query = `
                SELECT 
					ap.id as id,
                    ap.name as part
                FROM aircraft_part as ap
                ORDER BY part`;
                let result = await db.query(query, req)

                res.send(result.rows);
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/AircraftPart/parts', pI.singlePermissionChecker('rest_visualization_get'));
        app.get('/AircraftPart/parts', async (req, res) => {
            try {
                let query = `
                SELECT 
					ap.id as id,
                    ap.name as part,
                    parent_ap.name as part_parent,
					parent_ap.id as part_parent_id
                FROM aircraft_part as ap
                LEFT JOIN aircraft_part as parent_ap on ap.parent = parent_ap.id
                `;
                let result = await db.query(query, req)
                // generate tree structure
                let namedDict = {}
                let nodes = []
                let roots = []
                for (let row of result.rows) {
                    let node = {
                        name: row['part'],
                        parent: row['part_parent'],
                        parent_id: row['part_parent_id'],
                        id: row['id'],
                        children: []
                    }
                    nodes.push(node)
                    namedDict[row['part']] = node
                    if (row['part_parent'] == null)
                        roots.push(node)
                }
                for (let node of nodes) {
                    if (node.parent != null) {
                        let parentName = node.parent
                        //node.parent = namedDict[parentName]
                        namedDict[parentName].children.push(node)
                    }
                }

                res.send({ name: 'root', children: roots });
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.get('/AircraftPart/technologieCount', pI.singlePermissionChecker('rest_visualization_get'));
        app.get('/AircraftPart/technologieCount', async (req, res) => {
            try {
                let query = `
                SELECT 
                    count(pr.id) as technologie_count,
					first(ap.id) as id,
                    first(ap.name) as part,
                    first(parent_ap.name) as part_parent,
					first(parent_ap.id) as part_parent_id
                FROM aircraft_part as ap
                LEFT JOIN process_aircraft_part_link as l ON l.aircraft_part_id=ap.id
                LEFT JOIN process as pr on pr.id = l.process_id
                LEFT JOIN aircraft_part as parent_ap on ap.parent = parent_ap.id
                GROUP BY ap.id
                `;
                let result = await db.query(query, req)
                // generate tree structure
                let namedDict = {}
                let nodes = []
                let roots = []
                for (let row of result.rows) {
                    let node = {
                        name: row['part'],
                        value: parseInt(row['technologie_count']),
                        parent: row['part_parent'],
                        parent_id: row['part_parent_id'],
                        id: row['id'],
                        children: []
                    }
                    nodes.push(node)
                    namedDict[row['part']] = node
                    if (row['part_parent'] == null)
                        roots.push(node)
                }
                for (let node of nodes) {
                    if (node.parent != null) {
                        let parentName = node.parent
                        //node.parent = namedDict[parentName]
                        namedDict[parentName].children.push(node)
                    }
                }

                res.send({ name: 'root', children: roots });
            } catch (e) {
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = AircraftPartHandler;