import { comp, zip, map, mapcat, reduce } from "@thi.ng/transducers";
import { sum } from "./reducers";

export const sumPairs = comp<number[][], [number[]], number>(
    mapcat((it) => zip(it)),
    map((pairs) => reduce(sum(), pairs[0]))
)