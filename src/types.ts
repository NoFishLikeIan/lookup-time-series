import { first } from "./utils/reading"

export type ThenArg<T> = T extends Promise<infer U> ? U : T

export type Univariate = Iterable<number>
export type NVariateData = Iterable<number[]>

export const isUnivariate = (d: NVariateData | Univariate): d is Univariate => typeof first(d) === 'number'
export const isMultiVariate = (d: NVariateData | Univariate): d is NVariateData => !isUnivariate(d)