### Project Concept — Quick-Meet Companion App

---

### Problem

Many people want to do small, enjoyable activities (coffee, short walk, quick meal), but hesitate because they don’t want to go alone. Existing social platforms focus on large events or friendships rather than spontaneous micro-plans. Loneliness isn’t always chronic — sometimes it’s momentary hesitation.

---

### Target Users

Individuals with social anxiety who prefer low-pressure meetups.

---

### Solution

An app that enables instant activity companionship.

---

### Core Features

* Smart matching with nearby people who want the same activity now
  *(filters: gender, location, personality trait (MBTI), age)*
* Ability to host quick meetups (e.g., “Coffee in 15 min?”)

**Safety Layer**

* Verified profiles
* Location check-ins
* Safety push notifications

---

### Unique Value Proposition

* Focus on micro-socializing instead of friendships or dating
* Matches based on activity + time
* Built-in safety monitoring increases trust when meeting strangers

---

### How It Works

1. User selects activity + time window
2. AI suggests nearby matches with the same intent
3. Users accept match → temporary chat opens
4. App monitors check-in/out for safety

**Commitment Mechanism**
Upon sign-up, users deposit $5 to reduce last-minute cancellations or ghosting.

---

### Impact

* Reduces everyday loneliness
* Encourages people to go out more
* Builds real-world social confidence
* Helps newcomers integrate into communities

---

### Why Now

* Rising remote lifestyles
* Increasing reports of social isolation
* People want real-life interaction but safer, easier ways to start

---

### Future Expansion

* Group micro-events
* Partnerships with cafés/venues
* Rewards for frequent participation

---

### Revenue Streams


* For Spark Tier, it is free of charge with bare minimum features and has a limit of 10 activity searches per week. 

* For Radiance Tier, it is priced at $5 per month. You now have 30 searches per week, a verified profile badge, real time translation, and the ability to see who waved at you. 

* For the highest tier of Lumina, it is priced at $10 per month. You now have unlimited searches and access to all features. 

---

### Hackathon Context

This app was created during the **NTU Women In Tech Beyond Binary 2026 Hackathon**. Its purpose is to foster social cohesion.

---

### Run Locally

**Prerequisites:** Node.js

1. Install dependencies

   ```
   npm install
   ```
2. Set your Gemini API key in `.env.local`

   ```
   GEMINI_API_KEY=your_key_here
   ```
3. Run the app

   ```
   npm run dev
   ```
