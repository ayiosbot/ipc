/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Ayios. All rights reserved.
 *  All code created by Ayios within this repository is licensed under the MIT License. Other
 *  code not created by Ayios is under their respective license, which should have an
 *  indication of whatever copyright the file is subject to.
 *--------------------------------------------------------------------------------------------*/
import { randomUUID } from 'crypto';
import { Worker } from 'cluster';

export interface IPCEvent<T = any> {
    /** The operation code sent (always a number) */
    op: number;
    /** The data passed through the event */
    d: T;
}

export default class IPCManager {
    private readonly workers = new Set<Worker>();
    private readonly _callbacks = new Map<string, [code: number, callback: (d: any) => void]>;
    public readonly listener: (event: any) => void;
    public readonly autoRemove: boolean = false;
    constructor(autoRemove: boolean = false) {
        this.autoRemove = autoRemove;
        this.listener = (event) => {
            try {
                var content = JSON.parse(event) as IPCEvent;
            } catch {
                return;
            }
            this._callbacks.forEach(data => {
                // console.log(`Comparing data[0](${data[0]}) to op (${content.op})`);
                if (data[0] === content.op) data[1](content.d);
            });
        }
        process.on('message', this.listener);
    }
    addWorker(worker: Worker) {
        if (this.workers.has(worker)) return;
        this.workers.add(worker);
        worker.on('message', this.listener);
        if (this.autoRemove) worker.on('exit', () => this.removeWorker(worker));
    }
    removeWorker(worker: Worker) {
        if (!this.workers.has(worker)) return;
        worker.removeListener('message', this.listener);
        this.workers.delete(worker);
    }
    onEvent<T>(code: number, callback: (data: T) => void) {
        const uuid = randomUUID();
        this._callbacks.set(uuid, [ code, callback ]);
        return uuid;
    }
    sendEvent<T = boolean | [number, boolean][]>(code: number, target: Worker | '*' | 'primary', data: any): T { // todo: add timeout; (for responses)
        if (target === '*') {
            const booleans = [];
            for (const worker of this.workers) {
                const result = worker.send(JSON.stringify({ op: code, d: data }));
                booleans.push([worker.id, result]);
            }
            return booleans as T;
        } else if (target === 'primary') {
            if (process.send) {
                return process.send(JSON.stringify({ op: code, d: data })) as T;
            } else return false as T;
        } else {
            return target.send(JSON.stringify({ op: code, d: data })) as T;
        }
    }
    removeEventListener(target: string | number, type: 'code' | 'id' = 'id') {
        if (typeof target === 'string') {
            this._callbacks.delete(target as string);
        } else if (typeof target == 'number') {
            this._callbacks.forEach((data, id) => {
                if (data[0] === target) this._callbacks.delete(id);
            });
        }
    }
}