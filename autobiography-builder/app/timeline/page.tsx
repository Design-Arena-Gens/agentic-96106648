'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { AutobiographyData } from '@/lib/types';
import { ArrowLeft, Calendar } from 'lucide-react';

interface TimelineEvent {
  year: string;
  category: string;
  title: string;
  description: string;
  icon: string;
}

export default function Timeline() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [autobiographies, setAutobiographies] = useState<AutobiographyData[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<string>('');
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    } else if (user) {
      loadAutobiographies();
    }
  }, [user, loading, router]);

  const loadAutobiographies = async () => {
    if (!user) return;

    try {
      const q = query(
        collection(db, 'autobiographies'),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AutobiographyData[];
      setAutobiographies(data);

      if (data.length > 0) {
        setSelectedAuto(data[0].id || '');
        generateTimeline(data[0]);
      }
    } catch (error) {
      console.error('Error loading autobiographies:', error);
    }
  };

  const generateTimeline = (auto: AutobiographyData) => {
    const events: TimelineEvent[] = [];

    // Birth
    if (auto.personalInfo.dateOfBirth) {
      const birthYear = new Date(auto.personalInfo.dateOfBirth).getFullYear().toString();
      events.push({
        year: birthYear,
        category: 'Birth',
        title: 'Born',
        description: `Born in ${auto.personalInfo.birthplace}`,
        icon: '👶',
      });
    }

    // Childhood
    if (auto.childhoodMemories.significantEvents) {
      const birthYear = auto.personalInfo.dateOfBirth
        ? new Date(auto.personalInfo.dateOfBirth).getFullYear()
        : 2000;
      events.push({
        year: (birthYear + 5).toString(),
        category: 'Childhood',
        title: 'Childhood Years',
        description: auto.childhoodMemories.significantEvents.substring(0, 200) + '...',
        icon: '🧸',
      });
    }

    // Education
    if (auto.educationJourney.schools) {
      const birthYear = auto.personalInfo.dateOfBirth
        ? new Date(auto.personalInfo.dateOfBirth).getFullYear()
        : 2000;
      events.push({
        year: (birthYear + 12).toString(),
        category: 'Education',
        title: 'Education Journey',
        description: auto.educationJourney.schools.substring(0, 200) + '...',
        icon: '🎓',
      });
    }

    // Career
    if (auto.careerAchievements.careerPath) {
      const birthYear = auto.personalInfo.dateOfBirth
        ? new Date(auto.personalInfo.dateOfBirth).getFullYear()
        : 2000;
      events.push({
        year: (birthYear + 22).toString(),
        category: 'Career',
        title: 'Career Path',
        description: auto.careerAchievements.careerPath.substring(0, 200) + '...',
        icon: '💼',
      });
    }

    // Family
    if (auto.familyRelationships.relationships) {
      events.push({
        year: 'Recent Years',
        category: 'Family',
        title: 'Relationships & Family',
        description: auto.familyRelationships.relationships.substring(0, 200) + '...',
        icon: '❤️',
      });
    }

    // Goals
    if (auto.dreamsBeliefsGoals.futureGoals) {
      events.push({
        year: 'Future',
        category: 'Goals',
        title: 'Dreams & Future',
        description: auto.dreamsBeliefsGoals.futureGoals.substring(0, 200) + '...',
        icon: '⭐',
      });
    }

    setTimelineEvents(events);
  };

  const handleAutoChange = (id: string) => {
    setSelectedAuto(id);
    const auto = autobiographies.find((a) => a.id === id);
    if (auto) {
      generateTimeline(auto);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-md p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold">Life Timeline</h1>
            </div>

            {autobiographies.length > 0 ? (
              <>
                <div className="mb-8">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Autobiography
                  </label>
                  <select
                    value={selectedAuto}
                    onChange={(e) => handleAutoChange(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {autobiographies.map((auto) => (
                      <option key={auto.id} value={auto.id}>
                        {auto.personalInfo.fullName || 'Untitled'}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Timeline */}
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200"></div>

                  {/* Events */}
                  <div className="space-y-8">
                    {timelineEvents.map((event, index) => (
                      <div key={index} className="relative pl-20">
                        {/* Icon */}
                        <div className="absolute left-0 w-16 h-16 bg-white border-4 border-blue-200 rounded-full flex items-center justify-center text-2xl">
                          {event.icon}
                        </div>

                        {/* Content */}
                        <div className="bg-gray-50 p-6 rounded-lg hover:shadow-md transition-shadow">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                              {event.year}
                            </span>
                            <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-semibold rounded-full">
                              {event.category}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold mb-2">{event.title}</h3>
                          <p className="text-gray-700">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  You haven&apos;t created any autobiographies yet.
                </p>
                <button
                  onClick={() => router.push('/builder')}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create Your First One
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
