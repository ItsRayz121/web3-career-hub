'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatAssistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hey! I\'m your career assistant. Ask me anything — improving your CV, finding the right Web3 roles, writing cold messages, interview prep, or anything career-related.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100)
  }, [open])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    setInput('')

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) throw new Error('Failed')

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      setMessages(prev => [...prev, { role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: full }
          return updated
        })
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    }
    setLoading(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-[#6c63ff] hover:bg-[#5a52e0] text-white flex items-center justify-center shadow-lg shadow-[#6c63ff40] transition-all hover:scale-105"
        title="Career Assistant"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-6 z-50 w-80 md:w-96 flex flex-col bg-[#0f0f1a] border border-[#1e1e35] rounded-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '520px' }}>
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 border-b border-[#1e1e35] bg-[#12121f]">
            <div className="w-7 h-7 rounded-lg bg-[#6c63ff] flex items-center justify-center">
              <Sparkles size={13} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Career Assistant</p>
              <p className="text-[10px] text-[#555577]">Powered by Claude</p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ maxHeight: '360px' }}>
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-[#6c63ff] text-white rounded-br-sm'
                    : 'bg-[#1a1a2e] text-[#d0d0ee] border border-[#1e1e35] rounded-bl-sm'
                }`}>
                  {msg.content || <span className="opacity-50">Thinking...</span>}
                </div>
              </div>
            ))}
            {loading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start">
                <div className="bg-[#1a1a2e] border border-[#1e1e35] px-3 py-2 rounded-xl rounded-bl-sm">
                  <div className="flex gap-1">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#555577] animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick prompts */}
          {messages.length === 1 && (
            <div className="px-3 pb-2 flex gap-1.5 flex-wrap">
              {['Improve my CV', 'Cold message template', 'Best Web3 skills to learn', 'Interview tips'].map(q => (
                <button key={q} onClick={() => { setInput(q); setTimeout(send, 50) }}
                  className="text-[10px] px-2 py-1 rounded-lg bg-[#1a1a2e] text-[#8888aa] hover:text-white border border-[#1e1e35] transition-colors">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="p-3 border-t border-[#1e1e35] flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything career-related..."
              rows={1}
              className="flex-1 bg-[#1a1a2e] border border-[#1e1e35] rounded-lg px-3 py-2 text-xs text-white placeholder:text-[#555577] focus:outline-none focus:border-[#6c63ff] resize-none"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-[#6c63ff] hover:bg-[#5a52e0] disabled:opacity-40 text-white flex items-center justify-center transition-colors shrink-0 self-end"
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
