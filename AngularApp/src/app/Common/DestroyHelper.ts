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
import Listener from './Listener';
import { Subscription } from 'rxjs';

/**
 * This is is helperclass for components that
 * helps keeping track of resources, that needs
 * to be destroyed when the component is destroyed and
 * destroys them.
 */
export class DestroyHelper {
    domEvents: DomEventSpec[] = []
    listenerEvents: ListenerEventSpec[] = []
    promiseTokens: PromiseToken[] = []
    subscription: Subscription[] = []

    constructor() {

    }

    destroy() {
        this.domEvents.forEach(e => {
            e.target.removeEventListener(e.event, e.fn, e.useCapture);
        });
        this.domEvents = [];
        this.listenerEvents.forEach(e => {
            e.target.delete(e.fn);
        });
        this.listenerEvents = [];
        this.promiseTokens.forEach(tk => tk.invalidate());
        this.subscription.forEach(s => { s.unsubscribe() });
        this.subscription = []
    }

    /**
     * registers a new dom event and names probably anonym function
     * to delete it later.
     * @param target 
     * @param event 
     * @param fn 
     */
    domEvent(target, event, fn, useCapture: boolean = false) {
        target.addEventListener(event, fn);
        this.domEvents.push(new DomEventSpec(target, event, fn, useCapture));
    }

    /**
     * registers a new listener callback function
     * and names probably anonym function
     * to delete it later.
     * @param target 
     * @param fn 
     */
    listenerEvent(target: Listener, fn) {
        target.add(fn);
        this.listenerEvents.push(new ListenerEventSpec(target, fn));
    }

    /**
     * registers an invalidatable Then with a promise.
     * Invalidateble means, that the success-function is not
     * called, when the Destroy-Helper was destroy.
     * @param promise 
     * @param success 
     */
    invalidatableThen<T>(promise: Promise<T>, success) {
        let tk = new PromiseToken()
        this.promiseTokens.push(tk);
        promise.then((v: T) => {
            if (tk.is_valid()) {
                success(v);
            }
            let tkIndex = this.promiseTokens.indexOf(tk);
            this.promiseTokens.splice(tkIndex, 1);
        })
        return tk
    }

    /**
     * registers a subscription that is unsubscribed,
     * when the helper is destroyed
     * @param s 
     */
    sub(s: Subscription) {
        this.subscription.push(s);
    }
}

class DomEventSpec {
    target: any;
    event: any;
    fn: any;
    useCapture: boolean = false;
    constructor(target, event, fn, useCapture: boolean = false) {
        this.target = target;
        this.event = event;
        this.fn = fn;
        this.useCapture = useCapture;
    }
}

class ListenerEventSpec {
    target: Listener;
    fn: any;
    constructor(target, fn) {
        this.target = target;
        this.fn = fn;
    }
}

export class PromiseToken {
    _valid: boolean = true;
    is_valid() {
        return this._valid;
    }
    invalidate() {
        this._valid = false;
    }
}