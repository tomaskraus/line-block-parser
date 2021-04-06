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
  INIT: 0,
  START_TAG: 1,
  END_TAG: 2,
  LINE: 3,
  names: ["init", "startTag", "endTag", "line"],
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
  INIT: 0,
  IN_BLOCK: 1,
  OUT_OF_BLOCK: 2,
  names: ["init", "inBlock", "outOfBlock"],
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

const plainParserDecorator = (data, _) => data.data;

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  lineType: LEXER.names[lineContext[LC.LINE].type],
  state: P_STATE.names[lineContext[LC.PARSER].state],
  data,
});

const groupedParserDecorator = (AccumulatorData, lineContext) => ({
  state: P_STATE.names[lineContext[LC.PARSER].state],
  startLineNumber:
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK
      ? lineContext[LC.PARSER].beginBlockLineNum
      : lineContext[LC.PARSER].beginNotBlockLineNum,
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  data: AccumulatorData,
});

//----------------------------------------------------------------------------------------

const A_STATE = {
  READY: 0,
  INIT: 1,
  names: ["ready", "init"],
};

const initialAccumState = () => ({
  state: A_STATE.INIT,
  data: [],
});

//----------------------------------------------------------------------------------------

const getAcc = (lineContext) => lineContext[LC.ACCUM].data;

const clearAcc = (lineContext) =>
  fu.setProp(LC.ACCUM, initialAccumState(), lineContext);

const overAcc = fu.curry2((fn, lineContext) =>
  fu.overProp(LC.ACCUM, fn, lineContext)
);

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

const isValidToFlush = (lineContext) => {
  return lineContext[LC.ACCUM].state === A_STATE.READY;
};

//

const createAccumulator = (groupedFlag, resultCallback) => {
  const accObj = {};

  accObj.flush = (dataToFlush, lineContext) => {
    if (groupedFlag) {
      return isValidToFlush(lineContext)
        ? flushAccum(
            resultCallback,
            groupedParserDecorator(getAcc(lineContext), lineContext),
            lineContext
          )
        : lineContext;
    }
    return dataToFlush === null
      ? lineContext
      : flushAccum(
          resultCallback,
          infoParserDecorator(dataToFlush.data, lineContext),
          lineContext
        );
  };

  accObj.append = (data, lineContext) =>
    groupedFlag === true
      ? fu.overProp(
          LC.ACCUM,
          (aObj) => ({
            state: A_STATE.READY,
            data: [...aObj.data, plainParserDecorator(data, lineContext)],
          }),
          lineContext
        )
      : accObj.flush(data, lineContext);

  accObj.start = (data, lineContext) =>
    groupedFlag === true
      ? overAcc((_) => ({ data: [], state: A_STATE.READY }), lineContext)
      : accObj.flush(data, lineContext);

  return accObj;
};

//========================================================================================

const consumeLine = fu.curry2((line, lineContext) =>
  fu.compose2(
    fu.overProp(LC.LINE_NUMBER, (x) => x + 1),
    fu.setProp(LC.LINE, line)
  )(lineContext)
);

const createReducer = (lexer, parserEngine) => (lineContext, line) =>
  fu.compose3(
    parserEngine.consume,
    //fu.compose2(fu.tapLog("lc Before parseEngine:"), lexer.consume),
    lexer.consume,
    consumeLine(line)
    // fu.compose2(Parser.consumeLine(line), fu.id)
  )(lineContext);

const createPairParserEngine = (accum) => ({
  consume: (lc) => {
    //fu.log("engine accum: ", accum);

    let pState = lc[LC.PARSER];
    pState.lineType = lc.line.type;

    // fu.log("lc: ", lc);
    if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (lc.line.type === LEXER.START_TAG) {
        let lc2 = accum.flush(null, lc);
        //fu.log("START TAG");
        let pState2 = lc2[LC.PARSER];
        pState2.lineType = lc2.line.type;

        pState2.beginBlockLineNum = lc2[LC.LINE_NUMBER] + 1;
        pState2.beginNotBlockLineNum = NO_BLOCK_BEGIN;
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
  },
});

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
    this.accum = createAccumulator(isGrouped, resultCallback);
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
