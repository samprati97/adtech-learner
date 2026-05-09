import React, { useState, useEffect, useRef } from "react";

// ── STORAGE ───────────────────────────────────────────────────────────────────
const store = {
  async get(k) { return localStorage.getItem(k); },
  async set(k, v) { localStorage.setItem(k, v); }
};

// ── TOPICS ────────────────────────────────────────────────────────────────────
const TOPICS = [
  { id: "undertone",          cat: "adtech", label: "How Undertone Works",         icon: "🎯", time: "25 min" },
  { id: "undertone_products", cat: "adtech", label: "Undertone Ad Products",        icon: "🎨", time: "20 min" },
  { id: "undertone_delivery", cat: "adtech", label: "Delivery Troubleshooting",     icon: "🔧", time: "25 min" },
  { id: "prog_ecosystem",     cat: "adtech", label: "Programmatic Ecosystem",       icon: "📡", time: "20 min" },
  { id: "rtb_hb",             cat: "adtech", label: "RTB & Header Bidding",         icon: "⚡", time: "25 min" },
  { id: "privacy_meas",       cat: "adtech", label: "Privacy & Measurement",        icon: "🔐", time: "20 min" },
  { id: "docker",             cat: "devops", label: "Docker",                       icon: "🐳", time: "20 min" },
  { id: "kubernetes",         cat: "devops", label: "Kubernetes",                   icon: "☸️",  time: "30 min" },
  { id: "linux_shell",        cat: "devops", label: "Linux & Shell",                icon: "🖥️",  time: "20 min" },
  { id: "cicd",               cat: "devops", label: "CI/CD",                        icon: "🔄", time: "15 min" },
  { id: "terraform",          cat: "devops", label: "Terraform",                    icon: "🏗️",  time: "20 min" },
  { id: "aws",                cat: "devops", label: "AWS Essentials",               icon: "☁️",  time: "25 min" },
];

