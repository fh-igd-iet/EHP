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
export interface EDASProcessDBO
{
  id: number,
  demo: string,
  pd: string,
  explanation: string,
  owner_id: number,
  owner_name: string,
  spd_id: string,
  spd_name: string,
  itd_id: string,
  itd_name: string,
  workpackage: string,
  cohort_letter: string,
  cohort_ids: string,
  material_ids: string,
  keyword_ids: string,
  keyword_names: string,
  a: number,
  b: number,
  c: number,
  d: number,
  reup: number,
  eol: number,
  ads: number,
  asa: number,
  grossfactor: number
}