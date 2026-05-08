import { parse as babelParse } from '@babel/parser';
import * as t from '@babel/types';
import { walkAll, walkJsx } from './babel-walk';

// ── Types ──────────────────────────────────────────────────────────

export type EditOp =
  | { kind: 'set-style'; key: string; value: string | null }
  | { kind: 'set-text'; value: string; prevText?: string }
  | { kind: 'set-attr-asset'; attr: string; assetPath: string; previewUrl?: string }
  | { kind: 'replace-placeholder-with-image'; assetPath: string };

export type ApplyEditResult =
  | { ok: true; source: string }
  | { ok: false; status: number; error: string };

type Splice = { from: number; to: number; text: string };

// ── Parsing ────────────────────────────────────────────────────────

function parseSource(source: string): t.File | null {
  try {
    return babelParse(source, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
      errorRecovery: true,
    });
  } catch {
    return null;
  }
}

// ── JSX Element Lookup ─────────────────────────────────────────────

function findInnermostJsxElement(ast: t.Node, line: number, column: number): t.JSXElement | null {
  const exact = findJsxByStart(ast, line, column);
  if (exact) return exact;
  for (const n of findJsxAncestors(ast, line, column)) {
    if (t.isJSXElement(n)) return n;
  }
  return null;
}

function findJsxByStart(ast: t.Node, line: number, column: number): t.JSXElement | null {
  let hit: t.JSXElement | null = null;
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n) || !n.loc) return;
    const s = n.loc.start;
    if (s.line === line && s.column === column) {
      hit = n;
      return 'stop';
    }
  });
  return hit;
}

// ── String/Attribute Utilities ─────────────────────────────────────

function jsString(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'`;
}

function jsxAttrName(attr: t.JSXAttribute): string | null {
  return t.isJSXIdentifier(attr.name) ? attr.name.name : null;
}

function findJsxAttr(opening: t.JSXOpeningElement, name: string): t.JSXAttribute | null {
  for (const attr of opening.attributes) {
    if (t.isJSXAttribute(attr) && jsxAttrName(attr) === name) return attr;
  }
  return null;
}

// ── JSX Ancestor Walking ───────────────────────────────────────────

type JsxContainer = t.JSXElement | t.JSXFragment;

function findJsxAncestors(ast: t.Node, line: number, column: number): JsxContainer[] {
  const hits: { node: JsxContainer; size: number }[] = [];
  walkJsx(ast, (n) => {
    if (!n.loc || (!t.isJSXElement(n) && !t.isJSXFragment(n))) return;
    const s = n.loc.start;
    const e = n.loc.end;
    const afterStart = line > s.line || (line === s.line && column >= s.column);
    const beforeEnd = line < e.line || (line === e.line && column < e.column);
    if (afterStart && beforeEnd) {
      hits.push({ node: n, size: (n.end ?? 0) - (n.start ?? 0) });
    }
  });
  hits.sort((a, b) => a.size - b.size);
  return hits.map((h) => h.node);
}

// ── Line/Offset Utilities ──────────────────────────────────────────

function lineToOffset(source: string, line: number): number {
  let off = 0;
  for (let l = 1; l < line; l++) {
    const nl = source.indexOf('\n', off);
    if (nl === -1) return source.length;
    off = nl + 1;
  }
  return off;
}

function lineIndent(source: string, lineNumber: number): string {
  const start = lineToOffset(source, lineNumber);
  const m = source.slice(start, start + 200).match(/^[ \t]*/);
  return m?.[0] ?? '';
}

// ── set-style Handler ──────────────────────────────────────────────

