"use client";
import React, { useState, useEffect, useRef } from "react";

export default function AwarenessPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:5000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });
      const data = await res.json();
      // Parse response into step-wise array if possible
      const parseSteps = (text) => {
        if (!text) return null;
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const steps = [];
        // collect lines that look like bullets or numbered items
        for (let i = 0; i < lines.length; i++) {
          const l = lines[i];
          // numbered like '1)' or '1.' or '1)'
          if (/^\d+\s*[\).]-?\s*/.test(l)) {
            steps.push(l.replace(/^\d+\s*[\).]\s*/,'').trim());
            continue;
          }
          // hyphen bullet
          if (/^-\s+/.test(l)) {
            steps.push(l.replace(/^-\s+/, '').trim());
            continue;
          }
          // lines that start with verbs or short phrases: treat as potential step if preceded by a header
          // fallback: if there are many lines, group them into numbered steps by paragraph chunks
        }
        // fallback grouping: if no explicit bullets but many paragraphs, return paragraphs as steps
        if (steps.length === 0 && lines.length > 1) {
          // group into paragraphs separated by blank lines in original text
          const paras = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
          if (paras.length > 1) return paras;
        }
        return steps.length ? steps : null;
      };

      const steps = parseSteps(data.response);

      setMessages((prev) => [...prev, { sender: "bot", text: data.response, html: data.html, videos: data.videos || [], steps }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Server error. Try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-green-700">
          ♻️ Waste Awareness Hub
        </h1>

        <div className="bg-gray-100 p-6 rounded-xl shadow-md">
          <div className="h-80 overflow-y-auto mb-4 bg-white p-4 rounded-lg">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`mb-3 ${msg.sender === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block px-4 py-2 rounded-lg ${
                    msg.sender === "user" ? "bg-green-600 text-white" : "bg-gray-300 text-black"
                  } max-w-xl text-left`}
                >
                  {msg.sender === "user" ? (
                    msg.text
                  ) : (
                    // bot message: prefer step-wise rendering when available
                    msg.steps ? (
                      <ol className="list-decimal list-inside space-y-2">
                        {msg.steps.map((s, idx) => (
                          <li key={idx} className="text-sm leading-snug">{s}</li>
                        ))}
                      </ol>
                    ) : msg.html ? (
                      <div dangerouslySetInnerHTML={{ __html: msg.html }} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                    )
                  )}

                  {/* Videos */}
                  {msg.videos && msg.videos.length > 0 && (
                    <div className="mt-2">
                      {msg.videos.map((v) => (
                        <div key={v}>
                          <a href={v} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                            ▶ Watch: {v}
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <p className="text-gray-500">EcoBot typing...</p>}
            <div ref={chatEndRef}></div>
          </div>

          <div className="flex gap-2 mt-2">
            <input
              type="text"
              className="flex-1 p-2 border rounded-lg"
              placeholder="Ask EcoBot..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => { if(e.key==="Enter") sendMessage(); }}
            />
            <button
              onClick={sendMessage}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 