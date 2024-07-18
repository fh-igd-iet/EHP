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
let OwnerHandler = require("./OwnerHandler.js");
var debug = require('debug')('ActivityHandler')
var EDASProcessHandler = require('./EDASProcessHandler.js');

cs1Data = [
  {
    ecoTheme: 'A',
    value: 0
  },
  {
    ecoTheme: 'B',
    value: 43
  },
  {
    ecoTheme: 'C',
    value: 29
  },
  {
    ecoTheme: 'D',
    value: 26
  },
  {
    ecoTheme: 'REUP',
    value: 1
  },
  {
    ecoTheme: 'EoL',
    value: 16
  },
  {
    ecoTheme: 'ADS',
    value: 1
  },
  {
    ecoTheme: 'ASA',
    value: 1
  }
];

class ActivityHandler {
  static async getOwnedActivitieIds(db, req) {
    let ret = new Set()
    let query = `
    SELECT 
      id,
      ow.name as name
    FROM Activitie
    LEFT JOIN OWNER as ow
      ON ow.owner_id=Activitie.owner_id;
    `;
    let rows = await db.query(query, req);
    rows = await pI.filterEntityByEditableOwner(req.session.userid, rows.rows, r => r.name);
    rows.forEach(r => ret.add(r.id))
    return Array.from(ret);
  }

  async isActivitieLinked(db, req, id)
  {
    let query_component = `
      SELECT count(*) FROM activitie_component_link where activitie_id=${parseInt(id)}
    `
    let query_technologies = `
      SELECT count(*) FROM process where activitie_id=${parseInt(id)}
    `
    let comp_res = await db.query(query_component, req)
    let count_comp = parseInt(comp_res.rows[0]['count'])
    if(count_comp > 0)
      return true;

    let tech_res = await db.query(query_technologies, req)
    let count_tech = parseInt(tech_res.rows[0]['count'])
      if(count_tech > 0)
        return true;
    
    return false
  }

  async createActivity(db, req, extern_id, title, owner_id,
    validation_by, lci_analyst, env_improvement,
    ecolonomic_motivation, composites, additive_manufacturing,
    machining, hazards_reg_substances, recycling,
    digital_materials, water, struct_health_monitoring,
    storage_supply_transmission_material, storage_supply_transmission_electrical,
    socio_economic, comment, spd_id, aircraft_part_id) {
    let query = `
        INSERT INTO Activitie
        (
          extern_id, title, owner_id,
          validation_by, lci_analyst, env_improvement,
          ecolonomic_motivation, composites, additive_manufacturing,
          machining, hazards_reg_substances, recycling,
          digital_materials, water, struct_health_monitoring,
          storage_supply_transmission_material, storage_supply_transmission_electrical,
          socio_economic, comment, spd_id, aircraft_part_id
        )
        VALUES
        (
          '${extern_id}', '${title}', '${owner_id}', 
          '${validation_by}', '${lci_analyst}', '${env_improvement}',
          '${ecolonomic_motivation}', ${composites}, ${additive_manufacturing},
          ${machining}, ${hazards_reg_substances}, ${recycling},
          ${digital_materials}, ${water}, ${struct_health_monitoring},
          ${storage_supply_transmission_material}, ${storage_supply_transmission_electrical},
          ${socio_economic}, '${comment}', '${spd_id}', '${aircraft_part_id}'
        ) RETURNING id;
    `
    console.log(query);
    let result = await db.query(query, req);
    let processId = result.rows[0]['id'];

    return processId;
  }

  async updateActivity(db, req, id, extern_id, title, owner_id,
    validation_by, lci_analyst, env_improvement,
    ecolonomic_motivation, composites, additive_manufacturing,
    machining, hazards_reg_substances, recycling,
    digital_materials, water, struct_health_monitoring,
    storage_supply_transmission_material, storage_supply_transmission_electrical,
    socio_economic, comment, spd_id, aircraft_part_id) {
    let query = `
        UPDATE Activitie
        SET
          extern_id='${extern_id}',
          title='${title}',
          owner_id=${owner_id},
          validation_by='${validation_by}',
          lci_analyst='${lci_analyst}',
          env_improvement='${env_improvement}',
          ecolonomic_motivation='${ecolonomic_motivation}',
          composites=${composites},
          additive_manufacturing=${additive_manufacturing},
          machining=${machining},
          hazards_reg_substances=${hazards_reg_substances},
          recycling=${recycling},
          digital_materials=${digital_materials},
          water=${water},
          struct_health_monitoring=${struct_health_monitoring},
          storage_supply_transmission_material=${storage_supply_transmission_material},
          storage_supply_transmission_electrical=${storage_supply_transmission_electrical},
          socio_economic=${socio_economic},
          comment='${comment}',
          spd_id='${spd_id}',
          aircraft_part_id='${aircraft_part_id}'
        WHERE
          id =${id};
    `
    console.log(query);
    let result = await db.query(query, req);
    return;
  }

