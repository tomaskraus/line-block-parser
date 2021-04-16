/**
 *
 * line-blocks parsing library
 *
 */

//TODO add proper begin-end pair check
//TODO add input param type check

const fu = require("./func-utils");
const crb = require("@krausoft/comment-regexp-builder");

//---------------------------------------------------------------------------------------------

const LC = {
  LINE: "line",
  LINE_NUMBER: "lineNumber",
  PARSER: "parser",
  ACCUM: "accum",
  DATA: "data",
  ERRORS: "errors",
};

const initialLineContext = (startLineNumberValue = 0) => {
  const ilc = {};
  ilc[LC.LINE_NUMBER] = startLineNumberValue;
  ilc[LC.LINE] = null;
  // ilc[LC.PARSER] = null;
  // ilc[LC.ACCUM] = null;
  ilc[LC.DATA] = [];
  ilc[LC.ERRORS] = [];
  return ilc;
};

//---------------------------------------------------------------------------------------------

const Tags = {
  JS_BLOCK_COMMENT_START: "/*",
  JS_BLOCK_COMMENT_END: "*/",
  JS_LINE_COMMENT: "//",
};

const LEXER = {
  INIT: 0,
  START_TAG: 1,
  END_TAG: 2,
  TAG: 3,
  LINE: 4,
  names: ["init", "startTag", "endTag", "tag", "line"],
};

const createLexer = (startTagObj, endTagObj = null) => {
  const lexerObj = {};

  // consume :: lineContext -> {...lineContext, line: {type: LEXER.TYPE, data: lineContext.line}}
  lexerObj.consume = (lc) => {
    const is_start = startTagObj.test(lc.line);
    const is_end = endTagObj !== null && endTagObj.test(lc.line);

    let tagType = LEXER.LINE;
    if (is_start) tagType = LEXER.START_TAG;
    if (is_start && endTagObj === null) tagType = LEXER.TAG;
    if (is_end) tagType = LEXER.END_TAG;
    if (is_start && is_end) tagType = LEXER.LINE; //treat full one-line block comment as normal line

    return fu.overProp(LC.LINE, (s) => ({ type: tagType, data: s }), lc);
  };

  lexerObj.utils = {};

  lexerObj.utils.startTagInnerText = startTagObj.innerText;
  if (endTagObj !== null) {
    lexerObj.utils.endTagInnerText = endTagObj.innerText;
  }
  lexerObj.utils.tagInnerText = lexerObj.utils.startTagInnerText;

  return lexerObj;
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

const LINE_INFO = {
  LINE_NUMBER: "lineNumber",
  LINE_TYPE: "lineType",
  STATE: "state",
};

//every decorator (flat, grouped) should have this
const _decorator = (data, lineContext) => ({
  inBlock: lineContext[LC.PARSER].state === P_STATE.IN_BLOCK,
  data,
});

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  lineType: LEXER.names[lineContext[LC.LINE].type],
  ..._decorator(data, lineContext),
});

//----------------------------------------------------------------------------------------

//every grouped decorator should have this
const groupedDecorator = (data, lineContext) => ({
  startLineNumber:
    lineContext[LC.PARSER].state === P_STATE.IN_BLOCK
      ? lineContext[LC.PARSER].beginBlockLineNum
      : lineContext[LC.PARSER].beginNotBlockLineNum,
  ..._decorator(data, lineContext),
});

const groupedPairParserDecorator = (data, lineContext) => ({
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  ...groupedDecorator(data, lineContext),
});

const groupedLineParserDecorator = (data, lineContext) =>
  groupedDecorator(data, lineContext);

const inBlock = (data) => data.inBlock === true;

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

