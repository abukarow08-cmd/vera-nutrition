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
    const { data: s } = await supabase.from('schedules').select('*').gte('shift_date', today).eq('assigned_to', userId).order('shift_date').limit(7)
    setShifts(s || [])
    setLoading(false)
  }

  async function toggleTask(id: string, status: string) {
    await supabase.from('tasks').update({ status: status === 'done' ? 'pending' : 'done' }).eq('id', id)
    fetchData()
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const todayShifts = shifts.filter(s => s.shift_date === new Date().toISOString().slice(0, 10))
  const upcomingShifts = shifts.filter(s => s.shift_date > new Date().toISOString().slice(0, 10))
  const staffName = user?.email?.split('@')[0] || 'Staff'

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
          <div style={{fontSize:'22px',fontWeight:700,color:'#142F5C'}}>Salaam, {staffName} 👋</div>
          <div style={{fontSize:'13px',color:'#888',marginTop:'4px'}}>Here's your work for today. Stay focused!</div>
        </div>

        {/* Today's Shift */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',marginBottom:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'14px'}}>TODAY'S SHIFT</div>
          {todayShifts.length === 0 ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>No shift scheduled for today</div>
          ) : todayShifts.map(shift => (
            <div key={shift.id} style={{display:'flex',alignItems:'center',gap:'16px',padding:'10px',background:'#E8F1F9',borderRadius:'8px'}}>
              <div style={{fontSize:'24px'}}>🕐</div>
              <div>
                <div style={{fontSize:'14px',fontWeight:600,color:'#142F5C'}}>{shift.start_time} – {shift.end_time}</div>
                <div style={{fontSize:'12px',color:'#666'}}>{shift.notes}</div>
              </div>
            </div>
          ))}
        </div>

        {/* My Tasks */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',marginBottom:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'14px'}}>MY TASKS</div>
          {loading ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>Loading...</div>
          ) : tasks.length === 0 ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>No pending tasks</div>
          ) : tasks.map(task => (
            <div key={task.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
              <input type="checkbox" checked={task.status==='done'} onChange={()=>toggleTask(task.id, task.status)} style={{width:'16px',height:'16px',cursor:'pointer'}} />
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',color:'#333',fontWeight:500}}>{task.title}</div>
                {task.due_date && <div style={{fontSize:'11px',color: task.due_date < new Date().toISOString() ? '#dc2626' : '#888'}}>Due: {formatDate(task.due_date)}</div>}
              </div>
              <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'4px',background:task.priority==='high'?'#fee2e2':task.priority==='medium'?'#fef9c3':'#f0fdf4',color:task.priority==='high'?'#dc2626':task.priority==='medium'?'#b45309':'#16a34a',fontWeight:600}}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>

        {/* Upcoming Shifts */}
        <div style={{background:'white',borderRadius:'10px',padding:'20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontSize:'12px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'14px'}}>UPCOMING SHIFTS</div>
          {upcomingShifts.length === 0 ? (
            <div style={{color:'#aaa',fontSize:'13px'}}>No upcoming shifts</div>
          ) : upcomingShifts.map(shift => (
            <div key={shift.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
              <div style={{fontSize:'13px',color:'#333',fontWeight:500}}>{formatDate(shift.shift_date)}</div>
              <div style={{fontSize:'12px',color:'#666'}}>{shift.start_time} – {shift.end_time}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
