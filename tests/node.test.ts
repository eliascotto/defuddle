import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/node';

describe('Node.js Defuddle function', () => {
	describe('HTML string input', () => {
		test('should parse HTML string', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test Article</title></head>
				<body>
					<article>
						<h1>Article Title</h1>
						<p>This is the article content.</p>
					</article>
				</body>
				</html>
			`;
			const result = await Defuddle(html);

			expect(result.title).toBe('Test Article');
			expect(result.content).toContain('Article Title');
			expect(result.content).toContain('This is the article content.');
			expect(result.wordCount).toBeGreaterThan(0);
			expect(result.parseTime).toBeGreaterThanOrEqual(0);
		});

		test('should parse HTML string with URL', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article><p>Content</p></article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com/article');

			expect(result.domain).toBe('example.com');
		});

		test('should parse HTML string with options', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article><p data-test="value">Content</p></article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com', { debug: true });

			expect(result.domain).toBe('example.com');
			expect(result.content).toContain('Content');
			// Debug mode should preserve data-* attributes
			expect(result.content).toContain('data-test="value"');
		});
	});

	describe('JSDOM instance input', () => {
		test('should parse JSDOM instance', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test Article</title></head>
				<body>
					<article>
						<h1>Article Title</h1>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const dom = new JSDOM(html);
			const result = await Defuddle(dom);

			expect(result.title).toBe('Test Article');
			expect(result.content).toContain('Article Title');
			expect(result.content).toContain('Content');
			expect(result.wordCount).toBeGreaterThan(0);
		});

		test('should use URL from JSDOM if not provided', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article><p>Content</p></article>
				</body>
				</html>
			`;
			const dom = new JSDOM(html, { url: 'https://test-site.com/page' });
			const result = await Defuddle(dom);

			expect(result.domain).toBe('test-site.com');
		});
	});

	describe('markdown conversion', () => {
		test('should convert to markdown when markdown option is true', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<h1>Title</h1>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com', { markdown: true });

			expect(result.content).toContain('# Title');
			expect(result.content).toContain('Content');
		});

		test('should provide separate markdown when separateMarkdown is true', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<h1>Title</h1>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com', { separateMarkdown: true });

			expect(result.content).toContain('Title');
			expect(result.contentMarkdown).toBeTypeOf('string');
			expect(result.contentMarkdown?.length).toBeGreaterThan(0);
			// Heading level may vary depending on standardization; ensure it's a heading
			expect(result.contentMarkdown).toMatch(/(^|\n)#{1,6}\s+Title/);
			expect(result.contentMarkdown).toContain('Content');
		});
	});

	describe('error handling', () => {
		test('should handle malformed HTML gracefully', async () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><p>Unclosed<div>Mixed</body></html>';
			
			const result = await Defuddle(html);
			expect(result.title).toBe('Test');
			expect(result.content).toContain('Unclosed');
			expect(result.content).toContain('Mixed');
		});

		test('should handle empty HTML', async () => {
			const html = '<!DOCTYPE html><html><head><title></title></head><body></body></html>';
			const result = await Defuddle(html);

			expect(result.title).toBe('');
			expect(result.content).toBeTypeOf('string');
			expect(result.wordCount).toBeGreaterThanOrEqual(0);
		});
	});

	describe('options passing', () => {
		test('should pass all options correctly', async () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Content</p>
						<img src="test.jpg" alt="Test">
					</article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com', {
				removeImages: true,
				debug: false,
				removeExactSelectors: true,
				removePartialSelectors: true
			});

			expect(result.domain).toBe('example.com');
			expect(result.title).toBe('Test');
			expect(result.content).not.toContain('<img');
			expect(result.wordCount).toBeGreaterThan(0);
		});
	});
});
