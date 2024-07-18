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
var debug = require('debug')('OLCAHandler')
const http = require('http');
const config_file = require("./Config.js");
const { createProxyMiddleware } = require('http-proxy-middleware');
const proxy = createProxyMiddleware;
//var proxy = require('http-proxy-middleware');

class OLCAHandler {
    proxyrule(method, url, permissionChecker) {
        method(url, permissionChecker)
        method(url, async (req, res, next) => {
            try {
                this.proxy(req, res);
            } catch (e) {
                console.log(e);
                debug(e)
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        })
    }

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()

        this.proxy_options = {
            target: 'http://'+config_file.OLCA.ip+":"+config_file.OLCA.port, // target host
            changeOrigin: true, // needed for virtual hosted sites
            ws: false, // proxy websockets
            pathRewrite: {
                '^/olca': '', // rewrite path
            }
        };

        this.proxy = proxy(this.proxy_options)

        /* TODO: some of these proxyrules (exportProcess) need additional permission-
         * checks
        */
        this.proxyrule(app.get.bind(app), '/olca/impact/process', pI.singlePermissionChecker(
            "rest_visualization_get"));

        this.proxyrule(app.get.bind(app), '/olca/impact/cs1', pI.singlePermissionChecker(
            "rest_visualization_get"));

        this.proxyrule(app.get.bind(app), '/olca/impact/exportProcess', pI.singlePermissionChecker(
            "rest_visualization_get"));

        this.proxyrule(app.get.bind(app), '/olca/impact/exportProcesses', pI.singlePermissionChecker(
            "rest_visualization_get"));

        this.proxyrule(app.get.bind(app), '/olca/impact/exportEveryProcess', pI.singlePermissionChecker(
            "rest_visualization_get"));

        this.proxyrule(app.get.bind(app), '/olca/impact/categories', pI.singlePermissionChecker(
            "rest_visualization_get"))

        this.proxyrule(app.get.bind(app), '/olca/impact/calculate', pI.singlePermissionChecker(
            "rest_visualization_get"))

        this.proxyrule(app.post.bind(app), '/olca/import/', pI.singlePermissionChecker(
            "rest_visualization_post"))

        //this.proxyrule(app.post.bind(app), '/olca/import/singletry/', pI.singlePermissionChecker(
        //    "rest_visualization_post"));
        app.post('/olca/import/singletry/', pI.singlePermissionChecker(
            "rest_visualization_post"));
        app.post('/olca/import/singletry/', (req, res) => {
            let options = {
                host: config_file.OLCA.ip,
                port: config_file.OLCA.port,
                method: 'POST',
                path: '/import/singletry/',
                headers: {
                    'Content-Type': 'application/octet-stream',
                    'Content-Disposition': 'attachment; filename="export.zip"',
                    'Content-Length': req.files.file.data.length
                }
            };

            const request = http.request(options, response => {
                res.writeHead(response.statusCode, response.headers);
                response.pipe(res);
            });

            //request.write(req.body);
            request.write(req.files.file.data);
            request.end();

        });
    }
}

module.exports = OLCAHandler;