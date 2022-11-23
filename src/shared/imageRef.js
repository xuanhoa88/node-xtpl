class ImageRef {
  constructor(ref, no) {
    this.ref = ref;
    this.no = no || 0;
    this.rdRow = 0;
    this.rdCol = 0;
    this.wtRow = 0;
    this.wtCol = 0;
  }

  get wtTopLeft() {
    return [this.wtRow, this.wtCol];
  }

  get mergeKey() {
    return [this.rdRow, this.rdCol, this.no];
  }

  get image() {
    if (!this.ref) {
      return;
    }
    if (typeof this.ref === "string") {
      const extension = `${this.ref}`.match(/\.[0-9a-z]+$/i)[0];
      return { filename: this.ref, extension };
    }
    if (this.ref.filename || this.ref.buffer || this.ref.base64) {
      return this.ref;
    }
    throw new Error("Unsupported media");
  }
}

module.exports = ImageRef;
