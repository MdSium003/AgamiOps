import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User } from 'lucide-react'

function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m BizPilot AI Assistant. How can I help you with your business planning today?',
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef(null)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const stoppingRef = useRef(false)
  const finalTextRef = useRef('')

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize Speech Recognition when widget opens first time
  useEffect(() => {
    if (!isOpen) return
    if (recognitionRef.current) return
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return
    const rec = new SpeechRecognition()
    rec.lang = 'en-US'
    rec.interimResults = true
    rec.continuous = true
    finalTextRef.current = ''

    rec.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTextRef.current += transcript + ' '
        } else {
          interim += transcript
        }
      }
      const combined = `${finalTextRef.current}${interim}`.trim()
      setInputText(combined)
    }

    rec.onend = () => {
      // For continuous dictation some browsers fire onend periodically; restart if still recording
      if (!stoppingRef.current && isRecording) {
        try { rec.start() } catch {}
      }
    }

    rec.onerror = () => {
      if (!stoppingRef.current && isRecording) {
        try { rec.start() } catch {}
      }
    }

    recognitionRef.current = rec
  }, [isOpen])

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault()
    if (!inputText.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsTyping(true)

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const responses = [
        "That's a great question! Let me help you with that business planning aspect.",
        "I can assist you with creating business models, financial forecasts, and execution checklists.",
        "For your business idea, I'd recommend starting with our AI business model generator to explore different approaches.",
        "You can use our marketplace to find similar business ideas and collaborate with other entrepreneurs.",
        "Would you like me to walk you through creating a financial forecast for your business?",
        "I can help you break down your business idea into actionable steps using our checklist feature.",
        "Let me know more about your specific business challenge, and I'll provide targeted guidance.",
        "Our platform offers industry benchmarks to help validate your business assumptions."
      ]
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)]
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: randomResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const toggleVoice = () => {
    const rec = recognitionRef.current
    if (!rec) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.')
      return
    }
    if (isRecording) {
      stoppingRef.current = true
      try { rec.stop() } catch {}
      setIsRecording(false)
    } else {
      try {
        finalTextRef.current = ''
        stoppingRef.current = false
        setIsRecording(true)
        rec.start()
      } catch {}
    }
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)'
            e.target.style.boxShadow = '0 6px 25px rgba(0,0,0,0.2)'
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)'
            e.target.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)'
          }}
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Widget */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '350px',
            height: '500px',
            background: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {/* Header */}
          <div
            style={{
              background: 'var(--primary)',
              color: 'white',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#4ade80'
                }}
              />
              <span style={{ fontWeight: '600', fontSize: '16px' }}>BizPilot AI</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '4px'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {messages.map((message) => (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                {message.type === 'bot' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Bot size={16} color="white" />
                  </div>
                )}
                
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: message.type === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: message.type === 'user' ? 'var(--primary)' : 'var(--muted)',
                    color: message.type === 'user' ? 'white' : 'var(--foreground)',
                    fontSize: '14px',
                    lineHeight: '1.4'
                  }}
                >
                  {message.text}
                  <div
                    style={{
                      fontSize: '11px',
                      opacity: 0.7,
                      marginTop: '4px'
                    }}
                  >
                    {formatTime(message.timestamp)}
                  </div>
                </div>

                {message.type === 'user' && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <User size={16} color="var(--foreground)" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Bot size={16} color="white" />
                </div>
                <div
                  style={{
                    padding: '12px 16px',
                    borderRadius: '18px 18px 18px 4px',
                    background: 'var(--muted)',
                    color: 'var(--foreground)',
                    fontSize: '14px'
                  }}
                >
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span>Typing</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--foreground)',
                          animation: 'typing 1.4s infinite ease-in-out'
                        }}
                      />
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--foreground)',
                          animation: 'typing 1.4s infinite ease-in-out 0.2s'
                        }}
                      />
                      <div
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: 'var(--foreground)',
                          animation: 'typing 1.4s infinite ease-in-out 0.4s'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div
            style={{
              padding: '16px',
              borderTop: '1px solid var(--border)',
              background: 'white'
            }}
          >
            <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message..."
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  border: '1px solid var(--border)',
                  borderRadius: '24px',
                  outline: 'none',
                  fontSize: '14px',
                  background: 'var(--background)'
                }}
              />
              <button
                type="button"
                onClick={toggleVoice}
                title={isRecording ? 'Stop voice input' : 'Speak'}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: isRecording ? '#dc2626' : 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                {isRecording ? (
                  // simple recording dot
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', display: 'inline-block' }} />
                ) : (
                  // mic glyph using simple svg to avoid adding more deps
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/>
                  </svg>
                )}
              </button>
              <button
                type="submit"
                disabled={!inputText.trim() || isTyping}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: inputText.trim() && !isTyping ? 'var(--primary)' : '#d1d5db',
                  color: inputText.trim() && !isTyping ? '#ffffff' : '#6b7280',
                  border: 'none',
                  cursor: inputText.trim() && !isTyping ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.12)'
                }}
              >
                <Send size={28} />
              </button>
            </form>
            <div
              style={{
                textAlign: 'center',
                fontSize: '11px',
                color: 'var(--muted-foreground)',
                marginTop: '8px'
              }}
            >
              Powered by BizPilot AI
            </div>
          </div>
        </div>
      )}

      {/* CSS for typing animation */}
      <style jsx>{`
        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </>
  )
}

export default ChatAssistant
