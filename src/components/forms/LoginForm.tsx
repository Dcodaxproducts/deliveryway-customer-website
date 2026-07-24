"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Heart, LogIn, Sparkles, User } from "lucide-react";

import { MUTED_TEXT_CLASS } from "@/components/common/common-classes";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "../ui/checkbox";
import { useAuthContext } from "@/hooks/useAuth";
import { useDomainContext } from "@/hooks/useDomainContext";
import { getAuthErrorMessage } from "@/lib/auth";
import { getStoredGroupOrderCode } from "@/lib/group-order";
import { roboto } from "@/lib/fonts";
import {
  googleLoginCustomer,
  guestLoginCustomer,
  loginCustomer,
} from "@/services/auth";
import {
  createGuestLoginSchema,
  createLoginSchema,
  type AuthValidationMessages,
  type GuestLoginFormValues,
  type LoginFormValues,
} from "@/validations/auth";

type GoogleCredentialResponse = { credential?: string };

type GoogleAccounts = {
  id?: {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
    }) => void;
    prompt: () => void;
  };
};

type GoogleWindow = Window & { google?: { accounts?: GoogleAccounts } };

const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

const loadGoogleIdentityScript = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as GoogleWindow).google?.accounts?.id) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]',
    );

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google login failed to load")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google login failed to load"));
    document.head.appendChild(script);
  });

const getGroupOrderCode = () => getStoredGroupOrderCode();

const splitGuestName = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const [firstName = "Guest", ...lastNameParts] = parts;

  return {
    firstName,
    lastName: lastNameParts.join(" "),
  };
};

const useAuthValidationMessages = (): AuthValidationMessages => {
  const t = useTranslations("validation");

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
    [t],
  );
};

