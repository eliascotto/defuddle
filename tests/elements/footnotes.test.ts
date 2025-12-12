import { describe, test, expect } from 'vitest';
import { standardizeFootnotes } from '../../src/elements/footnotes';
import { createMinimalDocument } from '../helpers';

describe('standardizeFootnotes', () => {
	test('should standardize footnote references', () => {
		const html = `
			<article>
				<p>Content<a id="fnref1" href="#fn1">1</a> with footnote.</p>
				<div class="footnotes">
					<ol>
						<li id="fn1"><p>Footnote content.</p></li>
					</ol>
				</div>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).not.toBeNull();
		standardizeFootnotes(article!);
		
		// Should have standardized footnote reference(s)
		const sup = article!.querySelector('sup[id^="fnref:"]');
		expect(sup).not.toBeNull();
		expect(sup!.querySelector('a')).not.toBeNull();
		
		// Should have standardized footnote list
		const footnotes = article!.querySelector('#footnotes');
		expect(footnotes).not.toBeNull();
		expect(footnotes!.querySelectorAll('li.footnote').length).toBe(1);
		expect(footnotes!.textContent).toContain('Footnote content');
	});

	test('should handle multiple footnotes', () => {
		const html = `
			<article>
				<p>Content<a id="fnref1" href="#fn1">1</a> and<a id="fnref2" href="#fn2">2</a>.</p>
				<div class="footnotes">
					<ol>
						<li id="fn1"><p>First footnote.</p></li>
						<li id="fn2"><p>Second footnote.</p></li>
					</ol>
				</div>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).not.toBeNull();
		standardizeFootnotes(article!);
		
		const footnotes = article!.querySelectorAll('#footnotes li.footnote');
		expect(footnotes.length).toBe(2);
		expect(article!.textContent).toContain('First footnote.');
		expect(article!.textContent).toContain('Second footnote.');
	});

	test('should handle footnotes without list', () => {
		const html = `
			<article>
				<p>Content<a id="fnref1" href="#fn1">1</a>.</p>
			</article>
		`;
		const doc = createMinimalDocument(html);
		const article = doc.querySelector('article');
		
		expect(article).not.toBeNull();
		// Should not throw even without footnote list
		expect(() => standardizeFootnotes(article!)).not.toThrow();
		// And should not invent a footnote list when none exists
		expect(article!.querySelector('#footnotes')).toBeNull();
	});
});
