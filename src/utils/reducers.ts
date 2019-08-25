import { Reducer, reduce, reducer } from '@thi.ng/transducers'
import { constant } from '../core'

export function maxAbsolute(): Reducer<number, number>
export function maxAbsolute(xs: Iterable<number>): number
export function maxAbsolute(xs?: any): any {
    return xs
        ? reduce(maxAbsolute(), xs)
        : reducer(constant(-Infinity), (max, value: number) => Math.max(max, Math.abs(value)))
}

export function sum(): Reducer<number, number>
export function sum(xs: Iterable<number>): number
export function sum(xs?: any): any {
    return xs
        ? reduce(sum(), xs)
        : reducer(constant(0), (total, value: number) => value + total)
}


export function length(): Reducer<number, number>
export function length(xs: Iterable<any>): number
export function length(xs?: any): any {
    return xs
        ? reduce(length(), xs)
        : reducer(constant(0), (n) => n + 1)
}