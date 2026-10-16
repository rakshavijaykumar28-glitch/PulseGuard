// test-copilot.js - Tests all questions
async function testQuestions() {
  const qs = [
    'What is my biggest risk?',
    'Why is inventory risky?',
    'Which supplier has the most delays?',
    'Why is revenue falling?',
    'Which product has the highest risk?',
    'What evidence supports this alert?',
    'What happens if demand increases?',
    'How much potential revenue is affected?'
  ];
  for (const q of qs) {
    const res = await (await fetch('http://127.0.0.1:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q })
    })).json();
    console.log('Q:', q);
    console.log('-> Ans:', res.answer);
    console.log('-> Evidence count:', res.evidence.length);
    console.log('-> Recommendation:', res.recommendation ? 'Present' : 'None');
    console.log('--------------------------------------------------');
  }
}
testQuestions().catch(console.error);
