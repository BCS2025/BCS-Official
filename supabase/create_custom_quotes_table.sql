-- Create custom_quotes table
CREATE TABLE IF NOT EXISTS public.custom_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    quote_id TEXT NOT NULL UNIQUE,
    method TEXT NOT NULL CHECK (method IN ('laser', '3dprint')),
    material TEXT NOT NULL,
    specifications JSONB NOT NULL DEFAULT '{}'::jsonb,
    dimensions JSONB NOT NULL DEFAULT '{}'::jsonb,
    file_url TEXT,
    file_name TEXT,
    customer JSONB NOT NULL DEFAULT '{}'::jsonb,
    need_optimization BOOLEAN DEFAULT false,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'evaluating', 'quoted', 'accepted', 'rejected', 'completed'))
);

-- Note: 'specifications' for 'laser' stores { needVectorService: boolean }.
-- 'specifications' for '3dprint' stores { infill: text, layerHeight: text }.
-- 'dimensions' stores { dimX: number, dimY: number, dimZ: number }.
-- 'customer' stores { name: text, email: text, lineId: text }.

COMMENT ON TABLE public.custom_quotes IS 'Stores customized fabrication quotation requests from the Forging Workshop.';

-- Enable RLS
ALTER TABLE public.custom_quotes ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to INSERT new quotes
CREATE POLICY "Allow public insert to custom_quotes"
ON public.custom_quotes
FOR INSERT
TO public
WITH CHECK (true);

-- Allow admins (authenticated via standard auth mechanism, here we allow full access based on current setup, adjust as needed)
-- We will assume authenticated users can SELECT/UPDATE. Based on existing setup, maybe public selection is disabled.
CREATE POLICY "Allow authenticated read custom_quotes"
ON public.custom_quotes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated update custom_quotes"
ON public.custom_quotes
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Also add policy for Service Role to bypass RLS securely if needed
CREATE POLICY "Service Role full access to custom_quotes"
ON public.custom_quotes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
