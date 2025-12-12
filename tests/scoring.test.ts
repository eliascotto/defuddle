import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { ContentScorer } from '../src/scoring';
import { createMinimalDocument, createTestDocument } from './helpers';

describe('ContentScorer', () => {
	describe('scoreElement', () => {
		test('should score based on text density', () => {
			const html = '<div>This is a test paragraph with multiple words that should increase the score.</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(0);
		});

		test('should add bonus for paragraphs', () => {
			const html = '<div><p>Paragraph one</p><p>Paragraph two</p><p>Paragraph three</p></div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(30); // At least 3 paragraphs * 10
		});

		test('should penalize high link density', () => {
			const html = '<div>Text <a href="#">link</a> more text <a href="#">link</a> even more <a href="#">link</a> text</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			// High link density should reduce score
			expect(score).toBeLessThan(20);
		});

		test('should penalize high image density', () => {
			const html = '<div>Text <img src="1.jpg"> more text <img src="2.jpg"> even more <img src="3.jpg"> text</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			// High image density should reduce score
			expect(score).toBeLessThan(15);
		});

		test('should add bonus for date indicators', () => {
			const html = '<div>Published on January 15, 2024. This is article content.</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(10); // Should have date bonus
		});

		test('should add bonus for author indicators', () => {
			const html = '<div>Written by John Doe. This is article content.</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(10); // Should have author bonus
		});

		test('should add bonus for content classes', () => {
			const html = '<div class="article-content">This is article content with many words.</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(15); // Should have class bonus
		});

		test('should add bonus for footnotes', () => {
			const html = '<div>Content<sup id="fnref:1"><a href="#fn:1">1</a></sup> with footnotes.</div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(10); // Should have footnote bonus
		});

		test('should penalize nested tables', () => {
			const html = '<div>Content <table><tr><td>Cell</td></tr></table> more content <table><tr><td>Cell</td></tr></table></div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			// Nested tables should reduce score
			expect(score).toBeLessThan(10);
		});

		test('should score table cells appropriately', () => {
			const html = '<table width="800" align="center"><tr><td>This is content in a table cell with many words that should score well.</td></tr></table>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('td');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			expect(score).toBeGreaterThan(10); // Table cells in content layouts should score well
		});

		test('should return low score for empty elements', () => {
			const html = '<div></div>';
			const doc = createMinimalDocument(html);
			const element = doc.querySelector('div');
			expect(element).not.toBeNull();
			const score = ContentScorer.scoreElement(element!);
			// Empty elements should have very low or zero score
			expect(score).toBeLessThanOrEqual(1);
		});
	});

	describe('findBestElement', () => {
		test('should find element with highest score', () => {
			const html = `
				<div class="sidebar">Navigation links</div>
				<div class="article-content">
					<p>This is the main article content with many words and paragraphs.</p>
					<p>More content here.</p>
				</div>
			`;
			const doc = createMinimalDocument(html);
			const elements = Array.from(doc.querySelectorAll('div'));
			const best = ContentScorer.findBestElement(elements);
			expect(best).not.toBeNull();
			expect(best!.className).toBe('article-content');
		});

		test('should return null if no element meets minimum score', () => {
			const html = '<div>Short</div><div>Tiny</div>';
			const doc = createMinimalDocument(html);
			const elements = Array.from(doc.querySelectorAll('div'));
			const best = ContentScorer.findBestElement(elements, 100); // High minimum
			expect(best).toBeNull();
		});

		test('should return element that meets minimum score', () => {
			const html = '<div class="content">This is a longer piece of content with many words that should score well enough to pass the minimum threshold.</div>';
			const doc = createMinimalDocument(html);
			const elements = Array.from(doc.querySelectorAll('div'));
			const best = ContentScorer.findBestElement(elements, 10);
			expect(best).not.toBeNull();
			expect(best!.className).toBe('content');
		});
	});

	describe('scoreAndRemove', () => {
		test('should remove non-content blocks', () => {
			const html = `
				<div class="navigation">
					<a href="#">Home</a>
					<a href="#">About</a>
					<a href="#">Contact</a>
				</div>
				<div class="article-content">
					<p>This is the main article content with many words.</p>
					<p>More paragraphs here.</p>
				</div>
			`;
			const doc = createMinimalDocument(html);
			ContentScorer.scoreAndRemove(doc, false);
			
			// Article content should remain (it has enough content to be preserved)
			const article = doc.querySelector('.article-content');
			expect(article).not.toBeNull();
			expect(article!.textContent).toContain('main article content');
		});

		test('should preserve likely content blocks', () => {
			const html = `
				<div class="article">
					<p>This is article content with many words and paragraphs.</p>
					<p>More content here with substantial text.</p>
					<p>Even more paragraphs to make this clearly content.</p>
				</div>
			`;
			const doc = createMinimalDocument(html);
			ContentScorer.scoreAndRemove(doc, false);
			
			const article = doc.querySelector('.article');
			expect(article).not.toBeNull();
			expect(article!.textContent).toContain('article content');
		});

		test('should handle elements with navigation indicators', () => {
			const html = `
				<div>Menu Navigation Links Footer Copyright</div>
				<div class="content">
					<p>This is actual content with many words.</p>
				</div>
			`;
			const doc = createMinimalDocument(html);
			ContentScorer.scoreAndRemove(doc, false);
			
			// Content should remain
			const content = doc.querySelector('.content');
			expect(content).not.toBeNull();
			expect(content!.textContent).toContain('actual content');
		});

		test('should handle empty documents', () => {
			const html = '<html><body></body></html>';
			const doc = createTestDocument(html);
			// Should not throw
			expect(() => ContentScorer.scoreAndRemove(doc, false)).not.toThrow();
		});
	});
});
