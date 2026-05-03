const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')

const perplexityApiKey = defineSecret('PERPLEXITY_API_KEY')
const allowedOrigins = new Set([
  'https://iicocece-assessment.web.app',
  'https://iicocece-assessment.firebaseapp.com',
  'http://127.0.0.1:5173',
  'http://localhost:5173',
])

function setCors(req, res) {
  const origin = req.get('origin')
  if (origin && allowedOrigins.has(origin)) {
    res.set('Access-Control-Allow-Origin', origin)
    res.set('Vary', 'Origin')
  }
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.set('Access-Control-Allow-Headers', 'Content-Type')
  res.set('Cache-Control', 'no-store')
}

function trimPayload(payload) {
  const cloned = JSON.parse(JSON.stringify(payload))
  while (JSON.stringify(cloned).length > 150000) {
    const samples = cloned.questionBankContext?.relevantQuestionSamples
    if (Array.isArray(samples) && samples.length > 8) {
      cloned.questionBankContext.relevantQuestionSamples = samples.slice(0, Math.ceil(samples.length / 2))
      continue
    }
    const history = cloned.chatHistory
    if (Array.isArray(history) && history.length > 4) {
      cloned.chatHistory = history.slice(Math.floor(history.length / 2))
      continue
    }
    const trend = cloned.analytics?.trend
    if (Array.isArray(trend) && trend.length > 10) {
      cloned.analytics.trend = trend.slice(-10)
      continue
    }
    break
  }
  return cloned
}

exports.analyticsIntelligence = onRequest(
  {
    region: 'us-central1',
    timeoutSeconds: 120,
    memory: '512MiB',
    secrets: [perplexityApiKey],
  },
  async (req, res) => {
    setCors(req, res)
    if (req.method === 'OPTIONS') {
      res.status(204).send('')
      return
    }
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Use POST for analytics intelligence.' })
      return
    }

    const question = String(req.body?.question ?? '').trim()
    if (!question) {
      res.status(400).json({ error: 'Question is required.' })
      return
    }

    const apiKey = perplexityApiKey.value()
    if (!apiKey) {
      res.status(500).json({ error: 'Perplexity API key is not configured.' })
      return
    }

    const payload = trimPayload({
      filters: req.body?.filters ?? {},
      chatHistory: Array.isArray(req.body?.chatHistory) ? req.body.chatHistory.slice(-10) : [],
      analytics: req.body?.analytics ?? {},
      questionBankContext: req.body?.questionBankContext ?? {},
    })

    const messages = [
      {
        role: 'system',
        content:
          'You are DEAP Intelligence, an admin decision-support analyst for an employee assessment LMS. Use the supplied internal analytics, attempts, question-bank metadata, question samples, answer scoring, topics, and filters to answer. Give concrete recommendations, risk flags, likely causes, and next actions. If the supplied data is sparse or incomplete, say that clearly. Do not invent employees, scores, questions, or results that are not present. Do not reveal passwords or secrets.',
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            adminQuestion: question,
            deapContext: payload,
          },
          null,
          2,
        ),
      },
    ]

    try {
      const upstream = await fetch('https://api.perplexity.ai/v1/sonar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages,
          max_tokens: 1800,
          temperature: 0.2,
          disable_search: true,
        }),
      })
      const data = await upstream.json().catch(() => ({}))
      if (!upstream.ok) {
        res.status(upstream.status).json({ error: data?.error?.message ?? data?.message ?? 'Perplexity request failed.' })
        return
      }
      res.json({
        answer: data?.choices?.[0]?.message?.content ?? 'No analysis was returned.',
        model: data?.model,
        citations: Array.isArray(data?.citations) ? data.citations : [],
      })
    } catch (error) {
      res.status(502).json({ error: error instanceof Error ? error.message : 'AI provider request failed.' })
    }
  },
)
