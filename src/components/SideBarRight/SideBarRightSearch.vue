<template>
  <div class="search">
    <img src="../../assets/tweet-icons/find-search.svg" alt="" />
    <input 
      type="text" 
      placeholder="Search Twitter" 
      v-model="searchQuery"
      @input="handleSearch"
      @keydown.enter="performSearch"
      :disabled="isSearching"
      :class="{ 'error': hasError }"
      maxlength="100"
    />
    <div v-if="errorMessage" class="error-tooltip">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script>
import { validateSearch } from '@/utils/validation'
import { sanitizeSearchQuery } from '@/utils/sanitization'
import rateLimiter, { debounce } from '@/utils/rateLimiter'

export default {
  data() {
    return {
      searchQuery: '',
      isSearching: false,
      hasError: false,
      errorMessage: ''
    }
  },
  methods: {
    // Debounced search validation
    validateSearchInput: debounce(function(value) {
      this.hasError = false;
      this.errorMessage = '';
      
      if (!value || value.trim().length === 0) {
        return;
      }
      
      const validation = validateSearch(value);
      if (!validation.isValid) {
        this.hasError = true;
        this.errorMessage = validation.errors[0];
      }
    }, 300),
    
    handleSearch(event) {
      const value = event.target.value;
      this.validateSearchInput(value);
    },
    
    async performSearch() {
      // Check if search is valid
      if (this.hasError || !this.searchQuery.trim()) {
        return;
      }
      
      // Check rate limit
      const rateCheck = rateLimiter.checkLimit('search');
      
      if (!rateCheck.allowed) {
        this.hasError = true;
        this.errorMessage = `Too many searches. Try again in ${rateCheck.retryAfter} seconds.`;
        
        // Clear error after delay
        setTimeout(() => {
          this.hasError = false;
          this.errorMessage = '';
        }, 3000);
        
        return;
      }
      
      this.isSearching = true;
      
      try {
        // Sanitize search query
        const sanitizedQuery = sanitizeSearchQuery(this.searchQuery);
        
        // Here you would normally perform the search
        console.log('Searching for:', sanitizedQuery);
        
        // Simulate search API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Handle search results...
        
      } catch (error) {
        console.error('Search failed:', error);
        this.hasError = true;
        this.errorMessage = 'Search failed. Please try again.';
      } finally {
        this.isSearching = false;
      }
    },
    
    // Prevent XSS through paste
    handlePaste(event) {
      const pastedText = event.clipboardData.getData('text');
      
      // Check for potentially dangerous content
      if (pastedText.includes('<script') || 
          pastedText.includes('javascript:') ||
          pastedText.includes('onerror=')) {
        event.preventDefault();
        this.hasError = true;
        this.errorMessage = 'Invalid search content';
        
        setTimeout(() => {
          this.hasError = false;
          this.errorMessage = '';
        }, 3000);
      }
    }
  },
  mounted() {
    // Add paste event listener
    const input = this.$el.querySelector('input');
    if (input) {
      input.addEventListener('paste', this.handlePaste.bind(this));
    }
  },
  beforeUnmount() {
    // Clean up event listener
    const input = this.$el.querySelector('input');
    if (input) {
      input.removeEventListener('paste', this.handlePaste);
    }
  }
}
</script>

<style scoped lang="scss">
.search {
  margin-bottom: 1rem;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 15px auto;
  height: 48px;
  background: #e7ecf0;
  border-radius: 100px;
  position: relative;

  img {
    margin-left: 17.67px;
    margin-right: 9.88px;
  }
  
  input {
    color: #333;
    background: transparent;
    font-size: 15px;
    line-height: 27.58px;
    width: 15rem;
    transition: all 0.2s;
    
    &.error {
      color: #e0245e;
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    
    &::placeholder {
      color: #828282;
    }
  }
  
  input:active {
    outline: none;
    border: none;
  }
  
  input:focus {
    outline: 0;
  }
  
  .error-tooltip {
    position: absolute;
    top: 100%;
    left: 50px;
    margin-top: 4px;
    background: #e0245e;
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
    
    &::before {
      content: '';
      position: absolute;
      top: -4px;
      left: 20px;
      width: 0;
      height: 0;
      border-left: 4px solid transparent;
      border-right: 4px solid transparent;
      border-bottom: 4px solid #e0245e;
    }
  }
}

// Add visual feedback for rate limiting
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.search.rate-limited {
  animation: shake 0.3s;
}
</style>