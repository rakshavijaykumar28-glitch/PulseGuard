// src/gemini.js - Google Gemini AI Backend Integration for PulseGuard AI
const Repository = require('./repository');

class GeminiService {
  static getApiKey() {
    return process.env.GEMINI_API_KEY || '';
  }

  static async generateAnswer(question, sectorKey = 'restaurant') {
    const apiKey = this.getApiKey();
    const sector = Repository.getSector(sectorKey);
    const kpis = sector.kpis;
    const topProduct = sector.products[0];
    const topSupplier = sector.suppliers[0];
    const topAction = sector.actions[0];

    const systemContext = `
You are PulseGuard AI, an enterprise early-warning intelligence system for ${sector.name} (${sector.businessName}).
Currency: ${sector.currency}
Key Verified Ledger Metrics:
- Items Tracked: ${kpis.itemsTracked}
- Critical Alerts: ${kpis.criticalAlerts}
- Total Stock Value: ${kpis.totalStockValue}
- Total Stock Left: ${kpis.totalStockLeft}
- Daily Profit: ${kpis.profitPerDay}
- Revenue at Risk: ${kpis.revenueAtRisk}

Highest Risk Item:
- Product: ${topProduct.name}
- Stock Left: ${topProduct.stockLeft} ${topProduct.unit}
- Daily Burn Rate: ${topProduct.dailySalesRate} ${topProduct.unit}/day
- Estimated Time to Depletion: ${topProduct.hoursToSellout} hours
- Incoming Reorder: ${topProduct.incomingStock} ${topProduct.incomingUnit} (${topProduct.incomingDate})
- Risk Score: ${topProduct.riskScore}/100 (${topProduct.status})

Critical Supplier Bottleneck:
- Supplier: ${topSupplier.name} (${topSupplier.itemSupplied})
- Lead Time Delay: ${topSupplier.leadTime}
- Reliability Score: ${topSupplier.reliability}% (${topSupplier.status})

Top Recommended Action:
- Action: ${topAction.title}
- Assigned to: ${topAction.responsible}
- Deadline: ${topAction.deadline}
- Expected Impact: ${topAction.expectedImpact}

Rules:
1. Always be concise, actionable, and grounded strictly in the ledger numbers above.
2. Never hallucinate fake metrics.
3. Quantify financial and operational impact directly.
4. Speak as an executive operations copilot.
`;

    if (apiKey) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  role: 'user',
                  parts: [
                    { text: systemContext + '\n\nUser Question: ' + question }
                  ]
                }
              ],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 350
              }
            })
          }
        );

        if (response.ok) {
          const json = await response.json();
          const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            return {
              answer: candidateText.trim(),
              source: 'Google Gemini 1.5 Flash (Grounded in Verified Ledger)',
              model: 'gemini-1.5-flash',
              status: 'live_gemini',
              sector: sector.name
            };
          }
        }
      } catch (err) {
        console.warn('Gemini API call failed, falling back to deterministic ledger engine:', err.message);
      }
    }

    // Grounded Fallback Engine (Strict Deterministic Reasoning)
    const qLower = question.toLowerCase();
    let answer = '';

    if (qLower.includes('biggest risk') || qLower.includes('critical') || qLower.includes('alert')) {
      answer = `Your most critical vulnerability in ${sector.name} is ${topProduct.name}. At a consumption velocity of ${topProduct.dailySalesRate} ${topProduct.unit}/day, current reserves (${topProduct.stockLeft} ${topProduct.unit}) will deplete within ${topProduct.hoursToSellout} hours. Incoming stock is lagging due to ${topSupplier.name} (${topSupplier.leadTime}). Total revenue at risk is ${kpis.revenueAtRisk}.`;
    } else if (qLower.includes('what should i do') || qLower.includes('action') || qLower.includes('today') || qLower.includes('recommend')) {
      answer = `Immediate priority: ${topAction.title}. Assigned to ${topAction.responsible} with deadline ${topAction.deadline}. Expected impact: ${topAction.expectedImpact}. Additionally, contact ${topSupplier.name} (${topSupplier.contact}) to secure arrival confirmation.`;
    } else if (qLower.includes('supplier') || qLower.includes('vendor') || qLower.includes('delay')) {
      answer = `Primary supplier delay is concentrated at ${topSupplier.name} supplying ${topSupplier.itemSupplied}. Average lead time has expanded to ${topSupplier.leadTime} with reliability at ${topSupplier.reliability}%. Recommended action: ${topSupplier.action}.`;
    } else if (qLower.includes('revenue') || qLower.includes('profit') || qLower.includes('money') || qLower.includes('cost')) {
      answer = `Current daily profit is running at ${kpis.profitPerDay}. Total stock value on hand is ${kpis.totalStockValue}. However, unmitigated stockouts and supplier delays threaten ${kpis.revenueAtRisk} in lost orders over the next 48 hours.`;
    } else {
      answer = `In ${sector.businessName} (${sector.name}), ${topProduct.name} requires immediate management attention. Current stock of ${topProduct.stockLeft} ${topProduct.unit} has an estimated ${topProduct.hoursToSellout} hours of sellout runway against daily demand of ${topProduct.dailySalesRate} ${topProduct.unit}/day. Deploying the recommended mitigation (${topAction.title}) will protect ${kpis.revenueAtRisk} in revenue.`;
    }

    return {
      answer,
      source: apiKey ? 'PulseGuard Grounded Intelligence (Gemini Offline Fallback)' : 'PulseGuard Grounded Intelligence Engine',
      model: 'deterministic-verified-ledger',
      status: apiKey ? 'api_key_configured' : 'ledger_grounded',
      sector: sector.name
    };
  }
}

module.exports = GeminiService;
