class SheetWriter {
  constructor(bookWriter, sheetResource, sheetName) {
    this.bookWriter = bookWriter;
    this.sheetResource = sheetResource;
    this.rdSheet = sheetResource.sheetModel;
    this.wtSheet = bookWriter.workbook.addWorksheet(sheetName);
    this.copySheetSettings();
    this.currentRowNum = 0;
    this.currentColNum = 0;
    this.currentRow = null;
    this.colNums = new Map();
  }

  setSheetResource(sheetResource) {
    this.sheetResource = sheetResource;
    this.rdSheet = sheetResource.sheetModel;
  }

  copySheetSettings() {
    this.wtSheet.properties = this.rdSheet.properties;
    this.wtSheet.pageSetup = this.rdSheet.pageSetup;
    this.wtSheet.headerFooter = this.rdSheet.headerFooter;
    this.wtSheet.views = this.rdSheet.views;
    this.wtSheet.sheetProtection = this.rdSheet.sheetProtection;
  }

  copyColumn(rdColNum, wtColNum) {
    if (!this.colNums.get(wtColNum)) {
      const colModel = this.rdSheet.columns[rdColNum - 1];
      if (colModel) {
        const wtCol = this.wtSheet.getColumn(wtColNum);
        wtCol.defn = colModel.defn;
        this.colNums.set(wtColNum, wtColNum);
      }
    }
  }

  writeRow(rowNode) {
    this.currentRowNum++;
    this.currentColNum = 0;
    const rowModel = rowNode.model;
    if (rowModel) {
      this.currentRow = this.wtSheet.getRow(this.currentRowNum);
      if (rowModel.height) {
        this.currentRow.height = rowModel.height;
      } else {
        delete this.currentRow.height;
      }
      this.currentRow.hidden = rowModel.hidden;
      this.currentRow.outlineLevel = rowModel.outlineLevel || 0;
      this.currentRow.style =
        (rowModel.style && JSON.parse(JSON.stringify(rowModel.style))) || {};
    }
  }

  writeCell(cellNode) {
    this.currentColNum++;
    this.sheetResource.merge(
      cellNode.row,
      cellNode.col,
      this.currentRowNum,
      this.currentColNum
    );
    this.copyColumn(cellNode.col, this.currentColNum);
    const model = cellNode.model;
    if (!model.isNull) {
      const wtCell = this.currentRow.getCell(this.currentColNum);
      model.writeCell(cellNode, wtCell);
    }
  }

  setImageRef(ref) {
    ref.wtRow = this.currentRowNum;
    ref.wtCol = this.currentColNum + 1;
    this.sheetResource.setImageRef(ref);
  }
}

class SheetWriterMap {
  constructor(bookWriter) {
    this.bookWriter = bookWriter;
    this.map = new Map();
  }

  getSheetWriter(sheetResource, sheetName) {
    let sheetWriter = this.map.get(sheetName);
    if (!sheetWriter) {
      sheetWriter = new SheetWriter(this.bookWriter, sheetResource, sheetName);
      this.map.set(sheetName, sheetWriter);
    } else {
      sheetWriter.setSheetResource(sheetResource);
    }
    return sheetWriter;
  }

  hasName(sheetName) {
    return !!this.map.get(sheetName);
  }

  clear() {
    this.map.clear();
  }
}

module.exports = { SheetWriter, SheetWriterMap };
