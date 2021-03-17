/**
 *
 * line-blocks parsing library
 *
 */

const fu = require("./func-utils");

const PROP_LINE = "line";
const PROP_LINE_NUMBER = "lineNumber";
const PROP_RESULT = "result";

const initialLineContext = {};
initialLineContext[PROP_LINE_NUMBER] = 0;
initialLineContext[PROP_LINE] = "";

const DEFAULT_PARSER_ID = "line-block-parser";
const NO_BLOCK_BEGIN = -1;

const initialParserState = {
  beginBlockLineNum: NO_BLOCK_BEGIN,
};

const defaultCB = (lineContext) => null;

const defaultBlockCB = (lineContext) => {
  return { num: lineContext.lineNumber, out: lineContext.line };
};

class Parser {
  _beginMarkCB = defaultCB;
  _endMarkCB = defaultCB;
  _blockCB = defaultBlockCB;
  _notBlockCB = defaultCB;

  constructor(beginkMark, endMark, parserId = DEFAULT_PARSER_ID) {
    this.beginkMark = beginkMark;
    this.endMark = endMark;
    this.parserId = parserId;
  }

  static create(beginkMark, endMark, parserId) {
    return new Parser(beginkMark, endMark, parserId);
  }

  onBeginMark(callback) {
    this._beginMarkCB = callback;
    return this;
  }

  onEndMark(callback) {
    this._endMarkCB = callback;
    return this;
  }

  onBlock(callback) {
    this._blockCB = callback;
    return this;
  }

  onNotBlock(callback) {
    this._notBlockCB = callback;
    return this;
  }

  parseLines(lines) {
    const pt = this._getParserTools();
    return lines.reduce(
      pt.parserReducer,
      pt.createInitialLineContext(initialLineContext)
    ).result;
  }

  static consumeLine(lineContext, line) {
    return fu.compose2(
      fu.overProp(PROP_LINE_NUMBER, (x) => x + 1),
      fu.setProp(PROP_LINE, line)
    )(lineContext);
  }

  _getParserTools() {
    return {
      pState: fu.prop(this.parserId),

      createInitialLineContext: fu.compose2(
        fu.setProp(PROP_RESULT, []),
        fu.setProp(this.parserId, initialParserState)
      ),

      parserReducer: (lineContext, line) => {
        lineContext = Parser.consumeLine(lineContext, line);
        //const state = pState(lineContext);
        // if (state.beginBlockLineNum === NO_BLOCK_BEGIN) {
        // } else {
        // }
        return fu.overProp(
          PROP_RESULT,
          (arr) => [...arr, this._blockCB(lineContext)],
          lineContext
        );
      },
    };
  }
}

module.exports = {
  initialLineContext,
  Parser,
};
