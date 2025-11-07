import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Only initialize OpenAI if API key is available
let openai: OpenAI | null = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(req: NextRequest) {
  try {
    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { autobiographyData, style } = body;

    if (!autobiographyData || !style) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const styleInstructions = {
      emotional:
        'Write in a deeply emotional and heartfelt tone, focusing on feelings, emotions, and personal connections. Use vivid imagery and expressive language.',
      professional:
        'Write in a professional, polished tone suitable for formal publication. Use clear, articulate language while maintaining authenticity.',
      simple:
        'Write in a simple, straightforward manner that is easy to read and understand. Use clear, conversational language.',
      poetic:
        'Write in a poetic, lyrical style with beautiful imagery, metaphors, and artistic expression. Create a flowing, literary narrative.',
    };

    const prompt = `You are a skilled autobiography writer. Create a compelling, well-structured autobiography based on the following information. ${styleInstructions[style as keyof typeof styleInstructions]}

Personal Information:
- Name: ${autobiographyData.personalInfo.fullName}
- Date of Birth: ${autobiographyData.personalInfo.dateOfBirth}
- Birthplace: ${autobiographyData.personalInfo.birthplace}
- Current Location: ${autobiographyData.personalInfo.currentLocation}
- Background: ${autobiographyData.personalInfo.background}

Childhood Memories:
- Early Memories: ${autobiographyData.childhoodMemories.earlyMemories}
- Family Dynamics: ${autobiographyData.childhoodMemories.familyDynamics}
- Significant Events: ${autobiographyData.childhoodMemories.significantEvents}
- Favorite Activities: ${autobiographyData.childhoodMemories.favoriteActivities}

Education Journey:
- Schools: ${autobiographyData.educationJourney.schools}
- Favorite Subjects: ${autobiographyData.educationJourney.favoriteSubjects}
- Achievements: ${autobiographyData.educationJourney.achievements}
- Challenges: ${autobiographyData.educationJourney.challenges}
- Mentors: ${autobiographyData.educationJourney.mentors}

Career & Achievements:
- Career Path: ${autobiographyData.careerAchievements.careerPath}
- Major Accomplishments: ${autobiographyData.careerAchievements.majorAccomplishments}
- Work Experiences: ${autobiographyData.careerAchievements.workExperiences}
- Skills: ${autobiographyData.careerAchievements.skills}

Family & Relationships:
- Family: ${autobiographyData.familyRelationships.family}
- Important People: ${autobiographyData.familyRelationships.importantPeople}
- Relationships: ${autobiographyData.familyRelationships.relationships}
- Legacy: ${autobiographyData.familyRelationships.legacy}

Life Challenges:
- Obstacles: ${autobiographyData.lifeChallenges.obstacles}
- Lessons: ${autobiographyData.lifeChallenges.lessons}
- Pivotal Moments: ${autobiographyData.lifeChallenges.pivotalMoments}
- Growth: ${autobiographyData.lifeChallenges.growth}

Dreams, Beliefs & Goals:
- Beliefs: ${autobiographyData.dreamsBeliefsGoals.beliefs}
- Values: ${autobiographyData.dreamsBeliefsGoals.values}
- Future Goals: ${autobiographyData.dreamsBeliefsGoals.futureGoals}
- Legacy: ${autobiographyData.dreamsBeliefsGoals.legacy}
- Wisdom: ${autobiographyData.dreamsBeliefsGoals.wisdom}

Write a comprehensive, engaging autobiography (approximately 2000-3000 words) that weaves these elements together into a cohesive narrative. Include proper chapters and structure.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert autobiography writer who creates compelling, well-structured life stories.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content;

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Error generating story:', error);
    return NextResponse.json(
      { error: 'Failed to generate story' },
      { status: 500 }
    );
  }
}

// Export config to mark as dynamic route
export const dynamic = 'force-dynamic';
