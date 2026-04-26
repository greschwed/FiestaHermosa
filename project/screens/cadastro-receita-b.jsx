// Cadastro de Receita — Variação B: desktop split layout c/ painel de cálculo lateral fixo
const CadastroReceitaB = () => {
  const { INSUMOS, CATEGORIAS_RECEITA } = window.MARMITA_DATA;
  const [nome, setNome] = React.useState('Lasanha à bolonhesa');
  const [rendimento, setRendimento] = React.useState(8);
  const [margem, setMargem] = React.useState(60);
  const [taxa, setTaxa] = React.useState(18);
  const [items, setItems] = React.useState([
    { id: 'i4', qtd: 1.2 },
    { id: 'i6', qtd: 0.8 },
    { id: 'i8', qtd: 0.3 },
    { id: 'i7', qtd: 0.05 },
    { id: 'i11', qtd: 8 },
  ]);

  const detalhados = items.map(it => {
    const ins = INSUMOS.find(i => i.id === it.id);
    return { ...ins, qtd: it.qtd, custo: it.qtd * ins.custoUn };
  });
  const custoTotal = detalhados.reduce((s,d)=>s+d.custo, 0);
  const custoPorcao = custoTotal / rendimento;
  const precoBruto = custoPorcao * (1 + margem/100);
  const precoSugerido = precoBruto / (1 - taxa/100);
  const lucroPorcao = precoSugerido*(1-taxa/100) - custoPorcao;

  const setQtd = (id, qtd) => setItems(items.map(it=>it.id===id?{...it,qtd}:it));
  const removeItem = (id) => setItems(items.filter(it=>it.id!==id));

  return (
    <div className="frame" style={{display:'flex',flexDirection:'column',background:'var(--bg)'}}>
      {/* Top bar */}
      <div style={{display:'flex',alignItems:'center',gap:14,padding:'16px 28px',borderBottom:'1px solid var(--line)',background:'#fff',flexShrink:0}}>
        <button className="iconbtn"><Icon name="arrowLeft" size={18}/></button>
        <div style={{fontSize:13,color:'var(--ink-3)'}}>Receitas <span style={{margin:'0 6px'}}>›</span> <span style={{color:'var(--ink-2)'}}>Editar</span></div>
        <div style={{flex:1}}/>
        <button className="btn btn-ghost btn-sm">Cancelar</button>
        <button className="btn btn-primary btn-sm"><Icon name="check" size={14}/>Salvar receita</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 360px',flex:1,minHeight:0}}>
        {/* Left: form */}
        <div style={{padding:'28px 32px',overflowY:'auto'}}>
          <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:24}}>
            <div className="img-placeholder" style={{width:120,height:120,borderRadius:16,fontSize:11,flexShrink:0}}>foto</div>
            <div style={{flex:1}}>
              <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Nome da receita</div>
              <input value={nome} onChange={e=>setNome(e.target.value)} className="serif" style={{
                width:'100%',fontSize:34,padding:'4px 0',border:'none',outline:'none',
                letterSpacing:'-0.02em',background:'transparent',marginBottom:14
              }}/>
              <div style={{display:'flex',gap:14}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Categoria</div>
                  <select className="" style={{width:'100%',padding:'10px 12px',border:'1px solid var(--line)',borderRadius:10,fontSize:14,background:'#fff'}}>
                    {CATEGORIAS_RECEITA.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:4}}>Rende</div>
                  <div className="input-prefix">
                    <input type="number" value={rendimento} onChange={e=>setRendimento(+e.target.value||1)}/>
                    <span className="prefix" style={{borderLeft:'1px solid var(--line)',borderRight:'none'}}>marmitas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ingredients table */}
          <div className="row" style={{marginBottom:12}}>
            <div className="serif" style={{fontSize:22,letterSpacing:'-0.01em'}}>Ficha técnica</div>
            <button className="btn btn-ghost btn-sm"><Icon name="plus" size={14}/>Adicionar insumo</button>
          </div>

          <div className="card flush" style={{padding:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 32px',gap:0,padding:'10px 14px',background:'var(--surface-2)',fontSize:11,fontWeight:600,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>
              <div>Insumo</div>
              <div style={{textAlign:'right'}}>Qtd</div>
              <div style={{textAlign:'right'}}>Custo unit.</div>
              <div style={{textAlign:'right'}}>Subtotal</div>
              <div></div>
            </div>
            {detalhados.map((d,i)=>(
              <div key={d.id} style={{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr 32px',gap:0,padding:'12px 14px',alignItems:'center',borderBottom:i<detalhados.length-1?'1px solid var(--line)':'none'}}>
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{fontSize:18}}>{d.emoji}</span>
                  <div>
                    <div style={{fontSize:14}}>{d.nome}</div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>{d.cat}</div>
                  </div>
                </div>
                <div style={{display:'flex',justifyContent:'flex-end'}}>
                  <div style={{display:'flex',alignItems:'center',gap:0,border:'1px solid var(--line)',borderRadius:8,overflow:'hidden'}}>
                    <input type="number" value={d.qtd} onChange={e=>setQtd(d.id, +e.target.value||0)} step="0.01" className="tnum" style={{width:60,padding:'6px 8px',border:'none',outline:'none',textAlign:'right',fontSize:13,background:'#fff'}}/>
                    <span style={{padding:'6px 10px',background:'var(--surface-2)',fontSize:11,color:'var(--ink-3)',borderLeft:'1px solid var(--line)'}}>{d.un}</span>
                  </div>
                </div>
                <div className="tnum" style={{fontSize:13,color:'var(--ink-3)',textAlign:'right'}}>{window.fmtBRL(d.custoUn)}</div>
                <div className="tnum serif" style={{fontSize:15,textAlign:'right'}}>{window.fmtBRL(d.custo)}</div>
                <button onClick={()=>removeItem(d.id)} style={{border:'none',background:'none',color:'var(--ink-4)',padding:4,justifySelf:'end'}}><Icon name="trash" size={14}/></button>
              </div>
            ))}
            <div style={{padding:'10px 14px',background:'var(--surface-2)',display:'flex',justifyContent:'flex-end',gap:14,fontSize:13}}>
              <span style={{color:'var(--ink-3)'}}>Custo da receita</span>
              <span className="serif tnum" style={{fontSize:18}}>{window.fmtBRL(custoTotal)}</span>
            </div>
          </div>
        </div>

        {/* Right: live calc panel */}
        <div style={{background:'#fff',borderLeft:'1px solid var(--line)',padding:'28px 24px',overflowY:'auto'}}>
          <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,marginBottom:6}}>Cálculo ao vivo</div>
          <div className="serif" style={{fontSize:22,letterSpacing:'-0.01em',marginBottom:18}}>Preço sugerido</div>

          {/* Big price */}
          <div style={{
            background:'linear-gradient(135deg,#c2603e 0%,#a04a2c 100%)',color:'#fff',
            padding:20,borderRadius:18,marginBottom:18
          }}>
            <div style={{fontSize:11,opacity:0.8,textTransform:'uppercase',letterSpacing:'0.06em'}}>Por marmita</div>
            <div className="serif tnum" style={{fontSize:42,fontWeight:500,letterSpacing:'-0.02em',marginTop:4}}>{window.fmtBRL(precoSugerido)}</div>
            <div style={{height:1,background:'rgba(255,255,255,0.2)',margin:'14px 0'}}/>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.9,marginBottom:5}}>
              <span>Custo</span><span className="tnum">{window.fmtBRL(custoPorcao)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.9,marginBottom:5}}>
              <span>Margem aplicada</span><span className="tnum">+{margem}%</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:12,opacity:0.9,marginBottom:5}}>
              <span>Taxa app</span><span className="tnum">{taxa}%</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginTop:8,paddingTop:8,borderTop:'1px solid rgba(255,255,255,0.2)'}}>
              <span>Lucro líquido / un</span><span className="tnum" style={{fontWeight:600}}>{window.fmtBRL(lucroPorcao)}</span>
            </div>
          </div>

          {/* Sliders */}
          <div className="col gap-4">
            <div>
              <div className="row" style={{fontSize:13,marginBottom:6}}>
                <span>Margem de lucro</span>
                <span className="tnum serif" style={{fontSize:18}}>{margem}%</span>
              </div>
              <input type="range" min="0" max="200" value={margem} onChange={e=>setMargem(+e.target.value)} style={{width:'100%',accentColor:'var(--terracotta)'}}/>
              <div style={{display:'flex',justifyContent:'space-between',fontSize:10,color:'var(--ink-3)',marginTop:4}}>
                <span>0%</span><span>200%</span>
              </div>
            </div>
            <div>
              <div className="row" style={{fontSize:13,marginBottom:6}}>
                <span>Taxa marketplace</span>
                <span className="tnum serif" style={{fontSize:18}}>{taxa}%</span>
              </div>
              <input type="range" min="0" max="35" value={taxa} onChange={e=>setTaxa(+e.target.value)} style={{width:'100%',accentColor:'var(--terracotta)'}}/>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>iFood ~18% · Rappi ~20% · Site próprio 0%</div>
            </div>
          </div>

          <div style={{height:1,background:'var(--line)',margin:'22px 0'}}/>

          <div className="col gap-2" style={{fontSize:13}}>
            <div className="row"><span style={{color:'var(--ink-3)'}}>Insumos</span><span className="tnum">{items.length}</span></div>
            <div className="row"><span style={{color:'var(--ink-3)'}}>Custo total</span><span className="tnum">{window.fmtBRL(custoTotal)}</span></div>
            <div className="row"><span style={{color:'var(--ink-3)'}}>Rendimento</span><span className="tnum">{rendimento} marmitas</span></div>
            <div className="row"><span style={{color:'var(--ink-3)'}}>Faturamento previsto</span><span className="tnum serif" style={{fontSize:15,color:'var(--good)'}}>{window.fmtBRL(precoSugerido*rendimento)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CadastroReceitaB = CadastroReceitaB;
