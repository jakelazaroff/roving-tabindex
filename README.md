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

There's no installation process; simply download `roving-tabindex-0.1.0.js` and link to it on your page.
