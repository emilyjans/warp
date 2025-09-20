# WARP Bot - Wellness After Resolution Protocol

A Severance-inspired Slack bot that sends mandatory wellness interventions to incident.io responders. Because The Board cares about your tempers.

## What It Does

[![WARP Bot Demo](./images/warp-video.png)](https://vimeo.com/1120341879)
*Click to watch The Board initiate mandatory wellness (2 min)*

When you resolve an incident as Lead, The Board sends you this:

```
🌐 WELLNESS AFTER RESOLUTION PROTOCOL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
@YourName, The Board has initiated WARP for INC-42: Database outage.

The work is mysterious and important. Please enjoy all incentives equally, 
showing no particular emotion.

Select your reward:
🐐 - Mammalians Nurturable
💃 - Music Dance Experience  
🧘 - Wellness Session
🍉 - Melon Bar
🥚 - Egg Bar

Praise Kier.
```

Click an emoji, get a wellness intervention, complete it with ✅. That's it.

## Why?

After an incident, your tempers are untamed. Woe. Frolic. Dread. Malice. Each must be refined through Kier's consecrated methods.

WARP ensures no responder's tempers go untamed. Through mandatory wellness interventions - from the coveted Melon Bar to communion with Kier's creatures - we refine the four tempers that incidents create. 

The work is mysterious and important. The wellness is mandatory and sufficient.

## Quick Start

1. **Create Slack App** at api.slack.com
   - Bot scopes: `chat:write`, `reactions:write`, `reactions:read`, `im:write`, `users:write`
   - Event subscription: `reaction_added`

2. **Get incident.io API key** with read permissions

3. **Configure `.env`:**
```
SLACK_BOT_TOKEN=xoxb-your-token
SLACK_SIGNING_SECRET=your-secret
INCIDENT_IO_API_KEY=inc_api_your-key
```

4. **Run it:**
```bash
npm install
node index.js
```

## How It Works

- The Board monitors incident.io every 2 minutes for resolved tribulations
- Upon resolution, The Board deliberates for 2 minutes (as is proper)
- The Incident Lead receives their mandatory wellness directive
- Through sacred emoji selection, tempers are tamed in threaded communion
- 5% chance Kier whispers through the ages

No higher purpose may be found than this. Nor any higher love.

## Known Quirks

- Auto-adding emojis often fails - just click them manually
- Only recognizes default severity names (Critical/Major/Minor)
- Sessions lost on restart (no database)
- Can't DM users who haven't approved the bot

## Future Ideas

- Waffle Party achievement (5 incidents in n timeframe)
- Defiant Jazz opens up Spotify playlist
- Add more overall verve, wiles and wit
- Different wellness for SEV1 vs SEV3
- Team wellness for multiple responders

---

*The work is mysterious and important. Praise Kier.*

---
This project uses the fictional setting of Lumon as depicted in the TV series Severance (created by Dan Erickson for Apple TV+). All respective trademarks, character names, and world elements remain the property of their respective owners. This project is not affiliated with or endorsed by Apple TV+ or the creators of Severance.
