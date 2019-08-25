import { comp, zip, map, mapcat, reduce, take, Transducer, iterator, Reducer, compR, ensureReduced, reduced } from "@thi.ng/transducers"
import { sum, length } from "./reducers"

export const sumPairs = comp<number[][], [number[]], number>(
    mapcat((it) => {

        return zip(it)
    }),
    map((pairs) => reduce(sum(), pairs[0]))
)

export function _takeAfter<T>(n: number): Transducer<T, T>
export function _takeAfter<T>(n: number, src: Iterable<T>): IterableIterator<T>
export function _takeAfter<T>(n: number, src?: Iterable<T>): any {
    return src
        ? iterator(_takeAfter(n), src)
        : (rfn: Reducer<any, T>) => {
            const r = rfn[2]
            let m = n
            return compR(
                rfn,
                (acc, x: T) =>
                    --m > 0
                        ? acc
                        : m === 0
                            ? ensureReduced(r(acc, x))
                            : reduced(acc)
            )
        }
}

export function takeAfter<T>(n: number, src: Iterable<T>) {
    let v = []
    let m = n
    for (const elem of src) {
        if (--m < 0) v.push(elem)
    }

    return v
}

export function takeMinus<T>(n: number, src: Iterable<T>) {
    return take(length(src) - n, src)
}