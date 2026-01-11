import { headers } from "next/headers"
import { AdminPaymentCodeContent } from "@/components/admin/payment-code-content"

async function resolveBaseUrl() {
    if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`

    const headerList = await headers()
    const forwardedProto = headerList.get('x-forwarded-proto')
    const forwardedHost = headerList.get('x-forwarded-host')
    const host = forwardedHost || headerList.get('host')
    const proto = forwardedProto || 'http'
    if (host) return `${proto}://${host}`
    return 'http://localhost:3000'
}

export default async function AdminCollectPage() {
    const baseUrl = await resolveBaseUrl()
    const payLink = `${baseUrl}/pay`

    return <AdminPaymentCodeContent payLink={payLink} />
}
