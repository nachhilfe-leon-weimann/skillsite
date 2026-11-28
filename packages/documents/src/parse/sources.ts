import type { Node } from "mdast";
import { visit } from "unist-util-visit";

/** A Markdown file: its path as errors name it ("content/agb.md") and its text. */
export interface SourceFile {
  file: string;
  source: string;
}

/** A place in a source file. */
export interface Location {
  file: string;
  line: number;
}

/** A build error at a place in a source file: "content/agb.md:12: <reason>". */
export class DocumentError extends Error {
  readonly file: string;
  readonly line: number;
  readonly reason: string;

  constructor({ file, line }: Location, reason: string) {
    super(`${file}:${line}: ${reason}`);
    this.name = "DocumentError";
    this.file = file;
    this.line = line;
    this.reason = reason;
  }
}

/** The nearest ancestor of every node, recorded while a tree is walked. */
export type Parents = WeakMap<Node, Node>;

/**
 * The first line of a node, or of its nearest ancestor with a place: nodes
 * that a transform creates, such as the links of GFM's autolink literals,
 * have no position of their own.
 */
export function firstLine(node: Node, parents: Parents): number {
  let current: Node | undefined = node;
  while (current && !current.position) current = parents.get(current);
  return current?.position?.start.line ?? 1;
}

/**
 * The source file of every Markdown node of one document. A partial's nodes
 * keep their own file after they are spliced into the document, so an error
 * names the file and line the author has to open.
 */
export class Sources {
  private readonly files = new WeakMap<Node, SourceFile>();
  private readonly parents: Parents = new WeakMap();
  private readonly root: SourceFile;

  constructor(root: SourceFile) {
    this.root = root;
  }

  /** Records `file` as the source of `tree` and every node in it, and each node's parent. */
  register(tree: Node, file: SourceFile): void {
    visit(tree, (node, _index, parent) => {
      this.files.set(node, file);
      if (parent) this.parents.set(node, parent);
    });
  }

  /** The file a node comes from. */
  fileOf(node: Node): SourceFile {
    return this.files.get(node) ?? this.root;
  }

  /** The node's place: its file and its first line (or its nearest placed ancestor's). */
  locate(node: Node): Location {
    return {
      file: this.fileOf(node).file,
      line: firstLine(node, this.parents),
    };
  }

  /** The node's source text. */
  text(node: Node): string {
    const { start, end } = node.position ?? {};
    if (start?.offset === undefined || end?.offset === undefined) return "";
    return this.fileOf(node).source.slice(start.offset, end.offset);
  }

  /** A build error at the node, `lineOffset` lines below its first line. */
  error(node: Node, reason: string, lineOffset = 0): DocumentError {
    const { file, line } = this.locate(node);
    return new DocumentError({ file, line: line + lineOffset }, reason);
  }
}
