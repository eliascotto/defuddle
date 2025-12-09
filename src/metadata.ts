import { DefuddleMetadata, MetaTagItem } from './types';

export class MetadataExtractor {
	static extract(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): DefuddleMetadata {
		let domain = '';
		let url = '';

		try {
			// Try to get URL from document location
			url = doc.location?.href || '';
			
			// If no URL from location, try other sources
			if (!url) {
				url = this.getMetaContent(metaTags, "property", "og:url") ||
					this.getMetaContent(metaTags, "property", "twitter:url") ||
					this.getSchemaProperty(schemaOrgData, 'url') ||
					this.getSchemaProperty(schemaOrgData, 'mainEntityOfPage.url') ||
					this.getSchemaProperty(schemaOrgData, 'mainEntity.url') ||
					this.getSchemaProperty(schemaOrgData, 'WebSite.url') ||
					doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
			}

			if (url) {
				try {
					domain = new URL(url).hostname.replace(/^www\./, '');
				} catch (e) {
					console.warn('Failed to parse URL:', e);
				}
			}
		} catch (e) {
			// If URL parsing fails, try to get from base tag
			const baseTag = doc.querySelector('base[href]');
			if (baseTag) {
				try {
					url = baseTag.getAttribute('href') || '';
					domain = new URL(url).hostname.replace(/^www\./, '');
				} catch (e) {
					console.warn('Failed to parse base URL:', e);
				}
			}
		}

		return {
			title: this.getTitle(doc, schemaOrgData, metaTags, domain),
			description: this.getDescription(doc, schemaOrgData, metaTags),
			domain,
			favicon: this.getFavicon(doc, url, metaTags),
			image: this.getImage(doc, schemaOrgData, metaTags),
			published: this.getPublished(doc, schemaOrgData, metaTags),
			author: this.getAuthor(doc, schemaOrgData, metaTags),
			site: this.getSite(doc, schemaOrgData, metaTags, domain),
			schemaOrgData,
			wordCount: 0,
			parseTime: 0
		};
	}

	private static getAuthor(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		let authorsString: string | undefined;

		// Meta tags - typically expect a single string, possibly comma-separated
		authorsString = this.getMetaContent(metaTags, "name", "sailthru.author") ||
			this.getMetaContent(metaTags, "property", "author") ||
			this.getMetaContent(metaTags, "name", "author") ||
			this.getMetaContent(metaTags, "name", "byl") ||
			this.getMetaContent(metaTags, "name", "authorList");
		if (authorsString) return authorsString; 

		// 2. Schema.org data - deduplicate if it's a list
		let schemaAuthors = this.getSchemaProperty(schemaOrgData, 'author.name') ||
			this.getSchemaProperty(schemaOrgData, 'author.[].name');
		
		if (schemaAuthors) {
			const parts = schemaAuthors.split(',')
				.map(part => part.trim().replace(/,$/, '').trim())
				.filter(Boolean);
			if (parts.length > 0) {
				let uniqueSchemaAuthors = [...new Set(parts)];
				if (uniqueSchemaAuthors.length > 10) {
					uniqueSchemaAuthors = uniqueSchemaAuthors.slice(0, 10);
				}
				return uniqueSchemaAuthors.join(', ');
			}
		}

		// 3. DOM elements
		const collectedAuthorsFromDOM: string[] = [];
		const addDomAuthor = (value: string | null | undefined) => {
			if (!value) return;
			value.split(',').forEach(namePart => {
				const cleanedName = namePart.trim().replace(/,$/, '').trim();
				const lowerCleanedName = cleanedName.toLowerCase();
				if (cleanedName && lowerCleanedName !== 'author' && lowerCleanedName !== 'authors') {
					collectedAuthorsFromDOM.push(cleanedName);
				}
			});
		};

		const domAuthorSelectors = [
			'[itemprop="author"]',
			'.author',
			'[href*="author"]',
			'.authors a',
		];

		domAuthorSelectors.forEach(selector => {
			doc.querySelectorAll(selector).forEach(el => {
				addDomAuthor(el.textContent);
			});
		});

		if (collectedAuthorsFromDOM.length > 0) {
			let uniqueAuthors = [...new Set(collectedAuthorsFromDOM.map(name => name.trim()).filter(Boolean))];
			if (uniqueAuthors.length > 0) {
				if (uniqueAuthors.length > 10) {
					uniqueAuthors = uniqueAuthors.slice(0, 10);
				}
				return uniqueAuthors.join(', ');
			}
		}
		
		// 4. Fallback meta tags and schema properties (less direct for author names)
		authorsString = this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "twitter:creator") || 
			this.getMetaContent(metaTags, "name", "application-name");
		if (authorsString) return authorsString;

