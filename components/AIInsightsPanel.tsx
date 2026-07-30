'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { askInsightAction, refreshInsightsAction } from '@/lib/actions'

type Insight = {
  id: string
  title: string
  description: string
  confidence: number
  actionItems: string[]
  createdAt: Date
}

export function AIInsightsPanel({
  initialInsights,
  provider,
}: {
  initialInsights: Insight[]
  provider: 'openai' | 'rules'
}) {
  const [insights, setInsights] = useState(initialInsights)
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [mode, setMode] = useState(provider)
  const [pending, startTransition] = useTransition()

  const refresh = () => {
    startTransition(async () => {
      const result = await refreshInsightsAction()
      setInsights(result.insights)
      setMode(result.provider)
    })
  }

  const ask = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const result = await askInsightAction(question)
      if (result.error) {
        setAnswer(result.error)
        return
      }
      setAnswer(result.answer || '')
      if (result.provider) setMode(result.provider)
      setQuestion('')
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2">AI Insights</h1>
          <p className="text-muted-foreground">
            Recommendations generated from your real click data
            {mode === 'openai' ? ' · powered by OpenAI' : ' · smart rules (add OPENAI_API_KEY for GPT)'}
          </p>
        </div>
        <Button variant="outline" onClick={refresh} disabled={pending}>
          {pending ? 'Thinking…' : 'Refresh insights'}
        </Button>
      </div>

      <form onSubmit={ask} className="mb-8 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about your best channel, timing, growth, or devices..."
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-background"
        />
        <Button type="submit" disabled={pending || !question.trim()}>
          Ask
        </Button>
      </form>

      {answer && (
        <div className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm whitespace-pre-wrap">
          {answer}
        </div>
      )}

      <div className="space-y-4">
        {insights.map((insight) => (
          <div key={insight.id} className="rounded-xl border border-border bg-card/50 p-5">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-semibold">{insight.title}</h3>
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.round(insight.confidence * 100)}% confidence
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {insight.actionItems.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
