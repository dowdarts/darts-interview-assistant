# TV Display System Setup

## Overview
The interview app now syncs live data to GitHub, which powers two TV display pages that update automatically.

---

## Quick Setup (5 minutes)

### 1. Create GitHub Personal Access Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Tokens (classic)"**
3. Name it: `Darts Interview Sync`
4. Set expiration: `No expiration` (or your preference)
5. Check the box for: **`repo`** (Full control of private repositories)
6. Scroll down and click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)

### 2. Enable Sync in Interview App

1. Open the interview app: https://dowdarts.github.io/darts-interview-assistant/
2. Tap **"TV Sync"** button (top right)
3. Paste your GitHub token
4. Tap OK
5. You should see a green checkmark: **✓ TV Sync**

That's it! Now whenever Denis scores a match, it automatically pushes to GitHub.

---

## TV Display URLs

### Garage TV (Rotating Display)
**URL:** https://dowdarts.github.io/darts-interview-assistant/tv-display.html

**What it shows:**
- Current match (live)
- Upcoming schedule
- Auto-rotates every 20 seconds
- Updates every 3 seconds

**Setup:**
1. Open Chrome/Firefox on the garage TV
2. Press F11 for fullscreen
3. Load the URL above
4. Done!

---

### OBS Standings Overlay
**URL:** https://dowdarts.github.io/darts-interview-assistant/tv-standings.html

**What it shows:**
- Group A & B standings (ranked by legs won)
- Recent match results
- Updates every 3 seconds
- Transparent background (perfect for OBS overlay)

**Setup in OBS:**
1. Add new source: **Browser**
2. URL: https://dowdarts.github.io/darts-interview-assistant/tv-standings.html
3. Width: 1920
4. Height: 1080
5. Check **"Shutdown source when not visible"** (optional, saves resources)
6. Click OK

The standings will overlay perfectly on your stream!

---

## How It Works

```
Interview App (Denis's Phone)
  ↓ (scores match)
GitHub API Push
  ↓ (commits event-data.json)
GitHub Pages
  ↓ (hosts the file)
TV Displays (poll every 3 seconds)
  ↓ (fetch latest data)
Updates Automatically
```

No Firebase, no extra services—just GitHub doing all the work!

---

## Troubleshooting

### TV displays show "Waiting for data..."
- Make sure **TV Sync** is enabled in the interview app (green checkmark)
- Complete at least one match to generate data
- Wait 3-10 seconds for GitHub to process the commit
- Refresh the TV display page

### "Sync failed" error
- Check your GitHub token is correct
- Make sure the token has **`repo`** permission
- Try regenerating the token and pasting it again

### Displays are slow to update
- GitHub API can take 3-10 seconds to commit
- TV displays poll every 3 seconds
- Total delay: 5-15 seconds (this is normal)

---

## Adding Scorekeepers (Coming Soon)

Currently matches show "TBD" for scorekeeper. To add scorekeepers:
1. In the interview app, we'll add a scorekeeper field to each match
2. You can set a default per board (e.g., "Denis" for Board 1, "Mike" for Board 2)
3. This will automatically appear on the TV schedule display

Let me know if you need this added!

---

## Need Help?

If anything isn't working:
1. Check that TV Sync is enabled (green checkmark)
2. Try refreshing the TV display pages
3. Check the browser console for errors (F12 → Console tab)
4. Message me with the error details
