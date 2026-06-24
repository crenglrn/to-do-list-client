import { useEffect, useState } from 'react'
import { Intercom } from '@intercom/messenger-js-sdk'
import './App.css'

const API = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000'}/todos`

async function apiFetch(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.status === 204 ? null : res.json()
}

export default function App() {
  const [todos, setTodos] = useState([])
  const [text, setText] = useState('')

  useEffect(() => {
    try {
      Intercom({ app_id: 'ocu6xd4k' })
    } catch (e) {
      console.warn('Intercom init failed:', e)
    }
  }, [])

  useEffect(() => {
    apiFetch(API).then(setTodos)
  }, [])

  async function addTodo(e) {
    e.preventDefault()
    if (!text.trim()) return
    const todo = await apiFetch(API, {
      method: 'POST',
      body: JSON.stringify({ todo: { text, done: false } }),
    })
    setTodos(prev => [...prev, todo])
    setText('')
  }

  async function toggleTodo(todo) {
    const updated = await apiFetch(`${API}/${todo.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ todo: { done: !todo.done } }),
    })
    setTodos(prev => prev.map(t => (t.id === updated.id ? updated : t)))
  }

  async function deleteTodo(id) {
    await apiFetch(`${API}/${id}`, { method: 'DELETE' })
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  async function clearCompleted() {
    const completed = todos.filter(t => t.done)
    await Promise.all(completed.map(t => apiFetch(`${API}/${t.id}`, { method: 'DELETE' })))
    setTodos(prev => prev.filter(t => !t.done))
  }

  const remaining = todos.filter(t => !t.done).length
  const hasCompleted = todos.some(t => t.done)

  return (
    <div className="app">
      <h1>todos</h1>
      <form onSubmit={addTodo}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
        />
      </form>
      <ul>
        {todos.map(todo => (
          <li key={todo.id} className={todo.done ? 'done' : ''}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo)}
            />
            <span>{todo.text}</span>
            <button onClick={() => deleteTodo(todo.id)} aria-label="Delete">×</button>
          </li>
        ))}
      </ul>
      {todos.length > 0 && (
        <footer>
          <span>{remaining} item{remaining !== 1 ? 's' : ''} left</span>
          {hasCompleted && (
            <button onClick={clearCompleted}>Clear completed</button>
          )}
        </footer>
      )}
    </div>
  )
}
