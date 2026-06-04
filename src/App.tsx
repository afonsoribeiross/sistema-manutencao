import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

type Status = "normal" | "alerta" | "falha"

interface Maquina {
  id?: number
  nome: string
  status: Status
  temperatura: number
}

function App() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([])
  const [nome, setNome] = useState("")
  const [status, setStatus] = useState<Status>("normal")
  const [temperatura, setTemperatura] = useState("")
  const [filtro, setFiltro] = useState<Status | "todos">("todos")
  const [maquinaSelecionada, setMaquinaSelecionada] = useState<number | null>(null)
  const [leituras, setLeituras] = useState<any[]>([])

  useEffect(() => {
    buscarMaquinas()
  }, [])

  async function buscarMaquinas() {
    const { data, error } = await supabase.from("maquinas").select("*")
    if (error) console.error(error)
    else setMaquinas(data as Maquina[])
  }

  async function adicionarMaquina() {
    if (!nome || !temperatura) {
      alert("Preencha todos os campos!")
      return
    }
    const { error } = await supabase.from("maquinas").insert([
      { nome, status, temperatura: Number(temperatura) }
    ])
    if (error) console.error(error)
    else {
      setNome("")
      setTemperatura("")
      buscarMaquinas()
    }
  }

  async function excluirMaquina(id: number) {
    const { error } = await supabase.from("maquinas").delete().eq("id", id)
    if (error) console.error(error)
    else buscarMaquinas()
  }

  async function registrarLeitura(maquina: Maquina) {
    const { error } = await supabase.from("leituras").insert([
      {
        maquina_id: maquina.id,
        temperatura: maquina.temperatura,
        status: maquina.status
      }
    ])
    if (error) console.error(error)
    else alert(`Leitura de ${maquina.nome} registrada!`)
  }

  async function verLeituras(id: number) {
    if (maquinaSelecionada === id) {
      setMaquinaSelecionada(null)
      setLeituras([])
      return
    }
    const { data, error } = await supabase
      .from("leituras")
      .select("*")
      .eq("maquina_id", id)
      .order("created_at", { ascending: true })
    if (error) console.error(error)
    else {
      setLeituras(data)
      setMaquinaSelecionada(id)
    }
  }
  
  function calcularPrevisao(leituras: any[]): string {
    if (leituras.length < 2) return "Registre mais leituras para calcular tendência"
  
    const n = leituras.length
    const temperaturas = leituras.map((l, i) => ({ x: i, y: l.temperatura }))
    
    const somaX = temperaturas.reduce((acc, p) => acc + p.x, 0)
    const somaY = temperaturas.reduce((acc, p) => acc + p.y, 0)
    const somaXY = temperaturas.reduce((acc, p) => acc + p.x * p.y, 0)
    const somaX2 = temperaturas.reduce((acc, p) => acc + p.x * p.x, 0)
    
    const inclinacao = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX)
    
    if (Math.abs(inclinacao) < 0.1) return "Temperatura estável"
    
    if (inclinacao < 0) return `Temperatura em queda (${inclinacao.toFixed(2)}°C por leitura)`
    
    const limite = 90
    const ultimaTemp = leituras[leituras.length - 1].temperatura
    const leiturasRestantes = Math.ceil((limite - ultimaTemp) / inclinacao)
    
    if (leiturasRestantes <= 0) return "⚠️ Temperatura já acima do limite crítico!"
    
    return `🔺 Subindo ${inclinacao.toFixed(2)}°C por leitura — limite de ${limite}°C em ~${leiturasRestantes} leituras`
}

  const totalFalhas = maquinas.filter(m => m.status === "falha").length
  const totalAlertas = maquinas.filter(m => m.status === "alerta").length
  const totalNormais = maquinas.filter(m => m.status === "normal").length

  const maquinasFiltradas = filtro === "todos"
    ? maquinas
    : maquinas.filter(m => m.status === filtro)

  return (
    <div className="container">
      <h1>Sistema de Manutenção Industrial</h1>

      <div className="contador">
        <div className="contador-item">
          <span className="contador-numero">{maquinas.length}</span>
          <span className="contador-label">Total</span>
        </div>
        <div className="contador-item">
          <span className="contador-numero status-normal">{totalNormais}</span>
          <span className="contador-label">Normais</span>
        </div>
        <div className="contador-item">
          <span className="contador-numero status-alerta">{totalAlertas}</span>
          <span className="contador-label">Alertas</span>
        </div>
        <div className="contador-item">
          <span className="contador-numero status-falha">{totalFalhas}</span>
          <span className="contador-label">Falhas</span>
        </div>
      </div>

      <div className="formulario">
        <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Nome da máquina" />
        <select value={status} onChange={e => setStatus(e.target.value as Status)}>
          <option value="normal">Normal</option>
          <option value="alerta">Alerta</option>
          <option value="falha">Falha</option>
        </select>
        <input value={temperatura} onChange={e => setTemperatura(e.target.value)} placeholder="Temperatura °C" type="number" />
        <button onClick={adicionarMaquina}>Adicionar</button>
      </div>

      <div className="filtros">
        {(["todos", "normal", "alerta", "falha"] as const).map(f => (
          <button key={f} onClick={() => setFiltro(f)}>{f}</button>
        ))}
      </div>

      <div className="lista">
        {maquinasFiltradas.map((m) => (
          <div key={m.id}>
            <div className="maquina" onClick={() => verLeituras(m.id!)} style={{ cursor: 'pointer' }}>
              <span>{m.nome}</span>
              <span className={`status-${m.status}`}>{m.status.toUpperCase()}</span>
              <span>{m.temperatura}°C</span>
              <button onClick={(e) => { e.stopPropagation(); registrarLeitura(m) }} className="btn-leitura">📊</button>
              <button onClick={(e) => { e.stopPropagation(); excluirMaquina(m.id!) }} className="btn-excluir">✕</button>
            </div>

            {maquinaSelecionada === m.id && leituras.length > 0 && (
              <div className="grafico">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={leituras}>
                    <XAxis dataKey="created_at" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperatura" stroke="#00d4ff" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {maquinaSelecionada === m.id && leituras.length > 0 && (
              <div className="grafico">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={leituras}>
                    <XAxis dataKey="created_at" hide />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="temperatura" stroke="#00d4ff" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
                <p className="previsao">{calcularPrevisao(leituras)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default App