'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { AutobiographyData, GeneratedStory } from '@/lib/types';
import { BookOpen, Plus, FileText, Clock, LogOut, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [autobiographies, setAutobiographies] = useState<AutobiographyData[]>([]);
  const [stories, setStories] = useState<GeneratedStory[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load autobiographies
      const autoQuery = query(
        collection(db, 'autobiographies'),
        where('userId', '==', user.uid),
        orderBy('updatedAt', 'desc')
      );
      const autoSnapshot = await getDocs(autoQuery);
      const autoData = autoSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AutobiographyData[];
      setAutobiographies(autoData);

      // Load generated stories
      const storyQuery = query(
        collection(db, 'stories'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const storySnapshot = await getDocs(storyQuery);
      const storyData = storySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GeneratedStory[];
      setStories(storyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Autobiography Builder</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <button
            onClick={() => router.push('/builder')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-500 text-left group"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
              <Plus className="w-6 h-6 text-blue-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">New Autobiography</h3>
            <p className="text-gray-600">Start collecting your life story</p>
          </button>

          <button
            onClick={() => router.push('/timeline')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-purple-500 text-left group"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-600 transition-colors">
              <Clock className="w-6 h-6 text-purple-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Timeline View</h3>
            <p className="text-gray-600">Visualize your life events</p>
          </button>

          <button
            onClick={() => router.push('/generate')}
            className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-all border-2 border-transparent hover:border-green-500 text-left group"
          >
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-600 transition-colors">
              <Sparkles className="w-6 h-6 text-green-600 group-hover:text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Generate Story</h3>
            <p className="text-gray-600">Create AI-powered narrative</p>
          </button>
        </div>

        {/* Recent Autobiographies */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Your Autobiographies</h2>
          {autobiographies.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-md text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">You haven&apos;t created any autobiographies yet</p>
              <button
                onClick={() => router.push('/builder')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First One
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {autobiographies.map((auto) => (
                <div
                  key={auto.id}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/builder?id=${auto.id}`)}
                >
                  <h3 className="text-xl font-semibold mb-2">
                    {auto.personalInfo.fullName || 'Untitled'}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Last updated: {new Date(auto.updatedAt).toLocaleDateString()}
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    Edit <span className="ml-2">→</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Generated Stories */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Generated Stories</h2>
          {stories.length === 0 ? (
            <div className="bg-white p-12 rounded-xl shadow-md text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No stories generated yet</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => router.push(`/story/${story.id}`)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">{story.title}</h3>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                      {story.style}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {story.content.substring(0, 150)}...
                  </p>
                  <p className="text-gray-500 text-xs">
                    Created: {new Date(story.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
