export interface TransformOptions {
	repairBareDisplayBrackets: boolean;
}

export interface TransformStats {
	inlineMath: number;
	displayMath: number;
	repairedBareDisplayMath: number;
}

export interface TransformResult {
	text: string;
	changed: boolean;
	stats: TransformStats;
}

interface Segment {
	text: string;
	protected: boolean;
}

interface FenceState {
	character: '`' | '~';
	length: number;
}

const DEFAULT_OPTIONS: TransformOptions = {
	repairBareDisplayBrackets: true,
};

export function transformMathPaste(
	input: string,
	options: Partial<TransformOptions> = {},
): TransformResult {
	const resolvedOptions = { ...DEFAULT_OPTIONS, ...options };
	const eol = input.includes('\r\n') ? '\r\n' : '\n';
	const normalized = input.replace(/\r\n?/g, '\n');
	const stats: TransformStats = {
		inlineMath: 0,
		displayMath: 0,
		repairedBareDisplayMath: 0,
	};

	const transformed = splitFencedCode(normalized)
		.map((segment) => {
			if (segment.protected) return segment.text;
			return transformMarkdownSegment(
				segment.text,
				resolvedOptions,
				stats,
			);
		})
		.join('');

	const output = eol === '\r\n' ? transformed.replace(/\n/g, '\r\n') : transformed;
	return {
		text: output,
		changed: output !== input,
		stats,
	};
}

function transformMarkdownSegment(
	text: string,
	options: TransformOptions,
	stats: TransformStats,
): string {
	const protectedInlineCode: string[] = [];
	const tokenPrefix = chooseTokenPrefix(text);
	let working = protectInlineCode(text, tokenPrefix, protectedInlineCode);

	working = working.replace(/\\+\[([\s\S]*?)\\+\]/g, (_match, body: string) => {
		stats.displayMath += 1;
		return `$$${body}$$`;
	});

	working = working.replace(/\\+\(([^\n]*?)\\+\)/g, (_match, body: string) => {
		stats.inlineMath += 1;
		return `$${body}$`;
	});

	if (options.repairBareDisplayBrackets) {
		working = repairBareDisplayMath(working, stats);
	}

	return restoreProtectedText(working, tokenPrefix, protectedInlineCode);
}

function splitFencedCode(text: string): Segment[] {
	const lines = text.split('\n');
	const segments: Segment[] = [];
	let current = '';
	let currentProtected = false;
	let fence: FenceState | null = null;

	const flush = (): void => {
		if (current.length === 0) return;
		segments.push({ text: current, protected: currentProtected });
		current = '';
	};

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const lineWithEnding = index < lines.length - 1 ? `${line}\n` : line;
		const fenceRun = getFenceRun(line);

		if (fence === null && fenceRun !== null) {
			flush();
			currentProtected = true;
			fence = fenceRun;
			current += lineWithEnding;
			continue;
		}

		if (fence !== null) {
			current += lineWithEnding;
			if (isClosingFence(line, fence)) {
				flush();
				currentProtected = false;
				fence = null;
			}
			continue;
		}

		current += lineWithEnding;
	}

	flush();
	return segments;
}

