const BFARM_SECTION_NAMES = [
    'EXTINC',
    'VARIABLE',
    'FUNCTION',
    'SETUP',
    'BLOCKSETUP',
    'LOOP_EXT_CODE',
] as const;

type BfarmSectionName = typeof BFARM_SECTION_NAMES[number];
type BfarmSectionMap = Record<BfarmSectionName, string>;

interface ExtractSectionResult {
    body: string;
    src: string;
}

interface FunctionMatch {
    full: string;
    head: string;
    body: string;
    tail: string;
    index: number;
}

const BFARM_MARKER_REGEX = /#[ \t]*(EXTINC|VARIABLE|FUNCTION|SETUP|BLOCKSETUP|LOOP_EXT_CODE)\b/;

export function hasBfarmMacroMarkers(code: string): boolean {
    return BFARM_MARKER_REGEX.test(code);
}

function extractSection(src: string, name: BfarmSectionName): ExtractSectionResult {
    const re = new RegExp(
        String.raw`(^|\n)[ \t]*#${name}[ \t]*([\s\S]*?)#END`,
        'g'
    );

    const bodyList: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = re.exec(src)) !== null) {
        const content = match[2].replace(/\r/g, '').trim();
        if (content) {
            bodyList.push(content);
        }
    }

    return {
        body: bodyList.join('\n'),
        src: src.replace(re, '').replace(/\n{3,}/g, '\n\n'),
    };
}

function ensureFunc(src: string, name: 'setup' | 'loop'): string {
    if (new RegExp(`\\bvoid\\s+${name}\\s*\\(`).test(src)) {
        return src;
    }
    return `${src.trimEnd()}\n\nvoid ${name}() {\n}\n`;
}

function getFunc(src: string, name: 'setup' | 'loop'): FunctionMatch | null {
    const re = new RegExp(
        String.raw`(void\s+${name}\s*\(\s*\)\s*\{)([\s\S]*?)(\n[ \t]*\})`,
        'm'
    );
    const match = src.match(re);

    if (!match || match.index === undefined) {
        return null;
    }

    return {
        full: match[0],
        head: match[1],
        body: match[2],
        tail: match[3],
        index: match.index,
    };
}

function replaceFuncBody(src: string, name: 'setup' | 'loop', newBody: string): string {
    const fn = getFunc(src, name);
    if (!fn) {
        return src;
    }

    const rebuilt = `${fn.head}\n${newBody}\n${fn.tail}`;
    return src.slice(0, fn.index) + rebuilt + src.slice(fn.index + fn.full.length);
}

function stripEmptyLines(source: string): string {
    return source.replace(/\n{3,}/g, '\n\n').trim();
}

function normalizeLineForCompare(line: string): string {
    return line.replace(/\s+/g, ' ').trim();
}

function dedupeByLine(source: string): string {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const seen = new Set<string>();
    const out: string[] = [];

    for (const line of lines) {
        const key = normalizeLineForCompare(line);
        if (!key) {
            out.push('');
            continue;
        }

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        out.push(line.trim());
    }

    return stripEmptyLines(out.join('\n'));
}

function dedupeIncludes(source: string): string {
    const lines = source.replace(/\r\n/g, '\n').split('\n');
    const seen = new Set<string>();
    const out: string[] = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (/^#include\b/.test(trimmed)) {
            const key = normalizeLineForCompare(trimmed);
            if (seen.has(key)) {
                continue;
            }
            seen.add(key);
            out.push(trimmed);
            continue;
        }

        out.push(line);
    }

    return stripEmptyLines(out.join('\n'));
}

function formatByBraces(code: string, indent = '  '): string {
    let level = 0;
    return code
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map((line) => {
            const trimmed = line.trim();
            if (trimmed.startsWith('}')) {
                level--;
            }
            const out = indent.repeat(Math.max(level, 0)) + trimmed;
            if (trimmed.endsWith('{')) {
                level++;
            }
            return out;
        })
        .join('\n');
}

export function convertBfarmMacroToCpp(input: string): string {
    let source = input.replace(/\r\n/g, '\n');
    const blocks = {} as BfarmSectionMap;

    for (const sectionName of BFARM_SECTION_NAMES) {
        const result = extractSection(source, sectionName);
        source = result.src;
        blocks[sectionName] = result.body;
    }

    blocks.EXTINC = dedupeIncludes(blocks.EXTINC);
    blocks.VARIABLE = dedupeByLine(blocks.VARIABLE);
    blocks.SETUP = dedupeByLine(blocks.SETUP);
    blocks.BLOCKSETUP = dedupeByLine(blocks.BLOCKSETUP);

    source = ensureFunc(source, 'setup');
    source = ensureFunc(source, 'loop');

    const setupPart = getFunc(source, 'setup');
    const loopPart = getFunc(source, 'loop');

    const existingSetup = (setupPart?.body ?? '').trim();
    const existingLoop = (loopPart?.body ?? '').trim();

    const newSetupBody = stripEmptyLines(
        [blocks.SETUP, blocks.BLOCKSETUP, existingSetup].filter(Boolean).join('\n\n')
    );
    const newLoopBody = stripEmptyLines(
        [blocks.LOOP_EXT_CODE, existingLoop].filter(Boolean).join('\n\n')
    );

    source = replaceFuncBody(source, 'setup', dedupeByLine(newSetupBody));
    source = replaceFuncBody(source, 'loop', newLoopBody);

    const idxSetup = source.search(/^\s*void\s+setup\s*\(/m);
    if (idxSetup >= 0) {
        const prefix = source.slice(0, idxSetup);
        const rest = source.slice(idxSetup);
        let newPrefix = prefix;

        if (blocks.EXTINC) {
            const includeRe = /^[ \t]*#include[^\n]*$/gm;
            let lastIncludeEnd = -1;
            while (includeRe.exec(prefix) !== null) {
                lastIncludeEnd = includeRe.lastIndex;
            }

            if (lastIncludeEnd >= 0) {
                newPrefix =
                    prefix.slice(0, lastIncludeEnd) +
                    '\n' +
                    blocks.EXTINC.trim() +
                    '\n' +
                    prefix.slice(lastIncludeEnd);
            } else {
                newPrefix = `${blocks.EXTINC.trim()}\n\n${prefix}`;
            }
        }

        const mid = [blocks.VARIABLE, blocks.FUNCTION].filter(Boolean).join('\n\n');
        if (mid) {
            newPrefix = stripEmptyLines(`${newPrefix}\n\n${mid}`) + '\n\n';
        }

        newPrefix = dedupeIncludes(newPrefix);
        // Do not run line-level dedupe on the whole prefix:
        // repeated brace lines ("}") in function bodies are valid and
        // deduping them can corrupt block structure (e.g. nest setup() inside another function).
        source = newPrefix + rest;
    } else {
        const topAll = [blocks.EXTINC, blocks.VARIABLE, blocks.FUNCTION]
            .filter(Boolean)
            .join('\n\n');
        if (topAll) {
            source = stripEmptyLines(`${topAll}\n\n${source}`) + '\n';
        }
    }

    source = dedupeIncludes(source);
    source = stripEmptyLines(source) + '\n';
    source = formatByBraces(source).trim() + '\n';

    return source;
}
