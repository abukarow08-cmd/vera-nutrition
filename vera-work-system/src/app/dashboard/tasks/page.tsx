'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Tasks() {
  const router = useRouter()
  const [tasks, setTasks] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<'low'|'medium'|'high'>('medium')
  const [dueDate, setDueDate] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchTasks()
  }, [])

  async function fetchTasks() {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (data) setTasks(data)
  }

  async function saveTask() {
    if (!title) return
    setLoading(true)
    if (editId) {
      await supabase.from('tasks').update({ title, priority, due_date: dueDate||null }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('tasks').insert({ title, priority, due_date: dueDate||null, status: 'pending' })
    }
    setTitle(''); setPriority('medium'); setDueDate(''); setShowForm(false); setLoading(false)
    fetchTasks()
  }

  async function deleteTask(id: string) {
    if (!confirm('Delete this task?')) return
    await supabase.from('tasks').delete().eq('id', id)
    fetchTasks()
  }

  async function toggleStatus(task: any) {
    await supabase.from('tasks').update({ status: task.status==='done'?'pending':'done' }).eq('id', task.id)
    fetchTasks()
  }

  function startEdit(task: any) {
    setEditId(task.id); setTitle(task.title); setPriority(task.priority); setDueDate(task.due_date?.split('T')[0]||'')
    setShowForm(true)
  }

  const inputStyle = {width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',color:'#1a1a1a',background:'#fff',boxSizing:'border-box' as any}
  const priorityColor = (p:string) => p==='high'?'#A32D2D':p==='medium'?'#854F0B':'#3B6D11'
  const priorityBg = (p:string) => p==='high'?'#FCEBEB':p==='medium'?'#FAEEDA':'#EAF3DE'
  const pending = tasks.filter(t=>t.status==='pending')
  const done = tasks.filter(t=>t.status==='done')

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance','/dashboard/finance'],['Tasks',''],['Schedule','/dashboard/schedule'],['Inventory','/dashboard/inventory'],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>path&&router.push(path)} style={{padding:'10px 14px',color:path===''?'white':'rgba(255,255,255,0.5)',background:path===''?'rgba(255,255,255,0.1)':'transparent',borderLeft:path===''?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <button onClick={()=>router.push('/dashboard')} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:0}}>← Dashboard</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Tasks</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setTitle('');setPriority('medium');setDueDate('')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Task</button>
        </div>
        <div style={{flex:1,padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Total</div><div style={{fontSize:'22px',fontWeight:700,color:'#142F5C'}}>{tasks.length}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Pending</div><div style={{fontSize:'22px',fontWeight:700,color:'#854F0B'}}>{pending.length}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Done</div><div style={{fontSize:'22px',fontWeight:700,color:'#0F6E56'}}>{done.length}</div></div>
          </div>
          {showForm && (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>{editId?'EDIT TASK':'NEW TASK'}</div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>TASK TITLE</div><input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Restock creatine shelf" style={inputStyle}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRIORITY</div><select value={priority} onChange={e=>setPriority(e.target.value as any)} style={inputStyle}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DUE DATE</div><input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={inputStyle}/></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={saveTask} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update Task':'Save Task'}</button>
                <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>ALL TASKS</div>
            {tasks.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No tasks yet.</div>}
            {tasks.map(t=>(
              <div key={t.id} style={{display:'flex',alignItems:'center',gap:'12px',padding:'12px 16px',borderBottom:'0.5px solid #eee'}}>
                <div onClick={()=>toggleStatus(t)} style={{width:'18px',height:'18px',borderRadius:'4px',border:t.status==='done'?'none':'1.5px solid #ddd',background:t.status==='done'?'#2357A3':'white',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0}}>
                  {t.status==='done'&&<span style={{color:'white',fontSize:'11px'}}>✓</span>}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:t.status==='done'?'#aaa':'#1a1a1a',fontWeight:500,textDecoration:t.status==='done'?'line-through':'none'}}>{t.title}</div>
                  {t.due_date&&<div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>Due: {new Date(t.due_date).toLocaleDateString()}</div>}
                </div>
                <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',fontWeight:700,background:priorityBg(t.priority),color:priorityColor(t.priority)}}>{t.priority}</span>
                <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',fontWeight:700,background:t.status==='done'?'#EAF3DE':'#FAEEDA',color:t.status==='done'?'#3B6D11':'#854F0B'}}>{t.status}</span>
                <button onClick={()=>startEdit(t)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
                <button onClick={()=>deleteTask(t.id)} style={{fontSize:'11px',color:'#A32D2D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
