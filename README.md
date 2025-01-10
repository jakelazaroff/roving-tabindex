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

`<roving-tabindex>` isn't on NPM; download `roving-tabindex-0.3.0.js` and add it into your codebase.
The file exports a class with a static `register` method as the default export:

```js
import RovingTabindex from "./roving-tabindex-0.3.0.js";
RovingTabindex.register();
```
