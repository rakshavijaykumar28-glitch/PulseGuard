// src/demo-data.js - Generates the realistic 90-day dataset for Heritage Bites
const { db } = require('./db');

function seedDemoData() {
  // Clear existing demo tables
  db.exec(`
    DELETE FROM risk_evidence;
    DELETE FROM recommendations;
    DELETE FROM actions;
    DELETE FROM risk_history;
    DELETE FROM risks;
    DELETE FROM sales;
    DELETE FROM inventory;
    DELETE FROM complaints;
    DELETE FROM deliveries;
    DELETE FROM suppliers;
    DELETE FROM scenarios;
    DELETE FROM chat_messages;
    DELETE FROM reports;
    DELETE FROM businesses;
    DELETE FROM users;
    DELETE FROM sqlite_sequence;
  `);

  // Insert User with explicit ID 1
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, role)
    VALUES (1, ?, ?, ?)
  `);
  insertUser.run('owner@heritagebites.com', 'Vikram Malhotra', 'Restaurant Owner');

  // Insert Business with explicit ID 1
  const insertBiz = db.prepare(`
    INSERT INTO businesses (id, name, industry, type, currency, health_score)
    VALUES (1, ?, ?, ?, ?, ?)
  `);
  insertBiz.run(
    'Heritage Bites',
    'Food & Beverage',
    'Casual Dining & Delivery',
    '₹',
    68
  );
  const businessId = 1;

  // Generate 90 days of dates ending today (2026-10-03)
  const endDate = new Date('2026-10-03');
  const dates = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date(endDate);
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }

  // Insert Suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (business_id, name, item_supplied, delivery_time, reliability, trend, status, contact)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSupplier.run(
    businessId,
    'Fresh Poultry Co',
    'Raw Chicken (Premium Cuts)',
    0.8,
    91.0,
    'Stable',
    'Backup / Secondary',
    '+91 98201 44552'
  );
  insertSupplier.run(
    businessId,
    'Apex Meat Logistics',
    'Raw Chicken & Mutton',
    2.7,
    62.0,
    'Declining',
    'Primary',
    '+91 98450 11289'
  );
  insertSupplier.run(
    businessId,
    'Evergreen Dairy Hub',
    'Paneer, Cream & Butter',
    1.1,
    88.0,
    'Stable',
    'Primary',
    '+91 97110 33490'
  );
  insertSupplier.run(
    businessId,
    'Golden Fields Wholesale',
    'Cooking Oil & Spices',
    1.4,
    94.0,
    'Stable',
    'Primary',
    '+91 99200 88211'
  );

  // Prepare insert statements
  const insertSale = db.prepare(`
    INSERT INTO sales (business_id, date, product, quantity, revenue, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertInventory = db.prepare(`
    INSERT INTO inventory (business_id, date, product, stock_level, unit, unit_cost)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (business_id, date, category, text, rating, resolved)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertDelivery = db.prepare(`
    INSERT INTO deliveries (business_id, date, supplier, expected_date, actual_date, delay_days, item, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Generate 90 days of Sales & Inventory
  dates.forEach((dateStr, idx) => {
    const d = new Date(dateStr);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5);
    
    // In the last 28 days (idx >= 62), weekend chicken demand accelerates by +31%
    const isRecentPeriod = idx >= 62;
    let chickenFactor = 1.0;
    if (isRecentPeriod) {
      // gradual increase culminating at +31%
      chickenFactor = 1.0 + 0.31 * ((idx - 61) / 28);
    }

    // Chicken Dish Sales
    const weekendMultiplier = isWeekend ? 1.45 : 0.95;
    const chickenKgSold = Math.round((14.0 * weekendMultiplier * chickenFactor) * 10) / 10;
    const chickenRevenue = Math.round(chickenKgSold * 320); // avg plate & revenue per kg sold
    insertSale.run(businessId, dateStr, 'Butter Chicken & Biryani (Poultry)', chickenKgSold, chickenRevenue, 'Main Course');

    // Paneer Dish Sales
    const paneerKgSold = Math.round((8.5 * (isWeekend ? 1.25 : 1.0)) * 10) / 10;
    const paneerRevenue = Math.round(paneerKgSold * 280);
    insertSale.run(businessId, dateStr, 'Paneer Tikka & Curries', paneerKgSold, paneerRevenue, 'Vegetarian');

    // Bread & Rice Sales
    const carbKg = Math.round((22.0 * (isWeekend ? 1.3 : 1.0)) * 10) / 10;
    const carbRevenue = Math.round(carbKg * 95);
    insertSale.run(businessId, dateStr, 'Naan, Roti & Rice', carbKg, carbRevenue, 'Staple');

    // Cooking Oil usage
    const oilUsed = Math.round((2.0 * (isWeekend ? 1.3 : 1.0)) * 10) / 10;
    insertSale.run(businessId, dateStr, 'Refined Sunflower Oil', oilUsed, Math.round(oilUsed * 140), 'Ingredient');

    // Inventory calculation for Chicken
    // Baseline was ~50kg. In the last 4 weeks, with rising demand and delayed deliveries, stock slips down to 38kg.
    let chickenStock;
    if (idx < 62) {
      chickenStock = 50 - (idx % 7) * 2.5 + ((idx % 7 === 0) ? 18 : 0);
    } else {
      // declining trend to 38.0 kg on the last day (-24% vs baseline safety stock of 50kg)
      const progress = (idx - 62) / 27;
      chickenStock = 50.0 - (progress * 12.0) - (isWeekend ? 4.5 : 1.0) + ((idx % 7 === 1) ? 10 : 0);
      chickenStock = Math.max(38.0, Math.round(chickenStock * 10) / 10);
    }
    // ensure last day is exactly 38.0 kg (-24% from 50kg baseline)
    if (idx === 89) chickenStock = 38.0;

    insertInventory.run(businessId, dateStr, 'Raw Chicken (Poultry)', chickenStock, 'kg', 185.0);

    // Cooking Oil stock: 240L bulk overstock
    const oilStock = Math.round(250 - (idx * 0.3));
    insertInventory.run(businessId, dateStr, 'Sunflower Cooking Oil', oilStock, 'liters', 135.0);

    // Paneer stock: healthy turnover
    const paneerStock = Math.round((18 - (idx % 3) * 4) * 10) / 10;
    insertInventory.run(businessId, dateStr, 'Fresh Dairy Paneer', Math.max(8, paneerStock), 'kg', 240.0);
  });

  // Seed Deliveries with realistic Apex Meat Logistics delays (+18% delay increase, up to 2.7 days)
  for (let i = 0; i < 90; i += 4) {
    const dStr = dates[i];
    const isRecent = i >= 60;
    
    // Apex delivery
    const expectedD = new Date(dStr);
    expectedD.setDate(expectedD.getDate() + 1);
    const actualD = new Date(expectedD);
    const delayDays = isRecent ? (Math.random() > 0.3 ? (1.5 + Math.random() * 2.0) : 0.8) : (Math.random() > 0.8 ? 1.0 : 0.2);
    actualD.setDate(actualD.getDate() + Math.round(delayDays));

    insertDelivery.run(
      businessId,
      dStr,
      'Apex Meat Logistics',
      expectedD.toISOString().slice(0, 10),
      actualD.toISOString().slice(0, 10),
      Math.round(delayDays * 10) / 10,
      'Chicken & Mutton Batch',
      delayDays > 1.5 ? 'Delayed' : 'Delivered'
    );

    // Fresh Poultry Co backup delivery (monthly)
    if (i % 20 === 0) {
      const exp = new Date(dStr);
      exp.setDate(exp.getDate() + 1);
      insertDelivery.run(
        businessId,
        dStr,
        'Fresh Poultry Co',
        exp.toISOString().slice(0, 10),
        exp.toISOString().slice(0, 10),
        0.2,
        'Backup Chicken Stock',
        'Delivered'
      );
    }
  }

  // Seed Customer Complaints & Ratings
  // In the last 15 days, complaints surge (+17% overall) with explicit mention of unavailable chicken / 86'd dishes
  const sampleComplaints = [
    { cat: 'unavailable items', text: 'Came specifically for the Butter Chicken at 8:45 PM and the server told us it was sold out! Very disappointing.', rating: 2, daysAgo: 2 },
    { cat: 'unavailable items', text: 'Ordered Chicken Biryani on Swiggy, restaurant cancelled after 20 minutes saying stock ran out.', rating: 1, daysAgo: 3 },
    { cat: 'unavailable items', text: 'Half the non-veg menu was marked unavailable on a Friday evening. How does a famous restaurant run out of chicken?', rating: 2, daysAgo: 4 },
    { cat: 'unavailable items', text: 'Had to change my order twice because chicken was over. Ended up with paneer which was okay but not what I wanted.', rating: 3, daysAgo: 5 },
    { cat: 'unavailable items', text: 'Chicken Tikka unavailable on Saturday night. Poor planning by kitchen management.', rating: 2, daysAgo: 7 },
    { cat: 'waiting time', text: 'Food took 45 minutes to arrive. Kitchen seemed chaotic and staff looked stressed.', rating: 2, daysAgo: 3 },
    { cat: 'waiting time', text: 'Delivery rider was waiting outside for 35 minutes for order preparation.', rating: 2, daysAgo: 6 },
    { cat: 'food quality', text: 'Dal Makhani was delicious and piping hot as always.', rating: 5, daysAgo: 8 },
    { cat: 'food quality', text: 'Garlic naan was a bit burnt at the edges today.', rating: 3, daysAgo: 9 },
    { cat: 'staff experience', text: 'The waiter was polite and apologetic about the missing chicken dishes.', rating: 4, daysAgo: 4 },
    { cat: 'delivery', text: 'Packaging was intact and curry was sealed properly.', rating: 5, daysAgo: 10 },
    { cat: 'pricing', text: 'Portion sizes have slightly shrunk for the price charged.', rating: 3, daysAgo: 12 },
    { cat: 'unavailable items', text: 'Ordered Tandoori Chicken, waiter returned after 15 mins to say kitchen ran out.', rating: 1, daysAgo: 1 },
    { cat: 'unavailable items', text: 'No chicken dishes available for late dinner. We walked out.', rating: 1, daysAgo: 1 }
  ];

  sampleComplaints.forEach((c) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - c.daysAgo);
    insertComplaint.run(businessId, d.toISOString().slice(0, 10), c.cat, c.text, c.rating, 0);
  });

  // Older baseline complaints
  const olderComplaints = [
    { cat: 'waiting time', text: 'Had to wait 15 minutes for a table on Sunday.', rating: 3, daysAgo: 35 },
    { cat: 'food quality', text: 'Biryani was slightly too spicy.', rating: 3, daysAgo: 42 },
    { cat: 'staff experience', text: 'Great service by captain Ramesh.', rating: 5, daysAgo: 50 },
    { cat: 'pricing', text: 'A bit expensive compared to street food but hygienic.', rating: 4, daysAgo: 60 },
    { cat: 'delivery', text: 'Rider took longer to navigate our lane.', rating: 3, daysAgo: 70 }
  ];
  olderComplaints.forEach((c) => {
    const d = new Date(endDate);
    d.setDate(d.getDate() - c.daysAgo);
    insertComplaint.run(businessId, d.toISOString().slice(0, 10), c.cat, c.text, c.rating, 1);
  });

  // Insert Deterministic Risks
  const insertRisk = db.prepare(`
    INSERT INTO risks (
      business_id, risk_key, title, category, severity, risk_score,
      probability, impact_min, impact_max, urgency, summary, days_remaining,
      root_cause_json, cost_of_inaction_json, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Risk 1: HERO RISK - Chicken Inventory Stockout
  const chickenRootCause = JSON.stringify({
    title: "Chicken Stockout Risk",
    stages: [
      {
        node: "Demand Increase (+31%)",
        detail: "Weekend traffic & delivery volume up 31% over past 4 weeks",
        type: "demand"
      },
      {
        node: "Supplier Delay (+18%)",
        detail: "Apex Meat Logistics delivery lag expanded from 1.2 to 2.7 days",
        type: "supplier"
      },
      {
        node: "Current Inventory (-24%)",
        detail: "Stock depleted to 38.0 kg against weekend burn rate of ~15.8 kg/day",
        type: "inventory"
      },
      {
        node: "Customer Friction (+17%)",
        detail: "14 customer complaints registered for 86'd / unavailable chicken items",
        type: "sentiment"
      },
      {
        node: "HIGH STOCKOUT RISK (2.4 Days)",
        detail: "Stockout projected mid-weekend (Saturday evening rush)",
        type: "outcome"
      }
    ]
  });

  const chickenCostOfInaction = JSON.stringify({
    estimated_revenue_loss_min: 18400,
    estimated_revenue_loss_max: 25000,
    affected_orders_min: 73,
    affected_orders_max: 96,
    additional_operational_cost: 3200,
    escalation_probability: "High (89% within 48h)",
    customer_impact_summary: "Negative reviews on Google/Swiggy; permanent churn of high-LTV weekend diner groups."
  });

  const r1 = insertRisk.run(
    businessId,
    'risk_chicken_stockout',
    'Potential chicken stockout in approximately 2.4 days',
    'Inventory & Supply Chain',
    'CRITICAL',
    82,
    0.78,
    18400,
    25000,
    'High',
    'Weekend demand for chicken-based meals increased 31% over the last four weeks while primary supplier delivery time increased 18%. Current inventory is insufficient to cover projected weekend demand.',
    2.4,
    chickenRootCause,
    chickenCostOfInaction,
    'Active'
  );
  const risk1Id = r1.lastInsertRowid;

  // Evidence for Risk 1
  const insertEvidence = db.prepare(`
    INSERT INTO risk_evidence (risk_id, metric_name, metric_category, change_percentage, baseline_value, current_value, observation, direction, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertEvidence.run(
    risk1Id,
    'Chicken Dish Sales (Weekend Demand)',
    'Sales',
    31.0,
    '17.4 kg/weekend day',
    '22.8 kg/weekend day',
    'Surge driven by Butter Chicken and Chicken Biryani dine-in & delivery orders',
    'up',
    0.92
  );
  insertEvidence.run(
    risk1Id,
    'Supplier Delivery Delay (Apex Meat)',
    'Supplier',
    18.0,
    '1.2 days avg turnaround',
    '2.7 days avg turnaround',
    'Apex Meat Logistics reliability dropped to 62%, failing weekend delivery SLA',
    'up',
    0.88
  );
  insertEvidence.run(
    risk1Id,
    'Raw Chicken Stock Level',
    'Inventory',
    -24.0,
    '50.0 kg safety stock',
    '38.0 kg on hand',
    'Depletion rate currently outpaces replenishment velocity by 1.6x',
    'down',
    0.95
  );
  insertEvidence.run(
    risk1Id,
    'Related Customer Complaints',
    'Customer Sentiment',
    17.0,
    '1.2 complaints/week',
    '14 complaints in last 10 days',
    'Direct customer complaints specifically citing unavailable/cancelled chicken items',
    'up',
    0.89
  );

  // Recommendations for Risk 1
  const insertRec = db.prepare(`
    INSERT INTO recommendations (risk_id, priority, title, action_type, description, expected_benefit)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertRec.run(
    risk1Id,
    1,
    'Increase Next Order by 35% & Contact Apex Today',
    'procurement',
    'Place an immediate expedited order for 45 kg raw chicken with Apex Meat Logistics for delivery before Friday 2 PM.',
    'Restores reserve stock buffer to 65 kg and prevents weekend stockout.'
  );
  insertRec.run(
    risk1Id,
    2,
    'Activate Fresh Poultry Co as Backup Supplier',
    'supplier',
    'Trigger standing secondary supplier agreement with Fresh Poultry Co (91% reliability, 0.8 day turnaround) for 25 kg split shipment.',
    'De-risks single-supplier bottleneck and guarantees Saturday dinner service.'
  );
  insertRec.run(
    risk1Id,
    3,
    'Shift Digital Menu Promotions to Paneer & Special Thalis',
    'operations',
    'Temporarily pause Swiggy/Zomato banner promotion on Chicken Biryani and promote Paneer Tikka Feast and Dal Makhani Platters.',
    'Balances kitchen load and protects customer satisfaction without sacrificing revenue.'
  );

  // Actions for Risk 1
  const insertAction = db.prepare(`
    INSERT INTO actions (business_id, risk_id, title, description, responsible_person, deadline, status, expected_impact, actual_outcome)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertAction.run(
    businessId,
    risk1Id,
    'Contact Apex Meat Logistics & Confirm Friday Morning Batch',
    'Call account manager Rajiv (+91 98450 11289) to lock in Friday 10 AM dispatch for 40 kg fresh poultry.',
    'Rajesh (Head Chef / Kitchen Manager)',
    '2026-10-04 11:00 AM',
    'Pending',
    'May reduce stockout probability from 78% to 22%',
    null
  );

  insertAction.run(
    businessId,
    risk1Id,
    'Place 25 kg Backup Reorder with Fresh Poultry Co',
    'Issue PO #HP-4892 to backup supplier to cover Saturday peak.',
    'Vikram Malhotra (Owner)',
    '2026-10-04 02:00 PM',
    'Pending',
    'Guarantees 100% menu fulfillment over Saturday and Sunday dinner rush',
    null
  );

  // Risk 2: Cooking Oil Working Capital Overstock
  const r2 = insertRisk.run(
    businessId,
    'risk_oil_overstock',
    'Cooking Oil Overstock tying up ₹16,500 working capital',
    'Inventory',
    'LOW',
    28,
    0.32,
    12000,
    16500,
    'Low',
    'Bulk purchase of 250L sunflower oil exceeded 60-day consumption velocity (12L/week). Capital remains tied up in non-perishable inventory with zero immediate return.',
    45.0,
    JSON.stringify({
      title: "Cooking Oil Overstock",
      stages: [
        { node: "Bulk Discount Purchase", detail: "250L ordered to capture 8% unit volume discount", type: "procurement" },
        { node: "Slow Weekly Burn Rate", detail: "Kitchen consumes 12.2 liters/week", type: "inventory" },
        { node: "Tied Capital", detail: "₹16,500 trapped for >16 weeks", type: "outcome" }
      ]
    }),
    JSON.stringify({
      estimated_revenue_loss_min: 1200,
      estimated_revenue_loss_max: 3400,
      affected_orders_min: 0,
      affected_orders_max: 0,
      additional_operational_cost: 1500,
      escalation_probability: "Low (12%)",
      customer_impact_summary: "No direct customer impact; storage space occupied in dry pantry."
    }),
    'Active'
  );
  const risk2Id = r2.lastInsertRowid;

  insertEvidence.run(
    risk2Id,
    'Sunflower Oil Stock Level',
    'Inventory',
    180.0,
    '45 liters recommended buffer',
    '224 liters on hand',
    'Over 18 weeks of oil supply currently occupying dry storage pantry',
    'up',
    0.98
  );

  insertRec.run(
    risk2Id,
    1,
    'Pause Sunflower Oil Reordering for Next 6 Weeks',
    'inventory',
    'Freeze auto-reorder threshold until inventory drops below 50 liters.',
    'Frees up cash flow for fast-moving poultry and fresh dairy inventory.'
  );

  insertAction.run(
    businessId,
    risk2Id,
    'Freeze Cooking Oil POs with Golden Fields',
    'Notify wholesale vendor to hold off on oil deliveries until November.',
    'Pooja (Accounts)',
    '2026-10-06',
    'In Progress',
    'Preserves ₹14,000 cash flow for high-velocity goods',
    null
  );

  // Risk 3: Delivery Platform Dispatch Lag (Operational)
  const r3 = insertRisk.run(
    businessId,
    'risk_delivery_delay',
    'Late-evening delivery dispatch delays creating negative ratings',
    'Operations & Delivery',
    'MEDIUM',
    46,
    0.48,
    7500,
    11200,
    'Medium',
    'Between 8:45 PM and 10:15 PM, kitchen dispatch wait times rose by 14 minutes, causing Swiggy/Zomato delivery partner wait times to surge and rider complaints to increase.',
    7.0,
    JSON.stringify({
      title: "Late Delivery Bottleneck",
      stages: [
        { node: "Concentrated Peak Hour Rush", detail: "45% of daily delivery tickets arrive in 90-minute window", type: "demand" },
        { node: "Tandoor Station Bottleneck", detail: "Single tandoor chef preparing dine-in and delivery tickets", type: "operations" },
        { node: "Average Lag +14 mins", detail: "Pickup delay lengthened to 28 mins", type: "delivery" }
      ]
    }),
    JSON.stringify({
      estimated_revenue_loss_min: 7500,
      estimated_revenue_loss_max: 11200,
      affected_orders_min: 35,
      affected_orders_max: 52,
      additional_operational_cost: 1800,
      escalation_probability: "Medium (42%)",
      customer_impact_summary: "Lower algorithmic ranking on delivery apps; cold food complaints."
    }),
    'Active'
  );
  const risk3Id = r3.lastInsertRowid;

  insertEvidence.run(
    risk3Id,
    'Kitchen Dispatch Lag (8:45 PM - 10:15 PM)',
    'Operations',
    48.0,
    '14 minutes average prep',
    '28 minutes average prep',
    'Tandoor line congestion delaying delivery rider handoffs',
    'up',
    0.86
  );

  insertRec.run(
    risk3Id,
    1,
    'Stagger Delivery Prep Staging & Reassign Junior Line Cook',
    'operations',
    'Assign junior line cook exclusively to delivery order packaging and naan staging from 8:30 PM to 10:30 PM.',
    'Expected to cut dispatch delay by 9-12 minutes.'
  );

  insertAction.run(
    businessId,
    risk3Id,
    'Reassign Evening Kitchen Station Schedule',
    'Shift helper cook Ramesh to packaging station for peak dinner shift.',
    'Rajesh (Head Chef)',
    '2026-10-04',
    'Pending',
    'Reduces rider wait times and improves delivery app rating to 4.4+',
    null
  );

  // Risk Timeline History for Hero Risk (Monday to Friday progression)
  const insertHistory = db.prepare(`
    INSERT INTO risk_history (risk_id, date, risk_score, probability, stage, note)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  insertHistory.run(risk1Id, '2026-09-29', 24, 0.20, 'Monday: Normal', 'Inventory balanced at 48 kg; demand within expected weekday baseline.');
  insertHistory.run(risk1Id, '2026-09-30', 42, 0.38, 'Tuesday: Demand Spike', 'Weekday corporate delivery orders jumped +22%; stock depleted faster than forecasted.');
  insertHistory.run(risk1Id, '2026-10-01', 58, 0.54, 'Wednesday: Supplier Delay Detected', 'Apex Meat logistics missed scheduled 10 AM dispatch; delivery pushed by 1.8 days.');
  insertHistory.run(risk1Id, '2026-10-02', 71, 0.69, 'Thursday: Risk Escalating', 'Inventory depleted to 41 kg. First 3 customer complaints for sold-out chicken recorded.');
  insertHistory.run(risk1Id, '2026-10-03', 82, 0.78, 'Friday: Critical Alert (2.4 Days)', 'Weekend demand surge active (+31%). High likelihood of stockout before Saturday 9 PM.');

  return { businessId, risksCount: 3 };
}

module.exports = {
  seedDemoData
};
