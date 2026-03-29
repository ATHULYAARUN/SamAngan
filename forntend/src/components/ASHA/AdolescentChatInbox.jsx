import React, { useEffect, useState } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import ashaService from '../../services/ashaService';

const quickTemplates = [
  'Please continue iron-rich foods daily (spinach, dates, eggs) and follow your IFA schedule.',
  'Take one IFA tablet daily after meals. Avoid tea/coffee around tablet time.',
  'If you feel dizziness, weakness, or heavy bleeding, visit PHC immediately and inform us.',
  'Maintain menstrual hygiene by changing pads every 4-6 hours and drinking enough water.'
];

const AdolescentChatInbox = () => {
  const [inbox, setInbox] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const loadInbox = async () => {
    try {
      setLoading(true);
      const res = await ashaService.getAdolescentChatInbox();
      const list = res?.data || [];
      setInbox(list);
      if (!selected && list.length > 0) {
        setSelected(list[0].adolescentName);
      }
    } catch {
      setInbox([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (name) => {
    if (!name) return;
    try {
      const res = await ashaService.getAdolescentChatMessages(name);
      setMessages(res?.data || []);
      await ashaService.markAdolescentChatRead(name);
      await loadInbox();
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  useEffect(() => {
    loadMessages(selected);
  }, [selected]);

  const sendReply = async () => {
    const message = text.trim();
    if (!message || !selected) return;
    await ashaService.sendAdolescentChatMessage(selected, message);
    setText('');
    await loadMessages(selected);
    await loadInbox();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white border border-gray-200 rounded-xl">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900 flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          Adolescent Chat Inbox
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {loading ? (
            <p className="p-4 text-sm text-gray-500">Loading inbox...</p>
          ) : inbox.length === 0 ? (
            <p className="p-4 text-sm text-gray-500">No chat conversations yet.</p>
          ) : (
            inbox.map((c) => (
              <button
                key={c.adolescentName}
                onClick={() => setSelected(c.adolescentName)}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 ${
                  selected === c.adolescentName ? 'bg-green-50' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900">{c.adolescentName}</p>
                  {c.unreadCount > 0 && (
                    <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 truncate">{c.lastSenderName}: {c.lastMessage}</p>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl flex flex-col">
        <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-900">
          {selected ? `Conversation with ${selected}` : 'Select a conversation'}
        </div>
        <div className="flex-1 max-h-[24rem] overflow-y-auto p-4 bg-gray-50">
          {messages.length === 0 ? (
            <p className="text-sm text-gray-500">No messages.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m._id}
                className={`mb-2 p-2 rounded-lg text-sm ${
                  m.senderRole === 'asha' ? 'bg-green-100 ml-10' : 'bg-blue-100 mr-10'
                }`}
              >
                <p className="font-medium">{m.senderName}</p>
                <p>{m.message}</p>
              </div>
            ))
          )}
        </div>
        <div className="p-3 border-t border-gray-200 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Reply to adolescent..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button onClick={sendReply} className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-1 text-sm">
            <Send className="w-4 h-4" />
            Send
          </button>
        </div>
        <div className="px-3 pb-3 flex flex-wrap gap-2">
          {quickTemplates.map((t, idx) => (
            <button
              key={idx}
              onClick={() => setText(t)}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Template {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdolescentChatInbox;
