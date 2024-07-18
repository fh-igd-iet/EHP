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
var [getPermissionsInstance, PermissionsHandler, initializePermissions] =
	require("./Permissions.js");
const fs = require('fs');
var ProcessReconstructionHandler = require('./ProcessReconstructionHandler.js');
var EDASProcessHandler = require('./EDASProcessHandler.js');
var VEESHandler = require('./VEESHandler.js');
var OwnerHandler = require('./OwnerHandler.js');
var SPDHandler = require('./SPDHandler.js');
var KeywordHandler = require('./KeywordHandler.js');
var MaterialHandler = require('./MaterialHandler.js');
var CohortHandler = require('./CohortHandler.js');
var WorkpackageHander = require('./WorkpackageHandler.js');
var AircraftPartHandler = require('./AircraftPartHandler.js');
var ProcessHandler = require('./ProcessHandler.js');
var OLCAProcessHandler = require('./OLCAProcessHandler.js');
var ComponentHandler = require('./ComponentHandler.js');
var ActivityHandler = require('./ActivityHandler.js');
var AuthHandler = require('./AuthHandler.js');
var UserHandler = require('./UserHandler.js');
var RoleHandler = require('./RoleHandler.js');
var ImageHandler = require('./ImageHandler');
var OLCAHandler = require('./OLCAHandler');
var Utility = require('./Utility.js')
var express = require('express');
var fileUpload = require('express-fileupload');
var cors = require('cors');
var { Client } = require('pg');
var http = require("http");
var bodyparser = require("body-parser")
var config_file = require("./Config.js")

console.log(config_file);
var app = express()
var config = config_file.APP;
config.hash = Utility.hash;
const client = new Client(config_file.PG)


client.connect((err) => {
	if (err) {
		console.error('connection error', err.stack)
	} else {
		console.log('connected')
	}
})


app.use(fileUpload({
	limits: { fileSize: 50 * 1024 * 1024 },
}));

let clientProxy =
{
	query: async function (query, req) {
		let prequery = ""
		if (req.session && req.session.userid) {
			prequery = "SET application_name= \"" + req.session.userid + "\";";
		}
		let result = await client.query(prequery + query);
		// is result an array?
		if (Array.isArray(result)) {
			if (result.length > 2)
				return result.slice(1, result.length);
			if (result.length == 2)
				return result[1];
			else
				return null;
		}
		return result;
	}
}

var update_all_lcia_results = false
process.argv.forEach((val, index) => {
	if(val == "update_all_lcia_results")
		update_all_lcia_results = true
});


app.use(cors({ credentials: true }))
app.use(express.json({ limit: '200mb' }))
initializePermissions(client)
new AuthHandler(app, client, config);
new PermissionsHandler(app, client);
new UserHandler(app, clientProxy, config);
new RoleHandler(app, clientProxy);
new VEESHandler(app, clientProxy);
new EDASProcessHandler(app, clientProxy);
new ProcessReconstructionHandler(app, clientProxy);
new OwnerHandler(app, clientProxy);
new SPDHandler(app, clientProxy);
new KeywordHandler(app, clientProxy);
new MaterialHandler(app, clientProxy);
new CohortHandler(app, clientProxy);
new WorkpackageHander(app, clientProxy);
new AircraftPartHandler(app, clientProxy);
new ActivityHandler(app, clientProxy);
new ProcessHandler(app, clientProxy);
let cs1Handler = new OLCAProcessHandler(app, clientProxy);
new ComponentHandler(app, clientProxy);
new ImageHandler(app, clientProxy);
new OLCAHandler(app, clientProxy);

// link CS1-Processes in LCA-Database to PostgresDb
// TODO this should be removed in the future 
async function linkCS1() {
	let rawdata = fs.readFileSync('cs1ProcessOwnerConfidentiality.json');
	let cs1Mapping = JSON.parse(rawdata);
	//let ps = [2018245, 2020308, 2022371, 2024454, 2026540, 2028604, 2030672, 2032696, 2038760, 2016222]
	//ps.forEach(async function (p) { await cs1Handler.updateLCIAResults(clientProxy, {}, p) })

	const query = `
		SELECT 
			olca_id
		FROM OLCAProcess as p
	`;
	let result = await clientProxy.query(query, {})
	result = new Set(result.rows.map(e => parseInt(e.olca_id)))
	let options = {
		host: config_file.OLCA.ip,
		port: config_file.OLCA.port,
		path: '/impact/cs1',
		method: 'GET'
	};
	console.log("updating confidentiality, synchronising postgres and OpenLCA...")
	console.log("please be patient...")
	http.request(options, res => {
		let data = '';
		res.setEncoding('utf8');
		res.on('data', (chunk) => {
			data += chunk
		});
		res.on('end', async () => {
			let j = JSON.parse(data);
			
			if ('processList' in j) {
				for (let i = 0; i < j.processList.length; i++) {
					let process = j.processList[i]
					if (!result.has(process.intern_id)) {
						let confidentiality = "COA, confidential"
						let owner_id = 1
						if (process.id in cs1Mapping) {
							let owner = cs1Mapping[process.id]['Owner']
							let conf = cs1Mapping[process.id]['Confidential']
							if (owner != null) {
								let ownerID = await OwnerHandler.getOwnerID(clientProxy, {}, owner)
								if (ownerID === null) {
									owner_id = await OwnerHandler.createOwner(clientProxy, {}, owner)
								} else {
									owner_id = ownerID
								}
							}
							if (conf === 0) confidentiality = "COA, non-confidential";
							else if (conf === 1) confidentiality = "COA, non-confidential";
						}
						await cs1Handler.create(clientProxy, {}, process.intern_id, process.name, confidentiality, owner_id)	
					}
					if(!process.cs1 && (update_all_lcia_results || !result.has(process.intern_id)))
					{
						console.log("calculating lcia results of process: ")
						console.log(process.id)
						console.log(process.name)
						await cs1Handler.updateLCIAResults(clientProxy, {}, process.intern_id, process.reference_unit, parseFloat(process.reference));
					}
				}
			}
			console.log("synchronization finished")
		});

	}).end()
}
linkCS1();

const PORT = config_file.APP.port
app.listen(PORT, () => console.log(`REST server backend (postgres,express) is running on port ${PORT}`))
