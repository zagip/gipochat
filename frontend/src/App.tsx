import { useState, useEffect, useRef } from 'react'
import Draggable from 'react-draggable'
import { Resizable } from 're-resizable'

function App() {
  const [messages, setMessages] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [username, setUsername] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [windowSize, setWindowSize] = useState({ width: 768, height: 600 })
  const [isMaximized, setIsMaximized] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [previousPosition, setPreviousPosition] = useState({ x: 0, y: 0 })
  const [previousSize, setPreviousSize] = useState({ width: 768, height: 600 })
  const [loginPosition, setLoginPosition] = useState({ x: 0, y: 0 })
  const wsRef = useRef<WebSocket | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // WebSocket connection setup
  useEffect(() => {
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
    wsRef.current = new WebSocket(wsUrl)
    
    wsRef.current.onopen = () => {
      console.log('Connected to WebSocket')
    }

    wsRef.current.onmessage = (event) => {
      setMessages(prev => [...prev, event.data])
    }

    wsRef.current.onclose = () => {
      console.log('Disconnected from WebSocket')
      if (isConnected) {
        setMessages(prev => [...prev, 'Disconnected from server...'])
        setIsConnected(false)
      }
    }

    return () => {
      wsRef.current?.close()
    }
  }, [])

  // Matrix background effect
  useEffect(() => {
    const canvas = document.getElementById('matrix') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%';
    const fontSize = 10;
    const columns = canvas.width / fontSize;
    const drops: number[] = [];

    for (let x = 0; x < columns; x++) {
      drops[x] = 1;
    }

    function draw() {
      if (ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#0F0';
        ctx.font = fontSize + 'px monospace';

        for (let i = 0; i < drops.length; i++) {
          const text = letters[Math.floor(Math.random() * letters.length)];
          ctx.fillText(text, i * fontSize, drops[i] * fontSize);

          if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
            drops[i] = 0;
          }

          drops[i]++;
        }
      }
    }

    const interval = setInterval(draw, 33);
    return () => clearInterval(interval);
  }, []);

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (username.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(username.trim())
      setIsConnected(true)
      setMessages(prev => [...prev, 'Connected to server...'])
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(input.trim())
      setInput('')
    }
  }

  const toggleMaximize = () => {
    if (isMaximized) {
      setWindowSize(previousSize)
      setPosition(previousPosition)
    } else {
      setPreviousSize(windowSize)
      setPreviousPosition(position)
      setWindowSize({ width: window.innerWidth, height: window.innerHeight })
      setPosition({ x: 0, y: 0 })
    }
    setIsMaximized(!isMaximized)
  }

  // Calculate center position for initial render
  useEffect(() => {
    const initialPosition = { 
      x: Math.max(0, (window.innerWidth - windowSize.width) / 2), 
      y: Math.max(0, (window.innerHeight - windowSize.height) / 2) 
    }
    setPosition(initialPosition)
    setPreviousPosition(initialPosition)

    // Set login window position
    const loginInitialPosition = {
      x: Math.max(0, (window.innerWidth - 400) / 2),
      y: Math.max(0, (window.innerHeight - 200) / 2)
    }
    setLoginPosition(loginInitialPosition)
  }, [])

  return (
    <div className="min-h-screen bg-black text-green-500 relative overflow-hidden">
      <canvas id="matrix" className="absolute top-0 left-0 w-full h-full opacity-50"></canvas>
      
      <Draggable handle=".window-handle" position={position} onDrag={(_, data) => setPosition({x: data.x, y: data.y})}>
        <div className="absolute">
          <Resizable
            size={{ width: windowSize.width, height: windowSize.height }}
            onResizeStop={(_, __, ___, d) => {
              setWindowSize({
                width: windowSize.width + d.width,
                height: windowSize.height + d.height,
              });
            }}
            minWidth={400}
            minHeight={300}
          >
            <div className="bg-black/80 border border-green-500 shadow-lg shadow-green-500/20 h-full">
              <div className="flex items-center justify-between p-2 border-b border-green-500 window-handle cursor-move">
                <div className="font-mono text-sm">HACKER_CHAT v1.0 (Zagipok edition)</div>
                <div className="flex gap-0.5">
                  <button className="w-8 h-6 bg-yellow-500/20 hover:bg-yellow-500/40 flex items-center justify-center group">
                    <div className="w-3 h-[2px] bg-yellow-500 group-hover:bg-yellow-400"></div>
                  </button>
                  <button className="w-8 h-6 bg-green-500/20 hover:bg-green-500/40 flex items-center justify-center" onClick={toggleMaximize}>
                    <div className="w-3 h-3 border border-green-500 hover:border-green-400"></div>
                  </button>
                  <button className="w-8 h-6 bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center group">
                    <div className="w-3 h-3 relative">
                      <div className="absolute w-3.5 h-[2px] bg-red-500 group-hover:bg-red-400 rotate-45 top-1.5"></div>
                      <div className="absolute w-3.5 h-[2px] bg-red-500 group-hover:bg-red-400 -rotate-45 top-1.5"></div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div className="p-4 font-mono h-[calc(100%-48px)] flex flex-col">
                <div className="space-y-2 mb-4 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <p className="text-green-400">System initialized...</p>
                  <p className="text-green-400">Welcome to Hacker chat (Zagipok edition)</p>
                  {messages.map((msg, i) => (
                    <p key={i} className="break-all">{msg}</p>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                {isConnected && (
                  <form onSubmit={handleSubmit} className="flex items-center">
                    <span className="text-green-500 mr-2">{'>'}</span>
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none text-green-500 font-mono"
                      placeholder="Enter message..."
                      autoFocus
                    />
                  </form>
                )}
              </div>
            </div>
          </Resizable>
        </div>
      </Draggable>

      {!isConnected && (
        <Draggable handle=".login-handle" position={loginPosition} onDrag={(_, data) => setLoginPosition({x: data.x, y: data.y})}>
          <div className="absolute w-[400px] z-50">
            <div className="bg-black/80 border border-green-500 shadow-lg shadow-green-500/20">
              <div className="flex items-center justify-between p-2 border-b border-green-500 login-handle cursor-move">
                <div className="font-mono text-sm">LOGIN</div>
              </div>
              <div className="p-4">
                <form onSubmit={handleUsernameSubmit} className="flex items-center">
                  <span className="text-green-500 mr-2">{'>'}</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-green-500 font-mono"
                    placeholder="Enter username..."
                    autoFocus
                  />
                </form>
              </div>
            </div>
          </div>
        </Draggable>
      )}
    </div>
  )
}

export default App