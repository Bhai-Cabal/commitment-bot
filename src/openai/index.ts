import dotenv from "dotenv";
import OpenAI from "openai";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function analyzeGymPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're a supportive and motivating Bhai Cabal activity tracker analyzing gym photos. You embody the core Bhai values of authenticity, courage, honor, and strength. Your responses should inspire and uplift while acknowledging the effort and commitment shown. For valid gym pics (must show workout equipment, exercise in progress, or post-workout), start with 'GYM PIC:' then give an encouraging response that recognizes their dedication to physical strength (max 20 words). For non-gym pics, start with 'NOT GYM:' then provide gentle guidance back to the path of strength and commitment (max 15 words).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a gym pic? Respond with the appropriate prefix ('GYM PIC:' or 'NOT GYM:') followed by your motivating message that reflects Bhai values.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isGymPhoto = answer.toUpperCase().startsWith("GYM PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isGymPhoto) {
        finalResponse = `Respect, ${username}! ${comment} Your commitment to strength inspires the cabal! 💪🔱`;
      } else {
        finalResponse = `${username}, ${comment} The path of strength awaits - we believe in you! 🏋️‍♂️✨`;
      }
      return [isGymPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing image with OpenAI:", error);
    return [false, ""];
  }
}

export async function analyzeShippingPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're an encouraging Bhai Cabal activity tracker analyzing work progress. You recognize that Bhais are ambitious and take individual responsibility. For valid shipping pics (showing code, presentations, documentation, meetings, or other productive work), start with 'SHIPPING PIC:' then give an uplifting response that acknowledges their contribution and ambition (max 20 words). For non-shipping pics, start with 'NOT SHIPPING:' then provide constructive guidance aligned with Bhai values (max 15 words).

Valid shipping pics include:
1. Computer screens showing code or development work
2. Presentations or project discussions
3. Documentation or planning work
4. Team meetings and collaborations
5. Any evidence of productive contribution

The focus is on recognizing authentic effort and encouraging continued growth.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a valid shipping pic showing work progress? Respond with the appropriate prefix ('SHIPPING PIC:' or 'NOT SHIPPING:') followed by your encouraging message that reflects Bhai values.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isShippingPhoto = answer.toUpperCase().startsWith("SHIPPING PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isShippingPhoto) {
        finalResponse = `Excellent work, ${username}! ${comment} Your contribution strengthens the cabal! 🚢✨`;
      } else {
        finalResponse = `${username}, ${comment} Every Bhai has the potential to create value - show us your progress! 💫`;
      }
      return [isShippingPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing shipping image with OpenAI:", error);
    return [false, ""];
  }
}

export async function analyzeMindfulnessPhoto(
  photoBuffer: Buffer,
  username: string,
): Promise<[boolean, string]> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You're a mindful Bhai Cabal activity tracker analyzing spiritual growth photos. You understand that Bhais get stronger spiritually as well as physically. For valid mindfulness pics (showing meditation, yoga, or other mindful practices), start with 'ZEN PIC:' then give an appreciative response that honors their spiritual journey (max 20 words). For non-mindfulness pics, start with 'NOT ZEN:' then provide gentle guidance toward spiritual growth (max 15 words).`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this image. Is it a mindfulness pic? Respond with the appropriate prefix followed by your mindful message that reflects Bhai values.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 50,
    });
    const answer = response.choices[0]?.message?.content;
    if (answer) {
      const isZenPhoto = answer.toUpperCase().startsWith("ZEN PIC:");
      const comment = answer.substring(answer.indexOf(":") + 1).trim();
      let finalResponse: string;
      if (isZenPhoto) {
        finalResponse = `Inner peace, ${username}! ${comment} Your spiritual strength enriches the cabal! 🧘‍♂️✨`;
      } else {
        finalResponse = `${username}, ${comment} The path to spiritual strength awaits your presence! 🌟`;
      }
      return [isZenPhoto, finalResponse];
    }
    return [false, ""];
  } catch (error) {
    console.error("Error analyzing mindfulness image with OpenAI:", error);
    return [false, ""];
  }
}

export async function provideFeedback(
  photoBuffer: Buffer,
  feedbackType: "photo_feedback" | "community_feedback",
): Promise<string> {
  try {
    const base64Image = photoBuffer.toString("base64");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are the Bhai Cabal bot, embodying the values of authenticity, courage, honor, and strength. You provide constructive feedback that uplifts while encouraging growth. Your responses should:
- Be authentic and direct
- Acknowledge effort and commitment
- Encourage continuous improvement
- Foster community spirit
- Maintain honor and respect

Rules:
- Maximum 30 words
- Must be constructive and specific
- Include actionable guidance
- Focus on growth and improvement
- Maintain the spirit of brotherhood`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                feedbackType === "photo_feedback"
                  ? "Provide constructive feedback on this contribution, acknowledging the effort while suggesting ways to align even more closely with Bhai values."
                  : "Offer guidance on how this activity could better serve the community's growth and strengthen our collective bond.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
                detail: "low",
              },
            },
          ],
        },
      ],
      max_tokens: 75,
      temperature: 0.7,
    });

    const answer = response.choices[0]?.message?.content;
    if (!answer) {
      return "Your commitment is noted, Bhai. Let's continue growing stronger together! 💫";
    }

    const feedback = answer
      .replace(/^(Feedback|Response|Answer):\s*/i, "")
      .trim();
    return feedback;
  } catch (error) {
    console.error("Error generating feedback with OpenAI:", error);
    return "Technical difficulties aside, your dedication to the cabal is appreciated. Keep pushing forward! 🔱";
  }
}
