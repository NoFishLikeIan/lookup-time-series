import { fit } from "@thi.ng/math";
import { min, max, mapIndexed } from "@thi.ng/transducers";
import { MARGIN_X } from "../constants/data-const";

interface ChartProps {
    data: number[],
    chartW: number,
    chartH: number,
    base: number,
    gradients: [number, string][],
}


export const linechart = ({
    data,
    chartW,
    chartH,
    gradients,
}: ChartProps) => {
    const from: [number, number] = [MARGIN_X, 0]
    const to: [number, number] = [chartW - MARGIN_X, 0]

    const mapX = (index: number) => fit(index, 0, data.length, MARGIN_X, chartW - MARGIN_X)
    const mapY = (y: number) => fit(y, min(data), max(data), chartH / 2, 0)

    const plottingData = mapIndexed((index, value) => [mapX(index), mapY(value)], data)


    return {
        'def': ['linearGradient', { id: 'linechartGrad', from, to }, gradients],
        'graph': ["polyline", { stroke: '$linechartGrad' }, [...plottingData]]
    }
}