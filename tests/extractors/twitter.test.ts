import { describe, test, expect } from 'vitest';
import { TwitterExtractor } from '../../src/extractors/twitter';
import { createTestDocument } from '../helpers';

describe('TwitterExtractor', () => {
	describe('canExtract', () => {
		test('should return true when tweet is present', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Twitter</title></head>
				<body>
					<article data-testid="tweet">
						<div>Tweet content</div>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://twitter.com/user/status/123');
			const extractor = new TwitterExtractor(doc, 'https://twitter.com/user/status/123');
			
			expect(extractor.canExtract()).toBe(true);
		});

		test('should return true when timeline is present', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Twitter</title></head>
				<body>
					<div aria-label="Timeline: Conversation">
						<article data-testid="tweet">
							<div>Tweet content</div>
						</article>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://twitter.com/user/status/123');
			const extractor = new TwitterExtractor(doc, 'https://twitter.com/user/status/123');
			
			expect(extractor.canExtract()).toBe(true);
		});

		test('should return false when no tweet is present', () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>';
			const doc = createTestDocument(html, 'https://twitter.com/user/status/123');
			const extractor = new TwitterExtractor(doc, 'https://twitter.com/user/status/123');
			
			expect(extractor.canExtract()).toBe(false);
		});
	});

	describe('extract', () => {
		test('should extract single tweet', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Twitter</title></head>
				<body>
					<article data-testid="tweet">
						<div data-testid="tweetText">Tweet content here</div>
					</article>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://twitter.com/user/status/123');
			const extractor = new TwitterExtractor(doc, 'https://twitter.com/user/status/123');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.contentHtml).toContain('Tweet content here');
			expect(result.variables?.site).toBe('X (Twitter)');
		});

		test('should extract thread tweets', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head><title>Twitter</title></head>
				<body>
					<div aria-label="Timeline: Conversation">
						<article data-testid="tweet">
							<div data-testid="tweetText">First tweet</div>
						</article>
						<article data-testid="tweet">
							<div data-testid="tweetText">Second tweet</div>
						</article>
						<article data-testid="tweet">
							<div data-testid="tweetText">Third tweet</div>
						</article>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://twitter.com/user/status/123');
			const extractor = new TwitterExtractor(doc, 'https://twitter.com/user/status/123');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.contentHtml).toContain('First tweet');
			expect(result.contentHtml).toContain('Second tweet');
			expect(result.contentHtml).toContain('Third tweet');
			expect(result.variables?.site).toBe('X (Twitter)');
		});
	});
});
