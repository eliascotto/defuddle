import { describe, test, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { GitHubExtractor } from '../../src/extractors/github';
import { createTestDocument } from '../helpers';

describe('GitHubExtractor', () => {
	describe('canExtract', () => {
		test('should return true for GitHub issue pages', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>user/repo</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title">Issue Title</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(true);
		});

		test('should return false for non-GitHub pages', () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>';
			const doc = createTestDocument(html, 'https://example.com');
			const extractor = new GitHubExtractor(doc, 'https://example.com');
			
			expect(extractor.canExtract()).toBe(false);
		});

		test('should return false when GitHub indicators are missing', () => {
			const html = '<!DOCTYPE html><html><head><title>Test</title></head><body></body></html>';
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(false);
		});
	});

	describe('extract', () => {
		test('should extract issue content', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>user/repo #1 - Issue Title</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title">Issue Title</div>
					<div data-testid="issue-viewer-issue-container">
						<a data-testid="issue-body-header-author" href="/testuser">testuser</a>
						<relative-time datetime="2024-01-15T10:00:00Z"></relative-time>
						<div data-testid="issue-body-viewer">
							<div class="markdown-body">
								<p>This is the issue body content.</p>
							</div>
						</div>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.contentHtml).toContain('This is the issue body content');
			expect(result.contentHtml).toContain('<strong>testuser</strong>');
			expect(result.contentHtml).toContain('opened this issue on 1/15/2024');
			expect(result.variables?.title).toBe('user/repo #1 - Issue Title');
			expect(result.variables?.author).toBe('');
			expect(result.variables?.published).toBeUndefined();
			expect(result.variables?.site).toBe('GitHub - user/repo');
		});

		test('should extract issue number from URL', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>user/repo</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title"></div>
					<div data-testid="issue-viewer-issue-container">
						<div data-testid="issue-body-viewer">
							<div class="markdown-body"><p>Content</p></div>
						</div>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/42');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/42');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.extractedContent?.issueNumber).toBe('42');
		});

		test('should extract repository info from URL', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>owner/repo</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title"></div>
					<div data-testid="issue-viewer-issue-container">
						<div data-testid="issue-body-viewer">
							<div class="markdown-body"><p>Content</p></div>
						</div>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/owner/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/owner/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.extractedContent?.owner).toBe('owner');
			expect(result.extractedContent?.repository).toBe('repo');
		});

		test('should extract comments', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>user/repo</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title"></div>
					<div data-testid="issue-viewer-issue-container">
						<div data-testid="issue-body-viewer">
							<div class="markdown-body"><p>Issue body</p></div>
						</div>
					</div>
					<div data-wrapper-timeline-id="comment-1">
						<div class="react-issue-comment">
							<a class="ActivityHeader-module__AuthorLink--iofTU" href="/commenter">commenter</a>
							<relative-time datetime="2024-01-16T10:00:00Z"></relative-time>
							<div class="markdown-body">
								<p>This is a comment.</p>
							</div>
						</div>
					</div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(true);
			const result = extractor.extract();
			expect(result.contentHtml).toContain('Issue body');
			expect(result.contentHtml).toContain('This is a comment');
			expect(result.contentHtml).toContain('commenter');
		});

		test('should handle missing elements gracefully', () => {
			const html = `
				<!DOCTYPE html>
				<html>
				<head>
					<meta name="expected-hostname" content="github.com">
					<title>user/repo</title>
				</head>
				<body>
					<div data-testid="issue-metadata-sticky"></div>
					<div data-testid="issue-title"></div>
				</body>
				</html>
			`;
			const doc = createTestDocument(html, 'https://github.com/user/repo/issues/1');
			const extractor = new GitHubExtractor(doc, 'https://github.com/user/repo/issues/1');
			
			expect(extractor.canExtract()).toBe(true);
			// Should not throw
			expect(() => extractor.extract()).not.toThrow();
		});
	});
});