// ── STUDY CONTENT ─────────────────────────────────────────────────────────────
const CONTENT = {
  undertone: {
    summary: "Undertone (a Perion company) is primarily a demand-led ad network with both DSP and SSP capabilities. It connects premium publishers to advertisers via direct campaigns, programmatic deals, and header bidding — using RAMP as its ad server and relying on SSP partners (OpenX, Magnite, PubMatic) to bridge to external DSPs.",
    sections: [
      { type: "concepts", title: "What Undertone is — the dual structure", items: [
        "Demand Side (Advertiser): Advertiser → IO → Line Item (LI) → Ad Product → Creative (e.g. Sparkflow tag) → Banner in RAMP backend. WF (Workflow) links creative to campaign, generating a banner. The RAMP server cares only about the banner; zoneId, bannerId, campaignId are all banner properties.",
        "Supply Side (Publisher): Publishers/Accounts → Zones. A zone is associated with a specific ad unit (e.g. 300×250 Pagegrabber). Publisher interaction can be via Dynamic Tag, Zone Tag, or Header Bidding tag — all translate server-side into a zone request.",
        "RampLift (UAS Lift): Fetches all eligible banners from server cache for a given zone (same ad unit). Then filters them by domain, viewability, device, geo, audience targeting etc. E.g. 100 banners fetched → 10 eligible after filtering.",
        "Optimizer: Takes those 10 eligible banners and assigns each a score (1–10 style) based on its decision logic. The highest-scored banner is selected for delivery. Before optimizer, ads were served randomly.",
        "RAMP: Undertone's proprietary ad server. All campaign trafficking, creative linking, zone management, and delivery decisions happen here.",
        "Undertone is NOT directly integrated with any DSP. All DSP connections are indirect — routed through SSP partners (OpenX, Magnite, PubMatic). The SSP acts as the mediator."
      ]},
      { type: "flow", title: "Full programmatic request flow (step by step)", steps: [
        "Publisher zone fires (HB / Dynamic / Zone tag)", "RampLift fetches eligible banners for that zone + ad unit", "Targeting filters applied (domain, geo, device, audience, viewability)", "Optimizer scores remaining eligible banners", "Programmatic banner selected → RAMP calls linked SSP (e.g. OpenX)", "SSP fans out bid request to all connected DSPs with the Deal ID", "DSPs evaluate & bid (or pass). SSP filters responses, runs auction", "SSP returns single winning bid back to RAMP", "Optimizer compares programmatic bid vs direct campaigns", "Winning ad returned to publisher → creative rendered"
      ]},
      { type: "table", title: "How a deal flows — key entities", headers: ["Entity", "Role", "Where it lives"], rows: [
        ["Deal ID", "Foreign key linking Undertone ↔ DSP via SSP. Set identically in WF (Undertone) and DSP platform", "Workflow + DSP campaign settings"],
        ["SSP", "Mediator between RAMP and DSP. Undertone sends bid request to SSP; SSP fans out to DSPs, runs auction, returns winner", "OpenX / Magnite / PubMatic"],
        ["DSP", "Client-side platform. Client sets targeting, budget, creative. Responds to SSP bid requests with a price", "TTD, DV360, Amazon, Basis, etc."],
        ["Banner", "Core unit RAMP tracks. Created when a creative is linked to a campaign in WF. Carries all targeting metadata", "RAMP backend"],
        ["Zone", "Publisher ad slot. Associated with one ad unit type. All request types (HB, dynamic, zone tag) resolve to a zone request", "Publisher / RAMP"],
        ["WF (Workflow)", "Undertone's campaign management UI. A deal appears in WF as a campaign — SSP + DSP combination", "Internal tool"]
      ]},
      { type: "concepts", title: "Demand types — Reserved vs Unreserved", items: [
        "Reserved: Campaign is guaranteed. Client traffics via DSP but UT does all the targeting and sends relevant traffic. DSP responds to EVERY ad call with a bid. Behaves like a direct campaign but delivery is via programmatic pipe.",
        "Unreserved: UT sends a request, DSP may or may not buy. DSP sets its own filters on their end. No guarantee of response. UT doesn't control DSP-side targeting decisions.",
        "Always On (AO): Unreserved open auction. Constant availability to programmatic buyers. Deal ID stays active indefinitely. Used for always-available Undertone inventory.",
        "Private Auction (PA): Invite-only auction with a floor price. Select DSPs invited via Deal ID. Still competitive — multiple buyers bid.",
        "Preferred Deal (PD): Non-auction. One buyer, one price. DSP has first right of refusal at negotiated fixed CPM before open auction.",
        "Programmatic Guaranteed (PG): Fixed volume + fixed CPM. Like a direct IO but executed programmatically. DSP responds to every request. Supported by TTD, DV360, Amazon, Basis, Yahoo DSP, Amobee, Adobe, Viant. NOT supported by Beeswax. DeepIntent PG = Magnite only."
      ]},
      { type: "table", title: "SSP partners — when to use which", headers: ["SSP", "Fee", "Default for", "Exceptions"], rows: [
        ["OpenX", "6% (lowest)", "Most deals — preferred default", "Not for Basis/Centro (direct integration); not for Amazon DSP"],
        ["PubMatic", "7%", "Amazon DSP deals; CTV when buyer avoids OpenX", "Second choice for most non-Amazon deals"],
        ["Magnite (DV+)", "9% (highest)", "When buyer specifically requests non-OpenX, non-Basis; DeepIntent PG deals", "CTV = use PubMatic instead of Magnite"],
        ["Undertone (direct)", "0%", "Basis/Centro DSP buyers only — UT acts as the SSP in this case", "Only Basis. OpenX/Magnite/PubMatic cannot be used with Basis"]
      ]},
      { type: "table", title: "DSP ecosystem — who's active and what they support", headers: ["DSP", "AO/PA/PD", "PG", "Notes"], rows: [
        ["The Trade Desk (TTD)", "PMP", "✓ PG", "Most used. No in-app inventory from resellers like UT"],
        ["DV360 (Google)", "PMP", "✓ PG", "No in-app from resellers"],
        ["Amazon DSP", "PMP", "✓ PG", "Use PubMatic as SSP. No in-app from UT"],
        ["Basis / Centro", "PMP", "✓ PG", "Direct integration — UT is the SSP. No in-app inventory"],
        ["Yahoo DSP", "PMP", "✓ PG", "Standard PMP + PG"],
        ["Amobee / Nexxen", "PMP", "✓ PG", "Standard"],
        ["Adobe", "PMP", "✓ PG", "Standard"],
        ["Viant (Adelphic)", "PMP", "✓ PG (except CTV)", "CTV not supported for PG"],
        ["Beeswax", "PMP", "✗ No PG", "PMP only — no PG capability"],
        ["DataXu / OneView", "PMP", "✗ No PG", "PMP only"],
        ["DeepIntent", "PMP", "✓ PG (Magnite SSP only)", "Healthcare DSP. PG requires Magnite, not OpenX"],
        ["PulsePoint", "PMP", "✓ PG", "Healthcare + pharma targeting"],
        ["AppNexus / Xandr", "—", "—", "No longer operating as a DSP as of May 2025"]
      ]},
      { type: "concepts", title: "Publisher tag types — how requests reach RAMP", items: [
        "Dynamic Tag: UT's standard tag. Publisher drops it on their page. Fires on page load, resolves to a zone request. Most common delivery method.",
        "Zone Tag: Direct zone-specific tag. Tied to one specific zone/ad unit. Less flexible than dynamic tag but more precise.",
        "Header Bidding (HB) tag: Publisher runs Prebid.js or similar. UT competes in real-time auction with other buyers before publisher's ad server is called. UT returns ad tag + price — not a guaranteed win. If UT wins the publisher-side auction, the Sparkflow tag is rendered.",
        "All three tag types translate server-side into the same zone request format. RAMP treats them identically from the decision engine perspective."
      ]},
      { type: "concepts", title: "Multi-deal calls — how RAMP sends to SSP", items: [
        "RAMP doesn't send one deal at a time. For a given zone request, if multiple programmatic banners are eligible (all unreserved deals on the same SSP), RAMP calls them as an array in one request to the SSP.",
        "Example: 3 eligible unreserved banners all linked to OpenX → RAMP sends all 3 Deal IDs to OpenX in one call.",
        "OpenX fans out to all connected DSPs that have those Deal IDs configured. Gets bid responses, filters, runs its own auction, returns the single best bid.",
        "RAMP then compares that winning programmatic bid against direct campaign banners. Direct doesn't go through SSP — it's scored directly by Optimizer.",
        "The highest-scoring item (programmatic or direct) wins and is served to the publisher."
      ]},
      { type: "tip", title: "The HB difference — why it's not a guaranteed win", content: "For Header Bidding, RAMP returns an ad tag + price to the publisher's page. But the publisher's Prebid.js wrapper is also running bids from ALL its other SSP partners simultaneously. If a competitor bids higher than UT's returned price, the competitor wins — UT's Sparkflow tag never renders. This is fundamentally different from a zone tag or dynamic tag where UT has already won (no external competition)." },
      { type: "tip", title: "Interview framing — how to explain your day-to-day", content: "When asked 'what did you do at Undertone?': You monitored the full stack — from publisher zone request firing, through RampLift's eligibility engine, Optimizer's scoring, SSP bid request/response cycles, DSP win/loss signals, to creative rendering. You used Kibana logs to trace individual bid request flows, Athena/SQL to query delivery discrepancies, and understood exactly which SSP+DSP combination a given deal was routed through based on the DSP Tracker rules. That breadth across both supply and demand sides is rare." },
      { type: "table", title: "Key systems and tools at Undertone", headers: ["System", "What it does", "You used it for"], rows: [
        ["RAMP", "Undertone's proprietary ad server. Campaign trafficking, zone management, banner/creative linking, delivery decisions", "Setting up campaigns, verifying delivery, debugging banner mismatches"],
        ["Workflow (WF)", "Campaign management UI. IO → LI → Ad Product → Creative → Banner. Deals appear as campaigns.", "Trafficking, deal setup, creative QA"],
        ["RampLift (UAS Lift)", "Fetches and filters eligible banners for each zone request. Applies domain, geo, device, audience targeting", "Debugging targeting discrepancies — why a banner wasn't eligible"],
        ["Optimizer", "Scores eligible banners 1–10, selects highest. Replaced random selection.", "Understanding why specific banner won over others"],
        ["Kibana", "Log search and visualization. Traces individual bid request → response cycles, SSP calls, win/loss events", "Debugging delivery issues, tracing campaign pacing problems"],
        ["Athena / SQL", "Querying S3-backed data (impressions, bid data, reporting). AWS us-east-1", "Investigating discrepancies, fraud analysis, custom reporting"],
        ["Sparkflow (SF)", "UT's proprietary creative rendering framework. Tags are SF tags. Publishers render these when UT wins.", "Creative QA, tracking pixel verification, rendering issues"]
      ]}
    ]
  },
  undertone_products: {
    summary: "Undertone's ad formats are its core differentiator — high-impact, interactive units that go far beyond standard banners. Understanding each format, its SafeFrame requirements, creative specs, and SSP/DSP compatibility is essential for QA, trafficking, and client-facing conversations.",
    sections: [
      { type: "concepts", title: "Why SafeFrames must be DISABLED for high-impact units", items: [
        "Undertone's high-impact formats are NOT standard image-serving units. They must break out of their container to resize and reposition themselves on the page.",
        "SafeFrames (cross-domain iframes) restrict content from accessing elements outside the ad slot. If enabled, Undertone units will fail to render correctly.",
        "Brand Reveal example: needs to resize the ad slot height and fit the creative to the page width — impossible inside a SafeFrame.",
        "Rule: HIGH-IMPACT formats → SafeFrames DISABLED. Standard units (300x250, 728x90, etc.) → SafeFrames CAN be enabled.",
        "This is the #1 creative QA checklist item — always verify SafeFrame setting before launch."
      ]},
      { type: "table", title: "Page Grabber — flagship format (6 trigger types)", headers: ["Trigger", "How it fires", "Device"], rows: [
        ["Prestitial", "Loads with the article. Prominent X button (3x industry standard). Cross-screen.", "Desktop + Mobile"],
        ["Mini", "Like Prestitial but smaller. Blurs background so user knows they're still on-page.", "Cross-screen"],
        ["Exit", "Desktop: user moves mouse toward address/bookmark/close bar. Mobile: back button.", "Cross-screen"],
        ["Tab", "Fires when user toggles between browser tabs and returns to original tab.", "Cross-screen"],
        ["True Interstitial", "Fires when user clicks an internal link to another page on the same site.", "Cross-screen"],
        ["Idle", "Fires after user is completely inactive for 30+ seconds.", "Cross-screen"]
      ]},
      { type: "table", title: "Adhesion formats — sticky footer units", headers: ["Format", "Description", "Device", "Key spec"], rows: [
        ["Bottom Adhesion", "Standard sticky footer at bottom of page", "Cross-screen", "Max height 100px on mobile"],
        ["Expandable Adhesion", "Auto-expands on load (teaser: 320x200 / ~30% screen), collapses to 50px if no interaction in 5s, expands full-screen on tap", "Mobile only", "3 states: Teaser → Collapsed → Expanded. Cannot cap max expanded height."],
        ["Video Adhesion", "Auto-play 5–15s video. Click to enable sound. Operates like Expandable.", "Mobile only", "VAST tag. Auto-play sound OFF."]
      ]},
      { type: "table", title: "Inline & video formats", headers: ["Format", "Description", "Notes"], rows: [
        ["Brand Reveal", "Interscroller — as user scrolls past the slot, creative is revealed (parallax effect). Inline format.", "Cross-screen. Needs SafeFrames disabled. Max height cappable at 415px (Short BR)."],
        ["Brand Scroller", "Horizontal scroll variant of Brand Reveal. Creative scrolls laterally.", "CTR benchmarks: 0.01–0.02% is normal (low CTR expected by design)."],
        ["Inline Video", "Auto-play click-for-sound video in article slot.", "Cross-screen. Generally runs via header bidding only."],
        ["Pre-roll (In-Stream)", "Standard pre-roll video. VAST tag.", "Cross-screen. Skippable if 30s+."],
        ["Video Adhesion", "Auto-play video in adhesion slot.", "Mobile only. VAST."]
      ]},
      { type: "concepts", title: "Standard units — when they apply", items: [
        "300x250, 320x50, 728x90, 970x250 (Billboard), 300x600, 160x600 — standard IAB sizes.",
        "Used for Cross Screen Blend, Enhanced Standard Banner, Billboard products.",
        "SafeFrames CAN be enabled (unlike high-impact).",
        "Supported across all DSPs (including ones that don't support high-impact, like DV360 which is N/A for most Undertone high-impact formats).",
        "Lower CPM but higher scale and DSP compatibility."
      ]},
      { type: "table", title: "Ad product → RAMP creative size mapping (key ones)", headers: ["Ad Product", "Creative size / tag type", "Environment"], rows: [
        ["Page Grabber (Cross-Screen, Desktop, Mobile)", "768x1024", "Web"],
        ["Expandable / Bottom Adhesion / Brand Burst", "320x200", "Mobile"],
        ["Brand Reveal / Mini Brand Reveal / Brand Scroller", "600x600", "Web + Mobile"],
        ["Pre-roll / Video Adhesion / Inline Video / CTV", "VAST tag", "Web + CTV"],
        ["Enhanced Standard Banner", "300x250", "Web"],
        ["Brand Reveal 300x600", "300x600", "Mobile (programmatic only)"],
        ["Billboard", "970x250", "Desktop"],
        ["Cross Screen Blend", "300x250, 320x50, 728x90, 160x600", "Cross-screen"]
      ]},
      { type: "tip", title: "AdOnSite — previewing creatives before launch", content: "AdOnSite (apps-v2.sparkflow.net) is the Sparkflow live ad preview tool. Use it to preview Page Grabber, Bottom Adhesion, and Brand Reveal in a real page context before trafficking. URL format: ?id=PLACEMENT_ID&type=sparkflow&url=TARGET_DOMAIN. This is the fastest way to catch rendering issues before a campaign goes live." },
      { type: "tip", title: "Interview framing — format knowledge as a differentiator", content: "Most DevOps candidates interviewing at AdTech companies have zero knowledge of high-impact ad formats. You can explain exactly why SafeFrames break Brand Reveal rendering, the difference between a Prestitial and Idle trigger, and how VAST tags flow for CTV. This depth — from someone also learning K8s and Terraform — is genuinely rare. Lead with it." }
    ]
  },

  undertone_delivery: {
    summary: "Delivery troubleshooting is the core of CSOP's day-to-day. These are the 7 most common issue patterns from real CSOP tickets — with the exact symptoms, how to confirm, and the specific steps that actually resolved them. This is real institutional knowledge.",
    sections: [
      { type: "concepts", title: "The 7 most common CSOP delivery issues (sorted by frequency)", items: [
        "1. First-party / behavioral segments inactive or stale → zero/low delivery on 1P-targeted lines",
        "2. Publisher ad unit capping or supply-side throttles → lines plateau early each day, can't hit NDQ",
        "3. Targeting applied at wrong level (banner vs campaign) → creative serves outside intended schedule",
        "4. Low avails / response-rate constraints (strict geo or domain lists; DSP/SSP throttles)",
        "5. KPI filters or optimization models constraining volume (e.g. VCR filter, fixed bid model)",
        "6. Creative / tag configuration issues blocking delivery (missing creatives, unsupported trackers)",
        "7. Product-specific performance expectations (e.g. low CTR on Brand Scroller is normal by design)"
      ]},
      { type: "table", title: "Issue 1 — 1P/behavioral segment stale or inactive", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["1P or behavioral line shows zero/low impressions. Can't hit NDQ even with relaxed pacing.", "Check Profile Manager: is profile active? Check latest feed date and device counts vs. line start date. If feed pre-dates launch, segments are stale.", "1. Verify profile is active and linked to correct targeting channel. 2. Check latest feed date + device counts per device_id_type. 3. Manually reprocess segments. 4. If feed too small, ask Ellie for alternative segments. 5. Monitor next-day delivery for NDQ recovery."]
      ]},
      { type: "table", title: "Issue 2 — Publisher ad unit capping throttling scale", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["Lines plateau early each day. High request volume but still under-delivers. Delivery spikes when cap is overridden.", "Check filtering reasons at campaign-adunit level. Look for PUBLISHER_AD_UNIT_IMPRESSIONS in filter reasons. Early-day plateau pattern confirms supply cap.", "1. Enable Override Supply Capping on the affected line item. 2. Query: SELECT * FROM publisher_adunit_capping WHERE publisher_id IN (...). 3. Re-check hourly pacing post-change. 4. Validate NDQ recovery before closing ticket."]
      ]},
      { type: "table", title: "Issue 3 — Targeting at wrong level (banner vs campaign)", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["Creatives serve outside intended schedule (e.g. weekday targeting fires on weekends). Day/date targeting seems ignored.", "Found day/date targeting applied at creative level WITHOUT 'Manage limitation at Banner level' enabled on the campaign. Banner-level limitations inactive.", "1. Enable 'Manage limitation at the Banner level' setting on the campaign wherever creative-level limitations are used. 2. Bulk-update affected variations. 3. Prefer campaign-level targeting — only use banner-level when explicitly required and validated."]
      ]},
      { type: "table", title: "Issue 4 — Low avails / DSP/SSP throttles", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["High request count but responses/wins too low to hit NDQ. Tight geo, domain allowlist, or DSP-side constraints (e.g. TTD throttling).", "Compare requests vs responses vs wins funnel. Check avails by segment/product/geo. Verify SSP/DSP logs — TTD in particular throttles certain publishers.", "1. Quantify daily avails and win-rate to show feasibility. 2. Share with account team to consider scope adjustments (geo radius, domain list breadth). 3. Request DSP-side check when responses drop. 4. For deal lines, validate seller caps and shift budget to better-scaled products if needed."]
      ]},
      { type: "table", title: "Issue 5 — KPI filters / optimization models constraining volume", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["Lines stall. VCR or viewability filters dominate filtering reasons. Fixed bid model producing weak win rates. NDQ not being hit.", "Check filtering reasons — if VCR filter dominates: that's the blocker. Check win-rate around model changes. Delivery rebounds after relaxing.", "1. Temporarily remove or relax KPI filters (e.g. VCR) when they dominate filtering and NDQ isn't met. 2. Switch bid model from 'fixed formula' to 'no-optimization' to increase responsiveness. 3. Re-enable KPI strictness gradually once delivery is on track."]
      ]},
      { type: "table", title: "Issue 6 — Creative / tag configuration blocking delivery", headers: ["Symptom", "How to confirm", "Resolution"], rows: [
        ["Line live but shows zero impressions. Creative preview fails or shows demo ad only. VAST tags rejected by premium publishers.", "Attempt creative preview in Sparkflow. Check host/vendor allowlist (e.g. NBCU blocks ads.sparkflow.net trackers). Look for wrong targeting channel on creative.", "1. Ensure correct creatives attached and parseable. 2. If host/vendor not permitted by publisher (e.g. NBCU), advise client to host creative in DSP directly and apply DV verification in-DSP. 3. Remove any unintended banner-level targeting that's suppressing serving."]
      ]},
      { type: "concepts", title: "Issue 7 — When 'low performance' is actually expected behaviour", items: [
        "Brand Scroller CTR: 0.01–0.02% is within normal range. Low CTR is by design because of the non-clickable area around the close button.",
        "Bottom Adhesion: lower CTR than Prestitial because the unit is collapsed most of the time.",
        "For these cases: document expected CTR ranges for the product and share with account team. Offer creative or product alternatives only if CTR is the primary campaign KPI.",
        "Never just escalate 'low CTR' without checking product-specific benchmarks first."
      ]},
      { type: "table", title: "Quick-reference: symptom → fix", headers: ["Symptom", "Likely cause", "First action"], rows: [
        ["1P/behavioral line: zero impressions", "Stale feed or inactive profile", "Check Profile Manager → reprocess segments"],
        ["Line plateaus early each day", "Publisher ad unit cap hit", "Enable Override Supply Capping"],
        ["Creative fires outside intended schedule", "Banner-level targeting not enabled at campaign level", "Enable 'Manage limitation at Banner level'"],
        ["High requests, low wins (geo/domain)", "Low avails or DSP throttle", "Run avails query, share with account team"],
        ["Line stalls despite good requests", "VCR/KPI filter or fixed bid model", "Relax KPI filter or switch to no-optimization"],
        ["Line live but zero impressions", "Missing/broken creative or blocked tracker", "Preview creative in Sparkflow, check vendor allowlist"],
        ["Client flags low CTR", "May be expected for the format", "Compare vs product benchmark before escalating"]
      ]},
      { type: "tip", title: "The debugging mindset — how to frame this in interviews", content: "When asked 'how did you handle delivery issues?' walk through this framework: (1) Understand the exact symptom from the ticket — zero delivery vs under-delivery vs wrong targeting. (2) Check the request → response → win funnel in Kibana. (3) Isolate to segment, creative, publisher, or targeting level. (4) Cross-reference with filtering reasons at campaign/adunit level. (5) Implement targeted fix (not a shotgun approach). (6) Monitor hourly post-fix before closing. This is exactly the CSOP SLA workflow, and you've done it on 30+ tickets a month." },
      { type: "tip", title: "NDQ — what it means and why it matters", content: "NDQ = Non-Delivery Query. It's the daily impression goal that a line item needs to hit to pace correctly across its flight. When CSOP says 'can't hit NDQ', it means the line is under-pacing relative to its flight goal. An NDQ miss two days running is a red flag — the line will under-deliver by end of flight unless fixed. Most delivery escalations are fundamentally NDQ recovery problems." }
    ]
  },

  prog_ecosystem: {
    summary: "Every AdTech interview opens with 'walk me through a programmatic impression.' This tests whether you understand the ecosystem as a system — not just definitions. Answer with timing, connect moving parts, and speak from real operational experience.",
    sections: [
      { type: "tip", title: "The question they always open with", content: "\"Walk me through exactly what happens from the moment a user lands on a webpage to when an ad appears.\" Weak answer: lists components. Strong answer traces the request with timing: page load → slot fires → SSP receives impression → bid request to exchanges/DSPs → bids collected → auction runs → winner's creative rendered — and explains who makes decisions at each step. Mention the 100ms total budget." },
      { type: "concepts", title: "How to answer 'DSP vs SSP' — the strong version", items: [
        "Don't just give definitions. Frame as two sides of the same transaction: DSP = buys impressions on behalf of advertisers (targeting, bidding, budgeting). SSP = sells impressions on behalf of publishers (yield optimization, floor prices, auction management).",
        "Follow-up they always ask: 'Can a company be both?' Yes — Undertone is a real example. DSP for direct campaigns, but IS the SSP for Basis/Centro buyers.",
        "Where does the ad exchange fit? The exchange is the marketplace in between — connects SSPs and DSPs. Some SSPs run their own exchange (Google AdX).",
        "DMP vs CDP trap: Most candidates stop at DMP. Strong answer: 'DMPs are cookie-based and declining. CDPs use first-party PII-linked profiles — the cookie-independent future.' This one line alone separates you."
      ]},
      { type: "table", title: "5 follow-up probes and what a strong answer covers", headers: ["They ask", "Strong answer covers", "Weak answer misses"], rows: [
        ["Why did waterfall fail?", "Sequential buyers — buyer #2 couldn't outbid buyer #1 who passed. Unified/header bidding fixes this with simultaneous competition.", "Says 'it was inefficient' without mechanics"],
        ["PMP vs PG?", "PMP = invite-only auction at negotiated floor via Deal ID. PG = guaranteed volume + fixed CPM. Completely different risk profiles.", "Conflates the two — common mistake"],
        ["What is a Deal ID?", "Foreign key linking the buyer (DSP) and seller (SSP) for a specific agreement. Must be configured identically on both sides.", "Says 'it's a number that identifies a deal'"],
        ["SSP's role in an auction?", "Receives publisher requests, fans out to DSPs, filters invalid bids, runs auction, returns winner — all in <100ms. The SSP IS the auctioneer.", "Says 'it connects publishers to advertisers'"],
        ["How does frequency capping work?", "DSP tracks cookie/device-ID impression counts per user per deal. When threshold hit, DSP no-bids that user. Publisher-side capping also exists at ad-unit level.", "Only mentions one side"]
      ]},
      { type: "tip", title: "The scenario for senior candidates", content: "\"A first-party audience segment isn't delivering. Creative is fine. What do you check?\" Strong: (1) Is segment active with fresh feed? (2) Properly linked to targeting channel? (3) Device count large enough to scale? (4) Are conflicting exclusions present? (5) Is DSP seeing audience signals in bid request? This is the exact Profile Manager → reprocess → monitor workflow from real CSOP tickets. You've done this." },
      { type: "tip", title: "What loses candidates", content: "Not being able to trace a request end-to-end despite claiming AdOps experience. Mixing up PMP and PG. Not mentioning cookie deprecation when asked about DMPs. Not knowing Undertone has no direct DSP connections — all indirect via SSPs." }
    ]
  },

  rtb_hb: {
    summary: "RTB and Header Bidding questions test whether you can explain auction mechanics at an engineering level. At PubMatic, InMobi, and The Trade Desk you'll face system design questions requiring you to understand latency budgets, bid shading, and architectural tradeoffs of client vs server-side HB.",
    sections: [
      { type: "tip", title: "The question that trips most candidates", content: "\"The industry moved from second-price to first-price auctions. What changed for DSPs, and what is bid shading?\" Most know the definition but can't explain the implication. Strong answer: In 2nd-price, DSPs bid their true value safely (pay only 2nd+$0.01). In 1st-price, bidding true value means overpaying. DSPs developed bid shading — an ML model that predicts clearing price and submits a bid between floor and max willingness-to-pay. Probe they follow with: 'Who benefits from bid shading, who loses?' — DSPs save margin, publishers get less than max possible." },
      { type: "concepts", title: "How to answer 'How does Header Bidding work and why was it invented?'", items: [
        "Start with the problem it solved: waterfall meant SSP #2 never bid even if they'd pay more than SSP #1. Google's GAM had unfair last-look advantage as the final auctioneer.",
        "Header Bidding: publisher's page runs a JS wrapper (Prebid.js) that simultaneously solicits bids from ALL SSPs before calling the publisher's ad server. Highest bid passes into GAM as a line item — GAM then decides if it beats direct campaigns.",
        "Client-side (Prebid.js): bids happen in user's browser. Pros: full cookie visibility, publisher transparency. Cons: adds 200–500ms to page load — real UX impact.",
        "Server-side (Prebid Server): bids sent from a server. Pros: no page latency, scales better. Cons: no browser cookie access, reduced targeting signals.",
        "The 'we won HB but ad didn't serve' scenario: winning HB doesn't guarantee delivery — there's still a publisher-side auction. The bid must also beat GAM direct campaigns. Sparkflow tag only renders if Undertone actually wins the full publisher decision."
      ]},
      { type: "table", title: "Client-side vs Server-side HB — the tradeoff interviewers probe", headers: ["Factor", "Client-side (Prebid.js)", "Server-side (Prebid Server)"], rows: [
        ["Page latency", "Adds 200–500ms per page load", "Near-zero page impact"],
        ["Cookie/ID access", "Full browser cookie access", "Limited — no direct browser access"],
        ["Transparency", "Publisher sees all bids, all SSPs", "Less transparent"],
        ["Scale", "Limited by browser JS", "Highly scalable, parallelises easily"],
        ["Best for", "Premium publishers wanting control", "High-scale publishers optimising for speed"]
      ]},
      { type: "tip", title: "The system design question at senior level", content: "\"Design a bidder handling 500K bid requests/second with <10ms response time.\" Strong answer: (1) Stateless bidder pods behind NLB — scales horizontally with HPA. (2) Redis cluster for budget pacing, frequency state — in-memory for speed. (3) Feature store for audience ML signals (low-latency lookup). (4) Async win/loss reporting via Kafka — never block the bid path. (5) Circuit breaker: if response time >8ms, return no-bid immediately rather than miss SLA. (6) Pre-warm for known high-traffic events. This is the architecture PubMatic and The Trade Desk run." },
      { type: "tip", title: "Common mistakes", content: "Saying 'header bidding always wins over direct campaigns' — it doesn't; GAM still auctions including direct. Not knowing VAST is XML for video (not all ad types). Confusing bid shading (buyer-side ML prediction) with price floors (publisher-set minimums). Saying 'first-price is better for publishers' — sometimes true, but bid shading partially cancels the publisher benefit." }
    ]
  },

  privacy_meas: {
    summary: "Privacy and measurement questions at senior AdTech roles test practical impact, not regulation recitation. Interviewers want to know how you'd adapt a campaign when cookies disappear, how you'd investigate a reporting discrepancy, and what the real alternatives look like.",
    sections: [
      { type: "tip", title: "The question they actually care about", content: "\"Your biggest client runs a retargeting campaign that drives 60% of their revenue. Third-party cookies are gone. What do you tell them?\" Wrong answer: 'We'll use contextual targeting.' Strong answer: (1) First-party data activation — get client to share hashed email/CRM list. (2) Clean room matching (AWS Clean Rooms, LiveRamp) to find publisher/advertiser overlap without PII exposure. (3) Universal IDs (UID2, RampID) where both sides collected email consent. (4) Contextual targeting as a complement — not a replacement. (5) Incrementality testing (holdout groups) to understand true retargeting lift vs organic conversion. The more you acknowledge the limits of each alternative, the more senior you sound." },
      { type: "table", title: "Reporting discrepancy — the scenario they always ask", headers: ["Scenario", "Most likely cause", "How to confirm + fix"], rows: [
        ["RAMP shows 1M impressions, DSP shows 700K", "Impression counting methodology — RAMP counts ad served, DSP counts rendered/viewable. 5-20% gap is normal. >20% = investigate.", "Check if creative loads fully in DSP environment. Escalate to SSP if consistent >20%."],
        ["RAMP shows 0 impressions, campaign 'Running'", "Creative not attached, SafeFrame enabled blocking high-impact unit, or Deal ID not matched by DSP.", "Preview creative in Sparkflow. Check DSP has Deal ID. Verify SafeFrame setting off for high-impact."],
        ["Clicks in RAMP but 0 conversions client-side", "Pixel not firing, attribution window mismatch, or last-click model missing view-through.", "Test pixel on a test conversion. Confirm UT click ID is passed. Check attribution window alignment."],
        ["DSP shows 40% higher CTR than RAMP", "DSP counting interaction clicks (expand, play) as clicks; RAMP counts only clickthrough.", "Align on click definition. UT uses one-click-per-impression method only."]
      ]},
      { type: "concepts", title: "How to explain GDPR/TCF without reciting regulations", items: [
        "Don't list rights and fines. Explain how it flows through AdTech: user sees cookie banner → CMP collects consent → generates TC String (base64, signed) → TC String attached to every bid request → DSPs/SSPs check it before processing user data.",
        "Key operational impact: Purpose 1 (store/access device info) must be consented to for most targeting. Without it, DSPs must serve non-targeted or no-bid.",
        "ITP/cookie follow-up: 'Safari already blocks third-party cookies. What happens to your campaign there?' Frequency capping breaks (can't track cross-site). Retargeting fails. ~30% of desktop traffic in UK/US.",
        "Strong answer on measurement: Incrementality testing (holdout groups — show no ad to 10% of users, compare conversion rates) is the gold standard for true causal measurement, independent of cookies or attribution models."
      ]},
      { type: "tip", title: "What separates strong from average candidates", content: "Average: 'We'll use contextual targeting.' Strong: 'Contextual handles brand awareness but not retargeting. For retargeting, we need clean room matching or UID2. For measurement, incrementality testing. For identity, first-party data collection — which most clients haven't done at scale yet. The real work is getting clients to start collecting and consenting first-party data NOW.' Specificity about limitations of each alternative signals seniority." }
    ]
  },

  docker: {
    summary: "Docker interviews test whether you can debug broken containers, explain layering decisions, and write production-quality Dockerfiles — not just know what Docker is. Expect scenario questions about image size, broken builds, and container networking.",
    sections: [
      { type: "tip", title: "The scenario they always open with", content: "\"Your Docker image went from 200MB to 2GB after a recent change. Walk me through how you'd find and fix it.\" Strong answer: (1) Run docker history myimage to see which layer added size. (2) Check for apt-get install without rm -rf /var/lib/apt/lists/* — package cache stays in the layer. (3) Check if source code or test data is being COPY'd unnecessarily — need a .dockerignore. (4) Check if it's a single-stage build that includes build tools not needed at runtime. Fix: multi-stage build. Common trap: adding RUN rm large-file in a later layer doesn't reduce image size — the file still exists in the earlier layer." },
      { type: "table", title: "Debugging scenarios — what they ask and the full answer", headers: ["Scenario", "Root cause", "Debug steps"], rows: [
        ["Container works locally, fails in production", "Missing env var, secret not mounted, different base image tag, or port binding conflict.", "docker inspect for env vars. Compare docker run flags. Check if 'latest' tag drifted. Verify network mode."],
        ["Container exits immediately on start", "App crashes on startup — wrong CMD, missing dependency, config file missing, or permission error.", "docker logs <container_id> immediately. If logs empty: docker run -it image bash to enter interactively."],
        ["Two containers can't communicate", "Not on the same Docker network, or using 'localhost' instead of service name.", "docker network inspect. Confirm both on same network. Use service name (not localhost) as hostname."],
        ["Image build slow every time", "COPY . . before pip install — code changes bust dependency cache every time.", "Reorder: COPY requirements.txt → RUN pip install → COPY . . so code changes don't re-run pip."]
      ]},
      { type: "code", title: "The layer caching gotcha — explain this cold in interviews", content: `# WRONG — code change re-runs pip install every time
FROM python:3.11-slim
COPY . .
RUN pip install -r requirements.txt

# RIGHT — dependencies cached separately from code
FROM python:3.11-slim
COPY requirements.txt .       # only changes when deps change
RUN pip install -r requirements.txt  # cached if requirements unchanged
COPY . .                      # code last — only this layer re-runs on code change

# Why this matters in interviews:
# 200-package pip install = ~3 minutes per build
# With correct ordering: code-only changes rebuild in <10 seconds
# Interviewers test this to see if you understand Docker at a real level` },
      { type: "tip", title: "The tradeoff question they ask", content: "\"When would you NOT use Docker?\" This is a gotcha — they want to see you don't blindly recommend containers. Strong answer: (1) GPU-heavy ML workloads where container overhead affects performance. (2) Applications requiring real-time kernel access. (3) Very simple single-script jobs where overhead outweighs benefit. (4) Legacy apps with complex licensing. The point is you understand Docker is a tool, not a religion." }
    ]
  },

  kubernetes: {
    summary: "K8s is the #1 DevOps interview topic at AdTech companies. They don't ask 'what is a pod' — they give you a broken cluster and ask how you'd fix it. You need to debug CrashLoopBackOff cold, explain HPA for traffic spikes, and walk through what happens under the hood when you kubectl apply.",
    sections: [
      { type: "tip", title: "The most common opening question", content: "\"Walk me through what happens when you run kubectl apply -f deployment.yaml.\" Strong answer: kubectl sends YAML to API Server → validates + stores in etcd → Controller Manager detects desired state ≠ actual → Scheduler assigns pods to nodes → kubelet on target node pulls image + starts container → readiness probe passes → pod added to Service endpoints → traffic routed. Weak answer: 'It deploys the app.' The interviewer wants to see you understand the control loop." },
      { type: "table", title: "Debugging scenarios — exact steps they want to hear", headers: ["Error state", "Most likely cause", "Exact commands"], rows: [
        ["CrashLoopBackOff", "App crashing on startup — missing env var, wrong config, startup command error, or application bug.", "kubectl logs <pod> --previous (to see crash logs). kubectl describe pod (check Events). kubectl exec if it stays up long enough."],
        ["OOMKilled", "Container exceeded memory limit. Limit too low or app has memory leak.", "kubectl describe pod → look for OOMKilled in Last State. Check limits: kubectl get pod -o yaml. Increase limit or fix leak."],
        ["Pending", "No node has enough resources, node affinity/taint blocking, or PVC not bound.", "kubectl describe pod → Events shows exact reason. kubectl describe nodes for available resources."],
        ["ImagePullBackOff", "Wrong image name/tag, registry auth missing, or registry unreachable.", "kubectl describe pod → check image name in spec. Verify imagePullSecrets. Try pulling manually from a node."],
        ["0/1 Ready", "Readiness probe failing — app started but not ready to serve. DB connection not established, warmup not complete.", "kubectl describe pod → readiness probe config. kubectl logs to see what app reports during startup."]
      ]},
      { type: "tip", title: "The AdTech scenario: Super Bowl traffic spike", content: "\"Your RTB bidder runs on K8s. The Super Bowl starts — traffic goes 10x in 2 minutes. What happens and how would you have prepared?\" Strong answer: (1) HPA with aggressive scale-up policy (30s evaluation window, no cool-down on scale-up). (2) Cluster Autoscaler provisions new nodes — but this takes 2-3 min, why PRE-WARMING matters. (3) PodDisruptionBudget ensures rolling updates don't take down too many pods simultaneously. (4) Pre-scheduled scaling: use a CronJob or manual kubectl scale 30 min before kickoff — HPA can't predict events. (5) Spot node pools pre-warmed for CTV spike." },
      { type: "concepts", title: "Tradeoff questions they ask about K8s objects", items: [
        "Deployment vs StatefulSet: Deployment = stateless, pods interchangeable, scale freely. StatefulSet = stable pod identity (pod-0, pod-1), own persistent storage. Never use Deployment for a database.",
        "ConfigMap vs Secret: Both inject config into pods. Secret is base64-encoded — NOT encrypted by default. For production encryption: Sealed Secrets or HashiCorp Vault. Never store plaintext passwords in ConfigMaps.",
        "HPA vs Cluster Autoscaler: HPA scales pods within existing nodes. CA adds nodes when no existing node fits pending pods. Both needed together.",
        "The gotcha: 'Is base64 encryption?' No — it's encoding, trivially reversible. K8s Secrets are not encrypted at rest by default. This trips ~60% of candidates."
      ]}
    ]
  },

  linux_shell: {
    summary: "Linux questions in DevOps interviews are almost always scenario-based. They give you a sick server and ask what you do. You need a systematic investigation playbook memorised — CPU, memory, disk, network, logs — in that order.",
    sections: [
      { type: "tip", title: "The investigation scenario they always ask", content: "\"A production server is responding slowly. Users are complaining. Walk me through exactly what you'd check.\" Strong answer (memorise this order): (1) uptime — check load average vs CPU count. Load > CPUs = overloaded. (2) top/htop — which process consuming CPU or memory? (3) free -h — is swap being used? Swap = memory pressure. (4) df -h — is disk full? Full disk causes bizarre failures. (5) iostat -x 1 — disk I/O saturated? (6) ss -tulnp — right services listening? Unexpected connections? (7) journalctl -p err -b — errors since last boot? Weak answer: immediately checks logs without checking resource state first." },
      { type: "table", title: "Scenario questions with exact commands", headers: ["They ask", "The right approach", "Command"], rows: [
        ["Disk is full. Find what's taking space.", "Systematic: root → largest directory → drill down", "du -sh /* 2>/dev/null | sort -rh | head — then drill into largest"],
        ["Port 8080 in use, find what's using it", "Check socket state with process info", "ss -tulnp | grep 8080 or lsof -i :8080"],
        ["Process hung, not responding to kill", "Graceful first, then force", "kill -15 <PID> → wait 5s → kill -9 <PID>. Check zombie: ps aux | grep Z"],
        ["Find files modified in the last hour", "find with mmin flag", "find /var/log -mmin -60 -type f"],
        ["CPU spike every day at 2am", "Something scheduled is running", "crontab -l and cat /etc/cron.d/* — check systemd timers: systemctl list-timers"]
      ]},
      { type: "code", title: "Shell scripting — the interview scenario they give you", content: `# Q: Write a script that monitors a service and restarts it if it dies.
# Tests: error handling, loops, logging, idempotency

#!/bin/bash
set -euo pipefail

SERVICE="nginx"
LOG="/var/log/monitor.log"
INTERVAL=30

log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $1" | tee -a "$LOG"; }

while true; do
  if ! systemctl is-active --quiet "$SERVICE"; then
    log "WARN: $SERVICE down. Attempting restart..."
    if systemctl restart "$SERVICE"; then
      log "OK: $SERVICE restarted"
    else
      log "ERROR: Restart failed — manual intervention needed"
    fi
  fi
  sleep "$INTERVAL"
done

# Probe questions interviewers follow with:
# "How prevent multiple instances?" → flock -n /tmp/monitor.lock
# "How alert on failure?" → add curl/mail in the error branch
# "What if service is intentionally stopped?" → check a disable flag file` },
      { type: "tip", title: "The gotcha: what does 2>&1 mean?", content: "Interviewers ask this to test genuine shell understanding. Answer: Redirect stderr (fd 2) to wherever stdout (fd 1) currently points. So command > file.log 2>&1 means both stdout and stderr go to file.log. Common trap: command 2>&1 > file.log is WRONG — 2>&1 runs before the redirect, sending stderr to terminal. Order matters and most candidates get this backwards." }
    ]
  },

  cicd: {
    summary: "CI/CD questions test whether you can design a pipeline that is fast, safe, and reliable — not just describe what CI/CD means. At AdTech companies where a bad bidder deploy means immediate revenue loss, deployment strategy is a serious technical topic.",
    sections: [
      { type: "tip", title: "The design question they ask", content: "\"Your CI pipeline takes 45 minutes. Engineers are complaining. How do you get it to 10?\" Weak: 'Use parallel jobs.' Strong: (1) Profile first — find which step takes longest. (2) Split tests: fast unit tests first, slow integration tests only on main. (3) Parallel matrix jobs for different test suites. (4) Cache aggressively: Docker layer caching with buildx, pip/npm keyed on lockfile hash. (5) Move expensive steps (security scans, E2E) to post-merge. (6) Fail fast: lint and unit tests before integration — don't run 10-min suite if basic syntax fails." },
      { type: "table", title: "Deployment strategies — when they ask 'which would you use?'", headers: ["Strategy", "How it works", "When to use", "Risk"], rows: [
        ["Rolling", "Replace pods one-by-one. K8s default.", "Low-risk, stateless services.", "Mixed versions serving traffic during rollout. Rollback is slow."],
        ["Blue/Green", "Two identical envs. Switch LB from blue→green instantly.", "Zero-downtime critical services needing instant rollback.", "2x infrastructure cost. DB migrations are tricky."],
        ["Canary", "Route 1–5% of traffic to new version. Expand gradually.", "High-risk deploys. Real user validation before full rollout.", "Requires good observability to detect issues at small %."],
        ["Feature flags", "Deploy code off, enable per-user or percentage.", "Long-lived feature development. Kill-switch for risky features.", "Complexity accumulates if flags aren't cleaned up."]
      ]},
      { type: "tip", title: "The AdTech-specific scenario", content: "\"You deploy a new bidder version and win rate drops from 45% to 8% within 2 minutes. What do you do?\" Strong answer — this order matters: (1) IMMEDIATELY roll back: kubectl rollout undo deployment/bidder. (2) Verify rollback restored win rate — Kibana/Datadog. (3) Lock the broken version from redeploy. (4) Only then investigate the diff. (5) Reproduce in staging with production traffic replay. (6) Write post-mortem. Interviewers want to see rollback is your FIRST action, not investigation — every minute at 8% win rate costs real revenue." },
      { type: "concepts", title: "Secrets in CI/CD — questions they always probe", items: [
        "Never hardcode secrets in Dockerfile, .env files committed to git, or pipeline YAML. Interviewers specifically ask 'how do you handle API keys in your pipeline?'",
        "GitHub Actions: use repository Secrets, access as the secrets context. They're masked in logs — never echo them.",
        "For K8s: Kubernetes Secrets are base64-encoded (NOT encrypted at rest by default). Production: Sealed Secrets (encrypted, safe to commit) or HashiCorp Vault with K8s auth.",
        "The trap they always ask about: 'I committed an API key to git then deleted the file.' The key is still in git history — requires git-filter-branch or BFG Repo Cleaner. Best prevention: pre-commit hooks or git-secrets scanning."
      ]}
    ]
  },

  terraform: {
    summary: "Terraform interviews go beyond knowing commands. Interviewers want to know what happens when things go wrong — state corruption, concurrent applies, drift — and how you'd architect IaC for a team managing multiple environments.",
    sections: [
      { type: "tip", title: "The scenario that trips most candidates", content: "\"Two engineers run terraform apply at the exact same time. What happens?\" Most say 'it might cause problems.' Strong answer is precise: Without remote state locking: both read the same state → both compute diffs → both apply → second write wins, but first apply's resources are orphaned from state (corruption). With S3 + DynamoDB locking: the second apply fails immediately with a lock error showing who holds it and since when. This is why local state is dangerous for any team." },
      { type: "table", title: "Commands they ask you to distinguish", headers: ["Command", "What it actually does", "Common mistake"], rows: [
        ["terraform plan", "Shows what WILL change without applying.", "Skipping plan and going straight to apply in production."],
        ["terraform apply", "Executes the plan, creates/modifies/destroys real infra.", "Not using -target in emergencies — applies everything vs targeted fix."],
        ["terraform import", "Brings existing real resource into state without recreating it.", "Importing doesn't write config — you still need to write the HCL resource block manually."],
        ["terraform state rm", "Removes resource from state WITHOUT destroying the real resource.", "Using this when you actually want to destroy — the real resource keeps running."],
        ["terraform taint (now -replace)", "Marks resource for recreation on next apply.", "Using this on stateful resources like databases — it will delete your data."]
      ]},
      { type: "tip", title: "The architecture question", content: "\"How would you manage dev/staging/prod environments in Terraform?\" Two valid answers — probe which tradeoffs you understand. (1) Workspaces: same config, separate state files per workspace. Simple but env-specific config (sizes, flags, backends) gets messy. (2) Directory structure: /dev /staging /prod each with own main.tf + tfvars + shared modules/. More duplication but independently isolated. Strong answer: 'Separate directories with shared modules/ folder. Workspaces look clean but environment-specific resource configurations become unmanageable without separation.'" },
      { type: "code", title: "The interview code question — 'What's wrong with this Terraform?'", content: `resource "aws_db_instance" "prod" {
  engine         = "mysql"
  instance_class = "db.t3.medium"
  username       = "admin"
  password       = "SuperSecret123!"   # WRONG: plaintext secret in code
  skip_final_snapshot = true           # WRONG: delete DB = no backup
}

# Strong answer covers all 5 issues:
# 1. Password hardcoded → use var.db_password + TF_VAR env var or Secrets Manager
# 2. skip_final_snapshot = true on production → no backup if terraform destroy
# 3. Missing: lifecycle { prevent_destroy = true } on production databases
# 4. Missing: backup_retention_period and multi_az for production HA
# 5. Missing: deletion_protection = true
# Interviewers use exactly this pattern — knowing all 5 separates you` }
    ]
  },

  aws: {
    summary: "AWS questions at AdTech companies combine architecture (design a VPC, choose the right service) with operational debugging (why can't my EC2 reach S3?). They specifically test your understanding of low-latency load balancing, container orchestration, and cost-efficient scaling.",
    sections: [
      { type: "tip", title: "The VPC design question — how to answer it structurally", content: "\"Design a VPC for a production ad bidder with a web tier and database tier.\" Structure: (1) VPC CIDR: 10.0.0.0/16. (2) Public subnets (one per AZ): for NLB, NAT Gateways, bastion hosts — anything needing direct internet. (3) Private subnets (one per AZ): for ECS/EKS tasks, EC2 app servers — outbound via NAT only. (4) DB subnets (one per AZ, more restricted): for RDS — no outbound internet needed. (5) Security Groups: NLB allows 443 from 0.0.0.0/0. App SG allows only from NLB SG. DB SG allows only from App SG — never from 0.0.0.0/0. For the bidder: NLB not ALB — Layer 4 TCP, sub-millisecond latency required." },
      { type: "table", title: "Debugging scenarios — what they ask and what they want", headers: ["Scenario", "Likely cause", "Exact debug path"], rows: [
        ["EC2 can't reach S3", "Missing IAM role/instance profile, or no S3 VPC endpoint and no NAT", "aws sts get-caller-identity on instance. Add S3 VPC endpoint (free, private) or NAT Gateway."],
        ["ECS task keeps OOMKilled", "Task memory limit too low or application memory leak", "CloudWatch → ECS → Container Insights for memory. Increase task definition memory. Profile app for leaks."],
        ["ALB shows 502 errors", "Target unhealthy or not responding on health check port", "ALB → Target Groups → check health check path + port. Verify SG allows ALB to reach container port."],
        ["Terraform gets UnauthorizedOperation", "IAM role running Terraform lacks required permissions", "Check CloudTrail for the exact denied API call. Add that specific action to the role policy."]
      ]},
      { type: "concepts", title: "IAM — the questions they always ask", items: [
        "Role vs User: User has long-lived static credentials (dangerous). Role issues temporary credentials via STS (auto-rotate, no stored secret). Always use Roles for EC2/ECS/Lambda as instance profile or task role.",
        "Least privilege: Don't use AdministratorAccess for application roles. Grant only specific actions needed: s3:GetObject not s3:*. Interviewers ask 'what permissions does your bidder need?' — be specific.",
        "The gotcha: 'I added the IAM policy but it's still denied.' Most likely: there's an explicit Deny somewhere — SCPs, permission boundaries, resource policy. Explicit Deny always wins over Allow.",
        "Cross-account: Role A in Account 1 assumes Role B in Account 2 if Role B's trust policy allows it and Role A has sts:AssumeRole. How you safely share resources across dev/prod accounts."
      ]},
      { type: "tip", title: "NLB vs ALB — the scenario question", content: "\"Your RTB bidder needs 500K TCP connections/second at <1ms latency. Your analytics dashboard serves HTTP APIs. Which load balancer for each?\" Bidder: NLB (Layer 4, TCP, static IPs, ~100µs latency, millions of connections). Dashboard: ALB (Layer 7, HTTP/HTTPS, path-based routing, header inspection, WAF integration). Trap: some candidates say 'ALB for everything because it has more features.' Wrong — ALB adds latency and can't handle raw TCP, which matters critically for sub-10ms RTB requirements." }
    ]
  }
};

