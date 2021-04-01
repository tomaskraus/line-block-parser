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
  PARSER: "parser",
  RESULT: "result",
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

const initialLineContext = {};
initialLineContext[LC.LINE_NUMBER] = 0;
initialLineContext[LC.LINE] = null;

const DEFAULTS = {
  PARSER_TYPE: "pair",
  GROUPING: false,
};

//---------------------------------------------------------------------------------------------

const NO_BLOCK_BEGIN = -1;

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
  startTagLine: null,
  endTagLine: null,
  out: null,
  state: "init",
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
const setParserCurrentOutput = fu.curry2((value, lineContext) =>
  overParserState("out", (_) => value, lineContext)
);

const appendToResult = (lineContext) =>
  fu.overProp(
    LC.RESULT,
    (arr) => [...arr, lineContext[LC.PARSER].out],
    lineContext
  );
//---------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  state: lineContext[LC.PARSER]["state"],
  data,
});

class Parser {
  constructor(startTagRegExp, endTagRegExp) {
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
    this.accum = createAccum(DEFAULTS.GROUPING);
    this.parserEngine = createPairParserEngine(this.accum);
  }

  static create(startTagRegExp, endTagRegExp) {
    return new Parser(startTagRegExp, endTagRegExp);
  }

  static createReducer = (lexer, parserEngine) => (lineContext, line) => {
    const lc = fu.compose3(
      parserEngine,
      lexer.consume,
      Parser.consumeLine(line)
    )(lineContext);

    if (!fu.nullOrUndefined(lc[LC.PARSER].out)) {
      return appendToResult(lc);
    }
    return lc;
  };

  parseLines(lines) {
    //fu.log("accum: ", acc);
    const resCtx = lines.reduce(
      Parser.createReducer(this.lexer, this.parserEngine).bind(this), //bind to preserve context
      Parser.createInitialLineContext(this.accum)
    );
    //fu.log("parseLines lc: ", resCtx);
    return this.accum.flush(null, resCtx)[LC.RESULT];
  }

  static consumeLine = fu.curry2((line, lineContext) =>
    fu.compose3(
      setParserCurrentOutput(null),
      fu.overProp(LC.LINE_NUMBER, (x) => x + 1),
      fu.setProp(LC.LINE, line)
    )(lineContext)
  );

  static createInitialLineContext = (accumulatorObj) =>
    fu.compose3(
      fu.setProp(LC.RESULT, []),
      accumulatorObj.initialize,
      fu.setProp(LC.PARSER, initialParserState)
    )(initialLineContext);
}

const startAccDecorator = (newData, lineContext) => ({
  startLineNumber: lineContext[LC.PARSER].beginBlockLineNum,
  startTagLine: lineContext[LC.PARSER].startTagLine,
  endTagLine: lineContext[LC.PARSER].endTagLine,
  data: newData,
});

const createPairParserEngine = (accum) => (lc) => {
  //fu.log("engine accum: ", accum);

  let pState = lc[LC.PARSER];

  //fu.log("line: ", `'${lc.line}'`);
  if (pState.beginBlockLineNum === NO_BLOCK_BEGIN) {
    if (lc.line.type === LEXER.START_TAG) {
      //fu.log("START TAG");
      pState.beginBlockLineNum = lc[LC.LINE_NUMBER] + 1;
      pState.startTagLine = lc.line;
      pState.endTagLine = null;
      pState.state = "startTag";

      //lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
      return accum.append(lc.line, lc);
    } else {
      //fu.log("NOT BLOCK");
      pState.state = "outOfBlock";

      //lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
      return accum.append(lc.line, lc);
    }
  } else {
    if (lc.line.type === LEXER.END_TAG) {
      //fu.log("END TAG");
      pState.state = "endTag";
      pState.endTagLine = lc.line;

      //lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);

      lc = accum.flush(lc.line, lc);
      //fu.log("END lc: ", lc);

      lc[LC.PARSER].beginBlockLineNum = NO_BLOCK_BEGIN;
      lc[LC.PARSER].startTagLine = null;
      return lc;
    } else {
      //fu.log("BLOCK");
      pState.state = "inBlock";

      //lc = fu.overProp(LC.LINE, (obj) => obj.data, lc);
      return accum.append(lc.line, lc);
    }
  }
};

//----------------------------------------------------------------------------------------

const getAccValue = (lineContext) => {
  //fu.log("gav: ", lineContext[LC.PARSER].acc);
  return lineContext[LC.PARSER].acc;
};
const overAcc = fu.curry2((fn, lc) => overParserState("acc", fn, lc));

const createAccum = (groupingFlag) => {
  const gFlag = groupingFlag;
  const accObj = {
    initialize: (lineContext) => setParserState("acc", [], lineContext),
    foo: () => (gFlag ? 1 : 0),
  };

  accObj.flush = (additionalData, lineContext) => {
    //fu.log("flush additional data: ", additionalData);

    if (additionalData !== null) {
      const retLc =
        getAccValue(lineContext).length > 0
          ? setParserCurrentOutput(
              [
                ...getAccValue(lineContext),
                infoParserDecorator(additionalData.data, lineContext),
              ],
              lineContext
            )
          : setParserCurrentOutput(
              infoParserDecorator(additionalData.data, lineContext),
              lineContext
            );
      //fu.log("IretLc: ", accObj.initialize(retLc));
      return accObj.initialize(retLc);
    }
    return accObj.initialize(lineContext);
  };

  accObj.append = fu.curry2((newValue, lineContext) => {
    return accObj.flush(newValue, lineContext);
  });

  return accObj;
};

module.exports = {
  Parser,
  Tags,
};

//----------------------------------------------------

// const lc = Parser.createInitialLineContext(createAccum(DEFAULTS.GROUPING));
// fu.log("initialContext acc:", getAccValue(lc));
// const lc2 = overAcc((arr) => [...arr, 123], lc);
// fu.log("new acc: ", lc2);
