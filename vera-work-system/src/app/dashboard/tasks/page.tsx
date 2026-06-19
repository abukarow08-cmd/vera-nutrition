'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const priorityBg = (p: string) => p === 'high' ? '#fee2e2' : p === 'medium' ? '#fef9c3' : '#f0fdf4'
const priorityColor = (p: string) => p === 'high' ? '#dc2626' : p === 'medium' ? '#b45309' : '#16a34a'
const inputStyle = { width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', boxSizing: 'border-box' as const }

export default function Tasks() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchTasks()
    fetchStaff()
  }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('name')
    if (data) setStaffList(data)
  }

  async function saveTask() {
    if (!title) return
    setLoading(true)
    const payload = { title, priority, due_date: dueDate||null, assigned_to: assignedTo||null }
    if (editId) {
      await supabase.from('tasks').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('tasks').insert({ ...payload, status: 'pending' })
    }
    setTitle(''); setPriority('medium'); setDueDate(''); setAssignedTo(''); setShowForm(false); setLoading(false)
    fetchTasks()
  }

  async function toggleStatus(t: any) {
    await supabase.from('tasks').update({ status: t.status === 'done' ? 'pending' : 'done' }).eq('id', t.id)
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  function startEdit(t: any) {
    setEditId(t.id); setTitle(t.title); setPriority(t.priority); setDueDate(t.due_date?.slice(0,10)||''); setAssignedTo(t.assigned_to||''); setShowForm(true)
  }

  const [taskFilter, setTaskFilter] = useState<'all'|'pending'|'done'>('all')
  const pending = tasks.filter(t => t.status === 'pending')
  const done = tasks.filter(t => t.status === 'done')

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', background:'#F0F4F8'}}>
      <div onClick={()=>router.push('/dashboard')} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:'8px 20px'}}>← Dashboard</div>
      <div style={{flex:1, padding:'20px'}}>
        <div style={{background:'white', border:'0.5px solid #ddd', borderRadius:'10px', padding:'0 20px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
          <div style={{fontSize:'12px', fontWeight:700, color:'#142F5C', letterSpacing:'1px'}}>TASKS</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setTitle('');setPriority('medium');setDueDate('');setAssignedTo('')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Task</button>
        </div>

        <div style={{display:'flex',gap:'12px',marginBottom:'16px'}}>
          {[['Total',tasks.length,'#142F5C'],['Pending',pending.length,'#F5A623'],['Done',done.length,'#0F6E56']].map(([label,val,color])=>(
            <div key={label as string} style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px',flex:1}}>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>{label}</div>
              <div style={{fontSize:'22px',fontWeight:700,color:color as string}}>{val}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>{editId?'EDIT TASK':'NEW TASK'}</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>TITLE</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Restock creatine shelf" style={inputStyle}/></div>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRIORITY</div>
                <select value={priority} onChange={e=>setPriority(e.target.value as any)} style={inputStyle}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DUE DATE</div><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={inputStyle}/></div>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>ASSIGN TO</div>
              <select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} style={inputStyle}>
                <option value="">— Unassigned —</option>
                {staffList.map(s => <option key={s.id} value={s.user_id||''}>{s.name} ({s.role})</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={saveTask} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update Task':'Save Task'}</button>
              <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        )}
          <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
            {(['all','pending','done'] as const).map(f => (
              <button key={f} onClick={() => setTaskFilter(f)} style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:600,background:taskFilter===f?'#2357A3':'#E8F1F9',color:taskFilter===f?'white':'#2357A3'}}>
                {f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

        <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>ALL TASKS</div>
          {tasks.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No tasks yet.</div>}
          {tasks.filter(t=>taskFilter==='all'||t.status===taskFilter).map(t=>(
            <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:'0.5px solid #eee'}}>
              <div onClick={()=>toggleStatus(t)} style={{width:'18px',height:'18px',borderRadius:'4px',border:t.status==='done'?'none':'1.5px solid #ddd',background:t.status==='done'?'#2357A3':'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                {t.status==='done'&&<span style={{color:'white',fontSize:'11px'}}>✓</span>}
              </div>
              <div style={{flex:1}}>
                <div style={{fontSize:'13px',color:t.status==='done'?'#aaa':'#1a1a1a',fontWeight:500,textDecoration:t.status==='done'?'line-through':'none'}}>{t.title}</div>
                <div style={{display:'flex',gap:'8px',marginTop:'2px',alignItems:'center'}}>
                  {t.due_date&&<div style={{fontSize:'10px',color:'#888'}}>Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                  {t.assigned_to && <div style={{fontSize:'10px',color:'#2357A3'}}>→ {staffList.find(s=>s.user_id===t.assigned_to)?.name || 'Assigned'}</div>}
                </div>
              </div>
              <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',fontWeight:700,background:priorityBg(t.priority),color:priorityColor(t.priority)}}>{t.priority}</span>
              <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',fontWeight:700,background:t.status==='done'?'#EAF3DE':'#FEF3DE',color:t.status==='done'?'#3B6011':'#854F0B'}}>{t.status}</span>
              <button onClick={()=>startEdit(t)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
              <button onClick={()=>deleteTask(t.id)} style={{fontSize:'11px',color:'#A32D2D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
