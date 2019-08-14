import {
  sync,
  stream,
  resolve as resolvePromise,
  fromEvent,
  fromPromise
} from "@thi.ng/rstream";
import {
  map,
  comp,
  filter,
  mapcat,
  Reducer,
  reduce,
  mapIndexed,
  range,
  reverse,
  trace
} from "@thi.ng/transducers";
import { fit } from "@thi.ng/math";
import { svg, line } from "@thi.ng/hiccup-svg";
import { updateDOM } from "@thi.ng/transducers-hdom";

import { readCsv } from "./utils/reading/read-csv";
import { identity, isTruthy } from "./core";

import { computeSeriesAutocor } from "./utils/time-series/autocorrelation";
import { extractSeries } from "./utils/reading/read-data";
import { rect } from "./components/rect";

const error = stream<any>();
// const datasetUrl = stream<string>();

error.subscribe({ next: e => alert(`Error: ${e}`) });

const MARGIN_X = 100;
const MARGIN_Y = 60;

// const response = sync<any, any>({
//   src: { datasetUrl }
// })
//   .transform(
//     map(async instance => {
//       console.log({ instance });
//       return readCsv(instance.datasetUrl).then(data => data || null);
//     })
//   )
//   .subscribe(resolvePromise({ fail: e => error.next(e.message) }));
const response = fromPromise(
  readCsv(
    "https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv"
  )
);

const autocorrelation = sync<any, any>({
  src: { response }
}).transform(
  trace(),
  filter(({ response }) => isTruthy(response.data)),
  mapcat(({ response }) => extractSeries(response.data)),
  map(series => computeSeriesAutocor(series as any)(range(1, 10)))
);

const chart = sync<any, any>({
  src: {
    autocorrelation,
    windowSize: fromEvent(window, "resize").transform(
      map(() => [window.innerWidth, window.innerHeight])
    )
  }
}).transform(
  map(({ autocorrelation, windowSize }) => {
    console.log("Plotting", autocorrelation, windowSize);
    const [width, height]: [number, number] = windowSize;
    const data: number[] = autocorrelation;

    const chartW = width - 2 * MARGIN_X;
    const chartH = height - 2 * MARGIN_Y;
    const bw = Math.max(3, chartW / data.length);
    const by = height - MARGIN_Y;

    const reducerMathAbs: Reducer<number, number> = [
      () => 0,
      identity,
      (max: number, value: number) =>
        Math.abs(value) > max ? Math.abs(value) : max
    ];

    const maxAbsoluteV = reduce(reducerMathAbs, autocorrelation);

    const mapX = (x: number) =>
      fit(x, 0, data.length, MARGIN_X, width - MARGIN_X);

    const mapHeight = (y: number) =>
      fit(y, -maxAbsoluteV, maxAbsoluteV, by / 2, -by / 2);
    const center = MARGIN_Y + by / 2;

    const mapFn = (index: number, corr: number) => {
      const pts = [mapX(index), center];
      const w = 20;
      const h = mapHeight(corr);

      return rect(pts, w, h);
    };

    let rects = mapIndexed(mapFn, autocorrelation);

    return svg(
      { width, height },
      line([MARGIN_X, center], [width - MARGIN_X, center], { stroke: "black" }),
      rects
    );
  })
);

sync<any, any>({
  src: {
    chart
  }
}).transform(
  map(({ chart }) => {
    console.log({ chart });

    return ["div", { class: "" }, chart];
  }),
  updateDOM()
);

// datasetUrl.next(
//   "https://gist.githubusercontent.com/NoFishLikeIan/0c7f070b056773ca5294bb9767fcbc23/raw/996f26fc4792eb47e252d3cd10c9ecb3f0599722/melbourne.csv"
// );

window.dispatchEvent(new CustomEvent("resize"));
