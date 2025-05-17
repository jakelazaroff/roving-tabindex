export default class RovingTabindex extends HTMLElement {
  static tag = "roving-tabindex";

  static define(tag = this.tag) {
    this.tag = tag;

    const name = customElements.getName(this);
    if (name) return console.warn(`${this.name} already defined as <${name}>!`);

    const ce = customElements.get(tag);
    if (!!ce && ce !== this) return console.warn(`<${tag}> already defined as ${ce.name}!`);

    customElements.define(tag, this);
  }

  static {
    const tag = new URL(import.meta.url).searchParams.get("define") || this.tag;
    if (tag !== "false") this.define(tag);
  }

  static #DIRECTIONS = new Set(["vertical", "horizontal", "both", "grid"]);

  #observer = new MutationObserver(() => this.#collect());
  #elements = /** @type {HTMLElement[]} */ ([]);
  #focused = -1;

  get elements() {
    return this.#elements;
  }

  /** @override */
  focus() {
    this.#elements[this.#focused]?.focus();
  }

  /** @param {{ rows?: number; cols?: number }} to */
  rove({ rows, cols }) {
    if (typeof cols === "number" && Boolean(cols)) this.#moveCol(cols);
    if (typeof rows === "number" && Boolean(rows)) this.#moveRow(rows);
  }

  /** @param {Event} evt */
  handleEvent(evt) {
    if (!(evt.target instanceof HTMLElement)) return;
    if (!new Set(this.#elements).has(evt.target)) return;

    switch (evt.type) {
      case "keydown":
        if (evt instanceof KeyboardEvent) this.#onkeydown(evt);
        break;

      case "focusin":
        if (evt instanceof FocusEvent) this.#onfocusin(evt);
        break;

      case "rove":
        if (evt instanceof CustomEvent) this.#onrove(evt);
        break;
    }
  }

  get #direction() {
    /** @typedef {"horizontal" | "vertical" | "both" | "grid"} Direction */

    const dir = this.getAttribute("direction");
    if (dir && RovingTabindex.#DIRECTIONS.has(dir)) return /** @type {Direction} */ (dir);

    return "both";
  }

  get #loop() {
    return this.hasAttribute("loop");
  }

  get #cols() {
    const cols = Number(this.getAttribute("columns")) || this.#elements.length;
    return Math.max(0, Math.min(cols, this.#elements.length));
  }

  get #rows() {
    return Math.floor(this.#elements.length / this.#cols) || 0;
  }

  /**
   * @param {number} n
   * @param {boolean} [loop]
   */
  #moveRow(n, loop) {
    // number of columns
    const cols = this.#cols,
      // current column
      col = this.#focused % cols,
      // first column of current row
      start = this.#focused - col,
      // last column of current row
      end = start + this.#cols - 1;

    // target index
    const idx = this.#clamp(this.#focused + n, start, end, loop);

    const target = this.#elements[idx];
    if (target) target.focus();
  }

  /**
   * @param {number} n
   * @param {boolean} [loop]
   */
  #moveCol(n, loop) {
    // number of columns
    const cols = this.#cols,
      // number of rows
      rows = this.#rows,
      // current column
      col = this.#focused % cols,
      // current row
      row = Math.floor(this.#focused / rows);

    // target index
    const idx = col + this.#clamp(row + n, 0, rows - 1, loop) * cols;

    const target = this.#elements[idx];
    if (target) target.focus();
  }

  /** @param {KeyboardEvent} evt */
  #onkeydown(evt) {
    const dir = this.#direction;
    switch (evt.key) {
      case "ArrowLeft":
        evt.preventDefault();
        if (dir !== "vertical") this.#moveRow(-1);
        break;
      case "ArrowRight":
        evt.preventDefault();
        if (dir !== "vertical") this.#moveRow(+1);
        break;
      case "ArrowUp":
        evt.preventDefault();
        if (dir === "grid") this.#moveCol(-1);
        else if (dir !== "horizontal") this.#moveRow(-1);
        break;
      case "ArrowDown":
        evt.preventDefault();
        if (dir === "grid") this.#moveCol(1);
        else if (dir !== "horizontal") this.#moveRow(1);
        break;
      case "Home":
        evt.preventDefault();
        if (evt.ctrlKey && dir === "grid") this.#moveCol(Number.NEGATIVE_INFINITY, false);
        this.#moveRow(Number.NEGATIVE_INFINITY, false);
        break;
      case "End":
        evt.preventDefault();
        if (evt.ctrlKey && dir === "grid") this.#moveCol(Number.POSITIVE_INFINITY, false);
        this.#moveRow(Number.POSITIVE_INFINITY, false);
        break;
    }
  }

  /** @param {FocusEvent} evt */
  #onfocusin(evt) {
    if (!(evt.target instanceof HTMLElement)) return;

    const idx = this.#elements.slice().indexOf(evt.target);
    if (idx === -1) return;

    for (const el of this.#elements) {
      el.tabIndex = -1;
    }

    evt.target.tabIndex = 0;
    this.#focused = idx;
  }

  /** @param {CustomEvent<{ rows?: number; cols?: number }>} evt */
  #onrove(evt) {
    this.rove(evt.detail);
  }

  #collect() {
    // remove tabindex from all the elements
    for (const el of this.#elements) {
      el.removeAttribute("tabindex");
    }

    // get the last element that had focus
    /** @type {HTMLElement | undefined} */
    let focused = this.#elements[this.#focused];

    // get the new set of elements
    const selector = this.getAttribute("selector") || ":root";
    this.#elements = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(selector)]);

    // if the new set of elements no longer has the focused element, don't use it
    const els = new Set(this.#elements);
    if (focused && !els.has(focused)) focused = undefined;

    // if the element that currently has focus is in the new set of elements, use that instead
    const active = /** @type {HTMLElement} */ (document.activeElement);
    if (els.has(active)) focused = active;

    // if neither the previously focused nor active element is in the new set, try to find an element with data-tabindex-0
    if (!focused) focused = this.#elements.find((el) => "tabindex-0" in el.dataset);

    // if there is *still* no focused element, use the first element in the new set
    if (!focused) focused = this.#elements[0];

    // update the index of the focused element
    this.#focused = focused ? this.#elements.slice().indexOf(focused) : -1;

    // update the tabindex of the elements
    for (const el of this.#elements) {
      el.tabIndex = -1;
    }

    // set the tabindex of the focused element to 0
    if (focused) focused.tabIndex = 0;
  }

  /**
   * Clamps a number between two indices, optionally looping around
   * @param {number} n
   * @param {number} min
   * @param {number} max
   * @param {boolean} [loop]
   */
  #clamp(n, min, max, loop = this.#loop) {
    if (!loop) return Math.max(min, Math.min(n, max));

    const range = max - min + 1;
    return ((((n - min) % range) + range) % range) + min;
  }

  attributeChangedCallback() {
    this.#collect();
  }

  connectedCallback() {
    this.#collect();
    this.addEventListener("keydown", this);
    this.addEventListener("focusin", this);
    this.addEventListener("rove", this);
    this.#observer.observe(this, { subtree: true, childList: true });
  }

  disconnectedCallback() {
    this.removeEventListener("keydown", this);
    this.removeEventListener("focusin", this);
    this.removeEventListener("rove", this);

    // remove tabindex from all the elements
    for (const el of this.#elements) {
      el.removeAttribute("tabIndex");
    }

    // disconnect the mutation observer
    this.#observer.disconnect();
  }
}
