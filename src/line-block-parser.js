/**
 *
 * line-blocks parsing library
 *
 */

const fu = require("./func-utils");

const PROP_LINE = "line";
const PROP_LINE_NUMBER = "lineNumber";
const PROP_RESULT = "result";
const PROP_PARSER = "parser";

const initialLineContext = {};
initialLineContext[PROP_LINE_NUMBER] = 0;
initialLineContext[PROP_LINE] = "";

const NO_BLOCK_BEGIN = -1;

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
};

const defaultCallback = (lineContext) => null;

const simpleBlockCallback = (lineContext) => lineContext.line;

const defaultBlockCallback = (lineContext) => {
  return { num: lineContext.lineNumber, out: lineContext.line };
};

class Parser {
  static defaultCallbacks() {
    return {
      beginMark: defaultCallback,
      endMark: defaultCallback,
      block: defaultBlockCallback,
      notBlock: defaultCallback,
    };
  }

  constructor(beginkMark, endMark) {
    this.beginkMark = beginkMark;
    this.endMark = endMark;
    this.callbacks = Parser.defaultCallbacks();
  }

  static create(beginkMark, endMark) {
    return new Parser(beginkMark, endMark);
  }

  onBeginMark(callback) {
    this.callbacks.beginMark = callback;
    return this;
  }

  onEndMark(callback) {
    this.callbacks.endMark = callback;
    return this;
  }

  onBlock(callback) {
    this.callbacks.block = callback;
    return this;
  }

  onNotBlock(callback) {
    this.callbacks.notBlock = callback;
    return this;
  }

  setCallbacks(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    return this;
  }

  parseLines(lines) {
    const pt = this._getParserTools();
    return lines.reduce(
      pt.parserReducer,
      pt.createInitialLineContext(initialLineContext)
    ).result;
  }

  static consumeLine(lineContext, line) {
    return fu.compose2(
      fu.overProp(PROP_LINE_NUMBER, (x) => x + 1),
      fu.setProp(PROP_LINE, line)
    )(lineContext);
  }

  _getParserTools() {
    return {
      createInitialLineContext: fu.compose2(
        fu.setProp(PROP_RESULT, []),
        fu.setProp(PROP_PARSER, initialParserState)
      ),

      parserReducer: (lineContext, line) => {
        lineContext = Parser.consumeLine(lineContext, line);
        //const state = pState(lineContext);
        // if (state.beginBlockLineNum === NO_BLOCK_BEGIN) {
        // } else {
        // }
        return fu.overProp(
          PROP_RESULT,
          (arr) => [...arr, this.callbacks.block(lineContext)],
          lineContext
        );
      },
    };
  }
}

module.exports = {
  initialLineContext,
  simpleBlockCallback,
  Parser,
};
