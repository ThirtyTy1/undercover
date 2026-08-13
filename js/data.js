// Static game content: contracts, weapons, flex items, reputation tiers

const TIERS = [
  { name: "Street Hitter", repReq: 0 },
  { name: "Fixer", repReq: 100 },
  { name: "Ghost", repReq: 400 },
  { name: "Legend", repReq: 1000 },
];

function tierForRep(rep) {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (rep >= TIERS[i].repReq) idx = i;
  }
  return idx;
}

const CONTRACTS = [
  // Tier 0 - Street Hitter
  { id: "c1", name: "Debt Collector", tier: 0, payout: 400, rep: 3, duration: 4, baseChance: 0.85, heat: 3,
    minigame: "timing", mgTitle: "Shake Them Down", mgFlavor: "Time your move for when they're about to crack." },
  { id: "c2", name: "Rival Dealer", tier: 0, payout: 800, rep: 6, duration: 7, baseChance: 0.75, heat: 6,
    minigame: "reflex", mgTitle: "Ambush", mgFlavor: "Wait for your opening. Don't move too soon." },
  { id: "c3", name: "Loudmouth Snitch", tier: 0, payout: 1500, rep: 9, duration: 10, baseChance: 0.65, heat: 9,
    minigame: "takedown", mgTitle: "Silence Them", mgFlavor: "Shut down every witness before they talk." },
  // Tier 1 - Fixer
  { id: "c4", name: "Crooked Cop", tier: 1, payout: 3500, rep: 20, duration: 15, baseChance: 0.6, heat: 14,
    minigame: "timing", mgTitle: "The Payoff", mgFlavor: "Slide the bribe at exactly the right moment." },
  { id: "c5", name: "Business Rival", tier: 1, payout: 6000, rep: 28, duration: 20, baseChance: 0.55, heat: 18,
    minigame: "pattern", mgTitle: "Crack the Safe", mgFlavor: "Match the combination before security notices." },
  { id: "c6", name: "Gang Lieutenant", tier: 1, payout: 10000, rep: 40, duration: 28, baseChance: 0.5, heat: 22,
    minigame: "takedown", mgTitle: "Clear the Crew", mgFlavor: "Drop his men before they reach for their guns." },
  // Tier 2 - Ghost
  { id: "c7", name: "Cartel Boss", tier: 2, payout: 25000, rep: 80, duration: 38, baseChance: 0.45, heat: 28,
    minigame: "pattern", mgTitle: "Bypass Security", mgFlavor: "Mirror the compound's access code." },
  { id: "c8", name: "Corrupt Judge", tier: 2, payout: 40000, rep: 107, duration: 45, baseChance: 0.4, heat: 32,
    minigame: "timing", mgTitle: "The Drop", mgFlavor: "Hand off the evidence at the perfect moment." },
  { id: "c9", name: "Federal Informant", tier: 2, payout: 65000, rep: 147, duration: 55, baseChance: 0.35, heat: 38,
    minigame: "reflex", mgTitle: "Cut the Line", mgFlavor: "Catch him before he dials for backup." },
  // Tier 3 - Legend
  { id: "c10", name: "Crime Family Head", tier: 3, payout: 150000, rep: 333, duration: 75, baseChance: 0.35, heat: 45,
    minigame: "reflex", mgTitle: "One Shot", mgFlavor: "You won't get a second chance. Time it perfectly." },
  { id: "c11", name: "Foreign Diplomat", tier: 3, payout: 300000, rep: 500, duration: 90, baseChance: 0.3, heat: 50,
    minigame: "pattern", mgTitle: "Vault Access", mgFlavor: "Replicate the embassy's security sequence." },
  { id: "c12", name: "The Kingpin", tier: 3, payout: 600000, rep: 800, duration: 120, baseChance: 0.28, heat: 55,
    minigame: "takedown", mgTitle: "Final Stand", mgFlavor: "Drop every last guard between you and him." },
];

