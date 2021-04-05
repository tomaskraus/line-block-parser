/**
 *
 * line-blocks parsing library
 *
 */

//TODO add proper begin-end pair check
//TODO add input param type check

const fu = require("./func-utils");

//---------------------------------------------------------------------------------------------

const LC = {
  LINE: "line",
  LINE_NUMBER: "lineNumber",
  PARSER: "parser",
  ACCUM: "accum",
  DATA: "data",
  ERRORS: "errors",
};

const initialLineContext = () => {
  const ilc = {};
  ilc[LC.LINE_NUMBER] = 0;
  ilc[LC.LINE] = null;
  // ilc[LC.PARSER] = null;
  // ilc[LC.ACCUM] = null;
  ilc[LC.DATA] = [];
  ilc[LC.ERRORS] = [];
  return ilc;
};

//---------------------------------------------------------------------------------------------

const Tags = {
  js_block: {
    start: /^\s*\/\*(.*)$/,
    end: /^(.*)\*\/\s*$/,
  },
  js_line: {},
};

const LEXER = {
  INIT: "init",
  START_TAG: "startTag",
  END_TAG: "endTag",
  LINE: "line",
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
//---------------------------------------------------------------------------------------------

const NO_BLOCK_BEGIN = -1;

const P_STATE = {
  INIT: "init",
  IN_BLOCK: "inBlock",
  OUT_OF_BLOCK: "outOfBlock",
};

const initialParserState = () => ({
  beginBlockLineNum: NO_BLOCK_BEGIN,
  beginNotBlockLineNum: 1,
  startTagLine: null,
  endTagLine: null,
  state: P_STATE.INIT,
  lineType: null, //from lexer
});

// overParserProp :: string -> (a -> b) -> lineContext -> lineContext
const overParserProp = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[LC.PARSER]);
  return fu.setProp(LC.PARSER, newParserState, lineContext);
});

const setParserProp = fu.curry3((propName, value, lineContext) =>
  overParserProp(propName, (_) => value, lineContext)
);

//========================================================================================

const consumeLine = fu.curry2((line, lineContext) =>
  fu.compose2(
    fu.overProp(LC.LINE_NUMBER, (x) => x + 1),
    fu.setProp(LC.LINE, line)
  )(lineContext)
);

const createReducer = (lexer, parserEngine, accumulator) => (
  lineContext,
  line
) =>
  fu.compose3(
    accumulator.consume,
    parserEngine,
    fu.compose2(lexer.consume, consumeLine(line))
  )(lineContext);

const createPairParserEngine = () => (lc) => {
  //fu.log("engine accum: ", accum);

  let pState = lc[LC.PARSER];
  pState.lineType = lc.line.type;

  // fu.log("lc: ", lc);
  if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
    if (lc.line.type === LEXER.START_TAG) {
      //fu.log("START TAG");
      pState.state = P_STATE.IN_BLOCK;
      pState.beginBlockLineNum = lc[LC.LINE_NUMBER] + 1;
      lc[LC.PARSER].beginNotBlockLineNum = NO_BLOCK_BEGIN;
      pState.startTagLine = lc.line.data;
      pState.endTagLine = null;

      return lc;
    } else {
      //fu.log("NOT BLOCK");
      pState.state = P_STATE.OUT_OF_BLOCK;

      return lc;
    }
  } else {
    if (lc.line.type === LEXER.END_TAG) {
      //fu.log("END TAG");
      pState.endTagLine = lc.line.data;

      lc[LC.PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
      lc[LC.PARSER].beginNotBlockLineNum = lc[LC.LINE_NUMBER] + 1;
      lc[LC.PARSER].startTagLine = null;
      lc[LC.PARSER].endTagLine = null;
      return lc;
    } else {
      //fu.log("BLOCK");
      pState.state = P_STATE.IN_BLOCK;

      return lc;
    }
  }
};

//========================================================================================

const initialAccumState = () => ({
  state: "init",
  data: [],
});

