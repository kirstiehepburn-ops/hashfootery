# hashfootery — setup guide

## 1. Supabase

Run `schema.sql` in your Supabase SQL editor to create the tables.

You can use your existing Supabase project or create a new one at supabase.com.

## 2. Bluesky bot account

Create a Bluesky account for the bot (e.g. `hashfooterybot.bsky.social`).
Then go to Settings → Privacy and Security → App Passwords and create an app password.

## 3. Deploy to Vercel

1. Push this folder to a GitHub repo
2. Go to vercel.com → New Project → import the repo
3. Set these environment variables in Vercel:

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service role key (not anon key) |
| `ADMIN_KEY` | A secret password for the admin panel |
| `BSKY_BOT_HANDLE` | e.g. `hashfooterybot.bsky.social` |
| `BSKY_BOT_PASSWORD` | The app password you created in step 2 |

4. Deploy. The Bluesky poll cron runs every 5 minutes automatically.

## 4. Add GW1 fixtures

Go to `/admin.html`, enter your admin key, and add the first set of fixtures before the season starts.

## 5. Optional — custom domain

If you get hashfootery.com transferred, add it in Vercel → Domains.
