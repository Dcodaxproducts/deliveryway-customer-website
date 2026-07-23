"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { FcGoogle } from "react-icons/fc"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
import { ArrowRight, Eye, EyeOff, Heart, Sparkles, UserRound } from "lucide-react"

import { MUTED_TEXT_CLASS } from "@/components/common/common-classes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "../ui/checkbox"
import { useAuthContext } from "@/hooks/useAuth"
import { useDomainContext } from "@/hooks/useDomainContext"
import { getAuthErrorMessage } from "@/lib/auth"
import { getStoredGroupOrderCode } from "@/lib/group-order"
import { roboto } from "@/lib/fonts"
import { googleLoginCustomer, guestLoginCustomer, loginCustomer } from "@/services/auth"
import {
  createGuestLoginSchema,
  createLoginSchema,
  type AuthValidationMessages,
  type GuestLoginFormValues,
  type LoginFormValues,
} from "@/validations/auth"

type GoogleCredentialResponse = { credential?: string }

type GoogleAccounts = {
  id?: {
    initialize: (config: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
    }) => void
    prompt: () => void
  }
}

type GoogleWindow = Window & { google?: { accounts?: GoogleAccounts } }

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as GoogleWindow).google?.accounts?.id) {
      resolve()
      return
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    )

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true })
      existingScript.addEventListener("error", () => reject(new Error("Google login failed to load")), {
        once: true,
      })
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Google login failed to load"))
    document.head.appendChild(script)
  })

const getGroupOrderCode = () => getStoredGroupOrderCode()

const splitGuestName = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const [firstName = "Guest", ...lastNameParts] = parts

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  }
}

const useAuthValidationMessages = (): AuthValidationMessages => {
  const t = useTranslations("validation")

  return useMemo(
    () => ({
      emailRequired: t("emailRequired"),
      emailInvalid: t("emailInvalid"),
      passwordRequired: t("passwordRequired"),
      firstNameRequired: t("firstNameRequired"),
      lastNameRequired: t("lastNameRequired"),
      phoneRequired: t("phoneRequired"),
      confirmPasswordRequired: t("confirmPasswordRequired"),
      acceptTermsRequired: t("acceptTermsRequired"),
      passwordsDoNotMatch: t("passwordsDoNotMatch"),
      otpRequired: t("otpRequired"),
      newPasswordRequired: t("newPasswordRequired"),
    }),
    [t]
  )
}

