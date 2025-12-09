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

			expect(result).toBeTruthy();
			expect(result.content).toBeTruthy();
			expect(result.title).toBeTruthy();
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
					<article><p>Content</p></article>
				</body>
				</html>
			`;
			const result = await Defuddle(html, 'https://example.com', { debug: true });

			expect(result).toBeTruthy();
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

			expect(result).toBeTruthy();
			expect(result.content).toBeTruthy();
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

			expect(result.content).toBeTruthy();
			expect(result.contentMarkdown).toBeTruthy();
			expect(result.contentMarkdown).toContain('# Title');
			expect(result.contentMarkdown).toContain('Content');
		});
	});

	describe('error handling', () => {
		test('should handle malformed HTML gracefully', async () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><p>Unclosed<div>Mixed</body></html>';
			
			// Should not throw
			await expect(Defuddle(html)).resolves.toBeTruthy();
		});

		test('should handle empty HTML', async () => {
			const html = '<!DOCTYPE html><html><head><title></title></head><body></body></html>';
			const result = await Defuddle(html);

			expect(result).toBeTruthy();
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

			expect(result).toBeTruthy();
			expect(result.content).not.toContain('<img');
		});
	});
});
