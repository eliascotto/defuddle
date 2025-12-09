import { describe, test, expect } from 'vitest';
import { standardizeFootnotes } from '../../src/elements/footnotes';
import { createMinimalDocument } from '../helpers';

describe('standardizeFootnotes', () => {
	test('should standardize footnote references', () => {
		const html = `
			<article>
				<p>Content<sup id="fnref:1"><a href="#fn:1">1</a></sup> with footnote.</p>
				<div id="footnotes">
					<ol>
						<li id="fn:1"><p>Footnote content.</p></li>
					</ol>
				</div>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).toBeTruthy();
		if (article) {
			standardizeFootnotes(article);
			
			// Should have standardized footnote reference
			const sup = article.querySelector('sup[id^="fnref:"]');
			expect(sup).toBeTruthy();
			
			// Should have standardized footnote list
			const footnotes = article.querySelector('#footnotes');
			expect(footnotes).toBeTruthy();
		}
	});

	test('should handle multiple footnotes', () => {
		const html = `
			<article>
				<p>Content<sup id="fnref:1"><a href="#fn:1">1</a></sup> and<sup id="fnref:2"><a href="#fn:2">2</a></sup>.</p>
				<div id="footnotes">
					<ol>
						<li id="fn:1"><p>First footnote.</p></li>
						<li id="fn:2"><p>Second footnote.</p></li>
					</ol>
				</div>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).toBeTruthy();
		if (article) {
			standardizeFootnotes(article);
			
			const footnotes = article.querySelectorAll('#footnotes li');
			expect(footnotes.length).toBeGreaterThanOrEqual(2);
		}
	});

	test('should handle footnotes without list', () => {
		const html = `
			<article>
				<p>Content<sup id="fnref:1"><a href="#fn:1">1</a></sup>.</p>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).toBeTruthy();
		if (article) {
			// Should not throw even without footnote list
			expect(() => standardizeFootnotes(article)).not.toThrow();
		}
	});
});
