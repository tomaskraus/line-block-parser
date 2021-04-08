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
const flushAccum = (dataCallback, data, lineContext) => {
  const dataFromCallback = dataCallback(data);
  return fu.compose2(
    clearAcc,
    fu.overProp(LC.DATA, (arr) =>
      fu.nullOrUndefined(dataFromCallback) ? arr : [...arr, dataFromCallback]
    )
  )(lineContext);
};

//----------------------------------------------------------------------------------------

const isValidToFlush = (lineContext) => {
  return lineContext[LC.ACCUM].state === A_STATE.READY;
};

//

const createAccumulator = (isGrouped, dataCallback) => {
  const accObj = {};

  accObj.flush = fu.curry2((dataToFlush, lineContext) =>
    isGrouped === true
      ? isValidToFlush(lineContext)
        ? flushAccum(
            dataCallback,
            groupedParserDecorator(lineContext[LC.ACCUM].data, lineContext),
            lineContext
          )
        : lineContext
      : dataToFlush === null
      ? lineContext
      : flushAccum(
          dataCallback,
          infoParserDecorator(dataToFlush.data, lineContext),
          lineContext
        )
  );

  accObj.append = (data, lineContext) =>
    isGrouped === true
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
    isGrouped === true
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
    lexer.consume,
    consumeLine(line)
  )(lineContext);

//

const ERR_TYPE = {
  DUP_START_TAG: 0,
  DUP_END_TAG: 1,
  MISS_END_TAG: 2,
  END_TAG_FIRST: 3,
  names: ["DUP_START_TAG", "DUP_END_TAG", "MISS_END_TAG", "END_TAG_FIRST"],
  descriptions: [
    "Repeated start-tag. No previous matching end-tag found",
    "Repeated end-tag. No previous matching start-tag found",
    "Missing end-tag at the end of the final block",
    "End-tag at the very beginning is not allowed",
  ],
};

const addError = fu.curry3((errorCallback, errType, lineContext) => {
  const newErr = new Error();
  newErr.message = ERR_TYPE.descriptions[errType];
  newErr.lineNumber = lineContext[LC.LINE_NUMBER];
  newErr.name = "ParserError";
  const dataFromCallback = errorCallback(newErr);
  return fu.nullOrUndefined(dataFromCallback)
    ? lineContext
    : fu.overProp(
        LC.ERRORS,
        (errs) => [...errs, dataFromCallback],
        lineContext
      );
});

const defaultErrorHandler = (err) => ({
  name: err.name,
  message: err.message,
  lineNumber: err.lineNumber,
});

const createPairParserEngine = (accum, errorCallback) => ({
  consume: (lc) => {
    if (lc[LC.PARSER].beginBlockLineNum === NO_BLOCK_BEGIN) {
      //fu.log("START TAG");
      if (lc[LC.LINE].type === LEXER.START_TAG) {
        return fu.compose3(
          (lc3) => accum.start(lc3[LC.LINE], lc3),
          (lc2) =>
            fu.overProp(LC.PARSER, (p) => ({
              ...p,
              beginBlockLineNum: lc2[LC.LINE_NUMBER] + 1,
              beginNotBlockLineNum: NO_BLOCK_BEGIN,
              startTagLine: lc2[LC.LINE].data,
              endTagLine: null,
              state: P_STATE.IN_BLOCK,
            }))(lc2),
          accum.flush(null)
        )(lc);
      } else {
        //fu.log("NOT BLOCK");
        return fu.compose3(
          (lc3) => accum.append(lc3.line, lc3),
          (lc2) =>
            lc2[LC.LINE].type === LEXER.END_TAG
              ? lc[LC.LINE_NUMBER] === 1
                ? addError(errorCallback, ERR_TYPE.END_TAG_FIRST, lc2)
                : addError(errorCallback, ERR_TYPE.DUP_END_TAG, lc2)
              : lc2,
          setParserProp("state", P_STATE.OUT_OF_BLOCK)
        )(lc);
      }
    } else {
      if (lc[LC.LINE].type === LEXER.END_TAG) {
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
              endTagLine: lc2[LC.LINE].data,
            }))(lc2)
        )(lc);
      } else {
        //fu.log("BLOCK");
        return fu.compose2(
          (lc3) => accum.append(lc3.line, lc3),
          (lc2) =>
            lc2[LC.LINE].type === LEXER.START_TAG
              ? addError(errorCallback, ERR_TYPE.DUP_START_TAG, lc2)
              : lc2
        )(lc);
      }
    }
  },

  flush: (lineContext) =>
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK &&
    lineContext[LC.LINE].type != LEXER.END_TAG
      ? fu.compose2(
          accum.flush(null),
          addError(errorCallback, ERR_TYPE.MISS_END_TAG)
        )(lineContext)
      : accum.flush(null, lineContext),
});

//========================================================================================

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

  constructor(startTagRegExp, endTagRegExp, grouped, onData, onError) {
    this.accum = createAccumulator(grouped, onData);
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
    this.parserEngine = createPairParserEngine(this.accum, onError);
    this.reducer = createReducer(this.lexer, this.parserEngine);
  }

  static create(
    startTagRegExp,
    endTagRegExp,
    grouped = DEFAULT_SETTINGS.GROUPING,
    onData = Parser.defaultDataCallback,
    onError = Parser.defaultErrorHandler
  ) {
    return new Parser(startTagRegExp, endTagRegExp, grouped, onData, onError);
  }

  getReducer = () => this.reducer;

  flush(lineContext) {
    const { errors, data } = this.parserEngine.flush(lineContext);
    return { errors, data };
  }

  parse(lines) {
    const resCtx = lines.reduce(
      this.reducer.bind(this), //bind to preserve context
      Parser.initialLineContext()
    );
    return this.flush(resCtx);
  }

  static belongsToBlock = belongsToBlock;
  static isInsideBlock = isInsideBlock;

  static defaultDataCallback = fu.id;
  static defaultErrorHandler = defaultErrorHandler;
}

//========================================================================================

module.exports = {
  Parser,
  Tags,
};
