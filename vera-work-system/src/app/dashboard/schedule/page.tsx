'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Schedule() {
  const router = useRouter()
  const [shifts, setShifts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [staffName, setStaffName] = useState('')
  const [shiftDate, setShiftDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchShifts()
  }, [])

  async function fetchShifts() {
    const { data } = await supabase.from('schedules').select('*').order('shift_date', { ascending: true })
    if (data) setShifts(data)
  }

  async function saveShift() {
    if (!staffName || !shiftDate || !startTime || !endTime) return
    setLoading(true)
    if (editId) {
      await supabase.from('schedules').update({ notes: staffName, shift_date: shiftDate, start_time: startTime, end_time: endTime }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('schedules').insert({ shift_date: shiftDate, start_time: startTime, end_time: endTime, notes: staffName })
    }
    setStaffName(''); setShiftDate(''); setStartTime(''); setEndTime('')
    setShowForm(false); setLoading(false)
    fetchShifts()
  }

  async function deleteShift(id: string) {
    if (!confirm('Delete this shift?')) return
    await supabase.from('schedules').delete().eq('id', id)
    fetchShifts()
  }

  function startEdit(s: any) {
    setEditId(s.id); setStaffName(s.notes||''); setShiftDate(s.shift_date)
    setStartTime(s.start_time?.slice(0,5)||''); setEndTime(s.end_time?.slice(0,5)||'')
    setShowForm(true)
  }

  const inp = {width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',color:'#1a1a1a',background:'#fff',boxSizing:'border-box' as any}
  const today = new Date().toISOString().split('T')[0]
  const todayShifts = shifts.filter(s=>s.shift_date===today)
  const upcomingShifts = shifts.filter(s=>s.shift_date>today)
  const pastShifts = shifts.filter(s=>s.shift_date<today)

  const ShiftRow = ({s, badge, bg, color}: any) => (
    <div style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'0.5px solid #eee',gap:'10px'}}>
      <div style={{width:'32px',height:'32px',borderRadius:'50%',background:'#E8F1F9',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:700,color:'#2357A3',flexShrink:0}}>
        {(s.notes||'?').charAt(0).toUpperCase()}
      </div>
      <div style={{flex:1}}>
        <div style={{fontSize:'13px',color:'#1a1a1a',fontWeight:500}}>{s.notes}</div>
        <div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>{new Date(s.shift_date+'T00:00:00').toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short'})} · {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}</div>
      </div>
      <span style={{fontSize:'9px',padding:'2px 10px',borderRadius:'20px',fontWeight:700,background:bg,color}}>{badge}</span>
      <button onClick={()=>startEdit(s)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
      <button onClick={()=>deleteShift(s.id)} style={{fontSize:'11px',color:'#A32D2D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
    </div>
  )

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance','/dashboard/finance'],['Tasks','/dashboard/tasks'],['Schedule',''],['Inventory','/dashboard/inventory'],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>path&&router.push(path)} style={{padding:'10px 14px',color:path===''?'white':'rgba(255,255,255,0.5)',background:path===''?'rgba(255,255,255,0.1)':'transparent',borderLeft:path===''?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>{label}</div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <button onClick={()=>router.push('/dashboard')} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:0}}>← Dashboard</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Schedule</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setStaffName('');setShiftDate('');setStartTime('');setEndTime('')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Shift</button>
        </div>
        <div style={{flex:1,padding:'20px'}}>
          {showForm && (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>{editId?'EDIT SHIFT':'NEW SHIFT'}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>STAFF NAME</div><input value={staffName} onChange={e=>setStaffName(e.target.value)} placeholder="e.g. Ahmed Nur" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DATE</div><input type="date" value={shiftDate} onChange={e=>setShiftDate(e.target.value)} style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>START TIME</div><input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>END TIME</div><input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={saveShift} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update Shift':'Save Shift'}</button>
                <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden',marginBottom:'12px'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>TODAY — {new Date().toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long'}).toUpperCase()}</div>
            {todayShifts.length===0 && <div style={{padding:'16px',textAlign:'center',color:'#888',fontSize:'12px'}}>No shifts today.</div>}
            {todayShifts.map(s=><ShiftRow key={s.id} s={s} badge="On Shift" bg="#EAF3DE" color="#3B6D11"/>)}
          </div>
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden',marginBottom:'12px'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>UPCOMING SHIFTS</div>
            {upcomingShifts.length===0 && <div style={{padding:'16px',textAlign:'center',color:'#888',fontSize:'12px'}}>No upcoming shifts.</div>}
            {upcomingShifts.map(s=><ShiftRow key={s.id} s={s} badge="Upcoming" bg="#E8F1F9" color="#2357A3"/>)}
          </div>
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>PAST SHIFTS</div>
            {pastShifts.length===0 && <div style={{padding:'16px',textAlign:'center',color:'#888',fontSize:'12px'}}>No past shifts.</div>}
            {pastShifts.map(s=><ShiftRow key={s.id} s={s} badge="Past" bg="#eee" color="#888"/>)}
          </div>
        </div>
      </div>
    </div>
  )
}
