"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import ReferralSystem from "@/components/features/ReferralSystem"
import CompanyCard from "@/components/features/CompanyCard"
import CompanyEditModal from "@/components/features/CompanyEditModal"
import type { CompanyFormData } from "@/components/features/CompanyEditModal"
import type { AdminCompany, Category } from "@/types"
import { fetchMyCompanies, createMyCompany, updateMyCompany, deleteMyCompany } from "@/services/company.service"
import { fetchCategories } from "@/services/category.service"
import {
  Camera, User, Mail, Save, Loader2, UploadCloud, Trash2,
  Phone, MapPin, Calendar, Fingerprint,
  Plus, X, Gift, Building2, Lock, Eye, EyeOff,
} from "lucide-react"
import { createClient } from "@/lib/supabase"

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ""
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

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
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [showReferralModal, setShowReferralModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Personal data
  const [personalData, setPersonalData] = useState({
    name: "", email: "", avatar: null as string | null,
    phone: "", cpf: "", address: "", birthDate: "",
  })
  const [avatarLoading, setAvatarLoading] = useState(false)

  // Companies
  const [companies, setCompanies] = useState<AdminCompany[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [editingCompany, setEditingCompany] = useState<CompanyFormData | null>(null)
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>("")

  useEffect(() => {
    const currentUserStr = localStorage.getItem("current_user")
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr)
        setCurrentUserId(user.id)
        setPersonalData({
          name: user.fullName || user.name || "",
          email: user.email || "",
          avatar: user.avatar || null,
          phone: user.phone || "",
          cpf: user.cpf || "",
          address: user.address || "",
          birthDate: user.birthDate || "",
        })
      } catch (e) {
        console.error("Error parsing user data", e)
      }
    }

    fetchMyCompanies()
      .then(setCompanies)
      .catch(err => console.error("Error loading companies", err))

    fetchCategories()
      .then(setCategories)
      .catch(err => console.error("Error loading categories", err))
  }, [])

  const syncLocalStorage = (fields: Record<string, unknown>) => {
    const currentUserStr = localStorage.getItem("current_user")
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : {}
    const updated = { ...currentUser, ...fields }
    localStorage.setItem("current_user", JSON.stringify(updated))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    setAvatarLoading(true)
    try {
      const supabase = createClient()
      const ext = file.name.split(".").pop() || "jpg"
      const filePath = `${currentUserId}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`

      const { error: dbError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", currentUserId)

      if (dbError) throw dbError

      setPersonalData(prev => ({ ...prev, avatar: avatarUrl }))
      syncLocalStorage({ avatar: avatarUrl })
      toast({
        title: "Foto atualizada!",
        description: "Sua foto de perfil foi salva.",
        className: "bg-green-600 border-green-500 text-white",
      })
    } catch (err) {
      console.error("Avatar upload error:", err)
      toast({ variant: "destructive", title: "Erro ao enviar foto", description: "Tente novamente." })
    } finally {
      setAvatarLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleRemovePhoto = async () => {
    setAvatarLoading(true)
    try {
      const supabase = createClient()

      // Remove all files in the user's avatar folder
      const { data: files } = await supabase.storage.from("avatars").list(currentUserId)
      if (files && files.length > 0) {
        await supabase.storage.from("avatars").remove(files.map(f => `${currentUserId}/${f.name}`))
      }

      await supabase.from("users").update({ avatar_url: null }).eq("id", currentUserId)

      setPersonalData(prev => ({ ...prev, avatar: null }))
      syncLocalStorage({ avatar: null })
      if (fileInputRef.current) fileInputRef.current.value = ""
      toast({ title: "Foto removida", description: "Sua foto de perfil foi removida." })
    } catch (err) {
      console.error("Avatar remove error:", err)
      toast({ variant: "destructive", title: "Erro ao remover foto", description: "Tente novamente." })
    } finally {
      setAvatarLoading(false)
    }
  }

  const handleSavePersonal = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("users")
        .update({
          full_name: personalData.name,
          phone: personalData.phone,
          cpf: personalData.cpf,
          address: personalData.address,
          birth_date: personalData.birthDate || null,
        })
        .eq("id", currentUserId)

      if (error) throw error

      // Sync localStorage cache
      const primary = companies.find(c => c.isPrimary) || companies[0]
      syncLocalStorage({
        fullName: personalData.name,
        name: personalData.name,
        phone: personalData.phone,
        cpf: personalData.cpf,
        address: personalData.address,
        birthDate: personalData.birthDate,
        companyName: primary?.name || "",
      })

      toast({
        title: "Perfil atualizado!",
        description: "Suas informações foram salvas com sucesso.",
        className: "bg-green-600 border-green-500 text-white",
      })
    } catch (err) {
      console.error("Save personal error:", err)
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Não foi possível salvar suas informações. Tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveCompany = async (data: CompanyFormData) => {
    try {
      if (data.id) {
        const updated = await updateMyCompany(data.id, {
          name: data.name,
          cnpj: data.cnpj,
          categoryId: data.categoryId,
          description: data.description,
          location: data.location,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          linkedin: data.linkedin,
          isPrimary: data.isPrimary,
        })
        setCompanies(prev => prev.map(c => c.id === data.id ? updated : c))
      } else {
        const created = await createMyCompany({
          name: data.name,
          cnpj: data.cnpj,
          categoryId: data.categoryId,
          description: data.description,
          location: data.location,
          contactEmail: data.contactEmail,
          contactPhone: data.contactPhone,
          linkedin: data.linkedin,
          isPrimary: data.isPrimary,
        })
        setCompanies(prev => [created, ...prev])
      }
      toast({
        title: data.id ? "Empresa atualizada!" : "Empresa adicionada!",
        description: data.id ? "Dados salvos com sucesso." : "Sua empresa foi cadastrada.",
        className: "bg-green-600 border-green-500 text-white",
      })
    } catch (err) {
      console.error("Save company error:", err)
      toast({ variant: "destructive", title: "Erro ao salvar empresa", description: err instanceof Error ? err.message : "Tente novamente." })
    }
  }

  const handleDeleteCompany = async (companyId: string) => {
    try {
      await deleteMyCompany(companyId)
      setCompanies(prev => prev.filter(c => c.id !== companyId))
      toast({
        title: "Empresa removida",
        description: "A empresa foi excluída da sua conta.",
      })
    } catch (err) {
      console.error("Delete company error:", err)
      toast({ variant: "destructive", title: "Erro ao excluir empresa", description: err instanceof Error ? err.message : "Tente novamente." })
    }
  }

  // Change password
  const [passwordData, setPasswordData] = useState({ current: "", new: "", confirm: "" })
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false })

  const handleChangePassword = async () => {
    if (passwordData.new.length < 6) {
      toast({ variant: "destructive", title: "Senha muito curta", description: "A nova senha deve ter no mínimo 6 caracteres." })
      return
    }
    if (passwordData.new !== passwordData.confirm) {
      toast({ variant: "destructive", title: "Senhas diferentes", description: "A nova senha e a confirmação não coincidem." })
      return
    }

    setPasswordLoading(true)
    try {
      const supabase = createClient()

      // Verify current password by signing in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: personalData.email,
        password: passwordData.current,
      })

      if (signInError) {
        toast({ variant: "destructive", title: "Senha atual incorreta", description: "Verifique sua senha atual e tente novamente." })
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.new,
      })

      if (updateError) {
        toast({ variant: "destructive", title: "Erro ao alterar senha", description: updateError.message })
        return
      }

      setPasswordData({ current: "", new: "", confirm: "" })
      toast({
        title: "Senha alterada!",
        description: "Sua senha foi atualizada com sucesso.",
        className: "bg-green-600 border-green-500 text-white",
      })
    } catch {
      toast({ variant: "destructive", title: "Erro", description: "Ocorreu um erro ao alterar a senha." })
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e empresas.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-1">
          <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center sticky top-24 shadow-sm">
            <h2 className="font-semibold mb-6">Foto de Perfil</h2>
            <div className="relative group mb-6">
              <Avatar className="w-40 h-40 border-4 border-border shadow-xl">
                <AvatarImage src={personalData.avatar || undefined} className="object-cover" />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-4xl">
                  {personalData.name ? personalData.name.charAt(0).toUpperCase() : "U"}
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
              <Button variant="outline" className="w-full gap-2" onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}>
                {avatarLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                {avatarLoading ? "Salvando..." : "Alterar Foto"}
              </Button>
              {personalData.avatar && (
                <Button variant="ghost" className="w-full text-red-500 hover:text-red-400 hover:bg-red-500/10 gap-2" onClick={handleRemovePhoto}>
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
                <TabsTrigger value="companies" className="flex-1">Minhas Empresas</TabsTrigger>
              </TabsList>

              {/* Personal Tab */}
              <TabsContent value="personal" className="p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-blue-500" />
                  <h2 className="text-xl font-bold">Informações Pessoais</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="Nome Completo" value={personalData.name} onChange={v => setPersonalData({ ...personalData, name: v })} icon={User} />
                  <InputGroup label="Data de Nascimento" value={personalData.birthDate} onChange={v => setPersonalData({ ...personalData, birthDate: v })} icon={Calendar} type="date" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="CPF" value={personalData.cpf} onChange={v => setPersonalData({ ...personalData, cpf: formatCPF(v) })} icon={Fingerprint} placeholder="000.000.000-00" />
                  <InputGroup label="Telefone / WhatsApp" value={personalData.phone} onChange={v => setPersonalData({ ...personalData, phone: formatPhone(v) })} icon={Phone} placeholder="(00) 90000-0000" />
                </div>
                <InputGroup label="E-mail" value={personalData.email} readOnly icon={Mail} />
                <InputGroup label="Endereço Residencial" value={personalData.address} onChange={v => setPersonalData({ ...personalData, address: v })} icon={MapPin} placeholder="Rua, Número, Bairro, Cidade - UF" />
                <div className="pt-4 border-t border-border flex justify-end">
                  <Button onClick={handleSavePersonal} disabled={loading} className="min-w-[140px]">
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Salvar Pessoal
                  </Button>
                </div>

                {/* Change Password Section */}
                <div className="pt-6 mt-6 border-t border-border space-y-6">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-amber-500" />
                    <h2 className="text-xl font-bold">Alterar Senha</h2>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Senha Atual</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          value={passwordData.current}
                          onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                          placeholder="Digite sua senha atual"
                          className="w-full bg-secondary/50 border border-input rounded-xl py-3 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nova Senha</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.new}
                            onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-secondary/50 border border-input rounded-xl py-3 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Confirmar Nova Senha</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirm}
                            onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                            placeholder="Repita a nova senha"
                            className="w-full bg-secondary/50 border border-input rounded-xl py-3 pl-10 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleChangePassword}
                      disabled={passwordLoading || !passwordData.current || !passwordData.new || !passwordData.confirm}
                      variant="outline"
                      className="min-w-[160px]"
                    >
                      {passwordLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                      Alterar Senha
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Companies Tab */}
              <TabsContent value="companies" className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-purple-500" />
                    <h2 className="text-xl font-bold">Minhas Empresas</h2>
                  </div>
                  <Button
                    onClick={() => { setEditingCompany(null); setIsCompanyModalOpen(true) }}
                    className="gap-2"
                    size="sm"
                  >
                    <Plus className="h-4 w-4" /> Adicionar Empresa
                  </Button>
                </div>

                {companies.length > 0 ? (
                  <div className="space-y-3">
                    {companies.map(company => (
                      <CompanyCard
                        key={company.id}
                        company={company}
                        onEdit={c => {
                          setEditingCompany({
                            id: c.id,
                            name: c.name,
                            cnpj: c.cnpj,
                            categoryId: c.categoryId,
                            description: c.description,
                            location: c.location,
                            contactEmail: c.contactEmail,
                            contactPhone: c.contactPhone,
                            linkedin: c.linkedin,
                            isPrimary: c.isPrimary,
                            gallery: [],
                          })
                          setIsCompanyModalOpen(true)
                        }}
                        onDelete={handleDeleteCompany}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Building2 className="h-8 w-8 text-purple-500/50" />
                    </div>
                    <div>
                      <p className="text-muted-foreground font-medium">Nenhuma empresa cadastrada</p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Adicione sua empresa para aparecer nas buscas e receber conexões.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => { setEditingCompany(null); setIsCompanyModalOpen(true) }}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" /> Cadastrar Primeira Empresa
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

        </motion.div>
      </div>

      {/* Company Edit Modal */}
      <CompanyEditModal
        company={editingCompany}
        isOpen={isCompanyModalOpen}
        onClose={() => { setIsCompanyModalOpen(false); setEditingCompany(null) }}
        onSave={handleSaveCompany}
        userId={currentUserId}
        categories={categories}
      />

      {/* Referral Modal */}
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
