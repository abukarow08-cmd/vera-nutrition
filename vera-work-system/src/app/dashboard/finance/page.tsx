'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Finance() {
  const router = useRouter()
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [desc, setDesc] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'in'|'out'>('in')
  const [category, setCategory] = useState('')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchEntries()
  }, [])

  async function fetchEntries() {
    const { data } = await supabase.from('finance').select('*').order('created_at', { ascending: false })
    if (data) setEntries(data)
  }

  async function saveEntry() {
    if (!desc || !amount) return
    setLoading(true)
    if (editId) {
      await supabase.from('finance').update({ description: desc, amount: parseFloat(amount), type, category }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('finance').insert({ description: desc, amount: parseFloat(amount), type, category })
    }
    setDesc(''); setAmount(''); setCategory(''); setShowForm(false); setLoading(false)
    fetchEntries()
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this entry?')) return
    await supabase.from('finance').delete().eq('id', id)
    fetchEntries()
  }

  function startEdit(e: any) {
    setEditId(e.id); setDesc(e.description); setAmount(String(e.amount)); setType(e.type); setCategory(e.category||'')
    setShowForm(true)
  }

  const totalIn = entries.filter(e=>e.type==='in').reduce((s,e)=>s+Number(e.amount),0)
  const totalOut = entries.filter(e=>e.type==='out').reduce((s,e)=>s+Number(e.amount),0)
  const profit = totalIn - totalOut
  const inp = {width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',color:'#1a1a1a',background:'#fff',boxSizing:'border-box' as any}

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance',''],['Tasks','/dashboard/tasks'],['Schedule','/dashboard/schedule'],['Inventory','/dashboard/inventory'],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>path&&router.push(path)} style={{padding:'10px 14px',color:path===''?'white':'rgba(255,255,255,0.5)',background:path===''?'rgba(255,255,255,0.1)':'transparent',borderLeft:path===''?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>{label}</div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <button onClick={()=>router.push('/dashboard')} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:0}}>← Dashboard</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Finance</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setDesc('');setAmount('');setType('in');setCategory('')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Entry</button>
        </div>
        <div style={{flex:1,padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Total In</div><div style={{fontSize:'22px',fontWeight:700,color:'#0F6E56'}}>${totalIn.toFixed(2)}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Total Out</div><div style={{fontSize:'22px',fontWeight:700,color:'#A32D2D'}}>${totalOut.toFixed(2)}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Net Profit</div><div style={{fontSize:'22px',fontWeight:700,color:profit>=0?'#142F5C':'#A32D2D'}}>${profit.toFixed(2)}</div></div>
          </div>
          {showForm && (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>{editId?'EDIT ENTRY':'NEW ENTRY'}</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DESCRIPTION</div><input value={desc} onChange={e=>setDesc(e.target.value)} placeholder="e.g. Product sale" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>AMOUNT (USD)</div><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>TYPE</div><select value={type} onChange={e=>setType(e.target.value as any)} style={inp}><option value="in">Money In</option><option value="out">Money Out</option></select></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>CATEGORY</div><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="e.g. Sales" style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={saveEntry} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update':'Save Entry'}</button>
                <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>ALL ENTRIES</div>
            {entries.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No entries yet.</div>}
            {entries.map(e=>(
              <div key={e.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'0.5px solid #eee',gap:'12px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:'#1a1a1a',fontWeight:500}}>{e.description}</div>
                  <div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>{e.category||'—'} · {new Date(e.created_at).toLocaleDateString()}</div>
                </div>
                <div style={{fontSize:'14px',fontWeight:700,color:e.type==='in'?'#0F6E56':'#A32D2D'}}>{e.type==='in'?'+ ':'– '}${Number(e.amount).toFixed(2)}</div>
                <button onClick={()=>startEdit(e)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
                <button onClick={()=>deleteEntry(e.id)} style={{fontSize:'11px',color:'#A32D2D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
