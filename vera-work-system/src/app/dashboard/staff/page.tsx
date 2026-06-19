'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function StaffPage() {
  const router = useRouter()
  const [staff, setStaff] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [showCreateAuth, setShowCreateAuth] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Edit staff form fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('staff')
  const [phone, setPhone] = useState('')
  const [salary, setSalary] = useState('')
  const [startDate, setStartDate] = useState('')

  // Create auth user form fields
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authRole, setAuthRole] = useState('staff')
  const [authLoading, setAuthLoading] = useState(false)
  const [authMessage, setAuthMessage] = useState('')

  useEffect(() => { fetchStaff() }, [])

  async function fetchStaff() {
    const { data } = await supabase.from('staff').select('*').order('full_name')
    if (data) setStaff(data)
  }

  async function saveStaff() {
    if (!fullName) return
    setLoading(true)
    if (editId) {
      await supabase.from('staff').update({ full_name: fullName, email, role, phone, salary: salary ? parseFloat(salary) : null, start_date: startDate || null }).eq('id', editId)
      setEditId(null)
    } else {
      await supabase.from('staff').insert({ full_name: fullName, email, role, phone, salary: salary ? parseFloat(salary) : null, start_date: startDate || null })
    }
    setFullName(''); setEmail(''); setRole('staff'); setPhone(''); setSalary(''); setStartDate('')
    setShowForm(false); setLoading(false)
    fetchStaff()
  }

  async function deleteStaff(id: string) {
    if (!confirm('Remove this staff member?')) return
    await supabase.from('staff').delete().eq('id', id)
    fetchStaff()
  }

  function startEdit(s: any) {
    setEditId(s.id); setFullName(s.full_name); setEmail(s.email || ''); setRole(s.role); setPhone(s.phone || ''); setSalary(s.salary ? String(s.salary) : ''); setStartDate(s.start_date || '')
    setShowForm(true)
  }

  async function createAuthUser() {
    if (!authName || !authEmail || !authPassword) {
      setAuthMessage('All fields are required.')
      return
    }
    setAuthLoading(true)
    setAuthMessage('')
    try {
      const res = await fetch('/api/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: authName, email: authEmail, password: authPassword, role: authRole })
      })
      const data = await res.json()
      if (!res.ok) {
        setAuthMessage('Error: ' + data.error)
      } else {
        setAuthMessage('✅ User created successfully!')
        setAuthName(''); setAuthEmail(''); setAuthPassword(''); setAuthRole('staff')
        fetchStaff()
      }
    } catch (e) {
      setAuthMessage('Server error. Try again.')
    }
    setAuthLoading(false)
  }

  const inp = { width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '13px', color: '#1a1a1a', background: '#fff', boxSizing: 'border-box' as any }
  const roleColor = (r: string) => r === 'owner' ? '#142F5C' : r === 'manager' ? '#2357A3' : '#3B6D11'
  const roleBg = (r: string) => r === 'owner' ? '#E8F1F9' : r === 'manager' ? '#E8F1F9' : '#EAF3DE'

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ width: '200px', background: '#142F5C', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '18px 14px 14px', borderBottom: '0.5px solid rgba(255,255,255,0.1)' }}>
          <div style={{ fontFamily: 'Arial Black,sans-serif', fontStyle: 'italic', fontSize: '28px', fontWeight: 900, color: 'white', lineHeight: 1 }}>VERA</div>
          <div style={{ fontSize: '8px', letterSpacing: '4px', color: 'white', fontWeight: 700, marginTop: '2px' }}>N U T R I T I O N</div>
        </div>
        <nav style={{ flex: 1, padding: '10px 0' }}>
          {[['Dashboard', '/dashboard'], ['Finance', '/dashboard/finance'], ['Tasks', '/dashboard/tasks'], ['Schedule', '/dashboard/schedule'], ['Inventory', '/dashboard/inventory'], ['Shipping', '/dashboard/shipping'], ['Staff / HR', ''], ['Documents', '/dashboard/documents']].map(([label, path]) => (
            <div key={label} onClick={() => path && router.push(path)} style={{ padding: '10px 14px', color: path === '' ? 'white' : 'rgba(255,255,255,0.5)', background: path === '' ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: path === '' ? '3px solid #F5A623' : '3px solid transparent', cursor: 'pointer', fontSize: '12px' }}>{label}</div>
          ))}
        </nav>
        <div style={{ padding: '12px 14px', borderTop: '0.5px solid rgba(255,255,255,0.1)' }}>
          <button onClick={() => router.push('/dashboard')} style={{ fontSize: '11px', color: '#F5A623', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>← Dashboard</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#F0F4F8' }}>
        <div style={{ background: 'white', borderBottom: '0.5px solid #ddd', padding: '0 20px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '16px', fontWeight: 700, color: '#142F5C' }}>Staff / HR</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { setShowCreateAuth(!showCreateAuth); setShowForm(false) }} style={{ background: '#142F5C', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+ Create Login User</button>
            <button onClick={() => { setShowForm(!showForm); setEditId(null); setFullName(''); setEmail(''); setRole('staff'); setPhone(''); setSalary(''); setStartDate('') }} style={{ background: '#F5A623', color: 'white', border: 'none', padding: '7px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>+ Add Staff</button>
          </div>
        </div>

        <div style={{ padding: '20px', flex: 1 }}>

          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '16px' }}>
            <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Total Staff</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#142F5C' }}>{staff.length}</div>
            </div>
            <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Managers</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#2357A3' }}>{staff.filter(s => s.role === 'manager').length}</div>
            </div>
            <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '8px', padding: '14px' }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '6px' }}>Monthly Wages</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: '#142F5C' }}>${staff.reduce((s, m) => s + (Number(m.salary) || 0), 0).toFixed(0)}</div>
            </div>
          </div>

          {/* Create Auth User Form */}
          {showCreateAuth && (
            <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#142F5C', marginBottom: '14px' }}>CREATE LOGIN USER (Supabase Auth)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>FULL NAME</div>
                  <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="e.g. Ahmed Nur" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>EMAIL</div>
                  <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="ahmed@vera.com" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>PASSWORD</div>
                  <input type="password" value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Min 6 characters" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>ROLE</div>
                  <select value={authRole} onChange={e => setAuthRole(e.target.value)} style={inp}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              {authMessage && <div style={{ fontSize: '12px', color: authMessage.startsWith('✅') ? 'green' : '#A32D20', marginBottom: '10px' }}>{authMessage}</div>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={createAuthUser} disabled={authLoading} style={{ background: '#142F5C', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{authLoading ? 'Creating...' : 'Create User'}</button>
                <button onClick={() => { setShowCreateAuth(false); setAuthMessage('') }} style={{ background: '#eee', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Add/Edit Staff Form */}
          {showForm && (
            <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', padding: '20px', marginBottom: '16px' }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#142F5C', marginBottom: '14px' }}>{editId ? 'EDIT STAFF' : 'NEW STAFF MEMBER'}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>FULL NAME</div>
                  <input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="e.g. Ahmed Nur" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>EMAIL</div>
                  <input value={email} onChange={e => setEmail(e.target.value)} placeholder="ahmed@vera.com" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>ROLE</div>
                  <select value={role} onChange={e => setRole(e.target.value)} style={inp}>
                    <option value="owner">Owner</option>
                    <option value="manager">Manager</option>
                    <option value="staff">Staff</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>PHONE</div>
                  <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+46 70 000 0000" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>MONTHLY SALARY (USD)</div>
                  <input type="number" value={salary} onChange={e => setSalary(e.target.value)} placeholder="0" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>START DATE</div>
                  <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveStaff} disabled={loading} style={{ background: '#F5A623', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>{loading ? 'Saving...' : editId ? 'Update' : 'Save Staff'}</button>
                <button onClick={() => { setShowForm(false); setEditId(null) }} style={{ background: '#eee', color: '#666', border: 'none', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Staff List */}
          <div style={{ background: 'white', border: '0.5px solid #ddd', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '0.5px solid #eee', fontSize: '10px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px' }}>ALL STAFF</div>
            {staff.length === 0 && <div style={{ padding: '32px', textAlign: 'center', color: '#888', fontSize: '13px' }}>No staff added yet.</div>}
            {staff.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '0.5px solid #eee', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#2357A3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {s.full_name?.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', color: '#1a1a1a', fontWeight: 600 }}>{s.full_name}</div>
                  <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{s.email || '–'} {s.phone ? `· ${s.phone}` : ''}</div>
                  {s.start_date && <div style={{ fontSize: '10px', color: '#888' }}>Started: {new Date(s.start_date).toLocaleDateString()}</div>}
                </div>
                {s.salary && <div style={{ fontSize: '12px', color: '#142F5C', fontWeight: 600 }}>${Number(s.salary).toFixed(0)}/mo</div>}
                <span style={{ fontSize: '9px', padding: '2px 10px', borderRadius: '20px', fontWeight: 700, background: roleBg(s.role), color: roleColor(s.role) }}>{s.role}</span>
                <button onClick={() => router.push(`/dashboard/staff/${s.id}`)} style={{ fontSize: '11px', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>View Profile</button>
                <button onClick={() => startEdit(s)} style={{ fontSize: '11px', color: '#2357A3', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Edit</button>
                <button onClick={() => deleteStaff(s.id)} style={{ fontSize: '11px', color: '#A32D20', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Delete</button>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}