const WEAPONS = [
  { id: "w1", name: "Rusty Pistol", cost: 0, bonus: 0.0, repReq: 0, starter: true },
  { id: "w2", name: "Suppressed 9mm", cost: 1500, bonus: 0.08, repReq: 0 },
  { id: "w3", name: "Combat Shotgun", cost: 2500, bonus: 0.15, repReq: 100 },
  { id: "w4", name: "Tactical SMG", cost: 6000, bonus: 0.2, repReq: 100 },
  { id: "w5", name: "Sniper Rifle", cost: 15000, bonus: 0.28, repReq: 400 },
  { id: "w6", name: "Custom Silenced Sniper", cost: 35000, bonus: 0.35, repReq: 400 },
  { id: "w7", name: "Twin Golden Deagles", cost: 80000, bonus: 0.45, repReq: 1000 },
];

const FLEX_ITEMS = {
  cars: [
    { id: "car1", name: "Used Sedan", cost: 22000, heatReduction: 0.02, payoutBoost: 0 },
    { id: "car2", name: "Motorcycle", cost: 14000, heatReduction: 0.04, payoutBoost: 0 },
    { id: "car3", name: "Sports Coupe", cost: 42000, heatReduction: 0.06, payoutBoost: 0.03 },
    { id: "car4", name: "Lamborghini", cost: 500000, heatReduction: 0.08, payoutBoost: 0.06 },
    { id: "car5", name: "Bugatti", cost: 3000000, heatReduction: 0.12, payoutBoost: 0.1 },
  ],
  watches: [
    { id: "watch1", name: "Steel Watch", cost: 150, repBoost: 0.02, payoutBoost: 0 },
    { id: "watch2", name: "Gold Watch", cost: 400, repBoost: 0.04, payoutBoost: 0 },
    { id: "watch3", name: "Diamond Rolex", cost: 35000, repBoost: 0.07, payoutBoost: 0.03 },
    { id: "watch4", name: "Patek Philippe", cost: 250000, repBoost: 0.1, payoutBoost: 0.05 },
    { id: "watch5", name: "Iced Richard Mille", cost: 600000, repBoost: 0.15, payoutBoost: 0.08 },
  ],
  necklaces: [
    { id: "neck1", name: "Silver Chain", cost: 300, heatReduction: 0.01, repBoost: 0 },
    { id: "neck2", name: "Gold Chain", cost: 2000, heatReduction: 0.02, repBoost: 0 },
    { id: "neck3", name: "Diamond Pendant", cost: 15000, heatReduction: 0.04, repBoost: 0.02 },
    { id: "neck4", name: "Iced Cuban Link", cost: 60000, heatReduction: 0.06, repBoost: 0.04 },
    { id: "neck5", name: "Custom Diamond Chain", cost: 150000, heatReduction: 0.1, repBoost: 0.06 },
  ],
  clothes: [
    { id: "cloth1", name: "Streetwear Fit", cost: 300, payoutBoost: 0.01, repBoost: 0 },
    { id: "cloth2", name: "Designer Fit", cost: 2000, payoutBoost: 0.03, repBoost: 0 },
    { id: "cloth3", name: "Tailored Suit", cost: 5000, payoutBoost: 0.05, repBoost: 0.02 },
    { id: "cloth4", name: "Luxury Brand Set", cost: 20000, payoutBoost: 0.08, repBoost: 0.04 },
    { id: "cloth5", name: "Custom Bespoke Wardrobe", cost: 75000, payoutBoost: 0.12, repBoost: 0.07 },
  ],
};

const SELL_RATE = 0.5; // fraction of original cost refunded when selling
const BILL_CYCLE_SECONDS = 86400; // how often rent/property tax comes due (24h) — can also be paid early

