// src/repository.js - Multi-Sector Enterprise Repository Layer for PulseGuard AI
const { db } = require('./db');

// Multi-sector seed definitions with rich domain data
const SECTORS = {
  restaurant: {
    key: 'restaurant',
    name: 'Restaurant & Food Service',
    businessName: 'Heritage Bites',
    currency: '₹',
    currencyCode: 'INR',
    itemsTracked: 42,
    criticalAlertsCount: 3,
    totalStockValue: '₹4,82,000',
    totalStockLeft: '1,240 kg',
    profitPerDay: '₹18,200',
    revenueAtRisk: '₹34,800',
    kpis: {
      itemsTracked: 42,
      criticalAlerts: 3,
      totalStockValue: '₹4,82,000',
      totalStockLeft: '1,240 kg',
      profitPerDay: '₹18,200',
      revenueAtRisk: '₹34,800'
    },
    products: [
      {
        id: 'p-rest-1',
        name: 'Premium Fresh Chicken (Curry Cut)',
        stockLeft: 38,
        unit: 'kg',
        dailySalesRate: 26.6,
        hoursToSellout: 34.2, // ~1.4 days
        incomingStock: 100,
        incomingUnit: 'kg',
        incomingDate: '2026-10-14 (Delayed by 2.7 days)',
        stockoutDate: '2026-10-13 (Tomorrow 2:00 PM)',
        stockClearance: 88,
        actualSales: '820 kg',
        profitOrLoss: '+₹52,400',
        isProfit: true,
        status: 'Critical',
        riskScore: 88,
        category: 'Poultry & Meat'
      },
      {
        id: 'p-rest-2',
        name: 'Royal Aged Basmati Biryani Rice',
        stockLeft: 140,
        unit: 'kg',
        dailySalesRate: 18.2,
        hoursToSellout: 184.6, // ~7.7 days
        incomingStock: 200,
        incomingUnit: 'kg',
        incomingDate: '2026-10-16 (On schedule)',
        stockoutDate: '2026-10-19',
        stockClearance: 65,
        actualSales: '540 kg',
        profitOrLoss: '+₹38,900',
        isProfit: true,
        status: 'Healthy',
        riskScore: 18,
        category: 'Grains & Pantry'
      },
      {
        id: 'p-rest-3',
        name: 'Refined Sunflower Cooking Oil',
        stockLeft: 224,
        unit: 'L',
        dailySalesRate: 2.1,
        hoursToSellout: 2560, // Overstock: 106 days
        incomingStock: 0,
        incomingUnit: 'L',
        incomingDate: 'Frozen PO',
        stockoutDate: '2027-01-26',
        stockClearance: 22,
        actualSales: '180 L',
        profitOrLoss: '-₹16,500',
        isProfit: false,
        status: 'Warning',
        riskScore: 42,
        category: 'Oils & Fats'
      },
      {
        id: 'p-rest-4',
        name: 'Fresh Malai Paneer Block',
        stockLeft: 14,
        unit: 'kg',
        dailySalesRate: 8.5,
        hoursToSellout: 39.5, // ~1.6 days
        incomingStock: 30,
        incomingUnit: 'kg',
        incomingDate: '2026-10-13 (Morning)',
        stockoutDate: '2026-10-13 (Evening)',
        stockClearance: 78,
        actualSales: '260 kg',
        profitOrLoss: '+₹21,800',
        isProfit: true,
        status: 'Warning',
        riskScore: 64,
        category: 'Dairy'
      },
      {
        id: 'p-rest-5',
        name: 'Tandoori Masala & Marinade Spice Blend',
        stockLeft: 8.5,
        unit: 'kg',
        dailySalesRate: 1.2,
        hoursToSellout: 170.0, // ~7.1 days
        incomingStock: 15,
        incomingUnit: 'kg',
        incomingDate: '2026-10-18',
        stockoutDate: '2026-10-18',
        stockClearance: 54,
        actualSales: '38 kg',
        profitOrLoss: '+₹12,400',
        isProfit: true,
        status: 'Healthy',
        riskScore: 22,
        category: 'Spices'
      }
    ],
    suppliers: [
      {
        id: 's-rest-1',
        name: 'Apex Meat Logistics',
        itemSupplied: 'Raw Chicken & Mutton',
        leadTime: '2.7 days (+18% delay)',
        reliability: 62,
        trend: 'Declining',
        status: 'Critical',
        contact: '+91 98450 11289',
        action: 'Activate backup supplier Fresh Poultry Co'
      },
      {
        id: 's-rest-2',
        name: 'Fresh Poultry Co',
        itemSupplied: 'Raw Chicken (Premium Cuts)',
        leadTime: '0.8 days',
        reliability: 91,
        trend: 'Stable',
        status: 'Healthy',
        contact: '+91 98201 44552',
        action: 'Standby backup partner'
      },
      {
        id: 's-rest-3',
        name: 'Golden Fields Wholesale',
        itemSupplied: 'Cooking Oil & Bulk Spices',
        leadTime: '1.4 days',
        reliability: 94,
        trend: 'Stable',
        status: 'Healthy',
        contact: '+91 99200 88211',
        action: 'POs paused until oil drops <50L'
      },
      {
        id: 's-rest-4',
        name: 'Evergreen Dairy Hub',
        itemSupplied: 'Malai Paneer & Dairy',
        leadTime: '1.1 days',
        reliability: 88,
        trend: 'Stable',
        status: 'Healthy',
        contact: '+91 97110 33490',
        action: 'Morning delivery confirmed'
      }
    ],
    reviews: [
      {
        id: 'r-rest-1',
        date: '2026-10-08',
        customer: 'Ananya S.',
        rating: 1,
        category: 'unavailable items',
        text: 'Came specifically for Butter Chicken on Saturday evening and was told it was completely sold out by 8:30 PM! Very disappointing for a weekend dinner.',
        sentiment: 'Negative',
        impact: 'Loss of table loyalty'
      },
      {
        id: 'r-rest-2',
        date: '2026-10-07',
        customer: 'Karan M.',
        rating: 2,
        category: 'waiting time',
        text: 'Delivery rider took 45 minutes because the kitchen was delayed. Food arrived lukewarm and tandoori naan was rubbery.',
        sentiment: 'Negative',
        impact: 'Delivery app score drop'
      },
      {
        id: 'r-rest-3',
        date: '2026-10-06',
        customer: 'Preeti D.',
        rating: 5,
        category: 'food quality',
        text: 'The Dal Makhani and Paneer Tikka were exceptional as always. Best North Indian food in Indiranagar.',
        sentiment: 'Positive',
        impact: 'High LTV diner'
      },
      {
        id: 'r-rest-4',
        date: '2026-10-05',
        customer: 'Rohan K.',
        rating: 1,
        category: 'unavailable items',
        text: 'Second weekend in a row where Murgh Biryani was out of stock on Swiggy. Staff seemed stressed and apologetic.',
        sentiment: 'Negative',
        impact: 'Algorithmic de-ranking'
      }
    ],
    employees: [
      {
        id: 'e-rest-1',
        name: 'Rajesh Sharma',
        role: 'Head Chef',
        station: 'Tandoor & Curry Station',
        shift: 'Evening Peak (6 PM - 11 PM)',
        status: 'Overloaded',
        incidents: 3,
        note: 'Handling both dine-in and delivery tickets solo during 8:30-10:00 PM rush'
      },
      {
        id: 'e-rest-2',
        name: 'Ramesh Patel',
        role: 'Junior Cook / Helper',
        station: 'Prep & Packaging',
        shift: 'Evening Peak (6 PM - 11 PM)',
        status: 'On Shift',
        incidents: 1,
        note: 'Assigned to delivery order packing to cut rider dispatch delays'
      },
      {
        id: 'e-rest-3',
        name: 'Pooja Verma',
        role: 'Accounts & Procurement',
        station: 'Admin Office',
        shift: 'Day Shift (10 AM - 6 PM)',
        status: 'Active',
        incidents: 0,
        note: 'Monitoring supplier turnaround and purchase order freezes'
      },
      {
        id: 'e-rest-4',
        name: 'Vikram Joshi',
        role: 'General Manager',
        station: 'Floor Operations',
        shift: 'Full Day',
        status: 'Active',
        incidents: 0,
        note: 'Reviewing PulseGuard early warnings and coordinating supplier switches'
      }
    ],
    actions: [
      {
        id: 'act-rest-1',
        title: 'Activate Secondary Supplier Fresh Poultry Co',
        risk: 'Chicken inventory depletion in 34 hours',
        responsible: 'Pooja Verma (Accounts)',
        deadline: 'Today 5:00 PM',
        status: 'Pending',
        expectedImpact: 'Prevents ₹18,400 to ₹25,000 lost weekend revenue'
      },
      {
        id: 'act-rest-2',
        title: 'Place 35% Emergency Chicken Buffer PO (80 kg)',
        risk: 'Weekend surge demand exceeds baseline by 31%',
        responsible: 'Vikram Joshi (Manager)',
        deadline: 'Tomorrow 9:00 AM',
        status: 'Pending',
        expectedImpact: 'Guarantees 100% weekend menu availability'
      },
      {
        id: 'act-rest-3',
        title: 'Freeze Sunflower Oil Bulk Purchase Orders',
        risk: '₹16,500 working capital locked in 18-week oil surplus',
        responsible: 'Pooja Verma (Accounts)',
        deadline: '2026-10-15',
        status: 'In Progress',
        expectedImpact: 'Frees ₹14,000 cash for fast-moving poultry & dairy'
      },
      {
        id: 'act-rest-4',
        title: 'Reassign Helper Cook to Evening Packaging Station',
        risk: 'Delivery dispatch delay increased to 28 mins',
        responsible: 'Rajesh Sharma (Head Chef)',
        deadline: '2026-10-12',
        status: 'Completed',
        expectedImpact: 'Cuts dispatch wait time by 11 mins'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 20.3, stock: 45.5, label: 'Normal' },
        { day: 'Day 2', sales: 21.6, stock: 43.3, label: 'Demand +8%' },
        { day: 'Day 3', sales: 22.1, stock: 42.4, label: 'Demand +12%' },
        { day: 'Day 4', sales: 23.4, stock: 39.7, label: 'Supplier lag' },
        { day: 'Day 5', sales: 24.8, stock: 38.0, label: 'Depletion rate ↑' },
        { day: 'Day 6', sales: 26.6, stock: 38.0, label: 'Weekend peak' },
        { day: 'Day 7 (Pred)', sales: 27.5, stock: 12.0, label: 'Severe stockout risk' }
      ]
    }
  },

  retail: {
    key: 'retail',
    name: 'Retail & Supermarket',
    businessName: 'MetroMart Superstore',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 1480,
    criticalAlertsCount: 4,
    totalStockValue: '$64,200',
    totalStockLeft: '8,920 units',
    profitPerDay: '$2,450',
    revenueAtRisk: '$5,800',
    kpis: {
      itemsTracked: 1480,
      criticalAlerts: 4,
      totalStockValue: '$64,200',
      totalStockLeft: '8,920 units',
      profitPerDay: '$2,450',
      revenueAtRisk: '$5,800'
    },
    products: [
      {
        id: 'p-ret-1',
        name: 'Organic Whole Milk (1 Gallon)',
        stockLeft: 18,
        unit: 'units',
        dailySalesRate: 42.0,
        hoursToSellout: 10.3, // ~10 hours
        incomingStock: 60,
        incomingUnit: 'units',
        incomingDate: 'Tomorrow 6:00 AM',
        stockoutDate: 'Today 8:00 PM',
        stockClearance: 92,
        actualSales: '480 units',
        profitOrLoss: '+$1,420',
        isProfit: true,
        status: 'Critical',
        riskScore: 92,
        category: 'Dairy & Refrigerator'
      },
      {
        id: 'p-ret-2',
        name: 'Hass Avocados (4-Pack Bag)',
        stockLeft: 32,
        unit: 'bags',
        dailySalesRate: 25.0,
        hoursToSellout: 30.7, // ~1.3 days
        incomingStock: 50,
        incomingUnit: 'bags',
        incomingDate: 'Oct 14',
        stockoutDate: 'Oct 13',
        stockClearance: 84,
        actualSales: '310 bags',
        profitOrLoss: '+$890',
        isProfit: true,
        status: 'Critical',
        riskScore: 79,
        category: 'Fresh Produce'
      },
      {
        id: 'p-ret-3',
        name: 'Ultra Clean Detergent Pods (60ct)',
        stockLeft: 310,
        unit: 'packs',
        dailySalesRate: 4.0,
        hoursToSellout: 1860, // 77 days
        incomingStock: 0,
        incomingUnit: 'packs',
        incomingDate: 'None',
        stockoutDate: 'Dec 28',
        stockClearance: 18,
        actualSales: '85 packs',
        profitOrLoss: '-$420',
        isProfit: false,
        status: 'Warning',
        riskScore: 45,
        category: 'Household'
      },
      {
        id: 'p-ret-4',
        name: 'Artisan Sourdough Loaf 500g',
        stockLeft: 12,
        unit: 'loaves',
        dailySalesRate: 16.0,
        hoursToSellout: 18.0,
        incomingStock: 25,
        incomingUnit: 'loaves',
        incomingDate: 'Tomorrow 7:00 AM',
        stockoutDate: 'Today 6:00 PM',
        stockClearance: 76,
        actualSales: '210 loaves',
        profitOrLoss: '+$560',
        isProfit: true,
        status: 'Warning',
        riskScore: 68,
        category: 'Bakery'
      },
      {
        id: 'p-ret-5',
        name: 'Sunkist Navel Oranges (3 lb Bag)',
        stockLeft: 95,
        unit: 'bags',
        dailySalesRate: 18.0,
        hoursToSellout: 126.6,
        incomingStock: 80,
        incomingUnit: 'bags',
        incomingDate: 'Oct 16',
        stockoutDate: 'Oct 17',
        stockClearance: 52,
        actualSales: '240 bags',
        profitOrLoss: '+$720',
        isProfit: true,
        status: 'Healthy',
        riskScore: 20,
        category: 'Fresh Produce'
      }
    ],
    suppliers: [
      {
        id: 's-ret-1',
        name: 'Valley Dairy Logistics',
        itemSupplied: 'Organic Milk & Dairy',
        leadTime: '1.8 days (+14% delay)',
        reliability: 74,
        trend: 'Declining',
        status: 'Warning',
        contact: '+1 (555) 234-8901',
        action: 'Expedite morning route delivery'
      },
      {
        id: 's-ret-2',
        name: 'Agrifresh Produce Direct',
        itemSupplied: 'Avocados & Fresh Fruit',
        leadTime: '0.5 days',
        reliability: 95,
        trend: 'Stable',
        status: 'Healthy',
        contact: '+1 (555) 345-6789',
        action: 'Order avocado buffer for weekend'
      },
      {
        id: 's-ret-3',
        name: 'Pacific Coast Dry Goods',
        itemSupplied: 'Detergents & Cleaners',
        leadTime: '3.2 days',
        reliability: 81,
        trend: 'Stable',
        status: 'Warning',
        contact: '+1 (555) 456-7890',
        action: 'Hold reorders for 60 days'
      }
    ],
    reviews: [
      {
        id: 'r-ret-1',
        date: '2026-10-09',
        customer: 'Sarah Jenkins',
        rating: 1,
        category: 'unavailable items',
        text: 'Third time in two weeks there was no organic milk on the shelf by 7 PM on a weekday. Shelves are empty in aisle 3.',
        sentiment: 'Negative',
        impact: 'Basket abandonment'
      },
      {
        id: 'r-ret-2',
        date: '2026-10-08',
        customer: 'Marcus Thorne',
        rating: 2,
        category: 'food quality',
        text: 'Avocados in the produce section were either completely rock hard or bruised. Need better inventory rotation.',
        sentiment: 'Negative',
        impact: 'Produce shrink'
      }
    ],
    employees: [
      {
        id: 'e-ret-1',
        name: 'Elena Rostova',
        role: 'Produce Lead',
        station: 'Produce & Dairy Aisles',
        shift: 'Morning (6 AM - 2 PM)',
        status: 'Active',
        incidents: 1,
        note: 'Monitoring stockout alerts on organic dairy'
      },
      {
        id: 'e-ret-2',
        name: 'David Chen',
        role: 'Receiving Manager',
        station: 'Loading Dock',
        shift: 'Early Shift',
        status: 'On Shift',
        incidents: 2,
        note: 'Logging delivery transit timestamps'
      }
    ],
    actions: [
      {
        id: 'act-ret-1',
        title: 'Expedite Valley Dairy Delivery Route',
        risk: 'Organic Milk stockout within 10 hours',
        responsible: 'David Chen (Receiving)',
        deadline: 'Today 3:00 PM',
        status: 'Pending',
        expectedImpact: 'Prevents $2,400 evening basket abandonment'
      },
      {
        id: 'act-ret-2',
        title: 'Discount Detergent Pods by 15% to Clear Floor',
        risk: '$4,200 capital tied up in slow-moving stock',
        responsible: 'Elena Rostova',
        deadline: '2026-10-15',
        status: 'In Progress',
        expectedImpact: 'Reclaims 40 sq ft aisle space and $3,500 cash'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 38, stock: 80, label: 'Normal' },
        { day: 'Day 2', sales: 40, stock: 65, label: 'Steady' },
        { day: 'Day 3', sales: 42, stock: 45, label: 'Rush' },
        { day: 'Day 4', sales: 45, stock: 28, label: 'Low shelf' },
        { day: 'Day 5', sales: 42, stock: 18, label: 'Depleting' },
        { day: 'Day 6 (Pred)', sales: 46, stock: 0, label: 'Stockout alert' }
      ]
    }
  },

  manufacturing: {
    key: 'manufacturing',
    name: 'Light Manufacturing & Assembly',
    businessName: 'Apex Precision Dynamics',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 320,
    criticalAlertsCount: 2,
    totalStockValue: '$182,500',
    totalStockLeft: '4,600 components',
    profitPerDay: '$8,900',
    revenueAtRisk: '$28,400',
    kpis: {
      itemsTracked: 320,
      criticalAlerts: 2,
      totalStockValue: '$182,500',
      totalStockLeft: '4,600 components',
      profitPerDay: '$8,900',
      revenueAtRisk: '$28,400'
    },
    products: [
      {
        id: 'p-man-1',
        name: 'CNC Grade 304 Stainless Bar 25mm',
        stockLeft: 42,
        unit: 'bars',
        dailySalesRate: 28.0,
        hoursToSellout: 36.0, // 1.5 days
        incomingStock: 80,
        incomingUnit: 'bars',
        incomingDate: 'Oct 15 (Delayed 4 days)',
        stockoutDate: 'Oct 13',
        stockClearance: 91,
        actualSales: '340 bars',
        profitOrLoss: '+$14,200',
        isProfit: true,
        status: 'Critical',
        riskScore: 94,
        category: 'Raw Barstock'
      },
      {
        id: 'p-man-2',
        name: 'Copper Winding Wire 0.5mm Spool',
        stockLeft: 18,
        unit: 'spools',
        dailySalesRate: 8.0,
        hoursToSellout: 54.0, // 2.2 days
        incomingStock: 40,
        incomingUnit: 'spools',
        incomingDate: 'Oct 14',
        stockoutDate: 'Oct 13',
        stockClearance: 82,
        actualSales: '120 spools',
        profitOrLoss: '+$6,400',
        isProfit: true,
        status: 'Warning',
        riskScore: 71,
        category: 'Conductors'
      },
      {
        id: 'p-man-3',
        name: 'Precision Carbide End Mills 8mm',
        stockLeft: 14,
        unit: 'tools',
        dailySalesRate: 6.0,
        hoursToSellout: 56.0,
        incomingStock: 25,
        incomingUnit: 'tools',
        incomingDate: 'Oct 15',
        stockoutDate: 'Oct 14',
        stockClearance: 79,
        actualSales: '65 tools',
        profitOrLoss: '+$4,100',
        isProfit: true,
        status: 'Warning',
        riskScore: 66,
        category: 'Tooling'
      },
      {
        id: 'p-man-4',
        name: 'Hydraulic O-Ring Seal Kit 40mm',
        stockLeft: 620,
        unit: 'sets',
        dailySalesRate: 12.0,
        hoursToSellout: 1240,
        incomingStock: 0,
        incomingUnit: 'sets',
        incomingDate: 'None',
        stockoutDate: 'Nov 30',
        stockClearance: 30,
        actualSales: '240 sets',
        profitOrLoss: '+$1,800',
        isProfit: true,
        status: 'Healthy',
        riskScore: 15,
        category: 'Hardware'
      }
    ],
    suppliers: [
      {
        id: 's-man-1',
        name: 'Vulcan Metalworks Ltd',
        itemSupplied: 'Stainless & Tool Steels',
        leadTime: '4.2 days (+28% lag)',
        reliability: 68,
        trend: 'Declining',
        status: 'Critical',
        contact: '+1 (555) 789-0123',
        action: 'Engage backup mill supplier'
      },
      {
        id: 's-man-2',
        name: 'Titan Precision Tooling',
        itemSupplied: 'Carbide Bits & Inserts',
        leadTime: '1.1 days',
        reliability: 96,
        trend: 'Stable',
        status: 'Healthy',
        contact: '+1 (555) 890-1234',
        action: 'Contracted tooling partner'
      }
    ],
    reviews: [
      {
        id: 'r-man-1',
        date: '2026-10-08',
        customer: 'AeroCorp Dynamics',
        rating: 2,
        category: 'waiting time',
        text: 'CNC milling batch for shipment PO-9912 was delayed 3 days due to barstock shortage. Please communicate material delays earlier.',
        sentiment: 'Negative',
        impact: 'Client penalty clause risk'
      }
    ],
    employees: [
      {
        id: 'e-man-1',
        name: 'Frank Miller',
        role: 'Production Supervisor',
        station: 'CNC Cell A & B',
        shift: 'Day Shift',
        status: 'Overloaded',
        incidents: 2,
        note: 'Staging alternative alloy jobs to prevent idle spindle downtime'
      }
    ],
    actions: [
      {
        id: 'act-man-1',
        title: 'Activate Secondary Mill for Stainless 304 Barstock',
        risk: 'CNC spindle line shutdown in 36 hours',
        responsible: 'Frank Miller (Production)',
        deadline: 'Today 4:00 PM',
        status: 'Pending',
        expectedImpact: 'Protects $28,400 production run delivery'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 26, stock: 95, label: 'Full buffer' },
        { day: 'Day 2', sales: 28, stock: 75, label: 'Running' },
        { day: 'Day 3', sales: 30, stock: 52, label: 'Line A rush' },
        { day: 'Day 4', sales: 28, stock: 42, label: 'Supplier delay' },
        { day: 'Day 5 (Pred)', sales: 32, stock: 10, label: 'Line stoppage' }
      ]
    }
  },

  logistics: {
    key: 'logistics',
    name: 'Local Logistics & Warehouse',
    businessName: 'RapidFreight Hub',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 110,
    criticalAlertsCount: 2,
    totalStockValue: '$41,000',
    totalStockLeft: '3,200 supplies',
    profitPerDay: '$3,600',
    revenueAtRisk: '$9,200',
    kpis: {
      itemsTracked: 110,
      criticalAlerts: 2,
      totalStockValue: '$41,000',
      totalStockLeft: '3,200 supplies',
      profitPerDay: '$3,600',
      revenueAtRisk: '$9,200'
    },
    products: [
      {
        id: 'p-log-1',
        name: 'Euro Wooden Pallets (1200x800mm)',
        stockLeft: 45,
        unit: 'pallets',
        dailySalesRate: 80.0,
        hoursToSellout: 13.5,
        incomingStock: 150,
        incomingUnit: 'pallets',
        incomingDate: 'Tomorrow 9:00 AM',
        stockoutDate: 'Today 11:00 PM',
        stockClearance: 94,
        actualSales: '680 pallets',
        profitOrLoss: '+$4,200',
        isProfit: true,
        status: 'Critical',
        riskScore: 91,
        category: 'Staging'
      },
      {
        id: 'p-log-2',
        name: 'Thermal Shipping Label Rolls 4x6',
        stockLeft: 22,
        unit: 'rolls',
        dailySalesRate: 15.0,
        hoursToSellout: 35.2,
        incomingStock: 50,
        incomingUnit: 'rolls',
        incomingDate: 'Oct 14',
        stockoutDate: 'Oct 13',
        stockClearance: 85,
        actualSales: '140 rolls',
        profitOrLoss: '+$1,100',
        isProfit: true,
        status: 'Warning',
        riskScore: 75,
        category: 'Consumables'
      }
    ],
    suppliers: [
      {
        id: 's-log-1',
        name: 'PackPro Industrial Supply',
        itemSupplied: 'Wooden Pallets & Dunnage',
        leadTime: '3.1 days (+35% lag)',
        reliability: 71,
        trend: 'Declining',
        status: 'Critical',
        contact: '+1 (555) 901-2345',
        action: 'Dispatch hotshot courier for 50 emergency pallets'
      }
    ],
    reviews: [
      {
        id: 'r-log-1',
        date: '2026-10-08',
        customer: 'Global Logistics Client #4',
        rating: 2,
        category: 'waiting time',
        text: 'Cross-docking staging line grounded for 3 hours due to pallet shortage.',
        sentiment: 'Negative',
        impact: 'Dispatch SLA missed'
      }
    ],
    employees: [
      {
        id: 'e-log-1',
        name: 'Travis Scott',
        role: 'Dock Supervisor',
        station: 'Inbound Dock 4',
        shift: 'Night Shift',
        status: 'Overloaded',
        incidents: 1,
        note: 'Recycling empty supplier pallets to keep outbound freight moving'
      }
    ],
    actions: [
      {
        id: 'act-log-1',
        title: 'Dispatch Hotshot Courier for Emergency 50 Pallets',
        risk: 'Loading bay stoppage in 13 hours',
        responsible: 'Travis Scott',
        deadline: 'Today 2:00 PM',
        status: 'Pending',
        expectedImpact: 'Averts $9,200 cross-docking demurrage penalty'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 75, stock: 240, label: 'Staged' },
        { day: 'Day 2', sales: 82, stock: 165, label: 'Heavy out' },
        { day: 'Day 3', sales: 80, stock: 85, label: 'Peak volume' },
        { day: 'Day 4', sales: 85, stock: 45, label: 'Depleted' },
        { day: 'Day 5 (Pred)', sales: 80, stock: 0, label: 'Bay standstill' }
      ]
    }
  },

  d2c: {
    key: 'd2c',
    name: 'D2C & E-commerce',
    businessName: 'Aura Botanicals D2C',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 85,
    criticalAlertsCount: 3,
    totalStockValue: '$76,400',
    totalStockLeft: '5,800 units',
    profitPerDay: '$4,200',
    revenueAtRisk: '$14,500',
    kpis: {
      itemsTracked: 85,
      criticalAlerts: 3,
      totalStockValue: '$76,400',
      totalStockLeft: '5,800 units',
      profitPerDay: '$4,200',
      revenueAtRisk: '$14,500'
    },
    products: [
      {
        id: 'p-d2c-1',
        name: 'Botanical Radiance Face Serum 30ml',
        stockLeft: 68,
        unit: 'units',
        dailySalesRate: 52.0, // viral sales surge
        hoursToSellout: 31.3, // ~1.3 days
        incomingStock: 300,
        incomingUnit: 'units',
        incomingDate: 'Oct 15 (Delayed by customs)',
        stockoutDate: 'Oct 13',
        stockClearance: 95,
        actualSales: '890 units',
        profitOrLoss: '+$24,100',
        isProfit: true,
        status: 'Critical',
        riskScore: 95,
        category: 'Skincare'
      },
      {
        id: 'p-d2c-2',
        name: 'Frosted Glass Dropper Bottles 30ml',
        stockLeft: 110,
        unit: 'units',
        dailySalesRate: 50.0,
        hoursToSellout: 52.8,
        incomingStock: 500,
        incomingUnit: 'units',
        incomingDate: 'Oct 16',
        stockoutDate: 'Oct 14',
        stockClearance: 89,
        actualSales: '720 units',
        profitOrLoss: '+$4,500',
        isProfit: true,
        status: 'Critical',
        riskScore: 87,
        category: 'Packaging'
      }
    ],
    suppliers: [
      {
        id: 's-d2c-1',
        name: 'PureExtract BioLabs',
        itemSupplied: 'Organic Serum Active Formula',
        leadTime: '3.8 days (+40% lag)',
        reliability: 65,
        trend: 'Declining',
        status: 'Critical',
        contact: '+1 (555) 012-3456',
        action: 'Air-freight 100 units from backup laboratory'
      }
    ],
    reviews: [
      {
        id: 'r-d2c-1',
        date: '2026-10-09',
        customer: 'Chloe B.',
        rating: 1,
        category: 'unavailable items',
        text: 'Saw this on TikTok and tried to buy the 30ml serum, but it was marked Out of Stock at checkout! You guys are losing so much hype sales.',
        sentiment: 'Negative',
        impact: 'Ad spend CAC wastage'
      }
    ],
    employees: [
      {
        id: 'e-d2c-1',
        name: 'Maya Lin',
        role: 'Growth & Fulfillment Lead',
        station: 'E-commerce Ops',
        shift: 'Day',
        status: 'Overloaded',
        incidents: 2,
        note: 'Ad spend is still running while hero SKU inventory is crashing'
      }
    ],
    actions: [
      {
        id: 'act-d2c-1',
        title: 'Pause TikTok Ad Campaign for 30ml Face Serum',
        risk: 'Ad burn without inventory to fulfill orders',
        responsible: 'Maya Lin',
        deadline: 'Today 1:00 PM',
        status: 'Pending',
        expectedImpact: 'Saves $3,200 ad burn and limits pre-order cancellations'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 22, stock: 190, label: 'Pre-viral' },
        { day: 'Day 2', sales: 35, stock: 155, label: 'TikTok bump' },
        { day: 'Day 3', sales: 50, stock: 105, label: 'Viral spike' },
        { day: 'Day 4', sales: 52, stock: 68, label: 'Depleting' },
        { day: 'Day 5 (Pred)', sales: 55, stock: 0, label: 'Stockout' }
      ]
    }
  },

  pharmacy: {
    key: 'pharmacy',
    name: 'Pharmacies & Private Clinics',
    businessName: 'CarePlus MedCenter & Rx',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 920,
    criticalAlertsCount: 2,
    totalStockValue: '$114,000',
    totalStockLeft: '14,200 units',
    profitPerDay: '$5,100',
    revenueAtRisk: '$11,200',
    kpis: {
      itemsTracked: 920,
      criticalAlerts: 2,
      totalStockValue: '$114,000',
      totalStockLeft: '14,200 units',
      profitPerDay: '$5,100',
      revenueAtRisk: '$11,200'
    },
    products: [
      {
        id: 'p-ph-1',
        name: 'Amoxicillin 500mg Capsules (Pack 20)',
        stockLeft: 24,
        unit: 'packs',
        dailySalesRate: 32.0,
        hoursToSellout: 18.0,
        incomingStock: 80,
        incomingUnit: 'packs',
        incomingDate: 'Oct 14',
        stockoutDate: 'Today 9:00 PM',
        stockClearance: 94,
        actualSales: '410 packs',
        profitOrLoss: '+$3,200',
        isProfit: true,
        status: 'Critical',
        riskScore: 93,
        category: 'Antibiotics'
      },
      {
        id: 'p-ph-2',
        name: 'Disposable Powder-Free Nitrile Gloves (L)',
        stockLeft: 8,
        unit: 'boxes',
        dailySalesRate: 6.0,
        hoursToSellout: 32.0,
        incomingStock: 25,
        incomingUnit: 'boxes',
        incomingDate: 'Oct 14',
        stockoutDate: 'Tomorrow 1:00 PM',
        stockClearance: 88,
        actualSales: '90 boxes',
        profitOrLoss: '+$940',
        isProfit: true,
        status: 'Warning',
        riskScore: 78,
        category: 'Clinic Supplies'
      }
    ],
    suppliers: [
      {
        id: 's-ph-1',
        name: 'MediCore Pharma Wholesale',
        itemSupplied: 'Rx & Essential Antibiotics',
        leadTime: '2.4 days (+25% lag)',
        reliability: 76,
        trend: 'Declining',
        status: 'Warning',
        contact: '+1 (555) 123-4567',
        action: 'Place emergency order via state medical depot'
      }
    ],
    reviews: [
      {
        id: 'r-ph-1',
        date: '2026-10-09',
        customer: 'Dr. Arthur Vance',
        rating: 1,
        category: 'unavailable items',
        text: 'Clinic had to turn away three pediatric patients with strep throat because Amoxicillin had run out before evening clinic hours.',
        sentiment: 'Negative',
        impact: 'Patient compliance risk'
      }
    ],
    employees: [
      {
        id: 'e-ph-1',
        name: 'Sarah O’Connor (PharmD)',
        role: 'Chief Pharmacist',
        station: 'Dispensary Counter',
        shift: 'Day',
        status: 'Overloaded',
        incidents: 1,
        note: 'Coordinating emergency stock transfer from downtown hospital branch'
      }
    ],
    actions: [
      {
        id: 'act-ph-1',
        title: 'Emergency Stock Transfer of Amoxicillin from Downtown Branch',
        risk: 'Prescription stockout within 18 hours',
        responsible: 'Sarah O’Connor',
        deadline: 'Today 3:30 PM',
        status: 'Pending',
        expectedImpact: 'Fulfills 45 pending clinic prescriptions'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 28, stock: 90, label: 'Stocked' },
        { day: 'Day 2', sales: 30, stock: 62, label: 'Flu season' },
        { day: 'Day 3', sales: 34, stock: 32, label: 'High demand' },
        { day: 'Day 4', sales: 32, stock: 24, label: 'Depleted' },
        { day: 'Day 5 (Pred)', sales: 35, stock: 0, label: 'Stockout' }
      ]
    }
  },

  professional: {
    key: 'professional',
    name: 'Professional & Service Business',
    businessName: 'Vantage Audit & Advisory',
    currency: '$',
    currencyCode: 'USD',
    itemsTracked: 48,
    criticalAlertsCount: 2,
    totalStockValue: '$95,000',
    totalStockLeft: '420 hours',
    profitPerDay: '$6,800',
    revenueAtRisk: '$22,000',
    kpis: {
      itemsTracked: 48,
      criticalAlerts: 2,
      totalStockValue: '$95,000',
      totalStockLeft: '420 hours',
      profitPerDay: '$6,800',
      revenueAtRisk: '$22,000'
    },
    products: [
      {
        id: 'p-pro-1',
        name: 'Senior Tax Auditor Capacity (Q4 Crunch)',
        stockLeft: 34,
        unit: 'hrs left',
        dailySalesRate: 24.0,
        hoursToSellout: 34.0, // 1.4 days
        incomingStock: 50,
        incomingUnit: 'hrs',
        incomingDate: 'Contractors starting Oct 16',
        stockoutDate: 'Oct 13',
        stockClearance: 92,
        actualSales: '380 hrs booked',
        profitOrLoss: '+$38,400',
        isProfit: true,
        status: 'Critical',
        riskScore: 89,
        category: 'Capacity'
      },
      {
        id: 'p-pro-2',
        name: 'SOC-2 Compliance Review Slots',
        stockLeft: 80,
        unit: 'hrs left',
        dailySalesRate: 16.0,
        hoursToSellout: 120.0,
        incomingStock: 40,
        incomingUnit: 'hrs',
        incomingDate: 'Oct 18',
        stockoutDate: 'Oct 17',
        stockClearance: 75,
        actualSales: '240 hrs',
        profitOrLoss: '+$19,200',
        isProfit: true,
        status: 'Warning',
        riskScore: 60,
        category: 'Advisory'
      }
    ],
    suppliers: [
      {
        id: 's-pro-1',
        name: 'Elite Contractors Network',
        itemSupplied: 'Certified Senior Tax Auditors',
        leadTime: '3.5 days (+30% lag)',
        reliability: 72,
        trend: 'Declining',
        status: 'Warning',
        contact: '+1 (555) 234-5678',
        action: 'Lock 2 contract auditors for Oct 14-31'
      }
    ],
    reviews: [
      {
        id: 'r-pro-1',
        date: '2026-10-08',
        customer: 'FinTech Capital Partners',
        rating: 2,
        category: 'waiting time',
        text: 'Tax filing review was held back 4 days due to auditor capacity bottleneck. Team was polite but clearly overbooked.',
        sentiment: 'Negative',
        impact: 'Client retention risk'
      }
    ],
    employees: [
      {
        id: 'e-pro-1',
        name: 'Julian Hayes (CPA)',
        role: 'Audit Partner',
        station: 'Advisory Desk',
        shift: 'Q4 Peak',
        status: 'Overloaded',
        incidents: 2,
        note: 'Team utilization rate at 108%; needs contractor relief immediately'
      }
    ],
    actions: [
      {
        id: 'act-pro-1',
        title: 'Sign 2 Secondary Contract Auditors for Q4 Filing',
        risk: 'Auditor burnout and client SLA breach in 34 hours',
        responsible: 'Julian Hayes',
        deadline: 'Today 5:00 PM',
        status: 'Pending',
        expectedImpact: 'Protects $22,000 corporate retainer SLA'
      }
    ],
    charts: {
      salesVsStock: [
        { day: 'Day 1', sales: 20, stock: 120, label: 'Capacity ok' },
        { day: 'Day 2', sales: 22, stock: 98, label: 'Q4 demand' },
        { day: 'Day 3', sales: 25, stock: 73, label: 'High booking' },
        { day: 'Day 4', sales: 24, stock: 34, label: 'Crunch' },
        { day: 'Day 5 (Pred)', sales: 28, stock: 0, label: 'Locked' }
      ]
    }
  }
};

