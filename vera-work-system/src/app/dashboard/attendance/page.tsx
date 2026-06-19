'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AttendancePage() {
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [attendance, setAttendance] = useState<any[]>([])
  const [profiles, setProfiles] = useState<Record<string, string>>({})
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const navSections = [
    { label: 'MAIN', items: [['Dashboard', '/dashboard'], ['Finance', '/dashboard/finance'], ['Tasks', '/dashboard/tasks'], ['Schedule', '/dashboard/schedule']] },
    { label: 'STORE', items: [['Inventory', '/dashboard/inventory'], ['Shipping', '/dashboard/shipping']] },
    { label: 'PEOPLE', items: [['Staff / HR', '/dashboard/staff'], ['Documents', '/dashboard/documents'], ['Attendance', '/dashboard/attendance']] },
  ]

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: profilesData } = await supabase.from('profiles').select('id, full_name')
      const pMap: Record<string, string> = {}
      ;(profilesData || []).forEach((p: any) => { pMap[p.id] = p.full_name })
      setProfiles(pMap)

      await fetchAttendance(currentMonth, pMap)
      setLoading(false)
    }
    init()
  }, [])

  async function fetchAttendance(month: Date, pMap?: Record<string, string>) {
    const year = month.getFullYear()
    const m = month.getMonth()
    const start = new Date(year, m, 1).toISOString().slice(0, 10)
    const end = new Date(year, m + 1, 0).toISOString().slice(0, 10)
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('clock_in', { ascending: true })
    setAttendance(data || [])
  }

  async function changeMonth(dir: number) {
    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + dir, 1)
    setCurrentMonth(next)
    setSelectedDay(null)
    setLoading(true)
    await fetchAttendance(next, profiles)
    setLoading(false)
  }

  function getDaysInMonth(month: Date) {
    const year = month.getFullYear()
    const m = month.getMonth()
    const firstDay = new Date(year, m, 1).getDay()
    const daysInMonth = new Date(year, m + 1, 0).getDate()
    return { firstDay, daysInMonth }
  }

  function getAttendanceForDay(dateStr: string) {
    return attendance.filter(a => a.date === dateStr)
  }

  function formatTime(ts: string | null) {
    if (!ts) return '—'
    return new Date(ts).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })
  }

  function calcHours(clockIn: string, clockOut: string | null) {
    if (!clockOut) return 'Active'
    const diff = (new Date(clockOut).getTime() - new Date(clockIn).getTime()) / 3600000
    return diff.toFixed(1) + 'h'
  }

  function getInitials(name: string) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const { firstDay, daysInMonth } = getDaysInMonth(currentMonth)
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const today = new Date().toISOString().slice(0, 10)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const selectedDayRecords = selectedDay ? getAttendanceForDay(selectedDay) : []

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F0F4F8', fontFamily: 'Inter, sans-serif' }}>
      {/* Sidebar */}
      <div style={{ width: '220px', background: '#142F5C', color: 'white', padding: '24px 0', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: '#E8F1F9' }}>VERA</div>
          <div style={{ fontSize: '11px', color: '#3E7CB7', letterSpacing: '2px' }}>NUTRITION</div>
        </div>
        <nav style={{ flex: 1, padding: '16px 0' }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '10px', color: '#3E7CB7', letterSpacing: '1.5px', padding: '8px 20px 4px' }}>{section.label}</div>
              {section.items.map(([label, href]) => (
                <a key={href} href={href} style={{
                  display: 'block', padding: '9px 20px', fontSize: '13px', color: href === '/dashboard/attendance' ? 'white' : 'rgba(255,255,255,0.7)',
                  background: href === '/dashboard/attendance' ? 'rgba(62,124,183,0.3)' : 'transparent',
                  borderLeft: href === '/dashboard/attendance' ? '3px solid #3E7CB7' : '3px solid transparent',
                  textDecoration: 'none', transition: 'all 0.15s'
                }}>{label}</a>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={handleLogout} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Logout</button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#142F5C', margin: 0 }}>Attendance History</h1>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>Full clock-in/out record for all staff</p>
        </div>

        {/* Calendar Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <button onClick={() => changeMonth(-1)} style={{ background: '#E8F1F9', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px', color: '#2357A3' }}>‹</button>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#142F5C' }}>{monthName}</div>
            <button onClick={() => changeMonth(1)} style={{ background: '#E8F1F9', border: 'none', borderRadius: '8px', padding: '8px 14px', cursor: 'pointer', fontSize: '16px', color: '#2357A3' }}>›</button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', marginBottom: '4px' }}>
            {weekDays.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: '#888', padding: '4px 0' }}>{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Loading...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={'empty-' + i} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayRecords = getAttendanceForDay(dateStr)
                const isToday = dateStr === today
                const isSelected = dateStr === selectedDay
                const hasRecords = dayRecords.length > 0

                return (
                  <div
                    key={dateStr}
                    onClick={() => hasRecords ? setSelectedDay(isSelected ? null : dateStr) : null}
                    style={{
                      minHeight: '72px', borderRadius: '8px', padding: '6px',
                      background: isSelected ? '#2357A3' : isToday ? '#E8F1F9' : hasRecords ? '#F8FAFB' : 'transparent',
                      border: isSelected ? '2px solid #2357A3' : isToday ? '2px solid #3E7CB7' : '2px solid transparent',
                      cursor: hasRecords ? 'pointer' : 'default',
                      transition: 'all 0.15s'
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 600, color: isSelected ? 'white' : isToday ? '#2357A3' : '#333', marginBottom: '4px' }}>{day}</div>
                    {dayRecords.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px' }}>
                        {dayRecords.slice(0, 2).map((r: any) => (
                          <div key={r.id} style={{
                            padding: '2px 6px', borderRadius: '4px',
                            background: isSelected ? 'rgba(255,255,255,0.25)' : '#2357A3',
                            color: 'white', fontSize: '10px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%'
                          }}>
                            {(profiles[r.staff_id] || 'Staff').split(' ')[0]}
                          </div>
                        ))}
                        {dayRecords.length > 2 && (
                          <div style={{ padding: '2px 6px', borderRadius: '4px', background: '#E8F1F9', color: '#2357A3', fontSize: '10px', fontWeight: 700 }}>
                            +{dayRecords.length - 2}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay && (
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#142F5C', marginBottom: '16px' }}>
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            {selectedDayRecords.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: '13px' }}>No attendance records for this day.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E8F1F9' }}>
                    <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', padding: '8px 12px', letterSpacing: '1px' }}>STAFF</th>
                    <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', padding: '8px 12px', letterSpacing: '1px' }}>CLOCK IN</th>
                    <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', padding: '8px 12px', letterSpacing: '1px' }}>CLOCK OUT</th>
                    <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', padding: '8px 12px', letterSpacing: '1px' }}>HOURS</th>
                    <th style={{ textAlign: 'left', fontSize: '11px', fontWeight: 700, color: '#888', padding: '8px 12px', letterSpacing: '1px' }}>STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDayRecords.map((r: any) => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px', fontSize: '13px', fontWeight: 600, color: '#333' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#2357A3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                            {getInitials(profiles[r.staff_id] || '?')}
                          </div>
                          {profiles[r.staff_id] || 'Unknown'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>{formatTime(r.clock_in)}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: r.clock_out ? '#dc2626' : '#888' }}>{formatTime(r.clock_out)}</td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#333', fontWeight: 600 }}>{calcHours(r.clock_in, r.clock_out)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: r.clock_out ? '#dcfce7' : '#fef9c3', color: r.clock_out ? '#16a34a' : '#854d0e' }}>
                          {r.clock_out ? 'Completed' : 'Clocked In'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
