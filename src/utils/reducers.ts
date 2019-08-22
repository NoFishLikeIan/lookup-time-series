import { Reducer } from '@thi.ng/transducers'
import { identity } from '../core';

export const reducerMathAbs: Reducer<number, number> = [
    () => 0,
    identity,
    (max, value) => Math.abs(value) > max ? Math.abs(value) : max
]

export const sum: Reducer<number, number> = [
    () => 0,
    identity,
    (s, value) => s + value
] 