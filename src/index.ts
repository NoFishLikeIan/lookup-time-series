import * as rs from "@thi.ng/rstream";
import * as tx from "@thi.ng/transducers";

import { readCsv } from "./utils/reading/read-csv";
import { identity, isTruthy } from "./core";

import { computeSeriesAutocor } from "./utils/time-series/autocorrelation";
import { extractSeries } from "./utils/reading/read-data";

const error = rs.stream<any>();
const datasetUrl = rs.stream<string>();

error.subscribe({ next: e => alert(`Error: ${e}`) });

const response = rs
  .sync<any, any>({
    src: { datasetUrl },
    xform: tx.map(instance =>
      readCsv(instance.datasetUrl).then(identity, e => error.next(e.message))
    )
  })
  .subscribe(rs.resolve({ fail: e => error.next(e.message) }));

const autocorrelation = rs.sync<any, any>({
  src: { response },
  xform: tx.comp(
    tx.filter(({ response }) => isTruthy(response.data)),
    tx.mapcat(({ response }) => extractSeries(response.data)),
    tx.map(series => computeSeriesAutocor(series))
  )
});
