// Lista de Insumos
const ListaInsumos = () => {
  const { INSUMOS, CATEGORIAS_INSUMO } = window.MARMITA_DATA;
  const [filter, setFilter] = React.useState('Todos');
  const [search, setSearch] = React.useState('');

  const filtered = INSUMOS.filter(i => {
    if (filter !== 'Todos' && i.cat !== filter) return false;
    if (search && !i.nome.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="frame mobile">
      <div className="statusbar">
        <span>9:41</span>
        <span className="icons">
          <Icon name="bell" size={14}/>
          <span style={{width:14,height:7,border:'1.4px solid #2a1f17',borderRadius:2,position:'relative'}}>
            <span style={{position:'absolute',inset:1,background:'#2a1f17',width:'80%',borderRadius:1}}></span>
          </span>
        </span>
      </div>

      <div className="appbar">
        <h1 className="serif">Insumos</h1>
        <div className="actions">
          <button className="iconbtn"><Icon name="search" size={16}/></button>
          <button className="iconbtn"><Icon name="filter" size={16}/></button>
        </div>
      </div>

      <div style={{padding:'0 22px 12px'}}>
        <div className="input-prefix" style={{borderRadius:12}}>
          <span className="prefix" style={{background:'transparent',border:'none'}}>
            <Icon name="search" size={16} color="var(--ink-3)"/>
          </span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar insumo..."/>
        </div>
      </div>

      <div style={{padding:'0 22px 8px',display:'flex',gap:6,overflowX:'auto'}}>
        {['Todos', ...CATEGORIAS_INSUMO.slice(0,5)].map(c => (
          <button key={c} onClick={()=>setFilter(c)} style={{
            padding:'7px 14px',borderRadius:999,fontSize:13,whiteSpace:'nowrap',
            border:'1px solid '+(filter===c?'var(--terracotta)':'var(--line)'),
            background:filter===c?'var(--terracotta)':'var(--surface)',
            color:filter===c?'#fff':'var(--ink-2)',fontWeight:filter===c?500:400
          }}>{c}</button>
        ))}
      </div>

      <div className="scroll">
        <div style={{display:'flex',justifyContent:'space-between',padding:'8px 4px',alignItems:'baseline'}}>
          <span style={{fontSize:13,color:'var(--ink-3)'}}>{filtered.length} insumos</span>
          <span style={{fontSize:12,color:'var(--ink-3)'}}>Custo total estoque <strong className="serif" style={{color:'var(--ink)',fontSize:14}}>R$ 4.182,30</strong></span>
        </div>
        <div className="card flush">
          {filtered.map((ins, i) => {
            const baixo = ins.estoque < 2;
            return (
              <div key={ins.id} style={{display:'flex',alignItems:'center',gap:12,padding:'14px 14px',borderBottom:i<filtered.length-1?'1px solid var(--line)':'none'}}>
                <div style={{
                  width:42,height:42,borderRadius:12,background:'var(--surface-2)',
                  display:'flex',alignItems:'center',justifyContent:'center',fontSize:22
                }}>{ins.emoji}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    <span style={{fontSize:14,fontWeight:500}}>{ins.nome}</span>
                    {baixo && <span className="chip warn" style={{padding:'2px 7px',fontSize:10}}>baixo</span>}
                  </div>
                  <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>
                    {ins.cat} · {window.fmtNum(ins.estoque)} {ins.un} em estoque
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="serif tnum" style={{fontSize:16}}>{window.fmtBRL(ins.custoUn)}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)'}}>/{ins.un}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button className="fab"><Icon name="plus" size={22}/></button>

      <div className="bottomnav">
        <button className="navitem"><Icon name="home" size={20}/><span>Início</span></button>
        <button className="navitem active"><Icon name="package" size={20}/><span>Insumos</span></button>
        <button className="navitem"><Icon name="book" size={20}/><span>Receitas</span></button>
        <button className="navitem"><Icon name="chart" size={20}/><span>Relatório</span></button>
      </div>
    </div>
  );
};

window.ListaInsumos = ListaInsumos;
