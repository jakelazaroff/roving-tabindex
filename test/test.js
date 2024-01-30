customElements.define(
  "test-sandbox",
  class TestSandbox extends HTMLElement {
    /**
     * @param {HTMLSlotElement} slot
     * @returns {Element[]}
     */
    static unslot(slot) {
      return slot.assignedElements().flatMap(el => (el instanceof HTMLSlotElement ? TestSandbox.unslot(el) : el));
    }

    #shadow = this.attachShadow({ mode: "closed" });

    constructor() {
      super();

      this.#shadow.innerHTML = `
        <slot></slot>
        <iframe part="frame" srcdoc=""></iframe>
        <style>
          slot {
            display: none;
          }
        </style>
      `;

      // set the iframe sandbox attribute
      const sandbox = this.getAttribute("sandbox");
      if (sandbox) this.#iframe.setAttribute("sandbox", sandbox);
    }

    get window() {
      return this.#iframe.contentWindow;
    }

    get #iframe() {
      return /** @type {HTMLIFrameElement} */ (this.#shadow.querySelector("iframe"));
    }

    #render() {
      this.ready = new Promise(resolve => (this.#iframe.onload = resolve));

      const slot = this.#shadow.querySelector("slot");
      const slotted = slot ? TestSandbox.unslot(slot) : [];
      const contents = slotted.map(el => /** @type {Element} */ (el.cloneNode(true)));

      for (const el of contents) {
        if (el instanceof HTMLScriptElement || el instanceof HTMLStyleElement)
          el.type = el.type.replace(/^sandbox:?/, "");
      }

      const body = contents.map(el => el.outerHTML).join("\n");
      const lang = this.getAttribute("lang") || "en";

      this.#iframe.srcdoc = `
        <!DOCTYPE html>
        <html lang="${lang}">
          <body>
            ${body}
          </body>
        </html>
      `;

      return this.ready;
    }

    connectedCallback() {
      this.#render();
    }
  }
);

customElements.define(
  "test-block",
  class extends HTMLElement {
    #shadow = this.attachShadow({ mode: "closed" });

    constructor() {
      super();

      const name = this.getAttribute("name") || "";
      this.#shadow.innerHTML = `
        <slot name="test"></slot>

        <div class="ui">
          <h1>${name}</h1>

          <ul class="results">
          </ul>

          <test-sandbox>
            <slot></slot>
          </test-sandbox>
        </div>

        <svg id="symbol" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
          <symbol id="check" width="16" height="16" viewBox="0 0 16 16">
              <g fill="currentColor">
                <path d="M8 0C3.589 0 0 3.589 0 8s3.589 8 8 8 8-3.589 8-8-3.589-8-8-8Zm0 14c-3.309 0-6-2.691-6-6s2.691-6 6-6 6 2.691 6 6-2.691 6-6 6Z"/>
                <path d="M7 11a.997.997 0 0 1-.707-.293l-2-2a.999.999 0 1 1 1.414-1.414L7 8.586l3.293-3.293a.999.999 0 1 1 1.414 1.414l-4 4A.997.997 0 0 1 7 11Z"/
              ></g>
          </symbol>
          <symbol id="ex" width="16" height="16" viewBox="0 0 16 16">
            <g fill="currentColor">
              <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8Zm0 14c-3.3 0-6-2.7-6-6s2.7-6 6-6 6 2.7 6 6-2.7 6-6 6Z"/>
              <path d="m9.414 8 1.768-1.768a.5.5 0 0 0 0-.707l-.707-.707a.5.5 0 0 0-.707 0L8 6.586 6.232 4.818a.5.5 0 0 0-.707 0l-.707.707a.5.5 0 0 0 0 .707L6.586 8 4.818 9.768a.5.5 0 0 0 0 .707l.707.707a.5.5 0 0 0 .707 0L8 9.414l1.768 1.768a.5.5 0 0 0 .707 0l.707-.707a.5.5 0 0 0 0-.707L9.414 8Z"/>
            </g>
          </symbol>
          <symbol id="spinner" width="16" height="16" viewBox="0 0 16 16">
              <path fill="currentColor" d="M8 16a8 8 0 1 1 8-8 1 1 0 0 1-2 0 6 6 0 1 0-1.8 4.286 1 1 0 1 1 1.4 1.428A7.956 7.956 0 0 1 8 16z" />
          </symbol>
        </svg>

        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }

          :host {
            font-family: system-ui;
          }

          slot {
            display: none;
          }

          test-sandbox:not(.debug) {
            position: absolute;
            width: 0;
            height: 0;
            opacity: 0;
            overflow: hidden;
          }

          test-sandbox::part(frame) {
            resize: both;
          }

          .ui {
            display: flex;
            flex-direction: column;
            gap: 8px;
            padding: 16px;
            border: 1px solid #dddddd;
            border-radius: 8px;
          }

          h1 {
            font-size: 1.5rem;
          }

          .results {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .result {
            lisrt-style: none;
            display: grid;
            grid-template-columns: auto 1fr;
            align-items: center;
            gap: 0.5rem;
          }

          .result:has(.error:not(:empty)) {
            grid-template-rows: auto 1fr;
          }

          .result .error {
            grid-column: 2;
          }

          .result.pass {
            color: green;
          }

          .result.fail {
            color: red;
          }

         .result.pending svg {
            transform-origin: 50% 50%;
            animation: spin 1s infinite linear;
          }

          .error:empty {
            display: none;
          }

          #symbol {
            display: none;
          }

          @keyframes spin {
            from { transform: rotate(0) }
            to { transform: rotate(360deg) }
          }
       </style>
     `;

      const sandbox = this.#shadow.querySelector("test-sandbox");
      if (this.hasAttribute("debug")) sandbox.classList.add("debug");
    }

    async #test(code, sandbox, li) {
      try {
        await sandbox.window.run(code);
        li.classList.add("pass");
        li.querySelector(".icon").setAttribute("href", "#check");
      } catch (e) {
        sandbox.classList.add("debug");
        li.classList.add("fail");
        li.querySelector(".icon").setAttribute("href", "#ex");
        li.querySelector(".error").innerText = e;
        throw e;
      } finally {
        li.classList.remove("pending");
      }
    }

    async run() {
      await customElements.whenDefined("test-sandbox");
      const sandbox = this.#shadow.querySelector("test-sandbox");
      await sandbox.ready;

      sandbox.window.eval("AsyncFunction = async function () {}.constructor");
      sandbox.window.assert = function (result, msg) {
        if (result !== true) throw new Error(msg);
      };
      sandbox.window.tick = function (ms = 0) {
        return new Promise(resolve => setTimeout(resolve, ms));
      };

      sandbox.window.run = async function run(code) {
        const fn = sandbox.window.AsyncFunction(code);
        return fn();
      };

      const scripts = this.#shadow
        .querySelector("slot[name=test]")
        .assignedElements()
        .filter(el => el.tagName === "SCRIPT");

      const before = scripts.filter(el => el.type === "before");
      for (const script of before) {
        await sandbox.window.run(script.innerText);
      }

      const tests = scripts.filter(el => el.type === "test").map(el => el.innerText);
      let i = 0;
      const results = [];
      const lines = this.#shadow.querySelector(".results").children;
      for (const test of tests) {
        const li = lines[i++];
        const result = this.#test(test, sandbox, li);
        results.push(result);
        try {
          if (this.hasAttribute("sync")) await result;
        } catch {}
      }

      await Promise.all(results);
    }

    connectedCallback() {
      // find all test scripts
      const tests = this.#shadow
        .querySelector("slot[name=test]")
        .assignedElements()
        .filter(el => el.tagName === "SCRIPT" && el.type === "test");

      const results = [];
      for (const test of tests) {
        results.push(`
          <li class="result pending">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16"><use class="icon" href="#spinner" /></svg>
            <p>${test.getAttribute("test")}</p>
            <code class="error"></code>
          </li>
        `);
      }

      this.#shadow.querySelector(".results").innerHTML = results.join("\n");

      if (this.parentElement.tagName !== "TEST-SUITE") this.run();
    }
  }
);

customElements.define(
  "test-suite",
  class extends HTMLElement {
    async run() {
      await customElements.whenDefined("test-block");
      await customElements.whenDefined("test-sandbox");

      const blocks = [...this.querySelectorAll("test-block")].filter(el => el.parentElement === this);
      const results = [];
      for (const block of blocks) {
        const result = block.run();
        results.push(result);
        try {
          if (this.hasAttribute("sync")) await result;
        } catch {}
      }

      try {
        await Promise.all(results);
        this.setAttribute("status", "passed");
      } catch {
        this.setAttribute("status", "failed");
      }
    }

    connectedCallback() {
      this.setAttribute("status", "running");
      this.run();
    }
  }
);
