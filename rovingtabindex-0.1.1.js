customElements.define(
  "roving-tabindex",
  class RovingTabindex extends HTMLElement {
    static #DIRECTIONS = new Set(["vertical", "horizontal", "both", "grid"]);

    #observer = new MutationObserver(() => this.#collect());
    #elements = /** @type {HTMLElement[]} */ ([]);
    #focused = -1;

    get elements() {
      return this.#elements;
    }

    focus() {
      this.#elements[this.#focused]?.focus();
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

      const direction = this.getAttribute("direction");
      if (direction && RovingTabindex.#DIRECTIONS.has(direction)) return /** @type {Direction} */ (direction);

      return "both";
    }

    get #cols() {
      const cols = Number(this.getAttribute("columns")) || 0;
      return Math.max(0, Math.min(cols, this.#elements.length));
    }

    /** @param {KeyboardEvent} evt */
    #onkeydown(evt) {
      const direction = this.#direction;
      switch (evt.key) {
        case "ArrowLeft":
          evt.preventDefault();
          this.#moveHorizontal(-1);
          break;
        case "ArrowRight":
          evt.preventDefault();
          this.#moveHorizontal(1);
          break;
        case "ArrowUp":
          evt.preventDefault();
          this.#moveVertical(-1);
          break;
        case "ArrowDown":
          evt.preventDefault();
          this.#moveVertical(1);
          break;
        case "Home":
          evt.preventDefault();
          if (evt.ctrlKey && direction === "grid") this.#moveVertical(-Infinity);
          this.#moveHorizontal(-Infinity);
          break;
        case "End":
          evt.preventDefault();
          if (evt.ctrlKey && direction === "grid") this.#moveVertical(Infinity);
          this.#moveHorizontal(Infinity);
          break;
      }
    }

    /** @param {FocusEvent} evt */
    #onfocusin(evt) {
      if (!(evt.target instanceof HTMLElement)) return;

      const idx = [...this.#elements].indexOf(evt.target);
      if (idx === -1) return;

      for (const el of this.#elements) {
        el.tabIndex = -1;
      }

      evt.target.tabIndex = 0;
      this.#focused = idx;
    }

    /** @param {CustomEvent<{ rows?: number; cols?: number }>} evt */
    #onrove(evt) {
      let { rows, cols } = evt.detail;
      if (typeof cols === "number" && Boolean(cols)) this.#moveHorizontal(cols);
      if (typeof rows === "number" && Boolean(rows)) this.#moveVertical(rows);
    }

    /** @param {number} n */
    #moveHorizontal(n) {
      switch (this.#direction) {
        case "horizontal":
        case "both": {
          const last = this.#elements.length - 1;

          const target = this.#elements[Math.max(0, Math.min(this.#focused + n, last))];
          if (target) target.focus();
          break;
        }

        case "grid": {
          const last = this.#elements.length - 1;
          const cols = this.#cols;

          // current position
          const pos = Math.max(0, Math.min(this.#focused, last));
          // current row
          const row = Math.floor(pos / cols);

          // find the row offset
          const offset = row * cols;
          // find the next target element within the row
          const target = this.#elements[Math.max(offset, Math.min(pos + n, offset + cols - 1))];
          if (target) target.focus();
          break;
        }

        case "vertical":
          break;
      }
    }

    /** @param {number} n */
    #moveVertical(n) {
      switch (this.#direction) {
        case "vertical":
        case "both": {
          const last = this.#elements.length - 1;

          const target = this.#elements[Math.max(0, Math.min(this.#focused + n, last))];
          if (target) target.focus();
          break;
        }

        case "grid": {
          const last = this.#elements.length - 1;
          const cols = this.#cols;

          // current position
          const pos = Math.max(0, Math.min(this.#focused, last));
          // current row
          const row = Math.floor(pos / cols);
          // current column
          const col = pos - row * cols;

          // find the next target element
          const target = this.#elements[(row + n) * cols + col];
          if (target) target.focus();
          break;
        }

        case "horizontal":
          break;
      }
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

      // if the element that currently has focus is in the new set of elements, use that instead
      const active = /** @type {HTMLElement} */ (document.activeElement);
      if (new Set(this.#elements).has(active)) focused = active;

      // if neither the previously focused nor active element is in the new set, try to find an element with data-tabindex-0
      if (!focused) focused = this.#elements.find(el => "tabindex-0" in el.dataset);

      // if there is *still* no focused element, use the first element in the new set
      if (!focused) focused = this.#elements[0];

      // update the index of the focused element
      this.#focused = focused ? [...this.#elements].indexOf(focused) : -1;

      // update the tabindex of the elements
      for (const el of this.#elements) {
        el.tabIndex = -1;
      }

      // set the tabindex of the focused element to 0
      if (focused) focused.tabIndex = 0;
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
);
