'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inp = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' as const }

export default function Schedule() {
  const router = useRouter()
  const [shifts, setShifts] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState<string|null>(null)
  const [assignedTo, setAssignedTo] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'list'|'calendar'>('list')
  const [calMonth, setCalMonth] = useState(new Date())
  const [filter, setFilter] = useState<'all'|'today'|'upcoming'|'past'>('all')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchShifts()
    fetchStaff()
  }, [])

  async function fetchShifts() {
    const { data } = await supabase.from('schedules').select('*').order('shift_date')
    if (data) setShifts(data)
  }

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('full_name')
    if (data) setStaffList(data)
  }

  async function saveShift() {
    if (!shiftDate || !startTime || !endTime) return
    setLoading(true)
    const payload: any = { shift_date: shiftDate, start_time: startTime, end_time: endTime, notes: notes || null }
    if (assignedTo) payload.assigned_to = assignedTo
    if (editId) {
      await supabase.from('schedules').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('schedules').insert(payload)
    }
    setAssignedTo(''); setShiftDate(''); setStartTime(''); setEndTime(''); setNotes('')
    setShowForm(false); setLoading(false)
    fetchShifts()
  }

  async function deleteShift(id: string) {
    if (!confirm('Delete this shift?')) return
    await supabase.from('schedules').delete().eq('id', id)
    fetchShifts()
  }

  function startEdit(s: any) {
    setEditId(s.id)
    setAssignedTo(s.assigned_to || '')
    setShiftDate(s.shift_date)
    setStartTime(s.start_time?.slice(0,5)||'')
    setEndTime(s.end_time?.slice(0,5)||'')
    setNotes(s.notes||'')
    setShowForm(true)
  }

  function getStaffName(s: any) {
    const found = staffList.find(st => st.user_id === s.assigned_to)
    return found ? found.full_name : s.notes || '—'
  }

  const staffColors = ['#2357A3','#16a34a','#b45309','#7c3aed','#dc2626','#0891b2']
  function getStaffColor(assigned_to: string) {
    const idx = staffList.findIndex(st => st.user_id === assigned_to)
    return staffColors[idx % staffColors.length] || '#2357A3'
  }

  const today = new Date().toISOString().split('T')[0]
  const todayShifts = shifts.filter(s => s.shift_date === today)
  const upcomingShifts = shifts.filter(s => s.shift_date > today)
  const pastShifts = shifts.filter(s => s.shift_date < today)

  function getDaysInMonth(date: Date) {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    return { firstDay, daysInMonth, year, month }
  }

  function getShiftsForDay(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
    return shifts.filter(s => s.shift_date === dateStr)
  }

  const { firstDay, daysInMonth, year, month } = getDaysInMonth(calMonth)
  const monthName = calMonth.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const ShiftRow = ({ s, badge, bg, color }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '0.5px solid #eee', gap: '10px' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2357A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {getStaffName(s).charAt(0).toUpperCase()}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{getStaffName(s)}</div>
        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{new Date(s.shift_date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })} · {s.start_time?.slice(0,5)}{s.end_time ? ` - ${s.end_time.slice(0,5)}` : ""} – {s.end_time?.slice(0,5)}</div>
      </div>
      <span style={{ fontSize: '11px', padding: '2px 10px', borderRadius: '20px', background: bg, color: color, fontWeight: 700 }}>{badge}</span>
      <button onClick={() => startEdit(s)} style={{ fontSize: '11px', color: '#2357A3', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
      <button onClick={() => deleteShift(s.id)} style={{ fontSize: '11px', color: '#A3202D', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
    </div>
  )

  return (
    <div style={{ padding: '24px', maxWidth: '960px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#1a1a1a' }}>Schedule</div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '8px', padding: '3px' }}>
            <button onClick={() => setView('list')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: view === 'list' ? 'white' : 'transparent', color: view === 'list' ? '#2357A3' : '#888', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>List</button>
            <button onClick={() => setView('calendar')} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: view === 'calendar' ? 'white' : 'transparent', color: view === 'calendar' ? '#2357A3' : '#888', boxShadow: view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Calendar</button>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditId(null) }} style={{ background: '#F5A623', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>+ Add Shift</button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', marginBottom: '14px' }}>{editId ? 'EDIT SHIFT' : 'NEW SHIFT'}</div>
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>ASSIGN TO</div>
            <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} style={inp}>
              <option value="">— Select staff member —</option>
              {staffList.map(st => (
                <option key={st.id} value={st.user_id || ''}>{st.full_name} ({st.role})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>DATE</div>
              <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>START TIME</div>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={inp} />
            </div>
            <div>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>END TIME</div>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={inp} />
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>NOTES (optional)</div>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g. morning shift" style={inp} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={saveShift} disabled={loading} style={{ background: '#F5A623', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Saving...' : editId ? 'Update' : 'Save Shift'}</button>
            <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: '#eee', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* CALENDAR VIEW */}
      {view === 'calendar' && (
        <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '0.5px solid #eee' }}>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>‹</button>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>{monthName}</div>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer', fontSize: '14px' }}>›</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '0.5px solid #eee' }}>
            {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
              <div key={d} style={{ padding: '8px', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#888' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: '80px', borderRight: '0.5px solid #f0f0f0', borderBottom: '0.5px solid #f0f0f0', background: '#fafafa' }} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayShifts = getShiftsForDay(year, month, day)
              const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
              const isToday = dateStr === today
              return (
                <div key={day} style={{ minHeight: '80px', borderRight: '0.5px solid #f0f0f0', borderBottom: '0.5px solid #f0f0f0', padding: '6px', background: isToday ? '#EEF4FF' : 'white' }}>
                  <div style={{ fontSize: '12px', fontWeight: isToday ? 700 : 400, marginBottom: '4px', width: '22px', height: '22px', borderRadius: '50%', background: isToday ? '#2357A3' : 'transparent', color: isToday ? 'white' : '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{day}</div>
                  {dayShifts.map(s => (
                    <div key={s.id} style={{ background: getStaffColor(s.assigned_to), color: 'white', borderRadius: '4px', padding: '2px 5px', fontSize: '10px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {getStaffName(s)} {s.start_time?.slice(0,5)}{s.end_time ? ` - ${s.end_time.slice(0,5)}` : ""}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div>
          <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #eee', fontSize: '10px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px' }}>TODAY — {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</div>
            {todayShifts.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No shifts today.</div> : todayShifts.map(s => <ShiftRow key={s.id} s={s} badge="On Shift" bg="#dcfce7" color="#16a34a" />)}
          </div>
          <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', overflow: 'hidden', marginBottom: '20px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #eee', fontSize: '10px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px' }}>UPCOMING SHIFTS</div>
            {upcomingShifts.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No upcoming shifts.</div> : upcomingShifts.map(s => <ShiftRow key={s.id} s={s} badge="Upcoming" bg="#dbeafe" color="#1d4ed8" />)}
          </div>
          <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #eee', fontSize: '10px', fontWeight: 700, color: '#888', letterSpacing: '1px' }}>PAST SHIFTS</div>
            {pastShifts.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No past shifts.</div> : pastShifts.map(s => <ShiftRow key={s.id} s={s} badge="Past" bg="#f3f4f6" color="#6b7280" />)}
          </div>
        </div>
      )}
    </div>
  )
}
