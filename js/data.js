// Static game content: contracts, weapons, flex items, reputation tiers

const TIERS = [
  { name: "Street Hitter", repReq: 0 },
  { name: "Fixer", repReq: 100 },
  { name: "Ghost", repReq: 400 },
  { name: "Legend", repReq: 1000 },
  { name: "Kingmaker", repReq: 1800 },
  { name: "Shadow Don", repReq: 2500 },
  // Beyond Shadow Don — ranks keep climbing all the way to the rep cap, so there's
  // always another promotion to chase instead of flatlining for the rest of the game.
  { name: "Crime Lord", repReq: 6000 },
  { name: "Underworld Kingpin", repReq: 12000 },
  { name: "Untouchable", repReq: 25000 },
  { name: "Ghost Emperor", repReq: 45000 },
  { name: "Living Legend", repReq: 70000 },
  { name: "Immortal", repReq: 100000 },
];

function tierForRep(rep) {
  let idx = 0;
  for (let i = 0; i < TIERS.length; i++) {
    if (rep >= TIERS[i].repReq) idx = i;
  }
  return idx;
}

const MAX_REP = 100000;
const MAX_LEVEL = 1000;
const REP_PER_LEVEL = MAX_REP / MAX_LEVEL; // 100 rep per level

function levelForRep(rep) {
  return Math.max(1, Math.min(MAX_LEVEL, Math.floor(rep / REP_PER_LEVEL) + 1));
}

// World / city system — Detroit is home base, free. Other cities need a private jet owned
// (any FLEX_ITEMS.jets item) to fly to. Each city unlocks its own exclusive contracts.
const CITIES = [
  { id: "detroit", name: "Detroit", desc: "Home base. Where it all started.", requiresJet: false },
  { id: "miami", name: "Miami", desc: "Luxury nightlife, yachts, and cartel money.", requiresJet: true },
  { id: "tokyo", name: "Tokyo", desc: "A high-end underground market most crews never see.", requiresJet: true },
];
const TRAVEL_COST = 5000;

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
  { id: "c12", name: "The Kingpin", tier: 3, unlockRep: 1350, payout: 600000, rep: 800, duration: 120, baseChance: 0.28, heat: 55,
    minigame: "takedown", mgTitle: "Final Stand", mgFlavor: "Drop every last guard between you and him." },
  // Tier 4 - Kingmaker
  { id: "c13", name: "Silence the Board", tier: 4, unlockRep: 2150, payout: 800000, rep: 950, duration: 100, baseChance: 0.25, heat: 60,
    minigame: "pattern", mgTitle: "Corporate Coup", mgFlavor: "Erase every trace before the board convenes." },
  // Tier 5 - Shadow Don
  { id: "c14", name: "Take the Crown", tier: 5, unlockRep: 3200, payout: 1100000, rep: 1200, duration: 130, baseChance: 0.22, heat: 68,
    minigame: "takedown", mgTitle: "Seize the Throne", mgFlavor: "Drop everyone standing between you and the top." },
  // Miami exclusive — requires flying in on a private jet
  { id: "c15", name: "Yacht Party Hit", city: "miami", tier: 3, payout: 500000, rep: 700, duration: 90, baseChance: 0.3, heat: 50,
    minigame: "reflex", mgTitle: "Deck Ambush", mgFlavor: "Catch him alone between the bar and the stern." },
  { id: "c16", name: "Nightclub Kingpin", city: "miami", tier: 4, payout: 900000, rep: 1000, duration: 110, baseChance: 0.26, heat: 62,
    minigame: "pattern", mgTitle: "VIP Access", mgFlavor: "Match the doorman's code before the set ends." },
  { id: "c17", name: "Cartel Meeting", city: "miami", tier: 5, payout: 1300000, rep: 1300, duration: 140, baseChance: 0.2, heat: 72,
    minigame: "takedown", mgTitle: "The Sit-Down", mgFlavor: "Every man at the table is armed. Move first." },
  // Tokyo exclusive — requires flying in on a private jet
  { id: "c18", name: "Shibuya Shakedown", city: "tokyo", tier: 3, payout: 550000, rep: 720, duration: 95, baseChance: 0.29, heat: 52,
    minigame: "timing", mgTitle: "Crossing Handoff", mgFlavor: "Slip the package across at the exact light change." },
  { id: "c19", name: "Yakuza Lieutenant", city: "tokyo", tier: 4, payout: 950000, rep: 1050, duration: 115, baseChance: 0.25, heat: 64,
    minigame: "reflex", mgTitle: "Back Room", mgFlavor: "He only turns his back once. Take it." },
  { id: "c20", name: "Underground Auction", city: "tokyo", tier: 5, payout: 1400000, rep: 1350, duration: 145, baseChance: 0.19, heat: 74,
    minigame: "pattern", mgTitle: "Bidder's Vault", mgFlavor: "Crack the lot case before the gavel falls." },
];

