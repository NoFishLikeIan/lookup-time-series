import { residualSquared } from "./regression";
import { sum } from "../reducers";
import { reduce } from '@thi.ng/transducers'

export const AIC = (observations: number[], params: number = 1) => {
    const n = observations.length

    // TODO: This needs to be dependents on number of lag, not just simple regression!
    const rss = residualSquared(observations)
    return n * Math.log(reduce(sum(), 0, rss) / n) + 2 * params
}

