import { useEffect } from 'react'

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div className="notif-toast">
      <span style={{ fontSize: 18 }}>✅</span>
      {message}
    </div>
  )
}
