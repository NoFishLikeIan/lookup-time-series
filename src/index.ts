import { sync, stream, resolve as resolvePromise, fromEvent } from "@thi.ng/rstream";
import { map, comp, filter, mapcat, Reducer, reduce, mapIndexed, range, reverse } from "@thi.ng/transducers";
import { fit } from '@thi.ng/math'
import { svg, line } from '@thi.ng/hiccup-svg'
import { updateDOM } from '@thi.ng/transducers-hdom'

import { readCsv } from "./utils/reading/read-csv";
import { identity, isTruthy } from "./core";

import { computeSeriesAutocor } from "./utils/time-series/autocorrelation";
import { extractSeries } from "./utils/reading/read-data";
import { rect } from "./components/rect";

const error = stream<any>();
const datasetUrl = stream<string>();

error.subscribe({ next: e => alert(`Error: ${e}`) });

const MARGIN_X = 100
const MARGIN_Y = 60

const response = sync<any, any>({
  src: { datasetUrl },
  xform: map(instance =>
    readCsv(instance.datasetUrl).then((data) => data || null)
  )
})
  .subscribe(resolvePromise({ fail: e => error.next(e.message) }));

const autocorrelation = sync<any, any>({
  src: { response },
  xform: comp(
    filter(({ response }) => isTruthy(response.data)),
    mapcat(({ response }) => extractSeries(response.data)),
    map(series => computeSeriesAutocor(series)(range(1, 10))),
    map(series => [...reverse(series)])
  )
});

const chart = sync<any, any>({
  src: {
    autocorrelation,
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ autocorrelation, window }) => {
    console.log('Plotting', autocorrelation)
    const [width, height]: [number, number] = window
    const data: number[] = autocorrelation

    const chartW = width - 2 * MARGIN_X;
    const chartH = height - 2 * MARGIN_Y;
    const bw = Math.max(3, chartW / data.length);
    const by = height - MARGIN_Y;

    const reducerMathAbs: Reducer<number, number> = [
      () => 0,
      identity,
      (max: number, value: number) => Math.abs(value) > max ? Math.abs(value) : max
    ]

    const maxAbsoluteV = reduce(reducerMathAbs, autocorrelation)


    const mapX = (x: number) =>
      fit(x, 0, data.length, MARGIN_X, width - MARGIN_X);

    const mapHeight = (y: number) => fit(y, -maxAbsoluteV, maxAbsoluteV, by / 2, -by / 2);
    const center = MARGIN_Y + by / 2


    return svg(
      { width, height },
      line([MARGIN_X, center], [width - MARGIN_X, center], { stroke: 'black' }),
      mapIndexed(
        (index, corr: number) => rect([mapX(index), center], 20, mapHeight(corr)),
        autocorrelation
      )
    )

  })
})

sync({
  src: {
    chart
  },
  xform: comp(
    map(({ chart }) => [
      'div',
      { class: '' },
      chart
    ]),
    updateDOM()
  )
})

datasetUrl.next(
  'https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv'
)

window.dispatchEvent(new CustomEvent("resize"));