const HOUSES = {
  rent: [
    { id: "rent1", name: "Studio Apartment", rentCost: 1200, heatReduction: 0.02, repReq: 0 },
    { id: "rent2", name: "1BR Apartment", rentCost: 2200, heatReduction: 0.04, repReq: 0 },
    { id: "rent3", name: "Downtown Loft", rentCost: 4500, heatReduction: 0.06, repReq: 100 },
  ],
  buy: [
    { id: "buy1", name: "Suburban House", cost: 450000, taxCost: 500, heatReduction: 0.06, repReq: 0 },
    { id: "buy2", name: "Penthouse Condo", cost: 2500000, taxCost: 2500, heatReduction: 0.1, repReq: 400 },
    { id: "buy3", name: "Private Estate", cost: 12000000, taxCost: 8000, heatReduction: 0.15, repReq: 1000 },
    { id: "buy4", name: "Private Island Compound", cost: 45000000, taxCost: 20000, heatReduction: 0.2, repReq: 1000 },
  ],
};

const LAYLOW_ACTIONS = [
  { id: "ll1", name: "Quick Lay Low", desc: "Lie low for a bit, let things cool off.", cost: 500, heatRemoved: 10 },
  { id: "ll2", name: "Safehouse", desc: "Hole up somewhere off the grid.", cost: 3500, heatRemoved: 30 },
  { id: "ll3", name: "Full Blackout", desc: "Disappear completely for a while.", cost: 18000, heatRemoved: 70 },
];

// Agents work contracts on your behalf while you stay out of sight.
const AGENT_CYCLE_SECONDS = 60;
const AGENT_COST_GROWTH = 1.15; // cost multiplier per additional agent of that type already hired

const AGENTS = [
  { id: "agent1", name: "Street Runner", desc: "Runs small errands and collections for you.", cost: 5000, income: 300, heat: 0.3, repReq: 0 },
  { id: "agent2", name: "Wheelman", desc: "Handles getaways and courier work.", cost: 20000, income: 1200, heat: 0.5, repReq: 100 },
  { id: "agent3", name: "Enforcer", desc: "Takes on the rough jobs you'd rather skip.", cost: 80000, income: 5000, heat: 1, repReq: 400 },
  { id: "agent4", name: "Ghost Specialist", desc: "Elite operator, works clean and quiet.", cost: 300000, income: 20000, heat: 2, repReq: 1000 },
];

// Gear you buy to outfit hired agents. An agent needs all three slots filled
// (gun, clothing, car) before they're field-ready and start earning anything.
const AGENT_GEAR = {
  guns: [
    { id: "ag_side", name: "Sidearm", cost: 500, bonus: 0.05 },
    { id: "ag_smg", name: "SMG", cost: 1800, bonus: 0.12 },
    { id: "ag_rifle", name: "Rifle", cost: 5000, bonus: 0.2 },
  ],
  clothing: [
    { id: "ag_street", name: "Street Fit", cost: 300, bonus: 0.03 },
    { id: "ag_tactical", name: "Tactical Gear", cost: 1200, bonus: 0.08 },
    { id: "ag_disguise", name: "Clean Cover Disguise", cost: 3500, bonus: 0.15 },
  ],
  cars: [
    { id: "ag_beater", name: "Beater Car", cost: 800, bonus: 0.03 },
    { id: "ag_suv", name: "Blacked-out SUV", cost: 3000, bonus: 0.08 },
    { id: "ag_armored", name: "Armored Sedan", cost: 9000, bonus: 0.16 },
  ],
};

// Arms trafficking: buy stock from the Arms Dealer, resell via the phone.
const ARMS_CATALOG = [
  { id: "pistol", name: "Pistol", buyPrice: 300, sellPrice: 480, heat: 1 },
  { id: "revolver", name: "Revolver", buyPrice: 450, sellPrice: 700, heat: 1 },
  { id: "smg", name: "SMG", buyPrice: 900, sellPrice: 1450, heat: 2 },
  { id: "shotgun", name: "Shotgun", buyPrice: 700, sellPrice: 1150, heat: 2 },
  { id: "rifle", name: "Assault Rifle", buyPrice: 2200, sellPrice: 3600, heat: 3 },
  { id: "sniper", name: "Sniper Rifle", buyPrice: 5000, sellPrice: 8200, heat: 4 },
];

