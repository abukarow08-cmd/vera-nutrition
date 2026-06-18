'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StaffDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [shifts, setShifts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'list'|'calendar'>('list')
  const [calMonth, setCalMonth] = useState(new Date())

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      const role = data.user.user_metadata?.role
      if (role === 'owner' || role === 'manager') { router.push('/dashboard'); return }
      setUser(data.user)
      fetchData(data.user.id)
    })
  }, [])

  async function fetchData(userId: string) {
    const today = new Date().toISOString().slice(0, 10)
    const { data: t } = await supabase.from('tasks').select('*').eq('status', 'pending').eq('assigned_to', userId).order('due_date')
    setTasks(t || [])
    const { data: s } = await supabase.from('schedules').select('*').eq('assigned_to', userId).order('shift_date')
    setShifts(s || [])
    setLoading(false)
  }

  async function toggleTask(id: string, status: string) {
    await supabase.from('tasks').update({ status: status === 'done' ? 'pending' : 'done' }).eq('id', id)
    fetchData(user?.id || '')
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const today = new Date().toISOString().slice(0, 10)
  const todayShifts = shifts.filter(s => s.shift_date === today)
  const upcomingShifts = shifts.filter(s => s.shift_date > today)
  const staffName = user?.email?.split('@')[0] || 'Staff'

  // Calendar helpers
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

  if (loading) return <div style={{padding:'40px',textAlign:'center',color:'#888'}}>Loading...</div>

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f5',fontFamily:'Inter,sans-serif'}}>
      {/* Header */}
      <div style={{background:'#142F5C',padding:'16px 24px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'22px',fontWeight:900,color:'white'}}>VERA
          <div style={{fontSize:'7px',letterSpacing:'4px',color:'rgba(255,255,255,0.6)',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:'16px'}}>
          <span style={{color:'white',fontSize:'13px'}}>{user?.email}</span>
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} style={{background:'#F5A623',color:'white',border:'none',borderRadius:'6px',padding:'6px 14px',fontSize:'13px',cursor:'pointer',fontWeight:600}}>Sign Out</button>
        </div>
      </div>

      <div style={{padding:'24px',maxWidth:'800px',margin:'0 auto'}}>
        {/* Greeting */}
        <div style={{marginBottom:'24px'}}>
          <div style={{fontSize:'22px',fontWeight:700,color:'#1a1a1a'}}>Salaam, {staffName} 👋</div>
          <div style={{fontSize:'13px',color:'#888',marginTop:'4px'}}>Here's your work for today. Stay focused!</div>
        </div>

        {/* Today's shift */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'14px'}}>TODAY'S SHIFT</div>
          {todayShifts.length === 0 ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>No shift scheduled for today</div>
          ) : todayShifts.map(shift => (
            <div key={shift.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
              <div style={{fontSize:'13px',color:'#333',fontWeight:500}}>{formatDate(shift.shift_date)}</div>
              <div style={{fontSize:'12px',color:'#666'}}>{shift.start_time} – {shift.end_time}</div>
            </div>
          ))}
        </div>

        {/* My Tasks */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',marginBottom:'16px'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'14px'}}>MY TASKS</div>
          {tasks.length === 0 ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>No pending tasks</div>
          ) : tasks.map(task => (
            <div key={task.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'8px 0',borderBottom:'1px solid #f5f5f5'}}>
              <input type="checkbox" checked={task.status==='done'} onChange={() => toggleTask(task.id, task.status)} style={{width:'16px',height:'16px',cursor:'pointer',flexShrink:0}} />
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',color:task.status==='done'?'#aaa':'#1a1a1a',textDecoration:task.status==='done'?'line-through':'none'}}>{task.title}</div>
                {task.due_date && <div style={{fontSize:'11px',color: new Date(task.due_date) < new Date() ? '#ef4444' : '#888',marginTop:'2px'}}>Due: {formatDate(task.due_date)}</div>}
              </div>
              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:task.priority==='high'?'#fee2e2':task.priority==='medium'?'#fef9c3':'#f0fdf4',color:task.priority==='high'?'#dc2626':task.priority==='medium'?'#b45309':'#16a34a',fontWeight:600}}>{task.priority}</span>
            </div>
          ))}
        </div>

        {/* Shifts — List/Calendar toggle */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>MY SCHEDULE</div>
            <div style={{display:'flex',background:'#f0f0f0',borderRadius:'8px',padding:'3px'}}>
              <button onClick={() => setView('list')} style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:600,cursor:'pointer',background:view==='list'?'white':'transparent',color:view==='list'?'#2357A3':'#888',boxShadow:view==='list'?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>List</button>
              <button onClick={() => setView('calendar')} style={{padding:'4px 12px',borderRadius:'6px',border:'none',fontSize:'11px',fontWeight:600,cursor:'pointer',background:view==='calendar'?'white':'transparent',color:view==='calendar'?'#2357A3':'#888',boxShadow:view==='calendar'?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>Calendar</button>
            </div>
          </div>

          {view === 'list' && (
            <div>
              {upcomingShifts.length === 0 && todayShifts.length === 0 ? (
                <div style={{color:'#aaa',fontSize:'13px'}}>No upcoming shifts</div>
              ) : [...todayShifts, ...upcomingShifts].map(shift => (
                <div key={shift.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
                  <div style={{fontSize:'13px',color:'#333',fontWeight:500}}>{formatDate(shift.shift_date)}</div>
                  <div style={{fontSize:'12px',color:'#666'}}>{shift.start_time} – {shift.end_time}</div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <div>
              {/* Month nav */}
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'12px'}}>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()-1, 1))} style={{background:'none',border:'1px solid #ddd',borderRadius:'6px',padding:'3px 10px',cursor:'pointer',fontSize:'14px'}}>‹</button>
                <div style={{fontSize:'13px',fontWeight:700,color:'#1a1a1a'}}>{monthName}</div>
                <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth()+1, 1))} style={{background:'none',border:'1px solid #ddd',borderRadius:'6px',padding:'3px 10px',cursor:'pointer',fontSize:'14px'}}>›</button>
              </div>
              {/* Day headers */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',marginBottom:'4px'}}>
                {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                  <div key={d} style={{textAlign:'center',fontSize:'10px',fontWeight:700,color:'#888',padding:'4px 0'}}>{d}</div>
                ))}
              </div>
              {/* Grid */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
                {Array.from({length: firstDay}).map((_,i) => <div key={`e${i}`} style={{minHeight:'44px'}} />)}
                {Array.from({length: daysInMonth}).map((_,i) => {
                  const day = i + 1
                  const dayShifts = getShiftsForDay(year, month, day)
                  const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                  const isToday = dateStr === today
                  return (
                    <div key={day} style={{minHeight:'44px',borderRadius:'6px',padding:'4px',background:dayShifts.length>0?'#EEF4FF':isToday?'#f0f9ff':'transparent',border:isToday?'1.5px solid #2357A3':'1px solid transparent'}}>
                      <div style={{fontSize:'11px',fontWeight:isToday?700:400,color:isToday?'#2357A3':'#666',marginBottom:'2px'}}>{day}</div>
                      {dayShifts.map(s => (
                        <div key={s.id} style={{background:'#2357A3',color:'white',borderRadius:'3px',padding:'1px 4px',fontSize:'9px',fontWeight:600,marginBottom:'1px'}}>
                          {s.start_time?.slice(0,5)}
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
