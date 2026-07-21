"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSafeRedirectPath } from "@/lib/auth-routes";
import { getAuthErrorMessage } from "@/lib/auth";
import { useDomainContext } from "@/hooks/useDomainContext";
import { forgotPassword } from "@/services/auth";
import { MUTED_TEXT_CLASS } from "@/components/common/common-classes";
import {
  createForgotPasswordSchema,
  type AuthValidationMessages,
  type ForgotPasswordFormValues,
} from "@/validations/auth";

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
    [t]
  );
};

export function ForgotPassword() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { context: domainContext, loading: domainLoading, error: domainError } = useDomainContext();
  const validationMessages = useAuthValidationMessages();
  const translatedForgotPasswordSchema = useMemo(
    () => createForgotPasswordSchema(validationMessages),
    [validationMessages]
  );
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(translatedForgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });
const [isLoading, setIsLoading] = useState(false);
const [resetUrl, setResetUrl] = useState("");
//  Forgot Password Function
const handleForgotPassword = async (values: ForgotPasswordFormValues) => {
  const restaurantId = domainContext?.restaurantId;
  if (!restaurantId) {
    toast.error(domainError?.message || t("restaurantContextUnavailable"));
    return;
  }

  try {
    setIsLoading(true);

    await forgotPassword({ email: values.email, restaurantId });

// const resetToken = data?.data?.resetToken;

// if (resetToken) {
//   const generatedUrl = `${window.location.origin}/auth/reset-password/${resetToken}?email=${encodeURIComponent(email)}&restaurantId=${restaurantId}`;

//   setResetUrl(generatedUrl);

// } else {
// }


toast.success(t("resetPasswordReady"));

router.push(getSafeRedirectPath(`/auth/reset-password?email=${encodeURIComponent(
  values.email
)}`));

  } catch (error) {
    toast.error(getAuthErrorMessage(error));
  } finally {
    setIsLoading(false);
  }
};
   return (
        <div className="w-full lg:mr-[79px]">

            <div className="space-y-1">
                <h1 className="text-headline-sm font-bold font-roboto text-primary">{t("forgotPasswordTitle")}</h1>
                <p className={MUTED_TEXT_CLASS}>{t("forgotPasswordDescription")}</p>
            </div>


            <form onSubmit={form.handleSubmit(handleForgotPassword)} className="space-y-[16px] mt-[35px] mb-[19px]" noValidate>
                {/* Email */}
                <div className="relative">
                    <Input
                        id="email"
                        type="email"
                        placeholder={t("email")}
                        required
                        {...form.register("email")}
                    />
                </div>

                {/* Login Button */}
                <Button
                    type="submit"
                    disabled={isLoading || domainLoading}
                    className="w-full h-[50px] text-lg font-semibold bg-primary hover:bg-primary/90 text-white rounded-base transition-colors mb-[15px]"
                >
                    {isLoading ? tCommon("submitting") : t("submit")}
                </Button>
            </form>
{resetUrl && (
  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
    <p className="text-xs text-yellow-700 font-medium mb-2">
      {t("devModeResetLink")}
    </p>

    <a
      href={resetUrl}
      className="text-sm text-blue-600 break-all hover:underline"
    >
      {resetUrl}
    </a>
  </div>
)}



        </div>
    )
}
