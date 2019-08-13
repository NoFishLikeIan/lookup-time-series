import { sync, stream, resolve, fromEvent } from "@thi.ng/rstream";
import { map, comp, filter, mapcat, Reducer, reduce, mapIndexed } from "@thi.ng/transducers";
import { fit } from '@thi.ng/math'
import { svg, line, rect } from '@thi.ng/hiccup-svg'
import { updateDOM } from '@thi.ng/transducers-hdom'

import { readCsv } from "./utils/reading/read-csv";
import { identity, isTruthy } from "./core";

import { computeSeriesAutocor } from "./utils/time-series/autocorrelation";
import { extractSeries } from "./utils/reading/read-data";

const error = stream<any>();
const datasetUrl = stream<string>();

error.subscribe({ next: e => alert(`Error: ${e}`) });

const MARGIN_X = 100
const MARGIN_Y = 60

const response = sync<any, any>({
  src: { datasetUrl },
  xform: map(instance =>
    readCsv(instance.datasetUrl).then(identity, e => error.next(e.message))
  )
})
  .subscribe(resolve({ fail: e => error.next(e.message) }));

const autocorrelation = sync<any, any>({
  src: { response },
  xform: comp(
    filter(({ response }) => isTruthy(response.data)),
    mapcat(({ response }) => extractSeries(response.data)),
    map(series => computeSeriesAutocor(series))
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

    const mapY = (y: number) => fit(y, 0, maxAbsoluteV, 0, by / 2);

    return svg(
      { width, height },
      line([MARGIN_X, MARGIN_Y], [width - MARGIN_X, MARGIN_Y], { stroke: 'black' }),
      mapIndexed(
        (index, corr: number) => rect([mapX(index), by / 2], 20, mapY(corr)),
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