export { extractSearchTerms }

function extractSearchTerms(query: string): string[] {
	let trimmed = query.trim()
	let terms: string[] = []
	let hashtagMatch = trimmed.match(/^(#[a-zA-Z0-9_]+)\s*/)
	if (hashtagMatch) {
		terms.push(hashtagMatch[1])
	}
	let searchWithoutFilter = trimmed.replace(/^#[a-zA-Z0-9_]+\s*/, "").trim()
	if (searchWithoutFilter) {
		terms.push(searchWithoutFilter)
	}
	return terms
}
