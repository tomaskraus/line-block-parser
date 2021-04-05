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
  DATA: "data",
  ERRORS: "errors",
};

const initialLineContext = () => {
  const ilc = {};
  ilc[LC.LINE_NUMBER] = 0;
  ilc[LC.LINE] = null;
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
  acc: [], //accumulator
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

const createReducer = (lexer, parserEngine) => (lineContext, line) =>
  fu.compose3(
    parserEngine,
    //fu.compose2(fu.tapLog("lc Before parseEngine:"), lexer.consume),
    lexer.consume,
    consumeLine(line)
    // fu.compose2(Parser.consumeLine(line), fu.id)
  )(lineContext);

const createPairParserEngine = (accum) => (lc) => {
  //fu.log("engine accum: ", accum);

  let pState = lc[LC.PARSER];
  pState.lineType = lc.line.type;

  // fu.log("lc: ", lc);
  if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
    if (lc.line.type === LEXER.START_TAG) {
      //pState2.beginNotBlockLineNum = NO_BLOCK_BEGIN;
      let lc2 = accum.flush(null, lc);
      //fu.log("START TAG");
      let pState2 = lc2[LC.PARSER];
      pState2.lineType = lc2.line.type;

      pState2.beginBlockLineNum = lc2[LC.LINE_NUMBER] + 1;
      pState2.startTagLine = lc2.line.data;
      pState2.endTagLine = null;
      pState2.state = P_STATE.IN_BLOCK;

      return accum.start(lc2.line, lc2);
    } else {
      //fu.log("NOT BLOCK");
      pState.state = P_STATE.OUT_OF_BLOCK;

      return accum.append(lc.line, lc);
    }
  } else {
    if (lc.line.type === LEXER.END_TAG) {
      //fu.log("END TAG");
      pState.state = P_STATE.IN_BLOCK;
      pState.endTagLine = lc.line.data;

      lc = accum.flush(lc.line, lc);
      //fu.log("END lc: ", lc);

      lc[LC.PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
      lc[LC.PARSER].beginNotBlockLineNum = lc[LC.LINE_NUMBER] + 1;
      lc[LC.PARSER].startTagLine = null;
      lc[LC.PARSER].endTagLine = null;
      return lc;
    } else {
      //fu.log("BLOCK");
      pState.state = P_STATE.IN_BLOCK;

      return accum.append(lc.line, lc);
    }
  }
};

//========================================================================================

const getAcc = (lineContext) => lineContext[LC.PARSER].acc;

const clearAcc = (lineContext) => setParserProp("acc", [], lineContext);

//flushAccum :: (a -> b) -> a -> lineContext -> lineContext
const flushAccum = (resultCallback, data, lineContext) => {
  if (lineContext[LC.PARSER].state === P_STATE.INIT) {
    return lineContext;
  }
  const cRes = resultCallback(data);
  // if (fu.nullOrUndefined(data) && fu.empty(lineContext[LC.PARSER].acc)) {
  //   return lineContext;
  // }
  return fu.compose2(
    // fu.tapLog("maac after"),
    clearAcc,
    fu.overProp(LC.DATA, (arr) =>
      fu.nullOrUndefined(cRes) ? arr : [...arr, cRes]
    )
  )(lineContext);
};

//----------------------------------------------------------------------------------------

const createAccum = (groupedFlag, resultCallback) =>
  groupedFlag === true
    ? createGroupedAccum(resultCallback)
    : createFlatAccum(resultCallback);

//----------------------------------------------------------------------------------------

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  lineType: lineContext[LC.LINE].type,
  state: lineContext[LC.PARSER].state,
  data,
});

const createFlatAccum = (resultCallback) => {
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

  accObj.append = (newValue, lineContext) => {
    return accObj.flush(newValue, lineContext);
  };

  accObj.start = accObj.append;

  return accObj;
};

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

const createGroupedAccum = (resultCallback) => {
  const accObj = {};

  accObj.start = (_, lineContext) => lineContext;

  accObj.append = (data, lineContext) =>
    overParserProp(
      "acc",
      (a) => [...a, plainParserDecorator(data, lineContext)],
      lineContext
    );

  accObj.flush = (_, lineContext) =>
    fu.empty(getAcc(lineContext))
      ? lineContext
      : flushAccum(
          resultCallback,
          groupedParserDecorator(getAcc(lineContext), lineContext),
          lineContext
        );

  return accObj;
};

//========================================================================================

const defaultResultCallback = fu.id;

const DEFAULT_SETTINGS = {
  GROUPING: true,
  PARSER_TYPE: "pair",
};

class Parser {
  static initialLineContext = () =>
    fu.compose2(
      fu.setProp(LC.DATA, []),
      fu.setProp(LC.PARSER, initialParserState())
    )(initialLineContext());

  constructor(startTagRegExp, endTagRegExp, isGrouped, resultCallback) {
    this.accum = createAccum(isGrouped, resultCallback);
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
    this.parserEngine = createPairParserEngine(this.accum);
    this.reducer = createReducer(this.lexer, this.parserEngine);
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
