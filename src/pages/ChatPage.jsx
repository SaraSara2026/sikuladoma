import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { conversationsApi, messagesApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

const POLL_MS = 5000

function timeShort(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) {
    return d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' })
  }
  const diffDays = Math.floor((today - d) / (24 * 3600 * 1000))
  if (diffDays === 1) return 'včera'
  if (diffDays < 7)   return `${diffDays} d`
  return d.toLocaleDateString('cs-CZ')
}

function initials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

export default function ChatPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState([])
  const [active, setActive]   = useState(null)        // id konverzace
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [convLoading, setConvLoading] = useState(true)
  const [msgLoading, setMsgLoading]   = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState(null)
  const endRef = useRef(null)

  // Načti konverzace + poll každých POLL_MS.
  useEffect(() => {
    if (!user) return
    let alive = true
    const load = () => conversationsApi.list()
      .then(({ conversations }) => {
        if (!alive) return
        setConversations(conversations)
        if (active == null && conversations.length > 0) setActive(conversations[0].id)
      })
      .catch(e => alive && setError(e.message))
      .finally(() => alive && setConvLoading(false))
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [user, active])

  // Načti zprávy aktivní konverzace + poll.
  useEffect(() => {
    if (!active) return
    let alive = true
    setMsgLoading(true)
    const load = () => messagesApi.list(active)
      .then(({ messages }) => alive && setMessages(messages))
      .catch(() => {})
      .finally(() => alive && setMsgLoading(false))
    load()
    const id = setInterval(load, POLL_MS)
    return () => { alive = false; clearInterval(id) }
  }, [active])

  // Auto-scroll na nejnovější zprávu.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const text = input.trim()
    if (!text || !active) return
    setSending(true)
    try {
      const { message } = await messagesApi.send({ conversation_id: active, text })
      setMessages(prev => [...prev, message])
      setInput('')
    } catch (e) {
      alert(e.message)
    } finally {
      setSending(false)
    }
  }

  if (!user) {
    return (
      <div className="empty-state" style={{ padding: 60 }}>
        <div className="empty-icon">🔐</div>
        <h3>Pro chat se musíte přihlásit</h3>
      </div>
    )
  }

  const activeConv = conversations.find(c => c.id === active)

  return (
    <div className="page-enter" style={{ padding: '32px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 24 }}>Zprávy</h2>

      {convLoading && <div style={{ color: 'var(--text3)' }}>Načítám konverzace…</div>}
      {error && <div style={{ color: '#B91C1C' }}>{error}</div>}

      {!convLoading && conversations.length === 0 && (
        <div className="empty-state" style={{ padding: 60 }}>
          <div className="empty-icon">💬</div>
          <h3>Žádné konverzace</h3>
          <p>Konverzace se založí automaticky, jakmile přijmete nabídku (nebo dostanete přijatou).</p>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="chat-wrap">
          <div className="chat-list">
            {conversations.map(c => (
              <div key={c.id} className={`chat-list-item ${active === c.id ? 'active' : ''}`} onClick={() => setActive(c.id)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                    {c.other_avatar || initials(c.other_name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="chat-list-name">{c.other_name || 'Uživatel'}</div>
                      <div className="chat-list-time">{timeShort(c.last_message_at || c.created_at)}</div>
                    </div>
                    <div className="chat-list-preview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {c.last_message || (c.order_title ? `Zakázka: ${c.order_title}` : 'Nová konverzace')}
                      </span>
                      {Number(c.unread_count) > 0 && (
                        <span style={{ background: 'var(--brand)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, marginLeft: 6 }}>
                          {c.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="chat-main">
            <div className="chat-header-bar">
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 13 }}>
                {activeConv?.other_avatar || initials(activeConv?.other_name)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{activeConv?.other_name}</div>
                {activeConv?.order_title && (
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>Zakázka: {activeConv.order_title}</div>
                )}
              </div>
            </div>

            <div className="chat-messages">
              {msgLoading && messages.length === 0 && (
                <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Načítám…</div>
              )}
              {messages.map(m => (
                <div key={m.id} className={`chat-msg ${m.sender_id === user.id ? 'me' : 'them'}`}>
                  {m.text}
                  <div className="chat-msg-time">{timeShort(m.created_at)}</div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            <div className="chat-input-bar">
              <input
                className="chat-input"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !sending && send()}
                placeholder="Napište zprávu..."
                disabled={!active || sending}
              />
              <button className="btn btn-primary btn-sm" onClick={send} disabled={!active || sending || !input.trim()}>
                <Icon name="send" size={15} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
