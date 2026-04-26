// Cadastro de Receita — Variação C: editorial / serif-heavy, "ficha técnica de chef"
// Vibe de receituário tipográfico, com "recibo" calculado lateralmente
const CadastroReceitaC = () => {
  const { INSUMOS } = window.MARMITA_DATA;
  const [nome, setNome] = React.useState('Salmão grelhado com legumes');
  const [rendimento, setRendimento] = React.useState(4);
  const [margem, setMargem] = React.useState(50);
  const [taxa, setTaxa] = React.useState(18);
  const [items, setItems] = React.useState([
    { id: 'i14', qtd: 0.8 },
    { id: 'i12', qtd: 0.4 },
    { id: 'i5', qtd: 0.3 },
    { id: 'i9', qtd: 0.06 },
    { id: 'i7', qtd: 0.03 },
    { id: 'i10', qtd: 0.01 },
    { id: 'i11', qtd: 4 },
  ]);

  const detalhados = items.map(it => {
    const ins = INSUMOS.find(i => i.id === it.id);
    return { ...ins, qtd: it.qtd, custo: it.qtd * ins.custoUn };
  });
  const custoTotal = detalhados.reduce((s,d)=>s+d.custo, 0);
  const custoPorcao = custoTotal / rendimento;
  const precoBruto = custoPorcao * (1 + margem/100);
  const precoSugerido = precoBruto / (1 - taxa/100);

  const setQtd = (id, qtd) => setItems(items.map(it=>it.id===id?{...it,qtd}:it));

  return (
    <div className="frame" style={{background:'#f4ede4',display:'flex',flexDirection:'column'}}>
      {/* Slim top */}
      <div style={{display:'flex',alignItems:'center',padding:'14px 24px',borderBottom:'1px solid var(--line)',background:'#fbf7f1',flexShrink:0,gap:12}}>
        <button className="iconbtn" style={{background:'transparent',border:'none'}}><Icon name="arrowLeft" size={18}/></button>
        <div style={{flex:1,fontSize:13,color:'var(--ink-3)'}}>
          <span className="serif" style={{fontStyle:'italic',fontSize:15,color:'var(--ink-2)'}}>nº 014</span>
          <span style={{margin:'0 8px',opacity:0.4}}>—</span>
          rascunho · salvo automaticamente
        </div>
        <button className="btn btn-primary btn-sm"><Icon name="check" size={14}/>Publicar receita</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1.5fr 1fr',flex:1,minHeight:0}}>
        {/* Left: editorial */}
        <div style={{padding:'40px 56px',overflowY:'auto',background:'#fbf7f1'}}>
          <div className="serif" style={{fontStyle:'italic',color:'var(--terracotta)',fontSize:14,letterSpacing:'0.02em',marginBottom:6}}>fitness · marmita 750ml</div>
          <input value={nome} onChange={e=>setNome(e.target.value)} className="serif" style={{
            width:'100%',fontSize:54,padding:0,border:'none',outline:'none',
            letterSpacing:'-0.025em',background:'transparent',lineHeight:1.05,marginBottom:14,fontWeight:400
          }}/>
          <div style={{display:'flex',gap:24,fontSize:13,color:'var(--ink-3)',marginBottom:36,alignItems:'center'}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Icon name="users" size={14}/> rendimento <input type="number" value={rendimento} onChange={e=>setRendimento(+e.target.value||1)} style={{width:36,border:'none',background:'transparent',borderBottom:'1px dotted var(--ink-3)',outline:'none',fontFamily:'inherit',color:'var(--ink)'}} className="tnum"/> porções</span>
            <span style={{opacity:0.4}}>·</span>
            <span style={{display:'inline-flex',alignItems:'center',gap:6}}><Icon name="timer" size={14}/> 30 min</span>
          </div>

          {/* Ingredient list as editorial */}
          <div className="serif" style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:14}}>i. ingredientes</div>
          <div style={{borderTop:'1px solid var(--line-2)'}}>
            {detalhados.map((d, i)=>(
              <div key={d.id} style={{display:'grid',gridTemplateColumns:'24px 1fr 100px 80px',alignItems:'center',padding:'14px 0',borderBottom:'1px solid var(--line-2)',gap:12}}>
                <div className="serif tnum" style={{fontSize:12,color:'var(--ink-4)',fontStyle:'italic'}}>{String(i+1).padStart(2,'0')}</div>
                <div className="serif" style={{fontSize:18,letterSpacing:'-0.01em'}}>{d.nome}</div>
                <div style={{display:'flex',alignItems:'baseline',gap:4,justifyContent:'flex-end'}}>
                  <input type="number" value={d.qtd} onChange={e=>setQtd(d.id,+e.target.value||0)} step="0.01" className="serif tnum" style={{width:60,border:'none',background:'transparent',borderBottom:'1px dotted var(--ink-4)',outline:'none',fontSize:18,textAlign:'right',color:'var(--ink)'}}/>
                  <span style={{fontSize:12,color:'var(--ink-3)'}}>{d.un}</span>
                </div>
                <div className="serif tnum" style={{fontSize:14,color:'var(--ink-3)',textAlign:'right',fontStyle:'italic'}}>{window.fmtBRL(d.custo)}</div>
              </div>
            ))}
            <button style={{
              width:'100%',padding:'14px 0',background:'none',border:'none',color:'var(--terracotta)',
              fontSize:13,display:'flex',alignItems:'center',justifyContent:'center',gap:6,
              fontStyle:'italic',fontFamily:'Instrument Serif, serif'
            }}><Icon name="plus" size={14}/>adicionar ingrediente</button>
          </div>

          <div style={{height:24}}/>
          <div className="serif" style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:14}}>ii. modo de preparo</div>
          <div style={{borderTop:'1px solid var(--line-2)',paddingTop:18,fontSize:14,lineHeight:1.7,color:'var(--ink-2)'}}>
            <p style={{margin:'0 0 14px'}}><span className="serif" style={{fontStyle:'italic',color:'var(--terracotta)',fontSize:13,marginRight:6}}>i.</span>Tempere os filés de salmão com sal e limão. Reserve por 15 minutos.</p>
            <p style={{margin:'0 0 14px'}}><span className="serif" style={{fontStyle:'italic',color:'var(--terracotta)',fontSize:13,marginRight:6}}>ii.</span>Corte os legumes em cubos médios e regue com azeite e ervas.</p>
            <p style={{margin:'0 0 14px',color:'var(--ink-4)',fontStyle:'italic'}}>+ adicione mais um passo...</p>
          </div>
        </div>

        {/* Right: receipt-style sidebar */}
        <div style={{
          padding:'40px 36px 40px 32px',overflowY:'auto',
          background:'#f4ede4',
          borderLeft:'1px dashed var(--line-2)'
        }}>
          <div className="serif" style={{fontSize:11,letterSpacing:'0.16em',textTransform:'uppercase',color:'var(--ink-3)',marginBottom:8}}>cálculo da receita</div>
          <div className="serif" style={{fontSize:30,letterSpacing:'-0.02em',lineHeight:1,marginBottom:24}}>recibo</div>

          {/* Receipt entries */}
          <div style={{fontSize:13,fontFamily:'JetBrains Mono, monospace'}}>
            {detalhados.map(d=>(
              <div key={d.id} style={{display:'flex',justifyContent:'space-between',padding:'5px 0',borderBottom:'1px dotted var(--line-2)'}}>
                <span style={{color:'var(--ink-2)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:'60%'}}>{d.nome.toLowerCase()}</span>
                <span className="tnum">{window.fmtBRL(d.custo)}</span>
              </div>
            ))}
            <div style={{display:'flex',justifyContent:'space-between',padding:'10px 0 5px',marginTop:6,borderTop:'1.5px solid var(--ink-2)',fontSize:13}}>
              <span style={{color:'var(--ink-2)'}}>SUBTOTAL</span>
              <span className="tnum" style={{fontWeight:600}}>{window.fmtBRL(custoTotal)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',color:'var(--ink-3)'}}>
              <span>÷ {rendimento} porções</span>
              <span className="tnum">{window.fmtBRL(custoPorcao)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',color:'var(--ink-3)'}}>
              <span>+ margem {margem}%</span>
              <span className="tnum">+{window.fmtBRL(custoPorcao*margem/100)}</span>
            </div>
            <div style={{display:'flex',justifyContent:'space-between',padding:'5px 0',color:'var(--ink-3)'}}>
              <span>+ taxa app {taxa}%</span>
              <span className="tnum">+{window.fmtBRL(precoSugerido - precoBruto)}</span>
            </div>
          </div>

          <div style={{borderTop:'2px dashed var(--ink-3)',marginTop:14,paddingTop:14}}>
            <div style={{fontSize:11,letterSpacing:'0.1em',textTransform:'uppercase',color:'var(--ink-3)',fontFamily:'JetBrains Mono, monospace'}}>preço sugerido</div>
            <div className="serif tnum" style={{fontSize:48,letterSpacing:'-0.02em',color:'var(--terracotta)',lineHeight:1,marginTop:4}}>{window.fmtBRL(precoSugerido)}</div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4,fontFamily:'JetBrains Mono, monospace'}}>por marmita</div>
          </div>

          {/* Tweakables */}
          <div style={{marginTop:30,padding:18,background:'#fbf7f1',borderRadius:12,border:'1px solid var(--line)'}}>
            <div className="serif" style={{fontSize:13,fontStyle:'italic',color:'var(--ink-3)',marginBottom:14}}>ajuste fino</div>
            <div className="col gap-3">
              <div>
                <div className="row" style={{fontSize:12,marginBottom:4}}>
                  <span className="muted">margem</span>
                  <span className="tnum serif" style={{fontSize:16}}>{margem}%</span>
                </div>
                <input type="range" min="0" max="200" value={margem} onChange={e=>setMargem(+e.target.value)} style={{width:'100%',accentColor:'var(--terracotta)'}}/>
              </div>
              <div>
                <div className="row" style={{fontSize:12,marginBottom:4}}>
                  <span className="muted">taxa app</span>
                  <span className="tnum serif" style={{fontSize:16}}>{taxa}%</span>
                </div>
                <input type="range" min="0" max="35" value={taxa} onChange={e=>setTaxa(+e.target.value)} style={{width:'100%',accentColor:'var(--terracotta)'}}/>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

window.CadastroReceitaC = CadastroReceitaC;
