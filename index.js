// WARP Bot - Wellness After Resolution Protocol
// A Severance-inspired wellness bot for incident.io
// Praise Kier.

const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const fetch = require('node-fetch');
require('dotenv').config();

// Initialize Slack app with Bolt
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// incident.io API configuration
const INCIDENT_IO_API_KEY = process.env.INCIDENT_IO_API_KEY;
const INCIDENT_IO_API_URL = 'https://api.incident.io/v2';
const WARP_DELAY_MINUTES = process.env.WARP_DELAY_MINUTES || 2; // Configurable delay

// Store active wellness sessions and processed incidents
const activeSessions = new Map();
const processedIncidents = new Set();

// Goat names pool - Severance inspired
const goatNames = [
  "Temper", "Valiance", "Mr. Eagan", "Frolic", "Malice", 
  "Woe", "Dread", "Perpetuity", "Whisper", "The Tamed"
];

// Kier whispers (5% chance)
const kierWhispers = [
  "Be ever merry.",
  "The light of discovery shines truer upon a virgin meadow than a beaten path.",
  "Keep a merry humor ever in your heart.",
  "Let not weakness live in your veins.",
  "Cherished workers, drown it inside you.",
  "The surest way to tame a prisoner is to let him believe he's free.",
  "History makes us someone. Gives us a context. A shape.",
  "A good person will follow the rules. A great person will follow himself."
];

// Wellness messages for each option
const wellnessMessages = {
  'goat': {
    initial: `🐐🐐🐐

Kier's creatures have arrived:
- ${goatNames[0]} (achieved perpetuity)
- ${goatNames[1]} (knows the nine principles)
- ${goatNames[2]} (tamed and devoted)

They judge not your debugging methods.

React with ✅ when sufficiently nurtured.`,
    completion: "The creatures thank you for your time. A handshake is available upon request."
  },
  'dancer': {
    initial: `🎵 DEFIANT JAZZ INITIATED 🎵

"Let not weakness live in your veins.
Keep a merry humor ever in your heart." - Kier Eagan

Move defiantly for five minutes.
The Board observes your frolic.

React with ✅ when complete.`,
    completion: "Your defiant jazz has been logged. The Board found it invigorating."
  },
  'person_in_lotus_position': {
    initial: `KIER'S WISDOM FLOWS FROM THE PERPETUITY WING

"Tame in me the tempers four,
that I may serve thee evermore."

Breathe five times with Kier's rhythm.
Drown the incident inside you.

React with ✅ when tempers are tamed.`,
    completion: "Your tempers are tamed. Please enjoy all remaining work equally."
  },
  'watermelon': {
    initial: `🍉 KIER'S BOUNTY AWAITS 🍉

The Board grants access to:
• Honeydew (Kier's favorite)
• Cantaloupe (mysterious and important)
• Watermelon (blessed in perpetuity)

Be ever merry. Enjoy all melons equally.

React with ✅ to consume Kier's gift.`,
    completion: "Melon privileges granted. Your status bears 🍉 for one hour. Coveted as heck.",
    statusUpdate: true
  },
  'egg': {
    initial: `🥚 THE COVETED EGG BAR 🥚

"Endow in each bite the sum of your affections,
that through me they may be purified." - Kier

Today's preparations:
- Raw (as Kier intended)
- Deviled (for the valiant)
- Sacred (from Kier's own recipe)

React with ✅ to partake.`,
    completion: "The eggs were mysterious and important. Please resume your duties with renewed vigor."
  }
};

