import { JSDOM } from 'jsdom';
import { expect } from 'vitest';

/**
 * Helper functions for creating test documents and fixtures
 */

/**
 * Create a JSDOM document from HTML string
 */
export function createTestDocument(html: string, url?: string): Document {
	const dom = new JSDOM(html, {
		url: url || 'https://example.com',
		pretendToBeVisual: true,
	});
	return dom.window.document;
}

/**
 * Create a minimal HTML document with body content
 */
export function createMinimalDocument(bodyContent: string): Document {
	const html = `<!DOCTYPE html>
<html>
<head>
	<title>Test Document</title>
</head>
<body>
	${bodyContent}
</body>
</html>`;
	return createTestDocument(html);
}

/**
 * Create a document with metadata tags
 */
export function createDocumentWithMetadata(metadata: {
	title?: string;
	description?: string;
	author?: string;
	image?: string;
	published?: string;
	ogTitle?: string;
	ogDescription?: string;
	ogImage?: string;
	schemaOrg?: any;
}, bodyContent: string = ''): Document {
	let headContent = '';
	
	if (metadata.title) {
		headContent += `<title>${metadata.title}</title>`;
	}
	if (metadata.description) {
		headContent += `<meta name="description" content="${metadata.description}">`;
	}
	if (metadata.author) {
		headContent += `<meta name="author" content="${metadata.author}">`;
	}
	if (metadata.image) {
		headContent += `<meta name="image" content="${metadata.image}">`;
	}
	if (metadata.published) {
		headContent += `<meta name="published" content="${metadata.published}">`;
	}
	if (metadata.ogTitle) {
		headContent += `<meta property="og:title" content="${metadata.ogTitle}">`;
	}
	if (metadata.ogDescription) {
		headContent += `<meta property="og:description" content="${metadata.ogDescription}">`;
	}
	if (metadata.ogImage) {
		headContent += `<meta property="og:image" content="${metadata.ogImage}">`;
	}
	if (metadata.schemaOrg) {
		headContent += `<script type="application/ld+json">${JSON.stringify(metadata.schemaOrg)}</script>`;
	}

	const html = `<!DOCTYPE html>
<html>
<head>
	${headContent}
</head>
<body>
	${bodyContent}
</body>
</html>`;
	return createTestDocument(html);
}

/**
 * Create a document with article content
 */
export function createArticleDocument(content: string, title?: string): Document {
	const articleContent = title 
		? `<article><h1>${title}</h1>${content}</article>`
		: `<article>${content}</article>`;
	return createMinimalDocument(articleContent);
}

/**
 * Assert that HTML content contains expected text (ignoring HTML tags)
 */
export function expectTextContent(html: string, expectedText: string): void {
	const dom = new JSDOM(html);
	const text = dom.window.document.body.textContent || '';
	expect(text).toContain(expectedText);
}

/**
 * Assert that HTML content does not contain certain selectors
 */
export function expectNoSelector(html: string, selector: string): void {
	const dom = new JSDOM(html);
	const elements = dom.window.document.querySelectorAll(selector);
	expect(elements.length).toBe(0);
}

/**
 * Assert that HTML content contains certain selectors
 */
export function expectSelector(html: string, selector: string, count?: number): void {
	const dom = new JSDOM(html);
	const elements = dom.window.document.querySelectorAll(selector);
	if (count !== undefined) {
		expect(elements.length).toBe(count);
	} else {
		expect(elements.length).toBeGreaterThan(0);
	}
}
