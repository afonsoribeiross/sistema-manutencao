import { useState } from 'react'
import './App.css'

type Status = "normal" | "alerta" | "falha"

interface Maquina {
  nome: string
  status: Status
  temperatura: number
}

const maquinasIniciais: Maquina[] = [
  { nome: "Compressor A", status: "falha", temperatura: 87 },
  { nome: "Bomba B", status: "normal", temperatura: 45 },
  { nome: "Motor C", status: "alerta", temperatura: 72 }
]

function App() {
  const [maquinas, setMaquinas] = useState<Maquina[]>(maquinasIniciais)
  const [nome, setNome] = useState("")
  const [status, setStatus] = useState<Status>("normal")
  const [temperatura, setTemperatura] = useState("")
  const [filtro, setFiltro] = useState<Status | "todos">("todos")

  function adicionarMaquina() {
    if (!nome || !temperatura) {
      alert("Preencha todos os campos!")
      return
    }
    const nova: Maquina = { nome, status, temperatura: Number(temperatura) }
    setMaquinas([...maquinas, nova])
    setNome("")
    setTemperatura("")
  }

  const maquinasFiltradas = filtro === "todos"
    ? maquinas
    : maquinas.filter(m => m.status === filtro)

  return (
    <div className="container">
      <h1>Sistema de Manutenção Industrial</h1>

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
        {maquinasFiltradas.map((m, i) => (
          <div key={i} className="maquina">
            <span>{m.nome}</span>
            <span className={`status-${m.status}`}>{m.status.toUpperCase()}</span>
            <span>{m.temperatura}°C</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App