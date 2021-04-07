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

const LINE_INFO = {
  LINE_NUMBER: "lineNumber",
  LINE_TYPE: "lineType",
  STATE: "state",
};

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  lineType: LEXER.names[lineContext[LC.LINE].type],
  state: P_STATE.names[lineContext[LC.PARSER].state],
  data,
});

const belongsToBlock = (lineInfo) =>
  lineInfo[LINE_INFO.STATE] === P_STATE.names[P_STATE.IN_BLOCK];

const isInsideBlock = (lineInfo) =>
  belongsToBlock(lineInfo) &&
  lineInfo[LINE_INFO.LINE_TYPE] === LEXER.names[LEXER.LINE];

//----------------------------------------------------------------------------------------

const groupedParserDecorator = (data, lineContext) => ({
  state: P_STATE.names[lineContext[LC.PARSER].state],
  startLineNumber:
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK
      ? lineContext[LC.PARSER].beginBlockLineNum
      : lineContext[LC.PARSER].beginNotBlockLineNum,
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  data,
});

//---------------------------------------------------------------------------------------------

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

  accObj.flush = fu.curry2((dataToFlush, lineContext) => {
    if (groupedFlag) {
      return isValidToFlush(lineContext)
        ? flushAccum(
            resultCallback,
            groupedParserDecorator(lineContext[LC.ACCUM].data, lineContext),
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
  });

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

  accObj.start = fu.curry2((data, lineContext) =>
    groupedFlag === true
      ? overAcc((_) => ({ data: [], state: A_STATE.READY }), lineContext)
      : accObj.flush(data, lineContext)
  );

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

const ERR_TYPE = {
  DUP_START_TAG: 0,
  DUP_END_TAG: 1,
  MISS_END_TAG: 2,
  names: ["DUP_START_TAG", "DUP_END_TAG", "MISS_END_TAG"],
  descriptions: [
    "Repeated start tag. No previous matching end-tag found",
    "Repeated end tag. No previous matching start-tag found",
    "Missing end tag at the end of the final block",
  ],
};

const addError = fu.curry2((errType, lineContext) =>
  fu.overProp(
    LC.ERRORS,
    (errs) => [
      ...errs,
      {
        lineNumber: lineContext[LC.LINE_NUMBER],
        line: lineContext[LC.LINE].data,
        errorType: ERR_TYPE.names[errType],
        description: ERR_TYPE.descriptions[errType],
      },
    ],
    lineContext
  )
);

const createPairParserEngine = (accum) => ({
  consume: (lc) => {
    //fu.log("engine accum: ", accum);

    // fu.log("lc: ", lc);
    if (lc[LC.PARSER].beginBlockLineNum === NO_BLOCK_BEGIN) {
      if (lc.line.type === LEXER.START_TAG) {
        return fu.compose3(
          (lc3) => accum.start(lc3.line, lc3),
          (lc2) =>
            fu.overProp(LC.PARSER, (p) => ({
              ...p,
              beginBlockLineNum: lc2[LC.LINE_NUMBER] + 1,
              beginNotBlockLineNum: NO_BLOCK_BEGIN,
              startTagLine: lc2.line.data,
              endTagLine: null,
              state: P_STATE.IN_BLOCK,
            }))(lc2),
          accum.flush(null)
        )(lc);
      } else {
        //fu.log("NOT BLOCK");
        return fu.compose2(
          (lc2) => accum.append(lc2.line, lc2),
          setParserProp("state", P_STATE.OUT_OF_BLOCK)
        )(lc);
      }
    } else {
      if (lc.line.type === LEXER.END_TAG) {
        //fu.log("END TAG");
        return fu.compose3(
          (lc4) =>
            fu.overProp(LC.PARSER, (p) => ({
              ...p,
              beginBlockLineNum: NO_BLOCK_BEGIN,
              beginNotBlockLineNum: lc4[LC.LINE_NUMBER] + 1,
              startTagLine: null,
              endTagLine: null,
            }))(lc4),
          (lc3) => accum.flush(lc3.line, lc3),
          (lc2) =>
            fu.overProp(LC.PARSER, (p) => ({
              ...p,
              state: P_STATE.IN_BLOCK,
              endTagLine: lc2.line.data,
            }))(lc2)
        )(lc);
      } else {
        //fu.log("BLOCK");
        return fu.compose2(
          (lc2) => accum.append(lc2.line, lc2),
          setParserProp("state", P_STATE.IN_BLOCK)
        )(lc);
      }
    }
  },
  flush: (lineContext) => {
    return lineContext[LC.PARSER].state === P_STATE.OUT_OF_BLOCK ||
      fu.empty(lineContext[LC.ACCUM].data)
      ? accum.flush(null, lineContext)
      : fu.compose2(
          accum.flush(null),
          addError(ERR_TYPE.MISS_END_TAG)
        )(lineContext);
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
    const { errors, data } = this.parserEngine.flush(lineContext);
    return { errors, data };
  }

  parse(lines) {
    const resCtx = lines.reduce(
      this.reducer.bind(this), //bind to preserve context
      Parser.initialLineContext()
    );
    //fu.log("-- -- --BEFORE FLUSH:", resCtx);
    return this.flush(resCtx);
  }

  static belongsToBlock = belongsToBlock;
  static isInsideBlock = isInsideBlock;
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