  async updateCompLinks(db, req, Activity_id, links, cohort_id) {
    let query1 = `DELETE FROM Activitie_Component_Link WHERE Activitie_id=${Activity_id} AND Cohort_Inventory_id=${cohort_id}`
    let query2 = `INSERT INTO Activitie_Component_Link
                    (Activitie_id, Component_id, Cohort_Inventory_id)
                VALUES `;
    let i = 0;
    for (let link of links) {
      let component = link
      query2 += `(${Activity_id}, ${component}, ${cohort_id})`
      if (i != links.length - 1)
        query2 += ","
      i++;
    }
    query2 += ';'
    console.log(links)
    await db.query(query1, req)
    if (links.length > 0)
      await db.query(query2, req)
  }

  async updateTechLinks(db, req, Activity_id, links) {
    let query = `
      UPDATE process
      SET activitie_id = null
      WHERE activitie_id=${Activity_id};

    `
    if (links.length) {
      query += `
        UPDATE Process
        SET activitie_id=${Activity_id}
        WHERE
      `
      for (let i = 0; i < links.length; i++) {
        let link = links[i]
        query += `id=${link} OR parent_id=${link} `
        if (i + 1 < links.length)
          query += 'OR '
        else
          query += ';'
      }
    }
    console.log(query);
    await db.query(query, req)
  }

  async updateLinks(db, req, Activity_id, body) {
    let mapfn = d => {
      if (typeof d == 'number')
        return d
      return parseInt(d['key'])
    }
    if ('components_a' in body && typeof body.components_a != 'string') {
      console.log(body.components_a)
      let links = body.components_a.map(mapfn);
      console.log(links)
      await this.updateCompLinks(db, req, Activity_id, links, 1)
    }
    if ('components_b' in body && typeof body.components_b != 'string') {
      let links = body.components_b.map(mapfn);
      await this.updateCompLinks(db, req, Activity_id, links, 2)
    }
    if ('components_c' in body && typeof body.components_c != 'string') {
      let links = body.components_c.map(mapfn);
      await this.updateCompLinks(db, req, Activity_id, links, 3)
    }
    if ('components_d' in body && typeof body.components_d != 'string') {
      let links = body.components_d.map(mapfn);
      await this.updateCompLinks(db, req, Activity_id, links, 4)
    }
    if ('components_e' in body && typeof body.components_e != 'string') {
      let links = body.components_e.map(mapfn);
      await this.updateCompLinks(db, req, Activity_id, links, 5)
    }
    if ('technology_ids' in body && typeof body.technology_ids != 'string') {
      let links = body.technology_ids.map(mapfn);
      await this.updateTechLinks(db, req, Activity_id, links)
    }
  }

