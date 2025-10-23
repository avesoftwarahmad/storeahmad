import { api } from '../lib/api'

export async function answerQuestion(question: string): Promise<{
  answer?: string
  qid?: string
  refused: boolean
}> {
  const q = question.trim()
  if (!q) return { refused: true }

  try {
    // Use the backend assistant API
    const response = await api.sendAssistantMessage(q)
    
    if (response.response) {
      return {
        answer: response.response,
        qid: response.intent,
        refused: false
      }
    } else {
      return { refused: true }
    }
  } catch (error) {
    console.error('Assistant API error:', error)
    return { refused: true }
  }
}
