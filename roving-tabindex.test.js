import { beforeEach, describe, expect, test } from "vitest";

import RovingTabindex from "./roving-tabindex.js";

/** @param {string} key */
function keydown(key) {
  let [modifier = "", press = ""] = key.split("+");
  if (!press) press = modifier;

  const event = new KeyboardEvent("keydown", {
    bubbles: true,
    key: press,
    ctrlKey: modifier.toLowerCase() === "ctrl",
  });

  document.activeElement?.dispatchEvent(event);
}

/** @param {RovingTabindex} rt */
function checkTabIndices(rt) {
  for (const el of rt.elements) expect(el.tabIndex).toBe(el === document.activeElement ? 0 : -1);
}

describe.sequential("keyboard navigation", () => {
  /**
   * @typedef {object} Suite
   * @property {string} dir
   * @property {string} html
   * @property {[start: string, key: string, end: string, loop: boolean, msg: string][]} tests
   */

  /** @type {Suite[]} */
  const suites = [
    {
      dir: "both",
      html: `
        <roving-tabindex selector="button">
          <button id="one">one</button>
          <button id="two">two</button>
          <button id="three">three</button>
        </roving-tabindex>
      `,
      tests: [
        ["#one", "ArrowRight", "#two", false, "moves focus forward on right"],
        ["#one", "ArrowDown", "#two", false, "moves focus forward on down"],
        ["#three", "ArrowLeft", "#two", false, "moves focus back on left"],
        ["#three", "ArrowUp", "#two", false, "moves focus back on up"],
        ["#three", "ArrowRight", "#three", false, "doesn't loop on right"],
        ["#three", "ArrowDown", "#three", false, "doesn't loop on down"],
        ["#one", "ArrowLeft", "#one", false, "doesn't loop on left"],
        ["#one", "ArrowUp", "#one", false, "doesn't loop on up"],
        ["#one", "End", "#three", false, "moves focus to end on end"],
        ["#three", "Home", "#one", false, "moves focus to start on home"],
        ["#three", "ArrowRight", "#one", true, "loops back to beginning on right"],
        ["#three", "ArrowDown", "#one", true, "loops back to beginning on down"],
        ["#one", "ArrowLeft", "#three", true, "loops back to end on left"],
        ["#one", "ArrowUp", "#three", true, "loops back to end on up"],
        ["#three", "End", "#three", true, "doesn't loop on end"],
        ["#one", "Home", "#one", true, "doesn't loop on home"],
      ],
    },
    {
      dir: "horizontal",
      html: `
        <roving-tabindex selector="button">
          <button id="one">one</button>
          <button id="two">two</button>
          <button id="three">three</button>
        </roving-tabindex>
      `,
      tests: [
        ["#one", "ArrowRight", "#two", false, "moves focus forward on right"],
        ["#one", "ArrowDown", "#one", false, "doesn't move focus on down"],
        ["#three", "ArrowLeft", "#two", false, "moves focus back on left"],
        ["#three", "ArrowUp", "#three", false, "doesn't move focus on up"],
        ["#three", "ArrowRight", "#three", false, "doesn't loop on right"],
        ["#three", "ArrowDown", "#three", false, "doesn't loop on down"],
        ["#one", "ArrowLeft", "#one", false, "doesn't loop on left"],
        ["#one", "ArrowUp", "#one", false, "doesn't loop on up"],
        ["#one", "End", "#three", false, "moves focus to end on end"],
        ["#three", "Home", "#one", false, "moves focus to start on home"],
        ["#three", "ArrowRight", "#one", true, "loops back to beginning on right"],
        ["#three", "ArrowDown", "#three", true, "doesn't loop on down"],
        ["#one", "ArrowLeft", "#three", true, "loops back to end on left"],
        ["#one", "ArrowUp", "#one", true, "doesn't loop on up"],
        ["#three", "End", "#three", true, "doesn't loop on end"],
        ["#one", "Home", "#one", true, "doesn't loop on home"],
      ],
    },
    {
      dir: "vertical",
      html: `
        <roving-tabindex selector="button">
          <button id="one">one</button>
          <button id="two">two</button>
          <button id="three">three</button>
        </roving-tabindex>
      `,
      tests: [
        ["#one", "ArrowRight", "#one", false, "doesn't move focus on right"],
        ["#one", "ArrowDown", "#two", false, "moves focus forward on down"],
        ["#three", "ArrowLeft", "#three", false, "doesn't move focus on left"],
        ["#three", "ArrowUp", "#two", false, "moves focus back on up"],
        ["#three", "ArrowRight", "#three", false, "doesn't loop on right"],
        ["#three", "ArrowDown", "#three", false, "doesn't loop on down"],
        ["#one", "ArrowLeft", "#one", false, "doesn't loop on left"],
        ["#one", "ArrowUp", "#one", false, "doesn't loop on up"],
        ["#one", "End", "#three", false, "moves focus to end on end"],
        ["#three", "Home", "#one", false, "moves focus to start on home"],
        ["#three", "ArrowRight", "#three", true, "doesn't loop on right"],
        ["#three", "ArrowDown", "#one", true, "loops back to beginning on down"],
        ["#one", "ArrowLeft", "#one", true, "doesn't loop on left"],
        ["#one", "ArrowUp", "#three", true, "loops back to end on up"],
        ["#three", "End", "#three", true, "doesn't loop on end"],
        ["#one", "Home", "#one", true, "doesn't loop on home"],
      ],
    },
    {
      dir: "grid",
      html: `
        <roving-tabindex selector="button" columns="3">
          <button id="a1">a1</button>
          <button id="a2">a2</button>
          <button id="a3">a3</button>
          <button id="b1">b1</button>
          <button id="b2">b2</button>
          <button id="b3">b3</button>
          <button id="c1">c1</button>
          <button id="c2">c2</button>
          <button id="c3">c3</button>
        </roving-tabindex>
      `,
      tests: [
        ["#b2", "ArrowRight", "#b3", false, "moves focus right on right"],
        ["#b2", "ArrowDown", "#c2", false, "moves focus down on down"],
        ["#b2", "ArrowLeft", "#b1", false, "moves focus left on left"],
        ["#b2", "ArrowUp", "#a2", false, "moves focus up on up"],
        ["#b1", "End", "#b3", false, "moves focus to end of row on end"],
        ["#b3", "Home", "#b1", false, "moves focus to start of row on home"],
        ["#a1", "Ctrl+End", "#c3", false, "moves focus to last cell on ctrl+end"],
        ["#c3", "Ctrl+Home", "#a1", false, "moves focus to first cell on ctrl+home"],
        ["#b3", "ArrowRight", "#b1", true, "loops back to first column on right"],
        ["#c3", "ArrowDown", "#a3", true, "loops back to first row on down"],
        ["#b1", "ArrowLeft", "#b3", true, "loops back to last column on left"],
        ["#a3", "ArrowUp", "#c3", true, "loops back to last row on up"],
        ["#b1", "End", "#b3", true, "doesn't loop on end"],
        ["#b3", "Home", "#b1", true, "doesn't loop on home"],
      ],
    },
  ];

  for (const suite of suites) {
    describe(suite.dir, () => {
      /** @type {RovingTabindex} */
      let rt;
      beforeEach(() => {
        document.body.innerHTML = suite.html;
        rt = /** @type {RovingTabindex} */ (document.querySelector("roving-tabindex"));
        rt.setAttribute("direction", suite.dir);
      });

      for (const [start, key, end, loop, message] of suite.tests) {
        test(`loop=${loop} ${message}`, () => {
          if (loop) rt.setAttribute("loop", "");
          /** @type {HTMLElement | null} */ (document.querySelector(start))?.focus();
          keydown(key);
          expect(document.activeElement).toBe(document.querySelector(end));
          checkTabIndices(rt);
        });
      }
    });
  }
});

describe.sequential("dom mutations", () => {
  /** @type {RovingTabindex} */
  let rt,
    /** @type {HTMLElement} */
    one,
    /** @type {HTMLElement} */
    two,
    /** @type {HTMLElement} */
    three;
  beforeEach(() => {
    document.body.innerHTML = `
    <roving-tabindex selector="button">
      <button id="one">one</button>
      <button id="two">two</button>
    </roving-tabindex>
  `;

    rt = /** @type {RovingTabindex} */ (document.querySelector("roving-tabindex"));
    one = /** @type {HTMLElement} */ (document.querySelector("#one"));
    two = /** @type {HTMLElement} */ (document.querySelector("#two"));

    three = document.createElement("button");
    three.id = "three";
    three.innerText = "three";
  });

  test("handles added elements", () => {
    two.focus();
    rt.append(three);

    document.activeElement?.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }),
    );

    expect(document.activeElement).toBe(two);
    checkTabIndices(rt);
  });

  test.skip("retains tabindex when elements are removed", () => {
    two.focus();
    rt.removeChild(two);

    expect(document.activeElement).toBe(one);
    // checkTabIndices(rt);
  });
});
