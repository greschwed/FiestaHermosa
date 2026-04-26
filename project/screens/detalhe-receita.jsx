// Detalhe da receita / Ficha técnica
const DetalheReceita = () => {
  const { RECEITAS, INSUMOS } = window.MARMITA_DATA;
  const r = RECEITAS[0]; // Frango grelhado

  const ingredientesDetalhados = r.ingredientes.map(ing => {
    const ins = INSUMOS.find(i => i.id === ing.id);
    return { ...ins, qtd: ing.qtd, custo: ing.qtd * ins.custoUn };
  });

  return (
    <div className="frame mobile">
      <div className="statusbar">
        <span>9:41</span>
        <span className="icons">
          <span style={{width:14,height:7,border:'1.4px solid #2a1f17',borderRadius:2,position:'relative'}}>
            <span style={{position:'absolute',inset:1,background:'#2a1f17',width:'80%',borderRadius:1}}></span>
          </span>
        </span>
      </div>

      {/* Hero image */}
      <div style={{position:'relative',height:220,flexShrink:0}}>
        <div className="img-placeholder" style={{position:'absolute',inset:0,borderRadius:0,fontSize:12}}>foto do prato finalizado</div>
        <div style={{position:'absolute',top:14,left:14,right:14,display:'flex',justifyContent:'space-between'}}>
          <button className="iconbtn" style={{background:'rgba(255,255,255,0.92)',border:'none'}}><Icon name="arrowLeft" size={18}/></button>
          <div style={{display:'flex',gap:6}}>
            <button className="iconbtn" style={{background:'rgba(255,255,255,0.92)',border:'none'}}><Icon name="edit" size={16}/></button>
            <button className="iconbtn" style={{background:'rgba(255,255,255,0.92)',border:'none'}}><Icon name="receipt" size={16}/></button>
          </div>
        </div>
      </div>

      <div className="scroll" style={{padding:'18px 18px',marginTop:-24,background:'var(--bg)',borderTopLeftRadius:24,borderTopRightRadius:24,position:'relative',zIndex:2}}>
        <span className="chip olive" style={{marginBottom:8}}>{r.cat}</span>
        <h2 className="serif" style={{fontSize:26,margin:'8px 0 4px',letterSpacing:'-0.02em',lineHeight:1.15}}>{r.nome}</h2>
        <div style={{display:'flex',gap:14,fontSize:13,color:'var(--ink-3)',marginBottom:16,alignItems:'center'}}>
          <span><Icon name="users" size={13}/> rende {r.rendimento}</span>
          <span style={{opacity:0.4}}>·</span>
          <span><Icon name="timer" size={13}/> 35 min</span>
        </div>

        {/* Cost breakdown card — most important */}
        <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16,borderColor:'var(--terracotta-soft)'}}>
          <div style={{padding:'14px 16px',background:'var(--terracotta-bg)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
            <div>
              <div style={{fontSize:11,color:'var(--terracotta)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600}}>Preço sugerido</div>
              <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>com margem de {r.margem}% e taxa {r.taxaApp}%</div>
            </div>
            <div className="serif tnum" style={{fontSize:30,color:'var(--terracotta)',fontWeight:500}}>{window.fmtBRL(r.precoSugerido)}</div>
          </div>
          <div style={{padding:14,display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase'}}>Custo total</div>
              <div className="serif tnum" style={{fontSize:16}}>{window.fmtBRL(r.custoTotal)}</div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase'}}>Por porção</div>
              <div className="serif tnum" style={{fontSize:16}}>{window.fmtBRL(r.custoPorcao)}</div>
            </div>
            <div>
              <div style={{fontSize:10,color:'var(--ink-3)',textTransform:'uppercase'}}>Lucro/un</div>
              <div className="serif tnum" style={{fontSize:16,color:'var(--good)'}}>{window.fmtBRL(r.precoSugerido*0.82 - r.custoPorcao)}</div>
            </div>
          </div>
        </div>

        <div className="serif" style={{fontSize:18,marginBottom:8}}>Ingredientes</div>
        <div className="card flush" style={{marginBottom:16}}>
          {ingredientesDetalhados.map((ing,i)=>(
            <div key={ing.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 14px',borderBottom:i<ingredientesDetalhados.length-1?'1px solid var(--line)':'none'}}>
              <div style={{display:'flex',gap:10,alignItems:'center'}}>
                <span style={{fontSize:18}}>{ing.emoji}</span>
                <div>
                  <div style={{fontSize:14}}>{ing.nome}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>{window.fmtNum(ing.qtd, ing.un==='un'?0:3)} {ing.un}</div>
                </div>
              </div>
              <div className="tnum" style={{fontSize:13,color:'var(--ink-2)'}}>{window.fmtBRL(ing.custo)}</div>
            </div>
          ))}
        </div>

        <div className="serif" style={{fontSize:18,marginBottom:8}}>Modo de preparo</div>
        <div className="col gap-3" style={{marginBottom:24}}>
          {r.preparo.map((p,i)=>(
            <div key={i} style={{display:'flex',gap:12,alignItems:'flex-start'}}>
              <div style={{
                width:26,height:26,borderRadius:'50%',background:'var(--terracotta)',color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:600,flexShrink:0
              }}>{i+1}</div>
              <div style={{fontSize:14,lineHeight:1.5,color:'var(--ink-2)',paddingTop:3}}>{p}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

window.DetalheReceita = DetalheReceita;
