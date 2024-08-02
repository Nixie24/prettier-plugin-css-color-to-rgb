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

function toRGB(source: string) {
    const colored = color(source);

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

                                (node as unknown as parseValue.WordNode).value =
                                    toRGB(source);
                                (node as unknown as parseValue.WordNode).type =
                                    "word";
                            } catch {}
                        } else if (node.type === "word") {
                            try {
                                node.value = toRGB(node.value);
                            } catch {}
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