// Simulated crypto — starting prices are realistic ballpark figures, not live market data.
const CRYPTOS = [
  { id: "BTC", name: "Bitcoin", startPrice: 65000, volatility: 0.03, drift: 0.0012 },
  { id: "ETH", name: "Ethereum", startPrice: 3200, volatility: 0.045, drift: 0.0012 },
  { id: "DOGE", name: "Dogecoin", startPrice: 0.15, volatility: 0.09, drift: 0.0002 },
];

const BANK_INTEREST_CYCLE_SECONDS = 90;
const BANK_INTEREST_RATE = 0.01; // per cycle, on bank balance only
const ATM_FEE_RATE = 0.01; // fee taken on ATM withdrawals

// Casino: slot machine paytable (multiplier applies to a 3-of-a-kind match)
const SLOT_SYMBOLS = [
  { symbol: "🍒", weight: 30, payout: 2 },
  { symbol: "🔫", weight: 25, payout: 4 },
  { symbol: "💵", weight: 20, payout: 6 },
  { symbol: "💎", weight: 15, payout: 10 },
  { symbol: "👑", weight: 7, payout: 20 },
  { symbol: "7️⃣", weight: 3, payout: 50 },
];

// Casino: European single-zero roulette (0-36)
const ROULETTE_RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const ROULETTE_OUTSIDE_BETS = [
  { type: "red", label: "Red", mult: 2 },
  { type: "black", label: "Black", mult: 2 },
  { type: "odd", label: "Odd", mult: 2 },
  { type: "even", label: "Even", mult: 2 },
  { type: "low", label: "1-18", mult: 2 },
  { type: "high", label: "19-36", mult: 2 },
  { type: "dozen1", label: "1st 12", mult: 3 },
  { type: "dozen2", label: "2nd 12", mult: 3 },
  { type: "dozen3", label: "3rd 12", mult: 3 },
];
const ROULETTE_STRAIGHT_MULT = 36;

// Businesses: one-time purchases, own or don't. Passive income plus a real perk.
const BUSINESS_CYCLE_SECONDS = 60;

const BUSINESSES = [
  {
    id: "gunstore",
    name: "Gun Store",
    desc: "A legit storefront moving legal firearms up top.",
    cost: 150000,
    income: 2000,
    heatReduction: 0.03,
    perk: "weaponDiscount",
    perkAmount: 0.1,
    perkLabel: "-10% weapon prices",
    repReq: 0,
  },
  {
    id: "watchstore",
    name: "Watch Store",
    desc: "High-end timepieces, chains, and clothes on consignment.",
    cost: 200000,
    income: 2500,
    heatReduction: 0.03,
    perk: "flexDiscount",
    perkAmount: 0.1,
    perkLabel: "-10% flex item prices",
    repReq: 0,
  },
  {
    id: "recruitagency",
    name: "Recruit Agency",
    desc: "A staffing office that quietly screens new talent for you.",
    cost: 250000,
    income: 3000,
    heatReduction: 0.04,
    perk: "agentDiscount",
    perkAmount: 0.15,
    perkLabel: "-15% agent hire cost",
    repReq: 100,
  },
  {
    id: "cardealer",
    name: "Car Dealership",
    desc: "Moves cars on the lot — and off the books.",
    cost: 400000,
    income: 4000,
    heatReduction: 0.04,
    perk: "carDiscount",
    perkAmount: 0.15,
    perkLabel: "-15% car prices",
    repReq: 100,
  },
  {
    id: "cryptoexchange",
    name: "Crypto Exchange",
    desc: "Your own trading desk. Makes moving dirty money easier.",
    cost: 600000,
    income: 6000,
    heatReduction: 0.05,
    perk: "launderDiscount",
    perkAmount: 0.5,
    perkLabel: "-50% laundering fee",
    repReq: 400,
  },
  {
    id: "realestate",
    name: "Real Estate Office",
    desc: "Buys and flips property — including your own.",
    cost: 1000000,
    income: 10000,
    heatReduction: 0.06,
    perk: "houseDiscount",
    perkAmount: 0.1,
    perkLabel: "-10% house prices",
    repReq: 1000,
  },
];