function getFenceRun(line: string): FenceState | null {
	const body = stripBlockquotePrefix(line).body;
	const match = body.match(/^ {0,3}(`{3,}|~{3,})/);
	if (!match?.[1]) return null;
	return {
		character: match[1][0] as '`' | '~',
		length: match[1].length,
	};
}

function isClosingFence(line: string, fence: FenceState): boolean {
	const body = stripBlockquotePrefix(line).body;
	const escapedCharacter = fence.character === '`' ? '`' : '~';
	const pattern = new RegExp(`^ {0,3}${escapedCharacter}{${fence.length},}\\s*$`);
	return pattern.test(body);
}

function protectInlineCode(
	text: string,
	tokenPrefix: string,
	protectedText: string[],
): string {
	let output = '';
	let cursor = 0;

	while (cursor < text.length) {
		const opening = text.indexOf('`', cursor);
		if (opening === -1) {
			output += text.slice(cursor);
			break;
		}

		output += text.slice(cursor, opening);
		const openingLength = countRun(text, opening, '`');
		const closing = findMatchingBacktickRun(text, opening + openingLength, openingLength);
		if (closing === -1) {
			output += text.slice(opening);
			break;
		}

		const end = closing + openingLength;
		const tokenIndex = protectedText.length;
		protectedText.push(text.slice(opening, end));
		output += `${tokenPrefix}${tokenIndex}__`;
		cursor = end;
	}

	return output;
}

function findMatchingBacktickRun(
	text: string,
	start: number,
	requiredLength: number,
): number {
	let cursor = start;
	while (cursor < text.length) {
		const candidate = text.indexOf('`', cursor);
		if (candidate === -1) return -1;
		const length = countRun(text, candidate, '`');
		if (length === requiredLength) return candidate;
		cursor = candidate + length;
	}
	return -1;
}

function countRun(text: string, start: number, character: string): number {
	let cursor = start;
	while (text[cursor] === character) cursor += 1;
	return cursor - start;
}

function chooseTokenPrefix(text: string): string {
	let suffix = 0;
	let token = '__SAFE_MATH_PASTE_CODE_';
	while (text.includes(token)) {
		suffix += 1;
		token = `__SAFE_MATH_PASTE_CODE_${suffix}_`;
	}
	return token;
}

function restoreProtectedText(
	text: string,
	tokenPrefix: string,
	protectedText: string[],
): string {
	let output = text;
	for (let index = 0; index < protectedText.length; index += 1) {
		output = output.replace(`${tokenPrefix}${index}__`, protectedText[index] ?? '');
	}
	return output;
}

function repairBareDisplayMath(text: string, stats: TransformStats): string {
	const lines = text.split('\n');
	const output: string[] = [];

	for (let index = 0; index < lines.length; index += 1) {
		const line = lines[index] ?? '';
		const { prefix, body } = stripBlockquotePrefix(line);
		const singleLine = body.match(/^\s*\[\s*(.+?)\s*\]\s*$/);

		if (singleLine?.[1] && looksLikeMath(singleLine[1])) {
			output.push(`${prefix}$$`, `${prefix}${singleLine[1].trim()}`, `${prefix}$$`);
			stats.repairedBareDisplayMath += 1;
			continue;
		}

		if (body.trim() === '[') {
			const closing = findBareBlockClosingLine(lines, index + 1, prefix);
			if (closing !== -1) {
				const innerLines = lines.slice(index + 1, closing);
				const innerText = innerLines
					.map((innerLine) => stripMatchingPrefix(innerLine, prefix))
					.join('\n');
				if (looksLikeMath(innerText)) {
					output.push(`${prefix}$$`, ...innerLines, `${prefix}$$`);
					stats.repairedBareDisplayMath += 1;
					index = closing;
					continue;
				}
			}
		}

		output.push(line);
	}

	return output.join('\n');
}

function findBareBlockClosingLine(
	lines: string[],
	start: number,
	prefix: string,
): number {
	const maximum = Math.min(lines.length, start + 40);
	for (let index = start; index < maximum; index += 1) {
		const line = lines[index] ?? '';
		const parsed = stripBlockquotePrefix(line);
		if (parsed.prefix !== prefix && parsed.body.trim().length > 0) return -1;
		if (parsed.prefix === prefix && parsed.body.trim() === ']') return index;
	}
	return -1;
}

function stripBlockquotePrefix(line: string): { prefix: string; body: string } {
	const match = line.match(/^(\s*(?:>\s*)*)(.*)$/);
	return {
		prefix: match?.[1] ?? '',
		body: match?.[2] ?? line,
	};
}

function stripMatchingPrefix(line: string, prefix: string): string {
	return prefix.length > 0 && line.startsWith(prefix) ? line.slice(prefix.length) : line;
}

function looksLikeMath(text: string): boolean {
	const hasLatexCommand = /\\[A-Za-z]+(?:\b|\{)/.test(text);
	const hasSubscriptOrSuperscript = /[_^](?:\{[^}]+\}|[A-Za-z0-9])/.test(text);
	const hasMathOperator = /(?:=|≈|≠|≤|≥|<|>|±|∓|×|÷|\+|−|\/)/.test(text);
	const hasFunctionCall = /[A-Za-z]\s*\([^)]*\)/.test(text);

	return (
		hasLatexCommand ||
		(hasSubscriptOrSuperscript && (hasMathOperator || hasFunctionCall))
	);
}