export function LoginForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const { login } = useAuthContext();
  const {
    context: domainContext,
    loading: domainLoading,
    error: domainError,
  } = useDomainContext();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);
  const [isGuestDialogOpen, setIsGuestDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const validationMessages = useAuthValidationMessages();
  const translatedLoginSchema = useMemo(
    () => createLoginSchema(validationMessages),
    [],
  );
  const translatedGuestLoginSchema = useMemo(
    () => createGuestLoginSchema(),
    [validationMessages],
  );

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(translatedLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const guestForm = useForm<GuestLoginFormValues>({
    resolver: zodResolver(translatedGuestLoginSchema),
    defaultValues: {
      name: "",
    },
  });

  const redirectAfterLogin = () => {
    const code = getGroupOrderCode();

    setTimeout(() => {
      if (code) {
        router.push("/items");
      } else {
        router.push("/");
      }
    }, 1000);
  };

  // ================= NORMAL LOGIN =================
  const onSubmit = async (values: LoginFormValues) => {
    const restaurantId = domainContext?.restaurantId;
    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"));
      return;
    }

    try {
      setIsLoading(true);

      const data = await loginCustomer({ ...values, restaurantId });

      login(data);

      toast.success(t("loginSuccessful"));
      redirectAfterLogin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  // ================= GUEST LOGIN =================
  const onGuestSubmit = async (values: GuestLoginFormValues) => {
    const restaurantId = domainContext?.restaurantId;
    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"));
      return;
    }

    try {
      setIsLoading(true);

      const data = await guestLoginCustomer({
        ...splitGuestName(values.name ?? ""),
        restaurantId,
      });

      login(data);
      setIsGuestDialogOpen(false);
      guestForm.reset();

      toast.success(t("guestSessionStarted"));
      redirectAfterLogin();
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const restaurantId = domainContext?.restaurantId;

    if (!restaurantId) {
      toast.error(domainError?.message || t("restaurantContextUnavailable"));
      return;
    }

    if (!googleClientId) {
      toast.error(t("googleClientMissing"));
      return;
    }

    try {
      setIsGoogleSubmitting(true);
      await loadGoogleIdentityScript();
      const googleId = (window as GoogleWindow).google?.accounts?.id;

      if (!googleId) {
        throw new Error(t("googleUnavailable"));
      }

      googleId.initialize({
        client_id: googleClientId,
        callback: async (response: GoogleCredentialResponse) => {
          try {
            if (!response.credential) {
              throw new Error(t("googleCredentialMissing"));
            }

            const data = await googleLoginCustomer({
              idToken: response.credential,
              restaurantId,
            });

            login(data);
            toast.success(t("loginSuccessful"));
            redirectAfterLogin();
          } catch (error) {
            toast.error(getAuthErrorMessage(error));
          } finally {
            setIsGoogleSubmitting(false);
          }
        },
      });

      googleId.prompt();
    } catch (error) {
      setIsGoogleSubmitting(false);
      toast.error(
        error instanceof Error ? error.message : getAuthErrorMessage(error),
      );
    }
  };

  return (
    <div className="w-full lg:mr-[79px]">
      <div className="space-y-1">
        <h1 className="text-headline-sm font-bold font-roboto text-primary">
          {t("login")}
        </h1>
        <p className={MUTED_TEXT_CLASS}>{t("loginDescription")}</p>
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
          className="max-h-[calc(100dvh-24px)] overflow-y-auto border-0 bg-[#fffdfb] px-5 py-7 text-center shadow-[0_20px_64px_rgba(70,20,20,0.16)] sm:max-w-[540px] sm:rounded-[24px] sm:px-11"
        >
          <DialogClose className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#333] transition hover:bg-[#fff7f7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b3121b]/30 sm:right-5 sm:top-5">
            <span
              className="text-xl font-light leading-none"
              aria-hidden="true"
            >
              ×
            </span>
            <span className="sr-only">{t("backToLogin")}</span>
          </DialogClose>

          <DialogHeader className="items-center space-y-3 text-center">
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-[#f7d8c8] bg-[#fff1e7] shadow-[0_10px_24px_rgba(190,20,30,0.12)]">
              <Sparkles
                className="absolute -left-6 top-4 h-4 w-4 text-[#f1b9a4]"
                aria-hidden="true"
              />
              <User
                className="h-8 w-8 text-[#b3121b]"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <Sparkles
                className="absolute -right-5 bottom-4 h-3.5 w-3.5 text-[#f1b9a4]"
                aria-hidden="true"
              />
            </div>

            <div className="w-full space-y-2">
              <DialogTitle className="w-full text-center font-serif text-[30px] leading-[0.95] text-gray-950 sm:text-[32px]">
                {t.rich("guestWelcome", {
                  guest: (chunks) => (
                    <span className="text-[#b3121b]">{chunks}</span>
                  ),
                })}
              </DialogTitle>
              <div
                className="flex items-center justify-center gap-2.5"
                aria-hidden="true"
              >
                <span className="h-px w-10 bg-[#ef9c9c]" />
                <span className="text-sm text-[#b3121b]">◆</span>
                <span className="h-px w-10 bg-[#ef9c9c]" />
              </div>
              <DialogDescription className="mx-auto max-w-[360px] text-sm leading-6 text-[#6f7480] sm:text-[15px]">
                {t("guestDialogDescription")}
              </DialogDescription>
            </div>
          </DialogHeader>

          <form
            onSubmit={guestForm.handleSubmit(onGuestSubmit)}
            className="mt-1 space-y-3"
            noValidate
          >
            <div className="relative">
              <User
                className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9ca3af]"
                strokeWidth={1.7}
                aria-hidden="true"
              />
              <Input
                id="guestName"
                autoFocus
                placeholder={t("guestOptionalNamePlaceholder")}
                className="h-12 rounded-[10px] border border-[#fac7c7] bg-white pl-11 pr-5 text-sm text-[#222] shadow-[0_6px_18px_rgba(190,20,30,0.06)] placeholder:text-[#8b9099] focus-visible:ring-[#b3121b]/25 sm:h-[52px] sm:text-[15px]"
                {...guestForm.register("name")}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading || domainLoading}
              className="h-12 w-full rounded-[10px] bg-gradient-to-b from-[#d01827] to-[#a90f19] text-base font-semibold text-white shadow-[0_12px_22px_rgba(190,20,30,0.22)] hover:from-[#df1a2a] hover:to-[#a90f19] sm:h-[52px]"
            >
              <Sparkles
                className="mr-2.5 h-4 w-4 text-[#fff0bd]"
                aria-hidden="true"
              />
              {isLoading ? t("starting") : t("continueAsGuest")}
            </Button>

            <div className="flex items-center justify-center gap-3 text-sm text-[#777]">
              <span className="h-px w-12 bg-[#f4b8b8]" />
              <span>{t("or")}</span>
              <span className="h-px w-12 bg-[#f4b8b8]" />
            </div>

            <button
              type="button"
              disabled={isLoading || domainLoading}
              onClick={() => void onGuestSubmit({ name: "" })}
              className="flex h-16 w-full flex-col items-center justify-center rounded-[10px] border border-[#ef9c9c] bg-transparent text-[#b3121b] transition hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60 sm:h-[68px]"
            >
              <span className="flex items-center text-base font-semibold">
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                {t("skipForNow")}
              </span>
              <span className="mt-0.5 flex items-center text-xs text-[#777d89]">
                {t("addNameLater")}
                <Heart
                  className="ml-1 h-3.5 w-3.5 text-[#ef9c9c]"
                  aria-hidden="true"
                />
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
  );
}
