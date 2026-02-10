import { useState } from 'react';

interface GeminiTestResult {
  success: boolean;
  message: string;
  model?: string;
  responseTime?: number;
}

interface GeminiTestProps {
  apiKey: string;
  onResult: (result: GeminiTestResult) => void;
}

export function GeminiAPITest({ apiKey, onResult }: GeminiTestProps) {
  const [testing, setTesting] = useState(false);

  const testGeminiAPI = async () => {
    if (!apiKey.trim()) {
      onResult({ success: false, message: 'API key is required' });
      return;
    }

    setTesting(true);
    const startTime = Date.now();

    try {
      // Test with gemini-2.5-pro only (as requested by user)
      const model = 'gemini-2.5-pro';
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: 'Hello! Please respond with "API test successful" to confirm the connection.'
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 50,
            }
          })
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data.candidates && data.candidates[0] && 
            data.candidates[0].content && data.candidates[0].content.parts && 
            data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) {
          
          const responseTime = Date.now() - startTime;
          onResult({
            success: true,
            message: `API test successful with ${model}`,
            model,
            responseTime
          });
          setTesting(false);
          return;
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        onResult({
          success: false,
          message: `API test failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
        });
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      onResult({
        success: false,
        message: `API test failed: ${errorMessage}`
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <button
      onClick={testGeminiAPI}
      disabled={testing || !apiKey.trim()}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
    >
      {testing ? 'Testing...' : 'Test API Key'}
    </button>
  );
}
