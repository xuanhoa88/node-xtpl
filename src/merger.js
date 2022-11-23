const { ColCache, Image } = require("./exceljs.lib");

class MergeMixin {
  setRange(rdRowx = -1, rdColx = -1, wtRowx = -1, wtColx = -1) {
    this.startRdRowx = rdRowx;
    this.startRdColx = rdColx;
    this.startWtRowx = wtRowx;
    this.startWtColx = wtColx;
    this.endWtRowx = wtRowx;
    this.endWtColx = wtColx;
  }

  isInRange(rdRowx, rdColx) {
    return (
      this._firstRow <= rdRowx &&
      rdRowx <= this._lastRow &&
      this._firstCol <= rdColx &&
      rdColx <= this._lastCol
    );
  }

  toBeMerged(rdRowx, rdColx) {
    if (rdRowx > this.startRdRowx) {
      return true;
    }
    return rdRowx === this.startRdRowx && rdColx > this.startRdColx;
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    if (!this.isInRange(rdRowx, rdColx)) {
      return false;
    }
    if (this.startRdRowx === -1) {
      this.setRange(rdRowx, rdColx, wtRowx, wtColx);
    } else if (this.toBeMerged(rdRowx, rdColx)) {
      this.endWtRowx = Math.max(this.endWtRowx, wtRowx);
      this.endWtColx = Math.max(this.endWtColx, wtColx);
    } else {
      this.newRange();
      this.setRange(rdRowx, rdColx, wtRowx, wtColx);
    }
    return true;
  }

  newRange() {}

  collectRange() {
    this.newRange();
    this.setRange();
  }
}

class CellMerge extends MergeMixin {
  constructor(cellRange, merger) {
    super();
    this.merger = merger;
    this.setRange();
    const { top, left, bottom, right } = ColCache.decodeEx(cellRange);
    this._firstRow = top;
    this._lastRow = bottom;
    this._firstCol = left;
    this._lastCol = right;
  }

  newRange() {
    if (
      this.startWtRowx === this.endWtRowx &&
      this.startWtColx === this.endWtColx
    ) {
      return;
    }
    this.merger.addNewRange([
      this.startWtRowx,
      this.startWtColx,
      this.endWtRowx,
      this.endWtColx,
    ]);
  }
}

class MergerMixin {
  get toMerge() {
    if (this._mergeList) {
      return true;
    }
  }
}

class CellMerger extends MergerMixin {
  constructor(sheetModel) {
    super();
    this.rangeList = [];
    this._mergeList = [];
    this.getMergeList(sheetModel);
  }

  getMergeList(sheetModel) {
    if (!sheetModel.mergeCells) {
      return;
    }
    sheetModel.mergeCells.forEach((mergeCell) => {
      this._mergeList.push(new CellMerge(mergeCell, this));
    });
  }

  addNewRange(range) {
    this.rangeList.push(range);
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    for (const _merge of this._mergeList) {
      if (_merge.mergeCell(rdRowx, rdColx, wtRowx, wtColx)) {
        break;
      }
    }
  }

  collectRange(wtSheet) {
    for (const _merge of this._mergeList) {
      _merge.collectRange();
    }
    for (const range of this.rangeList) {
      wtSheet.mergeCellsWithoutStyle(range);
    }
    this.rangeList = [];
  }
}

class DataValidation extends MergeMixin {
  constructor(dv, addressesList) {
    super();
    this.dv = dv;
    this.addressesList = [];
    this.addressMap = {};
    for (const address of addressesList) {
      const { row, col } = ColCache.decodeAddress(address);
      this.addressMap[[row, col]] = true;
    }
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    if (this.addressMap[[rdRowx, rdColx]]) {
      this.addressesList.push(ColCache.encode(wtRowx, wtColx));
    }
  }

  collectRange(wtSheet) {
    for (const address of this.addressesList) {
      wtSheet.dataValidations.add(address, this.dv);
    }
    this.addressesList = [];
  }
}

class DvMerger extends MergerMixin {
  constructor(sheetModel) {
    super();
    this._mergeList = [];
    this.getMergeList(sheetModel);
  }

  getMergeList(sheetModel) {
    if (!sheetModel.dataValidations) {
      return;
    }
    const dvMap = new Map();
    for (const address in sheetModel.dataValidations) {
      if (!sheetModel.dataValidations.hasOwnProperty(address)) {
        continue;
      }
      const dv = sheetModel.dataValidations[address];
      let dvList = dvMap.get(dv);
      if (dvList) {
        dvList.push(address);
      } else {
        dvList = [address];
        dvMap.set(dv, dvList);
      }
    }
    for (const [dv, dvList] of dvMap.entries()) {
      this._mergeList.push(new DataValidation(dv, dvList));
    }
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    for (const _merge of this._mergeList) {
      _merge.mergeCell(rdRowx, rdColx, wtRowx, wtColx);
    }
  }

  collectRange(wtSheet) {
    for (const _merge of this._mergeList) {
      _merge.collectRange(wtSheet);
    }
  }
}

