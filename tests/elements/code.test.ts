import { describe, test, expect } from 'vitest';
import { codeBlockRules } from '../../src/elements/code';
import { createMinimalDocument } from '../helpers';

describe('Code Block Rules', () => {
	describe('language detection', () => {
		test('should detect language from data-lang attribute', () => {
			const html = '<pre><code data-lang="javascript">console.log("test");</code></pre>';
			const doc = createMinimalDocument(html);
			const pre = doc.querySelector('pre');
			
			expect(pre).not.toBeNull();
			const rule = codeBlockRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(pre!, doc);
			const code = transformed.querySelector('code');
			expect(code).not.toBeNull();
			expect(code!.getAttribute('data-lang')).toBe('javascript');
			expect(code!.className).toContain('language-javascript');
		});

		test('should detect language from class name', () => {
			const html = '<pre class="language-python"><code>print("test")</code></pre>';
			const doc = createMinimalDocument(html);
			const pre = doc.querySelector('pre');
			
			expect(pre).not.toBeNull();
			const rule = codeBlockRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(pre!, doc);
			const code = transformed.querySelector('code');
			expect(code).not.toBeNull();
			expect(code!.getAttribute('data-lang')).toBe('python');
			expect(code!.className).toContain('language-python');
		});

		test('should extract code from syntax highlighter', () => {
			const html = '<div class="syntaxhighlighter javascript"><div class="code"><div class="line"><code>console.log("test");</code></div></div></div>';
			const doc = createMinimalDocument(html);
			const div = doc.querySelector('.syntaxhighlighter');
			
			expect(div).not.toBeNull();
			const rule = codeBlockRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(div!, doc);
			expect(transformed.tagName.toLowerCase()).toBe('pre');
			const code = transformed.querySelector('code');
			expect(code).not.toBeNull();
			expect(code!.textContent).toContain('console.log("test");');
			expect(code!.getAttribute('data-lang')).toBe('javascript');
		});

		test('should preserve code content', () => {
			const html = '<pre><code>function test() { return true; }</code></pre>';
			const doc = createMinimalDocument(html);
			const pre = doc.querySelector('pre');
			
			expect(pre).not.toBeNull();
			const rule = codeBlockRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(pre!, doc);
			const code = transformed.querySelector('code');
			expect(code).not.toBeNull();
			expect(code!.textContent).toContain('function test()');
			expect(code!.textContent).toContain('return true');
		});
	});
});