function buildStyleSplice(
  source: string,
  element: t.JSXElement,
  ops: Array<{ key: string; value: string | null }>,
): Splice | { error: string } | null {
  const opening = element.openingElement;
  const existing = findJsxAttr(opening, 'style');
  const style = new Map<string, string>();

  if (existing) {
    const value = existing.value;
    if (!value || !t.isJSXExpressionContainer(value)) {
      return { error: 'style attribute has unsupported form' };
    }
    const expr = value.expression;
    if (!t.isObjectExpression(expr)) {
      return { error: 'style is not a literal object' };
    }
    for (const prop of expr.properties) {
      if (!t.isObjectProperty(prop)) {
        return { error: 'style contains spread or method' };
      }
      if (prop.computed) return { error: 'style has computed key' };
      let keyName: string | null = null;
      if (t.isIdentifier(prop.key)) keyName = prop.key.name;
      else if (t.isStringLiteral(prop.key)) keyName = prop.key.value;
      if (!keyName) return { error: 'style has unsupported key' };
      const v = prop.value;
      if (typeof v.start !== 'number' || typeof v.end !== 'number') {
        return { error: 'style value missing source range' };
      }
      style.set(keyName, source.slice(v.start, v.end));
    }
  }

  for (const op of ops) {
    if (op.value === null) style.delete(op.key);
    else style.set(op.key, jsString(op.value));
  }

  if (style.size === 0) {
    if (!existing) return null;
    let from = existing.start ?? 0;
    if (from > 0 && source[from - 1] === ' ') from -= 1;
    return { from, to: existing.end ?? 0, text: '' };
  }

  const propsText = Array.from(style.entries())
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  const newAttr = `style={{ ${propsText} }}`;

  if (existing) {
    return { from: existing.start ?? 0, to: existing.end ?? 0, text: newAttr };
  }
  return { from: opening.name.end ?? 0, to: opening.name.end ?? 0, text: ` ${newAttr}` };
}

// ── Text Candidate System ──────────────────────────────────────────

function formatJsxText(value: string): string {
  if (/[{}<>]/.test(value) || /^\s|\s$/.test(value) || value === '') {
    return `{${jsString(value)}}`;
  }
  return value;
}

type TextCandidate = {
  current: string;
  splice: (value: string) => Splice;
};

function meaningfulChildren(parent: JsxParent): t.Node[] {
  return parent.children.filter((c) => {
    if (t.isJSXText(c)) return c.value.trim() !== '';
    return true;
  });
}

type JsxParent = t.JSXElement | t.JSXFragment;

function wrapSplice(parent: JsxParent, text: string): Splice {
  const first = parent.children[0];
  const last = parent.children[parent.children.length - 1];
  return { from: first.start ?? 0, to: last.end ?? 0, text };
}

function collectTextCandidates(element: JsxParent, out: TextCandidate[]): void {
  const meaningful = meaningfulChildren(element);
  const isSole = meaningful.length === 1;
  for (const child of meaningful) {
    if (t.isJSXText(child)) {
      const current = child.value.trim();
      if (!current) continue;
      out.push({
        current,
        splice: (v) =>
          isSole
            ? wrapSplice(element, formatJsxText(v))
            : { from: child.start ?? 0, to: child.end ?? 0, text: formatJsxText(v) },
      });
    } else if (t.isJSXExpressionContainer(child)) {
      const expr = child.expression;
      if (t.isStringLiteral(expr) || t.isNumericLiteral(expr)) {
        const current = String(expr.value);
        out.push({
          current,
          splice: (v) =>
            isSole
              ? wrapSplice(element, `{${jsString(v)}}`)
              : { from: child.start ?? 0, to: child.end ?? 0, text: `{${jsString(v)}}` },
        });
      }
    } else if (t.isJSXElement(child) || t.isJSXFragment(child)) {
      collectTextCandidates(child, out);
    }
  }
}

// ── Prop Passthrough Detection ─────────────────────────────────────

function propPassthroughName(element: t.JSXElement): string | null {
  const meaningful = meaningfulChildren(element);
  if (meaningful.length !== 1) return null;
  const child = meaningful[0];
  if (!t.isJSXExpressionContainer(child)) return null;
  return t.isIdentifier(child.expression) ? child.expression.name : null;
}

// ── Enclosing Component Detection ──────────────────────────────────

type EnclosingComponent = {
  name: string;
  fn: t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression;
};

function findEnclosingComponent(ast: t.File, target: t.Node): EnclosingComponent | null {
  let best: EnclosingComponent | null = null;
  let bestSize = Number.POSITIVE_INFINITY;
  const targetStart = target.start ?? 0;
  const targetEnd = target.end ?? 0;
  const consider = (name: string, fn: EnclosingComponent['fn']) => {
    if (!/^[A-Z]/.test(name)) return;
    const fnStart = fn.start ?? 0;
    const fnEnd = fn.end ?? 0;
    if (fnStart > targetStart || fnEnd < targetEnd) return;
    const size = fnEnd - fnStart;
    if (size < bestSize) {
      best = { name, fn };
      bestSize = size;
    }
  };
  const visitDecl = (decl: t.Statement) => {
    if (t.isFunctionDeclaration(decl) && decl.id) {
      consider(decl.id.name, decl);
    } else if (t.isVariableDeclaration(decl)) {
      for (const d of decl.declarations) {
        if (!t.isVariableDeclarator(d) || !t.isIdentifier(d.id) || !d.init) continue;
        if (t.isArrowFunctionExpression(d.init) || t.isFunctionExpression(d.init)) {
          consider(d.id.name, d.init);
        }
      }
    }
  };
  for (const decl of ast.program.body) {
    visitDecl(decl);
    if (t.isExportNamedDeclaration(decl) || t.isExportDefaultDeclaration(decl)) {
      const inner = decl.declaration;
      if (inner && (t.isStatement(inner) || t.isFunctionDeclaration(inner))) {
        visitDecl(inner as t.Statement);
      }
    }
  }
  return best;
}