// Rotating special contract — one is always live, and it swaps out for a new one every
// few days on real-world time, so it's the same target for every player at once (no
// server needed — the "slot" is just derived from the current date). Pays well above a
// normal contract at the same tier, and can only be completed once per rotation.
const SPECIAL_ROTATION_DAYS = 3;
const SPECIAL_ROTATION_MS = SPECIAL_ROTATION_DAYS * 24 * 60 * 60 * 1000;

const SPECIAL_CONTRACTS = [
  { id: "sp1", special: true, name: "The Informant's Tip", tier: 0, payout: 1400, rep: 10, duration: 6, baseChance: 0.7, heat: 5,
    minigame: "reflex", mgTitle: "Burn the Source", mgFlavor: "He's about to talk. Get to him first." },
  { id: "sp2", special: true, name: "High-Value Target", tier: 1, payout: 10000, rep: 45, duration: 22, baseChance: 0.5, heat: 20,
    minigame: "pattern", mgTitle: "Breach the Safehouse", mgFlavor: "Every second past the code adds risk." },
  { id: "sp3", special: true, name: "The Big Score", tier: 2, payout: 68000, rep: 150, duration: 48, baseChance: 0.38, heat: 34,
    minigame: "timing", mgTitle: "The Exchange", mgFlavor: "One shot to make the handoff clean." },
  { id: "sp4", special: true, name: "Federal Witness", tier: 3, payout: 380000, rep: 520, duration: 85, baseChance: 0.3, heat: 48,
    minigame: "reflex", mgTitle: "Silence the Witness", mgFlavor: "The trial starts tomorrow. He doesn't make it." },
  { id: "sp5", special: true, name: "Rival Family Boss", tier: 4, payout: 1000000, rep: 1000, duration: 105, baseChance: 0.24, heat: 58,
    minigame: "takedown", mgTitle: "Take the Compound", mgFlavor: "His whole crew is between you and him." },
  { id: "sp6", special: true, name: "The Ghost Contract", tier: 5, payout: 1600000, rep: 1400, duration: 135, baseChance: 0.2, heat: 70,
    minigame: "pattern", mgTitle: "No Trace Left", mgFlavor: "Whoever this is, they were never here." },
];

function currentSpecialSlot() {
  return Math.floor(Date.now() / SPECIAL_ROTATION_MS);
}
function currentSpecialContract() {
  return SPECIAL_CONTRACTS[currentSpecialSlot() % SPECIAL_CONTRACTS.length];
}
function nextSpecialRotationAt() {
  return (currentSpecialSlot() + 1) * SPECIAL_ROTATION_MS;
}

const WEAPONS = [
  { id: "w1", name: "Rusty Pistol", cost: 0, bonus: 0.0, repReq: 0, starter: true },
  { id: "w2", name: "Suppressed 9mm", cost: 1700, bonus: 0.08, repReq: 0 },
  { id: "w3", name: "Combat Shotgun", cost: 2800, bonus: 0.15, repReq: 100 },
  { id: "w4", name: "Tactical SMG", cost: 6700, bonus: 0.2, repReq: 100 },
  { id: "w5", name: "Sniper Rifle", cost: 17000, bonus: 0.28, repReq: 400 },
  { id: "w6", name: "Custom AR-15", cost: 39000, bonus: 0.35, repReq: 400 },
  { id: "w7", name: "Twin Golden Deagles", cost: 90000, bonus: 0.45, repReq: 1000 },
];

