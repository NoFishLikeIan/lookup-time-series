import { DropDownOption } from '@thi.ng/hdom-components'
import { map, range } from '@thi.ng/transducers';

type OPT = [string, DropDownOption[]]

export const AUTOCORR_SCALES_OPT: OPT = ['Scale AIC bars between',
    [
        ['abs', '0 and 1'],
        ['minmax', 'min and max']
    ]
]

export const LAGS: OPT = ['Lag periods',
    [...map((i: number): [string, string] => [String(i), String(i)], range(10, 50, 10))]
]