// Drug dealing: buy stock from the Plug, sell to buyers who text in.
const DRUGS = [
  { id: "weed", name: "Weed", unit: "oz", buyPrice: 150, baseSellPrice: 220, heat: 1 },
  { id: "pens", name: "Weed Pens", unit: "pen", buyPrice: 40, baseSellPrice: 65, heat: 1 },
  { id: "shrooms", name: "Shrooms", unit: "oz", buyPrice: 200, baseSellPrice: 320, heat: 2 },
  { id: "coke", name: "Coke", unit: "gram", buyPrice: 60, baseSellPrice: 100, heat: 3 },
];

const DRUG_REQUEST_QTY_RANGE = {
  weed: [1, 5],
  pens: [2, 10],
  shrooms: [1, 3],
  coke: [1, 4],
};

const DRUG_REQUEST_EXPIRE_SECONDS = 90;
const DRUG_REQUEST_MIN_GAP_SECONDS = 30;
const DRUG_REQUEST_MAX_GAP_SECONDS = 60;
const DRUG_REQUEST_MAX_PENDING = 3;

const DRUG_COUNTER_OPTIONS = [
  { pct: 0.2, chance: 0.65, label: "Counter +20%" },
  { pct: 0.4, chance: 0.35, label: "Push +40%" },
];

const CONTACTS = [
  {
    id: "doc",
    name: "Doc",
    role: "Cleaner",
    effect: "heat",
    intro: "You know where to find me. Cash keeps the paperwork clean.",
    texts: [
      "Lay low. I've got people watching the wire.",
      "You're hotter than usual. Slow down.",
      "Don't call this number twice in one night.",
      "I heard about the mess uptown. That you?",
    ],
    thanks: [
      "Records are... handled. You're cooler now.",
      "Say no more. It's done.",
      "Consider the trail cold.",
    ],
  },
  {
    id: "crew",
    name: "Crew",
    role: "Associates",
    effect: "boost",
    intro: "We're geared up and waiting on your word, boss.",
    texts: [
      "We're ready when you are, boss.",
      "Word on the street says the Feds are sniffing around.",
      "Nice work out there. Keep it up.",
      "You good? Ain't heard from you in a while.",
    ],
    thanks: [
      "Appreciate it. We got your back next time.",
      "This buys a lot of loyalty. We're locked in.",
      "Boss knows how to take care of his people.",
    ],
  },
  {
    id: "fence",
    name: "The Fence",
    role: "Dealer",
    effect: "none",
    intro: "New stock moves fast. Don't sleep on it.",
    texts: [
      "Got a new shipment coming in. You'll want to see it.",
      "Prices are up. Everything's hot right now.",
      "Don't bring that heat near my shop.",
      "You still need that piece cleaned?",
    ],
    thanks: [
      "Pleasure doing business. Come by anytime.",
      "I'll remember this.",
      "Cash always talks.",
    ],
  },
  {
    id: "mom",
    name: "Mom",
    role: "❤",
    effect: "none",
    intro: "Call me when you get a chance, sweetheart.",
    texts: [
      "Are you eating enough? You look thin in that photo.",
      "When are you visiting? It's been months.",
      "Your cousin got engaged! Did you know?",
      "Whatever you're doing for work, be careful. I worry.",
    ],
    thanks: [
      "Thank you sweetheart, you didn't have to.",
      "I'm putting this toward your niece's birthday.",
      "You're a good kid, you know that?",
    ],
  },
  {
    id: "unknown",
    name: "Unknown Number",
    role: "???",
    effect: "none",
    intro: "...",
    texts: ["Wrong number.", "...", "Who gave you this number?", "Meet me. You know where. Or don't."],
    thanks: ["Interesting choice.", "Noted.", "We'll be in touch."],
  },
];

const PHONE_HEAT_PER_500 = 5; // Doc: heat removed per $500 sent
const PHONE_HEAT_CAP = 40;
const PHONE_BOOST_PER_1000 = 0.02; // Crew: next-job success bonus per $1000 sent
const PHONE_BOOST_CAP = 0.2;
