// src/csv-parser.js - Safe CSV Parser and Validator
const { db } = require('./db');

const REQUIRED_SCHEMAS = {
  sales: ['date', 'product', 'quantity', 'revenue'],
  inventory: ['date', 'product', 'stock_level'],
  complaints: ['date', 'category', 'text', 'rating'],
  deliveries: ['date', 'supplier', 'expected_date', 'actual_date'],
  suppliers: ['supplier', 'delivery_time', 'reliability']
};

class CsvParser {
  /**
   * Parse CSV string into array of objects with validation
   */
  static parse(csvText, forcedType = null) {
    if (!csvText || typeof csvText !== 'string' || !csvText.trim()) {
      return { success: false, error: 'Uploaded file is completely empty.' };
    }

    // Check size (max 5MB)
    if (csvText.length > 5 * 1024 * 1024) {
      return { success: false, error: 'File size exceeds maximum permitted limit (5MB).' };
    }

    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length < 2) {
      return { success: false, error: 'CSV file must contain a header row and at least one data row.' };
    }

    // Parse header row
    const rawHeaders = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));
    
    // Auto-detect type if not forced
    let detectedType = forcedType;
    if (!detectedType) {
      if (rawHeaders.includes('stock_level')) detectedType = 'inventory';
      else if (rawHeaders.includes('revenue') || rawHeaders.includes('quantity')) detectedType = 'sales';
      else if (rawHeaders.includes('rating') || rawHeaders.includes('complaints')) detectedType = 'complaints';
      else if (rawHeaders.includes('expected_date') || rawHeaders.includes('actual_date')) detectedType = 'deliveries';
      else if (rawHeaders.includes('reliability') || rawHeaders.includes('delivery_time')) detectedType = 'suppliers';
      else detectedType = 'sales'; // fallback check
    }

    const requiredCols = REQUIRED_SCHEMAS[detectedType];
    if (!requiredCols) {
      return { success: false, error: `Unsupported data category '${detectedType}'.` };
    }

    // Check missing columns
    const missing = requiredCols.filter(col => !rawHeaders.includes(col));
    if (missing.length > 0) {
      return {
        success: false,
        error: `This file is missing required columns: ${missing.join(', ')}.`,
        detectedType,
        foundHeaders: rawHeaders,
        expectedHeaders: requiredCols
      };
    }

    // Parse data rows
    const rows = [];
    const errors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV regex parsing taking quotes into account
      const values = [];
      let inQuote = false;
      let curr = '';
      for (let c = 0; c < line.length; c++) {
        const char = line[c];
        if (char === '"' || char === "'") {
          inQuote = !inQuote;
        } else if (char === ',' && !inQuote) {
          values.push(curr.trim());
          curr = '';
        } else {
          curr += char;
        }
      }
      values.push(curr.trim());

      if (values.length !== rawHeaders.length) {
        errors.push(`Row ${i + 1}: Column count mismatch (expected ${rawHeaders.length}, got ${values.length})`);
        continue;
      }

      const rowObj = {};
      rawHeaders.forEach((header, idx) => {
        rowObj[header] = values[idx] ? values[idx].replace(/^["']|["']$/g, '') : '';
      });

      // Type validation
      if (detectedType === 'sales') {
        const qty = parseFloat(rowObj.quantity);
        const rev = parseFloat(rowObj.revenue);
        if (isNaN(qty) || isNaN(rev)) {
          errors.push(`Row ${i + 1}: Invalid numeric quantity or revenue`);
          continue;
        }
        rowObj.quantity = qty;
        rowObj.revenue = rev;
      } else if (detectedType === 'inventory') {
        const stock = parseFloat(rowObj.stock_level);
        if (isNaN(stock)) {
          errors.push(`Row ${i + 1}: Invalid stock_level`);
          continue;
        }
        rowObj.stock_level = stock;
      } else if (detectedType === 'complaints') {
        const rating = parseInt(rowObj.rating, 10);
        if (isNaN(rating) || rating < 1 || rating > 5) {
          errors.push(`Row ${i + 1}: Rating must be an integer between 1 and 5`);
          continue;
        }
        rowObj.rating = rating;
      } else if (detectedType === 'suppliers') {
        const delTime = parseFloat(rowObj.delivery_time);
        const rel = parseFloat(rowObj.reliability);
        if (isNaN(delTime) || isNaN(rel)) {
          errors.push(`Row ${i + 1}: Invalid numeric delivery_time or reliability`);
          continue;
        }
        rowObj.delivery_time = delTime;
        rowObj.reliability = rel;
      }

      rows.push(rowObj);
    }

    if (rows.length === 0) {
      return {
        success: false,
        error: errors.length > 0 ? `Failed to parse any valid rows. Errors: ${errors.slice(0, 3).join('; ')}` : 'No valid data rows found in CSV.'
      };
    }

    return {
      success: true,
      category: detectedType,
      rowCount: rows.length,
      warningCount: errors.length,
      sampleRows: rows.slice(0, 5),
      data: rows
    };
  }

  /**
   * Save parsed data to SQLite database
   */
  static saveToDb(parsedResult, businessId = 1) {
    if (!parsedResult || !parsedResult.success) return 0;
    const { category, data } = parsedResult;

    let inserted = 0;
    if (category === 'sales') {
      const stmt = db.prepare(`
        INSERT INTO sales (business_id, date, product, quantity, revenue, category)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.forEach(r => {
        stmt.run(businessId, r.date, r.product, r.quantity, r.revenue, r.category || 'Uploaded');
        inserted++;
      });
    } else if (category === 'inventory') {
      const stmt = db.prepare(`
        INSERT INTO inventory (business_id, date, product, stock_level, unit)
        VALUES (?, ?, ?, ?, ?)
      `);
      data.forEach(r => {
        stmt.run(businessId, r.date, r.product, r.stock_level, r.unit || 'units');
        inserted++;
      });
    } else if (category === 'complaints') {
      const stmt = db.prepare(`
        INSERT INTO complaints (business_id, date, category, text, rating, resolved)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.forEach(r => {
        stmt.run(businessId, r.date, r.category, r.text, r.rating, 0);
        inserted++;
      });
    } else if (category === 'deliveries') {
      const stmt = db.prepare(`
        INSERT INTO deliveries (business_id, date, supplier, expected_date, actual_date, delay_days)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.forEach(r => {
        const d1 = new Date(r.expected_date);
        const d2 = new Date(r.actual_date || r.expected_date);
        const diff = Math.max(0, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
        stmt.run(businessId, r.date, r.supplier, r.expected_date, r.actual_date, diff);
        inserted++;
      });
    } else if (category === 'suppliers') {
      const stmt = db.prepare(`
        INSERT INTO suppliers (business_id, name, item_supplied, delivery_time, reliability, trend)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      data.forEach(r => {
        stmt.run(businessId, r.supplier, r.item_supplied || 'General Supplies', r.delivery_time, r.reliability, 'Active');
        inserted++;
      });
    }

    return inserted;
  }

  /**
   * Generate sample CSV templates for easy user testing
   */
  static getSampleCsv(type = 'sales') {
    switch (type) {
      case 'sales':
        return `date,product,quantity,revenue\n2026-10-01,Butter Chicken,24.5,7840\n2026-10-01,Chicken Biryani,18.0,5400\n2026-10-02,Paneer Tikka,12.0,3360\n2026-10-02,Butter Chicken,26.0,8320\n2026-10-03,Garlic Naan,45.0,4275`;
      case 'inventory':
        return `date,product,stock_level\n2026-10-01,Raw Chicken,44.5\n2026-10-02,Raw Chicken,38.0\n2026-10-03,Sunflower Cooking Oil,224.0\n2026-10-03,Fresh Dairy Paneer,14.5`;
      case 'complaints':
        return `date,category,text,rating\n2026-10-02,unavailable items,"Butter Chicken was sold out at 8:30 PM",2\n2026-10-02,waiting time,"Delivery order cancelled after 30 mins delay",1\n2026-10-03,food quality,"Dal Makhani was excellent",5`;
      case 'deliveries':
        return `date,supplier,expected_date,actual_date\n2026-10-01,Apex Meat Logistics,2026-10-02,2026-10-04\n2026-10-02,Fresh Poultry Co,2026-10-03,2026-10-03\n2026-10-03,Evergreen Dairy Hub,2026-10-04,2026-10-04`;
      case 'suppliers':
        return `supplier,delivery_time,reliability\nApex Meat Logistics,2.7,62.0\nFresh Poultry Co,0.8,91.0\nEvergreen Dairy Hub,1.1,88.0\nGolden Fields Wholesale,1.4,94.0`;
      default:
        return `date,product,quantity,revenue\n2026-10-01,Sample Product,10,1500`;
    }
  }
}

module.exports = CsvParser;
