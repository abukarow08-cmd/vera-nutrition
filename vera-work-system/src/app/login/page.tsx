'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin() {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'#142F5C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'sans-serif'}}>
      <div style={{background:'white',borderRadius:'12px',padding:'40px',width:'360px',boxShadow:'0 4px 24px rgba(0,0,0,0.2)'}}>
        <div style={{textAlign:'center',marginBottom:'32px'}}>
          <div style={{fontFamily:'Arial Black,sans-serif',fontStyle:'italic',fontSize:'28px',fontWeight:900,color:'#142F5C',lineHeight:1}}>VERA</div>
          <div style={{fontSize:'8px',letterSpacing:'4px',color:'#142F5C',fontWeight:700,marginTop:'2px'}}>N U T R I T I O N</div>
        </div>
        <div style={{marginBottom:'16px'}}>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'6px'}}>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box'}}
          />
        </div>
        <div style={{marginBottom:'24px'}}>
          <label style={{fontSize:'12px',color:'#666',display:'block',marginBottom:'6px'}}>Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{width:'100%',padding:'10px 12px',border:'1px solid #ddd',borderRadius:'6px',fontSize:'14px',boxSizing:'border-box'}}
          />
        </div>
        {error && <div style={{color:'red',fontSize:'12px',marginBottom:'16px'}}>{error}</div>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{width:'100%',padding:'12px',background:'#F5A623',color:'white',border:'none',borderRadius:'6px',fontSize:'14px',fontWeight:700,cursor:'pointer'}}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </div>
    </div>
  )
}