const getAcc = (lineContext) => lineContext[LC.ACCUM].data;

const clearAcc = (lineContext) =>
  fu.setProp(LC.ACCUM, initialAccumState(), lineContext);

//flushAccum :: (a -> b) -> a -> lineContext -> lineContext
const flushAccum = (resultCallback, data, lineContext) => {
  const cRes = resultCallback(data);
  return fu.compose2(
    // fu.tapLog("maac after"),
    clearAcc,
    fu.overProp(LC.DATA, (arr) =>
      fu.nullOrUndefined(cRes) ? arr : [...arr, cRes]
    )
  )(lineContext);
};

//----------------------------------------------------------------------------------------

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  lineType: lineContext[LC.LINE].type,
  state: lineContext[LC.PARSER].state,
  data,
});

//----------------------------------------------------------------------------------------

const groupedParserDecorator = (AccumulatorData, lineContext) => ({
  state: lineContext[LC.PARSER].state,
  startLineNumber:
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK
      ? lineContext[LC.PARSER].beginBlockLineNum
      : lineContext[LC.PARSER].beginNotBlockLineNum,
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  data: AccumulatorData,
});

const plainParserDecorator = (data, _) => data.data;

//----------------------------------------------------------------------------------------
const createAccum = (groupedFlag, resultCallback) => {
  const accObj = {};

  accObj.flush = (additionalData, lineContext) => {
    if (additionalData !== null) {
      return flushAccum(
        resultCallback,
        infoParserDecorator(additionalData.data, lineContext),
        lineContext
      );
    }
    return getAcc(lineContext).length > 0
      ? flushAccum(resultCallback, getAcc(lineContext), lineContext)
      : lineContext;
  };

  accObj.consume = (lineContext) => {
    if (!groupedFlag) {
      return accObj.flush(lineContext[LC.LINE], lineContext);
    }
  };

  return accObj;
};

//----------------------------------------------------------------------------------------

const isValidToFlush = (lineContext) => {
  if (
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK &&
    lineContext[LC.PARSER].beginBlockLineNum === NO_BLOCK_BEGIN
  ) {
    return false;
  }
  return lineContext[LC.PARSER].state != P_STATE.INIT;
};

//========================================================================================

const defaultResultCallback = fu.id;

const DEFAULT_SETTINGS = {
  GROUPING: true,
  PARSER_TYPE: "pair",
};

class Parser {
  static initialLineContext = () =>
    fu.compose3(
      fu.setProp(LC.DATA, []),
      fu.setProp(LC.ACCUM, initialAccumState()),
      fu.setProp(LC.PARSER, initialParserState())
    )(initialLineContext());

  constructor(startTagRegExp, endTagRegExp, isGrouped, resultCallback) {
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
    this.parserEngine = createPairParserEngine();
    this.accum = createAccum(isGrouped, resultCallback);
    this.reducer = createReducer(this.lexer, this.parserEngine, this.accum);
  }

  static create(
    startTagRegExp,
    endTagRegExp,
    isGrouped = DEFAULT_SETTINGS.GROUPING,
    resultCallback = defaultResultCallback
  ) {
    return new Parser(startTagRegExp, endTagRegExp, isGrouped, resultCallback);
  }

  flush(lineContext) {
    //fu.log("--- before PARSER flush data:", lineContext);
    const { errors, data } = this.accum.flush(null, lineContext);
    return { errors, data };
  }

  parseLines(lines) {
    const resCtx = lines.reduce(
      this.reducer.bind(this), //bind to preserve context
      Parser.initialLineContext()
    );
    //fu.log("-- -- --BEFORE FLUSH:", resCtx);
    return this.flush(resCtx);
  }
}

//========================================================================================

module.exports = {
  Parser,
  Tags,
};

//----------------------------------------------------

// const lc = Parser.createInitialLineContext(createAccum());
// fu.log("initialContext accm:", getAccValue(lc));
// const lc2 = overAcc((arr) => [...arr, 123], lc);
// fu.log("new accm: ", lc2);
