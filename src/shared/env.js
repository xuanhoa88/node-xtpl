const nunjucks = require("nunjucks");
const {
  NodeExtension,
  XvExtension,
  SegmentExtension,
  ImageExtension,
} = require("./extensions");

function createChecksumId(str, seed = 0) {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

class Env {
  constructor(nodeMap, offset) {
    const env = new nunjucks.Environment();
    env.addExtension("NodeExtension", new NodeExtension());
    env.addExtension("XvExtension", new XvExtension());
    env.addExtension("SegmentExtension", new SegmentExtension());
    env.addExtension("ImageExtension", new ImageExtension());
    env.nodeMap = nodeMap;
    this.env = env;
    this.offset = offset;
  }

  compile(tmplStr) {
    try {
      return nunjucks.compile(tmplStr, this.env, createChecksumId(tmplStr));
    } catch (e) {
      this.log(tmplStr, e);
      throw e;
    }
  }

  log(messages, e) {
    const lines = `${messages}`.split("\n");
    for (let i = 0, l = lines.length; i < l; i++) {
      const line = lines[i];
      if (i === e.lineno - 1) {
        this.logErrorLine(e, lines);
      } else {
        this.logLine(line, i + 1);
      }
    }
    this.logErrorLine(e, lines);
  }

  getDebugInfo(line) {
    const pattern = /"(\d*,\d*[,\d]*)"/;
    const m = line.match(pattern);
    if (m) {
      const [, key] = m;
      const node = this.env.nodeMap.getTagNode(key);
      if (node) {
        return node.getDebugInfo(this.offset);
      }
    }
  }

  logLine(line, lineNo) {
    const debug = this.getDebugInfo(line);
    if (debug) {
      console.log(`line ${lineNo}: ${line}       <<<--- ${debug.address}`);
    } else {
      console.log(`line ${lineNo}: ${line}       <<<--- no match `);
    }
  }

  logErrorLine(e, lines) {
    const redFmt = "\x1b[31m%s\x1b[0m";
    const errorFmt = "\x1b[31m%s\x1b[0m\x1b[35m%s\x1b[0m\x1b[34m%s\x1b[0m";
    const errorLine = lines[e.lineno - 1];
    if (errorLine) {
      const p0 = errorLine.slice(0, e.colno - 1);
      const p1 = errorLine.slice(e.colno - 1);
      const debug = this.getDebugInfo(errorLine);
      console.log(redFmt, `Syntax Error in ${debug.address}`);
      console.log(errorFmt, "Original text --->>>   ", debug.value, "");
      console.log(errorFmt, `line ${e.lineno}: `, p0, p1);
    }
    console.log(redFmt, "Error message: " + e.message);
  }
}

module.exports = Env;