function componentDestructuresProp(fn: EnclosingComponent['fn'], propName: string): boolean {
  if (fn.params.length === 0) return false;
  let first: t.Node = fn.params[0];
  if (t.isAssignmentPattern(first)) first = first.left;
  if (!t.isObjectPattern(first)) return false;
  for (const prop of first.properties) {
    if (!t.isObjectProperty(prop)) continue;
    if (t.isIdentifier(prop.key) && prop.key.name === propName) return true;
    if (t.isStringLiteral(prop.key) && prop.key.value === propName) return true;
  }
  return false;
}

// ── Call Site Candidates ───────────────────────────────────────────

function collectCallSiteCandidates(ast: t.Node, componentName: string): TextCandidate[] {
  const out: TextCandidate[] = [];
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n)) return;
    const elName = n.openingElement.name;
    if (t.isJSXIdentifier(elName) && elName.name === componentName) {
      collectTextCandidates(n, out);
    }
  });
  return out;
}

function formatJsxAttrValue(value: string): string {
  if (/^[^"\\<>&{}\n\r]*$/.test(value)) return `"${value}"`;
  return `{${jsString(value)}}`;
}

function spliceRange(node: t.Node, text: string): Splice {
  return { from: node.start ?? 0, to: node.end ?? 0, text };
}

function collectPropCallSiteCandidates(
  ast: t.Node,
  componentName: string,
  propName: string,
): TextCandidate[] {
  const out: TextCandidate[] = [];
  walkJsx(ast, (n) => {
    if (!t.isJSXElement(n)) return;
    const elName = n.openingElement.name;
    if (!t.isJSXIdentifier(elName) || elName.name !== componentName) return;
    const attr = findJsxAttr(n.openingElement, propName);
    if (!attr?.value) return;
    const v = attr.value;
    if (t.isStringLiteral(v)) {
      out.push({
        current: v.value,
        splice: (s) => spliceRange(v, formatJsxAttrValue(s)),
      });
    } else if (t.isJSXExpressionContainer(v)) {
      const expr = v.expression;
      if (t.isStringLiteral(expr) || t.isNumericLiteral(expr)) {
        out.push({
          current: String(expr.value),
          splice: (s) => spliceRange(v, formatJsxAttrValue(s)),
        });
      }
    }
  });
  return out;
}

// ── Array Map Candidates ───────────────────────────────────────────

function findEnclosingMapCallback(
  ast: t.Node,
  target: t.Node,
): { fn: t.ArrowFunctionExpression | t.FunctionExpression; arrayArg: t.Expression } | null {
  type Best = {
    fn: t.ArrowFunctionExpression | t.FunctionExpression;
    arrayArg: t.Expression;
    size: number;
  };
  let best: Best | null = null;
  const targetStart = target.start ?? 0;
  const targetEnd = target.end ?? 0;
  walkAll(ast, (node) => {
    if (!t.isCallExpression(node)) return;
    const callee = node.callee;
    if (!t.isMemberExpression(callee) || callee.computed) return;
    if (!t.isIdentifier(callee.property)) return;
    if (callee.property.name !== 'map' && callee.property.name !== 'flatMap') return;
    const fn = node.arguments[0];
    if (!fn || (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn))) return;
    const fnStart = fn.start ?? 0;
    const fnEnd = fn.end ?? 0;
    if (fnStart > targetStart || fnEnd < targetEnd) return;
    if (!t.isExpression(callee.object)) return;
    const size = fnEnd - fnStart;
    if (!best || size < best.size) best = { fn, arrayArg: callee.object, size };
  });
  if (!best) return null;
  const found: Best = best;
  return { fn: found.fn, arrayArg: found.arrayArg };
}

type ArrayElement = t.Expression | t.SpreadElement;

function resolveArrayLiteralElements(ast: t.Node, expr: t.Expression): ArrayElement[] | null {
  const dropHoles = (arr: t.ArrayExpression): ArrayElement[] =>
    arr.elements.filter((e): e is ArrayElement => e != null);
  if (t.isArrayExpression(expr)) return dropHoles(expr);
  if (!t.isIdentifier(expr)) return null;
  const name = expr.name;
  const useStart = expr.start ?? 0;
  let init: t.ArrayExpression | null = null;
  walkAll(ast, (node) => {
    if (!t.isVariableDeclarator(node)) return;
    if (!t.isIdentifier(node.id) || node.id.name !== name) return;
    if (!node.init || !t.isArrayExpression(node.init)) return;
    if ((node.init.start ?? 0) > useStart) return;
    init = node.init;
  });
  return init ? dropHoles(init) : null;
}

function findObjectProperty(obj: t.Node, name: string): t.ObjectProperty | null {
  if (!t.isObjectExpression(obj)) return null;
  for (const prop of obj.properties) {
    if (!t.isObjectProperty(prop) || prop.computed) continue;
    if (t.isIdentifier(prop.key) && prop.key.name === name) return prop;
    if (t.isStringLiteral(prop.key) && prop.key.value === name) return prop;
  }
  return null;
}

function decodeMapPassthrough(
  element: t.JSXElement,
  callbackParam: t.Node | undefined,
): string | null {
  const meaningful = meaningfulChildren(element);
  if (meaningful.length !== 1) return null;
  const child = meaningful[0];
  if (!t.isJSXExpressionContainer(child)) return null;
  const expr = child.expression;

  if (t.isMemberExpression(expr)) {
    if (expr.computed) return null;
    if (!t.isIdentifier(expr.object) || !t.isIdentifier(expr.property)) return null;
    if (!callbackParam || !t.isIdentifier(callbackParam)) return null;
    if (callbackParam.name !== expr.object.name) return null;
    return expr.property.name;
  }

  if (t.isIdentifier(expr)) {
    const fieldName = expr.name;
    if (!callbackParam || !t.isObjectPattern(callbackParam)) return null;
    for (const prop of callbackParam.properties) {
      if (!t.isObjectProperty(prop) || prop.computed) continue;
      if (!t.isIdentifier(prop.key) || prop.key.name !== fieldName) continue;
      return t.isIdentifier(prop.value) && prop.value.name === fieldName ? fieldName : null;
    }
  }

  return null;
}

function collectArrayMapCandidates(ast: t.Node, element: t.JSXElement): TextCandidate[] {
  const ctx = findEnclosingMapCallback(ast, element);
  if (!ctx) return [];
  const fieldName = decodeMapPassthrough(element, ctx.fn.params[0]);
  if (!fieldName) return [];
  const elements = resolveArrayLiteralElements(ast, ctx.arrayArg);
  if (!elements) return [];
  const out: TextCandidate[] = [];
  for (const obj of elements) {
    const prop = findObjectProperty(obj, fieldName);
    if (!prop) continue;
    const v = prop.value;
    if (t.isStringLiteral(v)) {
      out.push({ current: v.value, splice: (s) => spliceRange(v, jsString(s)) });
    } else if (t.isNumericLiteral(v)) {
      out.push({ current: String(v.value), splice: (s) => spliceRange(v, jsString(s)) });
    }
  }
  return out;
}

// ── set-text Handler ───────────────────────────────────────────────

function buildTextSplice(
  ast: t.File,
  element: t.JSXElement,
  value: string,
  prevText?: string,
): Splice | { error: string } {
  const candidates: TextCandidate[] = [];
  collectTextCandidates(element, candidates);
  if (candidates.length === 0) {
    const passthrough = propPassthroughName(element);
    const enclosing = passthrough ? findEnclosingComponent(ast, element) : null;
    if (passthrough === 'children' && enclosing) {
      candidates.push(...collectCallSiteCandidates(ast, enclosing.name));
    } else if (
      passthrough &&
      enclosing &&
      componentDestructuresProp(enclosing.fn, passthrough)
    ) {
      candidates.push(...collectPropCallSiteCandidates(ast, enclosing.name, passthrough));
    }
  }
  if (candidates.length === 0) {
    candidates.push(...collectArrayMapCandidates(ast, element));
  }
  if (candidates.length === 0) {
    return { error: 'element has no editable text' };
  }
  if (candidates.length === 1) {
    return candidates[0].splice(value);
  }
  if (prevText === undefined) {
    return { error: 'element has multiple text candidates; missing prevText' };
  }
  const norm = prevText.trim();
  const matches = candidates.filter((c) => c.current === norm);
  if (matches.length === 0) {
    return { error: 'no text candidate matches the current value' };
  }
  if (matches.length > 1) {
    return { error: 'multiple text candidates share the same value; cannot disambiguate' };
  }
  return matches[0].splice(value);
}

// ── Import/Asset Helpers ───────────────────────────────────────────

type ImportInfo = { node: t.ImportDeclaration; source: string; defaultIdent: string | null };

function findImports(ast: t.File): ImportInfo[] {
  const out: ImportInfo[] = [];
  for (const node of ast.program.body) {
    if (!t.isImportDeclaration(node)) continue;
    let def: string | null = null;
    for (const spec of node.specifiers) {
      if (t.isImportDefaultSpecifier(spec)) {
        def = spec.local.name;
        break;
      }
    }
    out.push({ node, source: node.source.value, defaultIdent: def });
  }
  return out;
}

function collectTopLevelIdentifiers(ast: t.File): Set<string> {
  const names = new Set<string>();
  for (const imp of findImports(ast)) {
    if (imp.defaultIdent) names.add(imp.defaultIdent);
    for (const spec of imp.node.specifiers) {
      if (!t.isImportDefaultSpecifier(spec)) names.add(spec.local.name);
    }
  }
  return names;
}

function safeAssetIdentifier(filename: string, taken: Set<string>): string {
  const stem = filename.replace(/\.[^.]+$/, '');
  let camel = '';
  let upper = false;
  for (const ch of stem) {
    if (/[A-Za-z0-9]/.test(ch)) {
      camel += upper ? ch.toUpperCase() : ch;
      upper = false;
    } else {
      upper = camel.length > 0;
    }
  }
  let base = camel;
  if (!base || !/^[A-Za-z_$]/.test(base)) {
    base = `asset${base.charAt(0).toUpperCase()}${base.slice(1)}` || 'asset';
  }
  base = base.charAt(0).toLowerCase() + base.slice(1);
  let candidate = base;
  let i = 2;
  while (taken.has(candidate)) {
    candidate = `${base}${i}`;
    i += 1;
  }
  return candidate;
}

type AssetEditPlan = {
  importSplice: Splice | null;
  attrSplice: Splice;
};

function planAssetImport(
  ast: t.File,
  assetPath: string,
): { identifier: string; importSplice: Splice | null } {
  const imports = findImports(ast);
  for (const imp of imports) {
    if (imp.source === assetPath && imp.defaultIdent) {
      return { identifier: imp.defaultIdent, importSplice: null };
    }
  }
  const filename = assetPath.slice(assetPath.lastIndexOf('/') + 1);
  const identifier = safeAssetIdentifier(filename, collectTopLevelIdentifiers(ast));
  const importStmt = `import ${identifier} from '${assetPath.replace(/'/g, "\\'")}';\n`;
  const last = imports[imports.length - 1];
  const insertAt = last ? (last.node.end ?? 0) : 0;
  const prefix = last ? '\n' : '';
  return { identifier, importSplice: { from: insertAt, to: insertAt, text: prefix + importStmt } };
}

function planAssetAttr(
  ast: t.File,
  element: t.JSXElement,
  attr: string,
  assetPath: string,
): AssetEditPlan | { error: string } {
  if (!attr || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(attr)) return { error: 'invalid attribute name' };

  const { identifier, importSplice } = planAssetImport(ast, assetPath);
  const opening = element.openingElement;
  const newAttr = `${attr}={${identifier}}`;
  const existing = findJsxAttr(opening, attr);
  const attrSplice: Splice = existing
    ? { from: existing.start ?? 0, to: existing.end ?? 0, text: newAttr }
    : { from: opening.name.end ?? 0, to: opening.name.end ?? 0, text: ` ${newAttr}` };
  return { importSplice, attrSplice };
}

// ── Placeholder Replacement ────────────────────────────────────────

type PlaceholderEditPlan = {
  importSplice: Splice | null;
  elementSplice: Splice;
};

function readJsxStringAttr(opening: t.JSXOpeningElement, name: string): string | null {
  const attr = findJsxAttr(opening, name);
  const v = attr?.value;
  if (!v) return null;
  if (t.isStringLiteral(v)) return v.value;
  if (t.isJSXExpressionContainer(v) && t.isStringLiteral(v.expression)) return v.expression.value;
  return null;
}

function readJsxNumberAttr(opening: t.JSXOpeningElement, name: string): number | null {
  const attr = findJsxAttr(opening, name);
  const v = attr?.value;
  if (!v || !t.isJSXExpressionContainer(v)) return null;
  if (!t.isNumericLiteral(v.expression)) return null;
  const n = v.expression.value;
  return Number.isFinite(n) ? n : null;
}

function planReplacePlaceholder(
  ast: t.File,
  element: t.JSXElement,
  assetPath: string,
): PlaceholderEditPlan | { error: string } {
  const opening = element.openingElement;
  if (!t.isJSXIdentifier(opening.name) || opening.name.name !== 'ImagePlaceholder') {
    return { error: 'not a placeholder' };
  }

  const hint = readJsxStringAttr(opening, 'hint') ?? '';
  const width = readJsxNumberAttr(opening, 'width');
  const height = readJsxNumberAttr(opening, 'height');

  const { identifier, importSplice } = planAssetImport(ast, assetPath);

  const styleParts: string[] = [];
  if (width != null) styleParts.push(`width: ${width}`);
  else if (height != null) styleParts.push(`width: '100%'`);
  if (height != null) styleParts.push(`height: ${height}`);
  else if (width != null) styleParts.push(`height: '100%'`);
  styleParts.push(`objectFit: 'cover'`);
  styleParts.push(`objectPosition: '50% 50%'`);
  const replacement =
    `<img src={${identifier}} alt=${jsString(hint)} ` + `style={{ ${styleParts.join(', ')} }} />`;

  return { importSplice, elementSplice: spliceRange(element, replacement) };
}

// ── Main Entry Point ───────────────────────────────────────────────

export function applyEdit(
  source: string,
  line: number,
  column: number,
  ops: EditOp[],
): ApplyEditResult {
  if (ops.length === 0) return { ok: true, source };

  const ast = parseSource(source);
  if (!ast) return { ok: false, status: 422, error: 'could not parse source' };
  const element = findInnermostJsxElement(ast, line, column);
  if (!element) return { ok: false, status: 422, error: 'no JSX element at location' };

  const splices: Splice[] = [];

  const styleOps = ops.flatMap((op) =>
    op.kind === 'set-style' ? [{ key: op.key, value: op.value }] : [],
  );
  if (styleOps.length > 0) {
    const result = buildStyleSplice(source, element, styleOps);
    if (result && 'error' in result) {
      return { ok: false, status: 422, error: result.error };
    }
    if (result) splices.push(result as Splice);
  }

  for (const op of ops) {
    if (op.kind !== 'set-text') continue;
    const result = buildTextSplice(ast, element, op.value, op.prevText);
    if ('error' in result) return { ok: false, status: 422, error: result.error };
    splices.push(result as Splice);
  }

  const assetOps = ops.flatMap((op) => (op.kind === 'set-attr-asset' ? [op] : []));
  const placeholderOps = ops.flatMap((op) =>
    op.kind === 'replace-placeholder-with-image' ? [op] : [],
  );
  if (assetOps.length > 0 || placeholderOps.length > 0) {
    const importSplices: Splice[] = [];
    for (const op of assetOps) {
      const plan = planAssetAttr(ast, element, op.attr, op.assetPath);
      if ('error' in plan) return { ok: false, status: 422, error: plan.error };
      splices.push(plan.attrSplice);
      if (plan.importSplice) importSplices.push(plan.importSplice);
    }
    for (const op of placeholderOps) {
      const plan = planReplacePlaceholder(ast, element, op.assetPath);
      if ('error' in plan) return { ok: false, status: 422, error: plan.error };
      splices.push(plan.elementSplice);
      if (plan.importSplice) importSplices.push(plan.importSplice);
    }
    if (importSplices.length > 0) {
      const from = importSplices[0].from;
      const to = importSplices[0].to;
      const text = importSplices.map((s) => s.text).join('');
      splices.push({ from, to, text });
    }
  }

  if (splices.length === 0) return { ok: true, source };

  splices.sort((a, b) => b.from - a.from);
  let next = source;
  for (const sp of splices) {
    next = next.slice(0, sp.from) + sp.text + next.slice(sp.to);
  }
  return { ok: true, source: next };
}
