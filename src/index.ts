import { sync, stream, fromEvent, fromPromise } from "@thi.ng/rstream";
import { map, comp, filter, mapcat, mapIndexed, range, zip, min, max } from "@thi.ng/transducers";
import { fit } from '@thi.ng/math'
import { svg, line } from '@thi.ng/hiccup-svg'
import { updateDOM } from '@thi.ng/transducers-hdom'
import { GRADIENTS } from '@thi.ng/color'

import { readCsv } from "./utils/reading/read-csv";
import { isTruthy } from "./core";
import { computeSeriesAutocor } from "./utils/time-series/autocorrelation";
import { extractSeries } from "./utils/reading/read-data";
import { rect } from "./components/rect";
import { AIC } from "./utils/time-series/aic";
import { fitToColor } from "./utils/scales";

const URL = 'https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv'
const PERIODS = 30

const lags = range(PERIODS, 1)
const fitToOrangeBlue = fitToColor(GRADIENTS['cyan-magenta'])


const error = stream<any>();
// const datasetUrl = stream<string>();

error.subscribe({ next: e => alert(`Error: ${e}`) });

const MARGIN_X = 100
const MARGIN_Y = 60

const requestData = readCsv(URL)
const response = fromPromise(requestData)

const series = sync<any, any>({
  src: { response },
  xform: comp(
    filter(({ response }) => isTruthy(response.data)),
    mapcat(({ response }) => extractSeries(response.data)),
  )
})

const autocorrelation = sync<any, any>({
  src: { series },
  xform: comp(
    map(({ series }) => computeSeriesAutocor(series)(lags)),
  )
});

const orderSelection = sync<any, any>({
  src: { series },
  xform: comp(
    map(({ series }) => [...map(l => AIC(series, l), lags)]),
  )
})

const chart = sync<any, any>({
  src: {
    autocorrelation,
    orderSelection,
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ autocorrelation, orderSelection, window }) => {
    const [width, height]: [number, number] = window


    const chartW = width - 2 * MARGIN_X;
    const bw = Math.max(3, chartW / autocorrelation.length);
    const chartH = height - 2 * MARGIN_Y;
    const by = height - MARGIN_Y;
    const center = MARGIN_Y + by / 2

    const mapXBar = (x: number) =>
      fit(x, 0, autocorrelation.length, MARGIN_X, width - MARGIN_X);

    const mapBarHeight = (y: number) =>
      fit(y, -1, 1, by / 2, -by / 2)

    const mapColor = fitToOrangeBlue(min(orderSelection), max(orderSelection))


    const iter = zip(autocorrelation, orderSelection) as Iterable<[number, number]>

    return svg(
      { width, height },
      line([MARGIN_X, center], [width - MARGIN_X, center], { stroke: 'black' }),
      mapIndexed(
        (index, [corr, order]: [number, number]) =>
          rect([mapXBar(index), center], 20, mapBarHeight(corr), { fill: mapColor(order) }),
        iter
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

window.dispatchEvent(new CustomEvent("resize"));
