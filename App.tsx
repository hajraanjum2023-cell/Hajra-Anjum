
import React, { useState, useEffect, useRef } from 'react';
import { Message, Appointment } from './types';
import { GPS, SURGERY_RULES } from './constants';
import { chatService, handleFunctionCall } from './services/geminiService';
import { getAppointments } from './services/appointmentService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      text: "Hello! I'm the HealthyLife GP Surgery Assistant. How can I help you today? You can book an appointment, check availability, or ask about our surgery policies.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setUserAppointments(getAppointments());
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let response = await chatService.sendMessage({ message: input });

      while (response.functionCalls && response.functionCalls.length > 0) {
        const toolOutputs = [];
        for (const call of response.functionCalls) {
          const result = await handleFunctionCall(call);
          toolOutputs.push({
            id: call.id,
            name: call.name,
            response: result
          });
        }
        // Send tool results back to model
        response = await chatService.sendMessage({
            // Note: chat.sendMessage for tools usually involves sending the tool response back.
            // In @google/genai, we use the active chat session's tools.
            // Simplified for this SDK:
            message: JSON.stringify(toolOutputs)
        });
      }

      setMessages(prev => [...prev, {
        role: 'model',
        text: response.text || "I've processed your request.",
        timestamp: new Date()
      }]);
      setUserAppointments(getAppointments());
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        role: 'model',
        text: "I'm sorry, I encountered an error. Please try again or call the surgery directly.",
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen max-w-6xl mx-auto shadow-2xl bg-white lg:flex-row overflow-hidden">
      {/* Sidebar - Info & Dashboard */}
      <aside className="w-full lg:w-80 bg-slate-900 text-white p-6 flex flex-col gap-8 overflow-y-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
          </div>
          <h1 className="text-xl font-bold">HealthyLife GP</h1>
        </div>

        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Your Appointments</h2>
          {userAppointments.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No upcoming appointments</p>
          ) : (
            <div className="space-y-3">
              {userAppointments.map(appt => (
                <div key={appt.id} className="bg-slate-800 p-3 rounded-lg border border-slate-700 text-sm">
                  <div className="font-medium text-blue-400">{GPS.find(g => g.id === appt.gpId)?.name}</div>
                  <div className="flex justify-between mt-1 text-slate-300">
                    <span>{appt.date}</span>
                    <span>{appt.startTime}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-400 flex items-center gap-1">
                    <span className={`w-2 h-2 rounded-full ${appt.type === 'TELEPHONE' ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    {appt.type}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Quick Guidance</h2>
          <div className="text-sm space-y-4">
            <div>
              <h3 className="text-blue-400 font-medium mb-1">Dos</h3>
              <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                {SURGERY_RULES.dos.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-red-400 font-medium mb-1">Don'ts</h3>
              <ul className="list-disc list-inside text-slate-300 text-xs space-y-1">
                {SURGERY_RULES.donts.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          </div>
        </section>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col bg-slate-50 relative">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between shadow-sm">
          <div>
            <h2 className="font-semibold text-slate-800">Surgery Chat Assistant</h2>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Online & Available
            </p>
          </div>
          <div className="flex gap-2">
            {GPS.map(gp => (
              <div key={gp.id} className="hidden md:block group relative">
                 <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600 hover:border-blue-400 cursor-pointer">
                    {gp.name.split(' ').pop()?.charAt(0)}
                 </div>
                 <div className="absolute top-full right-0 mt-2 p-2 bg-white shadow-xl rounded border text-xs whitespace-nowrap hidden group-hover:block z-10 text-slate-800">
                    {gp.name} - {gp.specialty}
                 </div>
              </div>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 lg:p-8 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] lg:max-w-[70%] rounded-2xl p-4 shadow-sm ${
                m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white border text-slate-800 rounded-tl-none'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                <span className={`text-[10px] mt-2 block opacity-60 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                  {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-.15s]"></div>
                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce [animation-delay:-.3s]"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <footer className="p-4 lg:p-6 bg-white border-t">
          <div className="flex gap-2 items-center max-w-4xl mx-auto">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="e.g. I'd like to book an appointment with Dr. Smith for next Monday"
              className="flex-1 p-3 lg:p-4 bg-slate-100 rounded-xl border border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all text-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 lg:p-4 rounded-xl transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
          </div>
          <p className="text-[10px] text-center mt-3 text-slate-400 uppercase tracking-widest font-semibold">
            Healthylife Surgery • Automated Assistant • Confidential & Secure
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
