# Roving tabindex

A simple [HTML web component](https://adactio.com/journal/20618) that implements the [roving tabindex pattern](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/#kbd_roving_tabindex) for building accessible menus and grids.

Wrap it around some markup and give it a selector to determine which elements become navigable!

```html
<script type="module" src="https://esm.sh/roving-tabindex"></script>
<roving-tabindex selector="button">
  <ul>
    <li><button>One</button></li>
    <li><button>Two</button></li>
    <li><button>Three</button></li>
  </ul>
</roving-tabindex>
```

`<roving-tabindex>` works especially well as progressive enhancement on menus that are already keyboard navigable with the tab key. It also works well in JavaScript framework apps, letting you easily create keyboard navigable toolbars and menus without managing state or focus yourself. Because it's a web component, it works with [every JavaScript framework](https://custom-elements-everywhere.com).

## Quick start

The easiest way to get started with `<roving-tabindex>` is by adding a `<script>` tag that imports it from a CDN:

```html
<script type="module" src="https://unpkg.com/roving-tabindex/roving-tabindex.js"></script>
```

It defines its custom element on import using the tag name `roving-tabindex`, so you can use it in your HTML with no further code!

Read on for more in-depth installation instructions.

## Installation

`<roving-tabindex>` is a dependency-free library.

### npm

You can install `<roving-tabindex>` from npm:

```sh
npm install roving-tabindex
```

Then just import it within your app:

```js
import "roving-tabindex";
```

### CDN

You can also import it from a CDN without installing anything:

```html
<script type="module" src="https://unpkg.com/roving-tabindex/roving-tabindex.js"></script>
```

### Vendoring

Finally, you can "vendor" it by downloading `roving-tabindex.js` and copying it into your codebase.

```js
<import RovingTabindex from "./roving-tabindex.js";>
```

This might not be the most popular installation method, but it's my favorite. It's the reason that `<roving-tabindex>` is a single plain JavaScript file with no dependencies: it will work in any frontend web project, with any framework and any build system (or none at all)!

## Usage

To use `<roving-tabindex>`, just wrap it around the elements for which you want arrow key navigation. Use the `selector` attribute to determine which descendant elements should be included.

```html
<roving-tabindex selector="button, a">
  <ul class="menu" role="toolbar" aria-label="toolbar-example">
    <li><button>One</button></li>
    <li><button>Two</button></li>
    <li><button>Three</button></li>
    <li><a href="#">Link</a></li>
  </ul>
</roving-tabindex>
```

Make sure you set [WAI-ARIA](https://www.w3.org/WAI/standards-guidelines/aria/)-related properties as appropriate. For example, the previous demo implements keyboard navigation described in the [toolbar pattern](https://www.w3.org/WAI/ARIA/apg/patterns/toolbar/), but `<roving-tabindex>` doesn't manage the `role` and `aria-label` attributes for you.

By default, the left/up and right/down arrow keys move forward and backward in the list, respectively, but you can set the `direction` attribute to "horizontal" or "vertical" to use only the corresponding set of arrow keys:

```html
<roving-tabindex selector="button, a" direction="horizontal">
  <ul class="menu" role="toolbar" aria-label="toolbar-example">
    <li><button>One</button></li>
    <li><button>Two</button></li>
    <li><button>Three</button></li>
    <li><a href="#">Link</a></li>
  </ul>
</roving-tabindex>
```

`<roving-tabindex>` can also be used to navigate in two dimensions by setting the direction attribute to "grid" and setting the `columns` attribute to the number of columns.

```html
<roving-tabindex selector="button" direction="grid" columns="3">
  <!-- row 1 -->
  <button>a1</button>
  <button>b1</button>
  <button>c1</button>

  <!-- row 2 -->
  <button>a2</button>
  <button>b2</button>
  <button>c2</button>

  <!-- row 3 -->
  <button>a3</button>
  <button>b3</button>
  <button>c3</button>
</roving-tabindex>
```

By default, `<roving-tabindex>` will stop navigating once you reach the end of the list (or, in a grid, the end of the row or column). Setting the `loop` attribute causes it to wrap around to the other end.

## Changing the tag name

By default, `<roving-tabindex>` registers itself as that tag name upon import. That means as soon as you import it, you can start using it on the page with no additional setup required:

```html
<script type="module" src="https://unpkg.com/roving-tabindex/roving-tabindex.js"></script>

<roving-tabindex selector="button">
  <!-- ... -->
</roving-tabindex>
````

If you'd rather use a different tag name, you can import it with the query string parameter `?define=tag-name`, where `tag-name` is whatever tag name you'd like. (Note that custom element tag names must include a hyphen.)

```html
<script type="module" src="https://unpkg.com/roving-tabindex/roving-tabindex.js?define=tag-name"></script>
````

If you'd prefer to control the registration yourself, you can import it with the query string parameter `?nodefine` and use the static method `define`:

```html
<script type="module">
  import RovingTabindex from "https://unpkg.com/roving-tabindex/roving-tabindex.js?nodefine";

  RovingTabindex.define("tag-name");
</script>
```

This will all work no matter what method you use to install `<roving-tabindex>`.
