import { Reducer, reduce, reducer } from '@thi.ng/transducers'
import { identity } from '../core';

export function maxAbsolute(): Reducer<number, number>;
export function maxAbsolute(xs: Iterable<number>): number;
export function maxAbsolute(xs?: any): any {
    return xs
        ? reduce(maxAbsolute(), xs)
        : reducer(() => -Infinity, (max, value: number) => Math.max(max, Math.abs(value)))
}

export function sum(): Reducer<number, number>;
export function sum(xs: Iterable<number>): number;
export function sum(xs?: any): any {
    xs
        ? reduce(sum(), xs)
        : reducer(() => 0, (total, value: number) => value + total)
}