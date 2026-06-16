'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Shipping() {
  const router = useRouter()
  const [shipments, setShipments] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [destination, setDestination] = useState('')
  const [products, setProducts] = useState('')
  const [cost, setCost] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchShipments()
  }, [])

  async function fetchShipments() {
    const { data } = await supabase.from('shipments').select('*').order('created_at', { ascending: false })
    if (data) setShipments(data)
  }

  async function addShipment() {
    if (!destination) return
    setLoading(true)
    await supabase.from('shipments').insert({ destination, products, cost: cost?parseFloat(cost):null, status: 'pending' })
    setDestination(''); setProducts(''); setCost(''); setShowForm(false); setLoading(false)
    fetchShipments()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('shipments').update({ status, shipped_at: status==='shipped'?new Date().toISOString():null }).eq('id', id)
    fetchShipments()
  }

  const inputStyle = {width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',color:'#1a1a1a',background:'#fff',boxSizing:'border-box' as any}
  const statusColor = (s:string) => s==='delivered'?'#3B6D11':s==='shipped'?'#2357A3':'#854F0B'
  const statusBg = (s:string) => s==='delivered'?'#EAF3DE':s==='shipped'?'#E8F1F9':'#FAEEDA'

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance','/dashboard/finance'],['Tasks','/dashboard/tasks'],['Schedule','/dashboard/schedule'],['Inventory','/dashboard/inventory'],['Shipping',''],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
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
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Shipping</div>
          <button onClick={()=>setShowForm(!showForm)} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ New Shipment</button>
        </div>

        <div style={{flex:1,padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
            {[['Pending',shipments.filter(s=>s.status==='pending').length,'#854F0B'],['Shipped',shipments.filter(s=>s.status==='shipped').length,'#2357A3'],['Delivered',shipments.filter(s=>s.status==='delivered').length,'#0F6E56']].map(([label,val,color])=>(
              <div key={label as string} style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>{label}</div>
                <div style={{fontSize:'22px',fontWeight:700,color:color as string}}>{val}</div>
              </div>
            ))}
          </div>

          {showForm && (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>NEW SHIPMENT</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div>
                  <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>DESTINATION</div>
                  <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Nairobi, Kenya" style={inputStyle}/>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRODUCTS</div>
                  <input value={products} onChange={e=>setProducts(e.target.value)} placeholder="e.g. Collagen x100" style={inputStyle}/>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>SHIPPING COST (USD)</div>
                  <input type="number" value={cost} onChange={e=>setCost(e.target.value)} placeholder="0.00" style={inputStyle}/>
                </div>
              </div>
              <button onClick={addShipment} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>
                {loading?'Saving...':'Save Shipment'}
              </button>
            </div>
          )}

          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>ALL SHIPMENTS</div>
            {shipments.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No shipments yet.</div>}
            {shipments.map(s=>(
              <div key={s.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'0.5px solid #eee',gap:'12px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:'#1a1a1a',fontWeight:500}}>{s.destination}</div>
                  <div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>{s.products||'—'} {s.cost?`· $${Number(s.cost).toFixed(2)}`:''}</div>
                  <div style={{fontSize:'10px',color:'#888'}}>{new Date(s.created_at).toLocaleDateString()}</div>
                </div>
                <span style={{fontSize:'9px',padding:'2px 10px',borderRadius:'20px',fontWeight:700,background:statusBg(s.status),color:statusColor(s.status)}}>{s.status}</span>
                <select value={s.status} onChange={e=>updateStatus(s.id,e.target.value)} style={{fontSize:'11px',padding:'4px 8px',border:'1px solid #ddd',borderRadius:'6px',color:'#1a1a1a',background:'white',cursor:'pointer'}}>
                  <option value="pending">Pending</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
