import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { Defuddle } from '../src/defuddle';
import { createTestDocument } from './helpers';

describe('Defuddle', () => {
	describe('basic functionality', () => {
		test('should extract content from simple HTML', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test Article</title></head>
				<body>
					<article>
						<h1>Article Title</h1>
						<p>This is the article content with multiple sentences.</p>
						<p>Another paragraph here.</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.title).toBe('Test Article');
			expect(result.content.length).toBeGreaterThan(0);
			expect(result.content).toContain('Article Title');
			expect(result.content).toContain('This is the article content');
			expect(result.wordCount).toBeGreaterThan(0);
		});

		test('should extract metadata', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Test Article</title>
					<meta name="description" content="Article description">
					<meta name="author" content="John Doe">
				</head>
				<body>
					<article>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.title).toBe('Test Article');
			expect(result.description).toBe('Article description');
			expect(result.author).toBe('John Doe');
		});

		test('should calculate word count', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>This is a test article with multiple words to count.</p>
						<p>More words here for counting purposes.</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.wordCount).toBeGreaterThan(10);
		});
	});

	describe('options', () => {
		test('should enable debug mode', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(
				'<!DOCTYPE html><html><head><title>Test</title></head><body><article><p data-test="value">Content</p></article></body></html>'
			);
			const defuddle = new Defuddle(doc, { debug: true });
			const result = defuddle.parse();

			expect(result.title).toBe('Test');
			expect(result.content).toContain('Content');
			// Debug mode should preserve data-* attributes
			expect(result.content).toContain('data-test="value"');
		});

		test('should remove images when removeImages is true', () => {
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
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc, { removeImages: true });
			const result = defuddle.parse();

			expect(result.content).not.toContain('<img');
		});

		test('should handle removeExactSelectors option', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Content</p>
					</article>
					<script>console.log("test");</script>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc, { removeExactSelectors: true });
			const result = defuddle.parse();

			expect(result.content).not.toContain('<script');
		});

		test('should handle removePartialSelectors option', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Content</p>
					</article>
					<div class="advertisement">Ad content</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc, { removePartialSelectors: true });
			const result = defuddle.parse();

			// Advertisements should be removed
			expect(result.content).not.toContain('advertisement');
		});

		test('should use URL from options', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Content</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc, { url: 'https://example.com/article' });
			const result = defuddle.parse();

			expect(result.domain).toBe('example.com');
		});
	});

	describe('content finding', () => {
		test('should find content in article element', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<nav>Navigation</nav>
					<article>
						<h1>Title</h1>
						<p>Main content here with many words.</p>
						<p>More content paragraphs.</p>
					</article>
					<aside>Sidebar</aside>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.content).toContain('Main content');
			expect(result.content).not.toContain('Navigation');
			expect(result.content).not.toContain('Sidebar');
		});

		test('should find content in main element', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<header>Header</header>
					<main>
						<h1>Title</h1>
						<p>Main content here.</p>
					</main>
					<footer>Footer</footer>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.content).toContain('Main content');
		});

		test('should handle table-based layouts', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<table width="800" align="center">
						<tr>
							<td>Sidebar</td>
							<td>
								<p>Main content in table cell with many words.</p>
								<p>More paragraphs here.</p>
							</td>
						</tr>
					</table>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.content).toContain('Main content');
		});
	});

	describe('retry logic', () => {
		test('should retry with less aggressive removal for small content', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<article>
						<p>Short content.</p>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			// Should still return content even with small wordCount
			expect(result.content.length).toBeGreaterThan(0);
			expect(result.wordCount).toBeGreaterThanOrEqual(0);
		});
	});

	describe('edge cases', () => {
		test('should handle empty document', () => {
			const html = '<!DOCTYPE html><html><head><title></title></head><body></body></html>';
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			expect(result.title).toBe('');
			expect(result.content).toBeTypeOf('string');
			expect(result.wordCount).toBeGreaterThanOrEqual(0);
		});

		test('should handle document with no content', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<nav>Navigation only</nav>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			// Navigation-only pages are treated as clutter and removed.
			expect(result.content).not.toContain('Navigation only');
			expect(result.wordCount).toBe(0);
			expect(result.wordCount).toBeGreaterThanOrEqual(0);
		});

		test('should handle malformed HTML gracefully', () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><p>Unclosed paragraph<div>Mixed</body></html>';
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			
			// Should not throw
			expect(() => defuddle.parse()).not.toThrow();
		});

		test('should handle document with only navigation', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Test</title></head>
				<body>
					<nav>
						<ul>
							<li><a href="/">Home</a></li>
							<li><a href="/about">About</a></li>
						</ul>
					</nav>
				</body>
				</html>
			`;
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			const result = defuddle.parse();

			// Navigation-only pages are removed as clutter.
			expect(result.content).not.toContain('Home');
			expect(result.content).not.toContain('About');
			expect(result.wordCount).toBe(0);
		});

		test('should handle errors gracefully', () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body><article><p>Content</p></article></body></html>';
			const doc = createTestDocument(html);
			const defuddle = new Defuddle(doc);
			
			// Should not throw even if there are processing errors
			expect(() => defuddle.parse()).not.toThrow();
		});
	});

	describe('extractor integration', () => {
		test('should use site-specific extractor when available', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<title>Test</title>
					<meta name="expected-hostname" content="github.com">
				</head>
				<body>
					<div data-testid="issue-title">GitHub Issue</div>
					<div data-testid="issue-metadata-sticky">Metadata</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const defuddle = new Defuddle(doc, { url: 'https://github.com/user/repo/issues/1' });
			const result = defuddle.parse();

			expect(result.extractorType).toBe('github');
			expect(result.domain).toBe('github.com');
			// This minimal fixture triggers the extractor but does not include the full issue container,
			// so the extractor returns empty content.
			expect(result.title).toBe('Test');
			expect(result.site).toBe('github');
			expect(result.content).toBe('');
		});
	});
});
