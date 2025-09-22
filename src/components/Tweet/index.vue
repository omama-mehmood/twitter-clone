<script>
import axios from 'axios'
import Icons from '@/components/Icons'
import { sanitizeForDisplay, escapeHtml, sanitizeTweetContent } from '@/utils/sanitization'
import rateLimiter from '@/utils/rateLimiter'

export default {
  name: 'tweet',
  data() {
    return {
      likeNumber: null,
      reTweetNumber: null,
      replyNumber: null,
      date: null,
      userData: {
        firstName: null,
        lastName: null,
        pictureUrl: null,
        userId: null
      },
      tweetBody: {
        content: '',
        author: ''
      },
      isVideoMode: false,
      isLiked: false,
      isRetweeted: false,
      rateLimitWarning: ''
    }
  },
  components: {
    Icons
  },
  computed: {
    // Safely display user's full name
    safeFullName() {
      if (!this.userData.firstName || !this.userData.lastName) return 'Anonymous';
      return escapeHtml(`${this.userData.firstName} ${this.userData.lastName}`);
    },
    // Safely display username
    safeUsername() {
      if (!this.userData.userId) return '';
      // Remove any special characters and escape
      const cleaned = this.userData.userId.replace(/[^a-zA-Z0-9_]/g, '');
      return escapeHtml(cleaned);
    },
    // Safely display tweet content with proper sanitization
    safeTweetContent() {
      if (!this.tweetBody.content) return '';
      return sanitizeTweetContent(this.tweetBody.content);
    },
    // Safe author display for hashtag
    safeAuthor() {
      if (!this.tweetBody.author) return '';
      // Remove spaces and special characters for hashtag
      const cleaned = this.tweetBody.author.replace(/[^a-zA-Z0-9]/g, '');
      return escapeHtml(cleaned);
    }
  },
  methods: {
    async addLike() {
      // Check rate limit for likes
      const rateCheck = rateLimiter.checkLimit('like');
      
      if (!rateCheck.allowed) {
        this.showRateLimitWarning('like', rateCheck.retryAfter);
        return;
      }
      
      // Toggle like state
      if (!this.isLiked) {
        this.likeNumber += 1;
        this.isLiked = true;
      } else {
        this.likeNumber -= 1;
        this.isLiked = false;
      }
    },
    
    async addRetweet() {
      // Check rate limit for retweets
      const rateCheck = rateLimiter.checkLimit('like'); // Using same limit as likes
      
      if (!rateCheck.allowed) {
        this.showRateLimitWarning('retweet', rateCheck.retryAfter);
        return;
      }
      
      // Toggle retweet state
      if (!this.isRetweeted) {
        this.reTweetNumber += 1;
        this.isRetweeted = true;
      } else {
        this.reTweetNumber -= 1;
        this.isRetweeted = false;
      }
    },
    
    showRateLimitWarning(action, retryAfter) {
      this.rateLimitWarning = `Too many ${action}s. Try again in ${retryAfter} seconds.`;
      
      setTimeout(() => {
        this.rateLimitWarning = '';
      }, 3000);
    },
    
    async randomUser() {
      try {
        const response = await axios.get('https://randomuser.me/api/', {
          timeout: 5000 // Add timeout
        });
        
        const value = response.data.results[0];
        
        // Sanitize user data
        this.userData.firstName = sanitizeForDisplay(value.name.first);
        this.userData.lastName = sanitizeForDisplay(value.name.last);
        
        // Validate and sanitize image URL
        if (this.isValidImageUrl(value.picture.medium)) {
          this.userData.pictureUrl = value.picture.medium;
        } else {
          this.userData.pictureUrl = 'https://100k-faces.glitch.me/random-image';
        }
        
        // Sanitize user ID
        this.userData.userId = value.id.name ? 
          value.id.name.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50) : 
          'user' + Math.floor(Math.random() * 10000);
          
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Set default safe values
        this.userData = {
          firstName: 'Anonymous',
          lastName: 'User',
          pictureUrl: 'https://100k-faces.glitch.me/random-image',
          userId: 'user' + Math.floor(Math.random() * 10000)
        };
      }
    },
    
    async getQuote() {
      try {
        const response = await axios.get('https://api.quotable.io/random/', {
          timeout: 5000,
          params: {
            maxLength: 280 // Ensure quote fits in tweet length
          }
        });
        
        const data = response.data;
        
        // Sanitize quote content
        this.tweetBody.content = sanitizeForDisplay(data.content);
        this.tweetBody.author = sanitizeForDisplay(data.author);
        
      } catch (error) {
        console.error('Failed to fetch quote:', error);
        // Set default safe content
        this.tweetBody.content = 'Welcome to Twitter Clone!';
        this.tweetBody.author = 'System';
      }
    },
    
    isValidImageUrl(url) {
      try {
        const urlObj = new URL(url);
        return ['http:', 'https:'].includes(urlObj.protocol);
      } catch {
        return false;
      }
    },

    setRandomValue() {
      let comment = Math.floor(Math.random() * 50) + 1
      let reTweet = Math.floor(comment * 4.3)
      let like = Math.floor(reTweet * 15.7)

      this.reTweetNumber = reTweet
      this.likeNumber = like
      this.replyNumber = comment
      this.date = Math.floor(Math.random() * 24) + 1
    },
    
    handleReply() {
      // Check rate limit
      const rateCheck = rateLimiter.checkLimit('tweet');
      if (!rateCheck.allowed) {
        this.showRateLimitWarning('reply', rateCheck.retryAfter);
        return;
      }
      // Handle reply logic
      console.log('Reply to tweet');
    },
    
    handleShare() {
      // Implement safe sharing
      console.log('Share tweet');
    }
  },
  async created() {
    await this.getQuote()
    await this.randomUser()
    this.setRandomValue()

    setTimeout(() => {
      this.isVideoMode = true
    }, 1000)
  }
}
</script>