		return '';
	}

	private static getSite(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[], domain: string = ''): string {
		// Try standard meta tags and schema properties first
		const siteFromMeta = (
			this.getSchemaProperty(schemaOrgData, 'publisher.name') ||
			this.getMetaContent(metaTags, "property", "og:site_name") ||
			this.getSchemaProperty(schemaOrgData, 'WebSite.name') ||
			this.getSchemaProperty(schemaOrgData, 'sourceOrganization.name') ||
			this.getMetaContent(metaTags, "name", "copyright") ||
			this.getSchemaProperty(schemaOrgData, 'copyrightHolder.name') ||
			this.getSchemaProperty(schemaOrgData, 'isPartOf.name') ||
			this.getMetaContent(metaTags, "name", "application-name") ||
			this.getAuthor(doc, schemaOrgData, metaTags) ||
			''
		);

		if (siteFromMeta) {
			return siteFromMeta;
		}

		// Domain-based fallback: extract site name from domain
		if (domain) {
			// Extract site name from domain (e.g., "overreacted" from "overreacted.io")
			const domainParts = domain.split('.');
			if (domainParts.length >= 2) {
				// Get the main domain name (second-to-last part, or last if only one part)
				const mainDomain = domainParts[domainParts.length - 2] || domainParts[domainParts.length - 1];
				if (mainDomain && mainDomain !== 'www') {
					return mainDomain;
				}
			}
		}

		// Try to extract from banner/header links
		const headerLinks = doc.querySelectorAll('header a, nav a, [role="banner"] a, .site-title a, .logo a');
		for (const link of Array.from(headerLinks)) {
			const linkText = link.textContent?.trim();
			if (linkText && linkText.length > 0 && linkText.length < 50) {
				// Use the first reasonable link text as site name
				return linkText;
			}
		}

		return '';
	}

	private static getTitle(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[], domain: string = ''): string {
		const rawTitle = (
			this.getMetaContent(metaTags, "property", "og:title") ||
			this.getMetaContent(metaTags, "name", "twitter:title") ||
			this.getSchemaProperty(schemaOrgData, 'headline') ||
			this.getMetaContent(metaTags, "name", "title") ||
			this.getMetaContent(metaTags, "name", "sailthru.title") ||
			doc.querySelector('title')?.textContent?.trim() ||
			''
		);

		return this.cleanTitle(rawTitle, this.getSite(doc, schemaOrgData, metaTags, domain), domain);
	}

	private static cleanTitle(title: string, siteName: string, domain: string = ''): string {
		if (!title) return title;

		// Normalize function for fuzzy matching
		const normalize = (text: string): string => {
			return text
				.toLowerCase()
				.replace(/[^\w\s]/g, '') // Remove punctuation
				.replace(/\s+/g, ' ') // Normalize whitespace
				.trim();
		};

		// Try to extract site name from title if it follows common patterns
		// Pattern: "Title — SiteName" or "Title | SiteName" or "Title - SiteName"
		const titlePatterns = [
			/^(.+?)\s*[–—]\s*(.+)$/, // Title — SiteName
			/^(.+?)\s*\|\s*(.+)$/, // Title | SiteName
			/^(.+?)\s*-\s*(.+)$/, // Title - SiteName
		];

		let extractedSiteName = siteName;
		for (const pattern of titlePatterns) {
			const match = title.match(pattern);
			if (match) {
				const [, titlePart, sitePart] = match;
				// If we don't have a site name yet, or if the extracted one matches better
				if (!siteName || normalize(sitePart) === normalize(siteName)) {
					extractedSiteName = sitePart.trim();
					title = titlePart.trim();
					break;
				}
			}
		}

		// If we still have a site name, try to remove it with various patterns
		if (extractedSiteName) {
			const siteNameEscaped = extractedSiteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const patterns = [
				`\\s*[\\|\\-–—]\\s*${siteNameEscaped}\\s*$`, // Title | Site Name
				`^\\s*${siteNameEscaped}\\s*[\\|\\-–—]\\s*`, // Site Name | Title
			];
			
			for (const pattern of patterns) {
				const regex = new RegExp(pattern, 'i');
				if (regex.test(title)) {
					title = title.replace(regex, '');
					break;
				}
			}

			// Fuzzy matching: if normalized site name is contained in normalized title
			const normalizedTitle = normalize(title);
			const normalizedSiteName = normalize(extractedSiteName);
			
			if (normalizedSiteName && normalizedTitle.includes(normalizedSiteName)) {
				// Try to remove site name with separators
				const fuzzyPatterns = [
					new RegExp(`\\s*[\\|\\-–—]\\s*${normalizedSiteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'),
					new RegExp(`^\\s*${normalizedSiteName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[\\|\\-–—]\\s*`, 'i'),
				];
				
				for (const pattern of fuzzyPatterns) {
					if (pattern.test(title)) {
						title = title.replace(pattern, '');
						break;
					}
				}
			}
		}

		// Fallback: try domain-based removal if domain is available
		if (domain && !extractedSiteName) {
			const domainParts = domain.split('.');
			if (domainParts.length >= 2) {
				const mainDomain = domainParts[domainParts.length - 2] || domainParts[domainParts.length - 1];
				if (mainDomain && mainDomain !== 'www') {
					const domainEscaped = mainDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
					const domainPatterns = [
						new RegExp(`\\s*[\\|\\-–—]\\s*${domainEscaped}\\s*$`, 'i'),
						new RegExp(`^\\s*${domainEscaped}\\s*[\\|\\-–—]\\s*`, 'i'),
					];
					
					for (const pattern of domainPatterns) {
						if (pattern.test(title)) {
							title = title.replace(pattern, '');
							break;
						}
					}
				}
			}
		}

		return title.trim();
	}

	private static getDescription(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getMetaContent(metaTags, "name", "description") ||
			this.getMetaContent(metaTags, "property", "description") ||
			this.getMetaContent(metaTags, "property", "og:description") ||
			this.getSchemaProperty(schemaOrgData, 'description') ||
			this.getMetaContent(metaTags, "name", "twitter:description") ||
			this.getMetaContent(metaTags, "name", "sailthru.description") ||
			''
		);
	}

	private static getImage(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getMetaContent(metaTags, "property", "og:image") ||
			this.getMetaContent(metaTags, "name", "twitter:image") ||
			this.getSchemaProperty(schemaOrgData, 'image.url') ||
			this.getMetaContent(metaTags, "name", "sailthru.image.full") ||
			''
		);
	}

	private static getFavicon(doc: Document, baseUrl: string, metaTags: MetaTagItem[]): string {
		const iconFromMeta = this.getMetaContent(metaTags, "property", "og:image:favicon");
		if (iconFromMeta) return iconFromMeta;

		const iconLink = doc.querySelector("link[rel='icon']")?.getAttribute("href");
		if (iconLink) return iconLink;

		const shortcutLink = doc.querySelector("link[rel='shortcut icon']")?.getAttribute("href");
		if (shortcutLink) return shortcutLink;

		// Only try to construct favicon URL if we have a valid base URL
		if (baseUrl) {
			try {
				return new URL("/favicon.ico", baseUrl).href;
			} catch (e) {
				console.warn('Failed to construct favicon URL:', e);
			}
		}

		return '';
	}

	private static getPublished(doc: Document, schemaOrgData: any, metaTags: MetaTagItem[]): string {
		return (
			this.getSchemaProperty(schemaOrgData, 'datePublished') ||
			this.getMetaContent(metaTags, "name", "publishDate") ||
			this.getMetaContent(metaTags, "property", "article:published_time") ||
			(doc.querySelector('abbr[itemprop="datePublished"]') as HTMLElement)?.title?.trim() || 
			this.getTimeElement(doc) ||
			this.getMetaContent(metaTags, "name", "sailthru.date") ||
			''
		);
	}

	private static getMetaContent(metaTags: MetaTagItem[], attr: string, value: string): string {
		const foundTag = metaTags.find(tag => {
			const attributeValue = attr === 'name' ? tag.name : tag.property;
			return attributeValue?.toLowerCase() === value.toLowerCase();
		});
		return foundTag ? foundTag.content?.trim() ?? "" : "";
	}

	private static getTimeElement(doc: Document): string {
		const selector = `time`;
		const element = Array.from(doc.querySelectorAll(selector))[0];
		const content = element ? (element.getAttribute("datetime")?.trim() ?? element.textContent?.trim() ?? "") : "";
		return content;
	}

	private static getSchemaProperty(schemaOrgData: any, property: string, defaultValue: string = ''): string {
		if (!schemaOrgData) return defaultValue;

		const searchSchema = (data: any, props: string[], fullPath: string, isExactMatch: boolean = true): string[] => {
			if (typeof data === 'string') {
				return props.length === 0 ? [data] : [];
			}
			
			if (!data || typeof data !== 'object') {
				return [];
			}

			if (Array.isArray(data)) {
				const currentProp = props[0];
				if (/^\\[\\d+\\]$/.test(currentProp)) {
					const index = parseInt(currentProp.slice(1, -1));
					if (data[index]) {
						return searchSchema(data[index], props.slice(1), fullPath, isExactMatch);
					}
					return [];
				}
				
				if (props.length === 0 && data.every(item => typeof item === 'string' || typeof item === 'number')) {
					return data.map(String);
				}
				
				return data.flatMap(item => searchSchema(item, props, fullPath, isExactMatch));
			}

			const [currentProp, ...remainingProps] = props;
			
			if (!currentProp) {
				if (typeof data === 'string') return [data];
				if (typeof data === 'object' && data.name) {
					return [data.name];
				}
				return [];
			}

			if (data.hasOwnProperty(currentProp)) {
				return searchSchema(data[currentProp], remainingProps, 
					fullPath ? `${fullPath}.${currentProp}` : currentProp, true);
			}

			if (!isExactMatch) {
				const nestedResults: string[] = [];
				for (const key in data) {
					if (typeof data[key] === 'object') {
						const results = searchSchema(data[key], props, 
							fullPath ? `${fullPath}.${key}` : key, false);
						nestedResults.push(...results);
					}
				}
				if (nestedResults.length > 0) {
					return nestedResults;
				}
			}

			return [];
		};

		try {
			let results = searchSchema(schemaOrgData, property.split('.'), '', true);
			if (results.length === 0) {
				results = searchSchema(schemaOrgData, property.split('.'), '', false);
			}
			const result = results.length > 0 ? results.filter(Boolean).join(', ') : defaultValue;
			return result;
		} catch (error) {
			console.error(`Error in getSchemaProperty for ${property}:`, error);
			return defaultValue;
		}
	}
}
