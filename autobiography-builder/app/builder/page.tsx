'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AutobiographyData } from '@/lib/types';
import { ArrowLeft, Save, ArrowRight, Check } from 'lucide-react';

const sections = [
  { id: 'personalInfo', title: 'Personal Information', icon: '👤' },
  { id: 'childhoodMemories', title: 'Childhood Memories', icon: '🧸' },
  { id: 'educationJourney', title: 'Education Journey', icon: '🎓' },
  { id: 'careerAchievements', title: 'Career & Achievements', icon: '💼' },
  { id: 'familyRelationships', title: 'Family & Relationships', icon: '❤️' },
  { id: 'lifeChallenges', title: 'Life Challenges', icon: '⛰️' },
  { id: 'dreamsBeliefsGoals', title: 'Dreams & Goals', icon: '⭐' },
];

function BuilderContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentSection, setCurrentSection] = useState(0);
  const [saving, setSaving] = useState(false);
  const [autoId, setAutoId] = useState<string | null>(null);

  const [formData, setFormData] = useState<AutobiographyData>({
    userId: '',
    personalInfo: {
      fullName: '',
      dateOfBirth: '',
      birthplace: '',
      background: '',
      currentLocation: '',
    },
    childhoodMemories: {
      earlyMemories: '',
      familyDynamics: '',
      significantEvents: '',
      favoriteActivities: '',
    },
    educationJourney: {
      schools: '',
      favoriteSubjects: '',
      achievements: '',
      challenges: '',
      mentors: '',
    },
    careerAchievements: {
      careerPath: '',
      majorAccomplishments: '',
      workExperiences: '',
      skills: '',
    },
    familyRelationships: {
      family: '',
      importantPeople: '',
      relationships: '',
      legacy: '',
    },
    lifeChallenges: {
      obstacles: '',
      lessons: '',
      pivotalMoments: '',
      growth: '',
    },
    dreamsBeliefsGoals: {
      beliefs: '',
      values: '',
      futureGoals: '',
      legacy: '',
      wisdom: '',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const id = searchParams.get('id');
    if (id && user) {
      loadAutobiography(id);
      setAutoId(id);
    } else if (user) {
      setFormData((prev) => ({ ...prev, userId: user.uid }));
    }
  }, [searchParams, user]);

  const loadAutobiography = async (id: string) => {
    try {
      const docRef = doc(db, 'autobiographies', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setFormData(docSnap.data() as AutobiographyData);
      }
    } catch (error) {
      console.error('Error loading autobiography:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    try {
      const data = {
        ...formData,
        userId: user.uid,
        updatedAt: new Date(),
      };

      if (autoId) {
        await updateDoc(doc(db, 'autobiographies', autoId), data);
      } else {
        const newDocRef = doc(collection(db, 'autobiographies'));
        await setDoc(newDocRef, { ...data, createdAt: new Date() });
        setAutoId(newDocRef.id);
      }
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof AutobiographyData],
        [field]: value,
      },
    }));
  };

  const renderSectionForm = () => {
    const section = sections[currentSection];
    const sectionData = formData[section.id as keyof AutobiographyData];

    if (section.id === 'personalInfo') {
      return (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.personalInfo.fullName}
              onChange={(e) => updateField('personalInfo', 'fullName', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date of Birth</label>
            <input
              type="date"
              value={formData.personalInfo.dateOfBirth}
              onChange={(e) => updateField('personalInfo', 'dateOfBirth', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Birthplace</label>
            <input
              type="text"
              value={formData.personalInfo.birthplace}
              onChange={(e) => updateField('personalInfo', 'birthplace', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="City, Country"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
            <input
              type="text"
              value={formData.personalInfo.currentLocation}
              onChange={(e) => updateField('personalInfo', 'currentLocation', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="Where you live now"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Background</label>
            <textarea
              value={formData.personalInfo.background}
              onChange={(e) => updateField('personalInfo', 'background', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={4}
              placeholder="Tell us about your background, culture, heritage..."
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {Object.keys(sectionData as object).map((field) => (
          <div key={field}>
            <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
              {field.replace(/([A-Z])/g, ' $1').trim()}
            </label>
            <textarea
              value={(sectionData as Record<string, string>)[field]}
              onChange={(e) => updateField(section.id, field, e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={4}
              placeholder={`Describe your ${field.replace(/([A-Z])/g, ' $1').trim().toLowerCase()}...`}
            />
          </div>
        ))}
      </div>
    );
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
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Section {currentSection + 1} of {sections.length}
              </span>
              <span className="text-sm font-medium text-gray-700">
                {Math.round(((currentSection + 1) / sections.length) * 100)}% Complete
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Section Navigator */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-md p-4 sticky top-24">
                <h3 className="font-semibold mb-4">Sections</h3>
                <div className="space-y-2">
                  {sections.map((section, index) => (
                    <button
                      key={section.id}
                      onClick={() => setCurrentSection(index)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                        currentSection === index
                          ? 'bg-blue-100 text-blue-700 font-medium'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <span>{section.icon}</span>
                      <span className="text-sm">{section.title}</span>
                      {index < currentSection && (
                        <Check className="w-4 h-4 ml-auto text-green-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="mb-6">
                  <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <span>{sections[currentSection].icon}</span>
                    {sections[currentSection].title}
                  </h2>
                  <p className="text-gray-600">
                    Take your time to reflect and share your experiences in this section.
                  </p>
                </div>

                {renderSectionForm()}

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8 pt-8 border-t">
                  <button
                    onClick={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
                    disabled={currentSection === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      handleSave();
                      if (currentSection < sections.length - 1) {
                        setCurrentSection((prev) => prev + 1);
                      } else {
                        router.push('/generate');
                      }
                    }}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {currentSection === sections.length - 1 ? 'Generate Story' : 'Next'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Builder() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <BuilderContent />
    </Suspense>
  );
}
