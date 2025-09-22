/**
 * Sanitization Utilities
 * Provides methods to sanitize user inputs and prevent XSS attacks
 */

/**
 * HTML entities map for escaping
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;'
};

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  
  return str.replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char]);
}

/**
 * Sanitizes user input for display in tweets
 * @param {string} content - Content to sanitize
 * @returns {string} - Sanitized content
 */
export function sanitizeTweetContent(content) {
  if (!content) return '';
  
  // First escape HTML
  let sanitized = escapeHtml(content);
  
  // Convert URLs to clickable links (safely)
  sanitized = convertUrlsToLinks(sanitized);
  
  // Convert hashtags to clickable links
  sanitized = convertHashtagsToLinks(sanitized);
  
  // Convert mentions to clickable links
  sanitized = convertMentionsToLinks(sanitized);
  
  // Preserve line breaks
  sanitized = sanitized.replace(/\n/g, '<br>');
  
  return sanitized;
}

/**
 * Safely converts URLs in text to clickable links
 * @param {string} text - Text containing URLs
 * @returns {string} - Text with clickable links
 */
function convertUrlsToLinks(text) {
  // URL regex pattern (simplified for safety)
  const urlPattern = /(https?:\/\/[^\s<>"]+)/g;
  
  return text.replace(urlPattern, (url) => {
    // Validate URL before creating link
    if (isValidUrl(url)) {
      const escapedUrl = escapeHtml(url);
      return `<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="tweet-link">${escapedUrl}</a>`;
    }
    return url;
  });
}

/**
 * Converts hashtags to clickable links
 * @param {string} text - Text containing hashtags
 * @returns {string} - Text with clickable hashtags
 */
function convertHashtagsToLinks(text) {
  const hashtagPattern = /#([a-zA-Z0-9_]+)/g;
  
  return text.replace(hashtagPattern, (match, tag) => {
    const escapedTag = escapeHtml(tag);
    return `<a href="#/hashtag/${escapedTag}" class="tweet-hashtag">#${escapedTag}</a>`;
  });
}

/**
 * Converts mentions to clickable links
 * @param {string} text - Text containing mentions
 * @returns {string} - Text with clickable mentions
 */
function convertMentionsToLinks(text) {
  const mentionPattern = /@([a-zA-Z0-9_]+)/g;
  
  return text.replace(mentionPattern, (match, username) => {
    const escapedUsername = escapeHtml(username);
    return `<a href="#/user/${escapedUsername}" class="tweet-mention">@${escapedUsername}</a>`;
  });
}

/**
 * Validates if a URL is safe
 * @param {string} url - URL to validate
 * @returns {boolean} - True if URL is safe
 */
function isValidUrl(url) {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes username input
 * @param {string} username - Username to sanitize
 * @returns {string} - Sanitized username
 */
export function sanitizeUsername(username) {
  if (!username) return '';
  
  // Remove any non-alphanumeric characters except underscore
  return username.replace(/[^a-zA-Z0-9_]/g, '');
}

/**
 * Sanitizes search query
 * @param {string} query - Search query to sanitize
 * @returns {string} - Sanitized query
 */
export function sanitizeSearchQuery(query) {
  if (!query) return '';
  
  // Escape HTML and remove any script tags or dangerous content
  let sanitized = escapeHtml(query);
  
  // Remove any potential script injections
  sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  
  return sanitized.trim();
}

/**
 * Strips all HTML tags from a string
 * @param {string} html - HTML string
 * @returns {string} - Plain text
 */
export function stripHtmlTags(html) {
  if (!html) return '';
  
  // Remove all HTML tags
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Sanitizes content for display in text-only contexts
 * @param {string} content - Content to sanitize
 * @returns {string} - Sanitized plain text
 */
export function sanitizeForDisplay(content) {
  if (!content) return '';
  
  // Strip HTML tags and escape remaining content
  const stripped = stripHtmlTags(content);
  return escapeHtml(stripped);
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength = 280) {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Sanitizes file names for upload
 * @param {string} filename - File name to sanitize
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename) {
  if (!filename) return '';
  
  // Remove any path traversal attempts
  let sanitized = filename.replace(/\.\.[\/\\]/g, '');
  
  // Remove special characters except dot, dash, underscore
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Limit length
  if (sanitized.length > 255) {
    const ext = sanitized.split('.').pop();
    const name = sanitized.substring(0, 250 - ext.length);
    sanitized = `${name}.${ext}`;
  }
  
  return sanitized;
}

/**
 * Creates a safe DOM element from sanitized HTML
 * @param {string} html - Sanitized HTML string
 * @returns {DocumentFragment} - Safe DOM fragment
 */
export function createSafeElement(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  return template.content;
}

/**
 * DOMPurify-like simple sanitizer for Vue
 * @param {string} dirty - Potentially dangerous HTML
 * @returns {string} - Clean HTML
 */
export function purifyHtml(dirty) {
  if (!dirty) return '';
  
  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = dirty;
  
  // Get the text content (automatically escaped)
  return temp.innerHTML;
}

export default {
  escapeHtml,
  sanitizeTweetContent,
  sanitizeUsername,
  sanitizeSearchQuery,
  stripHtmlTags,
  sanitizeForDisplay,
  truncateText,
  sanitizeFilename,
  createSafeElement,
  purifyHtml
};
