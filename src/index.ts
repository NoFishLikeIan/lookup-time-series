import { sync, stream, fromEvent, fromPromise } from "@thi.ng/rstream"
import { map, comp, filter, mapcat, mapIndexed, range, zip, min, max } from "@thi.ng/transducers"
import { fit } from '@thi.ng/math'
import { canvas } from '@thi.ng/hdom-canvas'
import { updateDOM } from '@thi.ng/transducers-hdom'
import { GRADIENTS } from '@thi.ng/color'

import { readCsv } from "./utils/reading/read-csv"
import { isTruthy } from "./core"
import { computeSeriesAutocor } from "./utils/time-series/autocorrelation"
import { extractSeries } from "./utils/reading/read-data"
import { AIC } from "./utils/time-series/aic"
import { fitToColor } from "./utils/scales"

const URL = 'https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv'
const PERIODS = 50
const MARGIN_X = 30
const MARGIN_Y = 60
const AXIS_WIDTH = 1

const lags = range(PERIODS, 1)
const fitToOrangeBlue = fitToColor(GRADIENTS['cyan-magenta'])
const positionGraph = (numberOfGraphs: number, by: number) => map((i) => i * (by / (numberOfGraphs + 1)), range(1, numberOfGraphs + 1))

const error = stream<any>()
error.subscribe({ next: e => alert(`Error: ${e}`) })

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
    window: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  },
  xform: map(({ graphs, window }) => {
    const [width, height]: [number, number] = window
    const [autocorrelation, orderSelection] = graphs

    const chartW = width - 2 * MARGIN_X
    const chartH = height - 2 * MARGIN_Y
    const by = height - MARGIN_Y

    const [firstBase, secondBase] = map((p) => MARGIN_Y + p, positionGraph(graphs.length, by))

    const mapXBar = (x: number) =>
      fit(x, 0, autocorrelation.length, MARGIN_X, chartW - MARGIN_X)

    const mapBarHeight = (y: number) =>
      fit(y, -1, 1, chartH / 2, -chartH / 2)

    const mapColor = fitToOrangeBlue(min(orderSelection), max(orderSelection))

    const barWidth = 5 // FIXME: dynamic
    const iter = zip(autocorrelation, orderSelection) as Iterable<[number, number]>

    return [canvas, { width, height },
      ["line", { stroke: 'black', strokeWidth: AXIS_WIDTH }, [MARGIN_X, firstBase + AXIS_WIDTH], [chartW - MARGIN_X - barWidth, firstBase]],
      mapIndexed(
        (index, [corr, order]: [number, number]) => {
          const fill = mapColor(order)
          const x = mapXBar(index)
          console.log({ x, fill })
          return ([
            // Autocorrelation graph
            ['g', {},
              ['rect', { fill }, [x, firstBase], barWidth, mapBarHeight(corr)],
              ["text", { fill: 'black' }, [x, firstBase + 20], `-${PERIODS - index - 1}`]
            ],
          ])
        },
        iter
      ),


    ]

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

window.dispatchEvent(new CustomEvent("resize"))
