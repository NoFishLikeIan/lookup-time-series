import { Reducer, comp, transduce, mapIndexed, reduce, map, push, zip, last } from '@thi.ng/transducers'
import { identity, constant } from '../../core'
import { NVariateData } from '../../types'
import { nVariateMeans } from './mean'
import { first, isFilled } from '../reading'

const cov = (xbar: number) => (ybar: number): Reducer<number, number[]> => [
    constant(0),
    identity,
    (acc, [x, y]) => acc + (x - xbar) * (y - ybar)

]

const get = (fn: (n: any) => number | undefined) => (d: NVariateData) => map(i => fn(i), d)
const getYs = get(last)
const getXs = get(first)

export function computeRegression(d: NVariateData) {

    const [xBar, yBar] = nVariateMeans(d)

    const xCov = cov(xBar)
    const computeCov = xCov(yBar)
    const computeVar = xCov(xBar)

    const ys = [...getYs(d)] as number[] // FIXME: Check on undefined

    const compose = (reducer: Reducer<number, number[]>) => comp<number, number[], number[][], number>(
        mapIndexed((x, y) => [x, y]),
        map(s => [s]),
        map(s => reduce(reducer, s)),
    )

    const [covariance] = transduce(compose(computeCov), push(), ys)
    const [variance] = transduce(compose(computeVar), push(), ys)

    const beta = covariance / variance
    const alpha = yBar - xBar * beta

    return { beta, alpha }
}

const fitToReg = (d: NVariateData): IterableIterator<number> | [] => {
    const xs = getXs(d)

    if (!isFilled(xs)) return []

    const { alpha, beta } = computeRegression(d)
    return map((x) => alpha + beta * x, xs)
}

export const residualSquared = (d: NVariateData) => map(
    ([actual, predicted]) => actual ? (actual - predicted) * (actual - predicted) : 0,
    zip(getYs(d), fitToReg(d))
)
