customElements.define(
  "roving-tabindex",
  class RovingTabindex extends HTMLElement {
    static #DIRECTIONS = new Set(["vertical", "horizontal", "both", "grid"]);

    #observer = new MutationObserver(() => this.#collect());

    /** @type {NodeListOf<HTMLElement>} */
    #elements = this.querySelectorAll(":root");
    #focused = -1;

    focus() {
      this.#elements[this.#focused]?.focus();
    }

    /** @param {Event} evt */
    handleEvent(evt) {
      if (!(evt.target instanceof HTMLElement)) return;
      if (!new Set(this.#elements).has(evt.target)) return;

      switch (evt.type) {
        case "keydown":
          if (evt instanceof KeyboardEvent) this.#handleKeydown(evt);
          break;

        case "focusin":
          if (evt instanceof FocusEvent) this.#handleFocusIn(evt);
          break;

        case "rove":
          if (evt instanceof CustomEvent) this.#handleRove(evt);
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
    #handleKeydown(evt) {
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
    #handleFocusIn(evt) {
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
    #handleRove(evt) {
      let { rows: x, cols: y } = evt.detail;
      if (typeof x === "number" && Boolean(x)) this.#moveHorizontal(x);
      if (typeof y === "number" && Boolean(y)) this.#moveVertical(y);
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
      // get the currently focused element
      const focused = this.#elements[this.#focused];

      // remove tabindex from all the elements
      for (const el of this.#elements) {
        el.removeAttribute("tabindex");
      }

      // get the new elements
      const selector = this.getAttribute("selector") || ":root";
      this.#elements = this.querySelectorAll(selector);

      // update the index of the focused element
      this.#focused = [...this.#elements].indexOf(focused);

      // update the tabindex of the elements
      for (const el of this.#elements) {
        el.tabIndex = -1;
      }

      if (focused) focused.tabIndex = 0;
      else if (this.#elements[0]) this.#elements[0].tabIndex = 0;
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
