import { mean, Reducer, comp, transduce, mapIndexed, reduce, map, push, pairs, zip, range } from '@thi.ng/transducers';
import { identity } from '../../core';

const cov = (xbar: number) => (ybar: number): Reducer<number, number[]> => [
    () => 0,
    identity,
    (acc, [x, y]) => acc + (x - xbar) * (y - ybar)
]


export function computeRegression(ys: number[]) {
    const n = ys.length

    const yBar = mean(ys)
    const xBar = n / 2 // equally spaced time series

    const xCov = cov(xBar)
    const computeCov = xCov(yBar)
    const computeVar = xCov(xBar)


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

const fitToReg = (ys: number[]) => {
    const { alpha, beta } = computeRegression(ys)
    return map((x) => alpha + beta * x, range(ys.length))
}

export const residualSquared = (actual: number[]) => map(([actual, predicted]) => Math.pow(actual - predicted, 2), zip(actual, fitToReg(actual)))