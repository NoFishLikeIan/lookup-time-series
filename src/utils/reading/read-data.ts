import { CSVData } from "./read-csv";
import { reduce } from "../../core";

export const extractSeries = (data: CSVData) =>
  reduce<CSVData[number], Array<number[]>>(
    (acc, datum) => acc.map((series, sIndex) => [datum[sIndex], ...series]),
    [],
    data
  );
