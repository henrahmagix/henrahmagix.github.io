import { createHTML } from './utils.js';

/** @type {import('showdown').Converter} */
let showdown;
function getShowdown() {
  if (!showdown) {
    showdown = new window.showdown.Converter();
    showdown.setFlavor('github');
    showdown.setOption('smoothLivePreview', true);
  }
  return showdown;
}

/** @type {(md: string) => string} */
export function markdownToHTML(md) {
  return getShowdown().makeHtml(md);
}

/** @type {(html: string) => string} */
export function htmlToMarkdown(html) {
  return getShowdown().makeMarkdown(html);
}

/** @type {(baseName: string, baseString: string, newName: string, newString: string) => HTMLElement} */
export function buildDiffView(baseName, baseString, newName, newString) {
  const baseLines = difflib.stringAsLines(baseString);
  const newLines = window.difflib.stringAsLines(newString);

  const diff = new window.difflib.SequenceMatcher(baseLines, newLines);
  const opcodes = diff.get_opcodes();

  const hasDiff = opcodes.length > 1 || (opcodes[0] && opcodes[0][0] !== 'equal');
  if (!hasDiff) {
    return createHTML('<p>No changes</p>');
  }

  return window.diffview.buildView({
    baseTextLines: baseLines,
    newTextLines: newLines,
    opcodes,
    baseTextName: baseName,
    newTextName: newName,
    contextSize: 3,
    viewType: 1, // inline
  });
}

import 'https://unpkg.com/js-yaml/dist/js-yaml.min.js';
export const yaml = {
  /** @type {(js: any) => string} */
  jsToYaml(js) {
    return window.jsyaml.dump(js, {
      lineWidth: -1,
      flowLevel: -1,
      noArrayIndent: false,
      noRefs: true,
    });
  },

  /** @type {(yaml: string) => any[]} */
  yamlToJS(yaml) {
    return window.jsyaml.loadAll(yaml, null, { json: true });
  },
};