const FLEX_ITEMS = {
  cars: [
    { id: "car1", name: "Used Sedan", cost: 25000, heatReduction: 0.02, payoutBoost: 0 },
    { id: "car2", name: "Motorcycle", cost: 16000, heatReduction: 0.04, payoutBoost: 0 },
    { id: "car10", name: "JDM Tuner", cost: 43000, heatReduction: 0.04, payoutBoost: 0.015 },
    { id: "car3", name: "Sports Coupe", cost: 47000, heatReduction: 0.06, payoutBoost: 0.03 },
    { id: "car6", name: "Pickup Truck", cost: 54000, heatReduction: 0.03, payoutBoost: 0.02 },
    { id: "car11", name: "Muscle Car", cost: 58000, heatReduction: 0.035, payoutBoost: 0.025 },
    { id: "car7", name: "Luxury Sedan", cost: 135000, heatReduction: 0.05, payoutBoost: 0.04 },
    { id: "car8", name: "Supercar", cost: 315000, heatReduction: 0.07, payoutBoost: 0.055 },
    { id: "car4", name: "Lamborghini", cost: 560000, heatReduction: 0.08, payoutBoost: 0.06 },
    { id: "car14", name: "Ferrari 488", cost: 620000, heatReduction: 0.085, payoutBoost: 0.065 },
    { id: "car13", name: "McLaren 720S", cost: 680000, heatReduction: 0.09, payoutBoost: 0.07 },
    { id: "car15", name: "Lamborghini Revuelto", cost: 780000, heatReduction: 0.095, payoutBoost: 0.075 },
    { id: "car5", name: "Bugatti", cost: 3400000, heatReduction: 0.12, payoutBoost: 0.1 },
    { id: "car9", name: "Hypercar", cost: 3900000, heatReduction: 0.13, payoutBoost: 0.11 },
    { id: "car12", name: "Track Hypercar", cost: 4700000, heatReduction: 0.14, payoutBoost: 0.12 },
  ],
  jets: [
    { id: "jet3", name: "Cirrus Vision Jet", cost: 6000000, heatReduction: 0.15, payoutBoost: 0.12 },
    { id: "jet4", name: "HondaJet", cost: 9000000, heatReduction: 0.16, payoutBoost: 0.135 },
    { id: "jet2", name: "Gulfstream Private Jet", cost: 22000000, heatReduction: 0.19, payoutBoost: 0.16 },
    { id: "jet5", name: "Gulfstream G650ER", cost: 38000000, heatReduction: 0.205, payoutBoost: 0.175 },
    { id: "jet1", name: "Gulfstream G700", cost: 55000000, heatReduction: 0.22, payoutBoost: 0.19 },
  ],
  watches: [
    { id: "watch1", name: "Steel Watch", cost: 170, repBoost: 0.02, payoutBoost: 0 },
    { id: "watch2", name: "Gold Watch", cost: 450, repBoost: 0.04, payoutBoost: 0 },
    { id: "watch6", name: "Chronograph", cost: 6700, repBoost: 0.05, payoutBoost: 0.01 },
    { id: "watch10", name: "Two-Tone Datejust", cost: 11000, repBoost: 0.055, payoutBoost: 0.015 },
    { id: "watch7", name: "Dive Watch", cost: 15500, repBoost: 0.06, payoutBoost: 0.02 },
    { id: "watch3", name: "Diamond Rolex", cost: 39000, repBoost: 0.07, payoutBoost: 0.03 },
    { id: "watch8", name: "Royal Oak", cost: 50000, repBoost: 0.08, payoutBoost: 0.035 },
    { id: "watch9", name: "Nautilus", cost: 135000, repBoost: 0.09, payoutBoost: 0.045 },
    { id: "watch11", name: "RM Carbon Skeleton", cost: 200000, repBoost: 0.095, payoutBoost: 0.048 },
    { id: "watch4", name: "Patek Philippe", cost: 280000, repBoost: 0.1, payoutBoost: 0.05 },
    { id: "watch5", name: "Iced Richard Mille", cost: 675000, repBoost: 0.15, payoutBoost: 0.08 },
    { id: "watch12", name: "RM Tourbillon", cost: 950000, repBoost: 0.17, payoutBoost: 0.09 },
    { id: "watch13", name: "RM Skull Edition", cost: 1350000, repBoost: 0.2, payoutBoost: 0.1 },
  ],
  necklaces: [
    { id: "neck1", name: "Silver Chain", cost: 300, heatReduction: 0.01, repBoost: 0 },
    { id: "neck6", name: "Pearl Necklace", cost: 600, heatReduction: 0.015, repBoost: 0.005 },
    { id: "neck2", name: "Gold Chain", cost: 2000, heatReduction: 0.02, repBoost: 0 },
    { id: "neck3", name: "Diamond Pendant", cost: 15000, heatReduction: 0.04, repBoost: 0.02 },
    { id: "neck7", name: "Diamond Tennis Chain", cost: 25000, heatReduction: 0.05, repBoost: 0.03 },
    { id: "neck4", name: "Iced Cuban Link", cost: 60000, heatReduction: 0.06, repBoost: 0.04 },
    { id: "neck8", name: "VVS Diamond Chain", cost: 100000, heatReduction: 0.08, repBoost: 0.05 },
    { id: "neck5", name: "Custom Diamond Chain", cost: 150000, heatReduction: 0.1, repBoost: 0.06 },
  ],
  clothes: [
    { id: "cloth1", name: "Streetwear Fit", cost: 300, payoutBoost: 0.01, repBoost: 0 },
    { id: "cloth2", name: "Designer Fit", cost: 2000, payoutBoost: 0.03, repBoost: 0 },
    { id: "cloth6", name: "Business Suit", cost: 3500, payoutBoost: 0.04, repBoost: 0.01 },
    { id: "cloth3", name: "Tailored Suit", cost: 5000, payoutBoost: 0.05, repBoost: 0.02 },
    { id: "cloth7", name: "Formal Black Suit", cost: 8000, payoutBoost: 0.06, repBoost: 0.03 },
    { id: "cloth4", name: "Luxury Brand Set", cost: 20000, payoutBoost: 0.08, repBoost: 0.04 },
    { id: "cloth8", name: "LV Varsity Fit", cost: 45000, payoutBoost: 0.1, repBoost: 0.055 },
    { id: "cloth5", name: "Custom Bespoke Wardrobe", cost: 75000, payoutBoost: 0.12, repBoost: 0.07 },
  ],
};

