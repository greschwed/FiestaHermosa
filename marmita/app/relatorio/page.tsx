import StatusBar from '@/components/StatusBar';
import BottomNav from '@/components/BottomNav';
import Icon from '@/components/Icon';
import { RECEITAS, fmtBRL } from '@/lib/data';

export default function Relatorio() {
  const totalFaturamento = RECEITAS.reduce((s, r) => s + r.precoSugerido * r.rendimento, 0);
  const totalCusto = RECEITAS.reduce((s, r) => s + r.custoTotal, 0);
  const margemMedia = RECEITAS.reduce((s, r) => s + r.margem, 0) / RECEITAS.length;

  return (
    <div className="app-shell">
      <StatusBar />

      <div className="appbar">
        <h1 className="serif">Relatórios</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="filter" size={16} /></button>
        </div>
      </div>

      <div className="scroll">
        <div style={{
          background: 'linear-gradient(135deg, #6b6f3e 0%, #4f5228 100%)',
          borderRadius: 20, padding: 20, color: '#fff', marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>Faturamento potencial</div>
          <div className="serif" style={{ fontSize: 36, marginTop: 6, letterSpacing: '-0.02em' }}>{fmtBRL(totalFaturamento)}</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>Baseado nos preços sugeridos de {RECEITAS.length} receitas</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="trending" size={18} color="var(--good)" />
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{fmtBRL(totalCusto)}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Custo total insumos</div>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <Icon name="chart" size={18} color="var(--terracotta)" />
            <div className="serif" style={{ fontSize: 20, fontWeight: 600, marginTop: 8 }}>{margemMedia.toFixed(0)}%</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Margem média</div>
          </div>
        </div>

        <div className="serif" style={{ fontSize: 18, marginBottom: 10 }}>Margem por receita</div>
        <div className="card" style={{ padding: 0 }}>
          {RECEITAS.map((r, i) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px', borderBottom: i < RECEITAS.length - 1 ? '1px solid var(--line)' : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nome}</div>
                <div style={{ marginTop: 6 }}>
                  <div style={{ height: 4, background: 'var(--surface-2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(r.margem / 200) * 100}%`, background: r.margem >= 60 ? 'var(--good)' : r.margem >= 40 ? 'var(--terracotta)' : 'var(--warn)', borderRadius: 2 }} />
                  </div>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div className="serif" style={{ fontSize: 16, color: r.margem >= 60 ? 'var(--good)' : 'var(--terracotta)' }}>{r.margem}%</div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{fmtBRL(r.precoSugerido)}/un</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
