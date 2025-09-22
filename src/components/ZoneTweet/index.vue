<script>
import Icons from '@/components/Icons'
import { validateTweet, validate } from '@/utils/validation'
import { sanitizeTweetContent } from '@/utils/sanitization'
import rateLimiter, { debounce } from '@/utils/rateLimiter'

export default {
  name: 'ZoneTweet',
  components: {
    Icons
  },
  data() {
    return {
      tweetContent: '',
      errors: [],
      isSubmitting: false,
      characterCount: 0,
      maxCharacters: 280,
      showRateLimitWarning: false,
      rateLimitMessage: ''
    }
  },
  computed: {
    remainingCharacters() {
      return this.maxCharacters - this.characterCount;
    },
    isOverLimit() {
      return this.characterCount > this.maxCharacters;
    },
    canSubmit() {
      return this.tweetContent.trim().length > 0 && 
             !this.isOverLimit && 
             !this.isSubmitting &&
             this.errors.length === 0;
    }
  },
  methods: {
    // Debounced validation to avoid excessive checks
    validateInput: debounce(function(value) {
      // Clear previous errors
      this.errors = [];
      
      if (!value || value.trim().length === 0) {
        return;
      }
      
      // Validate tweet content
      const validation = validateTweet(value);
      if (!validation.isValid) {
        this.errors = validation.errors;
      }
    }, 300),
    
    handleInput(event) {
      const value = event.target.value;
      
      // Update character count
      this.characterCount = value.length;
      
      // Store the value
      this.tweetContent = value;
      
      // Validate with debouncing
      this.validateInput(value);
    },
    
    async handleSubmit() {
      // Check rate limit
      const rateCheck = rateLimiter.checkLimit('tweet');
      
      if (!rateCheck.allowed) {
        this.showRateLimitWarning = true;
        this.rateLimitMessage = rateCheck.message;
        
        // Hide warning after 5 seconds
        setTimeout(() => {
          this.showRateLimitWarning = false;
        }, 5000);
        
        return;
      }
      
      // Final validation before submit
      const validation = validateTweet(this.tweetContent);
      if (!validation.isValid) {
        this.errors = validation.errors;
        return;
      }
      
      this.isSubmitting = true;
      
      try {
        // Sanitize content before sending
        const sanitizedContent = sanitizeTweetContent(this.tweetContent);
        
        // Here you would normally send to API
        console.log('Submitting sanitized tweet:', sanitizedContent);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Clear form on success
        this.tweetContent = '';
        this.characterCount = 0;
        this.errors = [];
        
        // Reset input
        this.$refs.tweetInput.value = '';
        
      } catch (error) {
        console.error('Failed to submit tweet:', error);
        this.errors = ['Failed to submit tweet. Please try again.'];
      } finally {
        this.isSubmitting = false;
      }
    },
    
    handlePaste(event) {
      // Prevent pasting of potentially dangerous content
      const pastedText = event.clipboardData.getData('text');
      
      // Basic check for script tags
      if (pastedText.includes('<script') || pastedText.includes('javascript:')) {
        event.preventDefault();
        this.errors = ['Pasted content contains potentially dangerous code'];
        return;
      }
    },
    
    getRateLimitStatus() {
      return rateLimiter.getStatus('tweet');
    }
  },
  mounted() {
    // Check rate limit status on mount
    const status = this.getRateLimitStatus();
    console.log('Rate limit status:', status);
  }
}
</script>

<template>
  <div id="zone-tweet">
    <img src="https://100k-faces.glitch.me/random-image" class="avatar-image" />
    <div class="input-context">
      <div class="input-wrapper">
        <input 
          ref="tweetInput"
          type="text" 
          placeholder="What's happening" 
          @input="handleInput"
          @paste="handlePaste"
          :disabled="isSubmitting"
          :class="{ 'error': errors.length > 0 || isOverLimit }"
          maxlength="500"
        />
        
        <!-- Character counter -->
        <div class="character-counter" :class="{ 'over-limit': isOverLimit }">
          {{ remainingCharacters }}
        </div>
      </div>
      
      <!-- Error messages -->
      <div v-if="errors.length > 0" class="error-messages">
        <p v-for="(error, index) in errors" :key="index" class="error-message">
          {{ error }}
        </p>
      </div>
      
      <!-- Rate limit warning -->
      <div v-if="showRateLimitWarning" class="rate-limit-warning">
        {{ rateLimitMessage }}
      </div>
      
      <div class="icons">
        <div class="left-icon">
          <icons icon="image" />
          <icons icon="gif" />
          <icons icon="Stats" />
          <icons icon="smile" />
          <icons icon="schedule" />
        </div>
        <div class="right-icon">
          <button 
            @click="handleSubmit" 
            :disabled="!canSubmit"
            :class="{ 'disabled': !canSubmit }"
          >
            {{ isSubmitting ? 'Posting...' : 'Tweet' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
#zone-tweet {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  width: 600px;
  padding-left: 1rem;
  padding-top: 8px;
  display: flex;
  align-items: flex-start;
  
  img {
    margin-right: 1rem;
  }
  
  img.avatar-image {
    margin-right: 1rem;
    border-radius: 50%;
    width: 48px;
    height: 48px;
  }
  
  .input-context {
    margin-right: 2rem;
    display: flex;
    flex-direction: column;
    flex: 1;
    
    .input-wrapper {
      position: relative;
      
      .character-counter {
        position: absolute;
        right: 10px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 14px;
        color: #828282;
        
        &.over-limit {
          color: #e0245e;
          font-weight: bold;
        }
      }
    }

    input {
      color: #333;
      font-weight: 400;
      line-height: 22.27px;
      font-size: 19px;
      padding: 1rem 50px 1rem 1rem;
      width: 100%;
      transition: border-color 0.2s;
      border: 1px solid transparent;
      border-radius: 4px;
      
      &.error {
        border-color: #e0245e;
        background-color: #fff5f5;
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
    
    input:active {
      outline: none;
    }
    
    input:focus {
      outline: 0;
      border-color: #1da1f2;
    }
    
    .error-messages {
      margin-top: 8px;
      margin-bottom: 8px;
      
      .error-message {
        color: #e0245e;
        font-size: 14px;
        margin: 4px 0;
      }
    }
    
    .rate-limit-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
      padding: 8px 12px;
      border-radius: 4px;
      margin: 8px 0;
      font-size: 14px;
    }

    .icons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 22px;
      margin-top: 12px;
      
      .left-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;

        svg {
          border-radius: 50%;
          padding: .5rem;
          box-sizing: content-box;
          
          &:hover {
            background-color: rgba(#1da1f2, 0.1);
          }
        }
      }

      .right-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        
        button {
          margin-right: 0px;
          background-color: #1da1f2;
          width: 98px;
          height: 42px;
          border-radius: 100px;
          font-weight: 700;
          font-size: 15px;
          line-height: 17.58px;
          cursor: pointer;
          color: #fff;
          transition: all 0.2s;
          border: 1px solid #1da1f2;
          
          &:hover:not(:disabled) {
            background-color: #1a8cd8;
          }
          
          &.disabled, &:disabled {
            background-color: #aab8c2;
            border-color: #aab8c2;
            cursor: not-allowed;
            opacity: 0.6;
          }
        }
        
        button:active {
          outline: none;
        }
        
        button:focus {
          outline: 0;
        }
      }
    }
  }
}

@media (max-width: 758px) {
  #zone-tweet {
    width: 100%;
  }
}

@media (max-width: 476px) {
  #zone-tweet {
    display: none;
  }
}
</style>