class ImageMerge extends MergeMixin {
  constructor(image, merger, imageNoMap) {
    super();
    this.image = image;
    this.merger = merger;

    this.setRange();

    this.imageCopyMap = {};
    this.imgRefMap = {};

    const tl = image.range.tl;
    this._firstRow = tl.nativeRow + 1;
    this._firstCol = tl.nativeCol + 1;

    const br = image.range.br;
    this._lastRow = br.nativeRow + 1;
    this._lastCol = br.nativeCol + 1;

    this.no = imageNoMap[this.topLeft] || 0;
    imageNoMap[this.topLeft] = this.no + 1;
  }

  get topLeft() {
    return [this._firstRow, this._firstCol];
  }

  get mergeKey() {
    return [this._firstRow, this._firstCol, this.no];
  }

  newRange() {
    if (this.startWtRowx === -1) {
      return;
    }
    const image = new Image(null, this.image);
    const tl = image.range.tl;
    const br = image.range.br;
    tl.nativeRow = this.startWtRowx - 1;
    tl.nativeCol = this.startWtColx - 1;
    br.nativeRow = this.endWtRowx - 1;
    br.nativeCol = this.endWtColx - 1;
    this.imageCopyMap[[this.startWtRowx, this.startWtColx]] = image;
  }

  setImageRef(ref) {
    const { wtTopLeft } = ref;
    this.imgRefMap[wtTopLeft] = ref;
  }

  collectRange(wtSheet, wtBook) {
    this.newRange();
    this.setRange();
    for (const key in this.imageCopyMap) {
      if (!this.imageCopyMap.hasOwnProperty(key)) {
        continue;
      }

      const image = this.imageCopyMap[key];
      const ref = this.imgRefMap[key];
      wtSheet.addImage(
        ref
          ? wtBook.addImage(ref.image)
          : wtBook.addImageFromMedia(image.imageId),
        image.range
      );
    }
    this.imageCopyMap = {};
    this.imgRefMap = {};
  }
}

class ImageMerger extends MergerMixin {
  constructor(sheetModel) {
    super();
    this._mergeList = [];
    this._mergeMap = {};
    this.maxRow = 0;
    this.maxCol = 0;
    this.getMergeList(sheetModel);
  }

  getMergeList(sheetModel) {
    if (!sheetModel.media || sheetModel.media.length === 0) {
      return;
    }
    const noMap = {};
    for (const media of sheetModel.media) {
      if (media.type === "image") {
        const _merge = new ImageMerge(media, this, noMap);
        this._mergeMap[_merge.mergeKey] = _merge;
        this._mergeList.push(_merge);
        this.maxRow = Math.max(this.maxRow, _merge._lastRow);
        this.maxCol = Math.max(this.maxCol, _merge._lastCol);
      }
    }
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    for (const _merge of this._mergeList) {
      _merge.mergeCell(rdRowx, rdColx, wtRowx, wtColx);
    }
  }

  collectRange(wtSheet, wtBook) {
    for (const _merge of this._mergeList) {
      _merge.collectRange(wtSheet, wtBook);
    }
  }

  setImageRef(ref) {
    const { mergeKey } = ref;
    const _merge = this._mergeMap[mergeKey];
    if (_merge) {
      _merge.setImageRef(ref);
    }
  }
}

class AutoFilter extends MergeMixin {
  constructor(sheetModel) {
    super();
    if (!sheetModel.autoFilter) {
      this.toMerge = false;
      return;
    }
    this.toMerge = true;
    this.setRange();
    const { top, left, bottom, right } = ColCache.decodeEx(
      sheetModel.autoFilter
    );
    this._firstRow = top;
    this._lastRow = bottom;
    this._firstCol = left;
    this._lastCol = right;
    this.firstAutoFilter = null;
  }

  newRange() {
    if (this.startWtRowx === -1) {
      return;
    }
    if (!this.firstAutoFilter) {
      this.firstAutoFilter = [
        this.startWtRowx,
        this.startWtColx,
        this.endWtRowx,
        this.endWtColx,
      ];
    }
  }

  collectRange(wtSheet) {
    this.newRange();
    this.setRange();
    if (wtSheet.autoFilter) {
      this.firstAutoFilter = null;
      return;
    }
    if (this.firstAutoFilter) {
      wtSheet.autoFilter = ColCache.encode(...this.firstAutoFilter);
      this.firstAutoFilter = null;
    }
  }
}

class Merger {
  constructor(sheetModel) {
    this.mergersList = [];
    for (const merger of [
      new CellMerger(sheetModel),
      new AutoFilter(sheetModel),
      new DvMerger(sheetModel),
      (this.imageMerger = new ImageMerger(sheetModel)),
    ]) {
      if (merger.toMerge) {
        this.mergersList.push(merger);
      }
    }
  }

  mergeCell(rdRowx, rdColx, wtRowx, wtColx) {
    for (const merger of this.mergersList) {
      merger.mergeCell(rdRowx, rdColx, wtRowx, wtColx);
    }
  }

  collectRange(wtSheet, wtBook) {
    for (const merger of this.mergersList) {
      merger.collectRange(wtSheet, wtBook);
    }
  }

  setImageRef(ref) {
    this.imageMerger.setImageRef(ref);
  }
}

module.exports = { Merger };
