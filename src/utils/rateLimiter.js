/**
 * Rate Limiting Utilities
 * Implements client-side rate limiting to prevent abuse and spam
 */

class RateLimiter {
  constructor() {
    this.limits = new Map();
    this.storage = window.localStorage;
    this.STORAGE_KEY = 'rateLimitData';
    this.loadFromStorage();
  }

  /**
   * Rate limit configurations
   */
  static LIMITS = {
    tweet: {
      maxRequests: 10,
      windowMs: 60000, // 1 minute
      blockDurationMs: 300000 // 5 minutes block after limit exceeded
    },
    search: {
      maxRequests: 30,
      windowMs: 60000, // 1 minute
      blockDurationMs: 60000 // 1 minute block
    },
    follow: {
      maxRequests: 20,
      windowMs: 60000, // 1 minute
      blockDurationMs: 180000 // 3 minutes block
    },
    like: {
      maxRequests: 50,
      windowMs: 60000, // 1 minute
      blockDurationMs: 60000 // 1 minute block
    },
    login: {
      maxRequests: 5,
      windowMs: 900000, // 15 minutes
      blockDurationMs: 900000 // 15 minutes block
    },
    api: {
      maxRequests: 100,
      windowMs: 60000, // 1 minute
      blockDurationMs: 60000 // 1 minute block
    }
  };

  /**
   * Loads rate limit data from localStorage
   */
  loadFromStorage() {
    try {
      const stored = this.storage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Convert back to Map
        this.limits = new Map(Object.entries(data));
        this.cleanExpiredEntries();
      }
    } catch (error) {
      console.error('Failed to load rate limit data:', error);
      this.limits = new Map();
    }
  }

  /**
   * Saves rate limit data to localStorage
   */
  saveToStorage() {
    try {
      // Convert Map to object for storage
      const data = Object.fromEntries(this.limits);
      this.storage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save rate limit data:', error);
    }
  }

  /**
   * Cleans up expired entries
   */
  cleanExpiredEntries() {
    const now = Date.now();
    for (const [key, data] of this.limits.entries()) {
      if (data.resetTime && data.resetTime < now) {
        this.limits.delete(key);
      }
    }
    this.saveToStorage();
  }

  /**
   * Checks if an action is rate limited
   * @param {string} action - Action type (e.g., 'tweet', 'search')
   * @param {string} identifier - User identifier (e.g., IP, user ID)
   * @returns {Object} - { allowed: boolean, remainingRequests: number, resetTime: number, retryAfter: number }
   */
  checkLimit(action, identifier = 'default') {
    const config = RateLimiter.LIMITS[action] || RateLimiter.LIMITS.api;
    const key = `${action}:${identifier}`;
    const now = Date.now();
    
    // Clean expired entries periodically
    if (Math.random() < 0.1) {
      this.cleanExpiredEntries();
    }
    
    const limitData = this.limits.get(key);
    
    // If blocked, check if block has expired
    if (limitData?.blocked) {
      if (limitData.blockExpires > now) {
        return {
          allowed: false,
          remainingRequests: 0,
          resetTime: limitData.blockExpires,
          retryAfter: Math.ceil((limitData.blockExpires - now) / 1000),
          message: `Too many requests. Please try again in ${Math.ceil((limitData.blockExpires - now) / 1000)} seconds.`
        };
      } else {
        // Block expired, remove the entry
        this.limits.delete(key);
      }
    }
    
    // No existing limit or limit expired
    if (!limitData || limitData.resetTime < now) {
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
        blocked: false
      });
      this.saveToStorage();
      
      return {
        allowed: true,
        remainingRequests: config.maxRequests - 1,
        resetTime: now + config.windowMs,
        retryAfter: 0
      };
    }
    
    // Increment counter
    limitData.count++;
    
    // Check if limit exceeded
    if (limitData.count > config.maxRequests) {
      // Block the user
      limitData.blocked = true;
      limitData.blockExpires = now + config.blockDurationMs;
      this.limits.set(key, limitData);
      this.saveToStorage();
      
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: limitData.blockExpires,
        retryAfter: Math.ceil(config.blockDurationMs / 1000),
        message: `Rate limit exceeded. Please try again in ${Math.ceil(config.blockDurationMs / 1000)} seconds.`
      };
    }
    
    this.limits.set(key, limitData);
    this.saveToStorage();
    
    return {
      allowed: true,
      remainingRequests: config.maxRequests - limitData.count,
      resetTime: limitData.resetTime,
      retryAfter: 0
    };
  }

  /**
   * Resets rate limit for a specific action and identifier
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   */
  reset(action, identifier = 'default') {
    const key = `${action}:${identifier}`;
    this.limits.delete(key);
    this.saveToStorage();
  }

  /**
   * Gets current limit status without incrementing
   * @param {string} action - Action type
   * @param {string} identifier - User identifier
   * @returns {Object} - Current limit status
   */
  getStatus(action, identifier = 'default') {
    const config = RateLimiter.LIMITS[action] || RateLimiter.LIMITS.api;
    const key = `${action}:${identifier}`;
    const now = Date.now();
    const limitData = this.limits.get(key);
    
    if (!limitData || limitData.resetTime < now) {
      return {
        used: 0,
        remaining: config.maxRequests,
        total: config.maxRequests,
        resetTime: null,
        blocked: false
      };
    }
    
    return {
      used: limitData.count,
      remaining: Math.max(0, config.maxRequests - limitData.count),
      total: config.maxRequests,
      resetTime: limitData.resetTime,
      blocked: limitData.blocked || false,
      blockExpires: limitData.blockExpires
    };
  }

  /**
   * Clears all rate limits
   */
  clearAll() {
    this.limits.clear();
    this.storage.removeItem(this.STORAGE_KEY);
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

/**
 * Debounce function for input fields
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay = 300) {
  let timeoutId;
  
  return function debounced(...args) {
    clearTimeout(timeoutId);
    
    return new Promise((resolve) => {
      timeoutId = setTimeout(() => {
        const result = func.apply(this, args);
        resolve(result);
      }, delay);
    });
  };
}

/**
 * Throttle function for scroll/resize events
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
export function throttle(func, limit = 100) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args);
          lastRan = Date.now();
        }
      }, Math.max(limit - (Date.now() - lastRan), 0));
    }
  };
}

/**
 * Vue plugin for rate limiting
 */
export const RateLimiterPlugin = {
  install(app) {
    // Add global property
    app.config.globalProperties.$rateLimit = rateLimiter;
    
    // Add global method
    app.config.globalProperties.$checkRateLimit = (action, identifier) => {
      return rateLimiter.checkLimit(action, identifier);
    };
    
    // Add directive for rate-limited buttons
    app.directive('rate-limit', {
      mounted(el, binding) {
        const action = binding.value || 'api';
        
        el.addEventListener('click', (e) => {
          const result = rateLimiter.checkLimit(action);
          
          if (!result.allowed) {
            e.preventDefault();
            e.stopPropagation();
            
            // Show error message
            if (binding.modifiers.showError) {
              alert(result.message);
            }
            
            // Disable button temporarily
            if (binding.modifiers.disable) {
              el.disabled = true;
              setTimeout(() => {
                el.disabled = false;
              }, result.retryAfter * 1000);
            }
          }
        });
      }
    });
  }
};

export default rateLimiter;
export { RateLimiter };
