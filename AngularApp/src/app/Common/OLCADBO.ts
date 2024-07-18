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

export interface Flow {
    name: string;
    amount: number;
    unit: string;
}

export interface InputParameter {
    name: string;
    value: number;
    description: string;
}

export interface DependentParameter {
    name: string;
    formular: string;
    value: number;
    description: string;
}

export interface OLCAProcess {
    id: string;
    name: string;
    intern_id: number;
    owner: string;
    dataset_generator: string;
    description: string;
    uuid: string;
    aggregated: boolean;
    cs1: boolean;

    inputs: Flow[];
    outputs: Flow[];
    inputParameters: InputParameter[];
    edpendentParameters: DependentParameter[];
}

export interface OLCAProcessDBO {
    id: number,
    olca_id: number,
    name: string,
    owner: string,
    owner_id: number,
    owner_changeable: boolean,
    confidentiality: string,
    editor_id: number,
    editor_name: string,
    edit_tstamp: string,
    lcaProcess: OLCAProcess,
    technology_id: number,
    edit_tstamp_tech: string,
    editor_id_tech: number,
    verified: boolean;
}

export interface OLCAProcessListDBO extends LcaDBO {
    processList?: OLCAProcess[]
}