import { AuthHero } from "@/components/pages/Auth/components/hero"
import ForgotPassword from "@/components/forms/ForgotPassword"

export const metadata = {
    title: "Forgot Password | Food",
    description: "Reset password to your account",
}

export function ForgotPasswordPage() {
    return (
        <div className="flex flex-col flex-1 lg:flex-row gap-[70px] xl:gap-[130px] min-h-screen">
            <AuthHero />

            <div className="flex items-center justify-center lg:justify-normal w-full flex-1 px-4 md:px-32 lg:px-0 py-[85px]">
               <ForgotPassword />
            </div>
        </div>
    )
}