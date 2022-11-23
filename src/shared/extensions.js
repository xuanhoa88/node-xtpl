const ImageRef = require("./imageRef");

class NodeExtension {
  constructor() {
    this.tags = ["row", "node", "cell", "root"];
  }

  parse(parser, nodes, _lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, "run", args, []);
  }

  run(context, key) {
    const nodeMap = context.env.nodeMap;
    nodeMap.getNode(key);
    return "node";
  }
}

class XvExtension {
  constructor() {
    this.tags = ["xv"];
  }
  parse(parser, nodes, _lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, "run", args, []);
  }

  run(context, key, xv) {
    const nodeMap = context.env.nodeMap;
    const cell = nodeMap.getNode(key);
    if (!xv) {
      xv = "";
    }
    cell.rv = xv;
    return "xv";
  }
}

class SegmentExtension {
  constructor() {
    this.tags = ["seg"];
  }

  parse(parser, nodes, _lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    const body = parser.parseUntilBlocks("endseg");
    parser.advanceAfterBlockEnd();
    return new nodes.CallExtension(this, "run", args, [body]);
  }

  run(context, key, body) {
    const nodeMap = context.env.nodeMap;
    const seg = nodeMap.getNode(key);
    const rv = body();
    seg.processRv(rv);
    return "seg";
  }
}

class ImageExtension {
  constructor() {
    this.tags = ["img"];
  }

  parse(parser, nodes, _lexer) {
    const tok = parser.nextToken();
    const args = parser.parseSignature(null, true);
    parser.advanceAfterBlockEnd(tok.value);
    return new nodes.CallExtension(this, "run", args, []);
  }

  run(context, ref, no) {
    const instanced = new ImageRef(ref, no);
    if (!instanced.image) {
      return "no image ref";
    }
    context.env.nodeMap.currentNode.setImageRef(instanced);
    return "img";
  }
}

module.exports = {
  NodeExtension,
  XvExtension,
  SegmentExtension,
  ImageExtension,
};
