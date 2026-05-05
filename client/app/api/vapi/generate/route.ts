import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import connectToDatabase from "@/lib/mongodb";
import { getRandomInterviewCover } from "@/lib/utils";

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  try {
    const { text: questionsText } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `Prepare questions for a job interview.
        The job role is ${role}.
        The job experience level is ${level}.
        The tech stack used in the job is: ${techstack}.
        The focus between behavioural and technical questions should lean towards: ${type}.
        The amount of questions required is: ${amount}.
        
        CRITICAL INSTRUCTIONS:
        - Return ONLY a valid JSON array of strings
        - No markdown, no code blocks, no extra text
        - Format: ["Question 1", "Question 2", "Question 3"]
        - Each question should be clear and concise
        - Do not use "/" or "*" or special characters that break voice assistants
        - Generate exactly ${amount} questions
        
        Example response:
        ["What is React and how does it work?", "Explain useState hook", "Describe virtual DOM"]
    `,
    });

    // Parse questions with error handling
    let questions: string[];
    try {
      // Try to extract JSON array from response if wrapped in other text
      const jsonMatch = questionsText.match(/\[[\s\S]*\]/);
      const cleanJson = jsonMatch ? jsonMatch[0] : questionsText;
      questions = JSON.parse(cleanJson);
      
      // Validate it's an array of strings
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid questions format");
      }
    } catch (parseError) {
      console.error("Failed to parse questions:", questionsText);
      // Fallback: split by newlines and clean up
      questions = questionsText
        .split(/\n/)
        .map(q => q.replace(/^\d+\.\s*/, '').trim())
        .filter(q => q.length > 10 && q.endsWith('?'));
      
      if (questions.length === 0) {
        questions = ["Tell me about your experience with " + techstack];
      }
    }

    const interview = {
      role: role,
      type: type,
      level: level,
      techstack: techstack.split(","),
      questions: questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    await db.collection("interviews").insertOne(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    return Response.json({ success: false, error: error }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
