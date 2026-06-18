'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const priorityBg = (p: string) => p === 'high' ? '#fee2e2' : p === 'medium' ? '#fef9c3' : '#f0fdf4'
const priorityColor = (p: string) => p === 'high' ? '#dc2626' : p === 'medium' ? '#b45309' : '#16a34a'
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' as const }

export default function StaffProfile() {
  const router = useRouter()
  const params = useParams()
  const staffId = params.id as string

  const [member, setMember] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [taskTitle, setTaskTitle] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low'|'medium'|'high'>('medium')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskLoading, setTaskLoading] = useState(false)

  // Schedule form
  const [showShiftForm, setShowShiftForm] = useState(false)
  const [shiftDate, setShiftDate] = useState('')
  const [shiftStart, setShiftStart] = useState('')
  const [shiftEnd, setShiftEnd] = useState('')
  const [shiftNote, setShiftNote] = useState('')
  const [shiftLoading, setShiftLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchAll()
  }, [staffId])

  async function fetchAll() {
    setLoading(true)
    const { data: m } = await supabase.from('staff').select('*').eq('id', staffId).single()
    setMember(m)

    const { data: t } = await supabase.from('tasks').select('*').eq('assigned_to', staffId).order('created_at', { ascending: false })
    setTasks(t || [])

    const { data: s } = await supabase.from('schedules').select('*').eq('assigned_to', staffId).order('date', { ascending: true })
    setSchedules(s || [])

    setLoading(false)
  }

  async function saveTask() {
    if (!taskTitle) return
    setTaskLoading(true)
    await supabase.from('tasks').insert({ title: taskTitle, priority: taskPriority, due_date: taskDueDate || null, assigned_to: staffId, status: 'pending' })
    setTaskTitle(''); setTaskPriority('medium'); setTaskDueDate('')
    setShowTaskForm(false); setTaskLoading(false)
    fetchAll()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchAll()
  }

  async function toggleTask(t: any) {
    await supabase.from('tasks').update({ status: t.status === 'done' ? 'pending' : 'done' }).eq('id', t.id)
    fetchAll()
  }

  async function saveShift() {
    if (!shiftDate || !shiftStart || !shiftEnd) return
    setShiftLoading(true)
    await supabase.from('schedules').insert({ date: shiftDate, start_time: shiftStart, end_time: shiftEnd, notes: shiftNote || null, assigned_to: staffId })
    setShiftDate(''); setShiftStart(''); setShiftEnd(''); setShiftNote('')
    setShowShiftForm(false); setShiftLoading(false)
    fetchAll()
  }

  async function deleteShift(id: string) {
    if (!confirm('Delete this shift?')) return
    await supabase.from('schedules').delete().eq('id', id)
    fetchAll()
  }

  if (loading) return <div style={{padding:'40px',textAlign:'center',color:'#888'}}>Loading...</div>
  if (!member) return <div style={{padding:'40px',textAlign:'center',color:'#888'}}>Staff member not found.</div>

  const roleColor = (r: string) => r === 'owner' ? '#7c3aed' : r === 'manager' ? '#2357A3' : '#16a34a'

  return (
    <div style={{padding:'24px',maxWidth:'860px',margin:'0 auto'}}>

      {/* Back */}
      <button onClick={() => router.push('/dashboard/staff')} style={{marginBottom:'20px',background:'none',border:'none',color:'#2357A3',fontSize:'13px',cursor:'pointer',display:'flex',alignItems:'center',gap:'4px'}}>
        ← Back to Staff
      </button>

      {/* Profile Card */}
      <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'12px',padding:'24px',marginBottom:'24px',display:'flex',alignItems:'center',gap:'20px'}}>
        <div style={{width:'64px',height:'64px',borderRadius:'50%',background:'#2357A3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:700,color:'white',flexShrink:0}}>
          {member.full_name?.charAt(0).toUpperCase()}
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:'20px',fontWeight:700,color:'#1a1a1a',marginBottom:'4px'}}>{member.full_name}</div>
          <div style={{fontSize:'13px',color:'#888',marginBottom:'8px'}}>{member.email} {member.phone ? `· ${member.phone}` : ''}</div>
          <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
            <span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background:roleColor(member.role),color:'white',fontWeight:700}}>{member.role}</span>
            {member.salary && <span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background:'#f0fdf4',color:'#16a34a',fontWeight:600}}>${Number(member.salary).toFixed(0)}/mo</span>}
            {member.start_date && <span style={{fontSize:'11px',padding:'2px 10px',borderRadius:'20px',background:'#f8f8f8',color:'#888'}}>Started {new Date(member.start_date).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'12px',padding:'20px',marginBottom:'24px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'14px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>TASKS</div>
          <button onClick={() => setShowTaskForm(!showTaskForm)} style={{background:'#2357A3',color:'white',border:'none',padding:'6px 14px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
            + Add Task
          </button>
        </div>

        {showTaskForm && (
          <div style={{background:'#f8f8f8',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
            <div style={{marginBottom:'8px'}}>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>TASK TITLE</div>
              <input value={taskTitle} onChange={e => setTaskTitle(e.target.value)} placeholder="e.g. Pack shipment" style={inputStyle} />
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <div>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRIORITY</div>
                <select value={taskPriority} onChange={e => setTaskPriority(e.target.value as any)} style={inputStyle}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DUE DATE</div>
                <input type="date" value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={saveTask} disabled={taskLoading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                {taskLoading ? 'Saving...' : 'Save Task'}
              </button>
              <button onClick={() => setShowTaskForm(false)} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        )}

        {tasks.length === 0 && <div style={{textAlign:'center',color:'#888',fontSize:'13px',padding:'20px 0'}}>No tasks assigned yet.</div>}
        {tasks.map(t => (
          <div key={t.id} style={{display:'flex',alignItems:'center',gap:'10px',padding:'10px 0',borderBottom:'0.5px solid #eee'}}>
            <input type="checkbox" checked={t.status === 'done'} onChange={() => toggleTask(t)} style={{width:'16px',height:'16px',cursor:'pointer',flexShrink:0}} />
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',color: t.status === 'done' ? '#aaa' : '#1a1a1a',textDecoration: t.status === 'done' ? 'line-through' : 'none',fontWeight:500}}>{t.title}</div>
              {t.due_date && <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>Due {new Date(t.due_date).toLocaleDateString()}</div>}
            </div>
            <span style={{fontSize:'11px',padding:'2px 8px',borderRadius:'20px',background:priorityBg(t.priority),color:priorityColor(t.priority),fontWeight:600}}>{t.priority}</span>
            <button onClick={() => deleteTask(t.id)} style={{fontSize:'11px',color:'#A3202D',background:'none',border:'none',cursor:'pointer'}}>Delete</button>
          </div>
        ))}
      </div>

      {/* Schedule Section */}
      <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'12px',padding:'20px'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
          <div style={{fontSize:'14px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>SCHEDULE</div>
          <button onClick={() => setShowShiftForm(!showShiftForm)} style={{background:'#2357A3',color:'white',border:'none',padding:'6px 14px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
            + Add Shift
          </button>
        </div>

        {showShiftForm && (
          <div style={{background:'#f8f8f8',borderRadius:'8px',padding:'16px',marginBottom:'16px'}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'8px',marginBottom:'8px'}}>
              <div>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DATE</div>
                <input type="date" value={shiftDate} onChange={e => setShiftDate(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>START TIME</div>
                <input type="time" value={shiftStart} onChange={e => setShiftStart(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>END TIME</div>
                <input type="time" value={shiftEnd} onChange={e => setShiftEnd(e.target.value)} style={inputStyle} />
              </div>
            </div>
            <div style={{marginBottom:'8px'}}>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>NOTES (optional)</div>
              <input value={shiftNote} onChange={e => setShiftNote(e.target.value)} placeholder="e.g. Morning shift" style={inputStyle} />
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={saveShift} disabled={shiftLoading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                {shiftLoading ? 'Saving...' : 'Save Shift'}
              </button>
              <button onClick={() => setShowShiftForm(false)} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        )}

        {schedules.length === 0 && <div style={{textAlign:'center',color:'#888',fontSize:'13px',padding:'20px 0'}}>No shifts scheduled yet.</div>}
        {schedules.map(s => (
          <div key={s.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderBottom:'0.5px solid #eee'}}>
            <div style={{width:'40px',height:'40px',borderRadius:'8px',background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:'18px'}}>📅</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:'13px',fontWeight:600,color:'#1a1a1a'}}>{new Date(s.date).toLocaleDateString('en-GB', {weekday:'short',day:'numeric',month:'short'})}</div>
              <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{s.start_time} – {s.end_time}{s.notes ? ` · ${s.notes}` : ''}</div>
            </div>
            <button onClick={() => deleteShift(s.id)} style={{fontSize:'11px',color:'#A3202D',background:'none',border:'none',cursor:'pointer'}}>Delete</button>
          </div>
        ))}
      </div>

    </div>
  )
}
