import { Injectable, ServiceUnavailableException } from '@nestjs/common'

export type ContentWarning = {
  field: string
  severity: 'low' | 'medium' | 'high'
  message: string
}

@Injectable()
export class ContentAnalysisService {
  async analyze(prompt: string): Promise<ContentWarning[]> {
    if (process.env.OPENAI_API_KEY) {
      return this.callOpenAI(prompt)
    }

    if (process.env.ANTHROPIC_API_KEY) {
      return this.callAnthropic(prompt)
    }

    throw new ServiceUnavailableException('LLM provider not configured')
  }

  private async callOpenAI(prompt: string): Promise<ContentWarning[]> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              'You are a content analysis assistant. Respond ONLY with JSON in the format: {"warnings": [{"field": "title|synopsis|region|category", "severity": "low|medium|high", "message": "..."}]}.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new ServiceUnavailableException('LLM request failed')
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }

    const content = payload.choices?.[0]?.message?.content
    return this.parseWarnings(content)
  }

  private async callAnthropic(prompt: string): Promise<ContentWarning[]> {
    const model = process.env.ANTHROPIC_MODEL || 'claude-3-5-sonnet-latest'

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content:
              'You are a content analysis assistant. Respond ONLY with JSON in the format: {"warnings": [{"field": "title|synopsis|region|category", "severity": "low|medium|high", "message": "..."}]}.' +
              `\n${prompt}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      throw new ServiceUnavailableException('LLM request failed')
    }

    const payload = (await response.json()) as {
      content?: Array<{ text?: string }>
    }

    const content = payload.content?.[0]?.text
    return this.parseWarnings(content)
  }

  private parseWarnings(content?: string): ContentWarning[] {
    if (!content) {
      return []
    }

    try {
      const parsed = JSON.parse(content) as { warnings?: ContentWarning[] }
      if (Array.isArray(parsed.warnings)) {
        return parsed.warnings
      }
      return []
    } catch {
      return []
    }
  }
}
