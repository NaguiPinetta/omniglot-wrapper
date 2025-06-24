# Omniglot Wrapper Configuration Guide

## 🚀 **Model Access Types Overview**

This application supports 4 different ways to access AI models:

### 🔑 **API Key Models** (User's Own Keys)
- **Description**: Users provide their own API keys
- **Storage**: Keys stored in database via Models page
- **Cost**: User pays provider directly
- **Examples**: OpenAI GPT-4, DeepSeek, Mistral

### 🆓 **Free Tier Models** (Your Gateway)
- **Description**: Free models with daily usage limits
- **Storage**: No user API key needed
- **Cost**: You pay gateway provider
- **Examples**: Llama 3.1 8B (10/day), Gemma 7B (5/day)

### 🎯 **Demo Models** (Limited Testing)
- **Description**: Demo models for testing
- **Storage**: Mock responses, no real API calls
- **Cost**: Free (mock responses)
- **Examples**: Mixtral 8x7B Demo (3/day)

### 🌐 **Gateway Models** (Your Proxy)
- **Description**: Premium models via your gateway account
- **Storage**: Your gateway API keys in environment
- **Cost**: You pay gateway provider
- **Examples**: Claude 3 Haiku, GPT-3.5 via OpenRouter

## 📋 **Environment Variables**

Add these to your `.env` file:

```bash
# Required - Supabase
PUBLIC_SUPABASE_URL=your_supabase_url
PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NODE_TLS_REJECT_UNAUTHORIZED=0

# Optional - Gateway Services
OPENROUTER_API_KEY=your_openrouter_key
TOGETHER_API_KEY=your_together_key
CUSTOM_GATEWAY_URL=http://localhost:8000
CUSTOM_GATEWAY_KEY=your_custom_key
SITE_URL=http://localhost:5173
```

## 🗄️ **Database Setup**

1. **Apply Schema**:
   ```sql
   -- Run supabase_models_schema.sql
   -- Run usage_tracking_schema.sql
   ```

2. **Models Table Structure**:
   - `access_type`: 'api_key' | 'gateway' | 'free' | 'demo'
   - `free_tier_limit`: Daily usage limit for free models
   - `gateway_endpoint`: Custom endpoint URL
   - `requires_auth`: Whether authentication needed

## 🎮 **User Experience**

### **Agent Creation Modal**:
```
🔑 gpt-4 (OPENAI) - 8,192 tokens          [Requires user's API key]
🆓 llama-3.1-8b-free (META) - 10/day      [Free via your gateway]
🎯 mixtral-8x7b-demo (MISTRAL) - 3/day    [Demo/testing]
🌐 claude-3-haiku-gateway (ANTHROPIC)     [Via your OpenRouter]
```

### **Usage Tracking**:
- Free/demo models: Track daily usage per user
- API key models: No tracking needed
- Gateway models: Optional cost tracking

## 🔧 **Implementation Details**

### **Model Selection Logic**:
```javascript
// Show models based on access type:
switch (model.access_type) {
  case 'api_key':
    // Only show if user has saved API key for provider
    return hasApiKey(model.provider);
  case 'free':
  case 'demo':
  case 'gateway':
    // Always show (with usage limits)
    return true;
}
```

### **API Call Routing**:
```javascript
// Route requests based on access type:
switch (model.access_type) {
  case 'api_key':
    return callDirectProvider(model, userApiKey);
  case 'free':
  case 'demo':
    return callFreeModel(model); // Mock or limited
  case 'gateway':
    return callGatewayModel(model, yourApiKey);
}
```

## 💰 **Cost Management**

### **Free Tier Limits**:
- Tracked per user per day
- Enforced before API calls
- Reset daily at midnight

### **Gateway Costs**:
- You pay for all gateway usage
- Consider rate limiting
- Monitor usage in gateway dashboard

### **User API Keys**:
- User pays directly
- No cost to you
- Unlimited usage (subject to provider limits)

## 🚀 **Getting Started**

1. **Basic Setup** (API keys only):
   - Apply `supabase_models_schema.sql`
   - Users add their API keys via Models page
   - Only API key models shown

2. **Add Free Tier**:
   - Apply `usage_tracking_schema.sql`
   - Set up gateway API keys in environment
   - Free models appear automatically

3. **Full Implementation**:
   - All schemas applied
   - All environment variables set
   - All 4 access types available

## 🔍 **Monitoring**

### **Usage Statistics**:
- View daily usage per model
- Track free tier consumption
- Monitor gateway costs

### **Database Queries**:
```sql
-- Daily usage summary
SELECT model_id, SUM(requests_count) as total_requests
FROM usage_tracking 
WHERE usage_date = CURRENT_DATE
GROUP BY model_id;

-- User usage limits
SELECT * FROM check_free_tier_limit('model_id', 'user_id');
```

## 🎯 **Benefits**

1. **Flexible Access**: Multiple ways to use models
2. **User Choice**: Own keys vs your service  
3. **Monetization**: Freemium model possible
4. **Cost Control**: Track and limit usage
5. **Easy Scaling**: Add new access types easily 