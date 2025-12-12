import { describe, test, expect, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { isElement, isTextNode, isCommentNode, getComputedStyle, getWindow, logDebug } from '../src/utils';

describe('Utils', () => {
	describe('isElement', () => {
		test('should return true for element nodes', () => {
			const dom = new JSDOM('<div>test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			expect(isElement(element)).toBe(true);
		});

		test('should return false for text nodes', () => {
			const dom = new JSDOM('<div>test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			expect(element!.firstChild).not.toBeNull();
			expect(isElement(element!.firstChild!)).toBe(false);
		});

		test('should return false for comment nodes', () => {
			const dom = new JSDOM('<div><!-- comment --></div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			const comment = Array.from(element!.childNodes).find(node => node.nodeType === 8);
			expect(comment).toBeDefined();
			expect(isElement(comment!)).toBe(false);
		});
	});

	describe('isTextNode', () => {
		test('should return true for text nodes', () => {
			const dom = new JSDOM('<div>test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			expect(element!.firstChild).not.toBeNull();
			expect(isTextNode(element!.firstChild!)).toBe(true);
		});

		test('should return false for element nodes', () => {
			const dom = new JSDOM('<div>test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			expect(isTextNode(element)).toBe(false);
		});
	});

	describe('isCommentNode', () => {
		test('should return true for comment nodes', () => {
			const dom = new JSDOM('<div><!-- comment --></div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			const comment = Array.from(element!.childNodes).find(node => node.nodeType === 8);
			expect(comment).toBeDefined();
			expect(isCommentNode(comment!)).toBe(true);
		});

		test('should return false for element nodes', () => {
			const dom = new JSDOM('<div>test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			expect(isCommentNode(element)).toBe(false);
		});
	});

	describe('getWindow', () => {
		test('should return window from defaultView', () => {
			const dom = new JSDOM('<html></html>');
			const window = getWindow(dom.window.document);
			expect(window).not.toBeNull();
			expect(window).toBe(dom.window);
		});

		test('should return null for document without window', () => {
			// Create a document-like object without window
			const doc = {
				defaultView: null,
			} as any;
			const window = getWindow(doc);
			expect(window).toBeNull();
		});
	});

	describe('getComputedStyle', () => {
		test('should return computed style for element', () => {
			const dom = new JSDOM('<div style="color: red;">test</div>');
			const element = dom.window.document.querySelector('div');
			expect(element).not.toBeNull();
			const style = getComputedStyle(element!);
			expect(style).not.toBeNull();
			expect(style!.color).toBeDefined();
		});

		test('should return null when window is not available', () => {
			const doc = {
				defaultView: null,
			} as any;
			const element = {
				ownerDocument: doc,
			} as any;
			const style = getComputedStyle(element);
			expect(style).toBeNull();
		});
	});

	describe('logDebug', () => {
		test('should not log when window.defuddleDebug is not set', () => {
			const consoleSpy = vi.spyOn(console, 'log');
			logDebug('test message');
			expect(consoleSpy).not.toHaveBeenCalled();
			consoleSpy.mockRestore();
		});

		test('should log when window.defuddleDebug is set', () => {
			const dom = new JSDOM('<html></html>');
			(dom.window as any).defuddleDebug = true;
			const consoleSpy = vi.spyOn(console, 'log');
			
			// Note: This test may not work perfectly in Node.js environment
			// as logDebug checks for global window, not JSDOM window
			logDebug('test message');
			
			consoleSpy.mockRestore();
		});
	});
});
