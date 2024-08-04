# prettier-plugin-css-color-to-rgb

A Prettier plugin to convert CSS color values to RGB format( or CSS named value if possible ) for consistency and compatibility.

## Installation

To install the plugin, use npm and add it to your project's devDependencies:

```sh
npm install --save-dev prettier-plugin-css-color-to-rgb
```

## Usage

To use the plugin with Prettier, add it to your Prettier configuration file (.prettierrc) as follows:

```json
{
    "plugins": ["prettier-plugin-css-color-to-rgb"]
}
```

## Features

-   **Automatic Conversion**: Automatically recognizes and converts color values to `rgb(red green blue[ / alpha])` format.
-   **Named Colors**: Converts color values that are equal to CSS named colors (e.g., `red`, `blue`, `transparent`) to their respective RGB values.

## Example

Here's an example of how the plugin transforms CSS color values:

```css
/* input */
:root {
    background-color: #ffe;
    color: rgb(0, 0, 0);
    border-color: rgb(240, 240, 240);
    box-shadow: 0 0 0 rgb(114 114 114 / 0%);
}

/* output */
:root {
    background-color: rgb(255 255 238);
    color: black;
    border-color: rgb(240 240 240);
    box-shadow: 0 0 0 transparent;
}
```
