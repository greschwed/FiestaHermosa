import Link from 'next/link';
import StatusBar from '@/components/StatusBar';
import Icon from '@/components/Icon';
import { RECEITAS, INSUMOS, fmtBRL, fmtNum } from '@/lib/data';
import { notFound } from 'next/navigation';

export default async function DetalheReceita(props: PageProps<'/receitas/[id]'>) {
  const { id } = await props.params;
  const receita = RECEITAS.find(r => r.id === id);
  if (!receita) notFound();

  const ingredientesDetalhados = receita.ingredientes.map(ing => {
    const ins = INSUMOS.find(i => i.id === ing.id)!;
    return { ...ins, qtd: ing.qtd, custo: ing.qtd * ins.custoUn };
  });

  const lucroPorcao = receita.precoSugerido * (1 - receita.taxaApp / 100) - receita.custoPorcao;

  return (
    <div className="app-shell">
      <StatusBar />

      {/* Hero image */}
      <div style={{ position: 'relative', height: 220, flexShrink: 0 }}>
        <div className="img-placeholder" style={{ position: 'absolute', inset: 0, borderRadius: 0, fontSize: 12 }}>
          foto do prato finalizado
        </div>
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex', justifyContent: 'space-between' }}>
          <Link href="/receitas" className="iconbtn" style={{ background: 'rgba(255,255,255,0.92)', border: 'none' }}>
            <Icon name="arrowLeft" size={18} />
          </Link>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link href={`/receitas/nova`} className="iconbtn" style={{ background: 'rgba(255,255,255,0.92)', border: 'none' }}>
              <Icon name="edit" size={16} />
            </Link>
            <button className="iconbtn" style={{ background: 'rgba(255,255,255,0.92)', border: 'none' }}>
              <Icon name="receipt" size={16} />
            </button>
          </div>
        </div>
      </div>

      <div
        className="scroll"
        style={{ marginTop: -24, background: 'var(--bg)', borderTopLeftRadius: 24, borderTopRightRadius: 24, position: 'relative', zIndex: 2 }}
      >
        <span className={`chip ${receita.cat === 'Fitness' ? 'olive' : receita.cat === 'Vegano' ? 'good' : 'honey'}`} style={{ marginBottom: 8, display: 'inline-flex' }}>{receita.cat}</span>
        <h2 className="serif" style={{ fontSize: 26, margin: '8px 0 4px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>{receita.nome}</h2>
        <div style={{ display: 'flex', gap: 14, fontSize: 13, color: 'var(--ink-3)', marginBottom: 16, alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="users" size={13} /> rende {receita.rendimento}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="timer" size={13} /> 35 min</span>
        </div>

        {/* Cost breakdown */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16, borderColor: 'var(--terracotta-soft)' }}>
          <div style={{ padding: '14px 16px', background: 'var(--terracotta-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--terracotta)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>Preço sugerido</div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>com margem de {receita.margem}% e taxa {receita.taxaApp}%</div>
            </div>
            <div className="serif tnum" style={{ fontSize: 30, color: 'var(--terracotta)' }}>{fmtBRL(receita.precoSugerido)}</div>
          </div>
          <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Custo total</div>
              <div className="serif tnum" style={{ fontSize: 16 }}>{fmtBRL(receita.custoTotal)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Por porção</div>
              <div className="serif tnum" style={{ fontSize: 16 }}>{fmtBRL(receita.custoPorcao)}</div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: 'var(--ink-3)', textTransform: 'uppercase' }}>Lucro/un</div>
              <div className="serif tnum" style={{ fontSize: 16, color: 'var(--good)' }}>{fmtBRL(lucroPorcao)}</div>
            </div>
          </div>
        </div>

        {/* Ingredients */}
        {ingredientesDetalhados.length > 0 && (
          <>
            <div className="serif" style={{ fontSize: 18, marginBottom: 8 }}>Ingredientes</div>
            <div className="card" style={{ padding: 0, marginBottom: 16 }}>
              {ingredientesDetalhados.map((ing, i) => (
                <div key={ing.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderBottom: i < ingredientesDetalhados.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: 18 }}>{ing.emoji}</span>
                    <div>
                      <div style={{ fontSize: 14 }}>{ing.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        {fmtNum(ing.qtd, ing.un === 'un' ? 0 : 3)} {ing.un}
                      </div>
                    </div>
                  </div>
                  <div className="tnum" style={{ fontSize: 13, color: 'var(--ink-2)' }}>{fmtBRL(ing.custo)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Prep steps */}
        {receita.preparo.length > 0 && (
          <>
            <div className="serif" style={{ fontSize: 18, marginBottom: 8 }}>Modo de preparo</div>
            <div className="col gap-3" style={{ marginBottom: 24 }}>
              {receita.preparo.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', background: 'var(--terracotta)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, flexShrink: 0,
                  }}>{i + 1}</div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--ink-2)', paddingTop: 3 }}>{p}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
