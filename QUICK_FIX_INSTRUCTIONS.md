# Quick Fix Instructions

## 🚀 **To Fix Both Issues (Agent Names & Model Dropdown)**

### **Step 1: Apply Database Schema**
1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the entire content of `apply_all_schemas.sql`
4. Click **Run** to execute the script

This will:
- ✅ Add `name` column to agents table
- ✅ Add `access_type` and other fields to models table  
- ✅ Add free/demo/gateway models for testing
- ✅ Create usage tracking system

### **Step 2: Refresh Your App**
1. Refresh your browser page
2. Try creating/editing an agent again

## 🎯 **What You Should See After Fix:**

### **Agent Names:**
- ✅ Names will be saved and displayed properly
- ✅ Edit modal will show existing agent names

### **Model Dropdown:**
- ✅ Your OpenAI models (with 🔑 icon)
- ✅ Free tier models (with 🆓 icon) 
- ✅ Demo models (with 🎯 icon)
- ✅ Gateway models (with 🌐 icon)

Example dropdown options:
```
🔑 gpt-3.5-turbo (OPENAI) - 16,385 tokens
🔑 gpt-4 (OPENAI) - 8,192 tokens  
🔑 gpt-4-turbo-preview (OPENAI) - 128,000 tokens
🆓 llama-3.1-8b-free (META - Free, 10/day) - 8,192 tokens
🎯 mixtral-8x7b-demo (MISTRAL - Demo, 3/day) - 32,768 tokens
🌐 claude-3-haiku-gateway (ANTHROPIC) - 200,000 tokens
```

## 🔍 **If Still Having Issues:**

1. **Check Browser Console** - Look for any error messages
2. **Verify Database** - Check if the SQL script ran successfully
3. **Clear Cache** - Try hard refresh (Ctrl+F5)

The schema update is the key fix - it adds the missing database columns that the new code expects! 

## Issue: Agent Names Not Showing

### Root Cause
The `name` column was added to the `agents` table after existing agents were created, leaving them with empty/null names.

### Solution
Run this SQL in your Supabase SQL Editor:

```sql
-- Fix existing agents with empty names
UPDATE agents 
SET name = COALESCE(
  NULLIF(name, ''), 
  'Agent ' || substr(id::text, 1, 8)
)
WHERE name IS NULL OR name = '';

-- Ensure name column has proper constraints
ALTER TABLE agents 
ALTER COLUMN name SET NOT NULL,
ALTER COLUMN name SET DEFAULT 'New Agent';
```

### What This Does
1. **Updates existing agents**: Gives them a name like "Agent b148573f" based on their ID
2. **Sets constraints**: Ensures future agents must have names
3. **Sets default**: New agents get "New Agent" as default name

### Result
- ✅ All existing agents will show proper names in the UI
- ✅ Edit modal will pre-fill with current names
- ✅ Name changes will save properly
- ✅ New agents will always have names

## Models Dropdown Issue

### Current Status
- All 7 models now show in dropdown (OpenAI, DeepSeek, Mistral)
- Models show with 🔑 icons indicating API key requirement

### Future Enhancement
To get the full multi-access model system (🔑 API Key, 🆓 Free, 🎯 Demo, 🌐 Gateway), run the complete `apply_all_schemas.sql` script. 