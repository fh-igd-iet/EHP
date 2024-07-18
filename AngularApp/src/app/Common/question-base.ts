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
import { Validators } from '@angular/forms';

// from https://angular.io/guide/dynamic-form
export class QuestionBase<T> {
    value: T;
    key: string;
    label: string;
    required: boolean;
    order: number;
    controlType: string;
    validators: any[];
    asyncValidators: any[];
    errorMessages: { [id: string]: string };

    constructor(options: {
        value?: T,
        key?: string,
        label?: string,
        required?: boolean,
        order?: number,
        controlType?: string,
        validators?: any[],
        asyncValidators?: any[],
        errorMessages?: { [id: string]: string }
    } = {}) {


        this.value = options.value || null;
        this.key = options.key || '';
        this.label = options.label || '';
        this.required = !!options.required; // :D
        this.order = options.order === undefined ? 1 : options.order;
        this.controlType = options.controlType || '';
        this.asyncValidators = options.asyncValidators || [];
        this.validators = options.validators || [];

        this.required = this.required || this.validators.findIndex(d => d == Validators.required) >= 0;

        let standardMessages = {
            'required': this.label + " is required",
        }
        this.errorMessages = standardMessages;
        if (options.errorMessages) {
            this.errorMessages = Object.assign({},
                standardMessages, options.errorMessages)
        }
    }
}