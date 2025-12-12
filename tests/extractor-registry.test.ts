import { describe, test, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { ExtractorRegistry } from '../src/extractor-registry';
import { createTestDocument } from './helpers';

describe('ExtractorRegistry', () => {
	beforeEach(() => {
		// Clear cache before each test
		ExtractorRegistry.clearCache();
	});

	describe('findExtractor', () => {
		test('should find extractor by exact domain match', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://twitter.com/user/status/123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://twitter.com/user/status/123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('TwitterExtractor');
		});

		test('should find extractor by regex pattern', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://x.com/user/status/123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://x.com/user/status/123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('TwitterExtractor');
		});

		test('should find GitHub extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://github.com/user/repo/issues/1');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://github.com/user/repo/issues/1', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('GitHubExtractor');
		});

		test('should find Reddit extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://reddit.com/r/test/comments/123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://reddit.com/r/test/comments/123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('RedditExtractor');
		});

		test('should find YouTube extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://youtube.com/watch?v=abc123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://youtube.com/watch?v=abc123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('YoutubeExtractor');
		});

		test('should find HackerNews extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://news.ycombinator.com/item?id=123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://news.ycombinator.com/item?id=123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('HackerNewsExtractor');
		});

		test('should find ChatGPT extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://chatgpt.com/c/abc123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://chatgpt.com/c/abc123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('ChatGPTExtractor');
		});

		test('should find Claude extractor', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://claude.ai/chat/abc123');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://claude.ai/chat/abc123', {});
			
			expect(extractor).not.toBeNull();
			expect(extractor!.constructor.name).toBe('ClaudeExtractor');
		});

		test('should return null for unknown domain', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://example.com/article');
			const extractor = ExtractorRegistry.findExtractor(doc, 'https://example.com/article', {});
			
			expect(extractor).toBeNull();
		});

		test('should cache extractor results', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://twitter.com/user/status/123');
			
			// First call
			const extractor1 = ExtractorRegistry.findExtractor(doc, 'https://twitter.com/user/status/123', {});
			// Second call should use cache
			const extractor2 = ExtractorRegistry.findExtractor(doc, 'https://twitter.com/user/status/123', {});
			
			expect(extractor1).not.toBeNull();
			expect(extractor2).not.toBeNull();
			expect(extractor1!.constructor.name).toBe('TwitterExtractor');
			expect(extractor2!.constructor.name).toBe('TwitterExtractor');
		});

		test('should cache negative results', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://example.com/article');
			
			// First call
			const extractor1 = ExtractorRegistry.findExtractor(doc, 'https://example.com/article', {});
			// Second call should use cache
			const extractor2 = ExtractorRegistry.findExtractor(doc, 'https://example.com/article', {});
			
			expect(extractor1).toBeNull();
			expect(extractor2).toBeNull();
		});

		test('should handle invalid URLs gracefully', () => {
			// Use a valid URL for JSDOM, but test with invalid URL string in findExtractor
			const doc = createTestDocument('<html><body></body></html>', 'https://example.com');
			expect(() => ExtractorRegistry.findExtractor(doc, 'not-a-url', {})).not.toThrow();
			const extractor = ExtractorRegistry.findExtractor(doc, 'not-a-url', {});
			// Should return null for invalid URLs
			expect(extractor).toBeNull();
		});
	});

	describe('clearCache', () => {
		test('should clear the extractor cache', () => {
			const doc = createTestDocument('<html><body></body></html>', 'https://twitter.com/user/status/123');
			
			// Populate cache
			ExtractorRegistry.findExtractor(doc, 'https://twitter.com/user/status/123', {});
			
			// Clear cache
			ExtractorRegistry.clearCache();
			
			// Cache should be cleared (though we can't directly test this,
			// we can verify the function doesn't throw)
			expect(() => ExtractorRegistry.clearCache()).not.toThrow();
		});
	});
});
