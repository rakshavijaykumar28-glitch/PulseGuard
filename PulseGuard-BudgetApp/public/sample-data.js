// public/sample-data.js - Realistic starter data for Personal Budget App
const BUDGET_SAMPLE_DATA = {
  categories: [
    // Expense Categories (Restrained tonal palette; single cognac accent for Dining)
    { id: 'cat-housing', name: 'Housing', type: 'expense', color: '#141414', icon: 'home' },
    { id: 'cat-groceries', name: 'Groceries', type: 'expense', color: '#36322e', icon: 'cart' },
    { id: 'cat-dining', name: 'Dining', type: 'expense', color: '#b85d19', icon: 'coffee' }, // Single accent: 32% over budget
    { id: 'cat-utilities', name: 'Utilities', type: 'expense', color: '#57514a', icon: 'zap' },
    { id: 'cat-transport', name: 'Transportation', type: 'expense', color: '#756e64', icon: 'car' },
    { id: 'cat-entertainment', name: 'Entertainment', type: 'expense', color: '#948b7f', icon: 'film' },
    { id: 'cat-health', name: 'Health & Fitness', type: 'expense', color: '#aea597', icon: 'activity' },
    { id: 'cat-shopping', name: 'Shopping', type: 'expense', color: '#c7bfb2', icon: 'bag' },
    { id: 'cat-subscriptions', name: 'Subscriptions', type: 'expense', color: '#6b645b', icon: 'credit-card' },
    { id: 'cat-misc', name: 'Miscellaneous', type: 'expense', color: '#8c8479', icon: 'tag' },

    // Income Categories
    { id: 'cat-salary', name: 'Salary', type: 'income', color: '#141414', icon: 'briefcase' },
    { id: 'cat-freelance', name: 'Freelance', type: 'income', color: '#36322e', icon: 'laptop' },
    { id: 'cat-investments', name: 'Investments', type: 'income', color: '#b85d19', icon: 'trending-up' },
    { id: 'cat-other-income', name: 'Other Income', type: 'income', color: '#57514a', icon: 'plus-circle' }
  ],

  // Monthly Budget Limits (keyed by category ID)
  monthlyBudgets: {
    '2026-10': {
      'cat-housing': 1650,
      'cat-groceries': 500,
      'cat-dining': 400,       // $528 spent -> 32% over budget!
      'cat-utilities': 250,
      'cat-transport': 220,
      'cat-entertainment': 180,
      'cat-health': 100,
      'cat-shopping': 250,
      'cat-subscriptions': 60,
      'cat-misc': 100
    },
    '2026-09': {
      'cat-housing': 1650,
      'cat-groceries': 500,
      'cat-dining': 400,
      'cat-utilities': 250,
      'cat-transport': 220,
      'cat-entertainment': 180,
      'cat-health': 100,
      'cat-shopping': 250,
      'cat-subscriptions': 60,
      'cat-misc': 100
    },
    '2026-08': {
      'cat-housing': 1650,
      'cat-groceries': 500,
      'cat-dining': 400,
      'cat-utilities': 260,
      'cat-transport': 220,
      'cat-entertainment': 180,
      'cat-health': 100,
      'cat-shopping': 250,
      'cat-subscriptions': 60,
      'cat-misc': 100
    }
  },

  // Default fallback monthly budget limits for newly selected months
  defaultBudgetLimits: {
    'cat-housing': 1650,
    'cat-groceries': 500,
    'cat-dining': 400,
    'cat-utilities': 250,
    'cat-transport': 220,
    'cat-entertainment': 180,
    'cat-health': 100,
    'cat-shopping': 250,
    'cat-subscriptions': 60,
    'cat-misc': 100
  },

  // Transaction Ledger (Current Month: October 2026 & Historical Months)
  transactions: [
    // --- October 2026 (Current Month) ---
    // Incomes
    { id: 'tx-1001', date: '2026-10-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: 'First pay period of Oct' },
    { id: 'tx-1002', date: '2026-10-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: 'Second pay period of Oct' },
    { id: 'tx-1003', date: '2026-10-08', type: 'income', categoryId: 'cat-freelance', description: 'Web Design Project Milestone', amount: 1250.00, paymentMethod: 'Bank Transfer', notes: 'Client invoice paid' },
    { id: 'tx-1004', date: '2026-10-10', type: 'income', categoryId: 'cat-investments', description: 'Vanguard Index Fund Dividend', amount: 120.00, paymentMethod: 'Direct Deposit', notes: 'Quarterly distribution' },

    // Expenses: Housing ($1,650)
    { id: 'tx-1005', date: '2026-10-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: 'Oct Rent' },

    // Expenses: Groceries ($410)
    { id: 'tx-1006', date: '2026-10-03', type: 'expense', categoryId: 'cat-groceries', description: 'Trader Joe\'s Grocery Haul', amount: 115.40, paymentMethod: 'Debit Card', notes: 'Produce and pantry essentials' },
    { id: 'tx-1007', date: '2026-10-07', type: 'expense', categoryId: 'cat-groceries', description: 'Whole Foods Market', amount: 84.60, paymentMethod: 'Credit Card', notes: 'Organic meat and snacks' },
    { id: 'tx-1008', date: '2026-10-10', type: 'expense', categoryId: 'cat-groceries', description: 'Costco Wholesale Essentials', amount: 145.00, paymentMethod: 'Credit Card', notes: 'Bulk paper goods and oats' },
    { id: 'tx-1009', date: '2026-10-13', type: 'expense', categoryId: 'cat-groceries', description: 'Local Farmer\'s Market', amount: 65.00, paymentMethod: 'Cash', notes: 'Fresh fruit and sourdough' },

    // Expenses: Dining ($528 -> 32% over the $400 budget!)
    { id: 'tx-1010', date: '2026-10-02', type: 'expense', categoryId: 'cat-dining', description: 'Sushi Harbor Bistro Dinner', amount: 94.00, paymentMethod: 'Credit Card', notes: 'Dinner with college friends' },
    { id: 'tx-1011', date: '2026-10-05', type: 'expense', categoryId: 'cat-dining', description: 'Oat Milk Latte & Bakery Treats', amount: 18.50, paymentMethod: 'Credit Card', notes: 'Morning work session' },
    { id: 'tx-1012', date: '2026-10-06', type: 'expense', categoryId: 'cat-dining', description: 'Italian Trattoria Date Night', amount: 142.00, paymentMethod: 'Credit Card', notes: 'Anniversary celebration' },
    { id: 'tx-1013', date: '2026-10-09', type: 'expense', categoryId: 'cat-dining', description: 'Shake Shack Lunch Delivery', amount: 32.50, paymentMethod: 'Credit Card', notes: 'Doordash delivery' },
    { id: 'tx-1014', date: '2026-10-11', type: 'expense', categoryId: 'cat-dining', description: 'Craft Beer & Pizza Gathering', amount: 118.00, paymentMethod: 'Credit Card', notes: 'Team happy hour split' },
    { id: 'tx-1015', date: '2026-10-12', type: 'expense', categoryId: 'cat-dining', description: 'Chipotle Mexican Grill', amount: 26.00, paymentMethod: 'Debit Card', notes: 'Quick lunch' },
    { id: 'tx-1016', date: '2026-10-14', type: 'expense', categoryId: 'cat-dining', description: 'Artisan Coffee Roasters', amount: 97.00, paymentMethod: 'Credit Card', notes: 'Specialty coffee beans and brunch' },

    // Expenses: Utilities ($230)
    { id: 'tx-1017', date: '2026-10-04', type: 'expense', categoryId: 'cat-utilities', description: 'Pacific Gas & Electric Power', amount: 120.00, paymentMethod: 'Auto Debit', notes: 'Sept power usage' },
    { id: 'tx-1018', date: '2026-10-05', type: 'expense', categoryId: 'cat-utilities', description: 'Fiber Gigabit Internet', amount: 70.00, paymentMethod: 'Credit Card', notes: 'Monthly connection' },
    { id: 'tx-1019', date: '2026-10-08', type: 'expense', categoryId: 'cat-utilities', description: 'City Water & Trash Service', amount: 40.00, paymentMethod: 'Auto Debit', notes: 'Quarterly municipal' },

    // Expenses: Transportation ($185)
    { id: 'tx-1020', date: '2026-10-03', type: 'expense', categoryId: 'cat-transport', description: 'Shell Gasoline Fill-up', amount: 55.00, paymentMethod: 'Credit Card', notes: 'Full tank regular' },
    { id: 'tx-1021', date: '2026-10-08', type: 'expense', categoryId: 'cat-transport', description: 'Metro Transit Monthly Pass', amount: 90.00, paymentMethod: 'Debit Card', notes: 'Subway card recharge' },
    { id: 'tx-1022', date: '2026-10-12', type: 'expense', categoryId: 'cat-transport', description: 'Uber Airport Ride', amount: 40.00, paymentMethod: 'Credit Card', notes: 'Ride home from station' },

    // Expenses: Entertainment ($140)
    { id: 'tx-1023', date: '2026-10-04', type: 'expense', categoryId: 'cat-entertainment', description: 'Indie Cinema Film Festival', amount: 36.00, paymentMethod: 'Credit Card', notes: 'Weekend screening' },
    { id: 'tx-1024', date: '2026-10-10', type: 'expense', categoryId: 'cat-entertainment', description: 'Live Concert Tickets', amount: 85.00, paymentMethod: 'Credit Card', notes: 'Downtown venue ticket' },
    { id: 'tx-1025', date: '2026-10-13', type: 'expense', categoryId: 'cat-entertainment', description: 'Steam Autumn Indie Game', amount: 19.00, paymentMethod: 'Credit Card', notes: 'Puzzle game sale' },

    // Expenses: Health & Fitness ($95)
    { id: 'tx-1026', date: '2026-10-01', type: 'expense', categoryId: 'cat-health', description: 'Bouldering & Gym Membership', amount: 75.00, paymentMethod: 'Auto Debit', notes: 'Monthly recurring gym pass' },
    { id: 'tx-1027', date: '2026-10-09', type: 'expense', categoryId: 'cat-health', description: 'CVS Pharmacy Vitamins', amount: 20.00, paymentMethod: 'Debit Card', notes: 'Electrolytes and vitamin D' },

    // Expenses: Shopping ($210)
    { id: 'tx-1028', date: '2026-10-06', type: 'expense', categoryId: 'cat-shopping', description: 'Uniqlo Winter Fleece Jacket', amount: 89.00, paymentMethod: 'Credit Card', notes: 'Seasonal clothing' },
    { id: 'tx-1029', date: '2026-10-11', type: 'expense', categoryId: 'cat-shopping', description: 'Home Office Desk Organizer', amount: 45.00, paymentMethod: 'Credit Card', notes: 'Cable tray & stand' },
    { id: 'tx-1030', date: '2026-10-13', type: 'expense', categoryId: 'cat-shopping', description: 'Kinokuniya Book & Journal', amount: 76.00, paymentMethod: 'Credit Card', notes: 'Architecture books' },

    // Expenses: Subscriptions ($55)
    { id: 'tx-1031', date: '2026-10-02', type: 'expense', categoryId: 'cat-subscriptions', description: 'Spotify Family Subscription', amount: 16.99, paymentMethod: 'Credit Card', notes: 'Music streaming' },
    { id: 'tx-1032', date: '2026-10-05', type: 'expense', categoryId: 'cat-subscriptions', description: 'iCloud 2TB Storage Plan', amount: 9.99, paymentMethod: 'Credit Card', notes: 'Cloud backup' },
    { id: 'tx-1033', date: '2026-10-09', type: 'expense', categoryId: 'cat-subscriptions', description: 'GitHub Pro & Copilot', amount: 14.00, paymentMethod: 'Credit Card', notes: 'Dev tools' },
    { id: 'tx-1034', date: '2026-10-12', type: 'expense', categoryId: 'cat-subscriptions', description: 'NYTimes Digital Access', amount: 14.02, paymentMethod: 'Credit Card', notes: 'News subscription' },

    // Expenses: Miscellaneous ($45)
    { id: 'tx-1035', date: '2026-10-07', type: 'expense', categoryId: 'cat-misc', description: 'Dry Cleaning Service', amount: 45.00, paymentMethod: 'Credit Card', notes: 'Suit cleaning' },

    // --- September 2026 ---
    { id: 'tx-0901', date: '2026-09-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0902', date: '2026-09-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0903', date: '2026-09-10', type: 'income', categoryId: 'cat-freelance', description: 'Brand Identity Design Project', amount: 1100.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0904', date: '2026-09-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0905', date: '2026-09-05', type: 'expense', categoryId: 'cat-groceries', description: 'Whole Foods Grocery', amount: 465.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0906', date: '2026-09-12', type: 'expense', categoryId: 'cat-dining', description: 'Restaurants & Cafe Visits', amount: 385.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0907', date: '2026-09-14', type: 'expense', categoryId: 'cat-utilities', description: 'Electric, Gas & Internet', amount: 240.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0908', date: '2026-09-18', type: 'expense', categoryId: 'cat-transport', description: 'Gasoline & Transit Pass', amount: 205.00, paymentMethod: 'Debit Card', notes: '' },
    { id: 'tx-0909', date: '2026-09-22', type: 'expense', categoryId: 'cat-entertainment', description: 'Concert & Museum Pass', amount: 165.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0910', date: '2026-09-25', type: 'expense', categoryId: 'cat-health', description: 'Gym Pass & Vitamins', amount: 95.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0911', date: '2026-09-28', type: 'expense', categoryId: 'cat-shopping', description: 'Kitchen Cookware & Books', amount: 190.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0912', date: '2026-09-29', type: 'expense', categoryId: 'cat-subscriptions', description: 'Digital Services', amount: 55.00, paymentMethod: 'Credit Card', notes: '' },

    // --- August 2026 ---
    { id: 'tx-0801', date: '2026-08-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0802', date: '2026-08-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0803', date: '2026-08-20', type: 'income', categoryId: 'cat-freelance', description: 'UI Audit Consulting', amount: 950.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0804', date: '2026-08-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0805', date: '2026-08-08', type: 'expense', categoryId: 'cat-groceries', description: 'Trader Joe\'s & Costco', amount: 490.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0806', date: '2026-08-14', type: 'expense', categoryId: 'cat-dining', description: 'Summer Dinners & Patios', amount: 430.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0807', date: '2026-08-16', type: 'expense', categoryId: 'cat-utilities', description: 'Power & High Summer AC', amount: 280.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0808', date: '2026-08-20', type: 'expense', categoryId: 'cat-transport', description: 'Fuel & Maintenance', amount: 240.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0809', date: '2026-08-22', type: 'expense', categoryId: 'cat-entertainment', description: 'Summer Fest & Outdoor Movie', amount: 175.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0810', date: '2026-08-25', type: 'expense', categoryId: 'cat-health', description: 'Gym Pass & Running Shoes', amount: 140.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0811', date: '2026-08-28', type: 'expense', categoryId: 'cat-shopping', description: 'Summer Apparel', amount: 220.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0812', date: '2026-08-30', type: 'expense', categoryId: 'cat-subscriptions', description: 'Digital Subscriptions', amount: 55.00, paymentMethod: 'Credit Card', notes: '' },

    // --- July 2026 ---
    { id: 'tx-0701', date: '2026-07-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0702', date: '2026-07-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0703', date: '2026-07-10', type: 'income', categoryId: 'cat-investments', description: 'Q2 Dividend Payout', amount: 115.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0704', date: '2026-07-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0705', date: '2026-07-06', type: 'expense', categoryId: 'cat-groceries', description: 'Food & Pantry Supplies', amount: 480.00, paymentMethod: 'Debit Card', notes: '' },
    { id: 'tx-0706', date: '2026-07-12', type: 'expense', categoryId: 'cat-dining', description: 'July 4th BBQ & Dining', amount: 410.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0707', date: '2026-07-15', type: 'expense', categoryId: 'cat-utilities', description: 'Electric AC & Internet', amount: 275.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0708', date: '2026-07-18', type: 'expense', categoryId: 'cat-transport', description: 'Roadtrip Gas & Transit', amount: 230.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0709', date: '2026-07-22', type: 'expense', categoryId: 'cat-entertainment', description: 'Outdoor Events', amount: 160.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0710', date: '2026-07-25', type: 'expense', categoryId: 'cat-health', description: 'Gym Pass', amount: 75.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0711', date: '2026-07-28', type: 'expense', categoryId: 'cat-shopping', description: 'Travel Gear', amount: 180.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0712', date: '2026-07-30', type: 'expense', categoryId: 'cat-subscriptions', description: 'Digital Subscriptions', amount: 55.00, paymentMethod: 'Credit Card', notes: '' },

    // --- June 2026 ---
    { id: 'tx-0601', date: '2026-06-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0602', date: '2026-06-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0603', date: '2026-06-18', type: 'income', categoryId: 'cat-freelance', description: 'App Landing Page Dev', amount: 1400.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0604', date: '2026-06-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0605', date: '2026-06-05', type: 'expense', categoryId: 'cat-groceries', description: 'Supermarket Groceries', amount: 470.00, paymentMethod: 'Debit Card', notes: '' },
    { id: 'tx-0606', date: '2026-06-11', type: 'expense', categoryId: 'cat-dining', description: 'Weekend Eateries & Coffee', amount: 395.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0607', date: '2026-06-15', type: 'expense', categoryId: 'cat-utilities', description: 'Power & Fiber Net', amount: 235.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0608', date: '2026-06-18', type: 'expense', categoryId: 'cat-transport', description: 'Commuter Rail & Fuel', amount: 210.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0609', date: '2026-06-22', type: 'expense', categoryId: 'cat-entertainment', description: 'Theater & Bowling Night', amount: 145.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0610', date: '2026-06-25', type: 'expense', categoryId: 'cat-health', description: 'Gym Pass', amount: 75.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0611', date: '2026-06-28', type: 'expense', categoryId: 'cat-shopping', description: 'Summer Shoes & Books', amount: 195.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0612', date: '2026-06-30', type: 'expense', categoryId: 'cat-subscriptions', description: 'Digital Subscriptions', amount: 55.00, paymentMethod: 'Credit Card', notes: '' },

    // --- May 2026 ---
    { id: 'tx-0501', date: '2026-05-01', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0502', date: '2026-05-15', type: 'income', categoryId: 'cat-salary', description: 'TechWorks Bi-Weekly Payroll', amount: 2400.00, paymentMethod: 'Direct Deposit', notes: '' },
    { id: 'tx-0503', date: '2026-05-10', type: 'income', categoryId: 'cat-freelance', description: 'Consulting Workshop', amount: 800.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0504', date: '2026-05-01', type: 'expense', categoryId: 'cat-housing', description: 'Monthly Apartment Rent', amount: 1650.00, paymentMethod: 'Bank Transfer', notes: '' },
    { id: 'tx-0505', date: '2026-05-06', type: 'expense', categoryId: 'cat-groceries', description: 'Groceries & Provisions', amount: 460.00, paymentMethod: 'Debit Card', notes: '' },
    { id: 'tx-0506', date: '2026-05-12', type: 'expense', categoryId: 'cat-dining', description: 'Restaurants & Coffee', amount: 370.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0507', date: '2026-05-15', type: 'expense', categoryId: 'cat-utilities', description: 'Utilities & Net', amount: 225.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0508', date: '2026-05-19', type: 'expense', categoryId: 'cat-transport', description: 'Gasoline & Transit', amount: 195.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0509', date: '2026-05-23', type: 'expense', categoryId: 'cat-entertainment', description: 'Movies & Board Games', amount: 130.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0510', date: '2026-05-26', type: 'expense', categoryId: 'cat-health', description: 'Gym Pass', amount: 75.00, paymentMethod: 'Auto Debit', notes: '' },
    { id: 'tx-0511', date: '2026-05-28', type: 'expense', categoryId: 'cat-shopping', description: 'Clothing Essentials', amount: 160.00, paymentMethod: 'Credit Card', notes: '' },
    { id: 'tx-0512', date: '2026-05-30', type: 'expense', categoryId: 'cat-subscriptions', description: 'Digital Subscriptions', amount: 55.00, paymentMethod: 'Credit Card', notes: '' }
  ]
};

if (typeof window !== 'undefined') {
  window.BUDGET_SAMPLE_DATA = BUDGET_SAMPLE_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BUDGET_SAMPLE_DATA;
}

