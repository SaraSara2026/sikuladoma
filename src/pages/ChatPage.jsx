import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon'
import { conversationsApi, messagesApi } from '../lib/api'
import { isSikulaPlanActive } from '../lib/plan.js'

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

// Úsporný podpis nad bublinou — jen křestní jméno, ne celé "Jana Nováková".
function firstName(name) {
  if (!name) return 'Uživatel'
  return name.trim().split(/\s+/)[0]
}

export default function ChatPage({ currentUser, startWith, onNav, embedded = false }) {
  const user = currentUser
  const [conversations, setConversations] = useState([])
  const [active, setActive]   = useState(null)        // id konverzace
  const [messages, setMessages] = useState([])
  const [input, setInput]     = useState('')
  const [convLoading, setConvLoading] = useState(true)
  const [msgLoading, setMsgLoading]   = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError]     = useState(null)
  const [creating, setCreating] = useState(!!startWith?.otherUserId || !!startWith?.conversationId)
  const endRef = useRef(null)

  // Přišli jsme sem přes "Napsat zprávu"/e-mailový odkaz ke konkrétní zakázce —
  // buď už víme přesné ID konverzace (deep-link z e-mailu), nebo ji (idempotentně)
  // založíme/najdeme podle druhé strany, než necháme běžet obvyklý seznam+poll.
  useEffect(() => {
    if (!user) { setCreating(false); return }
    if (startWith?.conversationId) {
      setActive(startWith.conversationId)
      setCreating(false)
      return
    }
    if (!startWith?.otherUserId) { setCreating(false); return }
    let alive = true
    setCreating(true)
    conversationsApi.create({ other_user_id: startWith.otherUserId, order_id: startWith.orderId || null })
      .then(({ conversation }) => {
        if (!alive) return
        setActive(conversation.id)
        return conversationsApi.list()
      })
      .then(res => { if (alive && res) setConversations(res.conversations) })
      .catch(e => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setCreating(false) })
    return () => { alive = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, startWith?.otherUserId, startWith?.orderId, startWith?.conversationId])

  // Načti konverzace + poll každých POLL_MS.
  useEffect(() => {
    if (!user) return
    let alive = true
    const load = () => conversationsApi.list()
      .then(({ conversations }) => {
        if (!alive) return
        setConversations(conversations)
        // Pokud právě zakládáme/otevíráme konkrétní konverzaci (startWith), nechceme
        // mezitím přeskočit na jinou — počkáme, až se dokončí.
        if (active == null && conversations.length > 0 && !startWith?.otherUserId && !startWith?.conversationId) setActive(conversations[0].id)
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
    if (!text || !active || phoneRequired || planRequired) return
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
  // Bez telefonu se zákazník se šikulou nemůže domluvit na detailech zakázky.
  const phoneRequired = user.role === 'sikula' && !user.phone
  // Komunikace se zákazníkem vyžaduje aktivní tarif (zrušený tarif zůstává
  // funkční až do konce zaplaceného období).
  const planRequired = user.role === 'sikula' && !isSikulaPlanActive(user)

  return (
    <div className="page-enter" style={{ padding: embedded ? 0 : '32px 24px', maxWidth: 1120, margin: '0 auto' }}>
      {onNav && (
        <button className="btn btn-ghost" onClick={() => onNav('back')} style={{ marginBottom: 16 }}>
          ← {user.role === 'customer' ? 'Zpět do přehledu' : 'Zpět do dashboardu'}
        </button>
      )}
      {!embedded && <h2 style={{ marginBottom: 24 }}>Zprávy</h2>}

      {(convLoading || creating) && <div style={{ color: 'var(--text3)' }}>{creating ? 'Otevírám konverzaci…' : 'Načítám konverzace…'}</div>}
      {error && <div style={{ color: '#B91C1C' }}>{error}</div>}

      {!convLoading && !creating && conversations.length === 0 && (
        <div className="empty-state" style={{ padding: 60 }}>
          <div className="empty-icon">💬</div>
          <h3>Zatím nemáte žádné zprávy.</h3>
          <p>Konverzace se založí automaticky, jakmile přijmete nabídku (nebo dostanete přijatou).</p>
        </div>
      )}

      {conversations.length > 0 && (
        <div className="chat-wrap">
          {/* V embedded módu (detail zakázky) je konverzace jednoznačně daná
              order_id — nenabízet přepínání na jiné konverzace zákazníka. */}
          {!embedded && (
            <div className="chat-list">
              {conversations.map(c => (
                <div key={c.id} className={`chat-list-item ${active === c.id ? 'active' : ''}`} onClick={() => setActive(c.id)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="chat-avatar">
                      {c.other_avatar || initials(c.other_name)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="chat-list-name">{c.other_name || 'Uživatel'}</div>
                        <div className="chat-list-time">{timeShort(c.last_message_at || c.created_at)}</div>
                      </div>
                      {/* Název zakázky musí být vidět u každé konverzace, ne jen
                          dokud v ní není žádná zpráva — jinak nejde rozeznat dvě
                          konverzace se stejným člověkem k různým zakázkám. */}
                      {c.order_title && <div className="chat-list-order">{c.order_title}</div>}
                      <div className="chat-list-preview" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {c.last_message || 'Nová konverzace'}
                        </span>
                        {Number(c.unread_count) > 0 && (
                          <span style={{ background: 'var(--orange)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 999, marginLeft: 6 }}>
                            {c.unread_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="chat-main">
            <div className="chat-header-bar">
              <div className="chat-header-label">{activeConv?.order_title ? 'Zprávy k zakázce' : 'Zprávy'}</div>
              {activeConv?.order_title && <div className="chat-header-order">{activeConv.order_title}</div>}
              <div className="chat-header-sub">
                Komunikace {user.role === 'customer' ? 'se šikulou' : 'se zákazníkem'} {activeConv?.other_name}
              </div>
            </div>

            <div className="chat-messages">
              {msgLoading && messages.length === 0 && (
                <div style={{ color: 'var(--text3)', textAlign: 'center', padding: 20 }}>Načítám…</div>
              )}
              {/* Přesně chronologický seznam — jedna zpráva = jedna bublina,
                  žádné seskupování po odesílateli, pořadí jde 1:1 podle API. */}
              {messages.map(m => {
                const mine = m.sender_id === user.id
                const senderLabel = mine ? 'Vy' : firstName(activeConv?.other_name)
                return (
                  <div key={m.id} className={`chat-msg ${mine ? 'me' : 'them'}`}>
                    <div className="chat-msg-sender">{senderLabel}</div>
                    {m.text}
                    <div className="chat-msg-time">{timeShort(m.created_at)}</div>
                  </div>
                )
              })}
              <div ref={endRef} />
            </div>

            {phoneRequired ? (
              <div className="chat-input-bar" style={{ color: '#B91C1C', fontSize: 13 }}>
                📞 Doplňte si telefon v profilu, než budete moct posílat zprávy.
              </div>
            ) : planRequired ? (
              <div className="chat-input-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: '#B91C1C', fontSize: 13 }}>
                  Pro odeslání nabídky a komunikaci se zákazníkem si aktivujte tarif.
                </span>
                <button className="btn btn-primary btn-sm" onClick={() => onNav?.('dash-sikula')}>
                  Aktivovat tarif
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      )}
    </div>
  )
}
