import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import { walkJsx } from './babel-walk';

const FORWARDING_COMPONENTS = new Set<string>([]);

function isTaggableJsxName(name: t.JSXOpeningElement['name']): name is t.JSXIdentifier {
  if (!t.isJSXIdentifier(name)) return false;
  return /^[a-z]/.test(name.name) || FORWARDING_COMPONENTS.has(name.name);
}

function alreadyTagged(opening: t.JSXOpeningElement): boolean {
  return opening.attributes.some(
    (attr) =>
      t.isJSXAttribute(attr) && t.isJSXIdentifier(attr.name) && attr.name.name === 'data-slide-loc',
  );
}

export function injectLocTags(code: string): string | null {
  let ast: t.File;
  try {
    ast = babelParse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }

  const insertions: { offset: number; text: string }[] = [];
  walkJsx(ast, (node) => {
    if (!t.isJSXElement(node) || !node.loc) return;
    const opening = node.openingElement;
    const name = opening.name;
    if (!isTaggableJsxName(name) || alreadyTagged(opening)) return;
    insertions.push({
      offset: name.end ?? 0,
      text: ` data-slide-loc="${node.loc.start.line}:${node.loc.start.column}"`,
    });
  });

  if (insertions.length === 0) return null;
  insertions.sort((a, b) => b.offset - a.offset);
  let next = code;
  for (const ins of insertions) {
    next = next.slice(0, ins.offset) + ins.text + next.slice(ins.offset);
  }
  return next;
}
