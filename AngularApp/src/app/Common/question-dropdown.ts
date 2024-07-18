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
//from https://angular.io/guide/dynamic-form
import { QuestionBase } from './question-base';
import { Validators } from '@angular/forms';

export class DropdownQuestion extends QuestionBase<string> {
    controlType = 'dropdown';
    options: { key: any, value: any }[] = [];

    constructor(options: {} = {}) {
        super(options);
        this.options = options['options'] || [];

        if (!(this.validators.indexOf(Validators.required) >= 0)) {
            let newOptions = [{
                key: null,
                value: 'None'
            }]
            for (let e of this.options)
                newOptions.push(e)
            this.options = newOptions
        }

        if (!('sort' in options) || options['sort'] != false) {
            this.options.sort((a, b) => {
                let as = a.value.toUpperCase()
                let bs = b.value.toUpperCase()
                if (as == 'NONE')
                    return -1
                if (bs == 'NONE')
                    return 1
                if (as < bs)
                    return -1
                if (bs < as)
                    return 1
                return 0
            })
        }
    }
}