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
import { QuestionBase } from './question-base';

export class ChipsQuestion extends QuestionBase<number[]> {
    controlType = 'chips';
    _chips: { key: number, value: string, color: string }[] = [];
    acceptNewChips: boolean = true;
    public vChangeCallback = null;

    constructor(options: {} = {}) {
        super(options);
        this.chips = options['chips'] || [];
        if ('acceptNewChips' in options)
            this.acceptNewChips = options['acceptNewChips'];
        if (this.value && this.value.filter)
            this.value = this.value.filter(v =>
                new Set(this.chips.map(c => c.key)).has(v))
    }

    public set chips(c: { key: number, value: string, color: string }[]) {
        this._chips = c.map((e) => { return { key: e.key, value: e.value, color: e.color } });
        this._chips.sort((a, b) => {
            let as = a.value.toUpperCase()
            let bs = b.value.toUpperCase()
            if (as < bs)
                return -1
            if (bs < as)
                return 1
            return 0
        })
    }

    public get chips(): { key: number, value: string, color: string }[] {
        return this._chips
    }

}