  constructor(app, db) {
    let ProcessHandler = require("./ProcessHandler.js");
    let pI = require("./Permissions.js")[0]();

    app.get('/Activity/ecoThemes', pI.singlePermissionChecker('rest_visualization_get'));
    app.get('/Activity/ecoThemes', async (req, res) => {
      try {
        let query = `
                select 'A' as ecotheme, COUNT(id) from process_budget where a > 0
                union
                select 'B' as ecotheme, COUNT(id) from process_budget where b > 0
                union
                select 'C' as ecotheme, COUNT(id) from process_budget where c > 0
                union
                select 'D' as ecotheme, COUNT(id) from process_budget where d > 0
                union
                select 'REUP' as ecotheme, COUNT(id) from process_budget where reup > 0
                union
                select 'EoL' as ecotheme, COUNT(id) from process_budget where eol > 0
                union
                select 'ADS' as ecotheme, COUNT(id) from process_budget where ads > 0
                union
                select 'ASA' as ecotheme, COUNT(id) from process_budget where asa > 0
                `;
        let cs2Data = await db.query(query, req)
        // generate tree structure
        let activities = []
        if (cs2Data.rowCount == cs1Data.length) {
          //console.log("equal lengths");
          for (let i in cs1Data) {
            let row = cs2Data.rows.find((x) => x['ecotheme'] == cs1Data[i].ecoTheme)
            let activity = {
              ecoTheme: cs1Data[i].ecoTheme,
              cs1Activities: cs1Data[i].value,
              cs2Activities: Number(row['count'])
            }
            activities.push(activity)
          }
        }
        else {
          //console.log("unequal lengths");
          for (let row of cs2Data.rows) {
            let activity = {
              ecoTheme: row['ecotheme'],
              cs1Activities: 0,
              cs2Activities: row['count']
            }
            activities.push(activity)
          }
        }
        res.send(activities);
      } catch (e) {
        debug(e)
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });

    app.get('/Activity/ecoThemesDetailed', pI.singlePermissionChecker('rest_visualization_get'));
    app.get('/Activity/ecoThemesDetailed', async (req, res) => {
      try {
        let cs2Data = await EDASProcessHandler.getProcesses(db, req);
        console.log("CS2 DATA");
        console.log(cs2Data);
        // generate tree structure
        let activities = []
        for (let cs1 of cs1Data) {
          let cs2Activities = cs2Data.rows.filter((x) => x[cs1.ecoTheme.toLowerCase()] > 0);
          let cs2ActivitiesCFP = cs2Activities.filter((x) => {
            if (typeof x['excelfile'] == 'string')
              return x['excelfile'].toString().toLowerCase().includes("cfp")
            return false
          });
          let activitiesPerEcoTheme = {
            ecoTheme: cs1.ecoTheme,
            cs1Activities: cs1.value,
            cs2ActivitiesCFP: cs2ActivitiesCFP.length,
            cs2ActivitiesGAM: cs2Activities.length - cs2ActivitiesCFP.length
          };
          activities.push(activitiesPerEcoTheme);
        }
        res.send(activities);
      } catch (e) {
        debug(e);
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });

    app.post('/Activity', pI.singlePermissionChecker(
      "rest_visualization_post"))
    app.post('/Activity', async (req, res) => {
      try {
        let esc = Utility.mysql_real_escape_string
        let toFl = d => {
          return d == "" ? 0 : parseFloat(d) / 3.0
        }
        let extern_id = esc(req.body.extern_id)
        let title = esc(req.body.title)
        let owner_id = parseInt(req.body.owner_id)
        let validation_by = esc(req.body.validation_by)
        let lci_analyst = esc(req.body.lci_analyst)
        let env_improvement = esc(req.body.env_improvement)
        let ecolonomic_motivation = esc(req.body.ecolonomic_motivation)
        let composites = toFl(req.body.composites)
        let additive_manufacturing = toFl(req.body.additive_manufacturing)
        let machining = toFl(req.body.machining)
        let hazards_reg_substances = toFl(req.body.hazards_reg_substances)
        let recycling = toFl(req.body.recycling)
        let digital_materials = toFl(req.body.digital_materials)
        let water = toFl(req.body.water)
        let struct_health_monitoring = toFl(req.body.struct_health_monitoring)
        let storage_supply_transmission_material = toFl(req.body.storage_supply_transmission_material)
        let storage_supply_transmission_electrical = toFl(req.body.storage_supply_transmission_electrical)
        let socio_economic = toFl(req.body.socio_economic)
        let comment = esc(req.body.comment)
        let spd_id = esc(req.body.spd_id)
        let aircraft_part_id = esc(req.body.aircraft_part_id)

        if (!await OwnerHandler.isOwnerIDAllowed(db, req, owner_id)) {
          res.send(401)
          return;
        }

        let activity_id = await this.createActivity(db, req, extern_id, title, owner_id,
          validation_by, lci_analyst, env_improvement,
          ecolonomic_motivation, composites, additive_manufacturing,
          machining, hazards_reg_substances, recycling,
          digital_materials, water, struct_health_monitoring,
          storage_supply_transmission_material, storage_supply_transmission_electrical,
          socio_economic, comment, spd_id, aircraft_part_id)
        await this.updateLinks(db, req, activity_id, req.body);
        res.send(null)
      }
      catch (e) {
        console.log(e);
        debug(e)
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });

    app.put('/Activity/:id', pI.editEntityPermissionChecker(
      id => `
        SELECT Owner.name from Activitie 
        LEFT JOIN OWNER ON 
          Owner.owner_id=Activitie.owner_id
        WHERE Activitie.id=${id}
      `,
      req => parseInt(req.params.id)
    ))
    app.put('/Activity/:id', pI.singlePermissionChecker(
      "rest_visualization_put"))
    app.put('/Activity/:id', async (req, res) => {
      try {
        let id = parseInt(req.params.id)
        let esc = Utility.mysql_real_escape_string
        let toFl = d => {
          return d == "" ? 0 : parseFloat(d) / 3.0
        }

        let extern_id = esc(req.body.extern_id)
        let title = esc(req.body.title)
        let owner_id = parseInt(req.body.owner_id)
        let validation_by = esc(req.body.validation_by)
        let lci_analyst = esc(req.body.lci_analyst)
        let env_improvement = esc(req.body.env_improvement)
        let ecolonomic_motivation = esc(req.body.ecolonomic_motivation)

        let composites = toFl(req.body.composites)
        let additive_manufacturing = toFl(req.body.additive_manufacturing)
        let machining = toFl(req.body.machining)
        let hazards_reg_substances = toFl(req.body.hazards_reg_substances)
        let recycling = toFl(req.body.recycling)
        let digital_materials = toFl(req.body.digital_materials)
        let water = toFl(req.body.water)
        let struct_health_monitoring = toFl(req.body.struct_health_monitoring)
        let storage_supply_transmission_material = toFl(req.body.storage_supply_transmission_material)
        let storage_supply_transmission_electrical = toFl(req.body.storage_supply_transmission_electrical)
        let socio_economic = toFl(req.body.socio_economic)
        let comment = esc(req.body.comment)
        let spd_id = esc(req.body.spd_id)
        let aircraft_part_id = esc(req.body.aircraft_part_id)

        if (!await OwnerHandler.isOwnerIDAllowed(db, req, owner_id)) {
          res.send(401)
          return;
        }

        await this.updateActivity(db, req, id, extern_id, title, owner_id,
          validation_by, lci_analyst, env_improvement,
          ecolonomic_motivation, composites, additive_manufacturing,
          machining, hazards_reg_substances, recycling,
          digital_materials, water, struct_health_monitoring,
          storage_supply_transmission_material, storage_supply_transmission_electrical,
          socio_economic, comment, spd_id, aircraft_part_id)

        await this.updateLinks(db, req, id, req.body);
        //await db.query(infosrcRefUpdate);
        //await db.query(query);
        res.send(null);
      } catch (e) {
        console.log(e)
        debug(e)
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });


    app.delete('/Activity/:id', pI.deleteEntityPermissionChecker(
      id => `
        SELECT Owner.name from Activitie 
        LEFT JOIN OWNER ON 
          Owner.owner_id=Activitie.owner_id
        WHERE Activitie.id=${id}
      `,
      req => parseInt(req.params.id)
    ))
    app.delete('/Activity/:id', pI.singlePermissionChecker(
      "rest_visualization_delete"))
    app.delete('/Activity/:id', async (req, res) => {
      try {
        let id = parseInt(req.params.id)
        
        if(await this.isActivitieLinked(db,req,id))
        {
          res.send({error: "Activity is linked."})
          return
        }
        let query = `DELETE FROM Activitie WHERE id=${id}`
        await db.query(query, req);

        res.send(null);
      } catch (e) {
        console.log(e)
        debug(e)
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });


    app.get('/Activity', pI.singlePermissionChecker('rest_visualization_get'));
    app.get('/Activity', async (req, res) => {
      try {
        let query = `
        SELECT 
          id,
          extern_id,
          ow.owner_id as owner_id,
          ow.name as owner_name,
          title,
          validation_by,
          lci_analyst,
          env_improvement,
          ecolonomic_motivation,
          composites,
          additive_manufacturing,
          machining,
          hazards_reg_substances,
          recycling,
          digital_materials,
          water,
          struct_health_monitoring,
          storage_supply_transmission_material,
          storage_supply_transmission_electrical,
          socio_economic,
          comment,
          SPD_id,
          Aircraft_Part_id
        FROM Activitie
        LEFT JOIN OWNER as ow
          ON ow.owner_id=Activitie.owner_id;
				`;
        let cs2Data = await db.query(query, req);
        let rows = await pI.filterEntityByEditableOwner(req.session.userid, cs2Data.rows, r => r.owner_name);
        res.send(rows);
      } catch (e) {
        debug(e);
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });


    app.get('/Activity/modelview', pI.singlePermissionChecker('rest_visualization_get'));
    app.get('/Activity/modelview', async (req, res) => {
      try {
        let query = `
        SELECT 
          first(act.id) as activity_id,
          first(act.extern_id) as activity_extern_id,
          first(act.title) as activity_title,
          first(act.spd_id),
          first(act.aircraft_part_id),
          first(ow.owner_id) as owner_id,
          first(ow.name) as owner_name,
          json_agg(cmp.code) as component_code,
          json_agg(cmp.demo_nr) as component_demo,
          json_agg(cmp.name) as component_name,
          json_agg(cmp.is_demo) as component_isdemo
        FROM activitie as act
        LEFT JOIN 
          Owner AS ow ON ow.owner_id=act.owner_id
        LEFT JOIN
          activitie_component_link AS acl ON acl.activitie_id=act.id 
        LEFT JOIN
          component as cmp ON cmp.id=acl.component_id
        GROUP BY 
          act.id
				`;
        let cs2Data = await db.query(query, req);
        let rows = cs2Data.rows;
        res.send(rows);
      } catch (e) {
        debug(e);
        res.send(
          { error: 'Unknown Error'}
        )
      }
    });




    app.get('/Activity/tableview', pI.singlePermissionChecker('rest_visualization_get'));
    app.get('/Activity/tableview', async (req, res) => {
      try {
        let query = `
				SELECT 
          first(pre_tech.id) as id,
          first(pre_tech.extern_id) as extern_id,
          first(pre_tech.title) as title,
          first(pre_tech.owner_id) as owner_id,
          first(pre_tech.owner_name) as owner_name,
          first(pre_tech.validation_by) as validation_by,
          first(pre_tech.lci_analyst) as lci_analyst,
          first(pre_tech.env_improvement) as env_improvement,
          first(pre_tech.ecolonomic_motivation) as ecolonomic_motivation,
          first(pre_tech.composites) as composites,
          first(pre_tech.additive_manufacturing) as additive_manufacturing,
          first(pre_tech.machining) as machining,
          first(pre_tech.hazards_reg_substances) as hazards_reg_substances,
          first(pre_tech.recycling) as recycling,
          first(pre_tech.digital_materials) as digital_materials,
          first(pre_tech.water) as water,
          first(pre_tech.struct_health_monitoring) as struct_health_monitoring,
          first(pre_tech.storage_supply_transmission_material) as storage_supply_transmission_material,
          first(pre_tech.storage_supply_transmission_electrical) as storage_supply_transmission_electrical,
          first(pre_tech.socio_economic) as socio_economic,
          first(pre_tech.comment) as comment,
          first(pre_tech.spd_id) as spd_id,
          first(pre_tech.spd_name) as spd_name,
          first(pre_tech.aircraft_part_id) as aircraft_part_id,
          first(pre_tech.aircraft_part_name) as aircraft_part_name,
          first(pre_tech.comp_id_a) as comp_id_a,
          first(pre_tech.comp_name_a) as comp_name_a,
          first(pre_tech.comp_code_a) as comp_code_a,
          first(pre_tech.comp_id_b) as comp_id_b,
          first(pre_tech.comp_name_b) as comp_name_b,
          first(pre_tech.comp_code_b) as comp_code_b,
          first(pre_tech.comp_id_c) as comp_id_c,
          first(pre_tech.comp_name_c) as comp_name_c,
          first(pre_tech.comp_code_c) as comp_code_c,
          first(pre_tech.comp_id_d) as comp_id_d,
          first(pre_tech.comp_name_d) as comp_name_d,
          first(pre_tech.comp_code_d) as comp_code_d,
          first(pre_tech.comp_id_e) as comp_id_e,
          first(pre_tech.comp_name_e) as comp_name_e,
          first(pre_tech.comp_code_e) as comp_code_e,
          array_to_json(array_agg(tech.id)) as technology_ids,
          array_to_json(array_agg(tech.extern_id)) as technology_extern_ids,
          array_to_json(array_agg(tech.name)) as technology_names,
          array_to_json(array_agg(tech.spd_id)) as technology_spds,
          array_to_json(array_agg(tech.parent_id)) as technology_parents
        FROM
          (SELECT 
            first(act.id) as id,
            first(act.extern_id) as extern_id,
            first(act.title) as title,
            first(act.owner_id) as owner_id,
            first(ow.name) as owner_name,
            first(act.validation_by) as validation_by,
            first(act.lci_analyst) as lci_analyst,
            first(act.env_improvement) as env_improvement,
            first(act.ecolonomic_motivation) as ecolonomic_motivation,
            first(act.composites) as composites,
            first(act.additive_manufacturing) as additive_manufacturing,
            first(act.machining) as machining,
            first(act.hazards_reg_substances) as hazards_reg_substances,
            first(act.recycling) as recycling,
            first(act.digital_materials) as digital_materials,
            first(act.water) as water,
            first(act.struct_health_monitoring) as struct_health_monitoring,
            first(act.socio_economic) as socio_economic,
            first(act.storage_supply_transmission_material) as storage_supply_transmission_material,
            first(act.storage_supply_transmission_electrical) as storage_supply_transmission_electrical,
            first(act.comment) as comment,
            first(act.spd_id) as spd_id,
            first(spd.name) as spd_name,
            first(act.aircraft_part_id) as aircraft_part_id,
            first(ap.name) as aircraft_part_name,
            public.demo_cohort_select_a(acl.cohort_inventory_id, cmp.id) as comp_id_a,
            public.demo_cohort_select_a(acl.cohort_inventory_id, cmp.name) as comp_name_a,
            public.demo_cohort_select_a(acl.cohort_inventory_id, cmp.code) as comp_code_a,
            public.demo_cohort_select_b(acl.cohort_inventory_id, cmp.id) as comp_id_b,
            public.demo_cohort_select_b(acl.cohort_inventory_id, cmp.name) as comp_name_b,
            public.demo_cohort_select_b(acl.cohort_inventory_id, cmp.code) as comp_code_b,
            public.demo_cohort_select_c(acl.cohort_inventory_id, cmp.id) as comp_id_c,
            public.demo_cohort_select_c(acl.cohort_inventory_id, cmp.name) as comp_name_c,
            public.demo_cohort_select_c(acl.cohort_inventory_id, cmp.code) as comp_code_c,
            public.demo_cohort_select_d(acl.cohort_inventory_id, cmp.id) as comp_id_d,
            public.demo_cohort_select_d(acl.cohort_inventory_id, cmp.name) as comp_name_d,
            public.demo_cohort_select_d(acl.cohort_inventory_id, cmp.code) as comp_code_d,
            public.demo_cohort_select_e(acl.cohort_inventory_id, cmp.id) as comp_id_e,
            public.demo_cohort_select_e(acl.cohort_inventory_id, cmp.name) as comp_name_e,
            public.demo_cohort_select_e(acl.cohort_inventory_id, cmp.code) as comp_code_e
          FROM activitie as act
          LEFT JOIN Owner AS ow 
            ON ow.owner_id=act.owner_id
          LEFT JOIN
            activitie_component_link AS acl 
            ON acl.activitie_id = act.id 
          LEFT JOIN
            spd ON spd.id=act.spd_id
          LEFT JOIN
            aircraft_part as ap
            ON ap.id=act.aircraft_part_id
          LEFT JOIN
            component as cmp
            ON cmp.id = acl.component_id
          GROUP BY
            act.extern_id
          ORDER BY
            act.extern_id) as pre_tech
        LEFT JOIN
          process as tech
          ON tech.activitie_id=pre_tech.id
        GROUP BY
          pre_tech.extern_id

				`;
        let cs2Data = await db.query(query, req);
        await pI.foreachEditableEntity(
          req.session.userid,
          cs2Data.rows,
          e => e.owner_name,
          e => e.id,
          (e) => {
            e['editable'] = true
          })
        res.send(cs2Data.rows);
      } catch (e) {
        debug(e);
        res.send(
          { error: 'Unknown Error' }
        )
      }
    });
  }
}

module.exports = ActivityHandler;
