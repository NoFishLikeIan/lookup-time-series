import * as tx from "@thi.ng/transducers";
import { reduce } from "../../core";

type Series = IterableIterator<number> | number[] | Iterable<number>;

const autocovariance = (mean: number, series: number[], n: number) => (k: number) => {
  const [uppserSum, lowerSum] = reduce(
    ([upper, lower], y, index) => {
      const diff = y - mean;
      const nextDiff = series[index + k] - mean;

      return [upper + diff * nextDiff, lower + diff * diff];
    },
    [0, 0],
    series.slice(0, n - k)
  );

  return uppserSum / lowerSum;
};

export const computeSeriesAutocor = (series: Series) => {
  const sum = tx.add(series);
  const n = tx.count(series);
  const mean = sum / n;
  const computeKVariance = autocovariance(mean, [...series], n);
  return (orders: Series = tx.range(1, 1200)) =>
    tx.transduce(tx.comp(tx.map(computeKVariance)), tx.push(), orders);
};
