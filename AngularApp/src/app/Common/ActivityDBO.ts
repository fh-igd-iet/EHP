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
import { NumberSymbol } from "@angular/common";

export interface ActivityDBO {
    id: number,
    extern_id: string,
    title: string,
    owner_id: number,
    validation_by: string,
    lci_analyst: string,
    env_improvement: string,
    ecolonomic_motivation: string,
    composites: number,
    additive_manufacturing: number,
    machining: number,
    hazards_reg_substances: number,
    recycling: number,
    digital_materials: number,
    water: number,
    struct_health_monitoring: number,
    storage_supply_transmission_material: number,
    storage_supply_transmission_electrical: number,
    socio_economic: number,
    comment: string,
    spd_id: string,
    spd_name: string,
    aircraft_part_id: string,
    aircraft_part_name: string,
    comp_id_a: number[],
    comp_name_a: string[],
    comp_code_a: string[],
    comp_id_b: number[],
    comp_name_b: string[],
    comp_code_b: string[],
    comp_id_c: number[],
    comp_name_c: string[],
    comp_code_c: string[],
    comp_id_d: number[],
    comp_name_d: string[],
    comp_code_d: string[],
    comp_id_e: number[],
    comp_name_e: string[],
    comp_code_e: string[],
    technology_ids: number[],
    technology_extern_ids: string[],
    technology_names: string[],
    technology_spds: string[],
    technology_parents: number[],
    editable?: boolean
}
