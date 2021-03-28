/**
 *
 * line-blocks parsing library
 *
 */

//TODO add proper begin-end pair check

const fu = require("./func-utils");

const LC = {
  LINE: "line",
  LINE_NUMBER: "lineNumber",
  RESULT: "result",
  PARSER: "parser",
  LEXER: "lexer",
};

const LEXER = {
  INIT: "init",
  START_TAG: "startTag",
  END_TAG: "endTag",
  LINE: "line",
};

const initialLineContext = {};
initialLineContext[LC.LINE_NUMBER] = 0;
initialLineContext[LC.LINE] = "";

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
    consume: (lc) => {
      if (startTagRegExp.test(lc.line))
        return fu.setProp(LC.LEXER, LEXER.START_TAG, lc);
      if (endTagRegExp !== null && endTagRegExp.test(lc.line))
        return fu.setProp(LC.LEXER, LEXER.END_TAG, lc);

      return fu.setProp(LC.LEXER, LEXER.LINE, lc);
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
        Parser.createInitialLineContext()
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
    // fu.log(lc);

    let pState = lc[LC.PARSER];

    //fu.log("line: ", `'${lc.line}'`);
    if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (lc[LC.LEXER] === LEXER.START_TAG) {
        //fu.log("START TAG");
        pState.beginBlockLineNum = lc[LC.LINE_NUMBER] + 1;
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
      if (lc[LC.LEXER] === LEXER.END_TAG) {
        //fu.log("END TAG");
        pState.type = "endTag";
        pState.endTagLine = lc.line;
        lc = this.callbacks.endTagCB(lc);
        lc[LC.PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
        lc[LC.PARSER].startTagLine = null;
      } else {
        //fu.log("BLOCK");
        pState.type = "block";
        lc = this.callbacks.blockCB(lc);
      }
    }

    if (!fu.nullOrUndefined(lc[LC.PARSER].out)) {
      return appendToResult(lc);
    }
    return lc;
  }

  static createInitialLineContext = () =>
    fu.compose3(
      fu.setProp(LC.RESULT, []),
      fu.setProp(LC.PARSER, initialParserState),
      fu.setProp(LC.LEXER, LEXER.INIT)
    )(initialLineContext);
}

module.exports = {
  Parser,
  Tags,
};
