import { sync, stream, fromEvent, fromPromise } from "@thi.ng/rstream"
import { map, comp, filter, mapcat, range, zip, min, max, Range, pairs, transduce, push } from "@thi.ng/transducers"
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
import { autocorrBarchart } from "./components/autocorrelation";
import { URL, MARGIN_X, MARGIN_Y, PERIODS } from "./constants/data-const";
import { linechart } from "./components/linechart";
import { MA_MODES, Modes, MA_PERIODS } from "./constants/ui-const";
import { DropDownOption } from "@thi.ng/hdom-components";

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
const plottingMode = stream<Modes>()
const movingAveragePeriods = stream<number>()


const series = sync<any, any>({
  src: { response, movingAveragePeriods, plotting: plottingMode.transform(map((id: Modes) => MA_MODES[id].fn)) },
  xform: comp(
    filter(({ response }) => isTruthy(response.data)),
    mapcat(({ response, plotting, movingAveragePeriods }) => map((series) => [...plotting(movingAveragePeriods, series)], extractSeries(response.data))),
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
  src: { autocorrelation, series },
  xform: comp(
    map(({ autocorrelation, series }) => [autocorrelation, series])
  )
})

const chart = sync<any, any>({
  src: {
    graphs,
    autocorrScales,
    lags,
    orderSelection,
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ graphs, window, autocorrScales, lags, orderSelection }) => {
    const [width, height]: [number, number] = window
    const [autocorrelation, series] = graphs

    const chartW = width - 2 * MARGIN_X
    const chartH = height - 2 * MARGIN_Y
    const by = height - MARGIN_Y

    const [firstBase, secondBase] = map((p) => MARGIN_Y + p, positionGraph(graphs.length, by))

    const mapXBar = (x: number) =>
      fit(x, 0, autocorrelation.length, MARGIN_X, chartW - MARGIN_X)

    const mapBarHeight = mapBarHeightFactory(autocorrScales, chartH / 2)

    const mapColor = fitToOrangeBlue(min(orderSelection), max(orderSelection))

    const barWidth = 5 // FIXME: dynamic
    const seasons = series.length / lags.from

    const iter = zip(autocorrelation, orderSelection) as Iterable<[number, number]>
    const barchartGradients = [...genGradient(orderSelection, GRADIENT)]
    const linechartGradients = [...genGradient(orderSelection, GRADIENT, seasons)]

    const { def: barDef, graph: autocorrelationGraph } = autocorrBarchart({
      min: min(autocorrelation),
      max: max(autocorrelation),
      gradients: barchartGradients,
      base: secondBase,
      barWidth,
      mapColor,
      mapXBar,
      mapBarHeight,
      label: (index: number) => lags.from - index,
      iter,
      chartW
    })

    const { def: lineDef, graph: priceGraph } = linechart({
      data: series,
      chartH,
      chartW,
      base: firstBase,
      gradients: linechartGradients,
    })


    return [canvas, { width, height },
      ['defs', {}, barDef, lineDef,],
      autocorrelationGraph,
      priceGraph
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
    ),
    plottingMode: plottingMode.transform(
      menu(plottingMode, "Plotting mode", [
        ...map(
          ([id, mode]) => <DropDownOption>[id, mode.label],
          pairs(MA_MODES)
        )
      ])
    ),
    movingAveragePeriods: movingAveragePeriods.transform(
      menu(movingAveragePeriods, MA_PERIODS[0], MA_PERIODS[1], (opt: string) => Number(opt))
    )
  },
  xform: map(({ autocorrScales, lags, plottingMode, movingAveragePeriods }) => [
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
          lags,
          plottingMode,
          movingAveragePeriods
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
plottingMode.next('default')
movingAveragePeriods.next(10)
