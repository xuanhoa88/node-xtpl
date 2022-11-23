const { lexer } = require("nunjucks");

const patternTag = "{%.+%}|{{.+}}";
const patternXv = "^ *{% *xv.+%} *$";
const patternVariableNoSpace = "^{{.+}}$";
const reTag = new RegExp(patternTag);
const reXv = new RegExp(patternXv);
const reVariableNoSpace = new RegExp(patternVariableNoSpace);
const reBlockSplit = new RegExp("({%.*?%})");

class CellTag {
  constructor() {
    this.beforerow = "";
    this.beforecell = "";
    this.aftercell = "";
    this.extracell = "";
  }
}

const _ignored = ["yn", "img", "xv"];

function parseBlock(text) {
  const tokens = lexer.lex(text);
  const begin = tokens.nextToken();
  let tag = tokens.nextToken();
  while (tag.type === lexer.TOKEN_WHITESPACE) {
    tag = tokens.nextToken();
  }
  let ignored = false;
  let isBeforeRow = false;
  if (_ignored.includes(tag.value)) {
    ignored = true;
  }
  if (begin.value.charAt(begin.value.length - 1) === "-") {
    isBeforeRow = true;
  }
  return { ignored, isBeforeRow };
}

function parseTag(text) {
  const tokens = lexer.lex(text);
  tokens.nextToken();
  let tag = tokens.nextToken();
  while (tag.type === lexer.TOKEN_WHITESPACE) {
    tag = tokens.nextToken();
  }
  return tag.value;
}

function findCellTag(text) {
  const parts = text.split(reBlockSplit);
  let index = 0;
  let stop = true;
  let _beforeRow = "";

  for (const part of parts) {
    if (index % 2 === 0) {
      if (part === "") {
        index += 1;
        continue;
      }
      break;
    } else {
      let { ignored, isBeforeRow } = parseBlock(part);
      if (ignored) break;
      if (isBeforeRow) {
        _beforeRow += part;
        index += 1;
      } else {
        stop = false;
        break;
      }
    }
  }
  let _beforeCell = "";
  if (!stop) {
    for (const part of parts.slice(index)) {
      if (index % 2 === 0) {
        if (part === "") {
          index += 1;
          continue;
        }
        break;
      } else {
        const { ignored } = parseBlock(part);
        if (ignored) break;
        _beforeCell += part;
        index += 1;
      }
    }
  }
  let _afterCell = "";
  const _reverse = parts.slice(index).reverse();
  index = 0;
  for (const part of _reverse) {
    if (index % 2 === 0) {
      if (part === "") {
        index += 1;
        continue;
      }
      break;
    } else {
      const { ignored } = parseBlock(part);
      if (ignored) break;
      _afterCell = part + _afterCell;
      index += 1;
    }
  }
  if (
    _beforeRow.length > 0 ||
    _beforeCell.length > 0 ||
    _afterCell.length > 0
  ) {
    let head = 0;
    let tail = 0;
    const cellTag = new CellTag();
    cellTag.beforerow = _beforeRow;
    head += _beforeRow.length;
    cellTag.beforecell = _beforeCell;
    head += _beforeCell.length;
    cellTag.aftercell = _afterCell;
    tail += _afterCell.length;
    return {
      text: text.slice(head, text.length - tail),
      cellTag,
      head,
      tail,
      head2tail: head + text.length - tail,
    };
  }
  return { text, cellTag: null, head: 0, tail: 0 };
}

const singleVariable = "{{.+?}}";
const reSingleVariable = new RegExp(singleVariable);

function isVariableNoSpace(text) {
  if (reVariableNoSpace.test(text)) {
    if (text.split(reSingleVariable).length === 2) return true;
  }
}

const singleXv = "{% *xv.+?%}";
const reSingleXv = new RegExp(singleXv);

function isXv(text) {
  if (reXv.test(text)) {
    if (text.split(reSingleXv).length === 2) return true;
  }
}

module.exports = {
  findCellTag,
  parseTag,
  isVariableNoSpace,
  isXv,
  reTag,
  reBlockSplit,
};
