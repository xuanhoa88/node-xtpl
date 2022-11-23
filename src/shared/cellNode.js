const { XNode, DebugInfo } = require("./node");
const { reBlockSplit, parseTag } = require("./cellTag");

function getColumnLetter(colIndex) {
  if (1 > colIndex || colIndex > 18278) {
    throw new Error(`Invalid column index ${colIndex}`);
  }
  const letters = [];
  while (colIndex > 0) {
    let remainder = colIndex % 26;
    colIndex = Math.floor(colIndex / 26);
    // check for exact division and borrow if needed
    if (remainder === 0) {
      remainder = 26;
      colIndex -= 1;
    }
    letters.push(String.fromCharCode(remainder + 64));
  }
  return letters.reverse().join();
}

class CellNode extends XNode {
  constructor(model, row, col) {
    super();
    this.extTag = "cell";
    this.model = model;
    this.row = row;
    this.col = col;
    this.cellTag = null;
    this.rv = null;
  }

  toTag() {
    const tag = super.toTag();
    if (this.cellTag) {
      return this.cellTag.beforecell + tag + this.cellTag.aftercell;
    }
    return tag;
  }

  get nodeKey2() {
    if (!this.model.isNull) {
      return `${this._parent.nodeKey},${this.model.address}`;
    }
    return super.nodeKey;
  }

  writeCell() {
    this._parent.writeCell(this);
  }

  exit() {
    this.writeCell();
  }

  setImageRef(ref) {
    ref.rdRow = this.row;
    ref.rdCol = this.col;
    this._parent.setImageRef(ref);
  }

  getDebugInfo(offset) {
    const letter = getColumnLetter(this.col + offset);
    const debug = new DebugInfo();
    debug.address = `Cell ${letter}${this.row + offset}`;
    if (this.model.isNull) {
      return debug;
    }
    if (this.model.isText) {
      debug.value = this.model.text;
    } else if (this.model.isRich) {
      debug.value = this.model.rich.text;
    }
    if (this.cellTag) {
      debug.value =
        this.cellTag.beforecell + debug.value + this.cellTag.aftercell;
    }
    return debug;
  }
}

class XvCell extends CellNode {
  constructor(model, row, col, text, isXv) {
    super(model, row, col);
    this.text = text;
    this.isXv = isXv;
  }

  get nodeTag() {
    let _var = this.text.trim().slice(2, -2);
    if (this.isXv) {
      _var = _var.slice(2).trim();
    }
    return `{%xv "${this.nodeKey}",${_var} %}`;
  }

  enter() {
    this.rv = null;
  }
}

class Segment extends XNode {
  constructor(text) {
    super();
    this.text = text;
  }

  get nodeTag() {
    function replacer(match, p0, p1) {
      return "{{" + p1 + "}}";
    }
    const xvPattern = new RegExp("({% *xv)(.+?)(%})");
    let text = this.text;
    while (text.match(xvPattern)) {
      text = text.replace(xvPattern, replacer);
    }
    return `{%seg "${this.nodeKey}" %}${text}{%endseg%}`;
  }

  processRv(rv) {
    this._parent.processChildRv(rv);
  }

  getDebugInfo(offset) {
    const debug = super.getDebugInfo(offset);
    debug.value = this.text;
    if (debug.cellTag) {
      if (debug.cellTag.beforecell) {
        if (this.no === 0) {
          if (this._parent instanceof TagCell || this._parent.no === 0) {
            debug.value = debug.cellTag.beforecell + debug.value;
          }
        }
      }
      if (debug.cellTag.aftercell) {
        if (this.no === this._parent._children.length - 1) {
          if (
            this._parent instanceof TagCell ||
            this._parent.no === this._parent._parent._children.length - 1
          ) {
            debug.value += debug.cellTag.aftercell;
          }
        }
      }
    }
    return debug;
  }
}

class BlockSegment extends Segment {
  get nodeTag() {
    return this.text;
  }
}

class ImageSegment extends Segment {
  get nodeTag() {
    return `{%seg "${this.nodeKey}" %}{%endseg%}${this.text}`;
  }
}

class Section extends XNode {
  constructor(text, font, isRich) {
    super();
    this.text = text;
    this.font = font;
    this.isRich = isRich;
    this.unpack(text);
  }

  unpack(text) {
    const parts = text.split(reBlockSplit);
    for (let index = 0; index < parts.length; index++) {
      let child;
      const part = parts[index];
      if (index % 2 === 0) {
        if (part === "") {
          continue;
        }
        child = new Segment(part);
      } else {
        const tag = parseTag(part);
        if (tag === "img") {
          child = new ImageSegment(part);
        } else if (tag === "xv") {
          child = new Segment(part);
        } else {
          child = new BlockSegment(part);
        }
      }
      this.addChild(child);
    }
  }

  pack() {
    const text = this.childRvs.join("");
    if (this.isRich) {
      return this.isRich.packRun(text, this.font);
    }
    return text;
  }

  processChildRv(rv) {
    this.childRvs.push(rv);
  }

  enter() {
    this.childRvs = [];
  }

  exit() {
    const rv = this.pack();
    this._parent.processChildRv(rv);
  }
}

class TagCell extends CellNode {
  constructor(model, row, col, text) {
    super(model, row, col);
    this.addChild(new Section(text, null, false));
  }

  processChildRv(rv) {
    this.rv = rv;
  }
}

class RichTagCell extends CellNode {
  constructor(model, row, col, richText) {
    super(model, row, col);
    const runs = richText.getRuns();
    for (let i = 0; i < runs.length; i++) {
      const run = richText.unpackRun(runs[i]);
      this.addChild(new Section(run.text, run.font, richText));
    }
  }

  enter() {
    this.rv = [];
  }

  processChildRv(rv) {
    this.rv.push(rv);
  }
}

module.exports = { CellNode, XvCell, TagCell, RichTagCell };
