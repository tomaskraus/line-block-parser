/**
 *
 * line-blocks parsing library
 *
 */

//TODO add proper begin-end pair check

const fu = require("./func-utils");

const DEFAULTS = {
  PARSER_TYPE: "pair",
  GROUPING: false,
};

const LC = {
  LINE: "line",
  LINE_NUMBER: "lineNumber",
  PARSER: "parser",
  RESULT: "result",
};

const LEXER = {
  INIT: "init",
  START_TAG: "startTag",
  END_TAG: "endTag",
  LINE: "line",
};

const initialLineContext = {};
initialLineContext[LC.LINE_NUMBER] = 0;
initialLineContext[LC.LINE] = null;

const NO_BLOCK_BEGIN = -1;

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
  startTagLine: null,
  endTagLine: null,
  out: null,
  type: "init",
};

// overParserState :: string -> (a -> b) -> lineContext -> lineContext
const overParserState = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[LC.PARSER]);
  return fu.setProp(LC.PARSER, newParserState, lineContext);
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
    LC.RESULT,
    (arr) => [...arr, lineContext[LC.PARSER].out],
    lineContext
  );

const plainDecorator = (lineContext) => lineContext[LC.LINE];

const infoDecorator = (lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  type: lineContext[LC.PARSER].type,
  line: lineContext[LC.LINE],
});

const plainAccumulatorDecorator = (lineContext) => lineContext[LC.PARSER].acc;

const infoAccumulatorDecorator = (lineContext) => ({
  startLineNumber: lineContext[LC.PARSER].beginBlockLineNum,
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  data: lineContext[LC.PARSER].acc,
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

const createLexer = (startTagRegExp, endTagRegExp = null) => {
  return {
    // consume :: lineContext -> {...lineContext, line: {type: LEXER.TYPE, data: lineContext.line}}
    consume: (lc) => {
      if (startTagRegExp.test(lc.line))
        return fu.overProp(
          LC.LINE,
          (s) => ({ type: LEXER.START_TAG, data: s }),
          lc
        );
      if (endTagRegExp !== null && endTagRegExp.test(lc.line))
        return fu.overProp(
          LC.LINE,
          (s) => ({ type: LEXER.END_TAG, data: s }),
          lc
        );

      return fu.overProp(LC.LINE, (s) => ({ type: LEXER.LINE, data: s }), lc);
    },
  };
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
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
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
        Parser.createInitialLineContext(createAccum(DEFAULTS.GROUPING))
      )
    )[LC.RESULT];
  }

  static consumeLine = fu.curry2((line, lineContext) =>
    fu.compose3(
      setParserOutput(null),
      fu.overProp(LC.LINE_NUMBER, (x) => x + 1),
      fu.setProp(LC.LINE, line)
    )(lineContext)
  );

  //considered the same effect as end-tag callback call, but only for non-empty accumulator
  flush = (lineContext) =>
    lineContext[LC.PARSER].acc.length > 0
      ? fu.compose2(appendToResult, this.callbacks.endTagCB)(lineContext)
      : lineContext;

  parserReducer(lineContext, line) {
    let lc = fu.compose2(
      this.lexer.consume,
      Parser.consumeLine(line)
    )(lineContext);
    //fu.log(lc);

    let pState = lc[LC.PARSER];

    //fu.log("line: ", `'${lc.line}'`);
    if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (lc.line.type === LEXER.START_TAG) {
        //fu.log("START TAG");
        pState.beginBlockLineNum = lc[LC.LINE_NUMBER] + 1;
        pState.startTagLine = lc.line.data;
        pState.endTagLine = null;
        pState.type = "startTag";

        lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
        lc = this.callbacks.startTagCB(lc);
      } else {
        //fu.log("NOT BLOCK");
        pState.type = "notBlock";

        lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
        lc = this.callbacks.notBlockCB(lc);
      }
    } else {
      if (lc.line.type === LEXER.END_TAG) {
        //fu.log("END TAG");
        pState.type = "endTag";
        pState.endTagLine = lc.line.data;

        lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
        lc = this.callbacks.endTagCB(lc);

        lc[LC.PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
        lc[LC.PARSER].startTagLine = null;
      } else {
        //fu.log("BLOCK");
        pState.type = "block";

        lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
        lc = this.callbacks.blockCB(lc);
      }
    }

    if (!fu.nullOrUndefined(lc[LC.PARSER].out)) {
      return appendToResult(lc);
    }
    return lc;
  }

  static createInitialLineContext = (accumulatorObj) =>
    fu.compose3(
      fu.setProp(LC.RESULT, []),
      accumulatorObj.initialize,
      fu.setProp(LC.PARSER, initialParserState)
    )(initialLineContext);
}

const getAccValue = (lineContext) => lineContext[LC.PARSER].acc;
const overAcc = fu.curry2((fn, lc) => overParserState("acc", fn, lc));

//const accOutputCallback = (outputData, lineContext) =>

const createAccum = (groupingFlag) => ({
  initialize: (lineContext) => setParserState("acc", [], lineContext),
  append: fu.curry2((newValue, lineContext) => {
    if (getAccValue(lineContext).length === 0) {
      if (groupingFlag) {
      } else {
      }
    } else {
    }
    return;
  }),
  flush: (lineContext) => lineContext,
});

module.exports = {
  Parser,
  Tags,
};

//----------------------------------------------------

// const lc = Parser.createInitialLineContext(createAccum(DEFAULTS.GROUPING));
// fu.log(getAccValue(lc));
// const lc2 = overAcc((arr) => [...arr, 123], lc);
// fu.log(lc2);