class Repository {
  static getSectorsList() {
    return Object.values(SECTORS).map(s => ({
      key: s.key,
      name: s.name,
      businessName: s.businessName,
      currency: s.currency,
      criticalAlertsCount: s.criticalAlertsCount
    }));
  }

  static getSector(sectorKey) {
    const key = (sectorKey || 'restaurant').toLowerCase();
    return SECTORS[key] || SECTORS.restaurant;
  }

  static getKpis(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.kpis;
  }

  static getProducts(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.products;
  }

  static getSuppliers(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.suppliers;
  }

  static getReviews(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.reviews;
  }

  static getEmployees(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.employees;
  }

  static getActions(sectorKey) {
    const s = this.getSector(sectorKey);
    return s.actions;
  }

  static updateActionStatus(sectorKey, actionId, status) {
    const s = this.getSector(sectorKey);
    const action = s.actions.find(a => a.id === actionId);
    if (action) {
      action.status = status;
      return action;
    }
    return null;
  }

  static autoMitigateAll(sectorKey) {
    const s = this.getSector(sectorKey);
    s.actions.forEach(a => {
      a.status = 'Completed';
    });
    // Lower critical alerts and revenue at risk
    s.criticalAlertsCount = 0;
    s.revenueAtRisk = s.currency + '0';
    s.kpis.criticalAlerts = 0;
    s.kpis.revenueAtRisk = s.currency + '0';
    return {
      success: true,
      message: `All ${s.actions.length} operational mitigations have been deployed autonomously.`,
      updatedAlertCount: 0,
      updatedRevenueAtRisk: s.currency + '0'
    };
  }