// ── QUIZ DATA ─────────────────────────────────────────────────────────────────
const QUIZZES = {
  prog_ecosystem: [
    { q: "What is the primary role of an SSP?", opts: ["Buy ad inventory for advertisers","Monetize publisher inventory via auctions","Store audience data segments","Verify ad viewability"], a: 1, ex: "SSPs help publishers maximise yield from their ad inventory by running auctions and managing multiple demand sources." },
    { q: "Why did the industry shift from waterfall to unified auctions?", opts: ["Cost reduction","Waterfall tried buyers sequentially — higher bidder #2 never got a chance","GDPR compliance","Mobile ad support"], a: 1, ex: "In waterfall, if buyer #1 passed, the impression went to #2 regardless of what #2 would pay. Unified auctions let all buyers bid simultaneously = higher yield." },
    { q: "What is a Private Marketplace (PMP) deal?", opts: ["1:1 guaranteed deal with fixed CPM and volume","Invite-only auction — publisher offers select buyers access via Deal ID","Remnant inventory sold to lowest bidder","A marketplace for audience data"], a: 1, ex: "PMPs give publishers more control by only allowing specific buyers (via a Deal ID) to participate, usually at a negotiated floor price." },
    { q: "Which component stores persistent first-party customer profiles and is cookie-independent?", opts: ["DMP","Ad Exchange","CDP","SSP"], a: 2, ex: "CDPs (Customer Data Platforms) use first-party PII (email, CRM) to build persistent profiles. DMPs use third-party cookie data which is being deprecated." },
    { q: "Which of these is NOT a DSP?", opts: ["The Trade Desk","Google DV360","PubMatic","Amazon DSP"], a: 2, ex: "PubMatic is an SSP (Supply-Side Platform). The Trade Desk, DV360, and Amazon DSP are demand-side platforms." },
    { q: "In a first-price auction, a DSP bids $5 and wins. What do they pay?", opts: ["$0.01 above second highest bid","Exactly $5","$4.99","A negotiated rate"], a: 1, ex: "In first-price auctions (the current standard), the winner pays exactly their bid price. This is why DSPs use bid shading — they bid below their true value to avoid overpaying." }
  ],

  rtb_hb: [
    { q: "What is the total time budget for a typical RTB auction?", opts: ["10ms","50ms","100ms","500ms"], a: 2, ex: "The entire RTB cycle — from ad slot firing to ad render — must complete in ~100ms to avoid impacting page load. DSPs typically have 80ms to respond." },
    { q: "What is bid shading?", opts: ["Hiding the true bid from competitors","ML model predicts clearing price; DSP bids between floor and max value","Reducing bid by exactly half","A fraud prevention technique"], a: 1, ex: "After the shift to first-price auctions, DSPs use ML to predict what price the impression will clear at and bid accordingly — saving margin vs bidding their true maximum." },
    { q: "What is the main disadvantage of client-side header bidding (Prebid.js)?", opts: ["Less transparent than server-side","Adds 200–500ms latency to every page load","Only works on desktop","Doesn't support video ads"], a: 1, ex: "Client-side HB sends bid requests from the user's browser — all simultaneously, but it adds latency. Server-side HB moves this off the browser but reduces cookie visibility." },
    { q: "In an OpenRTB bid request, what does the 'imp' object contain?", opts: ["User demographic data","Impression details: size, slot ID, floor price, format","Publisher financial data","Ad creative content"], a: 1, ex: "The imp array describes each ad slot being auctioned: width/height, slot ID, floor price, supported formats (banner/video/native), and placement type." },
    { q: "What replaced VPAID in modern video advertising?", opts: ["VAST 4.x with SIMID","MRAID 3.0","OpenRTB video extension","HTML5 Ad API"], a: 0, ex: "VPAID (executable JS in video player) was phased out due to security risks and inconsistency. VAST 4.x with SIMID (Secure Interactive Media Interface Definition) is the modern replacement." },
    { q: "What is 'bid caching' and why is it controversial?", opts: ["Storing creatives in CDN for faster delivery","SSP reusing a winning bid across multiple auctions without the DSP's knowledge","Caching bid prices for analytics","Pre-loading bids during off-peak hours"], a: 1, ex: "Bid caching means an SSP uses the same winning bid for subsequent auctions. The DSP wins impressions they didn't actually bid on in real-time, inflating apparent win rates and potentially billing incorrectly." }
  ],

  privacy_meas: [
    { q: "Under GDPR, what is the maximum fine for serious violations?", opts: ["€10M or 2% of global revenue","€20M or 4% of global annual turnover","€5M flat fine","Up to €50M"], a: 1, ex: "GDPR tier 2 violations (most serious, e.g. lack of consent) = €20M or 4% of global annual turnover, whichever is higher." },
    { q: "What does a TC String (TCF 2.x) contain?", opts: ["Encrypted ad creative data","User's vendor consents, purpose consents, and legitimate interest signals","Publisher floor prices","User's browsing history"], a: 1, ex: "The TC String is a base64-encoded consent record showing which vendors a user consented to, for which purposes (1-10). Every DSP/SSP reads this before processing user data." },
    { q: "What is the MRC viewability standard for display ads?", opts: ["100% of pixels visible for 0.5 seconds","50% of pixels in view for at least 1 continuous second","75% pixels for 2 seconds","Any impression that loads"], a: 1, ex: "MRC standard: 50% of ad pixels must be in the viewable area of the browser for at least 1 continuous second (display). Video is 50% pixels for 2 continuous seconds." },
    { q: "What is the difference between GIVT and SIVT?", opts: ["GIVT is display, SIVT is video","GIVT = known bots/crawlers; SIVT = sophisticated fraud (spoofing, injection) harder to detect","GIVT is global, SIVT is Singapore","Different fraud vendors"], a: 1, ex: "GIVT (General IVT) = data center traffic, known bots, crawlers — filterable with basic rules. SIVT (Sophisticated IVT) = ad injection, domain spoofing, click farms — requires advanced ML detection." },
    { q: "What is a data clean room used for?", opts: ["Deleting user data for GDPR compliance","Matching two datasets for analysis without exposing raw PII","Cleaning corrupted ad creatives","Removing invalid traffic from reports"], a: 1, ex: "Clean rooms (AWS Clean Rooms, InfoSum, Google Ads Data Hub) let two parties run queries on the overlap of their datasets without either party seeing the other's raw PII." },
    { q: "Which attribution model gives 100% credit to the final touchpoint before conversion?", opts: ["First Click","Linear","Last Click","Time Decay"], a: 2, ex: "Last Click attribution gives 100% credit to the final click before conversion. Simple to implement but ignores all earlier touchpoints in the customer journey." }
  ],

  docker: [
    { q: "In a Dockerfile, which instruction creates a new layer that can be cached?", opts: ["Only FROM","Every instruction","Only RUN, COPY, and ADD","Only RUN"], a: 1, ex: "Every Dockerfile instruction creates a new layer. However, only filesystem-changing instructions (RUN, COPY, ADD) add real size. Layers are cached based on the instruction + context." },
    { q: "Why should frequently-changing instructions appear LAST in a Dockerfile?", opts: ["For alphabetical ordering","Docker builds top-to-bottom; a changed layer invalidates all subsequent caches","It reduces image size","Required by Docker best practices"], a: 1, ex: "Docker builds layer by layer. If layer 5 changes, layers 6+ must rebuild. Put 'COPY requirements.txt' + 'pip install' before 'COPY . .' — dependencies change rarely, code changes often." },
    { q: "What is the key benefit of multi-stage Docker builds?", opts: ["Faster runtime performance","Build artifacts + dependencies in one stage; only copy what's needed to final image — 70-90% size reduction","Support for multiple platforms","Parallel container execution"], a: 1, ex: "Multi-stage builds let you use a full build environment (with compilers, dev tools) but only ship the runtime artifacts. A Python app that's 1GB with build tools can become 100MB in production." },
    { q: "What is the difference between CMD and ENTRYPOINT in a Dockerfile?", opts: ["No difference, they're interchangeable","CMD sets default command (overridable at runtime); ENTRYPOINT sets fixed executable (CMD becomes its arguments)","CMD runs at build time; ENTRYPOINT at runtime","ENTRYPOINT is for Linux; CMD for Windows"], a: 1, ex: "ENTRYPOINT = the fixed process to run (e.g. python). CMD = default arguments to ENTRYPOINT (e.g. app.py), overridable with docker run image arg. Together: docker run myapp debug would run 'python debug'." },
    { q: "A container exits immediately after starting. What is the first thing you should check?", opts: ["docker inspect","docker logs <container_id>","docker stats","docker network ls"], a: 1, ex: "docker logs shows stdout/stderr of the container, which is where most application crash messages appear. This is always the first debugging step for a stopped container." },
    { q: "In docker-compose, how does service 'app' connect to service 'db' by hostname?", opts: ["Using the container ID","Using the service name defined in docker-compose.yml as hostname","Using the IP from docker network inspect","Using 'localhost'"], a: 1, ex: "Docker-compose creates a default network and registers each service's name as a DNS hostname. 'app' can reach 'db' at hostname 'db', e.g. postgresql://db:5432/mydb." }
  ],

  kubernetes: [
    { q: "What is the role of etcd in a Kubernetes cluster?", opts: ["Runs containers on each node","Assigns pods to nodes","Distributed KV store — single source of truth for all cluster state","Manages container networking"], a: 2, ex: "etcd stores all cluster state: nodes, pods, configs, secrets, deployments. If etcd dies, the cluster can't make decisions. This is why K8s recommends 3 or 5 etcd nodes for HA." },
    { q: "A pod shows 'OOMKilled' status. What happened?", opts: ["The image couldn't be pulled","The pod exceeded its memory limit and was killed by the kernel","A network timeout occurred","The liveness probe failed"], a: 1, ex: "OOMKilled = Out Of Memory Killed. The container tried to use more memory than its 'limits.memory' setting. Fix: increase the memory limit OR fix the memory leak in the application." },
    { q: "What is the difference between resource 'requests' and 'limits' in K8s?", opts: ["They are the same thing","Requests: what the pod needs (affects scheduling); Limits: max the pod can use (enforced at runtime)","Requests are for CPU only; limits for memory","Limits are set by cluster admin; requests by developer"], a: 1, ex: "Requests tell the scheduler how much to reserve — a node must have this available to schedule the pod. Limits cap actual usage — exceed CPU limit → throttled; exceed memory limit → OOMKilled." },
    { q: "What does a Horizontal Pod Autoscaler (HPA) do?", opts: ["Adds more CPU/memory to existing pods","Automatically scales the number of pod replicas based on metrics (CPU, memory, custom)","Distributes pods across availability zones","Monitors pod health and restarts failed pods"], a: 1, ex: "HPA watches metrics and adjusts the replica count of a Deployment/ReplicaSet. If CPU usage exceeds threshold → scale up. If below → scale down (with cooldown period). Critical for RTB traffic spikes." },
    { q: "Which Service type exposes your application externally via a cloud load balancer?", opts: ["ClusterIP","NodePort","LoadBalancer","ExternalName"], a: 2, ex: "LoadBalancer type provisions a cloud load balancer (AWS ELB, GCP LB) automatically and routes external traffic to your pods. ClusterIP is internal only; NodePort is external but port-restricted." },
    { q: "A pod is in 'Pending' state for several minutes. What is the most likely cause?", opts: ["Application crash","No node has sufficient resources to schedule the pod","Image pull failed","Service endpoint not found"], a: 1, ex: "Pending usually means the scheduler can't find a suitable node: resource requests exceed available capacity, node affinity/taint rules prevent scheduling, or the cluster has no nodes. Check kubectl describe pod → Events section." }
  ],

  linux_shell: [
    { q: "Which command shows all listening TCP/UDP ports with the process using them?", opts: ["ps aux","ss -tulnp","netstat -r","lsof -a"], a: 1, ex: "ss -tulnp: -t (TCP), -u (UDP), -l (listening), -n (numeric ports), -p (process). Modern replacement for netstat. Essential for checking which process is on which port." },
    { q: "What does 'set -euo pipefail' do in a bash script?", opts: ["Set the PATH variable","Exit on error (-e), treat undefined vars as errors (-u), fail on pipe errors (-o pipefail)","Enable debug mode","Set file creation permissions"], a: 1, ex: "These three options prevent silent failures: -e exits on any command failure, -u catches typos in variable names, pipefail catches errors in piped commands like 'cat file | grep pattern | wc -l'." },
    { q: "What is the difference between kill -9 and kill -15?", opts: ["No difference","kill -15 (SIGTERM): graceful shutdown; kill -9 (SIGKILL): immediate force kill, no cleanup","kill -9 is for processes; kill -15 for services","kill -15 only works as root"], a: 1, ex: "Always try SIGTERM (-15) first — it lets the process close files, flush buffers, and clean up. SIGKILL (-9) immediately terminates at OS level — the process can't intercept it. Use -9 only when -15 fails." },
    { q: "A server is slow. Which command quickly shows current CPU, memory, and load average?", opts: ["ps -aux","top or htop","df -h","netstat -s"], a: 1, ex: "top shows real-time CPU %, memory usage, load average, and process list. htop is a coloured interactive version. load average > number of CPUs = CPU is overloaded." },
    { q: "What does 'journalctl -u nginx -f' do?", opts: ["Shows nginx config file","Follows (live) the systemd journal logs for the nginx service","Lists all nginx processes","Restarts nginx"], a: 1, ex: "journalctl -u <service> shows logs for that systemd service. -f follows in real-time (like tail -f). Add --since '1 hour ago' to limit time range." },
    { q: "Which command shows disk usage of all directories in the current folder, sorted by size?", opts: ["ls -lh","du -sh * | sort -rh","df -h .","lsblk"], a: 1, ex: "du -sh * gives a human-readable summary of each item. Piping to sort -rh sorts in reverse human-readable order (largest first). Essential for finding what's filling a disk." }
  ],

  cicd: [
    { q: "What is the key difference between Continuous Delivery and Continuous Deployment?", opts: ["Delivery is for code; Deployment is for infrastructure","Delivery = code is always deployable but prod deploy is manual; Deployment = fully automated to production","Delivery uses Jenkins; Deployment uses GitHub Actions","No difference"], a: 1, ex: "Continuous Delivery means your pipeline could deploy to production at any time, but a human approves. Continuous Deployment removes that human gate — every passing build ships to prod automatically." },
    { q: "In a canary deployment, what percentage of traffic typically receives the new version initially?", opts: ["50%","100%","1-5%","25%"], a: 2, ex: "Canary starts with a very small slice of traffic (1-5%) to the new version. This limits the blast radius if there's a bug. Traffic shifts gradually to 100% once confidence is established." },
    { q: "Why should Docker images be built once and deployed to all environments (not rebuilt per env)?", opts: ["Cost savings","Artifact immutability: rebuilding could produce different output; same image guarantees staging = production","Faster builds","Docker Hub rate limits"], a: 1, ex: "If you rebuild the image for production, library versions could change, base image could update, or build context could differ. Build once with a SHA tag, promote that exact artifact through all environments." },
    { q: "In GitHub Actions, what does the 'environment' key on a job do?", opts: ["Sets environment variables","Requires manual approval from designated reviewers before the job runs","Defines the OS to run on","Sets the deployment target URL"], a: 1, ex: "Environments in GitHub Actions can have required reviewers — the workflow pauses and sends a notification for approval before the job proceeds. Used to protect production deployments." },
    { q: "What is the purpose of a smoke test run immediately after deployment?", opts: ["Full regression test of all features","Quickly verify the deployed service is responding and critical paths work before declaring success","Check code coverage","Validate Docker image size"], a: 1, ex: "Smoke tests are fast, surface-level checks: can we reach the service? Does the health endpoint respond? Does a basic bid request return a valid response? If these fail, auto-rollback immediately." },
    { q: "Why is caching dependencies (pip, npm) in CI pipelines important?", opts: ["Reduces code complexity","Cuts pipeline time from 10-15 min to 2-3 min by avoiding re-downloading unchanged dependencies","Improves security","Required by GitHub Actions"], a: 1, ex: "Downloading 200 npm packages on every build wastes 5-10 minutes. Caching uses a hash of package-lock.json — if it hasn't changed, restore from cache. Dramatically faster feedback cycles for developers." }
  ],

  terraform: [
    { q: "What is the terraform.tfstate file used for?", opts: ["Stores encrypted secrets","Maps your Terraform config to real infrastructure IDs in the cloud","Contains provider credentials","Lists available resources"], a: 1, ex: "State maps config (aws_instance.web) to the real resource (i-0abc123). Without state, Terraform doesn't know what it already created. This is why state corruption is catastrophic." },
    { q: "Why should you use S3 + DynamoDB as a Terraform backend instead of local state?", opts: ["Local state is not supported in newer versions","Remote state allows teams to share state; DynamoDB provides locking to prevent concurrent applies causing corruption","S3 is faster","AWS requires it"], a: 1, ex: "Local state works for solo development but is dangerous in teams: two people running apply simultaneously without locking corrupts state. DynamoDB locking ensures only one apply runs at a time." },
    { q: "What does 'terraform plan' do?", opts: ["Creates all resources immediately","Shows a preview of what changes will be made without applying them","Validates syntax only","Downloads providers"], a: 1, ex: "terraform plan is the most important safety step — it shows exactly what will be created, modified, or destroyed before you commit. Always review the plan output before applying, especially the 'destroy' lines." },
    { q: "What is a Terraform module?", opts: ["A single resource definition","A reusable, self-contained package of Terraform configuration with inputs and outputs","A Terraform Cloud feature","A provider plugin"], a: 1, ex: "Modules let you package related resources (VPC + subnets + SGs) and reuse them with different inputs (var.env = dev vs prod). Similar to functions in programming. Essential for DRY infrastructure code." },
    { q: "Which lifecycle argument prevents a resource from being accidentally destroyed?", opts: ["ignore_changes","create_before_destroy","prevent_destroy","keep_on_destroy"], a: 2, ex: "lifecycle { prevent_destroy = true } causes terraform destroy (or any plan that would destroy the resource) to fail with an error. Use on databases and other stateful resources." },
    { q: "What is the purpose of 'terraform import'?", opts: ["Import modules from the Terraform registry","Bring an existing cloud resource (created outside Terraform) into the Terraform state","Import variables from a file","Import provider plugins"], a: 1, ex: "terraform import lets you take control of manually-created resources. Example: terraform import aws_instance.web i-12345. After importing, any future changes go through Terraform." }
  ],

  aws: [
    { q: "What is the difference between a Security Group and a Network ACL?", opts: ["Security Groups are free; NACLs are paid","Security Groups are stateful (return traffic auto-allowed); NACLs are stateless (both directions must be explicitly allowed)","Security Groups are for EC2; NACLs for S3","No functional difference"], a: 1, ex: "SG stateful: allow inbound port 80 → responses automatically allowed out. NACL stateless: must explicitly allow both inbound port 80 AND outbound ephemeral ports. SGs operate at instance level; NACLs at subnet level." },
    { q: "Why is an IAM Role preferred over IAM User credentials for an EC2 application?", opts: ["Roles are free; Users have per-request costs","Roles use temporary credentials (auto-rotated) and don't require storing static access keys in code or env vars","Roles have more permissions","Users are deprecated"], a: 1, ex: "IAM Roles use STS to issue temporary credentials (15min-12hr). No long-lived secret to leak or rotate. The EC2 instance profile automatically provides credentials via the metadata service. Never hardcode IAM keys." },
    { q: "What does a NAT Gateway do in a VPC?", opts: ["Provides DNS resolution for the VPC","Allows instances in private subnets to make outbound internet requests without being publicly reachable","Connects two VPCs","Provides a static public IP for EC2"], a: 1, ex: "NAT Gateway sits in a public subnet. Private instances route outbound traffic through it → NAT translates source IP to NAT's public IP → internet sees NAT, not the private instance. One-way: internet can't initiate connections back." },
    { q: "What is the key advantage of ECS Fargate over ECS EC2 launch type?", opts: ["Fargate supports more container types","Fargate is serverless — no EC2 instances to manage, patch, or right-size. Pay per task CPU/memory.","Fargate is faster","Fargate works with any orchestrator"], a: 1, ex: "With ECS Fargate, AWS manages all the underlying infrastructure. You define task resources (CPU/memory), AWS provisions it. No node groups to patch, no capacity planning for nodes. Ideal for variable workloads." },
    { q: "A team needs low-latency (<1ms) load balancing for a TCP bidder. Which load balancer?", opts: ["Application Load Balancer (ALB)","Classic Load Balancer (CLB)","Network Load Balancer (NLB)","Global Accelerator only"], a: 2, ex: "NLB operates at Layer 4 (TCP/UDP). Ultra-low latency (~100 microseconds), static IP, handles millions of RPS. ALB is Layer 7 (HTTP) with richer routing features but higher latency. For RTB bidders: NLB." },
    { q: "What is the purpose of AWS CloudWatch Logs Insights?", opts: ["Monitor EC2 CPU usage","Run SQL-like queries against log groups to analyse patterns and debug issues","Back up logs to S3","Alert when logs are missing"], a: 1, ex: "Logs Insights lets you run queries like 'find all 500 errors in the last hour with their request IDs' across massive log volumes in seconds. Essential for post-incident analysis and performance debugging." }
  ]
};

