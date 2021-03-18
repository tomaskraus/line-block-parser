/**
 *
 * line-blocks parsing library
 *
 */

//TODO add header to INFO_GROUP_BLOCK mode

//TODO add proper begin-end pair check

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

const setParserState = fu.curry3((propName, value, lineContext) => {
  return overParserState(propName, (_) => value, lineContext);
});

// setParserOutput :: a -> lineContext -> lineContext
const setParserOutput = fu.curry2((value, lineContext) =>
  overParserState("out", (_) => value, lineContext)
);

const plainDecorator = (lineContext) => lineContext[PROP_LINE];

const infoDecorator = (lineContext) => {
  return {
    lineNumber: lineContext[PROP_LINE_NUMBER],
    type: lineContext[PROP_PARSER].type,
    line: lineContext[PROP_LINE],
  };
};

const flatCallback = (decorator) => (lineContext) =>
  setParserOutput(decorator(lineContext), lineContext);

const emptyCallback = (lineContext) => lineContext;

const infoCallback = flatCallback(infoDecorator);

const plainCallback = flatCallback(plainDecorator);

const addToAccumulatorCallback = (decorator) => (lineContext) =>
  overParserState(
    "acc",
    (acc) => [...acc, decorator(lineContext)],
    lineContext
  );

const consumeAccumulatorCallback = (lineContext) =>
  setParserOutput(lineContext[PROP_PARSER].acc, lineContext);

const emptyAccumulatorCallback = setParserState("acc", []);

const mode = {
  PLAIN_FLAT_ALL: {
    beginMark: plainCallback,
    endMark: plainCallback,
    block: plainCallback,
    notBlock: plainCallback,
  },
  PLAIN_FLAT_BLOCK: {
    beginMark: plainCallback,
    endMark: plainCallback,
    block: plainCallback,
    notBlock: emptyCallback,
  },
  PLAIN_FLAT_NOT_BLOCK: {
    beginMark: emptyCallback,
    endMark: emptyCallback,
    block: emptyCallback,
    notBlock: plainCallback,
  },
  INFO_FLAT_ALL: {
    beginMark: infoCallback,
    endMark: infoCallback,
    block: infoCallback,
    notBlock: infoCallback,
  },
  PLAIN_GROUP_BLOCK: {
    beginMark: emptyAccumulatorCallback,
    endMark: consumeAccumulatorCallback,
    block: addToAccumulatorCallback(plainDecorator),
    notBlock: emptyCallback,
  },
  INFO_GROUP_BLOCK: {
    beginMark: emptyAccumulatorCallback,
    endMark: consumeAccumulatorCallback,
    block: addToAccumulatorCallback(infoDecorator),
    notBlock: emptyCallback,
  },
};

class Parser {
  static defaultCallbacks() {
    return mode.PLAIN_GROUP_BLOCK;
  }

  constructor(beginMark, endMark) {
    this.beginMark = beginMark;
    this.endMark = endMark;
    this.callbacks = Parser.defaultCallbacks();
  }

  static create(beginkMark, endMark) {
    return new Parser(beginkMark, endMark);
  }

  setMode(callbacks) {
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
  Parser,
  mode,
};
