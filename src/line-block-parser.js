/**
 *
 * line-blocks parsing library
 *
 */

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
  startTagLine: null,
  endTagLine: null,
  acc: [],
  out: null,
  type: "init",
};

// overParserState :: string -> (a -> b) -> lineContext -> lineContext
const overParserState = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[PROP_PARSER]);
  return fu.setProp(PROP_PARSER, newParserState, lineContext);
});

const setParserState = fu.curry3((propName, value, lineContext) =>
  overParserState(propName, (_) => value, lineContext)
);

// setParserOutput :: a -> lineContext -> lineContext
const setParserOutput = fu.curry2((value, lineContext) =>
  overParserState("out", (_) => value, lineContext)
);

const appendToResult = (lineContext) =>
  fu.overProp(
    PROP_RESULT,
    (arr) => [...arr, lineContext[PROP_PARSER].out],
    lineContext
  );

const plainDecorator = (lineContext) => lineContext[PROP_LINE];

const infoDecorator = (lineContext) => ({
  lineNumber: lineContext[PROP_LINE_NUMBER],
  type: lineContext[PROP_PARSER].type,
  line: lineContext[PROP_LINE],
});

const plainAccumulatorDecorator = (lineContext) => lineContext[PROP_PARSER].acc;

const infoAccumulatorDecorator = (lineContext) => ({
  startLineNumber: lineContext[PROP_PARSER].beginBlockLineNum,
  startTagLine: lineContext[PROP_PARSER].startTagLine,
  endTagLine: lineContext[PROP_PARSER].endTagLine,
  data: lineContext[PROP_PARSER].acc,
});

const emptyCallback = fu.id;

const flatCallback = (decorator) => (lineContext) =>
  setParserOutput(decorator(lineContext), lineContext);

const infoCallback = flatCallback(infoDecorator);

const plainCallback = flatCallback(plainDecorator);

const addToAccumulatorCallback = (decorator) => (lineContext) =>
  overParserState(
    "acc",
    (acc) => [...acc, decorator(lineContext)],
    lineContext
  );

const emptyTheAccumulatorCallback = setParserState("acc", []);

const flushAccumulatorCallback = (decorator) => (lineContext) =>
  fu.compose2(emptyTheAccumulatorCallback, (lc) =>
    setParserOutput(decorator(lc), lc)
  )(lineContext);

// from: https://stackoverflow.com/questions/4371565/create-regexps-on-the-fly-using-string-variables
const escapeRegExp = (s) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

const Tags = {
  js_block: {
    start: /^\s*\/\*(.*)$/,
    end: /^(.*)\*\/\s*$/,
  },
  js_line: {},
};

class Parser {
  static mode = {
    BLOCK_PLAIN_FLAT: {
      startTagCB: plainCallback,
      endTagCB: plainCallback,
      blockCB: plainCallback,
      notBlockCB: emptyCallback,
    },
    BLOCK_PLAIN_GROUP: {
      startTagCB: emptyTheAccumulatorCallback,
      endTagCB: flushAccumulatorCallback(plainAccumulatorDecorator),
      blockCB: addToAccumulatorCallback(plainDecorator),
      notBlockCB: emptyCallback,
    },
    BLOCK_INFO_GROUP: {
      startTagCB: emptyTheAccumulatorCallback,
      endTagCB: flushAccumulatorCallback(infoAccumulatorDecorator),
      blockCB: addToAccumulatorCallback(infoDecorator),
      notBlockCB: emptyCallback,
    },
    NOTBLOCK_PLAIN_FLAT: {
      startTagCB: emptyCallback,
      endTagCB: emptyCallback,
      blockCB: emptyCallback,
      notBlockCB: plainCallback,
    },
    ALL_INFO_FLAT: {
      startTagCB: infoCallback,
      endTagCB: infoCallback,
      blockCB: infoCallback,
      notBlockCB: infoCallback,
    },
  };

  static defaultCallbacks() {
    return Parser.mode.BLOCK_INFO_GROUP;
  }

  constructor(startTagRegExp, endTagRegExp) {
    this.startTagRegExp = startTagRegExp;
    this.endTagRegExp = endTagRegExp;
    this.callbacks = Parser.defaultCallbacks();
  }

  static create(startTagRegExp, endTagRegExp) {
    return new Parser(startTagRegExp, endTagRegExp);
  }

  setMode(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    return this;
  }

  parseLines(lines) {
    return this.flush(
      lines.reduce(
        this.parserReducer.bind(this), //bind to preserve context
        Parser.createInitialLineContext()
      )
    )[PROP_RESULT];
  }

  static consumeLine(line, lineContext) {
    return fu.compose3(
      setParserOutput(null),
      fu.overProp(PROP_LINE_NUMBER, (x) => x + 1),
      fu.setProp(PROP_LINE, line)
    )(lineContext);
  }

  //considered the same effect as end-tag callback call, but only for non-empty accumulator
  flush = (lineContext) =>
    lineContext[PROP_PARSER].acc.length > 0
      ? fu.compose2(appendToResult, this.callbacks.endTagCB)(lineContext)
      : lineContext;

  parserReducer(lineContext, line) {
    let lc = Parser.consumeLine(line, lineContext);
    let pState = lc[PROP_PARSER];

    //fu.log("line: ", `'${lc.line}'`);
    if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (this.startTagRegExp.test(lc.line)) {
        //fu.log("START TAG");
        pState.beginBlockLineNum = lc[PROP_LINE_NUMBER] + 1;
        pState.startTagLine = lc.line;
        pState.endTagLine = null;
        pState.type = "startTag";
        lc = this.callbacks.startTagCB(lc);
      } else {
        //fu.log("NOT BLOCK");
        pState.type = "notBlock";
        lc = this.callbacks.notBlockCB(lc);
      }
    } else {
      if (this.endTagRegExp.test(lc.line)) {
        //fu.log("END TAG");
        pState.type = "endTag";
        pState.endTagLine = lc.line;
        lc = this.callbacks.endTagCB(lc);
        lc[PROP_PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
        lc[PROP_PARSER].startTagLine = null;
      } else {
        //fu.log("BLOCK");
        pState.type = "block";
        lc = this.callbacks.blockCB(lc);
      }
    }

    if (!fu.nullOrUndefined(lc[PROP_PARSER].out)) {
      return appendToResult(lc);
    }
    return lc;
  }

  static createInitialLineContext = () =>
    fu.compose2(
      fu.setProp(PROP_RESULT, []),
      fu.setProp(PROP_PARSER, initialParserState)
    )(initialLineContext);
}

module.exports = {
  Parser,
  Tags,
};