export function LoginForm() {
  const t = useTranslations("auth")
  const router = useRouter()
  const { login } = useAuthContext()
  const { context: domainContext, loading: domainLoading, error: domainError } = useDomainContext()

  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false)
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const validationMessages = useAuthValidationMessages()
  const translatedLoginSchema = useMemo(
    () => createLoginSchema(validationMessages),
    []
  )
  const translatedGuestLoginSchema = useMemo(
    () => createGuestLoginSchema(),
    [validationMessages]
  )

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(translatedLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  const guestForm = useForm<GuestLoginFormValues>({
    resolver: zodResolver(translatedGuestLoginSchema),
    defaultValues: {
      name: "",
    },
  })

  const redirectAfterLogin = () => {
    const code = getGroupOrderCode()

    setTimeout(() => {
      if (code) {
        router.push("/items")
      } else {
        router.push("/")
      }
    }, 1000)
  }

  // ================= NORMAL LOGIN =================
  const onSubmit = async (values: LoginFormValues) => {
    const restaurantId = domainContext?.restaurantId
    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"))
      return
    }

    try {
      setIsLoading(true)

      const data = await loginCustomer({ ...values, restaurantId })

      login(data)

      toast.success(t("loginSuccessful"))
      redirectAfterLogin()
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  // ================= GUEST LOGIN =================
  const onGuestSubmit = async (values: GuestLoginFormValues) => {
    const restaurantId = domainContext?.restaurantId
    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"))
      return
    }

    try {
      setIsLoading(true)

      const data = await guestLoginCustomer({
        ...splitGuestName(values.name ?? ""),
        restaurantId,
      })

      login(data)
      setIsGuestDialogOpen(false)
      guestForm.reset()

      toast.success(t("guestSessionStarted"))
      redirectAfterLogin()
    } catch (error) {
      toast.error(getAuthErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const restaurantId = domainContext?.restaurantId

    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"))
      return
    }

    if (!googleClientId) {
      toast.error(t("googleClientMissing"))
      return
    }

    try {
      setIsGoogleSubmitting(true)
      await loadGoogleIdentityScript()
      const googleId = (window as GoogleWindow).google?.accounts?.id

      if (!googleId) {
        throw new Error(t("googleUnavailable"))
      }

      googleId.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          try {
            if (!response.credential) {
              throw new Error(t("googleCredentialMissing"))
            }

            const data = await googleLoginCustomer({
              idToken: response.credential,
              restaurantId,
            })

            login(data)
            toast.success(t("loginSuccessful"))
            redirectAfterLogin()
          } catch (error) {
            toast.error(getAuthErrorMessage(error))
          } finally {
            setIsGoogleSubmitting(false)
          }
        },
      })

      googleId.prompt()
    } catch (error) {
      setIsGoogleSubmitting(false)
      toast.error(error instanceof Error ? error.message : getAuthErrorMessage(error))
    }
  }

  return (
    <div className="w-full lg:mr-[79px]">

      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {t("login")}
        </h1>
        <p className={MUTED_TEXT_CLASS}>
          {t("loginDescription")}
        </p>
      </div>

      {/* FORM */}
      <form
        onSubmit={loginForm.handleSubmit(onSubmit)}
        className="space-y-[16px] mt-[35px] mb-[19px]"
        noValidate
      >
        <Input
          id="email"
          type="email"
          placeholder={t("email")}
          {...loginForm.register("email")}
        />
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("password")}
            className="pr-12"
            {...loginForm.register("password")}
          />
          <button
            type="button"
            aria-label={showPassword ? t("hidePassword") : t("showPassword")}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-gray-500 transition hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Eye className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="flex items-center justify-between text-sm my-7">
          <label className="flex items-center gap-2 cursor-pointer text-gray-500">
            <Checkbox checked />
            {t("rememberMe")}
          </label>

          <Link
            href="/auth/forgot-password"
            className="text-primary hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoading || domainLoading}
          className="w-full h-[50px] text-lg font-semibold bg-primary text-white"
        >
          {isLoading ? t("loggingIn") : t("login")}
        </Button>
      </form>

      {/* SOCIAL + GUEST TOGGLE */}
      <div className="space-y-5 flex flex-col items-center">
        <button
          type="button"
          disabled={isLoading || isGoogleSubmitting || domainLoading}
          onClick={handleGoogleLogin}
          className="w-[345px] flex items-center justify-center h-[54px] font-medium bg-transparent rounded-[10px] hover:bg-gray-100 shadow-sm border border-gray-200"
        >
          <FcGoogle className="w-[24px] h-[24px] mr-[15px]" />
          <span className={`${roboto.className} text-xl text-gray-500`}>
            {isGoogleSubmitting ? t("loggingIn") : t("signInWithGoogle")}
          </span>
        </button>

        {/*  GUEST BUTTON */}
        <button
          type="button"
          onClick={() => setIsGuestDialogOpen(true)}
          className="text-primary underline text-sm"
        >
          {t("signInAsGuest")}
        </button>
      </div>

      <Dialog open={isGuestDialogOpen} onOpenChange={setIsGuestDialogOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-h-[calc(100vh-32px)] overflow-y-auto border-0 bg-[#fffdfb] px-8 py-10 text-center shadow-[0_24px_80px_rgba(70,20,20,0.18)] sm:max-w-[760px] sm:rounded-[32px] sm:px-[84px] sm:py-[72px]"
        >
          <DialogClose className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#333] transition hover:bg-[#fff7f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3121b]/30 sm:right-[34px] sm:top-[34px] sm:h-[58px] sm:w-[58px]">
            <span className="text-3xl font-light leading-none" aria-hidden="true">×</span>
            <span className="sr-only">{t("backToLogin")}</span>
          </DialogClose>

          <DialogHeader className="items-center space-y-6 text-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#f7d8c8] bg-[#fff1e7] shadow-[0_14px_35px_rgba(190,20,30,0.14)] sm:h-28 sm:w-28">
              <Sparkles className="absolute -left-10 top-7 h-6 w-6 text-[#f1b9a4]" aria-hidden="true" />
              <UserRound className="h-12 w-12 text-[#b3121b]" strokeWidth={1.8} aria-hidden="true" />
              <Sparkles className="absolute -right-9 bottom-8 h-5 w-5 text-[#f1b9a4]" aria-hidden="true" />
            </div>

            <div className="space-y-5">
              <DialogTitle className="font-serif text-[40px] font-semibold leading-tight text-[#050505] sm:text-5xl">
                Welcome, <span className="text-[#b3121b]">Guest</span>
              </DialogTitle>
              <div className="flex items-center justify-center gap-3" aria-hidden="true">
                <span className="h-px w-14 bg-[#ef9c9c]" />
                <span className="text-xl text-[#b3121b]">◆</span>
                <span className="h-px w-14 bg-[#ef9c9c]" />
              </div>
              <DialogDescription className="mx-auto max-w-[470px] text-[19px] leading-relaxed text-[#6f7480] sm:text-[21px]">
                Share your name (optional) and we’ll personalize your experience.
              </DialogDescription>
            </div>
          </DialogHeader>

          <form onSubmit={guestForm.handleSubmit(onGuestSubmit)} className="mt-10 space-y-7" noValidate>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-7 top-1/2 h-8 w-8 -translate-y-1/2 text-[#9ca3af]" strokeWidth={1.8} aria-hidden="true" />
              <Input
                id="guestName"
                autoFocus
                placeholder="Enter your name (optional)"
                className="h-[72px] rounded-2xl border-2 border-[#fac7c7] bg-white pl-[74px] pr-8 text-xl text-[#222] shadow-[0_8px_22px_rgba(190,20,30,0.08)] placeholder:text-[#8b9099] focus-visible:ring-[#b3121b]/25 sm:h-[86px] sm:text-[22px]"
                {...guestForm.register("name")}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || domainLoading}
              className="h-[70px] w-full rounded-2xl bg-gradient-to-b from-[#d01827] to-[#a90f19] text-[22px] font-bold text-white shadow-[0_16px_30px_rgba(190,20,30,0.28)] hover:from-[#df1a2a] hover:to-[#a90f19] sm:h-[78px] sm:text-2xl"
            >
              <Sparkles className="mr-3 h-6 w-6 text-[#fff0bd]" aria-hidden="true" />
              {isLoading ? t("starting") : "Continue as guest"}
            </Button>

            <div className="flex items-center justify-center gap-5 text-lg text-[#777]">
              <span className="h-px w-20 bg-[#f4b8b8]" />
              <span>or</span>
              <span className="h-px w-20 bg-[#f4b8b8]" />
            </div>

            <button
              type="button"
              disabled={isLoading || domainLoading}
              onClick={() => void onGuestSubmit({ name: "" })}
              className="flex h-28 w-full flex-col items-center justify-center rounded-[14px] border border-[#ef9c9c] bg-transparent text-[#b3121b] transition hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center text-[22px] font-bold">
                <ArrowRight className="mr-3 h-6 w-6" aria-hidden="true" />
                Skip for now
              </span>
              <span className="mt-2 flex items-center text-base text-[#777d89]">
                You can always add your name later
                <Heart className="ml-1 h-4 w-4 text-[#ef9c9c]" aria-hidden="true" />
              </span>
            </button>
          </form>
        </DialogContent>
      </Dialog>

      {/* SIGNUP */}
      <p className="text-center text-sm text-muted-foreground mt-[40px]">
        {t("dontHaveAccount")}{" "}
        <Link href="/auth/signup" className="text-blue hover:underline">
          {t("signUpNow")}
        </Link>
      </p>
    </div>
  )
}
