'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [totalIn, setTotalIn] = useState(0)
  const [totalOut, setTotalOut] = useState(0)
  const [openTasks, setOpenTasks] = useState(0)
  const [overdueTasks, setOverdueTasks] = useState(0)
  const [overdueTaskList, setOverdueTaskList] = useState<any[]>([])
  const [recentTasks, setRecentTasks] = useState<any[]>([])
  const [todayStaff, setTodayStaff] = useState<any[]>([])
  const [todayFinance, setTodayFinance] = useState<any[]>([])
  const [profileMap, setProfileMap] = useState<Record<string,string>>({})
  const [todayAttendance, setTodayAttendance] = useState<any[]>([])
  const [lowStockItems, setLowStockItems] = useState<any[]>([])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      fetchAll()
    }
    init()
  }, [])

  async function fetchAll() {
    const now = new Date()
    const month = now.toISOString().slice(0, 7)
    const today = now.toISOString().slice(0, 10)

    // Profiles map
    const { data: profilesData } = await supabase.from('profiles').select('id, full_name')
    const pMap: Record<string,string> = {}
    ;(profilesData || []).forEach((p: any) => { pMap[p.id] = p.full_name })
    setProfileMap(pMap)

    // Finance this month
    const { data: fin } = await supabase.from('finance').select('*').gte('created_at', month + '-01')
    if (fin) {
      setTotalIn(fin.filter((f: any) => f.type === 'in').reduce((s: number, f: any) => s + Number(f.amount), 0))
      setTotalOut(fin.filter((f: any) => f.type === 'out').reduce((s: number, f: any) => s + Number(f.amount), 0))
    }

    // Today finance
    const { data: todayFin } = await supabase.from('finance').select('*').gte('created_at', today + 'T00:00:00').lte('created_at', today + 'T23:59:59').order('created_at', { ascending: false }).limit(10)
    setTodayFinance(todayFin || [])

    // Tasks
    const { data: tasks } = await supabase.from('tasks').select('*').order('created_at', { ascending: false })
    if (tasks) {
      setOpenTasks(tasks.filter((t: any) => t.status === 'pending').length)
      const overdueList = tasks.filter((t: any) => t.status === 'pending' && t.due_date && t.due_date < today)
    setOverdueTasks(overdueList.length)
    setOverdueTaskList(overdueList)
      setRecentTasks(tasks.slice(0, 4))
    }

    // Today schedule
    const { data: shifts } = await supabase.from('schedules').select('*').eq('shift_date', today)
    setTodayStaff(shifts || [])

    // Today attendance
    const { data: attData } = await supabase.from('attendance').select('*').eq('date', today)
    setTodayAttendance(attData || [])

    // Low stock
    const { data: invData } = await supabase.from('inventory').select('*')
    if (invData) setLowStockItems(invData.filter((i: any) => i.quantity <= (i.low_stock_alert || 10)))
  }

  const netProfit = totalIn - totalOut
  const monthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })

  function getInitials(name: string) {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navSections = [
    { label: 'MAIN', items: [['Dashboard', '/dashboard'], ['Finance', '/dashboard/finance'], ['Tasks', '/dashboard/tasks'], ['Schedule', '/dashboard/schedule']] },
    { label: 'STORE', items: [['Inventory', '/dashboard/inventory'], ['Shipping', '/dashboard/shipping']] },
    { label: 'PEOPLE', items: [['Staff / HR', '/dashboard/staff'], ['Documents', '/dashboard/documents'], ['Attendance', '/dashboard/attendance']] },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ width: '200px', minWidth: '200px', background: '#142F5C', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontFamily: 'Arial Black,sans-serif', fontStyle: 'italic', fontSize: '26px', fontWeight: 900, color: 'white', lineHeight: 1 }}>VERA</div>
          <div style={{ fontSize: '7px', letterSpacing: '4px', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginTop: '3px' }}>N U T R I T I O N</div>
        </div>
        <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
          {navSections.map(sec => (
            <div key={sec.label}>
              <div style={{ padding: '10px 16px 4px', fontSize: '9px', color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: '1px' }}>{sec.label}</div>
              {sec.items.map(([label, path]) => (
                <div key={label} onClick={() => router.push(path)} style={{ padding: '8px 16px', color: path === '/dashboard' ? 'white' : 'rgba(255,255,255,0.6)', background: path === '/dashboard' ? 'rgba(255,255,255,0.1)' : 'transparent', borderLeft: path === '/dashboard' ? '3px solid #F5A623' : '3px solid transparent', cursor: 'pointer', fontSize: '13px' }}>{label}</div>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#F5A623', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: 'white' }}>{getInitials(user?.user_metadata?.full_name || user?.email || '')}</div>
            <div>
              <div style={{ fontSize: '11px', color: 'white', fontWeight: 600 }}>{user?.user_metadata?.full_name || user?.email?.split('@')[0]}</div>
              <div style={{ fontSize: '10px', color: '#F5A623', textTransform: 'capitalize' }}>{user?.user_metadata?.role}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Sign out</button>
        </div>
      </div>

      <div style={{ flex: 1, background: '#F0F4F8', overflowY: 'auto' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0', background: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {lowStockItems.length > 0 && (
            <div style={{ margin: '0 0 12px 0', padding: '14px 20px', background: '#FFFBEB', borderRadius: '8px', border: '1px solid #FCD34D' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <span style={{ fontSize: '18px' }}>📦</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#92400E' }}>
                  {lowStockItems.length} item{lowStockItems.length > 1 ? 's' : ''} low on stock — reorder needed
                </span>
                <a href="/dashboard/inventory" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#92400E', textDecoration: 'none', padding: '4px 12px', border: '1px solid #F59E0B', borderRadius: '6px' }}>View Inventory →</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {lowStockItems.map((item: any) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'white', borderRadius: '6px', border: '1px solid #FCD34D' }}>
                    <span style={{ fontSize: '11px', color: '#F59E0B' }}>●</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{item.product_name}</span>
                    <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>Qty: {item.quantity} {item.unit || ''}</span>
                    <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: '#FECACA', color: '#A32D2D', fontWeight: 700, marginLeft: 'auto' }}>LOW</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {overdueTasks > 0 && (
            <div style={{ margin: '0 0 20px 0', padding: '14px 20px', background: '#FEF2F2', borderRadius: '8px', border: '1px solid #FECACA' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: overdueTaskList.length > 0 ? '10px' : '0' }}>
                <span style={{ fontSize: '18px' }}>⚠️</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#DC2626' }}>
                  {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} — please review and action
                </span>
                <a href="/dashboard/tasks" style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 700, color: '#DC2626', textDecoration: 'none', padding: '4px 12px', border: '1px solid #DC2626', borderRadius: '6px' }}>View Tasks →</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {overdueTaskList.map((t: any) => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'white', borderRadius: '6px', border: '1px solid #FECACA' }}>
                    <span style={{ fontSize: '11px', color: '#DC2626' }}>●</span>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{t.title}</span>
                    <span style={{ fontSize: '11px', color: '#888', marginLeft: '4px' }}>Due: {t.due_date}</span>
                    {t.assigned_to && profileMap[t.assigned_to] && (
                      <span style={{ fontSize: '11px', color: '#2357A3', marginLeft: 'auto' }}>→ {profileMap[t.assigned_to]}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#142F5C' }}>Dashboard</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>

        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'Money In (month)', val: '$' + totalIn.toLocaleString(), sub: 'This month', color: '#16a34a' },
              { label: 'Money Out (month)', val: '$' + totalOut.toLocaleString(), sub: 'Expenses + wages', color: '#dc2626' },
              { label: 'Net Profit', val: '$' + netProfit.toLocaleString(), sub: monthName, color: '#142F5C' },
              { label: 'Open Tasks', val: String(openTasks), sub: overdueTasks > 0 ? overdueTasks + ' overdue' : 'All on track', color: '#142F5C' },
            ].map(card => (
              <div key={card.label} style={{ background: 'white', borderRadius: '10px', padding: '18px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px', fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontSize: '26px', fontWeight: 700, color: card.color, marginBottom: '4px' }}>{card.val}</div>
                <div style={{ fontSize: '11px', color: '#aaa' }}>{card.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '14px' }}>RECENT TASKS</div>
              {recentTasks.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No tasks yet</div>
              ) : recentTasks.map((task: any) => (
                <div key={task.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: task.priority === 'high' ? '#dc2626' : task.priority === 'medium' ? '#f59e0b' : '#6b7280', flexShrink: 0 }}></div>
                    <div>
                      <span style={{ fontSize: '13px', color: '#333' }}>{task.title}</span>
                      {task.assigned_to && profileMap[task.assigned_to] && (
                        <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>👤 {profileMap[task.assigned_to]}</div>
                      )}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: task.status === 'done' ? '#dcfce7' : task.due_date && task.due_date < new Date().toISOString().slice(0, 10) ? '#fee2e2' : '#fef9c3', color: task.status === 'done' ? '#16a34a' : task.due_date && task.due_date < new Date().toISOString().slice(0, 10) ? '#dc2626' : '#b45309', fontWeight: 600 }}>
                    {task.status === 'done' ? 'Done' : task.due_date && task.due_date < new Date().toISOString().slice(0, 10) ? 'Late' : 'Pending'}
                  </span>
                </div>
              ))}
            </div>

            <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '14px' }}>STAFF TODAY</div>
              {todayStaff.length === 0 ? (
                <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No shifts scheduled today</div>
              ) : todayStaff.map((shift: any) => (
                <div key={shift.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#E8F1F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, color: '#2357A3', flexShrink: 0 }}>
                    {getInitials(profileMap[shift.assigned_to] || '?')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{profileMap[shift.assigned_to] || 'Unassigned'}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{shift.start_time} – {shift.end_time}</div>
                  </div>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }}></div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '14px' }}>FINANCE — TODAY</div>
            {todayFinance.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No transactions today</div>
            ) : todayFinance.map((entry: any) => (
              <div key={entry.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f5f5f5' }}>
                <span style={{ fontSize: '13px', color: '#333' }}>{entry.description}</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: entry.type === 'in' ? '#16a34a' : '#dc2626' }}>{entry.type === 'in' ? '+' : '- '}${Number(entry.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#2357A3', letterSpacing: '1px', marginBottom: '14px' }}>CLOCKED IN TODAY</div>
          {todayAttendance.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No staff clocked in yet</div>
          ) : (
            todayAttendance.map((att: any) => (
              <div key={att.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #f5f5f5' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2357A3', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, flexShrink: 0 }}>
                  {(profileMap[att.staff_id] || '?').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#333' }}>{profileMap[att.staff_id] || 'Unknown'}</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>In: {new Date(att.clock_in).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}{att.clock_out ? ' · Out: ' + new Date(att.clock_out).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, background: att.clock_out ? '#dcfce7' : '#fef9c3', color: att.clock_out ? '#16a34a' : '#854d0e' }}>
                  {att.clock_out ? 'Done' : 'Active'}
                </span>
              </div>
            ))
          )}
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <a href="/dashboard/attendance" style={{ fontSize: '12px', color: '#2357A3', textDecoration: 'none', fontWeight: 600 }}>View full history →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
