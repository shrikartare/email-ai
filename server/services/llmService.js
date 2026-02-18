const OpenAI = require('openai');
const KnowledgeDoc = require('../models/KnowledgeDoc');
const Config = require('../models/Config');

class LLMService {
    async processEmail(clientId, emailBody, emailSubject) {
        const config = await Config.findOne({ clientId });
        const apiKey = config?.openaiApiKey || process.env.OPENAI_API_KEY;

        // Get active knowledge base documents for this client
        const knowledgeDocs = await KnowledgeDoc.find({
            clientId,
            isActive: true
        });

        const knowledgeContext = knowledgeDocs.length > 0
            ? knowledgeDocs.map(doc => `--- Document: ${doc.title} ---\n${doc.content}`).join('\n\n')
            : 'No knowledge base documents available.';

        if (!apiKey || apiKey === 'sk-your-key-here') {
            // Return mock LLM response for demo
            return this._getMockResponse(emailSubject, emailBody, knowledgeDocs.length);
        }

        const openai = new OpenAI({ apiKey });

        const systemPrompt = `You are an intelligent email assistant. Your job is to:
1. Read the incoming email carefully
2. Use the provided knowledge base documents as context to craft an accurate response
3. Rate your confidence/accuracy as a percentage (0-100) based on how well the knowledge base covers the email's topic
4. Provide a clear, professional response

IMPORTANT: You MUST respond in the following JSON format:
{
  "response": "Your drafted email response here",
  "accuracy": 85,
  "reasoning": "Brief explanation of why you gave this accuracy score",
  "suggestedAction": "draft" or "escalate"
}

Guidelines for accuracy scoring:
- 90-100%: Knowledge base directly addresses the query with specific, detailed information
- 70-89%: Knowledge base covers the topic well but may miss some specifics
- 50-69%: Knowledge base has some relevant info but significant gaps exist
- Below 50%: Knowledge base doesn't adequately cover this topic — recommend escalation`;

        const userPrompt = `Subject: ${emailSubject}

Email Body:
${emailBody}

Knowledge Base Context:
${knowledgeContext}

Please analyze this email and generate a response using the knowledge base. Return your response in the specified JSON format.`;

        try {
            const completion = await openai.chat.completions.create({
                model: config?.llmModel || 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500
            });

            const content = completion.choices[0].message.content;

            // Try to parse JSON response
            try {
                const parsed = JSON.parse(content);
                return {
                    response: parsed.response || content,
                    accuracy: Math.min(100, Math.max(0, Number(parsed.accuracy) || 50)),
                    reasoning: parsed.reasoning || '',
                    suggestedAction: parsed.suggestedAction || 'draft'
                };
            } catch {
                // If not valid JSON, return raw response with moderate accuracy
                return {
                    response: content,
                    accuracy: 50,
                    reasoning: 'Could not parse structured response from LLM',
                    suggestedAction: 'draft'
                };
            }
        } catch (error) {
            throw new Error(`LLM processing failed: ${error.message}`);
        }
    }

    _getMockResponse(subject, body, docsCount) {
        const subjectLower = subject.toLowerCase();
        let accuracy, response, reasoning;

        if (subjectLower.includes('pricing') || subjectLower.includes('plan') || subjectLower.includes('inquiry')) {
            accuracy = docsCount > 0 ? 82 : 35;
            response = `Dear Customer,\n\nThank you for your interest in our Enterprise plan!\n\nOur Enterprise plan includes:\n- Unlimited users and projects\n- Priority 24/7 support\n- Custom integrations and API access\n- Dedicated account manager\n- Advanced analytics and reporting\n\nPricing starts at $299/month for teams up to 50 users. We also offer annual billing with a 20% discount.\n\nI'd be happy to schedule a demo call to walk you through the features in detail.\n\nBest regards,\nSupport Team`;
            reasoning = docsCount > 0
                ? 'Knowledge base contains product and pricing documentation that addresses this query well.'
                : 'No knowledge base documents available. Response is based on general knowledge.';
        } else if (subjectLower.includes('technical') || subjectLower.includes('api') || subjectLower.includes('issue')) {
            accuracy = docsCount > 0 ? 68 : 25;
            response = `Dear Customer,\n\nThank you for reaching out about the API integration issue.\n\nHere are some troubleshooting steps for the 401 authentication error:\n\n1. Verify your API key is active in your dashboard\n2. Ensure you're using the correct API version endpoint\n3. Check that the Authorization header format is: "Bearer YOUR_API_KEY"\n4. Confirm your account has API access enabled\n\nIf the issue persists, please share your request headers (with the API key redacted) and we'll investigate further.\n\nBest regards,\nTechnical Support Team`;
            reasoning = docsCount > 0
                ? 'Knowledge base has some technical documentation but may not cover all specific error scenarios.'
                : 'No knowledge base documents available. Response based on generic API troubleshooting.';
        } else {
            accuracy = docsCount > 0 ? 55 : 20;
            response = `Dear Customer,\n\nThank you for contacting us. We've reviewed your message and are looking into it.\n\nWe'll get back to you with a detailed response within 24 hours.\n\nBest regards,\nSupport Team`;
            reasoning = docsCount > 0
                ? 'Knowledge base has limited coverage for this specific topic.'
                : 'No knowledge base documents available for context.';
        }

        return {
            response,
            accuracy,
            reasoning,
            suggestedAction: accuracy >= 70 ? 'draft' : 'escalate'
        };
    }
}

module.exports = new LLMService();