const SELL_RATE = 0.5; // fraction of original cost refunded when selling
const BILL_CYCLE_SECONDS = 86400; // how often rent/property tax comes due (24h) — can also be paid early
const MAX_RENTALS = 2; // apartments you can rent at once, on top of 1 owned house

const HOUSES = {
  rent: [
    { id: "rent1", name: "Studio Apartment", rentCost: 1350, heatReduction: 0.02, repReq: 0 },
    { id: "rent2", name: "1BR Apartment", rentCost: 2500, heatReduction: 0.04, repReq: 0 },
    { id: "rent3", name: "Downtown Loft", rentCost: 5000, heatReduction: 0.06, repReq: 100 },
    { id: "rent4", name: "Luxury High-Rise", rentCost: 9000, heatReduction: 0.08, repReq: 400 },
  ],
  buy: [
    { id: "buy1", name: "Suburban House", cost: 500000, taxCost: 550, heatReduction: 0.06, repReq: 0 },
    { id: "buy5", name: "Luxury Condo", cost: 1350000, taxCost: 1350, heatReduction: 0.08, repReq: 100 },
    { id: "buy2", name: "Penthouse Condo", cost: 2800000, taxCost: 2800, heatReduction: 0.1, repReq: 400 },
    { id: "buy6", name: "Beachfront Villa", cost: 6700000, taxCost: 5600, heatReduction: 0.12, repReq: 1000 },
    { id: "buy3", name: "Private Estate", cost: 13500000, taxCost: 9000, heatReduction: 0.15, repReq: 1000 },
    { id: "buy10", name: "Modern Glass Estate", cost: 18000000, taxCost: 11000, heatReduction: 0.165, repReq: 1400 },
    { id: "buy7", name: "Mega Mansion", cost: 28000000, taxCost: 17000, heatReduction: 0.18, repReq: 1800 },
    { id: "buy9", name: "Royal Estate", cost: 39000000, taxCost: 20000, heatReduction: 0.19, repReq: 1800 },
    { id: "buy4", name: "Private Island Compound", cost: 50000000, taxCost: 22000, heatReduction: 0.2, repReq: 1000 },
    { id: "buy8", name: "Sky Penthouse", cost: 90000000, taxCost: 34000, heatReduction: 0.22, repReq: 2500 },
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
  { id: "smg", name: "SMG", buyPrice: 900, sellPrice: 1450, heat: 2 },
  { id: "shotgun", name: "Shotgun", buyPrice: 700, sellPrice: 1150, heat: 2 },
  { id: "rifle", name: "Assault Rifle", buyPrice: 2200, sellPrice: 3600, heat: 3 },
  { id: "sniper", name: "Heavy SMG", buyPrice: 5000, sellPrice: 8200, heat: 4 },
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

const DRUG_REQUEST_EXPIRE_SECONDS = 180;
const DRUG_REQUEST_MIN_GAP_SECONDS = 30;
const DRUG_REQUEST_MAX_GAP_SECONDS = 60;
const DRUG_REQUEST_BASE_PENDING = 3;
const DRUG_REQUEST_MAX_PENDING_CAP = 8;

const DRUG_COUNTER_OPTIONS = [
  { pct: 0.2, chance: 0.65, label: "Counter +20%" },
  { pct: 0.4, chance: 0.35, label: "Push +40%" },
];

// Gun orders: buyers text in wanting specific stock from your arms inventory.
const GUN_ORDER_QTY_RANGE = {
  pistol: [1, 3],
  smg: [1, 2],
  shotgun: [1, 2],
  rifle: [1, 1],
  sniper: [1, 2],
};
const GUN_ORDER_EXPIRE_SECONDS = 180;
const GUN_ORDER_MIN_GAP_SECONDS = 35;
const GUN_ORDER_MAX_GAP_SECONDS = 70;
const GUN_ORDER_BASE_PENDING = 3;
const GUN_ORDER_MAX_PENDING_CAP = 8;
const GUN_COUNTER_OPTIONS = [
  { pct: 0.2, chance: 0.65, label: "Counter +20%" },
  { pct: 0.4, chance: 0.35, label: "Push +40%" },
];

// Watch dealing: buy stock from a supplier, sell to buyers who text in — same loop as drugs/guns.
const WATCH_SUPPLIER_CATALOG = [
  { id: "watchcheap", name: "Knockoff Watch", buyPrice: 80, sellPrice: 140, heat: 1 },
  { id: "watchsteel", name: "Steel Chronograph", buyPrice: 300, sellPrice: 520, heat: 1 },
  { id: "watchgold", name: "Gold Diver", buyPrice: 900, sellPrice: 1600, heat: 2 },
  { id: "watchdiamond", name: "Diamond Bezel", buyPrice: 2500, sellPrice: 4400, heat: 2 },
  { id: "watchiced", name: "Iced-Out Piece", buyPrice: 6000, sellPrice: 10500, heat: 3 },
];
const WATCH_ORDER_QTY_RANGE = {
  watchcheap: [1, 4],
  watchsteel: [1, 3],
  watchgold: [1, 2],
  watchdiamond: [1, 2],
  watchiced: [1, 1],
};
const WATCH_ORDER_EXPIRE_SECONDS = 180;
const WATCH_ORDER_MIN_GAP_SECONDS = 32;
const WATCH_ORDER_MAX_GAP_SECONDS = 65;
const WATCH_ORDER_BASE_PENDING = 3;
const WATCH_ORDER_MAX_PENDING_CAP = 8;
const WATCH_COUNTER_OPTIONS = [
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
