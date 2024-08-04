import color from "color";
import colorName from "color-name";
import postcss from "postcss";
import parseValue from "postcss-value-parser";
import type { ParserOptions, Plugin } from "prettier";
import prettierPostcss from "prettier/parser-postcss";

function getKeyword([r, g, b, a]: [number, number, number, number]):
    | keyof typeof colorName
    | "transparent"
    | null {
    if (a === 0) return "transparent";
    if (a === 1)
        for (const [name, [r2, g2, b2]] of Object.entries(colorName)) {
            if (r === r2 && g === g2 && b === b2)
                return name as keyof typeof colorName;
        }
    return null;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

function toRGB(source: string) {
    let colored: color;

    try {
        colored = color(source);
    } catch {
        try {
            const hwbReg =
                /^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:,?\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/;

            const matched = source.match(hwbReg);

            if (!matched) return null;

            const alpha = parseFloat(matched[4]);
            const h = ((parseFloat(matched[1]) % 360) + 360) % 360;
            const w = clamp(parseFloat(matched[2]), 0, 100);
            const b = clamp(parseFloat(matched[3]), 0, 100);
            const a = clamp(isNaN(alpha) ? 1 : alpha, 0, 1);

            colored = color.hwb(h, w, b, a);
        } catch {
            return null;
        }
    }

    const rgbObject = colored.rgb().object();

    const { r, g, b } = rgbObject;
    const alpha = rgbObject.alpha ?? 1;

    const keyword = getKeyword([r, g, b, alpha]);

    if (keyword) return keyword;

    let rgbFunction = `rgb(${r} ${g} ${b}`;
    if (alpha === 1) rgbFunction += ")";
    else {
        let num = (alpha * 100).toFixed(2);
        while (num.includes(".") && (num.at(-1) === "0" || num.at(-1) === "."))
            num = num.slice(0, -1);
        rgbFunction += ` / ${num}%)`;
    }
    return rgbFunction;
}

async function parseColor(text: string, options: ParserOptions<any>) {
    const parsed = await postcss()
        .process(text, {
            from: undefined,
        })
        .then((result) => {
            result.root.walkDecls((decl) => {
                decl.value = parseValue(decl.value)
                    .walk((node) => {
                        if (node.type === "function") {
                            try {
                                const source = decl.value.slice(
                                    node.sourceIndex,
                                    node.sourceEndIndex
                                );

                                const rgb = toRGB(source);

                                if (rgb) {
                                    (
                                        node as unknown as parseValue.WordNode
                                    ).value = rgb;
                                    (
                                        node as unknown as parseValue.WordNode
                                    ).type = "word";
                                }
                            } catch {}
                        } else if (node.type === "word") {
                            const rgb = toRGB(node.value);

                            if (rgb) node.value = rgb;
                        }
                    })
                    .toString();
            });

            return result.root.toString();
        });

    return prettierPostcss.parsers.css.parse(parsed, options);
}

export default {
    parsers: {
        css: {
            ...prettierPostcss.parsers.css,
            parse: parseColor,
        },
    },
} satisfies Plugin;
