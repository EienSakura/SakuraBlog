import markdownToHtml from './markdown'

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&lt;': '<',
  '&gt;': '>',
  '&amp;': '&',
  '&quot;': '"',
  '&#39;': "'"
}

const stripHtmlTag = (content: string) =>
  content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?[^>]*>/g, ' ')

const decodeEntities = (content: string) =>
  Object.keys(ENTITY_MAP).reduce((acc, key) => acc.replace(new RegExp(key, 'g'), ENTITY_MAP[key]), content)
const normalizeWhitespace = (content: string) => content.replace(/\s+/g, ' ').trim()

const releaseCodeFence = (content: string) => {
  const fencePattern = /(`{3,})([A-Za-z0-9_-]*)?[ \t]*\r?\n?([\s\S]*?)(?:\r?\n)?[ \t]*\1/g
  return content.replace(fencePattern, (_, __, ___, inner) => `\n${inner}\n`)
}

export const buildArticleAbstract = (content: string, limit = 180) => {
  if (!content) {
    return ''
  }
  const markdown = releaseCodeFence(content)
  const html = markdownToHtml(markdown)
  const stripped = normalizeWhitespace(decodeEntities(stripHtmlTag(html)))
  if (stripped) {
    return stripped.slice(0, limit)
  }
  const fallback = normalizeWhitespace(markdown.replace(/```/g, ''))
  return fallback.slice(0, limit)
}
