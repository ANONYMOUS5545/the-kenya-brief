export const NEWS_AUTOMATION_UPDATE_INTERVAL_MINUTES = 10;
export const NEWS_AUTOMATION_DEFAULT_CACHE_MINUTES = 10;
export const NEWS_AUTOMATION_CRON_SCHEDULE = "*/10 * * * *";
export const PUBLIC_NEWS_AUTHOR_NAME = "Kenya Brief";
export const NEWS_AUTOMATION_AUTHOR_EMAIL = "automation@kenyabrief.co.ke";

const CATEGORY_KEYWORDS: Array<[string, string[]]> = [
  ["Politics", ["president", "parliament", "senate", "mp", "governor", "election", "government", "cabinet", "court", "ruto", "odinga", "assembly", "finance bill", "bill", "mps", "minister"]],
  ["Business", ["business", "market", "economy", "shilling", "bank", "trade", "tax", "revenue", "investment", "stock", "profit", "company", "fuel", "loan", "safaricom", "mobile market", "shares", "sme", "msme"]],
  ["Health", ["health", "hospital", "doctor", "medicine", "medical", "sha", "uhc", "disease", "patient", "clinic", "nurse", "vaccine", "ebola", "malaria", "hiv", "programmes"]],
  ["Sports", ["sport", "football", "rugby", "athletics", "marathon", "league", "match", "team", "coach", "formula 1", "formula one", "f1", "grand prix", "world cup", "fifa", "scotland", "spurs", "cricket"]],
  ["Technology", ["technology", "tech", "startup", "ai", "digital", "software", "data", "cyber", "mobile app", "internet", "innovation"]],
  ["Education", ["education", "school", "academy", "university", "teacher", "student", "exam", "kuccps", "tvet", "cbc", "kcse", "kcpe"]],
  ["Environment", ["environment", "climate", "rain", "flood", "forest", "wildlife", "drought", "conservation", "pollution", "carbon", "water shortage"]],
  ["Entertainment", ["entertainment", "music", "film", "artist", "festival", "celebrity", "show", "culture", "actor", "media"]],
  ["Lifestyle", ["lifestyle", "parenting", "travel", "food", "fashion", "beauty", "family", "home", "wellness", "relationships", "habits"]],
  ["Counties", ["county", "counties", "nairobi", "mombasa", "kisumu", "nakuru", "eldoret", "kiambu", "machakos", "kisii", "nyeri", "turkana"]],
  ["World", ["world", "global", "israel", "gaza", "ukraine", "russia", "china", "united states", "south africa", "britain", "europe", "africa", "guinea-bissau", "iran", "dr congo", "india", "afghanistan"]],
  ["Breaking News", ["breaking", "urgent", "developing", "live"]],
];

const SEARCH_TITLE_PREFIXES = [
  "Kenya",
  "Nairobi",
  "Ruto",
  "SHA",
  "HELB",
  "KUCCPS",
  "KRA",
  "KPLC",
  "Safaricom",
  "Harambee Stars",
  "Eliud Kipchoge",
  "William Ruto",
  "Raila Odinga",
  "Father's Day",
];

