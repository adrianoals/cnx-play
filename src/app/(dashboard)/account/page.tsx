"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import ReferralSystem from "@/components/features/ReferralSystem"
import {
  Camera, User, Mail, Save, Loader2, UploadCloud, Trash2,
  AlertTriangle, Phone, MapPin, Calendar, Building2, FileText,
  Briefcase, Fingerprint, Image as ImageIcon, Plus, X, Gift,
} from "lucide-react"

function InputGroup({
  label, value, onChange, icon: Icon, type = "text", placeholder = "", readOnly = false,
}: {
  label: string; value: string; onChange?: (v: string) => void
  icon?: React.ComponentType<{ className?: string }>; type?: string; placeholder?: string; readOnly?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />}
        <input
          type={type}
          value={value}
          onChange={onChange ? e => onChange(e.target.value) : undefined}
          readOnly={readOnly}
          placeholder={placeholder}
          className={`w-full bg-secondary/50 border border-input rounded-xl py-3 ${Icon ? "pl-10" : "pl-4"} pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all ${readOnly ? "opacity-70 cursor-not-allowed" : ""}`}
        />
      </div>
    </div>
  )
}

export default function AccountPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const [profileData, setProfileData] = useState({
    name: "", email: "", avatar: null as string | null, phone: "", cpf: "",
    address: "", birthDate: "", companyName: "", cnpj: "", segment: "",
    gallery: [] as string[],
  })

  useEffect(() => {
    const currentUserStr = localStorage.getItem("current_user")
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr)
        setProfileData({
          name: user.fullName || user.name || "",
          email: user.email || "",
          avatar: user.avatar || localStorage.getItem("user_avatar") || null,
          phone: user.phone || "",
          cpf: user.cpf || "",
          address: user.address || "",
          birthDate: user.birthDate || "",
          companyName: user.companyName || "",
          cnpj: user.cnpj || "",
          segment: user.segment || "",
          gallery: user.gallery || [],
        })
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }
  }, [])

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: "Formato inválido", description: "Use PNG ou JPG." })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 2MB." })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => setProfileData(prev => ({ ...prev, avatar: reader.result as string }))
    reader.readAsDataURL(file)
  }

  const handleGalleryUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) return
    if (file.size > 2 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Arquivo muito grande", description: "Máximo 2MB." })
      return
    }
    const reader = new FileReader()
    reader.onloadend = () => {
      const newGallery = [...profileData.gallery, reader.result as string]
      setProfileData(prev => ({ ...prev, gallery: newGallery }))
    }
    reader.readAsDataURL(file)
  }

  const removeGalleryImage = (index: number) => {
    setProfileData(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }))
  }

  const handleRemovePhoto = () => {
    setProfileData(prev => ({ ...prev, avatar: null }))
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSave = () => {
    setLoading(true)
    setTimeout(() => {
      const currentUserStr = localStorage.getItem("current_user")
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {}

      const updatedUser = {
        ...currentUser, ...profileData,
        fullName: profileData.name, avatar: profileData.avatar, gallery: profileData.gallery,
      }

      localStorage.setItem("current_user", JSON.stringify(updatedUser))
      localStorage.setItem("user_avatar", profileData.avatar || "")

      const allUsers = JSON.parse(localStorage.getItem("users") || "[]")
      if (allUsers.length > 0) {
        const updatedAllUsers = allUsers.map((u: { id: number; email: string }) => {
          if (u.id === updatedUser.id || u.email === updatedUser.email) return { ...u, ...updatedUser }
          return u
        })
        localStorage.setItem("users", JSON.stringify(updatedAllUsers))
      }

      setLoading(false)
      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
        className: "bg-green-600 border-green-500 text-white",
      })
    }, 1000)
  }

  const handleDeleteAccount = () => {
    setDeleteLoading(true)
    setTimeout(() => {
      localStorage.removeItem("current_user")
      localStorage.removeItem("user_avatar")
      router.push("/login")
    }, 2000)
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e galeria.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center sticky top-24 shadow-sm">
            <h2 className="font-semibold mb-6">Foto de Perfil</h2>
            <div className="relative group mb-6">
              <Avatar className="w-40 h-40 border-4 border-border shadow-xl">
                <AvatarImage src={profileData.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-4xl">
                  {profileData.name ? profileData.name.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div
                className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-8 w-8 text-white" />
              </div>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <div className="flex flex-col gap-3 w-full">
              <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud className="h-4 w-4" /> Alterar Foto
              </Button>
              {profileData.avatar && (
                <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={handleRemovePhoto}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="md:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-3xl p-1 overflow-hidden shadow-sm">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="w-full bg-muted/50 p-1 h-12">
                <TabsTrigger value="personal" className="flex-1">Dados Pessoais</TabsTrigger>
                <TabsTrigger value="company" className="flex-1">Empresa</TabsTrigger>
                <TabsTrigger value="portfolio" className="flex-1">Galeria</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-bold">Informações Pessoais</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Nome Completo" value={profileData.name} onChange={v => setProfileData({ ...profileData, name: v })} icon={User} />
                  <InputGroup label="Data de Nascimento" value={profileData.birthDate} onChange={v => setProfileData({ ...profileData, birthDate: v })} icon={Calendar} type="date" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="CPF" value={profileData.cpf} onChange={v => setProfileData({ ...profileData, cpf: v })} icon={Fingerprint} placeholder="000.000.000-00" />
                  <InputGroup label="Telefone / WhatsApp" value={profileData.phone} onChange={v => setProfileData({ ...profileData, phone: v })} icon={Phone} placeholder="(00) 90000-0000" />
                </div>
                <InputGroup label="E-mail" value={profileData.email} readOnly icon={Mail} />
                <InputGroup label="Endereço Residencial" value={profileData.address} onChange={v => setProfileData({ ...profileData, address: v })} icon={MapPin} placeholder="Rua, Número, Bairro, Cidade - UF" />
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Pessoal
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="company" className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-purple-500" />
                  <h2 className="text-xl font-bold">Informações Corporativas</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Nome da Empresa" value={profileData.companyName} onChange={v => setProfileData({ ...profileData, companyName: v })} icon={Building2} placeholder="Razão Social" />
                  <InputGroup label="CNPJ" value={profileData.cnpj} onChange={v => setProfileData({ ...profileData, cnpj: v })} icon={FileText} placeholder="00.000.000/0001-00" />
                </div>
                <InputGroup label="Segmento / Ramo" value={profileData.segment} onChange={v => setProfileData({ ...profileData, segment: v })} icon={Briefcase} placeholder="Ex: Tecnologia, Consultoria..." />
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Empresa
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="portfolio" className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <ImageIcon className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-bold">Galeria e Portfólio</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione fotos de seus produtos, escritório ou equipe. Essas imagens aparecerão no seu perfil público.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {profileData.gallery.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square bg-muted rounded-xl overflow-hidden border border-border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-muted-foreground/30 rounded-xl hover:bg-secondary/50 transition-colors gap-2 text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-xs font-medium">Adicionar Foto</span>
                  </button>
                  <input type="file" ref={galleryInputRef} onChange={handleGalleryUpload} accept="image/*" className="hidden" />
                </div>
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button onClick={handleSave} disabled={loading} className="min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Galeria
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Danger Zone */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-destructive mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Zona de Perigo
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Ao excluir sua conta, seus dados locais serão removidos.
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Excluir Conta Permanentemente
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmação de Exclusão</AlertDialogTitle>
                  <AlertDialogDescription>Essa ação removerá seus dados de acesso deste dispositivo.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                    {deleteLoading ? "Excluindo..." : "Sim, excluir"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showReferralModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-card border border-border rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative">
              <button onClick={() => setShowReferralModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors z-10">
                <X className="h-5 w-5" />
              </button>
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <Gift className="h-6 w-6 text-purple-400" /> Programa de Indicação
                </h2>
                <p className="text-muted-foreground mb-6">Convide amigos e turbine sua pontuação no ranking.</p>
                <ReferralSystem />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
