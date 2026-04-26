// Cadastro de Insumo — formulário com cálculo automático de custo unitário
const CadastroInsumo = () => {
  const [nome, setNome] = React.useState('Azeite extra-virgem');
  const [cat, setCat] = React.useState('Mercearia');
  const [un, setUn] = React.useState('L');
  const [preco, setPreco] = React.useState('48.90');
  const [qtd, setQtd] = React.useState('0.5');
  const [estoque, setEstoque] = React.useState('1.5');

  const custoUn = (parseFloat(preco)||0) / (parseFloat(qtd)||1);

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
        <button className="iconbtn"><Icon name="arrowLeft" size={18}/></button>
        <span style={{fontSize:14,color:'var(--ink-3)'}}>Novo insumo</span>
        <button className="iconbtn"><Icon name="close" size={16}/></button>
      </div>

      <div className="scroll">
        <div style={{display:'flex',gap:12,alignItems:'center',marginBottom:18}}>
          <div className="img-placeholder" style={{width:64,height:64,borderRadius:16,fontSize:10}}>foto</div>
          <div style={{flex:1}}>
            <h2 className="serif" style={{margin:0,fontSize:22,letterSpacing:'-0.02em'}}>Cadastrar insumo</h2>
            <div style={{fontSize:12,color:'var(--ink-3)',marginTop:2}}>Custo unitário é calculado automaticamente</div>
          </div>
        </div>

        <div className="col gap-4">
          <div className="field">
            <label>Nome do insumo</label>
            <input value={nome} onChange={e=>setNome(e.target.value)}/>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div className="field">
              <label>Categoria</label>
              <select value={cat} onChange={e=>setCat(e.target.value)}>
                {window.MARMITA_DATA.CATEGORIAS_INSUMO.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Unidade</label>
              <select value={un} onChange={e=>setUn(e.target.value)}>
                {window.MARMITA_DATA.UNIDADES.map(u=><option key={u}>{u}</option>)}
              </select>
            </div>
          </div>

          <div className="card-soft" style={{background:'var(--terracotta-bg)',padding:14}}>
            <div style={{fontSize:11,color:'var(--terracotta)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,marginBottom:8}}>Compra de referência</div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div className="field">
                <label>Preço pago</label>
                <div className="input-prefix">
                  <span className="prefix">R$</span>
                  <input value={preco} onChange={e=>setPreco(e.target.value)} type="text"/>
                </div>
              </div>
              <div className="field">
                <label>Quantidade</label>
                <div className="input-prefix">
                  <input value={qtd} onChange={e=>setQtd(e.target.value)} type="text"/>
                  <span className="prefix" style={{borderRight:'none',borderLeft:'1px solid var(--line)'}}>{un}</span>
                </div>
              </div>
            </div>

            <div style={{
              display:'flex',justifyContent:'space-between',alignItems:'center',
              marginTop:14,padding:'12px 14px',borderRadius:10,
              background:'#fff',border:'1px dashed var(--terracotta-soft)'
            }}>
              <div>
                <div style={{fontSize:11,color:'var(--ink-3)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Custo unitário</div>
                <div style={{fontSize:11,color:'var(--ink-3)',marginTop:2}}>R$ {preco} ÷ {qtd} {un}</div>
              </div>
              <div className="serif tnum" style={{fontSize:24,color:'var(--terracotta)',fontWeight:500}}>
                R$ {custoUn.toFixed(2).replace('.',',')}<span style={{fontSize:13,color:'var(--ink-3)'}}>/{un}</span>
              </div>
            </div>
          </div>

          <div className="field">
            <label>Estoque atual</label>
            <div className="input-prefix">
              <input value={estoque} onChange={e=>setEstoque(e.target.value)}/>
              <span className="prefix" style={{borderRight:'none',borderLeft:'1px solid var(--line)'}}>{un}</span>
            </div>
            <div className="hint">Última compra: 24 abr 2026</div>
          </div>
        </div>

        <div style={{display:'flex',gap:8,marginTop:24}}>
          <button className="btn btn-ghost" style={{flex:1,justifyContent:'center'}}>Cancelar</button>
          <button className="btn btn-primary" style={{flex:2,justifyContent:'center'}}>
            <Icon name="check" size={16}/> Salvar insumo
          </button>
        </div>
      </div>
    </div>
  );
};

window.CadastroInsumo = CadastroInsumo;
