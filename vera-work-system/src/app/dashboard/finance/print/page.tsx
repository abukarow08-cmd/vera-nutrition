'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function FinancePrint() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('finance').select('*').order('created_at', { ascending: false })
      setRecords(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const totalIncome = records.filter(r => r.type === 'income' || r.type === 'in').reduce((s, r) => s + Number(r.amount), 0)
  const totalExpenses = records.filter(r => r.type === 'expense' || r.type === 'out').reduce((s, r) => s + Number(r.amount), 0)
  const net = totalIncome - totalExpenses

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
          <div style={{ fontSize: '20px', fontWeight: 700, color: '#142F5C' }}>Finance Report</div>
          <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Generated: {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Income', value: `${totalIncome.toLocaleString()} kr`, color: '#16a34a' },
          { label: 'Total Expenses', value: `${totalExpenses.toLocaleString()} kr`, color: '#dc2626' },
          { label: 'Net Profit', value: `${net.toLocaleString()} kr`, color: net >= 0 ? '#2357A3' : '#dc2626' },
        ].map(k => (
          <div key={k.label} style={{ background: '#EEF4FF', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: k.color }}>{k.value}</div>
            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#142F5C', color: 'white' }}>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Date</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Description</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Category</th>
            <th style={{ padding: '10px 12px', textAlign: 'left' }}>Type</th>
            <th style={{ padding: '10px 12px', textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r, i) => (
            <tr key={r.id} style={{ background: i % 2 === 0 ? 'white' : '#F8FAFB', borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '9px 12px' }}>{r.created_at?.slice(0,10)}</td>
              <td style={{ padding: '9px 12px' }}>{r.description || '-'}</td>
              <td style={{ padding: '9px 12px' }}>{r.category || '-'}</td>
              <td style={{ padding: '9px 12px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, background: (r.type === 'income' || r.type === 'in') ? '#dcfce7' : '#fee2e2', color: (r.type === 'income' || r.type === 'in') ? '#16a34a' : '#dc2626' }}>
                  {r.type}
                </span>
              </td>
              <td style={{ padding: '9px 12px', textAlign: 'right', fontWeight: 600, color: (r.type === 'income' || r.type === 'in') ? '#16a34a' : '#dc2626' }}>
                {(r.type === 'income' || r.type === 'in') ? '+' : '-'}{Number(r.amount).toLocaleString()} kr
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '16px', fontSize: '11px', color: '#aaa', display: 'flex', justifyContent: 'space-between' }}>
        <span>Vera Nutrition Work System</span>
        <span>Confidential — Internal Use Only</span>
      </div>
    </div>
  )
}
