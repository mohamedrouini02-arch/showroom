-- ============================================================
-- Wahid Auto Showroom - Complete Database Schema
-- Supabase Project: qtgvmqdvghvijfbacnza
-- Generated: 2026-05-04
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CARS TABLE (Inventory)
-- Used by: Inventory, Sales, Rentals, Dashboard
-- ============================================================
DROP TABLE IF EXISTS public.rentals CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.employees CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.cars CASCADE;

CREATE TABLE public.cars (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    make TEXT NOT NULL,                          -- e.g. Toyota, Hyundai
    model TEXT NOT NULL,                         -- e.g. Hilux, Accent
    year INTEGER NOT NULL,                       -- e.g. 2024
    type TEXT DEFAULT 'Sedan',                   -- Sedan, SUV, Truck, Hatchback
    transmission TEXT DEFAULT 'Automatic',       -- Automatic, Manual
    fuel TEXT DEFAULT 'Petrol',                  -- Petrol, Diesel, Hybrid, LPG
    color TEXT,                                  -- e.g. White, Black
    mileage INTEGER DEFAULT 0,                   -- Odometer in KM
    vin TEXT,                                    -- Vehicle Identification Number (optional)
    buying_price NUMERIC NOT NULL,               -- Cost to showroom (DA)
    price NUMERIC NOT NULL,                      -- Selling / Listing price (DA)
    status TEXT DEFAULT 'Available'              -- Available, Sold, Rented
        CHECK (status IN ('Available', 'Sold', 'Rented')),
    damages JSONB DEFAULT '[]'::JSONB,           -- Array of {area, description}
    photos TEXT[] DEFAULT '{}',                  -- Array of Supabase Storage URLs
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Indexes for cars
CREATE INDEX idx_cars_status ON public.cars(status);
CREATE INDEX idx_cars_created_at ON public.cars(created_at DESC);

-- ============================================================
-- 2. CUSTOMERS TABLE
-- Used by: Customers, Sales, Rentals, RentalAgreement
-- ============================================================
CREATE TABLE public.customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,                          -- Full name
    phone TEXT NOT NULL,                         -- e.g. 0550123456
    email TEXT,                                  -- Optional email
    address TEXT,                                -- e.g. Jijel Center
    national_id TEXT,                            -- National ID / Driver License number
    id_photo_url TEXT,                           -- URL to uploaded ID scan photo
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Indexes for customers
CREATE INDEX idx_customers_name ON public.customers(name);
CREATE INDEX idx_customers_created_at ON public.customers(created_at DESC);

-- ============================================================
-- 3. EMPLOYEES TABLE (HR / Staff)
-- Used by: HR, Sales, Dashboard
-- ============================================================
CREATE TABLE public.employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,                          -- Full name
    role TEXT DEFAULT 'Sales',                   -- Sales, Mechanic, Manager, etc.
    email TEXT,                                  -- Optional email
    phone TEXT,                                  -- Optional phone
    joined_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Indexes for employees
CREATE INDEX idx_employees_joined_at ON public.employees(joined_at DESC);

-- ============================================================
-- 4. SALES TABLE
-- Used by: Sales, Dashboard, HR (commission stats)
-- ============================================================
CREATE TABLE public.sales (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    price NUMERIC NOT NULL,                      -- Final sale price (DA)
    buying_price NUMERIC NOT NULL,               -- Cost at time of sale (DA)
    profit NUMERIC GENERATED ALWAYS AS (price - buying_price) STORED,
    commission_rate NUMERIC DEFAULT 0,           -- Commission percentage (e.g. 5)
    commission_amount NUMERIC DEFAULT 0,         -- Calculated commission (DA)
    sale_date TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL
);

-- Indexes for sales
CREATE INDEX idx_sales_car_id ON public.sales(car_id);
CREATE INDEX idx_sales_customer_id ON public.sales(customer_id);
CREATE INDEX idx_sales_employee_id ON public.sales(employee_id);
CREATE INDEX idx_sales_created_at ON public.sales(created_at DESC);

-- ============================================================
-- 5. RENTALS TABLE
-- Used by: Rentals, Dashboard, RentalAgreement
-- ============================================================
CREATE TABLE public.rentals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    car_id UUID REFERENCES public.cars(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    start_date DATE NOT NULL,                    -- Rental start date
    end_date DATE NOT NULL,                      -- Rental end date
    pickup_time TIME,                            -- Time of vehicle pickup (e.g. 14:30)
    daily_rate NUMERIC NOT NULL,                 -- Price per day (DA)
    total_cost NUMERIC NOT NULL,                 -- Total rental cost (DA)
    mileage_out INTEGER,                         -- Odometer reading at pickup (KM)
    status TEXT DEFAULT 'Active'                 -- Active, Returned
        CHECK (status IN ('Active', 'Returned')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::TEXT, now()) NOT NULL,
    returned_at TIMESTAMPTZ                      -- Timestamp when car was returned
);

-- Indexes for rentals
CREATE INDEX idx_rentals_car_id ON public.rentals(car_id);
CREATE INDEX idx_rentals_customer_id ON public.rentals(customer_id);
CREATE INDEX idx_rentals_status ON public.rentals(status);
CREATE INDEX idx_rentals_created_at ON public.rentals(created_at DESC);
CREATE INDEX idx_rentals_end_date ON public.rentals(end_date ASC);

-- ============================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- Open access for now (no auth required)
-- ============================================================
ALTER TABLE public.cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;

-- Allow full access for anon/authenticated users (prototype mode)
CREATE POLICY "Allow all access on cars" ON public.cars
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on customers" ON public.customers
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on employees" ON public.employees
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on sales" ON public.sales
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all access on rentals" ON public.rentals
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- 7. SUPABASE STORAGE BUCKETS
-- Run this AFTER creating buckets in Dashboard → Storage
-- Bucket names: vehicle-photos, customer-ids (set as PUBLIC)
-- ============================================================

-- Storage policies for vehicle-photos bucket
CREATE POLICY "Allow public read vehicle-photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow public upload vehicle-photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow public update vehicle-photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'vehicle-photos');

CREATE POLICY "Allow public delete vehicle-photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'vehicle-photos');

-- Storage policies for customer-ids bucket
CREATE POLICY "Allow public read customer-ids"
ON storage.objects FOR SELECT
USING (bucket_id = 'customer-ids');

CREATE POLICY "Allow public upload customer-ids"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'customer-ids');

CREATE POLICY "Allow public update customer-ids"
ON storage.objects FOR UPDATE
USING (bucket_id = 'customer-ids');

CREATE POLICY "Allow public delete customer-ids"
ON storage.objects FOR DELETE
USING (bucket_id = 'customer-ids');

-- ============================================================
-- DONE! All tables and storage policies are ready.
-- 
-- IMPORTANT: After running this SQL, go to Supabase Dashboard:
--   1. Storage → New Bucket → "vehicle-photos" (Public)
--   2. Storage → New Bucket → "customer-ids" (Public)
-- ============================================================
