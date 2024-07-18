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

export interface ComponentDBO {
  id: number,
  demo_nr: string,
  is_demo: number,
  code: string,
  name: string,
  spd_id: string,
  spd_name: string,
  spd_type: string,
  image_id: number,
  activity_id_a: number[],
  activity_extern_id_a: string[],
  activity_name_a: string[],
  activity_id_b: number[],
  activity_extern_id_b: string[],
  activity_name_b: string[],
  activity_id_c: number[],
  activity_extern_id_c: string[],
  activity_name_c: string[],
  activity_id_d: number[],
  activity_extern_id_d: string[],
  activity_name_d: string[],
  activity_id_e: number[],
  activity_extern_id_e: string[],
  activity_name_e: string[],
  editable?: boolean
}

export function componentDBOToTreeview(row) {
  let tree = [
  ]
  if (row.activity_name_a.length > 0) {
    tree.push({
      name: 'Multifunctional Fuselage & Cabin',
      children: row.activity_name_a.map((d, i) => {
        return {
          name: d,
          search: row.activity_extern_id_a[i],
          children: []
        }
      })
    })
  }
  if (row.activity_name_b.length > 0) {
    tree.push({
      name: 'Advanced Wing Design',
      children: row.activity_name_b.map((d, i) => {
        return {
          name: d,
          search: row.activity_extern_id_b[i],
          children: []
        }
      })
    })
  }
  if (row.activity_name_c.length > 0) {
    tree.push({
      name: 'Major systems Treatmens & Euipment Integration',
      children: row.activity_name_c.map((d, i) => {
        return {
          name: d,
          search: row.activity_extern_id_c[i],
          children: []
        }
      })
    })
  }
  if (row.activity_name_d.length > 0) {
    tree.push({
      name: 'Engine',
      children: row.activity_name_d.map((d, i) => {
        return {
          name: d,
          search: row.activity_extern_id_d[i],
          children: []
        }
      })
    })
  }
  if (row.activity_name_e.length > 0) {
    tree.push({
      name: 'Future connected Factory',
      children: row.activity_name_e.map((d, i) => {
        return {
          name: d,
          search: row.activity_extern_id_e[i],
          children: []
        }
      })
    })
  }
  return tree
}