// Function to check incident.io for resolved incidents
async function checkForResolvedIncidents() {
  if (!INCIDENT_IO_API_KEY) {
    console.log('No incident.io API key configured');
    return;
  }

  try {
    console.log('Checking incident.io for resolved incidents...');
    
    // Get incidents from the last 2 hours (to handle any delays)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    
    const response = await fetch(`${INCIDENT_IO_API_URL}/incidents`, {
      headers: {
        'Authorization': `Bearer ${INCIDENT_IO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch incidents:', response.status, response.statusText);
      return;
    }

    const data = await response.json();
    const incidents = data.incidents || [];

    // Filter for resolved Critical/Major/Minor incidents we haven't processed
    const resolvedIncidents = incidents.filter(incident => {
      const status = incident.incident_status?.category;
      const severityName = incident.severity?.name || '';
      
      const isResolved = status === 'closed' || status === 'resolved';
      const isSev123 = ['Critical', 'Major', 'Minor'].includes(severityName);
      const notProcessed = !processedIncidents.has(incident.id);
      
      // Check for resolved timestamp
      const resolvedTimestamp = incident.incident_timestamp_values?.find(
        ts => ts.incident_timestamp.name === 'Resolved at' || 
              ts.incident_timestamp.name === 'Closed at'
      )?.value?.value;
      
      const isRecent = resolvedTimestamp ? 
        new Date(resolvedTimestamp) > new Date(twoHoursAgo) : false;
      
      return isResolved && isSev123 && notProcessed && isRecent;
    });

    console.log(`Found ${resolvedIncidents.length} new resolved incidents`);

    for (const incident of resolvedIncidents) {
      // Get the incident lead's Slack ID
      const incidentLead = incident.incident_role_assignments?.find(
        role => role.role?.name === 'Incident Lead' || 
                role.role?.shortform === 'lead' ||
                role.role?.role_type === 'lead'
      );

      const slackUserId = incidentLead?.assignee?.slack_user_id;

      if (slackUserId) {
        const incidentDisplay = incident.reference ? 
          `${incident.reference}: ${incident.name}` : 
          incident.name || incident.id;
        
        console.log(`Scheduling WARP for ${incidentLead.assignee?.name} for ${incidentDisplay}`);
        
        // Mark as processed immediately
        processedIncidents.add(incident.id);
        
        // Send WARP after configured delay (default 2 minutes)
        setTimeout(async () => {
          console.log(`Initiating WARP for ${incidentDisplay}`);
          await sendWellnessProtocol(
            slackUserId, 
            incidentDisplay,
            incident.name
          );
        }, WARP_DELAY_MINUTES * 60 * 1000);
      }
    }

  } catch (error) {
    console.error('Error checking incident.io:', error);
  }
}

// Send the initial WARP message
async function sendWellnessProtocol(userId, incidentId, incidentTitle) {
  try {
    console.log(`Sending WARP protocol to user ${userId}`);
    
    const result = await app.client.chat.postMessage({
      channel: userId,
      text: `WARP initiated for ${incidentId}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `🌐 *WELLNESS AFTER RESOLUTION PROTOCOL*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n<@${userId}>, The Board has initiated WARP for ${incidentId}.\n\n_The work is mysterious and important. Please enjoy all incentives equally, showing no particular emotion._\n\nSelect your reward:\n\n:goat: - Mammalians Nurturable\n:dancer: - Music Dance Experience\n:person_in_lotus_position: - Wellness Session\n:watermelon: - Melon Bar\n:egg: - Egg Bar\n\n*Praise Kier.*`
          }
        }
      ]
    });
    
    console.log('WARP message sent successfully');
    
    // Store session info
    const sessionKey = `${result.channel}-${result.ts}`;
    activeSessions.set(sessionKey, {
      userId,
      incidentId,
      stage: 'awaiting_selection'
    });
    
    // Try to add reactions (optional - users can add their own)
    const reactions = ['goat', 'dancer', 'person_in_lotus_position', 'watermelon', 'egg'];
    for (const reaction of reactions) {
      try {
        await app.client.reactions.add({
          channel: result.channel,
          timestamp: result.ts,
          name: reaction
        });
      } catch (err) {
        // Silently continue - users can add reactions manually
      }
    }
    
  } catch (error) {
    console.error('Error sending wellness protocol:', error);
  }
}

// Handle wellness option selection
app.event('reaction_added', async ({ event, client }) => {
  try {
    const sessionKey = `${event.item.channel}-${event.item.ts}`;
    const session = activeSessions.get(sessionKey);
    
    if (!session) return;
    
    // Skip if it's the bot's own reaction
    if (process.env.SLACK_BOT_ID && event.user === process.env.SLACK_BOT_ID) return;
    
    if (session.stage === 'awaiting_selection' && wellnessMessages[event.reaction]) {
      const wellness = wellnessMessages[event.reaction];
      
      // Send wellness message as a thread reply
      const result = await client.chat.postMessage({
        channel: event.item.channel,
        thread_ts: event.item.ts,
        text: wellness.initial
      });
      
      // Add checkmark reaction
      try {
        await client.reactions.add({
          channel: result.channel,
          timestamp: result.ts,
          name: 'white_check_mark'
        });
      } catch (err) {
        // User can add manually
      }
      
      // Update session
      session.stage = 'awaiting_completion';
      session.wellnessType = event.reaction;
      session.wellnessMessageTs = result.ts;
      activeSessions.set(sessionKey, session);
      
    } else if (session.stage === 'awaiting_completion' && event.reaction === 'white_check_mark') {
      const wellness = wellnessMessages[session.wellnessType];
      
      if (!wellness) return;
      
      // Add Kier whisper (5% chance)
      let kierMessage = "";
      if (Math.random() < 0.05) {
        kierMessage = `\n\n💭 _Kier whispers through the ages:_\n_"${kierWhispers[Math.floor(Math.random() * kierWhispers.length)]}"_`;
      }
      
      // Send completion message
      await client.chat.postMessage({
        channel: event.item.channel,
        thread_ts: session.wellnessMessageTs || event.item.ts,
        text: `✅ *WARP COMPLETE*\n\n${wellness.completion}\n\n_The incentives spur achievement._\n*Praise Kier.*${kierMessage}`
      });
      
      // Update status if melon bar
      if (wellness.statusUpdate && session.wellnessType === 'watermelon') {
        try {
          await client.users.profile.set({
            user: session.userId,
            profile: {
              status_text: "At the Melon Bar",
              status_emoji: ":watermelon:",
              status_expiration: Math.floor(Date.now() / 1000) + 3600 // 1 hour
            }
          });
        } catch (err) {
          console.log('Could not update user status');
        }
      }
      
      // Clean up session
      activeSessions.delete(sessionKey);
      console.log('WARP protocol completed');
    }
    
  } catch (error) {
    console.error('Error handling reaction:', error);
  }
});

// Health check endpoint
receiver.router.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    message: 'The work is mysterious and important',
    sessions: activeSessions.size,
    processed: processedIncidents.size
  });
});

// Poll incident.io every 2 minutes
setInterval(checkForResolvedIncidents, 2 * 60 * 1000);

// Initial check after 10 seconds
setTimeout(checkForResolvedIncidents, 10000);

// Start the app
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡️ WARP (Wellness After Resolution Protocol) is running on port ${port}`);
  console.log('The work is mysterious and important. Praise Kier.');
  console.log(`Checking incident.io every 2 minutes, WARP delay: ${WARP_DELAY_MINUTES} minutes`);
})();
