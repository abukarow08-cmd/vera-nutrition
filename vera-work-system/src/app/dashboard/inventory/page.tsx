'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Inventory() {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [qty, setQty] = useState('')
  const [unit, setUnit] = useState('')
  const [alert, setAlert] = useState('10')
  const [editId, setEditId] = useState<string|null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (!data.user) router.push('/') })
    fetchItems()
  }, [])

  async function fetchItems() {
    const { data } = await supabase.from('inventory').select('*').order('product_name')
    if (data) setItems(data)
  }

  async function saveItem() {
    if (!name || !qty) return
    setLoading(true)
    if (editId) {
      await supabase.from('inventory').update({ product_name: name, quantity: parseInt(qty), unit, low_stock_alert: parseInt(alert)||10, updated_at: new Date().toISOString() }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('inventory').insert({ product_name: name, quantity: parseInt(qty), unit, low_stock_alert: parseInt(alert)||10 })
    }
    setName(''); setQty(''); setUnit(''); setAlert('10'); setShowForm(false); setLoading(false)
    fetchItems()
  }

  async function deleteItem(id: string) {
    if (!confirm('Delete this product?')) return
    await supabase.from('inventory').delete().eq('id', id)
    fetchItems()
  }

  async function updateQty(id: string, newQty: number) {
    await supabase.from('inventory').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', id)
    fetchItems()
  }

  function startEdit(item: any) {
    setEditId(item.id); setName(item.product_name); setQty(String(item.quantity)); setUnit(item.unit||''); setAlert(String(item.low_stock_alert||10))
    setShowForm(true)
  }

  const inp = {width:'100%',padding:'8px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'13px',color:'#1a1a1a',background:'#fff',boxSizing:'border-box' as any}
  const lowStock = items.filter(i=>i.quantity<=i.low_stock_alert)

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance','/dashboard/finance'],['Tasks','/dashboard/tasks'],['Schedule','/dashboard/schedule'],['Inventory',''],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>path&&router.push(path)} style={{padding:'10px 14px',color:path===''?'white':'rgba(255,255,255,0.5)',background:path===''?'rgba(255,255,255,0.1)':'transparent',borderLeft:path===''?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>{label}</div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <button onClick={()=>router.push('/dashboard')} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:0}}>← Dashboard</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Inventory</div>
          <button onClick={()=>{setShowForm(!showForm);setEditId(null);setName('');setQty('');setUnit('');setAlert('10')}} style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Product</button>
        </div>
        <div style={{flex:1,padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'12px',marginBottom:'16px'}}>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Total Products</div><div style={{fontSize:'22px',fontWeight:700,color:'#142F5C'}}>{items.length}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Low Stock Alerts</div><div style={{fontSize:'22px',fontWeight:700,color:lowStock.length>0?'#A32D2D':'#0F6E56'}}>{lowStock.length}</div></div>
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}><div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>Total Items in Stock</div><div style={{fontSize:'22px',fontWeight:700,color:'#142F5C'}}>{items.reduce((s,i)=>s+i.quantity,0)}</div></div>
          </div>
          {lowStock.length>0 && (
            <div style={{background:'#FCEBEB',border:'0.5px solid #A32D2D',borderRadius:'8px',padding:'12px 16px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#A32D2D',marginBottom:'4px'}}>⚠ LOW STOCK ALERT</div>
              <div style={{fontSize:'12px',color:'#A32D2D'}}>{lowStock.map(i=>i.product_name).join(', ')} — restock needed.</div>
            </div>
          )}
          {showForm && (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'20px',marginBottom:'16px'}}>
              <div style={{fontSize:'12px',fontWeight:700,color:'#142F5C',marginBottom:'14px'}}>{editId?'EDIT PRODUCT':'NEW PRODUCT'}</div>
              <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr',gap:'10px',marginBottom:'12px'}}>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PRODUCT NAME</div><input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Whey Protein" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>QUANTITY</div><input type="number" value={qty} onChange={e=>setQty(e.target.value)} placeholder="0" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>UNIT</div><input value={unit} onChange={e=>setUnit(e.target.value)} placeholder="e.g. bags, tubs" style={inp}/></div>
                <div><div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>LOW STOCK ALERT AT</div><input type="number" value={alert} onChange={e=>setAlert(e.target.value)} placeholder="10" style={inp}/></div>
              </div>
              <div style={{display:'flex',gap:'8px'}}>
                <button onClick={saveItem} disabled={loading} style={{background:'#F5A623',color:'white',border:'none',padding:'8px 20px',borderRadius:'6px',fontSize:'13px',fontWeight:700,cursor:'pointer'}}>{loading?'Saving...':editId?'Update Product':'Save Product'}</button>
                <button onClick={()=>{setShowForm(false);setEditId(null)}} style={{background:'#eee',color:'#666',border:'none',padding:'8px 16px',borderRadius:'6px',fontSize:'13px',cursor:'pointer'}}>Cancel</button>
              </div>
            </div>
          )}
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',overflow:'hidden'}}>
            <div style={{padding:'14px 16px',borderBottom:'0.5px solid #eee',fontSize:'10px',fontWeight:700,color:'#2357A3',letterSpacing:'1px'}}>ALL PRODUCTS</div>
            {items.length===0 && <div style={{padding:'32px',textAlign:'center',color:'#888',fontSize:'13px'}}>No products yet.</div>}
            {items.map(item=>(
              <div key={item.id} style={{display:'flex',alignItems:'center',padding:'12px 16px',borderBottom:'0.5px solid #eee',gap:'10px'}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:'13px',color:'#1a1a1a',fontWeight:500}}>{item.product_name}</div>
                  <div style={{fontSize:'10px',color:'#888',marginTop:'2px'}}>Alert at {item.low_stock_alert} {item.unit||'units'}</div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <button onClick={()=>updateQty(item.id,Math.max(0,item.quantity-1))} style={{width:'24px',height:'24px',border:'1px solid #ddd',borderRadius:'4px',background:'white',cursor:'pointer',fontSize:'14px',color:'#1a1a1a'}}>−</button>
                  <span style={{fontSize:'14px',fontWeight:700,color:item.quantity<=item.low_stock_alert?'#A32D2D':'#142F5C',minWidth:'32px',textAlign:'center'}}>{item.quantity}</span>
                  <button onClick={()=>updateQty(item.id,item.quantity+1)} style={{width:'24px',height:'24px',border:'1px solid #ddd',borderRadius:'4px',background:'white',cursor:'pointer',fontSize:'14px',color:'#1a1a1a'}}>+</button>
                  <span style={{fontSize:'10px',color:'#888'}}>{item.unit}</span>
                </div>
                {item.quantity<=item.low_stock_alert && <span style={{fontSize:'9px',padding:'2px 8px',borderRadius:'20px',background:'#FCEBEB',color:'#A32D2D',fontWeight:700}}>LOW</span>}
                <button onClick={()=>startEdit(item)} style={{fontSize:'11px',color:'#2357A3',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Edit</button>
                <button onClick={()=>deleteItem(item.id)} style={{fontSize:'11px',color:'#A32D2D',background:'none',border:'none',cursor:'pointer',padding:'2px 6px'}}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
