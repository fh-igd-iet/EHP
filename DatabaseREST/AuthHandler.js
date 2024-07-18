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
const debug = require('debug')('AuthHandler')
const Utility = require('./Utility');
var Pool = require('pg-pool')
var session = require('express-session')
var PGStorage = require('connect-pg-simple')(session)
var uuid = require('uuid/v4')
var config_file = require("./Config.js")

var pool = new Pool(config_file.PG);

class AuthHandler {

    constructor(app, db, config) {
        let pI = require("./Permissions.js")[0]()

        app.use(session({
            name: "EHPRest.session",
            genid: (req) => {
                return uuid()
            },
            store: new PGStorage({
                pool: pool
            }),
            //TODO: change secret!
            secret: "secret",
            cookie: { maxAge: 60000 },
            saveUninitialized: false,
            cookie: {
                path: '/',
                maxAge: 30 * 24 * 60 * 60 * 1000,
                httpOnly: true,
                secure: false
            },
            resave: false
        }))
        app.use(AuthHandler.authenticate)
        //app.use(AuthHandler.authenticate);
        app.get("/checkAuth", (req, res) => {
            let resObj = {
                'userid': req.session.userid,
                'login': req.session.login,
                'permissions': req.session.permissions
            }
            res.write(JSON.stringify(resObj))
            res.send()
        })
        app.get('/logout', (req, res) => {
            req.session.destroy();
            res.sendStatus(200);
        })
        app.post('/Auth', async (req, res) => {
            try {
                let login = Utility.mysql_real_escape_string(req.body.login)
                let password = config.hash(config.salt + req.body.password)
                let query = `
                    SELECT id,login FROM Login WHERE login='${login}' AND password='${password}';
                `;
                console.log(query)
                let result = await db.query(query)
               
                if (result.rows.length == 1) {
                    if (await pI.allowed(result.rows[0]['id'], 'login')) {
                        req.session.logedin = 'logedin';
                        req.session.userid = result.rows[0]['id'];
                        req.session.login = result.rows[0]['login'];
                        req.session.permissions = await pI.getPermissionsById(result.rows[0]['id'])
                        req.session.save(() => {
                            res.write('{"success":"true"}')
                            res.send()
                        });
                    } else {
                        res.sendStatus(401)
                    }

                } else {
                    res.sendStatus(401)
                }
            } catch (e) {
                console.log(e)
                debug(e)
                res.sendStatus(401)
            }
        });



    }

    static authenticate(req, res, next) {
        if (req.path != '/Auth') {
            if (!req.session.logedin) {
                res.sendStatus(401)
            }
            else
                next()
        } else
            next()
    }
}

module.exports = AuthHandler;