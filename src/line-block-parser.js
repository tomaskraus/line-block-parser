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
  type: "init",
};

// overParserState :: string -> (a -> b) -> lineContext -> lineContext
const overParserState = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[PROP_PARSER]);
  return fu.setProp(PROP_PARSER, newParserState, lineContext);
});

const setParserState = fu.curry3((propName, fn, lineContext) => {
  return overParserState(propName, (_) => value, lineneContext);
});

// setParserOutput :: a -> lineContext -> lineContext
const setParserOutput = fu.curry2((value, lineContext) =>
  overParserState("out", (_) => value, lineContext)
);

const infoCallback = (lineContext) =>
  setParserOutput(
    {
      num: lineContext[PROP_LINE_NUMBER],
      type: lineContext[PROP_PARSER].type,
      out: lineContext[PROP_LINE],
    },
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

  constructor(beginMark, endMark) {
    this.beginMark = beginMark;
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
    )[PROP_RESULT];
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
        let lc = Parser.consumeLine(line, lineContext);
        let pState = lc[PROP_PARSER];

        //fu.log("line: ", `'${lc.line}'`);
        if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
          if (lc.line.trim() === this.beginMark) {
            //fu.log("BEGIN MARK");
            pState.beginBlockLineNum = lc[PROP_LINE_NUMBER] + 1;
            pState.type = "beginMark";
            lc = this.callbacks.beginMark(lc);
          } else {
            //fu.log("NOT BLOCK");
            pState.type = "notBlock";
            lc = this.callbacks.notBlock(lc);
          }
        } else {
          if (lc.line.trim() === this.endMark) {
            //fu.log("END MARK");
            pState.type = "endMark";
            lc = this.callbacks.endMark(lc);
            lc[PROP_PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
          } else {
            //fu.log("BLOCK");
            pState.type = "block";
            lc = this.callbacks.block(lc);
          }
        }

        // fu.log("lineContext2", lineContext2);

        // if (state.beginBlockLineNum === NO_BLOCK_BEGIN) {
        // } else {
        // }

        if (!fu.nullOrUndefined(lc[PROP_PARSER].out)) {
          return fu.overProp(
            PROP_RESULT,
            (arr) => [...arr, lc[PROP_PARSER].out],
            lc
          );
        }
        return lc;
      },
    };
  }
}

module.exports = {
  initialLineContext,
  defaultCallback,
  infoCallback,
  setParserState,
  overParserState,
  Parser,
};
