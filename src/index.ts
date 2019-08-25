import { sync, stream, fromEvent, fromPromise } from "@thi.ng/rstream"
import { map, comp, filter, mapcat, mapIndexed, range, zip, min, max, pairs } from "@thi.ng/transducers"
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
import { menu } from "./components/ui";
import { AUTOCORR_SCALES_OPT } from "./constants/ui-constants";

const URL = 'https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv'
const PERIODS = 50
const MARGIN_X = 30
const MARGIN_Y = 60
const AIC_BAR_H = 10

const GRADIENT = GRADIENTS['cyan-magenta']
const lags = range(PERIODS, 1)
const fitToOrangeBlue = fitToColor(GRADIENT)
const positionGraph = (numberOfGraphs: number, by: number) => map((i) => i * (by / (numberOfGraphs + 1)), range(1, numberOfGraphs + 1))


const requestData = readCsv(URL)
const response = fromPromise(requestData)

const error = stream<any>()
error.subscribe({ next: e => alert(`Error: ${e}`) })


// UI Streams
const autocorrScales = stream<'abs' | 'minmax'>()

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
})

const orderSelection = sync<any, any>({
  src: { series },
  xform: comp(
    map(({ series }) => [...map(l => AIC(series, l), lags)]),
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
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ graphs, window, autocorrScales }) => {
    const [width, height]: [number, number] = window
    const [autocorrelation, orderSelection] = graphs

    const chartW = width - 2 * MARGIN_X
    const chartH = height - 2 * MARGIN_Y
    const by = height - MARGIN_Y

    const [firstBase, secondBase] = map((p) => MARGIN_Y + p, positionGraph(graphs.length, by))

    const mapXBar = (x: number) =>
      fit(x, 0, autocorrelation.length, MARGIN_X, chartW - MARGIN_X)

    const mapBarHeight = mapBarHeightFactory(autocorrScales, chartH / 2)

    const mapColor = fitToOrangeBlue(min(orderSelection), max(orderSelection))

    const barWidth = 5 // FIXME: dynamic
    const iter = zip(autocorrelation, orderSelection) as Iterable<[number, number]>

    const from = [MARGIN_X, firstBase]
    const to = [chartW - MARGIN_X - barWidth, firstBase]

    const gradients = [...genGradient(orderSelection, GRADIENT)]
    console.log({ gradients })

    return [canvas, { width, height },
      ["defs", {}, ['linearGradient', { id: 'aic', from, to }, gradients],],
      ["rect", { fill: '$aic' }, from, to[0] - from[0], AIC_BAR_H],

      mapIndexed(
        (index, [corr, order]: [number, number]) => {
          const fill = mapColor(order)
          const x = mapXBar(index)
          const barHeight = mapBarHeight(corr, min(autocorrelation), max(autocorrelation))
          const pos = Math.sign(-barHeight)
          const barOffset = pos < 0 ? 1 : 0

          return ([
            // Autocorrelation graph
            ['g', {},
              ['rect', { fill }, [x, firstBase + barOffset * AIC_BAR_H], barWidth, barHeight],
              ["text", { fill: 'black', fontSize: 7 }, [x - barWidth / 2, firstBase + (pos * (AIC_BAR_H + 20))], `-${PERIODS - index - 1}`]
            ],
          ])
        },
        iter
      ),


    ]

  })
})

const selectors = sync<any, any>({
  src: {
    autocorrScales: autocorrScales.transform(
      menu(autocorrScales, ...AUTOCORR_SCALES_OPT)
    ),
  },
  xform: map(({ autocorrScales }) => [
    'div',
    { class: `sans-serif f7` },
    [
      "div.fixed",
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
          autocorrScales
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
