import groundTruth from './ground-truth.json'
import { getOrderStatus } from '../lib/api'
import type { GroundTruthItem } from '../types'

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

export async function answerQuestion(question: string): Promise<{
  answer?: string
  qid?: string
  refused: boolean
}> {
  const q = question.trim()
  if (!q) return { refused: true }

  // Check for order ID pattern
  const orderIdMatch = q.match(/([A-Z0-9]{10,})/i)
  if (orderIdMatch) {
    const orderId = orderIdMatch[1]
    const status = await getOrderStatus(orderId)
    if (!status) {
      return { refused: true }
    }
    
    const maskedId = '*'.repeat(orderId.length - 4) + orderId.slice(-4)
    return {
      answer: `Order ${maskedId} status: ${status.status}.${status.carrier ? ` Carrier: ${status.carrier}.` : ''}${status.eta ? ` ETA: ${new Date(status.eta).toLocaleDateString()}.` : ''}`,
      refused: false
    }
  }

  // Find best matching Q&A
  const questionTokens = tokenize(q)
  let bestMatch: { qid: string; score: number; answer: string } | null = null

  // Filter out common stop words that don't add semantic meaning
  const stopWords = new Set(['how', 'do', 'i', 'you', 'we', 'they', 'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'will', 'would', 'could', 'should', 'can', 'may', 'might', 'must', 'shall'])
  
  const meaningfulQuestionTokens = questionTokens.filter(token => !stopWords.has(token))
  
  for (const item of groundTruth as GroundTruthItem[]) {
    const itemTokens = tokenize(item.question)
    const meaningfulItemTokens = itemTokens.filter(token => !stopWords.has(token))
    
    // Only consider meaningful tokens for scoring
    const overlap = meaningfulItemTokens.filter(token => meaningfulQuestionTokens.includes(token)).length
    
    // Require at least 2 meaningful words to overlap for a match
    if (overlap < 2) {
      continue
    }
    
    // Use Jaccard similarity: overlap / union
    const union = new Set([...meaningfulQuestionTokens, ...meaningfulItemTokens]).size
    const score = union > 0 ? overlap / union : 0
    
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { qid: item.qid, score, answer: item.answer }
    }
  }

  // Check confidence threshold - require high confidence for matches
  if (!bestMatch || bestMatch.score < 0.5) {
    return { refused: true }
  }

  return {
    answer: `${bestMatch.answer} [${bestMatch.qid}]`,
    qid: bestMatch.qid,
    refused: false
  }
}
