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
var debug = require('debug')('ImageHandler')
var imageType = require('image-type');

class ImageHandler {

    constructor(app, db) {
        let Utility = require("./Utility.js");
        let pI = require("./Permissions.js")[0]()
		
		this.validImages = new Set(["png", "jpg", "jpeg", "gif", "tiff"]);

        app.get('/Image/:id', pI.singlePermissionChecker(
            "rest_visualization_get"))
        app.get('/Image/:id', async (req, res) => {
            try {
                let id = parseInt(req.params.id);
                let query = `SELECT * from Image WHERE id=${id}`;
                let r = await db.query(query, req);
                if (r && r.rows && r.rows.length == 1) {
                    res.writeHead(200,
                        [
                            ['Content-Type', r.rows[0].mime],
                            ['Cache-Control', 'public']
                        ]);
                    res.end(r.rows[0].data);
                    //res.end(new Buffer(buffer, 'base64'));
                } else {
                    res.sendStatus(404);
                }
            } catch (e) {
                debug(e)
                console.log(e);
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });

        app.post('/Image/upload', pI.singlePermissionChecker(
            "rest_visualization_post"))
        app.post('/Image/upload', async (req, res) => {
            try {
                if (req.files && req.files.file) {
                    let t = imageType(req.files.file.data);
                    console.log(t);
                    if (t && this.validImages.has(t.ext)) {
                        let imageData = '\\x' + req.files.file.data.toString('hex');
                        let name = Utility.mysql_real_escape_string(req.files.file.name);
                        let query = `
                            INSERT INTO Image 
                            (
                                name, 
                                data,
                                mime
                            )
                            VALUES
                            (
                                '${name}',
                                '${imageData}',
                                '${t.mime}'
                            ) RETURNING id;
                        `;
                        let rp = await db.query(query, req);
                        res.send({ image_id: rp.rows[0].id });
                    } else {
                        throw "wrong image format"
                    }
                } else {
                    throw "wrong request format"
                }


            } catch (e) {
                debug(e)
                console.log(e);
                res.send(
                    { error: 'Unknown Error' }
                )
            }
        });
    }
}

module.exports = ImageHandler;