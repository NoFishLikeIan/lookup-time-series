import { Subscription } from "@thi.ng/rstream"
import { dropdown, DropDownOption } from "@thi.ng/hdom-components"
import { map } from "@thi.ng/transducers"


const emitOnStream = (stream: Subscription<any, any>) => (e: Event) =>
    stream.next((<HTMLInputElement>e.target).value)

export const menu = (
    stream: Subscription<any, any>,
    title: string,
    items: DropDownOption[]
) =>
    map((x: any) =>
        dropdown(
            null,
            { class: "w-100", onchange: emitOnStream(stream) },
            [[<any>null, title, true], ...items],
            String(x)
        )
    )