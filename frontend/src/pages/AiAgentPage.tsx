import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const API_URL = 'http://localhost:8000/process-request';



function renderResponse(response: string, outputFormat: string) {
  if (!response) return null;
  const json = JSON.parse(response);
  // Try to extract the first content array from any step in results
  let content = null;
  if (json?.results ) {
    content = json?.results;
    for (const stepKey of Object.keys(json.results)) {
      const step = json.results[stepKey];
      if (Array.isArray(step?.content)) {
        content = step.content;
        break;
      }
    }    
  }

  if (content) {

    if (outputFormat === 'json') {
      try {
        return (
          <pre className="whitespace-pre-wrap break-words text-green-700 dark:text-green-300 bg-gray-100 dark:bg-gray-900 p-2 rounded overflow-auto">
            {JSON.stringify(content, null, 2)}
          </pre>
        );
      } catch {
        return <pre className="text-red-500">Invalid JSON</pre>;
      }
    }
   
    if (outputFormat === 'html') {
      return (
        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
      );

    }
  }

  // text
  return <pre className="whitespace-pre-wrap break-words">{content}</pre>;
}

const AiAgentPage: React.FC = () => {
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [outputFormat, setOutputFormat] = useState<'json' | 'text' | 'table' | 'html'>('json');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResponse('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: query,
          auth_token: token,
          user_email: user?.email,
          output_format: outputFormat,
        }),
      });
      if (!res.ok) {
        throw new Error('Failed to fetch response from AI Agent');
      }
      const data = await res.text();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[80vh] min-h-[500px]">
      {/* Title for Response Area */}
      <h2 className="text-lg font-semibold mb-2 pl-2">Query returns</h2>
      {/* Response Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-t-lg shadow-md p-6 overflow-auto" style={{ minHeight: '0', height: '80%' }}>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          renderResponse(response, outputFormat)
        )}
      </div>
      {/* Title for Input Area */}
      <h2 className="text-lg font-semibold mt-4 mb-2 pl-6 ">Query to AI</h2>
      {/* Input Area */}
      <form onSubmit={handleSubmit} className="bg-gray-100 dark:bg-gray-900 rounded-b-lg shadow-md p-4 flex flex-col gap-2" style={{ height: '20%' }}>
        <div className="flex gap-2 items-center">
          <input
            type="text"
            className="flex-1 p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Type your query for the AI Agent..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            required
          />
          <select
            value={outputFormat}
            onChange={e => setOutputFormat(e.target.value as any)}
            className="p-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="json">JSON</option>
            <option value="text">Text</option>
            <option value="html">HTML</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded shadow"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default AiAgentPage;
