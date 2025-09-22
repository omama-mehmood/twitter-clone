/**
 * Input Validation Utilities
 * Provides comprehensive validation for user inputs to prevent XSS and injection attacks
 */

// Maximum lengths for different input types
const MAX_LENGTHS = {
  tweet: 280,
  username: 50,
  displayName: 100,
  bio: 160,
  search: 100
};

// Regular expressions for validation
const PATTERNS = {
  // Username: alphanumeric and underscore only, 3-50 chars
  username: /^[a-zA-Z0-9_]{3,50}$/,
  // Display name: letters, spaces, hyphens, apostrophes
  displayName: /^[a-zA-Z\s\-']{1,100}$/,
  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // URL validation (basic)
  url: /^https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=]+$/,
  // Hashtag validation
  hashtag: /^#[a-zA-Z0-9_]{1,100}$/,
  // Mention validation
  mention: /^@[a-zA-Z0-9_]{1,50}$/
};

// Dangerous patterns to detect potential XSS attempts
const DANGEROUS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gi,
  /<iframe[^>]*>.*?<\/iframe>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // Event handlers like onclick=
  /<embed[^>]*>/gi,
  /<object[^>]*>/gi,
  /data:text\/html/gi,
  /vbscript:/gi
];

/**
 * Validates tweet content
 * @param {string} content - Tweet content to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateTweet(content) {
  const errors = [];
  
  if (!content || content.trim().length === 0) {
    errors.push('Tweet cannot be empty');
  }
  
  if (content.length > MAX_LENGTHS.tweet) {
    errors.push(`Tweet must be ${MAX_LENGTHS.tweet} characters or less`);
  }
  
  // Check for dangerous patterns
  if (containsDangerousContent(content)) {
    errors.push('Tweet contains potentially dangerous content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates username
 * @param {string} username - Username to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateUsername(username) {
  const errors = [];
  
  if (!username || username.trim().length === 0) {
    errors.push('Username is required');
  }
  
  if (!PATTERNS.username.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores (3-50 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates search input
 * @param {string} query - Search query to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateSearch(query) {
  const errors = [];
  
  if (query.length > MAX_LENGTHS.search) {
    errors.push(`Search query must be ${MAX_LENGTHS.search} characters or less`);
  }
  
  // Check for dangerous patterns
  if (containsDangerousContent(query)) {
    errors.push('Search query contains potentially dangerous content');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates URLs (for links in tweets)
 * @param {string} url - URL to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateURL(url) {
  const errors = [];
  
  if (!PATTERNS.url.test(url)) {
    errors.push('Invalid URL format');
  }
  
  // Check for javascript: and data: protocols
  if (url.toLowerCase().startsWith('javascript:') || 
      url.toLowerCase().startsWith('data:') ||
      url.toLowerCase().startsWith('vbscript:')) {
    errors.push('Unsafe URL protocol');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Checks if content contains dangerous patterns
 * @param {string} content - Content to check
 * @returns {boolean} - True if dangerous content detected
 */
function containsDangerousContent(content) {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(content));
}

/**
 * Validates email address
 * @param {string} email - Email to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validateEmail(email) {
  const errors = [];
  
  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  }
  
  if (!PATTERNS.email.test(email)) {
    errors.push('Invalid email format');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates hashtags in content
 * @param {string} hashtag - Hashtag to validate
 * @returns {boolean} - True if valid
 */
export function isValidHashtag(hashtag) {
  return PATTERNS.hashtag.test(hashtag);
}

/**
 * Validates mentions in content
 * @param {string} mention - Mention to validate
 * @returns {boolean} - True if valid
 */
export function isValidMention(mention) {
  return PATTERNS.mention.test(mention);
}

/**
 * Generic validation function
 * @param {string} value - Value to validate
 * @param {Object} rules - Validation rules
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export function validate(value, rules = {}) {
  const errors = [];
  
  if (rules.required && (!value || value.trim().length === 0)) {
    errors.push(`${rules.fieldName || 'Field'} is required`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`${rules.fieldName || 'Field'} must be ${rules.maxLength} characters or less`);
  }
  
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`${rules.fieldName || 'Field'} must be at least ${rules.minLength} characters`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push(`${rules.fieldName || 'Field'} format is invalid`);
  }
  
  if (rules.noDangerousContent && containsDangerousContent(value)) {
    errors.push(`${rules.fieldName || 'Field'} contains potentially dangerous content`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export default {
  validateTweet,
  validateUsername,
  validateSearch,
  validateURL,
  validateEmail,
  isValidHashtag,
  isValidMention,
  validate,
  MAX_LENGTHS,
  PATTERNS
};
