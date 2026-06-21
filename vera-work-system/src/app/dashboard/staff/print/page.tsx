'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function StaffPrint() {
  const [staff, setStaff] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: s } = await supabase.from('staff').select('*').order('name')
      const { data: t } = await supabase.from('tasks').select('*')
      const { data: a } = await supabase.from('attendance').select('*')
      setStaff(s || [])
      setTasks(t || [])
      setAttendance(a || [])
      setLoading(false)
    }
    load()
  }, [])

  function getTaskStats(userId: string) {
    const userTasks = tasks.filter(t => t.assigned_to === userId)
    const done = userTasks.filter(t => t.status === 'done').length
    return { total: userTasks.length, done, pending: userTasks.length - done }
  }

  function getAttendanceDays(userId: string) {
    return attendance.filter(a => a.staff_id === userId).length
  }

  if (loading) return <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif' }}>Loading...</div>

  return (
    <div style={{ padding: '40px', fontFamily: 'Inter, sans-serif', maxWidth: '900px', margin: '0 auto', color: '#111' }}>
      <style>{`@media print { .no-print { display: none !important; } @page { margin: 20mm; } }`}</style>

      <div className="no-print" style={{ marginBottom: '24px', display: 'flex', gap: '12px' }}>
        <button onClick={() => window.print()} style={{ background: '#2357A3', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>⬇ Download PDF</button>
        <button onClick={() => window.history.back()} style={{ background: 'none', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '8px', fontSize: '14px', cursor: 'pointer' }}>← Back</button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid #2357A3', paddingBottom: '16px' }}>
        <div>
          <div style={{ fontFamily: 'Arial Black, sans-serif', fontStyle: 'italic', fontSize: '28px', fontWeight: 900, color: '#142F5C' }}>VERA</div>
          <div style={{ fontSize: '8px', letterSpacing: '4px', color: '#888', fontWeight: 700 }}>N U T R I T I O N</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#142F5C' }}>Staff Report</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Staff', value: staff.length },
          { label: 'Total Tasks', value: tasks.length },
          { label: 'Tasks Completed', value: tasks.filter(t => t.status === 'done').length },
        ].map(k => (
          <div key={k.label} style={{ background: '#EEF4FF', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: '#2357A3' }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {staff.map(s => {
        const stats = getTaskStats(s.user_id)
        const days = getAttendanceDays(s.user_id)
        return (
          <div key={s.id} style={{ marginBottom: '24px', border: '1px solid #eee', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{ background: '#142F5C', color: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{s.name}</div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>{s.position || s.role || '-'}</div>
              </div>
              <span style={{ background: '#F5A623', color: '#142F5C', borderRadius: '20px', padding: '3px 12px', fontSize: '11px', fontWeight: 700 }}>{s.role}</span>
            </div>
            <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {[
                { label: 'Email', value: s.email || '-' },
                { label: 'Phone', value: s.phone || '-' },
                { label: 'Days Present', value: days },
                { label: 'Tasks', value: `${stats.done}/${stats.total} done` },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: '10px', color: '#888', fontWeight: 600, marginBottom: '2px' }}>{item.label}</div>
                  <div style={{ fontSize: '13px', color: '#111', fontWeight: 500 }}>{item.value}</div>
                </div>
              ))}
            </div>
            {stats.total > 0 && (
              <div style={{ padding: '0 16px 16px' }}>
                <div style={{ background: '#f5f5f5', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
                  <div style={{ background: '#2357A3', height: '100%', width: `${Math.round((stats.done / stats.total) * 100)}%` }} />
                </div>
                <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>{Math.round((stats.done / stats.total) * 100)}% task completion rate</div>
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '16px', fontSize: '11px', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Vera Nutrition Work System</span>
        <span>Confidential — Internal Use Only</span>
      </div>
    </div>
  )
}