<template>
  <div id="tweet" v-show="isVideoMode">
    <!-- Use safe image URL with error handling -->
    <img 
      :src="userData.pictureUrl" 
      :alt="`${safeFullName}'s avatar`"
      @error="(e) => e.target.src = 'https://100k-faces.glitch.me/random-image'"
      class="avatar-image"
    />
    <div class="tweet-content">
      <div class="user-info">
        <!-- Use computed properties for safe display -->
        <p class="name">{{ safeFullName }}</p>
        <p class="username" v-show="userData.userId">@{{ safeUsername }}</p>
        <span>•</span>
        <p class="date">{{ date }}h</p>
      </div>
      <div class="tweet-body">
        <!-- Use v-html only with sanitized content -->
        <p v-html="safeTweetContent"></p>
        <span class="hashtag" v-if="safeAuthor">#{{ safeAuthor }}</span>
      </div>
      
      <!-- Rate limit warning -->
      <div v-if="rateLimitWarning" class="rate-limit-warning">
        {{ rateLimitWarning }}
      </div>
      
      <div class="buttons">
        <div class="button" id="reply" @click="handleReply">
          <icons icon="comment" />
          <span v-show="replyNumber">{{ replyNumber }}</span>
        </div>
        <div 
          class="button" 
          id="retweet" 
          @click="addRetweet"
          :class="{ 'active': isRetweeted }"
        >
          <icons icon="retweet" />
          <span v-show="reTweetNumber">{{ reTweetNumber }}</span>
        </div>
        <div 
          class="button" 
          id="like" 
          @click="addLike"
          :class="{ 'active': isLiked }"
        >
          <icons icon="like" />
          <span v-show="likeNumber">{{ likeNumber }}</span>
        </div>
        <div class="button" id="share" @click="handleShare">
          <icons icon="share" />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
#tweet {
  display: flex;
  align-items: flex-start;
  padding: 1rem 31px 11px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);

  &:hover {
    background-color: rgba(0, 0, 0, 0.03);
  }

  img.avatar-image {
    margin-right: 1rem;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    object-fit: cover;
  }
  
  .tweet-content {
    width: 100%;
    
    .user-info {
      display: flex;
      align-items: flex-start;
      margin-bottom: 11px;
      
      * {
        margin-right: 4px;
        line-height: 17.58px;
        font-size: 15px;
        color: #828282;
      }
      
      .name {
        font-weight: 700;
        color: #000;
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .username {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      span {
        color: #828282;
      }
    }

    .tweet-body {
      margin-bottom: 11px;
      
      p {
        font-size: 15px;
        line-height: 22px;
        color: #333333;
        word-wrap: break-word;
        overflow-wrap: break-word;
      }
      
      // Style for sanitized links
      ::v-deep .tweet-link {
        color: #1da1f2;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      ::v-deep .tweet-hashtag {
        color: #1da1f2;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      ::v-deep .tweet-mention {
        color: #1da1f2;
        text-decoration: none;
        
        &:hover {
          text-decoration: underline;
        }
      }
      
      .hashtag {
        color: #1da1f2;
        cursor: pointer;
        
        &:hover {
          text-decoration: underline;
        }
      }
    }
    
    .rate-limit-warning {
      background-color: #fff3cd;
      border: 1px solid #ffeeba;
      color: #856404;
      padding: 6px 10px;
      border-radius: 4px;
      margin: 8px 0;
      font-size: 13px;
    }

    .buttons {
      display: flex;
      justify-content: space-around;
      width: 100%;
      
      .button {
        display: flex;
        justify-content: center;
        align-items: center;
        transition: all 0.2s;
        
        &.active {
          #like svg {
            fill: red;
          }
          
          #retweet svg {
            fill: green;
          }
        }
        
        svg {
          box-sizing: content-box;
          cursor: pointer;
          width: 18px;
          padding: 0.5rem;
          margin-right: 4px;
          border-radius: 50%;
          transition: all 0.2s;
        }
        
        span {
          font-size: 12px;
          transition: color 0.2s;
        }
      }
      
      #reply:hover {
        svg {
          fill: rgba(#1da1f2, 0.8);
          background-color: rgba(#1da1f2, 0.08);
        }

        span {
          color: rgba(#1da1f2, 0.8);
        }
      }
      
      #retweet:hover {
        svg {
          fill: rgba(green, 0.8);
          background-color: rgba(green, 0.08);
        }

        span {
          color: rgba(green, 0.8);
        }
      }
      
      #like:hover {
        svg {
          fill: rgba(red, 0.8);
          background-color: rgba(red, 0.08);
        }

        span {
          color: rgba(red, 0.8);
        }
      }
      
      #share:hover {
        svg {
          fill: rgba(#1da1f2, 0.8);
          background-color: rgba(#1da1f2, 0.08);
        }
      }
    }
  }
}

@media (max-width: 476px) {
  #tweet {
    padding-left: 0.5rem;
    padding-right: 0.5rem;
  }
}
</style>