import * as tx from "@thi.ng/transducers";
import { ThenArg } from "../../types";

type TimeSeries = Array<{
  date: string | number;
  [values: number]: number;
}>;

const dataFromString = (str: string): TimeSeries =>
  tx.transduce(
    tx.comp(
      tx.mapcat(text => text.split("\n")),
      tx.drop(1),
      tx.map(row => row.split(",")),
      tx.map(([date, ...values]) => ({
        date,
        ...values.map(v => parseFloat(v))
      }))
    ),
    tx.push(),
    [str]
  );

export const readCsv = async (url: string) => {
  try {
    const resp = await window.fetch(url);
    const string = await resp.text();

    console.log('Fetched data!')

    const data = dataFromString(string);
    return { data };
  } catch (error) {
    console.warn(error)
    return { data: [] }
  }
};

export type CSVResponse = ThenArg<ReturnType<typeof readCsv>>;
export type CSVData = CSVResponse["data"];
