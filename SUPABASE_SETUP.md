# EMBER Supabase Configuration

## Fix Email Redirect Issue

Your Supabase project is redirecting to Lovable after email verification. Follow these steps to fix it:

### Step 1: Update Supabase URL Configuration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/lnbdosdwbpobmanzmodf
2. Navigate to **Authentication** → **URL Configuration**
3. Update the following settings:

   **Site URL** (for development):
   ```
   http://localhost:8080
   ```

   **Redirect URLs** (add these):
   ```
   http://localhost:8080/**
   http://localhost:8080/kitchen
   http://localhost:8080/auth
   ```

   **Remove any URLs containing**:
   - `lovable.app`
   - `lovable.cloud`
   - `lovableproject.com`

4. Click **Save**

### Step 2: For Production Deployment

When you deploy to production, update these URLs to your production domain:

**Site URL**:
```
https://your-domain.com
```

**Redirect URLs**:
```
https://your-domain.com/**
https://your-domain.com/kitchen
https://your-domain.com/auth
```

### Step 3: Email Templates (Optional)

You can also customize email templates in:
**Authentication** → **Email Templates**

Change any references from Lovable to EMBER in:
- Confirm signup email
- Magic link email
- Change email address
- Reset password

### Alternative: Use Your Own Supabase Project

If this is a shared/managed Supabase instance, consider creating your own:

1. Go to https://supabase.com
2. Create a new project
3. Copy the new **Project URL** and **anon/public key**
4. Update your `.env` file with the new credentials
5. Run the database migrations from `drizzle/migrations/0000_migration.sql`

## Current Environment Variables

Your current Supabase connection in `.env`:
```
SUPABASE_PROJECT_ID="lnbdosdwbpobmanzmodf"
SUPABASE_URL="https://c--dd85b9d8-0dff-42aa-9920-40500d62b585-prod.lovable.cloud"
```

The URL still points to Lovable's infrastructure. For full independence, create a new Supabase project.