const flushAccum = (dataCallback, lexerUtils, data, lineContext) => {
  const dataFromCallback = dataCallback(data, lexerUtils);
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

const createAccumulator = (
  isGrouped,
  groupDecorator,
  lexerObjUtils,
  dataCallback
) => {
  const accObj = {};

  accObj.flush = fu.curry2((dataToFlush, lineContext) => {
    if (isGrouped === true) {
      return isValidToFlush(lineContext)
        ? flushAccum(
            dataCallback,
            lexerObjUtils,
            groupDecorator(lineContext[LC.ACCUM].data, lineContext),
            lineContext
          )
        : lineContext;
    }
    return dataToFlush === null
      ? lineContext
      : flushAccum(
          dataCallback,
          lexerObjUtils,
          infoParserDecorator(dataToFlush.data, lineContext),
          lineContext
        );
  });

  accObj.append = (data, lineContext) =>
    isGrouped === true
      ? fu.overProp(
          LC.ACCUM,
          (aObj) => ({
            state: A_STATE.READY,
            data: [...aObj.data, data.data],
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
    const in_block = lc[LC.PARSER].beginBlockLineNum !== NO_BLOCK_BEGIN;
    const is_start_tag = lc[LC.LINE].type === LEXER.START_TAG;
    const is_end_tag = lc[LC.LINE].type === LEXER.END_TAG;

    if (!in_block && is_start_tag) {
      //fu.log("START BLOCK");
      return fu.compose3(
        (lc2) => accum.start(lc2[LC.LINE], lc2),
        (lc1) =>
          fu.overProp(LC.PARSER, (p) => ({
            ...p,
            beginBlockLineNum: lc1[LC.LINE_NUMBER] + 1,
            beginNotBlockLineNum: NO_BLOCK_BEGIN,
            startTagLine: lc1[LC.LINE].data,
            endTagLine: null,
            state: P_STATE.IN_BLOCK,
          }))(lc1),
        accum.flush(null) //flush the content before
      )(lc);
    }

    if (!in_block && !is_start_tag) {
      //fu.log("NOT BLOCK");
      return fu.compose3(
        (lc2) => accum.append(lc2.line, lc2),
        setParserProp("state", P_STATE.OUT_OF_BLOCK),
        (lc1) =>
          lc1[LC.LINE].type === LEXER.END_TAG
            ? lc[LC.LINE_NUMBER] === 1
              ? addError(errorCallback, ERR_TYPE.END_TAG_FIRST, lc1)
              : addError(errorCallback, ERR_TYPE.DUP_END_TAG, lc1)
            : lc1
      )(lc);
    }

    if (in_block && is_end_tag) {
      //fu.log("END OF BLOCK");
      return fu.compose3(
        (lc3) =>
          fu.overProp(LC.PARSER, (p) => ({
            ...p,
            beginBlockLineNum: NO_BLOCK_BEGIN,
            beginNotBlockLineNum: lc3[LC.LINE_NUMBER] + 1,
            startTagLine: null,
            endTagLine: null,
          }))(lc3),
        (lc2) => accum.flush(lc2.line, lc2),
        (lc1) =>
          fu.overProp(LC.PARSER, (p) => ({
            ...p,
            state: P_STATE.IN_BLOCK,
            endTagLine: lc1[LC.LINE].data,
          }))(lc1)
      )(lc);
    }

    if (in_block && !is_end_tag) {
      //fu.log("BLOCK");
      return fu.compose2(
        (lc2) => accum.append(lc2.line, lc2),
        (lc1) =>
          lc1[LC.LINE].type === LEXER.START_TAG
            ? addError(errorCallback, ERR_TYPE.DUP_START_TAG, lc1)
            : lc1
      )(lc);
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

// -------------------------------------------------------------

const createLineParserEngine = (accum) => ({
  consume: (lc) => {
    const in_block = lc[LC.PARSER].beginBlockLineNum != NO_BLOCK_BEGIN;
    const is_tag = lc[LC.LINE].type === LEXER.TAG;

    if (!in_block && is_tag) {
      //fu.log("START NEW BLOCK");
      return fu.compose3(
        (lc3) => accum.append(lc3[LC.LINE], lc3),
        (lc2) =>
          fu.overProp(LC.PARSER, (p) => ({
            ...p,
            beginBlockLineNum: lc2[LC.LINE_NUMBER],
            beginNotBlockLineNum: NO_BLOCK_BEGIN,
            state: P_STATE.IN_BLOCK,
          }))(lc2),
        accum.flush(null)
      )(lc);
    }

    if (!in_block && !is_tag) {
      //fu.log("CONTINUE NOT BLOCK");
      return fu.compose2(
        (lc2) => accum.append(lc2.line, lc2),
        setParserProp("state", P_STATE.OUT_OF_BLOCK)
      )(lc);
    }

    if (in_block && is_tag) {
      //fu.log("CONTINUE BLOCK");
      return fu.compose2(
        (lc2) => accum.append(lc2.line, lc2),
        setParserProp("state", P_STATE.IN_BLOCK)
      )(lc);
    }

    if (in_block && !is_tag) {
      //fu.log("END OF BLOCK");
      return fu.compose3(
        (lc3) => accum.append(lc3[LC.LINE], lc3),
        (lc2) =>
          fu.overProp(LC.PARSER, (p) => ({
            ...p,
            beginBlockLineNum: NO_BLOCK_BEGIN,
            beginNotBlockLineNum: lc2[LC.LINE_NUMBER],
            state: P_STATE.OUT_OF_BLOCK,
          }))(lc2),
        accum.flush(null)
      )(lc);
    }
  },

  flush: (lineContext) => accum.flush(null, lineContext),
});

//========================================================================================

class Parser {
  static defaults = () => ({
    grouped: true,
    onData: fu.id,
  });

  static initialLineContext = (startLineNumberValue = 0) =>
    fu.compose3(
      fu.setProp(LC.DATA, []),
      fu.setProp(LC.ACCUM, initialAccumState()),
      fu.setProp(LC.PARSER, initialParserState())
    )(initialLineContext(startLineNumberValue));

  static getReducer = (parserObj) => () => parserObj.reducer;

  static parse(parserObj, startLineNumberValue, lines) {
    const resCtx = lines.reduce(
      parserObj.reducer.bind(parserObj), //bind to preserve context
      Parser.initialLineContext(startLineNumberValue)
    );
    return parserObj.flush(resCtx);
  }

  static flush(parserObj, lineContext) {
    const { errors, data } = parserObj.parserEngine.flush(lineContext);
    return { errors, data };
  }

  static inBlock = inBlock;
}

// -----------------------------

class PairParser {
  static defaults = () => ({
    ...Parser.defaults(),
    onError: defaultErrorHandler,
  });

  constructor(startTagStr, endTagStr, grouped, onData, onError) {
    this.lexer = createLexer(
      crb.createStartTag(startTagStr),
      crb.createEndTag(endTagStr)
    );
    this.accum = createAccumulator(
      grouped,
      groupedPairParserDecorator,
      this.lexer.utils,
      onData
    );
    this.parserEngine = createPairParserEngine(this.accum, onError);
    this.reducer = createReducer(this.lexer, this.parserEngine);
  }

  static create(startTagRegExp, endTagRegExp, options) {
    const { grouped, onData, onError } = {
      ...PairParser.defaults(),
      ...options,
    };
    return new PairParser(
      startTagRegExp,
      endTagRegExp,
      grouped,
      onData,
      onError
    );
  }

  parse = (lines, startLineNumberValue = 0) =>
    Parser.parse(this, startLineNumberValue, lines);

  flush = (lineContext) => Parser.flush(this, lineContext);

  getReducer = Parser.getReducer(this);

  static inBlock = Parser.inBlock;

  static initialLineContext = Parser.initialLineContext;
}

//

class LineParser {
  static defaults = () => Parser.defaults();

  constructor(tagStr, grouped, onData) {
    this.lexer = createLexer(crb.createStartTag(tagStr));
    this.accum = createAccumulator(
      grouped,
      groupedLineParserDecorator,
      this.lexer.utils,
      onData
    );
    this.parserEngine = createLineParserEngine(this.accum);
    this.reducer = createReducer(this.lexer, this.parserEngine);
  }

  static create(tagRegExp, options) {
    const { grouped, onData } = {
      ...LineParser.defaults(),
      ...options,
    };
    return new LineParser(tagRegExp, grouped, onData);
  }

  parse = (lines, startLineNumberValue = 0) =>
    Parser.parse(this, startLineNumberValue, lines);

  flush = (lineContext) => Parser.flush(this, lineContext);

  getReducer = Parser.getReducer(this);

  static inBlock = Parser.inBlock;

  static initialLineContext = Parser.initialLineContext;
}

//========================================================================================

module.exports = {
  PairParser,
  LineParser,
  Tags,
};
