import assert from 'node:assert/strict';
import test from 'node:test';
import { transformMathPaste } from '../src/transform';

test('converts AI-generated inline math delimiters', () => {
	const input = 'Temperature is \\(T_{\\mathrm{in}}=293.15\\,\\mathrm{K}\\).';
	const result = transformMathPaste(input);

	assert.equal(
		result.text,
		'Temperature is $T_{\\mathrm{in}}=293.15\\,\\mathrm{K}$.',
	);
	assert.equal(result.stats.inlineMath, 1);
});

test('converts multiline display math delimiters', () => {
	const input = '\\[\nT(x,y,z,t=0)=T_{\\mathrm{initial}}\n\\]';
	const result = transformMathPaste(input);

	assert.equal(
		result.text,
		'$$\nT(x,y,z,t=0)=T_{\\mathrm{initial}}\n$$',
	);
	assert.equal(result.stats.displayMath, 1);
});

test('repairs a stripped single-line display expression conservatively', () => {
	const input = '[ T(x,y,z,t=0)=T_{\\mathrm{initial}} ]';
	const result = transformMathPaste(input);

	assert.equal(
		result.text,
		'$$\nT(x,y,z,t=0)=T_{\\mathrm{initial}}\n$$',
	);
	assert.equal(result.stats.repairedBareDisplayMath, 1);
});

test('repairs a stripped display expression inside a blockquote', () => {
	const input = '> [ T_{\\mathrm{inlet}}=T_{\\mathrm{in}} ]';
	const result = transformMathPaste(input);

	assert.equal(
		result.text,
		'> $$\n> T_{\\mathrm{inlet}}=T_{\\mathrm{in}}\n> $$',
	);
});

test('does not change ordinary bracketed prose', () => {
	const input = '[Branch A1 upstream coolant temperature]\n[see note 3]';
	const result = transformMathPaste(input);

	assert.equal(result.text, input);
	assert.equal(result.changed, false);
});

test('preserves inline code and fenced code', () => {
	const input = [
		'Use `\\(x\\)` as a literal example.',
		'',
		'```text',
		'\\[',
		'T_{\\mathrm{initial}}',
		'\\]',
		'```',
		'',
		'Actual: \\(x=1\\)',
	].join('\n');
	const result = transformMathPaste(input);

	assert.equal(
		result.text,
		[
			'Use `\\(x\\)` as a literal example.',
			'',
			'```text',
			'\\[',
			'T_{\\mathrm{initial}}',
			'\\]',
			'```',
			'',
			'Actual: $x=1$',
		].join('\n'),
	);
});

test('preserves CRLF line endings', () => {
	const input = '\\[\r\nx=1\r\n\\]';
	const result = transformMathPaste(input);

	assert.equal(result.text, '$$\r\nx=1\r\n$$');
});

test('can disable stripped bracket repair', () => {
	const input = '[ T_{\\mathrm{initial}}=310 ]';
	const result = transformMathPaste(input, {
		repairBareDisplayBrackets: false,
	});

	assert.equal(result.text, input);
});
