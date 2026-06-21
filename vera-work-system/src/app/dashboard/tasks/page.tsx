'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const inp = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' as const }

export default function Tasks() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [staffList, setStaffList] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState('medium')
  const [dueDate, setDueDate] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)
  const [expandedTask, setExpandedTask] = useState<string|null>(null)
  const [comments, setComments] = useState<Record<string, any[]>>({})
  const [newComment, setNewComment] = useState<Record<string, string>>({})
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [profileMap, setProfileMap] = useState<Record<string,string>>({})

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else {
        setCurrentUser(data.user)
        fetchTasks()
        fetchStaff()
      }
    })
  }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('full_name')
    if (data) setStaffList(data)
    const { data: profiles } = await supabase.from('profiles').select('id, full_name')
    if (profiles) {
      const map: Record<string,string> = {}
      profiles.forEach((p: any) => { map[p.id] = p.full_name })
      setProfileMap(map)
    }
  }

  async function fetchComments(taskId: string) {
    const { data } = await supabase.from('task_comments').select('*').eq('task_id', taskId).order('created_at', { ascending: true })
    setComments(prev => ({ ...prev, [taskId]: data || [] }))
  }

  async function addComment(taskId: string) {
    const text = newComment[taskId]?.trim()
    if (!text || !currentUser) return
    await supabase.from('task_comments').insert({ task_id: taskId, staff_id: currentUser.id, comment: text })
    setNewComment(prev => ({ ...prev, [taskId]: '' }))
    fetchComments(taskId)
  }

  async function saveTask() {
    if (!title) return
    setLoading(true)
    const payload: any = { title, priority, status: 'pending' }
    if (dueDate) payload.due_date = dueDate
    if (assignedTo) payload.assigned_to = assignedTo
    if (editId) {
      await supabase.from('tasks').update(payload).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('tasks').insert({ ...payload, status: 'pending' })
    }
    setTitle(''); setPriority('medium'); setDueDate(''); setAssignedTo('')
    setShowForm(false); setLoading(false)
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

  function toggleExpand(taskId: string) {
    if (expandedTask === taskId) {
      setExpandedTask(null)
    } else {
      setExpandedTask(taskId)
      if (!comments[taskId]) fetchComments(taskId)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const [taskFilter, setTaskFilter] = useState<'all'|'pending'|'done'|'overdue'>('all')
  const pending = tasks.filter(t => t.status === 'pending')
  const done = tasks.filter(t => t.status === 'done')
  const overdue = tasks.filter(t => t.status === 'pending' && t.due_date && t.due_date.slice(0,10) < today)

  const priorityBg = (p: string) => p === 'high' ? '#FEE2E2' : p === 'medium' ? '#FEF9C3' : '#F0FDF4'
  const priorityColor = (p: string) => p === 'high' ? '#DC2626' : p === 'medium' ? '#CA8A04' : '#16A34A'

  const filteredTasks = tasks.filter(t =>
    taskFilter === 'overdue' ? (t.status === 'pending' && t.due_date && t.due_date.slice(0,10) < today) :
    taskFilter === 'all' || t.status === taskFilter
  )

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', background:'#F0F4F8'}}>
      <div style={{color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:'8px 20px',fontWeight:700,fontSize:'11px'}} onClick={()=>router.push('/dashboard')}>← Dashboard</div>
      <div style={{flex:1, padding:'20px'}}>
        <div style={{background:'white', border:'0.5px solid #ddd', borderRadius:'10px', padding:'0 20px', height:'52px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'16px'}}>
          <div style={{fontSize:'12px', fontWeight:700, color:'#142F5C', letterSpacing:'1px'}}>TASKS</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setTitle('');setPriority('medium');setDueDate('');setAssignedTo('')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Task</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
          {[{label:'Total',val:String(tasks.length),color:'#142F5C'},{label:'Pending',val:String(pending.length),color:'#F5A623'},{label:'Done',val:String(done.length),color:'#0F6E56'}].map(card=>(
            <div key={card.label} style={{background:'white',borderRadius:'10px',padding:'18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:'11px',color:'#888',marginBottom:'8px',fontWeight:500}}>{card.label}</div>
              <div style={{fontSize:'26px',fontWeight:700,color:card.color,marginBottom:'4px'}}>{card.val}</div>
            </div>
          ))}
        </div>

        {showForm && (
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
            <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',letterSpacing:'1px',marginBottom:'12px'}}>{editId?'EDIT TASK':'NEW TASK'}</div>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>TITLE</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Restock creatine shelf" style={inp}/></div>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRIORITY</div>
                <select value={priority} onChange={e=>setPriority(e.target.value as any)} style={inp}>
                  <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
                </select>
              </div>
              <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DUE DATE</div><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={inp}/></div>
            </div>
            <div style={{marginBottom:'12px'}}>
              <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>ASSIGN TO</div>
              <select value={assignedTo} onChange={e=>setAssignedTo(e.target.value)} style={inp}>
                <option value="">— Unassigned —</option>
                {staffList.map(s => <option key={s.id} value={s.user_id||''}>{s.full_name} ({s.role})</option>)}
              </select>
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <button onClick={saveTask} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update Task':'Save Task'}</button>
              <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
            </div>
          </div>
        )}

        <div style={{display:'flex',gap:'8px',marginBottom:'16px'}}>
          {(['all','pending','done','overdue'] as const).map(f => (
            <button key={f} onClick={() => setTaskFilter(f)} style={{padding:'6px 14px',borderRadius:'20px',border:'none',cursor:'pointer',fontSize:'12px',fontWeight:600,background:taskFilter===f?'#2357A3':'#E8F1F9',color:taskFilter===f?'white':'#2357A3'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
          <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>
            {taskFilter==='all'?'ALL TASKS':taskFilter==='pending'?'PENDING TASKS':taskFilter==='overdue'?'OVERDUE TASKS':'COMPLETED TASKS'}
          </div>
          {filteredTasks.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No tasks yet.</div>}
          {filteredTasks.map(t=>(
            <div key={t.id}>
              <div style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:'0.5px solid #eee',background:t.status==='pending'&&t.due_date&&t.due_date.slice(0,10)<today?'#FEF2F2':'white',cursor:'pointer'}} onClick={()=>toggleExpand(t.id)}>
                <div onClick={e=>{e.stopPropagation();toggleStatus(t)}} style={{width:'18px',height:'18px',borderRadius:'4px',border:t.status==='done'?'none':'1.5px solid #ddd',background:t.status==='done'?'#2357A3':'white',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,cursor:'pointer'}}>
                  {t.status==='done'&&<span style={{color:'white',fontSize:'11px'}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:t.status==='done'?'#aaa':'#1a1a1a',fontWeight:500,textDecoration:t.status==='done'?'line-through':'none'}}>{t.title}</div>
                  <div style={{fontSize:'11px',marginTop:'2px',display:'flex',gap:'8px',alignItems:'center'}}>
                    {t.due_date&&<div style={{color:'#888'}}>Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                    {t.assigned_to && <div style={{color:'#2357A3'}}>→ {staffList.find(s=>s.user_id===t.assigned_to)?.full_name||'Assigned'}</div>}
                  </div>
                </div>
                <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',background:priorityBg(t.priority),color:priorityColor(t.priority),fontWeight:700}}>{t.priority}</span>
                <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',background:t.status==='done'?'#EAF3DE':'#FEF3C3',color:t.status==='done'?'#3B6011':'#854F0B',fontWeight:600}}>{t.status==='done'?'Done':t.due_date&&t.due_date.slice(0,10)<today?'Late':'Pending'}</span>
                <div style={{display:'flex',gap:'4px'}} onClick={e=>e.stopPropagation()}>
                  <button onClick={()=>startEdit(t)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
                  <button onClick={()=>deleteTask(t.id)} style={{fontSize:'11px',color:'#A3202D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
                </div>
                <span style={{fontSize:'11px',color:'#888'}}>{expandedTask===t.id?'▲':'▼'}</span>
              </div>

              {expandedTask===t.id && (
                <div style={{padding:'16px',background:'#F8FAFB',borderBottom:'0.5px solid #eee'}}>
                  <div style={{fontSize:'11px',fontWeight:700,color:'#2357A3',letterSpacing:'1px',marginBottom:'10px'}}>COMMENTS</div>
                  {(comments[t.id]||[]).length===0 && <div style={{fontSize:'12px',color:'#aaa',marginBottom:'10px'}}>No comments yet. Be the first!</div>}
                  <div style={{display:'flex',flexDirection:'column',gap:'8px',marginBottom:'12px'}}>
                    {(comments[t.id]||[]).map((c:any)=>(
                      <div key={c.id} style={{background:'white',borderRadius:'8px',padding:'10px 12px',border:'1px solid #eee'}}>
                        <div style={{display:'flex',justifyContent:'space-between',marginBottom:'4px'}}>
                          <span style={{fontSize:'11px',fontWeight:700,color:'#2357A3'}}>{profileMap[c.staff_id]||'Staff'}</span>
                          <span style={{fontSize:'10px',color:'#aaa'}}>{new Date(c.created_at).toLocaleString('sv-SE',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                        </div>
                        <div style={{fontSize:'13px',color:'#333'}}>{c.comment}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{display:'flex',gap:'8px'}}>
                    <input
                      value={newComment[t.id]||''}
                      onChange={e=>setNewComment(prev=>({...prev,[t.id]:e.target.value}))}
                      onKeyDown={e=>e.key==='Enter'&&addComment(t.id)}
                      placeholder="Add a comment..."
                      style={{...inp,flex:1}}
                    />
                    <button onClick={()=>addComment(t.id)} style={{padding:'8px 16px',background:'#2357A3',color:'white',border:'none',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>Post</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
