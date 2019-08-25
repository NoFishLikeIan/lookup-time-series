import { Subscription } from "@thi.ng/rstream"
import { dropdown, DropDownOption, title } from "@thi.ng/hdom-components"
import { map } from "@thi.ng/transducers"
import { identity } from "../core";


const emitOnStream = (stream: Subscription<any, any>, parsingFn: (n: string) => any = identity) => (e: Event) =>
    stream.next(parsingFn((<HTMLInputElement>e.target).value))

export const menu = (
    stream: Subscription<any, any>,
    title: string,
    items: DropDownOption[],
    parsingFn?: (n: string) => any
) =>
    map((x: any) =>
        dropdown(
            null,
            { class: "w-100", onchange: emitOnStream(stream, parsingFn) },
            [[<any>null, title, true], ...items],
            String(x)
        )
    )

const attribs = { class: 'ma2 pa2' }
export const h1 = title({ attribs })
export const h2 = title({ element: 'h2', attribs })