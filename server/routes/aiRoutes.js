const express = require('express');
const OpenAI = require('openai');

const router = express.Router();

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Store request time for each task title
const requestTimes = new Map();

// Generate AI task description
router.post('/generate-description', async (req, res) => {
  try {
    const { title, priority } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        message: 'Task title is required'
      });
    }

    const taskTitle = title.trim();

    if (taskTitle.length > 120) {
      return res.status(400).json({
        message: 'Task title must be under 120 characters'
      });
    }

    // One request per task title per minute
    const taskKey = taskTitle.toLowerCase();
    const lastRequest = requestTimes.get(taskKey);

    if (lastRequest && Date.now() - lastRequest < 60000) {
      return res.status(429).json({
        message: 'Please wait one minute before generating again for this task.'
      });
    }

    requestTimes.set(taskKey, Date.now());

    // Fallback if API key is missing
    if (!openai) {
      return res.json({
        description: `Complete ${taskTitle} carefully. Plan the required steps, work according to the ${priority || 'Medium'} priority, and verify the result.`,
        aiGenerated: false,
        message: 'AI service is unavailable. A fallback description is provided.'
      });
    }

    const response = await openai.chat.completions.create(
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful task management assistant. Write a clear, short and practical task description in 2 to 3 sentences. Do not add headings.'
          },
          {
            role: 'user',
            content: `Generate a description for this task: ${taskTitle}. Priority: ${priority || 'Medium'}.`
          }
        ],
        max_tokens: 120
      },
      {
        signal: AbortSignal.timeout(30000)
      }
    );

    const description =
      response.choices[0]?.message?.content?.trim();

    if (!description) {
      throw new Error('Empty AI response');
    }

    res.json({
      description,
      aiGenerated: true,
      message: 'Description generated successfully.'
    });

  } catch (error) {
    console.error('AI generation error:', error.message);

    const title = req.body.title.trim();

    res.json({
      description: `Complete ${title} carefully. Break the work into smaller steps, follow the required process, and check the final result.`,
      aiGenerated: false,
      message: 'AI service is temporarily unavailable. A fallback description is provided.'
    });
  }
});

module.exports = router;
