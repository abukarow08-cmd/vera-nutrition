'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/')
      else setUser(data.user)
    })
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (!user) return <div style={{background:'#142F5C',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'white',fontFamily:'sans-serif'}}>Loading...</p></div>

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard',''],['Finance','/dashboard/finance'],['Tasks','/dashboard/tasks'],['Schedule','/dashboard/schedule'],['Inventory','/dashboard/inventory'],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>router.push(path)} style={{padding:'10px 14px',color:path===''?'white':'rgba(255,255,255,0.5)',background:path===''?'rgba(255,255,255,0.1)':'transparent',borderLeft:path===''?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>
              {label}
            </div>
          ))}
        </nav>
        <div style={{padding:'12px 14px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.7)',marginBottom:'6px'}}>{user.email}</div>
          <button onClick={handleLogout} style={{fontSize:'11px',color:'#F5A623',background:'none',border:'none',cursor:'pointer',padding:0}}>Sign Out</button>
        </div>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Owner Dashboard</div>
          <button style={{background:'#F5A623',color:'white',border:'none',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>+ Add Entry</button>
        </div>
        <div style={{flex:1,padding:'20px'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'16px'}}>
            {[['Money In (month)','$0','This month','#0F6E56'],['Money Out (month)','$0','Expenses + wages','#A32D2D'],['Net Profit','$0','June 2026','#142F5C'],['Open Tasks','0','No overdue','#142F5C']].map(([label,val,sub,color])=>(
              <div key={label} style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px'}}>
                <div style={{fontSize:'10px',color:'#666',marginBottom:'6px'}}>{label}</div>
                <div style={{fontSize:'22px',fontWeight:700,color:color as string}}>{val}</div>
                <div style={{fontSize:'10px',color:'#888',marginTop:'3px'}}>{sub}</div>
              </div>
            ))}
          </div>
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'32px',textAlign:'center'}}>
            <h2 style={{color:'#142F5C',fontSize:'20px',fontWeight:700,marginBottom:'10px'}}>Welcome to VERA Work System</h2>
            <p style={{color:'#888',fontSize:'13px'}}>Dashboard is ready. Use the sidebar to navigate.</p>
          </div>
        </div>
      </div>
    </div>
  )
}