// ── COMPONENT ─────────────────────────────────────────────────────────────────
const CAT = { adtech: { label: "AdTech", color: "#DB2777", bg: "#FDF2F8" }, devops: { label: "DevOps", color: "#4F46E5", bg: "#EEF2FF" } };
const today = () => new Date().toISOString().slice(0, 10);

export default function App() {
  const [view, setView]         = useState("home");
  const [topicId, setTopicId]   = useState(null);
  const [quizIdx, setQuizIdx]         = useState(0);
  const [selected, setSelected]       = useState(null);
  const [answers, setAnswers]         = useState([]);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizError, setQuizError]     = useState(false);
  const [progress, setProgress]       = useState({});
  const [streak, setStreak]           = useState({ count: 0, lastDate: null });
  const [loaded, setLoaded]           = useState(false);
  const [sideOpen, setSideOpen]       = useState(true);
  // Interview
  const [iMsg, setIMsg]     = useState([]);
  const [iInput, setIInput] = useState("");
  const [iLoading, setILoading] = useState(false);
  const [iTopic, setITopic]   = useState(null);
  const chatRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await store.get("lms2:progress"); if (p) setProgress(JSON.parse(p));
        const s = await store.get("lms2:streak"); if (s) setStreak(JSON.parse(s));
      } catch (_) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => { if (loaded) store.set("lms2:progress", JSON.stringify(progress)); }, [progress, loaded]);
  useEffect(() => { if (loaded) store.set("lms2:streak", JSON.stringify(streak)); }, [streak, loaded]);
  useEffect(() => { chatRef.current?.scrollIntoView({ behavior: "smooth" }); }, [iMsg]);

  const markStudied = (id) => {
    const td = today();
    setProgress(p => ({ ...p, [id]: { ...(p[id] || {}), studied: true } }));
    setStreak(s => {
      if (s.lastDate === td) return s;
      const y = new Date(td); y.setDate(y.getDate() - 1);
      const ys = y.toISOString().slice(0, 10);
      return { count: s.lastDate === ys ? s.count + 1 : 1, lastDate: td };
    });
  };

  const openStudy  = (id) => { setTopicId(id); setView("study"); markStudied(id); };
  const openInterview = (id) => { setITopic(id); setIMsg([]); setIInput(""); setView("interview"); };

  const openQuiz = async (id) => {
    const t = TOPICS.find(t => t.id === id);
    setTopicId(id);
    setQuizIdx(0);
    setSelected(null);
    setAnswers([]);
    setQuizQuestions([]);
    setQuizError(false);
    setQuizLoading(true);
    setView("quiz");

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...(process.env.REACT_APP_ANTHROPIC_KEY ? { "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY } : {})
          },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          system: `You generate interview quiz questions that mirror what is ACTUALLY asked in real technical interviews. Return ONLY a valid JSON array. No markdown, no backticks — pure JSON only.`,
          messages: [{
            role: "user",
            content: `Generate 8 multiple-choice quiz questions on "${t?.label}" that mirror real interview questions asked at AdTech companies (PubMatic, InMobi, The Trade Desk, Criteo) and DevOps/infrastructure roles.

Candidate: Samprati Kothari — 3.5 yrs AdOps at Undertone/Perion (DSP/SSP/RTB/Header Bidding), 2.5 yrs Linux/Ansible at TCS, AWS SAA certified, learning K8s/Terraform/Docker.

CRITICAL — question style (this is what makes it interview-realistic):
- 3 scenario questions: "You notice X / A campaign is doing Y / Your manager asks you to fix Z — what do you do FIRST?" 
- 2 tradeoff questions: "You need to choose between A and B for this use case — which and why?"
- 2 debugging questions: "Something is broken/wrong — what is the most likely cause?" (include a realistic symptom)
- 1 gotcha question: something that looks obvious but the naive answer is wrong, or a common misconception

BANNED question types (these are NOT what interviewers ask):
- "What is the definition of X?" (too textbook)
- "Which of the following is TRUE about X?" (too academic)
- Pure recall questions with an obvious correct answer

Rules for good options:
- All 4 options must be plausible actions someone might actually take — no obviously wrong options
- Wrong options should reflect real mistakes senior engineers make, not silly errors
- Explanations must say WHY the wrong options are tempting but wrong, not just restate the correct answer
- Never phrase options as "All of the above" or "None of the above"

Return exactly:
[{"q":"...","opts":["...","...","...","..."],"a":0,"ex":"...","type":"scenario|tradeoff|debugging|gotcha"}]`
          }]
        })
      });
      const data = await res.json();
      const raw = data.content?.find(b => b.type === "text")?.text || "[]";
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setQuizQuestions(parsed);
      } else {
        throw new Error("Empty response");
      }
    } catch (e) {
      // Fallback to static questions
      setQuizQuestions(QUIZZES[id] || []);
      setQuizError(true);
    }
    setQuizLoading(false);
  };

  const handleAnswer = (i) => {
    if (selected !== null) return;
    setSelected(i);
    setAnswers(a => [...a, i]);
  };

  const nextQ = () => {
    const qs = quizQuestions;
    if (quizIdx + 1 >= qs.length) {
      const finalScore = answers.filter((a, i) => a === qs[i].a).length;
      const pct = Math.round((finalScore / qs.length) * 100);
      setProgress(p => ({ ...p, [topicId]: { ...(p[topicId] || {}), quizBest: Math.max(pct, (p[topicId]?.quizBest || 0)), quizAttempts: ((p[topicId]?.quizAttempts || 0) + 1) } }));
      setView("result");
    } else {
      setQuizIdx(q => q + 1);
      setSelected(null);
    }
  };

  const startAI = async (id) => {
    const t = TOPICS.find(t => t.id === id);
    setILoading(true);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: {
            "Content-Type": "application/json",
            ...(process.env.REACT_APP_ANTHROPIC_KEY ? { "x-api-key": process.env.REACT_APP_ANTHROPIC_KEY } : {})
          },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `You are a technical interviewer at a top AdTech company (PubMatic/The Trade Desk). You're interviewing Samprati Kothari: 6 years exp, 3.5 years AdOps at Undertone/Perion (DSP/SSP/RTB/HB, 500+ targeting fixes, built AI deployment tool), 2.5 years Linux/Ansible at TCS, AWS SAA certified. Topic: ${t?.label}. Ask ONE focused interview question. After they answer: brief feedback (good/missing), the ideal answer, rating (Needs Work/Good/Excellent), then next question. Medium difficulty. Be concise and realistic.`,
          messages: [{ role: "user", content: `Start the ${t?.label} interview. First question please.` }]
        })
      });
      const data = await res.json();
      setIMsg([{ role: "assistant", content: data.content?.find(b => b.type === "text")?.text || "Let's begin!" }]);
    } catch { setIMsg([{ role: "assistant", content: "Connection error. Please try again." }]); }
    setILoading(false);
  };

  const sendAI = async () => {
    if (!iInput.trim() || iLoading) return;
    const msg = iInput.trim(); setIInput("");
    const next = [...iMsg, { role: "user", content: msg }];
    setIMsg(next); setILoading(true);
    const t = TOPICS.find(t => t.id === iTopic);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514", max_tokens: 800,
          system: `Technical interviewer at AdTech company. Candidate: Samprati Kothari, 3.5 yrs AdOps (RTB/HB/DSP/SSP, Undertone), 2.5 yrs Linux/Ansible, AWS SAA cert. Topic: ${t?.label}. Give feedback on their answer (good/missing), ideal answer briefly, rate (Needs Work/Good/Excellent), ask next question. Concise.`,
          messages: next.map(m => ({ role: m.role, content: m.content }))
        })
      });
      const data = await res.json();
      setIMsg([...next, { role: "assistant", content: data.content?.find(b => b.type === "text")?.text || "Next question..." }]);
    } catch { setIMsg([...next, { role: "assistant", content: "Connection error. Try again." }]); }
    setILoading(false);
  };

  // ── RENDER HELPERS ──────────────────────────────────────────────────────────
  const doneTopics = TOPICS.filter(t => progress[t.id]?.studied).length;
  const quizzedTopics = TOPICS.filter(t => progress[t.id]?.quizBest >= 60).length;

  const ContentBlock = ({ block, topicColor }) => {
    switch (block.type) {
      case "concepts": return (
        <div style={bCard}>
          <div style={bTitle(topicColor)}>{block.title}</div>
          {block.items.map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: i < block.items.length - 1 ? "0.5px solid #F1F5F9" : "none" }}>
              <span style={{ color: topicColor, fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
              <span style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>{item}</span>
            </div>
          ))}
        </div>
      );
      case "flow": return (
        <div style={bCard}>
          <div style={bTitle(topicColor)}>{block.title}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center", marginTop: 4 }}>
            {block.steps.map((step, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ background: topicColor + "15", border: `1px solid ${topicColor}40`, borderRadius: 6, padding: "5px 10px", fontSize: 12, color: "#1E293B", fontWeight: 500 }}>{step}</div>
                {i < block.steps.length - 1 && <span style={{ color: topicColor, fontSize: 14, fontWeight: 700 }}>→</span>}
              </div>
            ))}
          </div>
        </div>
      );
      case "table": return (
        <div style={bCard}>
          <div style={bTitle(topicColor)}>{block.title}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr>{block.headers.map(h => <th key={h} style={{ textAlign: "left", padding: "6px 8px", background: topicColor + "15", color: topicColor, fontWeight: 600, borderBottom: `1.5px solid ${topicColor}30` }}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#F8FAFC" }}>
                  {row.map((cell, j) => <td key={j} style={{ padding: "7px 8px", color: j === 0 ? "#0F172A" : "#334155", fontWeight: j === 0 ? 600 : 400, borderBottom: "0.5px solid #F1F5F9", lineHeight: 1.5 }}>{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      case "code": return (
        <div style={bCard}>
          <div style={bTitle(topicColor)}>{block.title}</div>
          <pre style={{ margin: 0, padding: "12px 14px", background: "#0F172A", borderRadius: 6, fontSize: 11.5, lineHeight: 1.7, color: "#E2E8F0", overflowX: "auto", fontFamily: "'Courier New', monospace" }}>{block.content}</pre>
        </div>
      );
      case "tip": return (
        <div style={{ background: topicColor + "0D", border: `1px solid ${topicColor}30`, borderLeft: `3px solid ${topicColor}`, borderRadius: "0 8px 8px 0", padding: "12px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: topicColor, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>💡 {block.title}</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: "#334155" }}>{block.content}</div>
        </div>
      );
      default: return null;
    }
  };

  const bCard = { background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "14px 16px", marginBottom: 12 };
  const bTitle = (c) => ({ fontSize: 11, fontWeight: 700, color: c, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 });

  // ── VIEWS ───────────────────────────────────────────────────────────────────
  const HomeView = () => (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        {[["🔥 Streak", streak.count + " days", "#F59E0B"], ["📚 Studied", `${doneTopics}/${TOPICS.length}`, "#4F46E5"], ["✅ Quizzes passed", `${quizzedTopics}/${TOPICS.length}`, "#059669"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: "14px 18px", flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: 12, color: "#64748B", marginTop: 3 }}>{l}</div>
          </div>
        ))}
      </div>

      {["adtech", "devops"].map(cat => (
        <div key={cat}>
          <div style={{ fontSize: 11, fontWeight: 700, color: CAT[cat].color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10, marginTop: cat === "devops" ? 20 : 0 }}>{CAT[cat].label}</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {TOPICS.filter(t => t.cat === cat).map(t => {
              const p = progress[t.id] || {};
              const quiz = p.quizBest || 0;
              return (
                <div key={t.id} style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: 14, cursor: "pointer" }} onClick={() => openStudy(t.id)}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <span style={{ fontSize: 22 }}>{t.icon}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {p.studied && <span style={{ fontSize: 10, background: "#EEF2FF", color: "#4F46E5", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>Read</span>}
                      {quiz >= 60 && <span style={{ fontSize: 10, background: "#ECFDF5", color: "#059669", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>{quiz}%</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A", marginTop: 8 }}>{t.label}</div>
                  <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>{t.time} · AI quiz · 8 questions</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                    <button onClick={e => { e.stopPropagation(); openStudy(t.id); }} style={smBtn(CAT[cat].color)}>Study</button>
                    <button onClick={e => { e.stopPropagation(); openQuiz(t.id); }} style={smBtn("#64748B")}>Quiz</button>
                    <button onClick={e => { e.stopPropagation(); openInterview(t.id); }} style={smBtn("#0891B2")}>AI</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );

  const smBtn = (c) => ({ fontSize: 11, padding: "4px 10px", background: c + "15", color: c, border: `1px solid ${c}30`, borderRadius: 5, cursor: "pointer", fontWeight: 600 });

  const StudyView = () => {
    const t = TOPICS.find(t => t.id === topicId);
    const c = CONTENT[topicId];
    const topicColor = CAT[t.cat].color;
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <span style={{ fontSize: 28 }}>{t.icon}</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>{t.label}</div>
            <div style={{ fontSize: 12, color: "#64748B" }}>{t.time} read · AI-generated quiz · 8 questions</div>
          </div>
          <button onClick={() => openQuiz(topicId)} style={{ marginLeft: "auto", padding: "8px 16px", background: topicColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Take Quiz →</button>
        </div>
        <div style={{ background: topicColor + "0D", border: `1px solid ${topicColor}25`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, lineHeight: 1.7, color: "#334155" }}>{c.summary}</div>
        {c.sections.map((block, i) => <ContentBlock key={i} block={block} topicColor={topicColor} />)}
        <button onClick={() => openQuiz(topicId)} style={{ width: "100%", padding: "12px", background: topicColor, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 4 }}>Take the Quiz →</button>
      </div>
    );
  };

  const QuizView = () => {
    const t = TOPICS.find(t => t.id === topicId);
    const topicColor = CAT[t.cat].color;

    // Loading screen while AI generates questions
    if (quizLoading) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 360, gap: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: topicColor, animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", marginBottom: 6 }}>Generating your {t.label} quiz</div>
          <div style={{ fontSize: 13, color: "#64748B", lineHeight: 1.6 }}>
            The AI is crafting 8 fresh interview questions<br/>tailored to your background…
          </div>
        </div>
      </div>
    );

    const qs = quizQuestions;
    if (!qs.length) return null;
    const q = qs[quizIdx];
    const isCorrect = selected === q.a;
    const typeLabels = { conceptual: "Conceptual", scenario: "Scenario", troubleshooting: "Troubleshooting", "best-practices": "Best Practice", advanced: "Advanced" };
    const typeColors = { conceptual: "#4F46E5", scenario: "#0891B2", troubleshooting: "#DB2777", "best-practices": "#059669", advanced: "#DC2626" };
    const qType = q.type || "conceptual";

    return (
      <div>
        {quizError && (
          <div style={{ fontSize: 11, background: "#FFFBEB", border: "0.5px solid #FDE68A", borderRadius: 6, padding: "6px 12px", marginBottom: 12, color: "#92400E" }}>
            ⚠ Could not connect — using built-in questions instead
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "#64748B" }}>{t.icon} Q{quizIdx + 1} of {qs.length}</span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: (typeColors[qType] || "#4F46E5") + "15", color: typeColors[qType] || "#4F46E5" }}>
              {typeLabels[qType] || qType}
            </span>
          </div>
          <div style={{ display: "flex", gap: 3 }}>
            {qs.map((_, i) => <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: i < quizIdx ? "#059669" : i === quizIdx ? topicColor : "#E2E8F0" }} />)}
          </div>
        </div>
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: "20px 20px 16px", marginBottom: 12 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: "#0F172A", lineHeight: 1.65, marginBottom: 20 }}>{q.q}</div>
          {q.opts.map((opt, i) => {
            let bg = "#F8FAFC", border = "0.5px solid #E2E8F0", color = "#334155";
            if (selected !== null) {
              if (i === q.a) { bg = "#ECFDF5"; border = "1.5px solid #059669"; color = "#065F46"; }
              else if (i === selected && selected !== q.a) { bg = "#FEF2F2"; border = "1.5px solid #EF4444"; color = "#7F1D1D"; }
            }
            return (
              <div key={i} onClick={() => handleAnswer(i)} style={{ background: bg, border, borderRadius: 8, padding: "11px 14px", marginBottom: 8, cursor: selected === null ? "pointer" : "default", display: "flex", gap: 10, alignItems: "flex-start", transition: "all 0.15s" }}>
                <span style={{ fontWeight: 700, color: i === q.a && selected !== null ? "#059669" : selected === i && selected !== q.a ? "#EF4444" : topicColor, fontSize: 13, flexShrink: 0 }}>{String.fromCharCode(65 + i)}.</span>
                <span style={{ fontSize: 13, lineHeight: 1.5, color }}>{opt}</span>
                {selected !== null && i === q.a && <span style={{ marginLeft: "auto", color: "#059669", fontSize: 16, flexShrink: 0 }}>✓</span>}
                {selected !== null && i === selected && selected !== q.a && <span style={{ marginLeft: "auto", color: "#EF4444", fontSize: 16, flexShrink: 0 }}>✗</span>}
              </div>
            );
          })}
        </div>
        {selected !== null && (
          <div style={{ background: isCorrect ? "#ECFDF5" : "#FEF2F2", border: `1px solid ${isCorrect ? "#A7F3D0" : "#FCA5A5"}`, borderRadius: 10, padding: "12px 14px", marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: isCorrect ? "#059669" : "#EF4444", marginBottom: 5 }}>{isCorrect ? "✓ Correct!" : "✗ Not quite"}</div>
            <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.6 }}>{q.ex}</div>
          </div>
        )}
        {selected !== null && (
          <button onClick={nextQ} style={{ width: "100%", padding: "12px", background: topicColor, color: "#fff", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
            {quizIdx + 1 < qs.length ? "Next Question →" : "See Results →"}
          </button>
        )}
        {selected === null && <div style={{ fontSize: 12, color: "#94A3B8", textAlign: "center" }}>Select your answer above</div>}
      </div>
    );
  };

  const ResultView = () => {
    const t = TOPICS.find(t => t.id === topicId);
    const qs = quizQuestions;
    const topicColor = CAT[t.cat].color;
    const score = answers.filter((a, i) => a === qs[i].a).length;
    const pct = Math.round((score / qs.length) * 100);
    const msg = pct === 100 ? "Perfect! 🎉" : pct >= 80 ? "Strong performance 🌟" : pct >= 60 ? "Good effort 👍" : "Keep at it 📚";
    const prev = progress[topicId]?.quizBest;
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: pct >= 60 ? topicColor : "#EF4444", lineHeight: 1 }}>{pct}%</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: "#0F172A", marginTop: 8 }}>{msg}</div>
        <div style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>{score} of {qs.length} correct · {t.label}</div>
        {prev !== undefined && prev > 0 && pct > prev && (
          <div style={{ fontSize: 12, background: "#ECFDF5", color: "#059669", padding: "4px 14px", borderRadius: 20, display: "inline-block", marginTop: 8 }}>↑ New best score!</div>
        )}
        <div style={{ background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 16, textAlign: "left" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>Review</div>
          {qs.map((q, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: i < qs.length - 1 ? "0.5px solid #F1F5F9" : "none", alignItems: "flex-start" }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>{answers[i] === q.a ? "✅" : "❌"}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5, fontWeight: 500 }}>{q.q}</div>
                {answers[i] !== q.a && (
                  <div style={{ fontSize: 11, marginTop: 4 }}>
                    <span style={{ color: "#EF4444" }}>Your answer: {q.opts[answers[i]]}</span>
                    <span style={{ color: "#94A3B8", margin: "0 6px" }}>·</span>
                    <span style={{ color: "#059669" }}>Correct: {q.opts[q.a]}</span>
                  </div>
                )}
                {answers[i] !== q.a && <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, lineHeight: 1.5 }}>{q.ex}</div>}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => openQuiz(topicId)} style={{ flex: 1, padding: "10px", background: "#F1F5F9", color: "#334155", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>New Quiz</button>
          <button onClick={() => openStudy(topicId)} style={{ flex: 1, padding: "10px", background: topicColor + "15", color: topicColor, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Review Topic</button>
          <button onClick={() => openInterview(topicId)} style={{ flex: 1, padding: "10px", background: topicColor, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>AI Interview</button>
        </div>
      </div>
    );
  };

  const InterviewView = () => {
    const t = TOPICS.find(t => t.id === iTopic);
    return (
      <div>
        {!iTopic ? (
          <>
            <div style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}>Pick a topic for live AI interview practice. The AI asks real questions, evaluates your answers, and gives feedback.</div>
            {["adtech", "devops"].map(cat => (
              <div key={cat}>
                <div style={{ fontSize: 11, fontWeight: 700, color: CAT[cat].color, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8, marginTop: 14 }}>{CAT[cat].label}</div>
                {TOPICS.filter(t => t.cat === cat).map(t => (
                  <button key={t.id} onClick={() => { setITopic(t.id); startAI(t.id); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: 8, marginBottom: 6, cursor: "pointer", textAlign: "left" }}>
                    <span>{t.icon}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#0F172A", flex: 1 }}>{t.label}</span>
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>Start →</span>
                  </button>
                ))}
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <button onClick={() => setITopic(null)} style={{ padding: "5px 10px", background: "#F1F5F9", border: "none", borderRadius: 6, fontSize: 12, color: "#64748B", cursor: "pointer" }}>← Topics</button>
              <span style={{ fontSize: 13, fontWeight: 500 }}>{t?.icon} {t?.label} Interview</span>
              <button onClick={() => startAI(iTopic)} style={{ marginLeft: "auto", padding: "5px 10px", background: "#F1F5F9", border: "none", borderRadius: 6, fontSize: 12, color: "#64748B", cursor: "pointer" }}>Restart</button>
            </div>
            <div style={{ background: "#F8FAFC", border: "0.5px solid #E2E8F0", borderRadius: 10, padding: 14, minHeight: 280, maxHeight: 380, overflowY: "auto", display: "flex", flexDirection: "column", marginBottom: 10, position: "relative" }}>
              {iLoading && iMsg.length === 0 ? (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240, gap: 16 }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} style={{
                        width: 10, height: 10, borderRadius: "50%", background: "#4F46E5",
                        animation: "bounce 1.2s ease-in-out infinite",
                        animationDelay: `${i * 0.2}s`
                      }} />
                    ))}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 4 }}>
                      Preparing your {t?.label} interview
                    </div>
                    <div style={{ fontSize: 12, color: "#94A3B8" }}>The AI interviewer is formulating your first question…</div>
                  </div>
                </div>
              ) : (
                <>
                  {iMsg.map((m, i) => (
                    <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%", background: m.role === "user" ? "#0F172A" : "#fff", color: m.role === "user" ? "#fff" : "#111", border: m.role === "user" ? "none" : "0.5px solid #E2E8F0", borderRadius: m.role === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px", padding: "10px 14px", marginBottom: 8, fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {m.role === "assistant" && <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginBottom: 4 }}>INTERVIEWER</div>}
                      {m.content}
                    </div>
                  ))}
                  {iLoading && iMsg.length > 0 && (
                    <div style={{ alignSelf: "flex-start", background: "#fff", border: "0.5px solid #E2E8F0", borderRadius: "12px 12px 12px 2px", padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, marginRight: 4 }}>INTERVIEWER</div>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 7, height: 7, borderRadius: "50%", background: "#CBD5E1",
                          animation: "bounce 1.2s ease-in-out infinite",
                          animationDelay: `${i * 0.2}s`
                        }} />
                      ))}
                    </div>
                  )}
                  <div ref={chatRef} />
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={iInput} onChange={e => setIInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendAI()} placeholder="Type your answer and press Enter..." disabled={iLoading || iMsg.length === 0} style={{ flex: 1, padding: "10px 14px", fontSize: 13, border: "0.5px solid #CBD5E1", borderRadius: 8, outline: "none", background: "#fff", fontFamily: "inherit" }} />
              <button onClick={sendAI} disabled={iLoading || !iInput.trim()} style={{ padding: "10px 18px", background: iLoading || !iInput.trim() ? "#E2E8F0" : "#0F172A", color: iLoading || !iInput.trim() ? "#94A3B8" : "#fff", border: "none", borderRadius: 8, fontSize: 13, cursor: "pointer", fontWeight: 500 }}>Send</button>
            </div>
          </>
        )}
      </div>
    );
  };

  const NAV_ITEMS = [
    { id: "home", label: "Home", icon: "⊞" },
    { id: "interview", label: "Interview Practice", icon: "🎯" }
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", color: "#0F172A", display: "flex", height: "100vh", overflow: "hidden", maxWidth: 1100, margin: "0 auto" }}>
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
      {/* Sidebar */}
      <div style={{ width: sideOpen ? 220 : 48, flexShrink: 0, background: "#0F172A", display: "flex", flexDirection: "column", transition: "width 0.2s", overflow: "hidden" }}>
        <div style={{ padding: "16px 12px 12px", display: "flex", alignItems: "center", gap: 8, borderBottom: "0.5px solid #1E293B" }}>
          <button onClick={() => setSideOpen(s => !s)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: 16, padding: 4, flexShrink: 0 }}>☰</button>
          {sideOpen && <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>AdTech × DevOps</span>}
        </div>
        <div style={{ padding: "8px 6px", borderBottom: "0.5px solid #1E293B" }}>
          {NAV_ITEMS.map(n => (
            <button key={n.id} onClick={() => { setView(n.id); if (n.id === "interview" && !iTopic) {} }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 8px", background: view === n.id ? "#1E293B" : "none", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 2, textAlign: "left", color: view === n.id ? "#fff" : "#94A3B8", whiteSpace: "nowrap" }}>
              <span style={{ fontSize: 14, flexShrink: 0 }}>{n.icon}</span>
              {sideOpen && <span style={{ fontSize: 13 }}>{n.label}</span>}
            </button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 6px" }}>
          {["adtech", "devops"].map(cat => (
            <div key={cat}>
              {sideOpen && <div style={{ fontSize: 10, fontWeight: 700, color: CAT[cat].color, textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 8px 4px" }}>{CAT[cat].label}</div>}
              {TOPICS.filter(t => t.cat === cat).map(t => {
                const p = progress[t.id] || {};
                const active = (view === "study" || view === "quiz" || view === "result") && topicId === t.id;
                return (
                  <button key={t.id} onClick={() => openStudy(t.id)} title={t.label} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "7px 8px", background: active ? "#1E293B" : "none", border: "none", borderRadius: 6, cursor: "pointer", marginBottom: 1, textAlign: "left", whiteSpace: "nowrap" }}>
                    <span style={{ fontSize: 13, flexShrink: 0 }}>{t.icon}</span>
                    {sideOpen && <>
                      <span style={{ fontSize: 12, color: active ? "#fff" : "#94A3B8", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>{t.label}</span>
                      {p.studied && <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.quizBest >= 60 ? "#059669" : "#4F46E5", flexShrink: 0 }} />}
                    </>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {sideOpen && (
          <div style={{ padding: "10px 14px", borderTop: "0.5px solid #1E293B" }}>
            <div style={{ fontSize: 11, color: "#64748B" }}>🔥 {streak.count} day streak</div>
            <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>{doneTopics}/{TOPICS.length} studied · {quizzedTopics} quizzes passed</div>
          </div>
        )}
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflowY: "auto", background: "#F8FAFC" }}>
        <div style={{ padding: "20px 24px 40px", maxWidth: 720 }}>
          {view === "home" && HomeView()}
          {view === "study" && topicId && StudyView()}
          {view === "quiz" && topicId && QuizView()}
          {view === "result" && topicId && ResultView()}
          {view === "interview" && InterviewView()}
        </div>
      </div>
    </div>
  );
}
