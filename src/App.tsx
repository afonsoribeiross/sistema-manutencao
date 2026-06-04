import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import './App.css'

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
        {maquinasFiltradas.map((m) => (
          <div key={m.id} className="maquina">
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