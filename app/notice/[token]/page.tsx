import { PublicVerify } from "@/components/notice/public-verify"

export default async function NoticeVerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <PublicVerify token={token} />
}
