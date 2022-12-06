const { Root, RowNode, XNode } = require("./shared/node");
const NodeMap = require("./shared/nodeMap");
const Env = require("./shared/env");
const { Merger } = require("./merger");
const { getCellNode } = require("./cellModel");
const { ColCache, Column } = require("./exceljs.lib");

class SheetResource {
  constructor(sheetModel, bookWriter) {
    this.sheetModel = sheetModel;
    this.bookWriter = bookWriter;
    this.nodeMap = new NodeMap();
    this.env = new Env(this.nodeMap, 0);
    this.merger = new Merger(sheetModel);
    this.sheetTree = this.createSheetTree();
    this.compile = this.env.compile(this.sheetTree.toTag());
  }

  createSheetTree() {
    const sheetModel = this.sheetModel;
    const nodeMap = this.nodeMap;
    const merger = this.merger;
    const cellModels = {};
    const rowModels = [];
    let { maxRow, maxCol } = merger.imageMerger;
    sheetModel.rows.forEach((rowModel) => {
      rowModels[rowModel.number] = rowModel;
      rowModel.cells.forEach((cellModel) => {
        const { row, col } = ColCache.decodeAddress(cellModel.address);
        cellModels[[row, col]] = cellModel;
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      });
    });

    sheetModel.columns = Column.fromModel(sheetModel, sheetModel.cols) || [];

    const root = new Root(sheetModel.sheetNo, nodeMap);
    for (let r = 1; r <= maxRow; r++) {
      const rowModel = rowModels[r];
      const rowNode = new RowNode(rowModel);
      root.addChild(rowNode);
      if (rowModel) {
        for (let c = 1; c <= maxCol; c++) {
          const cellModel = cellModels[[r, c]];
          const cellNode = getCellNode(cellModel, r, c);
          root.addChild(cellNode);
          if (c === 1 && cellNode.cellTag && cellNode.cellTag.beforerow) {
            rowNode.cellTag = cellNode.cellTag;
          }
        }
      }
    }
    root.addChild(new XNode());
    return root;
  }

  merge(rdRowx, rdColx, wtRowx, wtColx) {
    this.merger.mergeCell(rdRowx, rdColx, wtRowx, wtColx);
  }

  setImageRef(ref) {
    this.merger.setImageRef(ref);
  }

  renderSheet(writer, data) {
    this.sheetTree.setSheetWriter(writer);
    this.compile.render(data);
    this.merger.collectRange(writer.wtSheet, writer.bookWriter.workbook);
  }
}

class SheetState {
  constructor(bookWriter, sheetModel) {
    this.bookWriter = bookWriter;
    this.sheetModel = sheetModel;
    this.sheetResource = null;
  }

  getSheetResource() {
    if (!this.sheetResource) {
      this.sheetResource = new SheetResource(this.sheetModel, this.bookWriter);
    }
    return this.sheetResource;
  }
}

class SheetResourceMap {
  constructor(bookWriter) {
    this.bookWriter = bookWriter;
    this.map = new Map();
  }

  addSheet(sheet) {
    const sheetState = new SheetState(this.bookWriter, sheet);
    this.map.set(sheet.name, sheetState);
    this.map.set(sheet.sheetNo - 1, sheetState);
  }

  getSheetResource(sheetName) {
    return this.map.get(sheetName || 0).getSheetResource();
  }
}

module.exports = { SheetResourceMap };
