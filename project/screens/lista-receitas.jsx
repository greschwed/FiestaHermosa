// Lista de Receitas
const ListaReceitas = () => {
  const { RECEITAS, CATEGORIAS_RECEITA } = window.MARMITA_DATA;
  const [filter, setFilter] = React.useState('Todas');
  const filtered = filter==='Todas' ? RECEITAS : RECEITAS.filter(r=>r.cat===filter);

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

      <div className="appbar">
        <h1 className="serif">Receitas</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="search" size={16}/></button>
          <button className="iconbtn"><Icon name="grid" size={16}/></button>
        </div>
      </div>

      <div style={{padding:'0 22px 12px',display:'flex',gap:6,overflowX:'auto'}}>
        {['Todas', ...CATEGORIAS_RECEITA].map(c => (
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:'7px 14px',borderRadius:999,fontSize:13,whiteSpace:'nowrap',
            border:'1px solid '+(filter===c?'var(--ink)':'var(--line)'),
            background:filter===c?'var(--ink)':'var(--surface)',
            color:filter===c?'var(--bg)':'var(--ink-2)',fontWeight:filter===c?500:400
          }}>{c}</button>
        ))}
      </div>

      <div className="scroll" style={{padding:'0 18px 18px'}}>
        <div className="col gap-3">
          {filtered.map(r => (
            <div key={r.id} className="card flush" style={{display:'flex',gap:0,overflow:'hidden'}}>
              <div className="img-placeholder" style={{width:104,minHeight:120,borderRadius:0,fontSize:10,flexShrink:0}}>{r.foto}</div>
              <div style={{padding:14,flex:1,display:'flex',flexDirection:'column',justifyContent:'space-between'}}>
                <div>
                  <div style={{display:'flex',gap:6,alignItems:'center',marginBottom:6}}>
                    <span className={'chip ' + (r.cat==='Fitness'?'olive':r.cat==='Vegano'?'good':'honey')} style={{fontSize:11,padding:'3px 8px'}}>{r.cat}</span>
                    <span style={{fontSize:11,color:'var(--ink-3)'}}>· rende {r.rendimento}</span>
                  </div>
                  <div className="serif" style={{fontSize:17,lineHeight:1.2,letterSpacing:'-0.01em'}}>{r.nome}</div>
                </div>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginTop:10}}>
                  <div>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>Custo/porção</div>
                    <div className="tnum" style={{fontSize:13,fontWeight:500}}>{window.fmtBRL(r.custoPorcao)}</div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontSize:11,color:'var(--ink-3)'}}>Sugerido</div>
                    <div className="serif tnum" style={{fontSize:18,color:'var(--terracotta)'}}>{window.fmtBRL(r.precoSugerido)}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button className="fab"><Icon name="plus" size={22}/></button>

      <div className="bottomnav">
        <button className="navitem"><Icon name="home" size={20}/><span>Início</span></button>
        <button className="navitem"><Icon name="package" size={20}/><span>Insumos</span></button>
        <button className="navitem active"><Icon name="book" size={20}/><span>Receitas</span></button>
        <button className="navitem"><Icon name="chart" size={20}/><span>Relatório</span></button>
      </div>
    </div>
  );
};

window.ListaReceitas = ListaReceitas;
