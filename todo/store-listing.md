# Store listing content (draft)

Copy and form answers for the App Store and Google Play listings
([mobile-plan.md](mobile-plan.md) Phase 5, [app-store-ios.md](app-store-ios.md)
§5). Character counts are checked against each store's limit. Edit freely;
the facts (station count, guess count, data collection) are taken from the code
and About page as of 2026-11-09.

---

## Shared text

**App name** (App Store ≤30, Play ≤30): `GeoHearo`

**Subtitle** (App Store only, ≤30): `Guess the country by radio` (26)

**Play short description** (≤80):
`Listen to live radio from a mystery country and guess where it is on the map.`
(77)

**Promotional text** (App Store only, ≤170, editable without review):

> A new mystery country goes on the air every day. Tune in to its live radio
> stations, guess on the map, and see how close you got.

(129)

**Description** (App Store ≤4000, Play full description ≤4000):

> GeoHearo is a daily geography game you play with your ears.
>
> Every day a new mystery country goes on the air. You get five live radio
> stations broadcasting from it right now: news, talk, music, ads, whatever is
> playing. Listen, pick a country on the map, and see how close you are. Each
> wrong guess is colored from hot to cold by the border-to-border distance to
> the answer. You have five guesses.
>
> • A new daily challenge every day, the same country for every player
> • Free Play for as many extra rounds as you like
> • Over 36,000 stations from 143 countries
> • Distance hints in kilometers or miles
> • Daily stats: see how everyone else did
> • Share your score grid without spoilers
> • Optional reminder when the next daily challenge goes live
> • Country facts and photos after each round
>
> No accounts and no ads. GeoHearo is a free, open-source passion project.
>
> The radio streams are live third-party broadcasts listed in public
> directories such as Radio.Garden. GeoHearo plays them as broadcast and does
> not record or redistribute them.

**Keywords** (App Store only, ≤100, comma-separated, no spaces, no app name):
`geography,radio,quiz,countries,world,map,daily,puzzle,trivia,stations,guess,globe,travel,listening`
(98)

**Category**

- App Store: primary **Games**, subcategories **Trivia** and **Educational**;
  secondary category **Education** (optional).
- Play: app type **Game**, category **Trivia**. Tags: Geography, Trivia,
  Quiz (pick from Play's list).

**URLs**

- Support: `https://geohearo.com/about`
- Marketing / website: `https://geohearo.com`
- Privacy policy: `https://geohearo.com/privacy`
- Contact email: `bronco-eaten-bash@duck.com`

**Copyright** (App Store): `2026 Dustin Michels`

---

## Graphics

| Asset                       | Store     | Size                              | Status                                                                                 |
| --------------------------- | --------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| App icon                    | App Store | 1024×1024, no alpha               | In the Xcode asset catalog (Phase 4)                                                   |
| Phone screenshots, 6.9"     | App Store | 1320×2868 portrait, 1–10          | `store/screenshots/ios-6.9/` (see below)                                               |
| Hi-res icon                 | Play      | 512×512, 32-bit PNG               | `store/play-icon-512.png` (from `frontend/assets/icon-only.png`)                       |
| Feature graphic             | Play      | 1024×500 JPEG/PNG, no alpha       | `store/feature-graphic.png`                                                            |
| Phone screenshots           | Play      | 2–8, ≤2:1 (9:16 recommended), no alpha | `store/screenshots/android-phone/` (7 shots, 1080×1920, 24-bit PNG; emulator, 9:41 status bar) |

---

## Age rating

**App Store questionnaire.** Nothing in the app itself is mature; the risk
is the live radio. A station can air anything its broadcaster airs (lyrics,
talk radio, ads), and nobody moderates it.

- Profanity or crude humor: **Infrequent/Mild** (song lyrics, talk radio).
- Mature or suggestive themes: **Infrequent/Mild**.
- Everything else (violence, horror, gambling, contests, drugs, alcohol,
  sexual content, medical): **None**.
- Unrestricted web access: **No** (external links open in Safari, outside
  the app).
- User-generated content, messaging, chat: **No**.
- Advertising: **No**. In-app purchases: **No**. Parental controls / age
  assurance: **No**.

Expected result: 9+ or 13+. Answering "None" for the first two would be
unsafe if a reviewer lands on a station with explicit lyrics.

**Play (IARC questionnaire).** Category: **Game** (or "All other app
types" if the form treats it as reference/education). Same answers as above:
no violence, sexual content, gambling or purchases; users cannot interact or
share content with each other; no location sharing. Mention that audio is
live third-party radio where the form allows a note.

---

## Privacy answers

What the app sends, from the code:

| Data                                                     | Where                                              | Linked to a person | Purpose   |
| -------------------------------------------------------- | -------------------------------------------------- | ------------------ | --------- |
| Page views + `platform` (`ios`/`android`)                | Plausible (`main.ts`)                              | No: no cookies/IDs | Analytics |
| Daily challenge date, guess count (`increment_daily_stats`) | Supabase daily stats                            | No                 | Analytics |
| Game history, settings, reminder on/off                  | On the device only (`localStorage` + Preferences)  | n/a, not collected | —         |
| IP address (network-level, to stream/tile/font servers)  | Radio stations, ArcGIS tiles, Google Fonts         | Not by GeoHearo    | —         |

### App Store "App Privacy"

- Data collected: **Usage Data → Product Interaction**. Not linked to the
  user's identity. Not used for tracking. Purpose: **Analytics**.
- Everything else: not collected.
- Tracking: **No**. Matches `PrivacyInfo.xcprivacy`.

### Play "Data safety"

- Does the app collect or share any required user data types? **Yes**.
- Is all collected data encrypted in transit? **Yes** (HTTPS only).
- Way for users to request deletion: **No**. Nothing is tied to a person; a
  short note: "No accounts. Usage data is anonymous and cannot be linked to a
  user."
- Data types: **App activity → App interactions**: collected, **not
  shared** (Plausible and Supabase are service providers acting for the
  developer, which Play does not count as sharing), not processed ephemerally,
  collection is **required** (no opt-out in the app), purpose **Analytics**.
- No location, personal info, financial info, contacts, photos, audio files,
  device IDs, crash logs.

### Play "App content" (other declarations)

- Privacy policy: `https://geohearo.com/privacy`.
- Ads: **No ads**.
- App access: **All functionality is available without special access** (no
  login).
- Target audience: **13 and over** (not designed for children; live radio is
  unmoderated). Selecting under-13 brings in the Families policy.
- News app: **No**. Government app: **No**. Health / financial features:
  **None**.
- Notifications: the app asks for `POST_NOTIFICATIONS` at runtime (Android
  13+) only after the first completed daily.

---

## Review notes

App Store: see app-store-ios.md §8. Play has no review notes field for
production; the "App access" answer above covers it.
