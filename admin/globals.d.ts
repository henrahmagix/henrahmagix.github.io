declare namespace github {
  interface GetContentFileResponse {
    name: string;
    path: string;
    content: string;
    sha: string;
  }
  type GetContentFolderResponse = GetContentFileResponse[];
  interface PutContentFileResponse {
    content: {
      sha: string;
    };
    commit: {
      sha: string;
    };
  }
  interface GetBranchResponse {
    name: string;
    commit: {
      sha: string;
    };
  }
  interface GetTreeResponse {
    sha: string;
    tree: github.Tree[];
  }
  interface PostTreeRequest {
    base_tree?: string;
    tree: github.Tree[];
  }
  interface PostTreeResponse {
    sha: string;
    tree: github.Tree[];
  }
  interface Tree {
    path: string;
    mode: string;
    type: string;
    sha: string;
  }
  interface PostCommitRequest {
    message: string;
    tree: string;
    parents: string[];
  }
  interface PatchRefsHeadsRequest {
    sha: string;
  }
}

declare namespace lib {
  interface markdownRenderer {
    markdownToHTML: (md: string) => string;
  }
  interface diffBuilder {
    buildView(baseName: string, baseString: string, newName: string, newString: string): HTMLElement;
  }
}

declare namespace difflib {
  type lines = string[];
  type opcode = [string, number, number, number, nubmer];

  declare function stringAsLines(str: string): lines;

  class SequenceMatcher {
    constructor(a: lines, b : lines);
    get_opcodes(): opcode[];
  }
}

declare namespace diffview {
  function buildView(opts: {
    baseTextLines: lines;
    newTextLines: lines;
    opcodes: opcode[];
    baseTextName: string;
    newTextName: string;
    contextSize: number;
    viewType: 0|1;
  }): HTMLTableElement;
}
