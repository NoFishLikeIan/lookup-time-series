import { NVariateData, Univariate, isUnivariate } from "../../types";
import { mean, reduce, Reducer, transduce, map, push, range } from "@thi.ng/transducers";
import { first } from "../reading";
import { identity } from "../../core";
import { sumPairs } from "../transducers";

const initAcc = (n: number) => map(_ => 0, range(n))

export function nVariateMeans(d: NVariateData | Univariate): number[] | number {
    if (isUnivariate(d)) return reduce(mean(), d)

    let n = 0
    const init = first(d)

    if (!init) return 0

    const meansReducer: Reducer<number[] | IterableIterator<number>, number[]> = [
        () => initAcc(init.length),
        (acc) => map(n > 1 ? (sum => sum / n) : identity, acc),
        (acc, xs) => (n++ , transduce(sumPairs, push(), [[[...acc], [...xs]]]))
    ]

    return [...reduce(meansReducer, d)]
}