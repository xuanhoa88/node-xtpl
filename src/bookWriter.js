const { Xlsx, Workbook } = require("./exceljs.lib");
const { SheetWriterMap } = require("./sheetWriter");
const { SheetResourceMap } = require("./sheetResource");

class Book extends Workbook {
  constructor(bookModel) {
    super();
    this.bookModel = bookModel;
    this.company = bookModel.company;
    this.manager = bookModel.manager;
    this.title = bookModel.title;
    this.subject = bookModel.subject;
    this.keywords = bookModel.keywords;
    this.category = bookModel.category;
    this.description = bookModel.description;
    this.language = bookModel.language;
    this.revision = bookModel.revision;
    this.contentStatus = bookModel.contentStatus;
    this.properties = bookModel.properties;
    this._definedNames.model = bookModel.definedNames;
    this.views = bookModel.views;
    this.themes = bookModel.themes;
    this.defaultFont = bookModel.defaultFont;
    this.media = [];
    this.creator = "xtpl";
    this.imageMap = new Map();
  }

  addImage(image) {
    const key = image.filename || image.buffer || image.base64;
    if (!key) {
      throw new Error("Unsupported media");
    }
    let imageId = this.imageMap.get(key);
    if (imageId != null) {
      return imageId;
    }
    imageId = super.addImage(image);
    this.imageMap.set(key, imageId);
    return imageId;
  }

  addImageFromMedia(imageId) {
    let _imageId = this.imageMap.get(imageId);
    if (_imageId != null) {
      return _imageId;
    }
    _imageId = super.addImage(this.bookModel.media[imageId]);
    this.imageMap.set(imageId, _imageId);
    return _imageId;
  }
}

class BookWriter extends Xlsx {
  constructor() {
    super({});
    this.sheetWriterMap = new SheetWriterMap(this);
    this.sheetResourceMap = new SheetResourceMap(this);
  }

  loadSheets() {
    this.bookModel = this.workbook.model;
    this.bookModel.worksheets.forEach((sheet) => {
      this.sheetResourceMap.addSheet(sheet);
    });
  }

  getSheetName(sheetName) {
    if (sheetName) {
      return sheetName;
    }
    for (let i = 0; i < 9999; i++) {
      sheetName = `sheet${i}`;
      if (!this.sheetWriterMap.hasName(sheetName)) {
        return sheetName;
      }
    }
    return "XLSheet";
  }

  createWorkbook() {
    if (this.workbook && this.workbook.creator === "xtpl") {
      return;
    }
    this.workbook = new Book(this.bookModel);
  }

  renderSheet(data, sheetName) {
    this.createWorkbook();

    const sheetResource = this.sheetResourceMap.getSheetResource(sheetName);
    sheetResource.renderSheet(
      this.sheetWriterMap.getSheetWriter(
        sheetResource,
        this.getSheetName(sheetName)
      ),
      data
    );
  }

  renderSheets(values) {
    values.forEach(({ sheetName, data }) => this.renderSheet(data, sheetName));
  }

  clearBook() {
    this.workbook = null;
    this.sheetWriterMap.clear();
  }

  prepareModel(model, options) {
    // there is a bug in worksheet-xform.js line: 223+++
    // rId refers to wrong image
    // https://github.com/exceljs/exceljs/issues/1804
    // sort the images by imageId
    model.worksheets.forEach((worksheet) => {
      worksheet.media.sort((m, n) => m.imageId - n.imageId);
    });
    super.prepareModel(model, options);
  }

  async load(data, options) {
    await super.load(data, options);
    this.loadSheets();
  }

  async write(stream, options) {
    await super.write(stream, options);
    this.clearBook();
  }

  async writeFile(fileName) {
    await super.writeFile(fileName);
  }
}

module.exports = BookWriter;
