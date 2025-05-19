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
  #els = /** @type {HTMLElement[]} */ ([]);
  #focused = -1;

  get elements() {
    return this.#els;
  }

  /** @override */
  focus() {
    this.#els[this.#focused]?.focus();
  }

  /** @param {{ rows?: number; cols?: number }} to */
  rove({ rows = 0, cols = 0 }) {
    this.#moveCol(cols);
    this.#moveRow(rows);
  }

  /** @param {Event} evt */
  handleEvent(evt) {
    if (!(evt.target instanceof HTMLElement)) return;
    if (!new Set(this.#els).has(evt.target)) return;

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

  get #dir() {
    /** @typedef {"horizontal" | "vertical" | "both" | "grid"} Direction */

    const dir = this.getAttribute("direction");
    if (dir && RovingTabindex.#DIRECTIONS.has(dir)) return /** @type {Direction} */ (dir);

    return "both";
  }

  get #loop() {
    return this.hasAttribute("loop");
  }

  get #cols() {
    const dir = this.#dir;

    switch (dir) {
      case "grid":
        return Number(this.getAttribute("columns")) || this.#els.length;
      case "vertical":
        return 1;
      default:
        return this.#els.length;
    }
  }

  get #rows() {
    return Math.floor(this.#els.length / this.#cols) || 0;
  }

  get #col() {
    return this.#focused % this.#cols;
  }

  get #row() {
    return Math.floor(this.#focused / this.#cols);
  }

  /**
   * @param {number} n
   * @param {boolean} [loop]
   */
  #moveCol(n, loop) {
    if (n === 0) return;

    const start = this.#focused - this.#col,
      end = start + this.#cols;

    let idx = this.#clamp(this.#focused + n, start, end - 1, loop);
    let looped = !loop;
    let el = this.#els[idx];
    el?.focus();

    while (document.activeElement !== el) {
      if (start < idx && idx < end - 1) idx += Math.sign(n);
      else if (looped) return;
      else {
        looped = true;
        idx = idx < start ? end - 1 : start;
      }

      el = this.#els[idx];
      el?.focus();
      console.log("WHILE", document.activeElement, { start, end, idx, looped, el });
    }
  }

  /**
   * @param {number} n
   * @param {boolean} [loop]
   */
  #moveRow(n, loop) {
    if (n === 0) return;

    // number of columns
    const cols = this.#cols,
      // current column in first row
      start = this.#col,
      // current column in last row
      end = this.#rows * cols + start;

    let idx = this.#clamp(this.#focused + n * cols, start, end - 1, loop);
    let looped = !loop;
    let el = this.#els[idx];
    el?.focus();

    while (document.activeElement !== el) {
      if (start < idx && idx < end) idx += Math.sign(n) * cols;
      else if (looped) return;
      else {
        looped = true;
        idx = idx < start ? end - 1 : start;
      }

      el = this.#els[idx];
      el?.focus();
    }
  }

  /** @param {KeyboardEvent} ev */
  #onkeydown(ev) {
    const dir = this.#dir;
    switch (ev.key) {
      case "ArrowLeft":
        ev.preventDefault();
        if (dir !== "vertical") this.#moveCol(-1, this.#loop);
        break;
      case "ArrowRight":
        ev.preventDefault();
        if (dir !== "vertical") this.#moveCol(1, this.#loop);
        break;
      case "ArrowUp":
        ev.preventDefault();
        if (dir === "both") this.#moveCol(-1, this.#loop);
        else if (dir !== "horizontal") this.#moveRow(-1, this.#loop);
        break;
      case "ArrowDown":
        ev.preventDefault();
        if (dir === "both") this.#moveCol(1, this.#loop);
        else if (dir !== "horizontal") this.#moveRow(1, this.#loop);
        break;
      case "Home":
        ev.preventDefault();
        this.#moveCol(-this.#col, false);
        if (dir === "vertical" || (ev.ctrlKey && dir === "grid")) this.#moveRow(-this.#row, false);
        break;
      case "End":
        ev.preventDefault();
        this.#moveCol(this.#cols - 1 - this.#col, false);
        if (dir === "vertical" || (ev.ctrlKey && dir === "grid"))
          this.#moveRow(this.#rows - 1 - this.#row, false);
        break;
    }
  }

  /** @param {FocusEvent} ev */
  #onfocusin(ev) {
    if (!(ev.target instanceof HTMLElement)) return;

    const idx = this.#els.slice().indexOf(ev.target);
    if (idx === -1) return;

    for (const el of this.#els) {
      el.tabIndex = -1;
    }

    ev.target.tabIndex = 0;
    this.#focused = idx;
  }

  /** @param {CustomEvent<{ rows?: number; cols?: number }>} ev */
  #onrove(ev) {
    this.rove(ev.detail);
  }

  #collect() {
    // remove tabindex from all the elements
    for (const el of this.#els) {
      el.removeAttribute("tabindex");
    }

    // get the last element that had focus
    /** @type {HTMLElement | undefined} */
    let focused = this.#els[this.#focused];

    // get the new set of elements
    const selector = this.getAttribute("selector") || ":root";
    this.#els = /** @type {HTMLElement[]} */ ([...this.querySelectorAll(selector)]);

    // if the new set of elements no longer has the focused element, don't use it
    const els = new Set(this.#els);
    if (focused && !els.has(focused)) focused = undefined;

    // if the element that currently has focus is in the new set of elements, use that instead
    const active = /** @type {HTMLElement} */ (document.activeElement);
    if (els.has(active)) focused = active;

    // if neither the previously focused nor active element is in the new set, try to find an element with data-tabindex-0
    if (!focused) focused = this.#els.find((el) => "tabindex-0" in el.dataset);

    // if there is *still* no focused element, use the first element in the new set
    if (!focused) focused = this.#els[0];

    // update the index of the focused element
    this.#focused = focused ? this.#els.slice().indexOf(focused) : -1;

    // update the tabindex of the elements
    for (const el of this.#els) el.tabIndex = -1;

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
    for (const el of this.#els) {
      el.removeAttribute("tabIndex");
    }

    // disconnect the mutation observer
    this.#observer.disconnect();
  }
}
