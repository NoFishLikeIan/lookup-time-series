import * as tx from '@thi.ng/transducers'
import { isNumber } from '@thi.ng/checks'

import { CSVData } from "./read-csv";
import { reduce } from "../../core";

const isNumericString = (s: string) => isNumber(s) || s.match(/^\d+$/) !== null

const emptySeriesForArray = <T>(obj: Record<string, unknown>): T[][] =>
  tx.transduce(
    tx.comp(
      tx.filter(key => isNumericString(key)),
      tx.map(_ => [])
    ),
    tx.push(),
    tx.keys(obj)
  )


export const extractSeries = (data: CSVData) => reduce<CSVData[number], Array<number[]>>(
  (acc, datum) => acc.map((series, sIndex) => [datum[sIndex], ...series]),
  [...emptySeriesForArray<number>(data[0])],
  data
)
