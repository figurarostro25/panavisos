import { PasswordResetForm } from "@/components/PasswordRecoveryForms";
export const metadata = { title: "Nueva contraseña | Cevenpro", robots: { index: false, follow: false } };
export default async function ResetAccessPage({ searchParams }) { const { token = "" } = await searchParams; return <PasswordResetForm token={token} />; }
