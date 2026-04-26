// Dashboard — visão geral mobile
const Dashboard = () => {
  const { RECEITAS, INSUMOS } = window.MARMITA_DATA;
  const totalReceitas = RECEITAS.length;
  const totalInsumos = INSUMOS.length;
  const estoqueBaixo = INSUMOS.filter(i => i.estoque < 2).length;
  const custoMedio = (RECEITAS.reduce((s,r)=>s+r.custoPorcao,0)/RECEITAS.length).toFixed(2);

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

      <div style={{padding:'8px 22px 18px',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:13,color:'var(--ink-3)'}}>Olá, Marina 👋</div>
          <h1 className="serif" style={{margin:'2px 0 0',fontSize:30,letterSpacing:'-0.02em'}}>Cozinha de hoje</h1>
        </div>
        <button className="iconbtn" style={{width:42,height:42,background:'var(--terracotta-bg)',border:'none',color:'var(--terracotta)'}}>
          <Icon name="user" size={18}/>
        </button>
      </div>

      <div className="scroll" style={{padding:'0 18px 18px'}}>
        {/* Hero card */}
        <div style={{
          background:'linear-gradient(135deg, #c2603e 0%, #a04a2c 100%)',
          borderRadius:20,padding:20,color:'#fff',marginBottom:14,position:'relative',overflow:'hidden'
        }}>
          <div style={{position:'absolute',right:-30,top:-30,width:140,height:140,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}}/>
          <div style={{position:'absolute',right:30,bottom:-20,width:80,height:80,borderRadius:'50%',background:'rgba(255,255,255,0.06)'}}/>
          <div style={{fontSize:12,opacity:0.85,textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:500}}>Produção da semana</div>
          <div className="serif" style={{fontSize:38,marginTop:6,letterSpacing:'-0.02em'}}>248 marmitas</div>
          <div style={{display:'flex',gap:14,marginTop:14,fontSize:13}}>
            <div><span style={{opacity:0.75}}>Custo</span> <strong>R$ 1.184,40</strong></div>
            <div style={{opacity:0.4}}>•</div>
            <div><span style={{opacity:0.75}}>Receita</span> <strong>R$ 5.892,00</strong></div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:14}}>
          <div className="card" style={{padding:14}}>
            <Icon name="book" size={18} color="var(--olive)"/>
            <div style={{fontSize:22,fontWeight:600,marginTop:8}} className="serif">{totalReceitas}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>Receitas ativas</div>
          </div>
          <div className="card" style={{padding:14}}>
            <Icon name="package" size={18} color="var(--terracotta)"/>
            <div style={{fontSize:22,fontWeight:600,marginTop:8}} className="serif">{totalInsumos}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>Insumos</div>
          </div>
          <div className="card" style={{padding:14}}>
            <Icon name="trending" size={18} color="var(--good)"/>
            <div style={{fontSize:22,fontWeight:600,marginTop:8}} className="serif">R$ {custoMedio.replace('.',',')}</div>
            <div style={{fontSize:12,color:'var(--ink-3)'}}>Custo médio/porção</div>
          </div>
          <div className="card" style={{padding:14,background:estoqueBaixo>0?'var(--warn-bg)':'var(--surface)',borderColor:estoqueBaixo>0?'var(--warn)':'var(--line)'}}>
            <Icon name="info" size={18} color={estoqueBaixo>0?'var(--warn)':'var(--ink-3)'}/>
            <div style={{fontSize:22,fontWeight:600,marginTop:8}} className="serif">{estoqueBaixo}</div>
            <div style={{fontSize:12,color:estoqueBaixo>0?'var(--warn)':'var(--ink-3)'}}>Estoque baixo</div>
          </div>
        </div>

        {/* Top receitas */}
        <div className="row" style={{marginBottom:10}}>
          <div className="serif" style={{fontSize:20}}>Mais vendidas</div>
          <button className="btn-ghost" style={{background:'none',border:'none',color:'var(--terracotta)',fontSize:13,padding:0}}>Ver todas</button>
        </div>
        <div className="card flush" style={{padding:0}}>
          {RECEITAS.slice(0,4).map((r, i) => (
            <div key={r.id} style={{display:'flex',alignItems:'center',gap:12,padding:12,borderBottom:i<3?'1px solid var(--line)':'none'}}>
              <div className="img-placeholder" style={{width:46,height:46,fontSize:9}}>img</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:14,fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{r.nome}</div>
                <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>
                  Custo {window.fmtBRL(r.custoPorcao)} · margem {r.margem}%
                </div>
              </div>
              <div style={{textAlign:'right'}}>
                <div className="serif" style={{fontSize:17,color:'var(--terracotta)'}}>{window.fmtBRL(r.precoSugerido)}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{height:14}}/>

        {/* Compras urgentes */}
        <div className="row" style={{marginBottom:10}}>
          <div className="serif" style={{fontSize:20}}>Repor estoque</div>
        </div>
        <div className="card-soft">
          {INSUMOS.filter(i=>i.estoque<2).slice(0,3).map((ins, i, arr)=>(
            <div key={ins.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:i<arr.length-1?'1px dashed var(--line-2)':'none'}}>
              <div>
                <div style={{fontSize:14,fontWeight:500}}>{ins.emoji} {ins.nome}</div>
                <div style={{fontSize:12,color:'var(--ink-3)'}}>{window.fmtNum(ins.estoque)} {ins.un} restantes</div>
              </div>
              <span className="chip warn">baixo</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bottomnav">
        <button className="navitem active"><Icon name="home" size={20}/><span>Início</span></button>
        <button className="navitem"><Icon name="package" size={20}/><span>Insumos</span></button>
        <button className="navitem"><Icon name="book" size={20}/><span>Receitas</span></button>
        <button className="navitem"><Icon name="chart" size={20}/><span>Relatório</span></button>
      </div>
    </div>
  );
};

window.Dashboard = Dashboard;
