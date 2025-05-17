# Roving tabindex

A simple [HTML web component](https://adactio.com/journal/20618) that implements the [roving tabindex pattern](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex) for building accessible menus and grids.

Wrap it around some markup and give it a selector to determine which elements become navigable!

```html
<roving-tabindex selector="button">
  <ul>
    <li><button>One</button></li>
    <li><button>Two</button></li>
    <li><button>Three</button></li>
  </ul>
</roving-tabindex>
```

# Installation

There are a few ways to install `<roving-tabindex>`.

If you're using a bundler, you can install it from npm:

```sh
npm install roving-tabindex
```

You can also import it from a CDN without installing anything:

```html
<script type="module" src="https://unpkg.com/roving-tabindex/roving-tabindex.js"></script>
```

Finally, you can "vendor" it by downloading `roving-tabindex.js` and add it into your codebase.

```js
import RovingTabindex from "./roving-tabindex.js";
RovingTabindex.define();
```
