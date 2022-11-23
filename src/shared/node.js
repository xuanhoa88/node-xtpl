class DebugInfo {
  constructor() {
    this.value = null;
    this.cellTag = null;
    this.address = "";
  }
}

class XNode {
  constructor() {
    this._parent = null;
    this._children = [];
    this._depth = -1;
    this._nodeMap = null;
    this.no = 0;
    this.extTag = "node";
  }

  get depth() {
    if (this._depth === -1) {
      this._depth =
        this._parent == null || this._parent === this
          ? 0
          : this._parent.depth + 1;
    }
    return this._depth;
  }

  get nodeKey() {
    return `${this._parent.nodeKey},${this.no}`;
  }

  get nodeTag() {
    return `{% ${this.extTag} "${this.nodeKey}" %}`;
  }

  get nodeMap() {
    if (this._nodeMap == null) {
      this._nodeMap = this._parent.nodeMap;
    }
    return this._nodeMap;
  }

  childrenToTag() {
    return this._children.map((child) => child.toTag()).join("\n");
  }

  toTag() {
    if (this._children.length > 0) {
      return this.childrenToTag();
    }
    this.nodeMap.put(this.nodeKey, this);
    return this.nodeTag;
  }

  addChild(child) {
    child.no = this._children.length;
    child._parent = this;
    this._children.push(child);
  }

  enter() {}

  reenter() {
    this.enter();
  }

  childReenter() {}

  exit() {}

  setImageRef(ref) {
    this._parent.setImageRef(ref);
  }

  getDebugInfo(offset) {
    return this._parent.getDebugInfo(offset);
  }
}

class RowNode extends XNode {
  constructor(model) {
    super();
    this.extTag = "row";
    this.model = model;
    this.cellTag = null;
  }

  toTag() {
    const tag = super.toTag();
    if (this.cellTag) {
      return this.cellTag.beforerow + tag;
    }
    return tag;
  }

  writeRow() {
    this._parent.writeRow(this);
  }

  enter() {
    this.writeRow();
  }

  getDebugInfo(offset) {
    const debug = new DebugInfo();
    debug.address = `Row ${this.model.number + offset}`;
    if (this.cellTag) {
      debug.value = this.cellTag.beforerow;
    }
    return debug;
  }
}

class Root extends XNode {
  constructor(sheetNo, nodeMap) {
    super();
    this.extTag = "root";
    this.no = sheetNo;
    this._nodeMap = nodeMap;
    this._depth = 0;
    this.sheetWriter = null;
  }

  get nodeKey() {
    return this.no;
  }

  setSheetWriter(sheetWriter) {
    this.sheetWriter = sheetWriter;
    this.nodeMap.setCurrentNode(this);
  }

  writeRow(rowNode) {
    this.sheetWriter.writeRow(rowNode);
  }

  writeCell(cellNode) {
    this.sheetWriter.writeCell(cellNode);
  }

  setImageRef(ref) {
    this.sheetWriter.setImageRef(ref);
  }

  getDebugInfo() {
    const debug = new DebugInfo();
    debug.address = `Sheet ${this.no}`;
    return debug;
  }
}

module.exports = { Root, RowNode, XNode, DebugInfo };
