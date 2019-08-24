import { residualSquared } from "./regression";
import { sum } from "../reducers";
import { reduce, zip } from '@thi.ng/transducers'
import { takeAfter, takeMinus } from "../transducers";

const genShiftedPairs = (obs: number[], lag: number) => zip(takeMinus(lag, obs), takeAfter(lag, obs))


export const AIC = (obs: number[], lag: number = 1) => {
    const n = obs.length

    const shiftedPairs = genShiftedPairs(obs, lag)
    const rss = residualSquared([...shiftedPairs])
    return n * Math.log(reduce(sum(), 0, rss) / n) + 2
}

