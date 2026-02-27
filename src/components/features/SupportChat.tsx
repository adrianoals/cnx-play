"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

const getBotResponse = (input: string): string => {
  const lower = input.toLowerCase()
  if (lower.includes("ola") || lower.includes("olá") || lower.includes("oi") || lower.includes("bom dia") || lower.includes("boa tarde"))
    return "Olá! Sou a Sofia, a IA do Conecta Empresários. Posso te ajudar com dúvidas sobre **planos**, **funcionalidades** ou **reuniões**. Como posso ajudar hoje?"
  if (lower.includes("plano") || lower.includes("preço") || lower.includes("valor") || lower.includes("assinatura"))
    return "Temos 3 opções:\n\n1. **Mensal**: R$ 59,99/mês\n2. **Anual**: R$ 497,00/ano (2 meses grátis)\n3. **Start 2026**: R$ 365,00 (Pagamento único)\n\nQual te interessa?"
  if (lower.includes("funciona") || lower.includes("funcionalidade"))
    return "A plataforma conecta você a outros empresários diariamente.\n\n- **Match Diário**: Sugestão de conexão.\n- **Mural de Conquistas**: Registre negócios.\n- **Níveis**: Suba de Platina a Diamante."
  if (lower.includes("reunião") || lower.includes("match"))
    return "As reuniões são sugeridas automaticamente todos os dias às 15:00. Confirme no card 'Reunião do Dia' no Dashboard."
  if (lower.includes("pagamento") || lower.includes("pix"))
    return "Aceitamos Cartão de Crédito e Pix via InfinitePay. 100% seguro."
  if (lower.includes("suporte") || lower.includes("humano"))
    return "Nosso suporte atende pelo WhatsApp: (11) 95022-2063."
  if (lower.includes("cancelar"))
    return "Para cancelamentos, entre em contato via WhatsApp ou acesse 'Minha Conta'."
  return "Desculpe, ainda estou aprendendo. Tente perguntar sobre **planos**, **como funciona** ou **reuniões**."
}

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([{ id: 1, text: "Olá! Sou a Sofia, assistente virtual do Conecta. Posso te ajudar?", sender: "bot" }])
  const [inputText, setInputText] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isOpen])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputText.trim()) return
    const userMsg = { id: Date.now(), text: inputText, sender: "user" }
    setMessages(prev => [...prev, userMsg])
    setInputText("")
    setIsTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: getBotResponse(userMsg.text), sender: "bot" }])
      setIsTyping(false)
    }, 1500)
  }

  return (
    <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} transition={{ duration: 0.2 }}
            className="mb-4 w-[350px] max-w-[calc(100vw-48px)] h-[500px] max-h-[80vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto"
          >
            <div className="bg-slate-800 p-4 flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold">S</div>
                <div>
                  <h3 className="font-bold text-white text-sm">Sofia (Atendente IA)</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-xs text-slate-300">Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-700 rounded"><X className="h-5 w-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/50">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed whitespace-pre-line shadow-sm ${msg.sender === "user" ? "bg-blue-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700"}`}>{msg.text}</div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-700 flex gap-2">
              <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} placeholder="Digite sua dúvida..."
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500" />
              <Button type="submit" size="icon" disabled={!inputText.trim() || isTyping} className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-10 w-10 shrink-0">
                {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setIsOpen(!isOpen)}
        className={`pointer-events-auto shadow-xl flex items-center justify-center rounded-full w-14 h-14 transition-all duration-300 border-2 border-white/10 ${isOpen ? "bg-slate-800 text-white rotate-90 hover:bg-slate-700" : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500"}`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
      </motion.button>
    </div>
  )
}