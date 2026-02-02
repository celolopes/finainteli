-- FIX FOR: WARN [Sync] Skipping ai_usage_logs due to schema mismatch
-- ERROR: Could not find the 'updated_at' column of 'ai_usage_logs'
-- Run this script in your Supabase Dashboard > SQL Editor

-- 1. Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    model_id TEXT,
    prompt_tokens INTEGER,
    candidates_tokens INTEGER,
    total_tokens INTEGER,
    cost_brl NUMERIC, -- Using numeric for currency to avoid float errors
    feature_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ -- Optional, but good for WatermelonDB sync compatibility
);

-- 2. Safely add columns if the table exists but is missing them
DO $$
BEGIN
    -- Check and add updated_at
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_usage_logs' AND column_name = 'updated_at') THEN
        ALTER TABLE public.ai_usage_logs ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Check and add deleted_at (just in case sync logic tries to access it)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_usage_logs' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.ai_usage_logs ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
    
    -- Check and add cost_brl
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ai_usage_logs' AND column_name = 'cost_brl') THEN
        ALTER TABLE public.ai_usage_logs ADD COLUMN cost_brl NUMERIC;
    END IF;
END $$;

-- 3. Enable Row Level Security (Critical for security)
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies (Drop first to allow re-running this script)
DROP POLICY IF EXISTS "Users can insert their own logs" ON public.ai_usage_logs;
CREATE POLICY "Users can insert their own logs" ON public.ai_usage_logs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own logs" ON public.ai_usage_logs;
CREATE POLICY "Users can view their own logs" ON public.ai_usage_logs 
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own logs" ON public.ai_usage_logs;
CREATE POLICY "Users can update their own logs" ON public.ai_usage_logs 
    FOR UPDATE USING (auth.uid() = user_id);

-- 5. Create Trigger to automatically update 'updated_at'
-- First ensure the function exists (usually widely used, but defining just in case)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_ai_usage_logs_updated ON public.ai_usage_logs;
CREATE TRIGGER on_ai_usage_logs_updated
    BEFORE UPDATE ON public.ai_usage_logs
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- 6. Grant permissions to authenticated users
GRANT ALL ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;

-- Verification
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ai_usage_logs';