  static runWhatIf(sectorKey, { demandDelta = 0, supplierDelayDelta = 0, inventoryDelta = 0 }) {
    const s = this.getSector(sectorKey);
    const heroProduct = s.products[0];

    const baseDailyRate = heroProduct.dailySalesRate;
    const adjustedDailyRate = Math.max(1, baseDailyRate * (1 + demandDelta / 100));

    const baseStock = heroProduct.stockLeft;
    const adjustedStock = Math.max(0, baseStock * (1 + inventoryDelta / 100));

    const adjustedHours = adjustedDailyRate > 0 ? (adjustedStock / adjustedDailyRate) * 24 : 999;
    const adjustedDays = (adjustedHours / 24).toFixed(1);

    // Dynamic risk score calculation
    let calculatedRisk = Math.round(
      heroProduct.riskScore + (demandDelta * 0.35) + (supplierDelayDelta * 4) - (inventoryDelta * 0.3)
    );
    calculatedRisk = Math.min(99, Math.max(5, calculatedRisk));

    // Dynamic impact calculation
    const baseImpactNum = parseFloat((s.revenueAtRisk.replace(/[^0-9.]/g, '') || '25000'));
    const simulatedImpact = Math.round(baseImpactNum * (1 + (demandDelta * 0.015) + (supplierDelayDelta * 0.12) - (inventoryDelta * 0.01)));

    return {
      sectorKey: s.key,
      heroProduct: heroProduct.name,
      adjustedDailyRate: adjustedDailyRate.toFixed(1) + ' ' + heroProduct.unit + '/day',
      adjustedStock: adjustedStock.toFixed(1) + ' ' + heroProduct.unit,
      simulatedDaysToStockout: adjustedDays,
      simulatedRiskScore: calculatedRisk,
      simulatedRevenueLoss: s.currency + simulatedImpact.toLocaleString(),
      riskSeverity: calculatedRisk >= 75 ? 'Critical' : calculatedRisk >= 50 ? 'Warning' : 'Healthy',
      recommendedAdjustment: demandDelta > 20 || supplierDelayDelta > 2
        ? `Increase backup purchase order by +${Math.round(demandDelta + supplierDelayDelta * 10)}% immediately to avert stockout.`
        : 'Stock buffer remains stable within standard SLA limits.'
    };
  }
}

module.exports = Repository;
