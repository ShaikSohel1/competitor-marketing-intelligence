import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getUserId } from '@/lib/workspace';

async function geminiGenerate(prompt: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!key) {
    console.info('[AI Service] chat Gemini skipped, GEMINI_API_KEY not configured');
    return null;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 800 },
        }),
      },
    );
    if (!res.ok) {
      console.error('[AI Service] chat geminiGenerate response error', { status: res.status });
      return null;
    }
    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.error('[AI Service] chat geminiGenerate failed', err);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Authorization header is required" }, { status: 401 });
    }
    const token = authHeader.slice("Bearer ".length);

    // 1. Authenticate user from session token
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !authData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = authData.user.id;

    const body = await request.json();
    const question: string = body.question;
    const competitorId: string | undefined = body.competitorId;

    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    // 2. userId is already defined above

    // 3. Fetch Our Company Profile and Competitors Data for full comparative context
    const [{ data: ourCompanyData }, { data: competitorsData }] = await Promise.all([
      supabase.from("company_profiles").select("*").eq("user_id", userId).maybeSingle(),
      (() => {
        let q = supabase.from("competitors").select("name, website, industry, description").eq("user_id", userId);
        if (competitorId) q = q.eq("id", competitorId);
        return q;
      })(),
    ]);

    const ourCompany = ourCompanyData || {
      company_name: 'Titan Eye+',
      website: 'titaneyeplus.com',
      industry: 'Eyewear & Vision Care',
    };

    const prompt = `You are a Senior Competitor Marketing Intelligence Analyst for ${ourCompany.company_name}.
Your job is to compare Our Company (${ourCompany.company_name}) against competitors and answer questions with sharp, actionable comparative intelligence.

OUR COMPANY PROFILE:
${JSON.stringify(ourCompany, null, 2)}

COMPETITORS DATA:
${JSON.stringify(competitorsData || [], null, 2)}

Instructions:
- Compare Our Company against competitors directly.
- Highlight specific gaps, rank advantages, pricing positioning, and strategic recommendations.
- Keep the tone professional, concise, and structured.

Question:
${question}`;

    let answer = await geminiGenerate(prompt);
    if (!answer) {
      answer = `Based on competitor intelligence for ${ourCompany.company_name}, we are monitoring ${competitorsData?.length || 0} competitors in your workspace. You can compare pricing, SEO rankings, and social engagement across your portfolio.`;
    }

    // 4. Persist chat message records to chat_messages with user_id and user_id
    try {
      await supabase.from("chat_messages").insert([
        {
          user_id: userId,
          competitor_id: competitorId ?? null,
          role: "user",
          content: question,
          sources: [],
        },
        {
          user_id: userId,
          competitor_id: competitorId ?? null,
          role: "assistant",
          content: answer,
          sources: [],
        },
      ]);
    } catch (err) {
      console.warn('Chat message persistence note:', err);
    }

    return NextResponse.json({ answer, sources: [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Chat request failed";
    console.error('Error in /api/chat route:', err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