const JUNK_TEXT_PATTERN = /[#@$%^*_={}\[\]\\|<>]{2,}|[#@$%^*_={}\[\]\\|<>]\s*[#@$%^*_={}\[\]\\|<>]|(?:&[#a-z0-9]+;){2,}|[\uFFFD]{1,}/i;
const UNPROFESSIONAL_TEXT_PATTERN = /\b(top stories today|receive breaking stories|directly on your device|available publisher details|concise brief|fuller verified reporting|read the original|read more|also read|related stories|subscribe|sign in|newsletter|advertisement|cookie policy|all rights reserved|click here)\b/i;
const MIN_FULL_CONTEXT_PARAGRAPHS = 4;
const MIN_FULL_CONTEXT_CHARS = 450;

export interface FetchedNewsItem {
  title: string;
  summary?: string | null;
  bodyText?: string | null;
  publishedAt?: Date | string | null;
  imageUrl?: string | null;
  sourceName?: string | null;
}

function decodeHtmlEntities(text: string) {
  return text
    .replace(/&\s*#\s*x([0-9a-f]+);?/gi, (_, hex) => {
      const code = Number.parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&\s*#?\s*(\d{2,7});?/g, (_, decimal) => {
      const code = Number.parseInt(decimal, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : "";
    })
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

export function cleanNewsText(text: string) {
  return decodeHtmlEntities(text || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/[#@$%^*_={}\[\]\\|<>]+/g, " ")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hasCorruptNewsText(text?: string | null) {
  return JUNK_TEXT_PATTERN.test(text || "") || /&\s*#?\s*\d{2,7};?/i.test(text || "");
}

export function isNtvPodcastOrSportsPromo(title: string, summary?: string | null): boolean {
  const text = `${title} ${summary || ""}`.toLowerCase();
  const podcastPatterns = [
    /\bpodcast\b/i,
    /\bepisode\s+\d+\b/i,
    /\blisten\s+now\b/i,
    /\baudio\b/i,
    /\bdownload\b.*\bpodcast\b/i,
  ];

  const sportPromoPatterns = [
    /\b(formula\s*1|f1|rugby|cricket|football)\b.*\b(episode|podcast|exclusive|behind[- ]the[- ]scenes)\b/i,
    /\bntv\b.*\b(sports\s+show|sports\s+hub|exclusive.*sports|sports.*exclusive)\b/i,
  ];

  return (
    podcastPatterns.some((pattern) => pattern.test(text)) ||
    sportPromoPatterns.some((pattern) => pattern.test(text))
  );
}

function cleanTitleText(text: string) {
  return cleanNewsText(text)
    .replace(/\s[-\u2013\u2014]\s.+$/, "")
    .replace(/\bread more\b.+$/i, "")
    .replace(/\baccording to\b.+$/i, "")
    .trim();
}

export function hasUsableNewsText(text?: string | null, minLength = 35) {
  const cleaned = cleanNewsText(text || "");
  return cleaned.length >= minLength && !JUNK_TEXT_PATTERN.test(text || "") && !UNPROFESSIONAL_TEXT_PATTERN.test(cleaned);
}

function sentenceCase(text: string) {
  const cleaned = cleanTitleText(text);
  if (!cleaned) return "Kenya news update";
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function rewriteCommonNewsTerms(text: string) {
  return text
    .replace(/\bsays\b/gi, "announces")
    .replace(/\bsaid\b/gi, "announced")
    .replace(/\bset to\b/gi, "expected to")
    .replace(/\bslams\b/gi, "criticises")
    .replace(/\bbacks\b/gi, "supports")
    .replace(/\beyes\b/gi, "targets")
    .replace(/\bseeks\b/gi, "pushes for")
    .replace(/\bto probe\b/gi, "to investigate")
    .replace(/\brow\b/gi, "dispute")
    .replace(/\bshake-up\b/gi, "changes")
    .replace(/\bboost\b/gi, "lift");
}

function trimToSentence(text: string, maxLength: number) {
  const cleaned = cleanNewsText(text);
  if (cleaned.length <= maxLength) return cleaned;

  const shortened = cleaned.slice(0, maxLength - 3).trim();
  const lastBreak = Math.max(shortened.lastIndexOf("."), shortened.lastIndexOf(";"), shortened.lastIndexOf(","));
  return `${shortened.slice(0, lastBreak > 80 ? lastBreak : shortened.length).trim()}...`;
}

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeParagraphKey(text: string) {
  return cleanNewsText(text).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function paragraphsFromText(text?: string | null) {
  return (text || "")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
    .split(/\n{2,}|(?<=\.)\s+(?=[A-Z"'])/)
    .map((paragraph) => cleanNewsText(paragraph))
    .filter((paragraph) => paragraph.length > 70)
    .filter((paragraph) => !JUNK_TEXT_PATTERN.test(paragraph) && !UNPROFESSIONAL_TEXT_PATTERN.test(paragraph));
}

export function sanitizeArticleParagraphs(text?: string | null) {
  const seen = new Set<string>();

  return paragraphsFromText(text)
    .map((paragraph) => rewriteParagraph(paragraph))
    .filter((paragraph) => {
      const key = normalizeParagraphKey(paragraph);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function hasFullArticleContext(item: Pick<FetchedNewsItem, "bodyText" | "summary" | "imageUrl">) {
  if (!item.imageUrl) return false;
  const paragraphs = sanitizeArticleParagraphs(item.bodyText);
  const charCount = paragraphs.join(" ").length;
  return paragraphs.length >= MIN_FULL_CONTEXT_PARAGRAPHS && charCount >= MIN_FULL_CONTEXT_CHARS;
}

export function sanitizeExistingArticleHtml(html: string) {
  const paragraphs = sanitizeArticleParagraphs(html);
  if (paragraphs.length < MIN_FULL_CONTEXT_PARAGRAPHS) return null;
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

export function classifyNewsCategory(item: Pick<FetchedNewsItem, "title" | "summary" | "sourceName">) {
  const source = item.sourceName?.toLowerCase() || "";
  if (source.includes("formula 1") || source.includes("football") || source.includes("fifa")) {
    return "Sports";
  }

  const haystack = ` ${item.title} ${item.summary || ""} `.toLowerCase();
  const scores = CATEGORY_KEYWORDS.map(([category, keywords]) => {
    const score = keywords.reduce((total, keyword) => {
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const pattern = keyword.includes(" ")
        ? new RegExp(escaped, "i")
        : new RegExp(`\\b${escaped}\\b`, "i");
      return total + (pattern.test(haystack) ? 1 : 0);
    }, 0);
    return { category, score };
  }).filter((item) => item.score > 0);

  const match = scores.sort((a, b) => b.score - a.score)[0];
  return match?.category || "Breaking News";
}

function findMatchingSearchPhrase(item: Pick<FetchedNewsItem, "title" | "summary">, searchTrends: string[] = []) {
  const haystack = cleanNewsText(`${item.title} ${item.summary || ""}`).toLowerCase();
  const candidates = [...searchTrends, ...SEARCH_TITLE_PREFIXES]
    .map((term) => cleanNewsText(term))
    .filter((term) => term.length >= 3);

  return candidates.find((term) => haystack.includes(term.toLowerCase()));
}

export function createKenyaBriefTitle(itemOrTitle: string | Pick<FetchedNewsItem, "title" | "summary">, searchTrends: string[] = []) {
  const item = typeof itemOrTitle === "string" ? { title: itemOrTitle } : itemOrTitle;
  const base = rewriteCommonNewsTerms(sentenceCase(item.title));
  const trendPhrase = findMatchingSearchPhrase(item, searchTrends);
  const withSearchPhrase = trendPhrase && !base.toLowerCase().startsWith(trendPhrase.toLowerCase())
    ? `${trendPhrase}: ${base}`
    : base;

  return trimToSentence(withSearchPhrase, 95);
}

export function createKenyaBriefSummary(item: Pick<FetchedNewsItem, "title" | "summary" | "bodyText">) {
  const basis = hasUsableNewsText(item.summary, 60)
    ? item.summary
    : hasUsableNewsText(item.bodyText, 100)
      ? item.bodyText
      : item.title;
  const cleaned = rewriteCommonNewsTerms(sentenceCase(basis || ""));
  return trimToSentence(cleaned, 260);
}

function rewriteParagraph(text: string) {
  return trimToSentence(rewriteCommonNewsTerms(sentenceCase(text)), 620);
}

export function createKenyaBriefArticleContent(item: Pick<FetchedNewsItem, "title" | "summary" | "bodyText" | "sourceName">) {
  const summary = createKenyaBriefSummary(item);
  const bodyParagraphs = sanitizeArticleParagraphs(item.bodyText).slice(0, 10);
  const bodyTextLength = bodyParagraphs.join(" ").length;

  if (bodyParagraphs.length < MIN_FULL_CONTEXT_PARAGRAPHS || bodyTextLength < MIN_FULL_CONTEXT_CHARS) {
    return null;
  }

  const paragraphs = summary ? [summary, ...bodyParagraphs] : bodyParagraphs;
  const seen = new Set<string>();
  const unique = paragraphs.filter((paragraph) => {
    const key = normalizeParagraphKey(paragraph);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}
