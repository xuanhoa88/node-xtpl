const FixTest = new RegExp("({(?:___\\d+___)?[{%].+?[}%](?:___\\d+___)?})");
const RunSplit = new RegExp("(___\\d+___)");
const RunSplit2 = new RegExp("___(\\d+)___");

function fixTest(text) {
  const parts = `${text}`.split(FixTest);
  for (let i = 1; i < parts.length; i += 2) {
    const part = parts[i];
    const m = part.match(RunSplit);
    if (m) {
      return true;
    }
  }
}

function fixStep2(text) {
  const parts = `${text}`.split(RunSplit);
  let p0 = "";
  let p1 = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 0) {
      p0 += part;
    } else {
      p1 += part;
    }
  }
  return p0 + p1;
}

function tagFix(text) {
  const parts = text.split(FixTest);
  let p = "";
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 1) {
      p += fixStep2(part);
    } else {
      p += part;
    }
  }

  const d = {};
  parts = `${p}`.split(RunSplit2);
  for (let i = 1; i < parts.length; i += 2) {
    d[Number(parts[i])] = parts[i + 1];
  }
  return d;
}

class RichText {
  constructor(richText) {
    this.richText = richText;
  }

  get text() {
    return this.richText.map((t) => this.getTextOfRun(t)).join("");
  }

  chop(head, tail) {
    let st = 0;
    let end = -1;
    const runs = [];
    for (const run of this.richText) {
      let { text, font } = this.unpackRun(run);
      st = end + 1;
      end += text.length;
      if (end < head) {
        //continue
      } else if (st <= head && head <= end) {
        if (end < tail) {
          const textSt = head - st;
          text = text.slice(textSt);
          runs.push(this.packRun(text, font));
        } else {
          const textSt = head - st;
          const textEnd = tail - st;
          text = text.slice(textSt, textEnd + 1);
          runs.push(this.packRun(text, font));
          break;
        }
      } else if (end < tail) {
        runs.push(this.packRun(text, font));
      } else {
        const textEnd = tail - st;
        text = text.slice(0, textEnd + 1);
        runs.push(this.packRun(text, font));
        break;
      }
    }
    this.richText = runs;
  }

  text4Fix() {
    const text = [];
    for (let i = 0; i < this.richText.length; i++) {
      const run = this.richText[i];
      text.push(`___${i}___`);
      text.push(this.getTextOfRun(run));
    }
    return text.join("");
  }

  getRuns() {
    const text4Fix = this.text4Fix();
    if (fixTest(text4Fix)) {
      const runs = [];
      const fixed = tagFix(text4Fix);
      for (let i = 0; i < this.richText.length; i++) {
        const text = fixed[i];
        if (text) {
          const run = this.richText[i];
          runs.push(this.packRun(text, run));
        }
      }
      return runs;
    }
    return this.richText;
  }
}

module.exports = RichText;
