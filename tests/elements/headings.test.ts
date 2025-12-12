import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { headingRules } from '../../src/elements/headings';
import { createMinimalDocument } from '../helpers';

describe('Heading Rules', () => {
	describe('anchor link removal', () => {
		test('should remove anchor links from headings', () => {
			const html = '<h2><a href="#heading">Heading Text</a></h2>';
			const doc = createMinimalDocument(html);
			const heading = doc.querySelector('h2');
			
			expect(heading).not.toBeNull();
			const rule = headingRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(heading!, doc);
			expect(transformed.textContent).toBe('Heading Text');
			expect(transformed.querySelector('a')).toBeNull();
		});

		test('should remove button elements from headings', () => {
			const html = '<h2>Heading Text<button>Copy</button></h2>';
			const doc = createMinimalDocument(html);
			const heading = doc.querySelector('h2');
			
			expect(heading).not.toBeNull();
			const rule = headingRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(heading!, doc);
			expect(transformed.querySelector('button')).toBeNull();
		});

		test('should preserve non-anchor links', () => {
			const html = '<h2><a href="https://example.com">External Link</a></h2>';
			const doc = createMinimalDocument(html);
			const heading = doc.querySelector('h2');
			
			expect(heading).not.toBeNull();
			const rule = headingRules[0];
			expect(rule.transform).toBeTypeOf('function');
			const transformed = rule.transform!(heading!, doc);
			expect(transformed.textContent).toBe('External Link');
			// Headings are simplified to plain text (links are removed regardless of target).
			expect(transformed.querySelector('a')).toBeNull();
		});
	});
});
