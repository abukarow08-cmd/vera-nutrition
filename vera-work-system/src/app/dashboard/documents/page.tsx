'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const CATEGORIES = ['All', 'HR', 'Finance', 'Shipping', 'Contracts', 'Other']

export default function DocumentsPage() {
  const router = useRouter()
  const [docs, setDocs] = useState<any[]>([])
  const [category, setCategory] = useState('All')
  const [uploading, setUploading] = useState(false)
  const [uploadCategory, setUploadCategory] = useState('HR')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/login')
      else fetchDocs()
    })
  }, [])

  async function fetchDocs() {
    setLoading(true)
    const { data } = await supabase.storage.from('documents').list('', { limit: 200 })
    const all: any[] = []
    for (const folder of (data || [])) {
      if (folder.id === null) {
        const { data: files } = await supabase.storage.from('documents').list(folder.name, { limit: 100 })
        for (const file of (files || [])) {
          all.push({ fullPath: folder.name + '/' + file.name, displayName: file.name.replace(/^\d+_/, ''), category: folder.name, metadata: file.metadata })
        }
      }
    }
    setDocs(all)
    setLoading(false)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const path = uploadCategory + '/' + Date.now() + '_' + file.name
    await supabase.storage.from('documents').upload(path, file)
    await fetchDocs()
    setUploading(false)
    e.target.value = ''
  }

  async function handleDelete(path: string) {
    if (!confirm('Delete this document?')) return
    await supabase.storage.from('documents').remove([path])
    fetchDocs()
  }

  function getUrl(path: string) {
    const { data } = supabase.storage.from('documents').getPublicUrl(path)
    return data.publicUrl
  }

  const filtered = category === 'All' ? docs : docs.filter(d => d.category === category)
  const grouped: Record<string, any[]> = {}
  filtered.forEach(d => {
    if (!grouped[d.category]) grouped[d.category] = []
    grouped[d.category].push(d)
  })

  return (
    <div style={{display:'flex',minHeight:'100vh',fontFamily:'sans-serif'}}>
      <div style={{width:'200px',background:'#142F5C',display:'flex',flexDirection:'column',flexShrink:0}}>
        <div style={{padding:'18px 14px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'white',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'white',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <nav style={{flex:1,padding:'10px 0'}}>
          {[['Dashboard','/dashboard'],['Finance','/dashboard/finance'],['Tasks','/dashboard/tasks'],['Schedule','/dashboard/schedule'],['Inventory','/dashboard/inventory'],['Shipping','/dashboard/shipping'],['Staff / HR','/dashboard/staff'],['Documents','/dashboard/documents']].map(([label,path])=>(
            <div key={label} onClick={()=>router.push(path)} style={{padding:'10px 14px',color:path==='/dashboard/documents'?'white':'rgba(255,255,255,0.5)',background:path==='/dashboard/documents'?'rgba(255,255,255,0.1)':'transparent',borderLeft:path==='/dashboard/documents'?'3px solid #F5A623':'3px solid transparent',cursor:'pointer',fontSize:'12px'}}>
              {label}
            </div>
          ))}
        </nav>
      </div>
      <div style={{flex:1,display:'flex',flexDirection:'column',background:'#F0F4F8'}}>
        <div style={{background:'white',borderBottom:'0.5px solid #ddd',padding:'0 20px',height:'52px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{fontSize:'16px',fontWeight:700,color:'#142F5C'}}>Documents</div>
          <label style={{background:'#F5A623',color:'white',padding:'7px 16px',borderRadius:'6px',fontSize:'12px',fontWeight:700,cursor:'pointer'}}>
            {uploading ? 'Uploading...' : '+ Upload File'}
            <input type="file" style={{display:'none'}} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>
        <div style={{padding:'20px'}}>
          <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',padding:'14px',marginBottom:'16px',display:'flex',alignItems:'center',gap:'12px',flexWrap:'wrap'}}>
            <span style={{fontSize:'12px',color:'#666'}}>Upload to:</span>
            {CATEGORIES.filter(c=>c!=='All').map(c=>(
              <button key={c} onClick={()=>setUploadCategory(c)} style={{padding:'5px 12px',borderRadius:'4px',border:'1px solid',borderColor:uploadCategory===c?'#142F5C':'#ddd',background:uploadCategory===c?'#142F5C':'white',color:uploadCategory===c?'white':'#666',fontSize:'11px',cursor:'pointer',fontWeight:uploadCategory===c?700:400}}>
                {c}
              </button>
            ))}
          </div>
          <div style={{display:'flex',gap:'8px',marginBottom:'16px',flexWrap:'wrap'}}>
            {CATEGORIES.map(c=>(
              <button key={c} onClick={()=>setCategory(c)} style={{padding:'6px 14px',borderRadius:'6px',border:'none',background:category===c?'#142F5C':'white',color:category===c?'white':'#666',fontSize:'12px',cursor:'pointer',fontWeight:category===c?700:400,boxShadow:'0 1px 3px rgba(0,0,0,0.1)'}}>
                {c}
              </button>
            ))}
          </div>
          {loading ? (
            <div style={{textAlign:'center',color:'#888',padding:'40px'}}>Loading...</div>
          ) : Object.keys(grouped).length === 0 ? (
            <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'10px',padding:'40px',textAlign:'center',color:'#888'}}>No documents yet. Upload your first file above.</div>
          ) : Object.entries(grouped).map(([cat, files]) => (
            <div key={cat} style={{marginBottom:'20px'}}>
              <div style={{fontSize:'13px',fontWeight:700,color:'#142F5C',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'1px'}}>{cat}</div>
              <div style={{background:'white',border:'0.5px solid #ddd',borderRadius:'8px',overflow:'hidden'}}>
                {files.map((doc, i) => (
                  <div key={doc.fullPath} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 16px',borderBottom:i<files.length-1?'0.5px solid #f0f0f0':'none'}}>
                    <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                      <div style={{fontSize:'20px'}}>{doc.displayName.endsWith('.pdf')?'📄':doc.displayName.match(/\.(jpg|jpeg|png|gif)/i)?'🖼️':doc.displayName.match(/\.(doc|docx)/i)?'📝':'📎'}</div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#333'}}>{doc.displayName}</div>
                    </div>
                    <div style={{display:'flex',gap:'8px'}}>
                      <a href={getUrl(doc.fullPath)} target="_blank" rel="noopener noreferrer" style={{padding:'5px 12px',background:'#142F5C',color:'white',borderRadius:'4px',fontSize:'11px',textDecoration:'none',fontWeight:600}}>Download</a>
                      <button onClick={()=>handleDelete(doc.fullPath)} style={{padding:'5px 12px',background:'#fee',color:'#c00',border:'1px solid #fcc',borderRadius:'4px',fontSize:'11px',cursor:'pointer'}}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
