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

//---------------------------------------------------------------------------------------------

const LC = {
  LINE: "line",
  LINE_NUMBER: "lineNumber",
  PARSER: "parser",
  RESULT: "result",
};

const initialLineContext = {};
initialLineContext[LC.LINE_NUMBER] = 0;
initialLineContext[LC.LINE] = null;

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

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
  startTagLine: null,
  endTagLine: null,
  acc: [], //accumulator
  accOut: null, //accumulator - flushed output
  state: "init",
};

// overParserProp :: string -> (a -> b) -> lineContext -> lineContext
const overParserProp = fu.curry3((propName, fn, lineContext) => {
  const newParserState = fu.overProp(propName, fn, lineContext[LC.PARSER]);
  return fu.setProp(LC.PARSER, newParserState, lineContext);
});

const setParserProp = fu.curry3((propName, value, lineContext) =>
  overParserProp(propName, (_) => value, lineContext)
);

//---------------------------------------------------------------------------------------------

const getAcc = (lineContext) => lineContext[LC.PARSER].acc;

const getAccOut = (lineContext) => lineContext[LC.PARSER].accOut;

const clearAcc = (lineContext) => setParserProp("acc", [], lineContext);

//moveToAccOutput :: lineContext -> lineContext
const moveToAccOutput = (lineContext) =>
  fu.compose2(
    clearAcc,
    setParserProp("accOut", getAcc(lineContext))
  )(lineContext);

const appendToResult = (lineContext) =>
  fu.overProp(
    LC.RESULT,
    (arr) => [...arr, ...getAccOut(lineContext)],
    lineContext
  );
//---------------------------------------------------------------------------------------------

const infoParserDecorator = (data, lineContext) => ({
  lineNumber: lineContext[LC.LINE_NUMBER],
  state: lineContext[LC.PARSER]["state"],
  data,
});

class Parser {
  constructor(startTagRegExp, endTagRegExp) {
    this.lexer = createLexer(startTagRegExp, endTagRegExp);
    this.accum = createAccum();
    this.parserEngine = createPairParserEngine(this.accum);
  }

  static create(startTagRegExp, endTagRegExp) {
    return new Parser(startTagRegExp, endTagRegExp);
  }

  static createReducer = (lexer, parserEngine) => (lineContext, line) => {
    const lc = fu.compose3(
      parserEngine,
      lexer.consume,
      fu.compose2(Parser.consumeLine(line), setParserProp("accOut", null))
    )(lineContext);

    if (!fu.nullOrUndefined(getAccOut(lc))) {
      return appendToResult(lc);
    }
    return lc;
  };

  parseLines(lines) {
    const resCtx = lines.reduce(
      Parser.createReducer(this.lexer, this.parserEngine).bind(this), //bind to preserve context
      Parser.createInitialLineContext()
    );
    //fu.log("parseLines result LC: ", resCtx);
    return this.accum.flush(null, resCtx)[LC.RESULT];
  }

  static consumeLine = fu.curry2((line, lineContext) =>
    fu.compose2(
      fu.overProp(LC.LINE_NUMBER, (x) => x + 1),
      fu.setProp(LC.LINE, line)
    )(lineContext)
  );

  static createInitialLineContext = () =>
    fu.compose2(
      fu.setProp(LC.RESULT, []),
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

const createAccum = () => {
  const accObj = {};

  accObj.flush = (additionalData, lineContext) => {
    //fu.log("flush additional data: ", additionalData);
    if (additionalData !== null) {
      // fu.log("additional data: ", additionalData);
      const retLc = overParserProp(
        "acc",
        (a) => [...a, infoParserDecorator(additionalData.data, lineContext)],
        lineContext
      );
      return moveToAccOutput(retLc);
    }
    return moveToAccOutput(lineContext);
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

// const lc = Parser.createInitialLineContext(createAccum());
// fu.log("initialContext accm:", getAccValue(lc));
// const lc2 = overAcc((arr) => [...arr, 123], lc);
// fu.log("new accm: ", lc2);
