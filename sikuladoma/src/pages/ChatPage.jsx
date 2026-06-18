import { useState, useRef } from 'react'
import { DEMO_MESSAGES } from '../data'
import Icon from '../components/Icon'

const conversations = [
  { id: 1, name: 'Pavel Šikovný', preview: 'Tak se uvidíme v 10:00 👍', time: '10:51', unread: 0 },
  { id: 2, name: 'Radek Tesař', preview: 'Mohu přijít v pátek?', time: 'včera', unread: 1 },
  { id: 3, name: 'Jana Nováková', preview: 'Děkuji za rychlou práci!', time: '2 dny', unread: 0 },
]

export default function ChatPage() {
  const [active, setActive] = useState(1)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState(DEMO_MESSAGES)
  const endRef = useRef(null)

  const send = () => {
    if (!input.trim()) return
    const now = new Date().toLocaleTimeString('cs', { hour: '2-digit', minute: '2-digit' })
    setMessages(prev => ({
      ...prev,
      [active]: [...(prev[active] ?? []), { from: 'me', text: input, time: now }],
    }))
    setInput('')
  }

  const activeConv = conversations.find(c => c.id === active)

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Zprávy</h2>
      <div className="chat-wrap">
        <div className="chat-list">
          {conversations.map(c => (
            <div key={c.id} className={`chat-list-item ${active === c.id ? 'active' : ''}`} onClick={() => setActive(c.id)}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {c.name.split(' ').map(w => w[0]).join('')}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="chat-list-name">{c.name}</div>
                    <div className="chat-list-time">{c.time}</div>
                  </div>
                  <div className="chat-list-preview">{c.preview}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="chat-main">
          <div className="chat-header-bar">
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13 }}>
              {activeConv?.name.split(' ').map(w => w[0]).join('')}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{activeConv?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span className="online-dot" style={{ width: 7, height: 7 }} /> Online
              </div>
            </div>
          </div>

          <div className="chat-messages">
            {(messages[active] ?? []).map((m, i) => (
              <div key={i} className={`chat-msg ${m.from}`}>
                {m.text}
                <div className="chat-msg-time">{m.time}</div>
              </div>
            ))}
            <div ref={endRef} />
          </div>

          <div className="chat-input-bar">
            <input
              className="chat-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Napište zprávu..."
            />
            <button className="btn btn-primary btn-sm" onClick={send}>
              <Icon name="send" size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
