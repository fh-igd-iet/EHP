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

export interface FlagshipComponentViewDBO {
  id: number,
  demo_nr: string,
  is_demo: boolean,
  code: string,
  name: string,
  spd_id: string,
  spd_name: string,
  spd_type: string,
  image_id: number,
  activity_ids: number[],
  activity_names: string[],
  technology_ids: string[][],
  technology_names: string[][],
  component_codes:string[][],
  component_names: string[][]
}