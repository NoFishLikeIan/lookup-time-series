import { sync, stream, fromEvent, fromPromise } from "@thi.ng/rstream"
import { map, comp, filter, mapcat, range, zip, min, max, Range } from "@thi.ng/transducers"
import { fit } from '@thi.ng/math'
import { canvas } from '@thi.ng/hdom-canvas'
import { updateDOM } from '@thi.ng/transducers-hdom'
import { GRADIENTS } from '@thi.ng/color'

import { readCsv } from "./utils/reading/read-csv"
import { isTruthy } from "./core"
import { computeSeriesAutocor } from "./utils/time-series/autocorrelation"
import { extractSeries } from "./utils/reading/read-data"
import { AIC } from "./utils/time-series/aic"
import { fitToColor, mapBarHeightFactory, genGradient } from "./utils/scales"
import { menu, h1, h2 } from "./components/ui";
import { AUTOCORR_SCALES_OPT, LAGS } from "./constants/ui-constants";
import { autocorrelationGraph } from "./components/autocorrelation";
import { URL, MARGIN_X, MARGIN_Y, PERIODS } from "./constants/data-const";

const GRADIENT = GRADIENTS['cyan-magenta']
const fitToOrangeBlue = fitToColor(GRADIENT)
const positionGraph = (numberOfGraphs: number, by: number) => map((i) => i * (by / (numberOfGraphs + 1)), range(1, numberOfGraphs + 1))


const requestData = readCsv(URL)
const response = fromPromise(requestData)

const error = stream<any>()
error.subscribe({ next: e => alert(`Error: ${e}`) })


// UI Streams
const autocorrScales = stream<'abs' | 'minmax'>()
const lags = stream<Range>()

const series = sync<any, any>({
  src: { response },
  xform: comp(
    filter(({ response }) => isTruthy(response.data)),
    mapcat(({ response }) => extractSeries(response.data)),
  )
})

const autocorrelation = sync<any, any>({
  src: { series, lags },
  xform: comp(
    map(({ series, lags }) => computeSeriesAutocor(series)(lags)),
  )
})

const orderSelection = sync<any, any>({
  src: { series, lags },
  xform: comp(
    map(({ series, lags }) => [...map((l: number) => AIC(series, l), lags)]),
  )
})

const graphs = sync<any, any>({
  src: { autocorrelation, orderSelection },
  xform: comp(
    map(({ autocorrelation, orderSelection }) => [autocorrelation, orderSelection])
  )
})

const chart = sync<any, any>({
  src: {
    graphs,
    autocorrScales,
    lags,
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ graphs, window, autocorrScales, lags }) => {
    const [width, height]: [number, number] = window
    const [autocorrelation, orderSelection] = graphs

    const chartW = width - 2 * MARGIN_X
    const chartH = height - 2 * MARGIN_Y
    const by = height - MARGIN_Y

    const [_, secondBase] = map((p) => MARGIN_Y + p, positionGraph(graphs.length, by))

    const mapXBar = (x: number) =>
      fit(x, 0, autocorrelation.length, MARGIN_X, chartW - MARGIN_X)

    const mapBarHeight = mapBarHeightFactory(autocorrScales, chartH / 2)

    const mapColor = fitToOrangeBlue(min(orderSelection), max(orderSelection))

    const barWidth = 5 // FIXME: dynamic
    const iter = zip(autocorrelation, orderSelection) as Iterable<[number, number]>



    const gradients = [...genGradient(orderSelection, GRADIENT)]

    return [canvas, { width, height },
      ...autocorrelationGraph({
        min: min(autocorrelation),
        max: max(autocorrelation),
        gradients,
        base: secondBase,
        barWidth,
        mapColor,
        mapXBar,
        mapBarHeight,
        label: (index: number) => [...lags].length - index,
        iter,
        chartW
      })


    ]

  })
})

const selectors = sync<any, any>({
  src: {
    autocorrScales: autocorrScales.transform(
      menu(autocorrScales, ...AUTOCORR_SCALES_OPT)
    ),
    lags: lags.transform(
      menu(lags, LAGS[0], LAGS[1], (opt: string) => range(Number(opt), 1))
    )
  },
  xform: map(({ autocorrScales, lags }) => [
    'div',
    { class: `sans-serif f7` },
    [h1, 'Lookup time series'],
    [h2, 'Check the best lag order, and more coming...'],
    [
      "div",
      {
        style: {
          top: `1rem`,
          right: `${MARGIN_X}px`,
          width: `calc(100vw - 2 * ${MARGIN_X}px)`
        }
      },
      [
        "div.flex",
        ...map((x) => ["div.w-25.ph2", x], [
          autocorrScales,
          lags
        ])
      ]
    ],

  ])
})

sync({
  src: {
    selectors,
    chart
  },
  xform: comp(
    map(({ chart }) => [
      'div',
      { class: '' },
      selectors,
      chart
    ]),
    updateDOM()
  )
})

window.dispatchEvent(new CustomEvent("resize"))
autocorrScales.next('minmax')
lags.next(range(PERIODS, 1))
