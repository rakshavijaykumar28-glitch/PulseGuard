// src/report-generator.js - Generates executive business risk report
const { db } = require('./db');
const AnalyticsEngine = require('./analytics-engine');

class ReportGenerator {
  static generate(businessId = 1) {
    const biz = db.prepare(`SELECT * FROM businesses WHERE id = ?`).get(businessId) || {
      name: 'Heritage Bites',
      industry: 'Food & Beverage',
      type: 'Restaurant & Delivery',
      currency: '₹'
    };

    const health = AnalyticsEngine.getHealthScore(businessId);
    const risks = AnalyticsEngine.getRisks(businessId);
    const suppliers = AnalyticsEngine.getSuppliers(businessId);
    const sentiment = AnalyticsEngine.getCustomerSentiment(businessId);

    const reportData = {
      meta: {
        reportId: `PGR-${Date.now().toString().slice(-6)}`,
        businessName: biz.name,
        industry: biz.industry,
        businessType: biz.type,
        currency: biz.currency,
        generatedAt: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        auditor: 'PulseGuard AI Deterministic Engine v2.4'
      },
      healthScore: health,
      risks: risks.map(r => ({
        id: r.id,
        title: r.title,
        severity: r.severity,
        riskScore: r.risk_score,
        probability: r.probabilityFormatted,
        impact: r.impactFormatted,
        urgency: r.urgency,
        summary: r.summary,
        evidence: r.evidence,
        rootCause: r.rootCause,
        costOfInaction: r.costOfInaction,
        recommendations: r.recommendations,
        actions: r.actions
      })),
      suppliers,
      customerSentiment: sentiment,
      historicalTrends: {
        salesVelocity: '+14% overall 30-day top-line growth; +31% weekend poultry demand surge',
        inventoryHealth: '-24% safety buffer depletion on raw poultry (38kg remaining; 2.4 days cover)',
        supplierTrend: 'Apex Meat Logistics reliability dropped to 62% with 2.7-day delivery lag'
      },
      managerVerification: {
        preparedFor: 'Vikram Malhotra (Owner)',
        reviewStatus: 'Pending Management Sign-off',
        actionItemsTotal: 4,
        nextReviewDate: '2026-10-06'
      }
    };

    // Store in reports table
    const stmt = db.prepare(`
      INSERT INTO reports (business_id, title, health_score, report_data_json)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(
      businessId,
      `Operations Early-Warning Audit: ${biz.name}`,
      health.overallScore,
      JSON.stringify(reportData)
    );

    return {
      reportId: result.lastInsertRowid,
      ...reportData
    };
  }
}

module.exports = ReportGenerator;
