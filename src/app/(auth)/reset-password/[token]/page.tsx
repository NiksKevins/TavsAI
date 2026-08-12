import { ResetPasswordForm } from "@/components/auth/reset-password-form";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
