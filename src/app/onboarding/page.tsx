"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAuthContext } from "@/providers/auth-provider"
import { createClient } from "@/lib/supabase"
import { fetchProfile, logout } from "@/services/auth.service"
import { fetchMyCompanies, createMyCompany } from "@/services/company.service"
import { fetchCategories } from "@/services/category.service"
import { hasAnsweredOnboarding, saveOnboardingResponse } from "@/services/onboarding-response.service"
import type { AdminCompany, Category } from "@/types"
import {
  Loader2, ArrowRight, ArrowLeft, CheckCircle2,
  User as UserIcon, Building2, Fingerprint, MapPin, Calendar,
  Phone, Mail, FileText, LogOut,
} from "lucide-react"
import OnboardingQuestions, { type OnboardingAnswers } from "@/components/features/OnboardingQuestions"
import RegistrationReceivedScreen from "@/components/features/RegistrationReceivedScreen"

type Step = "profile" | "company" | "questions" | "done"

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

export default function OnboardingPage() {
  const { toast } = useToast()
  const { user, setUser } = useAuthContext()
  const [step, setStep] = useState<Step | null>(null)

  const { data: myCompanies, mutate: mutateCompanies } = useSWR<AdminCompany[]>(
    user ? "onboarding-my-companies" : null,
    fetchMyCompanies,
  )

  const { data: categories = [] } = useSWR<Category[]>(
    user ? "onboarding-categories" : null,
    fetchCategories,
  )

  const { data: questionsDone, mutate: mutateQuestionsDone } = useSWR<boolean>(
    user ? "onboarding-answered" : null,
    hasAnsweredOnboarding,
  )

  useEffect(() => {
    if (!user || step !== null) return
    if (myCompanies === undefined || questionsDone === undefined) return

    const profileDone = !!(user.cpf?.trim() && user.birthDate?.trim() && user.address?.trim())
    const companyDone = myCompanies.length > 0

    if (!profileDone) setStep("profile")
    else if (!companyDone) setStep("company")
    else if (!questionsDone) setStep("questions")
    else setStep("done")
  }, [user, myCompanies, questionsDone, step])

  const [profile, setProfile] = useState({ cpf: "", birthDate: "", address: "" })
  const [profileLoading, setProfileLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setProfile({
        cpf: user.cpf || "",
        birthDate: user.birthDate || "",
        address: user.address || "",
      })
    }
  }, [user])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!profile.cpf.trim() || !profile.birthDate.trim() || !profile.address.trim()) {
      toast({ variant: "destructive", title: "Preencha todos os campos." })
      return
    }
    setProfileLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("users")
        .update({
          cpf: profile.cpf,
          birth_date: profile.birthDate,
          address: profile.address,
        })
        .eq("id", user.id)
      if (error) throw error

      const refreshed = await fetchProfile(user.id)
      if (refreshed) {
        setUser(refreshed)
        try { localStorage.setItem("current_user", JSON.stringify(refreshed)) } catch { /* ignore */ }
      }
      setStep("company")
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar", description: err instanceof Error ? err.message : "Tente novamente." })
    } finally {
      setProfileLoading(false)
    }
  }

  const [company, setCompany] = useState({
    name: "",
    categoryId: "",
    description: "",
    location: "",
    contactPhone: "",
    contactEmail: "",
  })
  const [companyLoading, setCompanyLoading] = useState(false)

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company.name.trim() || !company.categoryId.trim() || !company.contactPhone.trim()) {
      toast({ variant: "destructive", title: "Preencha os campos obrigatórios." })
      return
    }
    setCompanyLoading(true)
    try {
      await createMyCompany({
        name: company.name,
        categoryId: company.categoryId,
        description: company.description || undefined,
        location: company.location || undefined,
        contactPhone: company.contactPhone,
        contactEmail: company.contactEmail || undefined,
        isPrimary: true,
      })
      await mutateCompanies()
      setStep("questions")
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao cadastrar empresa", description: err instanceof Error ? err.message : "Tente novamente." })
    } finally {
      setCompanyLoading(false)
    }
  }

  const [questionsSubmitting, setQuestionsSubmitting] = useState(false)
  const handleQuestionsComplete = async (answers: OnboardingAnswers) => {
    if (!user) return
    setQuestionsSubmitting(true)
    try {
      await saveOnboardingResponse(answers)
      await mutateQuestionsDone(true, { revalidate: false })
      setStep("done")
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao salvar respostas",
        description: err instanceof Error ? err.message : "Tente novamente.",
      })
    } finally {
      setQuestionsSubmitting(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = "/login"
  }

  if (step === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (step === "done") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <RegistrationReceivedScreen />
        <button
          onClick={handleLogout}
          className="mt-6 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
        >
          <LogOut className="h-3 w-3" /> Sair
        </button>
      </div>
    )
  }

  const stepNumber = step === "profile" ? 1 : step === "company" ? 2 : 3

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          <div className="h-1 bg-muted">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
              initial={false}
              animate={{ width: `${(stepNumber / 3) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                {step === "profile" && <UserIcon className="h-5 w-5 text-white" />}
                {step === "company" && <Building2 className="h-5 w-5 text-white" />}
                {step === "questions" && <CheckCircle2 className="h-5 w-5 text-white" />}
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">Etapa {stepNumber} de 3</p>
                <p className="text-sm font-semibold">
                  {step === "profile" && "Complete seu cadastro"}
                  {step === "company" && "Cadastre sua empresa"}
                  {step === "questions" && "Antes de finalizar..."}
                </p>
              </div>
            </div>

            {step === "profile" && (
              <form onSubmit={handleSaveProfile} className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Precisamos de alguns dados a mais para conhecer você melhor.
                </p>
                <Field label="CPF" icon={Fingerprint} value={profile.cpf} onChange={v => setProfile({ ...profile, cpf: formatCPF(v) })} placeholder="000.000.000-00" required />
                <Field label="Data de nascimento" icon={Calendar} value={profile.birthDate} onChange={v => setProfile({ ...profile, birthDate: v })} type="date" required />
                <Field label="Endereço" icon={MapPin} value={profile.address} onChange={v => setProfile({ ...profile, address: v })} placeholder="Rua, Número, Bairro, Cidade - UF" required />
                <Button type="submit" disabled={profileLoading} className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                  {profileLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Avançar <ArrowRight className="h-4 w-4" /></span>}
                </Button>
              </form>
            )}

            {step === "company" && (
              <form onSubmit={handleSaveCompany} className="space-y-5">
                <p className="text-sm text-muted-foreground">
                  Conte para a comunidade sobre sua empresa.
                </p>
                <Field label="Nome da empresa *" icon={Building2} value={company.name} onChange={v => setCompany({ ...company, name: v })} placeholder="Ex: Tech Solutions Ltda" required />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Segmento *</label>
                  <select
                    required
                    value={company.categoryId}
                    onChange={e => setCompany({ ...company, categoryId: e.target.value })}
                    className="w-full bg-secondary/50 border border-input rounded-xl py-3 px-4 text-sm text-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all"
                  >
                    <option value="">Selecione o segmento</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <Field label="WhatsApp / Telefone comercial *" icon={Phone} value={company.contactPhone} onChange={v => setCompany({ ...company, contactPhone: formatPhone(v) })} placeholder="(00) 00000-0000" required />
                <Field label="E-mail comercial" icon={Mail} value={company.contactEmail} onChange={v => setCompany({ ...company, contactEmail: v })} placeholder="contato@empresa.com" type="email" />
                <Field label="Localização" icon={MapPin} value={company.location} onChange={v => setCompany({ ...company, location: v })} placeholder="São Paulo, SP" />
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea
                      value={company.description}
                      onChange={e => setCompany({ ...company, description: e.target.value })}
                      placeholder="Em poucas palavras, o que sua empresa faz?"
                      rows={3}
                      className="w-full bg-secondary/50 border border-input rounded-xl py-3 pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all resize-none"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" onClick={() => setStep("profile")} className="flex-1">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
                  </Button>
                  <Button type="submit" disabled={companyLoading} className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold">
                    {companyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="flex items-center gap-2">Avançar <ArrowRight className="h-4 w-4" /></span>}
                  </Button>
                </div>
              </form>
            )}

            {step === "questions" && (
              <OnboardingQuestions onComplete={handleQuestionsComplete} submitting={questionsSubmitting} />
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
          >
            <LogOut className="h-3 w-3" /> Sair e continuar depois
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function Field({
  label, value, onChange, icon: Icon, type = "text", placeholder = "", required = false,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  icon?: React.ComponentType<{ className?: string }>
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />}
        <Input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className={`bg-secondary/50 border-input ${Icon ? "pl-9" : ""}`}
        />
      </div>
    </div>
  )
}
