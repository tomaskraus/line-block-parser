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
  acc: [],
  out: null,
};

// overParserState :: string -> (a -> b) -> lineContext -> lineContext
const overParserState = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[PROP_PARSER]);
  return fu.setProp(PROP_PARSER, newParserState, lineContext);
});

// setParserOutput :: a -> lineContext -> lineContext
const setParserOutput = fu.curry2((value, lineContext) =>
  overParserState("out", (_) => value, lineContext)
);

const infoCallback = (lineContext) =>
  setParserOutput(
    { num: lineContext.lineNumber, out: lineContext.line },
    lineContext
  );

const defaultCallback = (lineContext) =>
  setParserOutput(lineContext[PROP_LINE], lineContext);

class Parser {
  static defaultCallbacks() {
    return {
      beginMark: defaultCallback,
      endMark: defaultCallback,
      block: defaultCallback,
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
      pt.createInitialLineContextWithParser(initialLineContext)
    ).result;
  }

  static consumeLine(line, lineContext) {
    return fu.compose3(
      setParserOutput(null),
      fu.overProp(PROP_LINE_NUMBER, (x) => x + 1),
      fu.setProp(PROP_LINE, line)
    )(lineContext);
  }

  _getParserTools() {
    return {
      createInitialLineContextWithParser: fu.compose2(
        fu.setProp(PROP_RESULT, []),
        fu.setProp(PROP_PARSER, initialParserState)
      ),

      parserReducer: (lineContext, line) => {
        const lineContext2 = this.callbacks.block(
          Parser.consumeLine(line, lineContext)
        );

        // fu.log("lineContext2", lineContext2);

        //const state = pState(lineContext);
        // if (state.beginBlockLineNum === NO_BLOCK_BEGIN) {
        // } else {
        // }

        if (!fu.nullOrUndefined(lineContext2.parser.out)) {
          return fu.overProp(
            PROP_RESULT,
            (arr) => [...arr, lineContext2.parser.out],
            lineContext2
          );
        }
        return lineContext2;
      },
    };
  }
}

module.exports = {
  initialLineContext,
  defaultCallback,
  infoCallback,
  overParserState,
  Parser,
};
