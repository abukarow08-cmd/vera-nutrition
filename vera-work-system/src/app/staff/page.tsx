'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StaffDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [staffRecord, setStaffRecord] = useState<any>(null)
  const [todayShift, setTodayShift] = useState<any>(null)
  const [myTasks, setMyTasks] = useState<any[]>([])
  const [taskComments, setTaskComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState<Record<string,string>>({})
  const [expandedTask, setExpandedTask] = useState<string|null>(null)
  const [mySchedule, setMySchedule] = useState<any[]>([])
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [calMonth, setCalMonth] = useState(new Date())
  const [attendance, setAttendance] = useState<any>(null)
  const [clockLoading, setClockLoading] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)

      // Get staff record
      const { data: staffData } = await supabase.from('staff').select('*').eq('user_id', user.id).single()
      setStaffRecord(staffData)

      if (staffData) {
        // Today's shift
        const { data: shifts } = await supabase.from('schedules').select('*').eq('assigned_to', user.id).eq('shift_date', today)
        setTodayShift(shifts?.[0] || null)

        // My tasks
        const { data: tasks } = await supabase.from('tasks').select('*').eq('assigned_to', user.id).order('due_date', { ascending: true })
        setMyTasks(tasks || [])
    if (tasks && tasks.length > 0) {
      const taskIds = tasks.map((t: any) => t.id)
      const { data: cmts } = await supabase.from('task_comments').select('*, profiles(full_name)').in('task_id', taskIds).order('created_at', { ascending: true })
      setTaskComments(cmts || [])
    }

        // My schedule
        const { data: schedule } = await supabase.from('schedules').select('*').eq('assigned_to', user.id).order('shift_date', { ascending: true })
        setMySchedule(schedule || [])

        // Today's attendance
        const { data: att } = await supabase.from('attendance').select('*').eq('staff_id', user.id).eq('date', today).maybeSingle()
        setAttendance(att || null)
      }
    }
    init()
  }, [])

  async function clockIn() {
    if (!staffRecord) return
    setClockLoading(true)
    const { data, error } = await supabase.from('attendance').insert({
      staff_id: user.id,
      date: today,
      clock_in: new Date().toISOString()
    }).select().single()
    if (error) { console.error('Clock in error:', error); alert('Error: ' + error.message) }
    else setAttendance(data)
    setClockLoading(false)
  }

  async function clockOut() {
    if (!attendance) return
    setClockLoading(true)
    const { data, error } = await supabase.from('attendance').update({
      clock_out: new Date().toISOString()
    }).eq('id', attendance.id).select().single()
    if (error) { console.error('Clock in error:', error); alert('Error: ' + error.message) }
    else setAttendance(data)
    setClockLoading(false)
  }

  async function addComment(taskId: string, userId: string) {
    const text = newComment[taskId]?.trim()
    if (!text) return
    await supabase.from('task_comments').insert({ task_id: taskId, staff_id: userId, comment: text })
    setNewComment(prev => ({ ...prev, [taskId]: '' }))
    // Refresh comments
    const taskIds = myTasks.map((t: any) => t.id)
    const { data: cmts } = await supabase.from('task_comments').select('*, profiles(full_name)').in('task_id', taskIds).order('created_at', { ascending: true })
    setTaskComments(cmts || [])
  }

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'done' ? 'pending' : 'done'
    await supabase.from('tasks').update({ status: newStatus }).eq('id', taskId)
    setMyTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
  }

  const todayTasks = myTasks.filter(t => t.status !== 'done')
  const upcomingShifts = mySchedule.filter(s => s.shift_date >= today)
  const pastShifts = mySchedule.filter(s => s.shift_date < today)

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  function formatTime(ts: string) {
    if (!ts) return ''
    return new Date(ts).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }

  function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate() }
  function getFirstDay(year: number, month: number) { return new Date(year, month, 1).getDay() }
  function getShiftsForDay(year: number, month: number, day: number) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return mySchedule.filter(s => s.shift_date === dateStr)
  }

  const monthName = calMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const year = calMonth.getFullYear()
  const month = calMonth.getMonth()
  const firstDay = getFirstDay(year, month)
  const daysInMonth = getDaysInMonth(year, month)

  const clockedIn = attendance && attendance.clock_in && !attendance.clock_out
  const clockedOut = attendance && attendance.clock_in && attendance.clock_out

  return (
    <div style={{ minHeight: '100vh', background: '#F0F4F8', fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#142F5C', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontFamily: 'Arial Black,sans-serif', fontStyle: 'italic', fontSize: '22px', fontWeight: 900, color: 'white', lineHeight: 1 }}>VERA</div>
          <div style={{ fontSize: '6px', letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>N U T R I T I O N</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', color: 'white', fontWeight: 600 }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</div>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{ fontSize: '11px', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign Out</button>
        </div>
      </div>

      <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '22px', fontWeight: 700, color: '#142F5C' }}>
            Salaam, {user?.user_metadata?.full_name?.split(' ')[0] || 'there'} 👋
          </div>
          <div style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Clock In/Out Card */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '14px' }}>CLOCK IN / OUT</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              {!attendance && <div style={{ fontSize: '13px', color: '#888' }}>You haven't clocked in today.</div>}
              {clockedIn && (
                <div>
                  <div style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>✅ Clocked in at {formatTime(attendance.clock_in)}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>Clock out when your shift ends.</div>
                </div>
              )}
              {clockedOut && (
                <div>
                  <div style={{ fontSize: '13px', color: '#142F5C', fontWeight: 600 }}>✅ Shift complete</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>In: {formatTime(attendance.clock_in)} · Out: {formatTime(attendance.clock_out)}</div>
                </div>
              )}
            </div>
            <div>
              {!attendance && (
                <button onClick={clockIn} disabled={clockLoading} style={{ background: '#16a34a', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {clockLoading ? '...' : 'Clock In'}
                </button>
              )}
              {clockedIn && (
                <button onClick={clockOut} disabled={clockLoading} style={{ background: '#dc2626', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                  {clockLoading ? '...' : 'Clock Out'}
                </button>
              )}
              {clockedOut && (
                <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>Done for today 🎉</div>
              )}
            </div>
          </div>
        </div>

        {/* Today's Shift */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '12px' }}>TODAY'S SHIFT</div>
          {todayShift ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '13px', color: '#333', fontWeight: 600 }}>{todayShift.start_time} – {todayShift.end_time}</div>
              <div style={{ fontSize: '11px', color: '#888' }}>{todayShift.notes || ''}</div>
            </div>
          ) : (
            <div style={{ fontSize: '13px', color: '#aaa' }}>No shift scheduled for today</div>
          )}
        </div>

        {/* My Tasks */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', marginBottom: '16px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '12px' }}>MY TASKS</div>
          {todayTasks.length === 0 ? (
            <div style={{ fontSize: '13px', color: '#aaa' }}>All tasks done! 🎉</div>
          ) : todayTasks.map((task: any) => (
            <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input type="checkbox" checked={task.status === 'done'} onChange={() => toggleTask(task.id, task.status)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                <div>
                  <div style={{ fontSize: '13px', color: '#333' }}>{task.title}</div>
                  {task.due_date && <div style={{ fontSize: '11px', color: task.due_date < today ? '#dc2626' : '#888' }}>Due: {formatDate(task.due_date)}</div>}
                </div>
              </div>
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', background: task.priority === 'high' ? '#fee2e2' : task.priority === 'medium' ? '#fef9c3' : '#f3f4f6', color: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#b45309' : '#6b7280', fontWeight: 600 }}>{task.priority}</span>
            </div>
          ))}
        </div>

        {/* My Schedule */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px' }}>MY SCHEDULE</div>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button onClick={() => setView('list')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: view === 'list' ? 'white' : 'transparent', color: view === 'list' ? '#2357A3' : '#888', boxShadow: view === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>List</button>
              <button onClick={() => setView('calendar')} style={{ padding: '4px 12px', borderRadius: '6px', border: 'none', fontSize: '11px', fontWeight: 600, cursor: 'pointer', background: view === 'calendar' ? 'white' : 'transparent', color: view === 'calendar' ? '#2357A3' : '#888', boxShadow: view === 'calendar' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>Calendar</button>
            </div>
          </div>

          {view === 'list' && (
            <div>
              {upcomingShifts.length === 0 && todayTasks.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '13px' }}>No upcoming shifts</div>
              ) : [...upcomingShifts].map(shift => (
                <div key={shift.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ fontSize: '13px', color: '#333', fontWeight: 500 }}>{formatDate(shift.shift_date)}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{shift.start_time} – {shift.end_time}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <button onClick={() => setCalMonth(new Date(year, month - 1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '14px' }}>‹</button>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1a1a1a' }}>{monthName}</div>
                <button onClick={() => setCalMonth(new Date(year, month + 1, 1))} style={{ background: 'none', border: '1px solid #ddd', borderRadius: '6px', padding: '3px 10px', cursor: 'pointer', fontSize: '14px' }}>›</button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: '4px' }}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: '#888', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} style={{ minHeight: '44px' }} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dayShifts = getShiftsForDay(year, month, day)
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const isToday = dateStr === today
                  return (
                    <div key={day} style={{ minHeight: '44px', borderRadius: '6px', padding: '4px', background: dayShifts.length > 0 ? '#EEF4FF' : 'transparent', border: isToday ? '1.5px solid #2357A3' : '1px solid transparent' }}>
                      <div style={{ fontSize: '11px', fontWeight: isToday ? 700 : 400, color: isToday ? '#2357A3' : '#666', marginBottom: '2px' }}>{day}</div>
                      {dayShifts.map(s => (
                        <div key={s.id} style={{ background: '#2357A3', color: 'white', borderRadius: '3px', padding: '1px 4px', fontSize: '9px', fontWeight: 600, marginBottom: '1px' }}>
                          {s.start_time?.slice(0,5)}{s.end_time ? ` -${s.end_time.slice(0,5)}` : ''}
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
