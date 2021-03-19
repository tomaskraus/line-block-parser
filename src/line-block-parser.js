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

const setParserState = fu.curry3((propName, value, lineContext) => {
  return overParserState(propName, (_) => value, lineContext);
});

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

const infoDecorator = (lineContext) => {
  return {
    lineNumber: lineContext[PROP_LINE_NUMBER],
    type: lineContext[PROP_PARSER].type,
    line: lineContext[PROP_LINE],
  };
};

const plainAccumulatorDecorator = (lineContext) => lineContext[PROP_PARSER].acc;

const infoAccumulatorDecorator = (lineContext) => {
  return {
    startLineNumber: lineContext[PROP_PARSER].beginBlockLineNum,
    startTagLine: lineContext[PROP_PARSER].startTagLine,
    endTagLine: lineContext[PROP_PARSER].endTagLine,
    data: lineContext[PROP_PARSER].acc,
  };
};

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

const mode = {
  PLAIN_FLAT_ALL: {
    startTagCB: plainCallback,
    endTagCB: plainCallback,
    blockCB: plainCallback,
    notBlockCB: plainCallback,
  },
  PLAIN_FLAT_BLOCK: {
    startTagCB: plainCallback,
    endTagCB: plainCallback,
    blockCB: plainCallback,
    notBlockCB: emptyCallback,
  },
  PLAIN_FLAT_NOT_BLOCK: {
    startTagCB: emptyCallback,
    endTagCB: emptyCallback,
    blockCB: emptyCallback,
    notBlockCB: plainCallback,
  },
  INFO_FLAT_ALL: {
    startTagCB: infoCallback,
    endTagCB: infoCallback,
    blockCB: infoCallback,
    notBlockCB: infoCallback,
  },
  PLAIN_GROUP_BLOCK: {
    startTagCB: emptyTheAccumulatorCallback,
    endTagCB: flushAccumulatorCallback(plainAccumulatorDecorator),
    blockCB: addToAccumulatorCallback(plainDecorator),
    notBlockCB: emptyCallback,
  },
  INFO_GROUP_BLOCK: {
    startTagCB: emptyTheAccumulatorCallback,
    endTagCB: flushAccumulatorCallback(infoAccumulatorDecorator),
    blockCB: addToAccumulatorCallback(infoDecorator),
    notBlockCB: emptyCallback,
  },
};

class Parser {
  static defaultCallbacks() {
    return mode.PLAIN_GROUP_BLOCK;
  }

  constructor(startTag, endTag) {
    this.startTag = startTag;
    this.endTag = endTag;
    this.callbacks = Parser.defaultCallbacks();
  }

  static create(startTag, beginTag) {
    return new Parser(startTag, beginTag);
  }

  setMode(callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
    return this;
  }

  parseLines(lines) {
    return this.flush(
      lines.reduce(
        this.parserReducer.bind(this), //bind to preserve context
        Parser.initialLineContext()
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

  flush = (lineContext) =>
    lineContext[PROP_PARSER].acc.length > 0
      ? fu.compose2(appendToResult, this.callbacks.endTagCB)(lineContext) //callbacks.endTagCB usually flushes the block
      : lineContext;

  parserReducer(lineContext, line) {
    let lc = Parser.consumeLine(line, lineContext);
    let pState = lc[PROP_PARSER];

    //fu.log("line: ", `'${lc.line}'`);
    if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (lc.line.trim() === this.startTag) {
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
      if (lc.line.trim() === this.endTag) {
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

  static initialLineContext = () =>
    fu.compose2(
      fu.setProp(PROP_RESULT, []),
      fu.setProp(PROP_PARSER, initialParserState)
    )(initialLineContext);
}

module.exports = {
  Parser,
  mode,
};
