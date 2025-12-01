# Supabase CLI

This folder holds Supabase CLI configuration and migrations for pushing to your linked project.

## Setup

1. Install CLI and login
```bash
npm i -g supabase
supabase login
```

2. Link this folder to your project (replace with your project ref from Supabase settings)
```bash
cd backend/supabase
supabase link --project-ref <your-project-ref>
```

## Run Migrations

Copy SQL files from `backend/db/migrations` into `backend/supabase/migrations` (or create new via CLI), then push:
```bash
supabase db push
```

## Create New Migration
```bash
supabase migration new <name>
# edit the generated SQL in supabase/migrations/<timestamp>_<name>.sql
supabase db push
```
