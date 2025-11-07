'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { AutobiographyData, WritingStyle } from '@/lib/types';
import { ArrowLeft, Sparkles, Download, Edit } from 'lucide-react';

export default function Generate() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [autobiographies, setAutobiographies] = useState<AutobiographyData[]>([]);
  const [selectedAuto, setSelectedAuto] = useState<string>('');
  const [style, setStyle] = useState<WritingStyle>('emotional');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [title, setTitle] = useState('');

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
      }
    } catch (error) {
      console.error('Error loading autobiographies:', error);
    }
  };

  const handleGenerate = async () => {
    if (!selectedAuto) {
      alert('Please select an autobiography');
      return;
    }

    setGenerating(true);
    setGeneratedContent('');

    try {
      const selectedData = autobiographies.find((a) => a.id === selectedAuto);
      if (!selectedData) return;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autobiographyData: selectedData,
          style,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate');

      const data = await response.json();
      setGeneratedContent(data.content);
      setTitle(`${selectedData.personalInfo.fullName}'s Life Story`);
    } catch (error) {
      console.error('Error generating story:', error);
      alert('Failed to generate story. Please check your API key and try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveStory = async () => {
    if (!user || !generatedContent) return;

    try {
      await addDoc(collection(db, 'stories'), {
        userId: user.uid,
        autobiographyId: selectedAuto,
        content: generatedContent,
        style,
        title: title || 'Untitled Story',
        createdAt: new Date(),
      });

      alert('Story saved successfully!');
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Failed to save story');
    }
  };

  const handleExport = (format: 'txt' | 'html') => {
    if (!generatedContent) return;

    if (format === 'txt') {
      const blob = new Blob([generatedContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'autobiography'}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
          <style>
            body { font-family: Georgia, serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.8; }
            h1 { text-align: center; margin-bottom: 40px; }
            p { margin-bottom: 20px; text-align: justify; }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          ${generatedContent.split('\n').map(p => `<p>${p}</p>`).join('\n')}
        </body>
        </html>
      `;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title || 'autobiography'}.html`;
      a.click();
      URL.revokeObjectURL(url);
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
          {!generatedContent ? (
            <div className="bg-white rounded-xl shadow-md p-8">
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="w-8 h-8 text-purple-600" />
                <h1 className="text-3xl font-bold">Generate Your Autobiography</h1>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Autobiography
                  </label>
                  <select
                    value={selectedAuto}
                    onChange={(e) => setSelectedAuto(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    {autobiographies.map((auto) => (
                      <option key={auto.id} value={auto.id}>
                        {auto.personalInfo.fullName || 'Untitled'} - Last updated:{' '}
                        {new Date(auto.updatedAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Writing Style
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['emotional', 'professional', 'simple', 'poetic'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setStyle(s as WritingStyle)}
                        className={`p-4 rounded-lg border-2 transition-all ${
                          style === s
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-semibold capitalize">{s}</div>
                        <div className="text-xs text-gray-600 mt-1">
                          {s === 'emotional' && 'Heartfelt & expressive'}
                          {s === 'professional' && 'Polished & formal'}
                          {s === 'simple' && 'Clear & easy to read'}
                          {s === 'poetic' && 'Lyrical & artistic'}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={generating || !selectedAuto}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg font-semibold"
                >
                  <Sparkles className="w-5 h-5" />
                  {generating ? 'Generating Your Story...' : 'Generate Story'}
                </button>

                {autobiographies.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-600 mb-4">
                      You haven&apos;t created any autobiographies yet.
                    </p>
                    <button
                      onClick={() => router.push('/builder')}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create One Now
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-md p-8">
                <div className="mb-6">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-3xl font-bold w-full border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 outline-none py-2"
                    placeholder="Enter title..."
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                      {style}
                    </span>
                  </div>
                </div>

                <div className="prose max-w-none">
                  <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                    {generatedContent}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="font-semibold mb-4">Actions</h3>
                <div className="flex flex-wrap gap-4">
                  <button
                    onClick={handleSaveStory}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Save Story
                  </button>
                  <button
                    onClick={() => handleExport('txt')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export as TXT
                  </button>
                  <button
                    onClick={() => handleExport('html')}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Export as HTML
                  </button>
                  <button
                    onClick={() => setGeneratedContent('')}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    Generate New
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
