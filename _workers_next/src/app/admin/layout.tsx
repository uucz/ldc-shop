import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/sidebar"
import { UpdateNotification } from "@/components/admin/update-notification"
import { getSetting, setSetting } from "@/lib/db/queries"
import { RegistryPrompt } from "@/components/admin/registry-prompt"
import { isRegistryEnabled } from "@/lib/registry"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const session = await auth()
    const user = session?.user

    // Admin Check - redirect to home if not admin
    const adminUsers = process.env.ADMIN_USERS?.toLowerCase().split(',') || []
    if (!user || !user.username || !adminUsers.includes(user.username.toLowerCase())) {
        redirect("/")
    }

    if (user?.avatar_url) {
        try {
            const currentLogo = await getSetting("shop_logo")
            if (!currentLogo || !currentLogo.trim()) {
                await setSetting("shop_logo", user.avatar_url)
            }
        } catch {
            // best effort
        }
    }

    const registryEnabled = isRegistryEnabled()
    let registryPrompted = null
    let registryOptIn = null
    if (registryEnabled) {
        try {
            const [prompted, optIn] = await Promise.all([
                getSetting("registry_prompted"),
                getSetting("registry_opt_in"),
            ])
            registryPrompted = prompted
            registryOptIn = optIn
        } catch {
            registryPrompted = null
            registryOptIn = null
        }
    }

    const shouldPrompt = registryEnabled && registryPrompted !== "true" && registryOptIn !== "true"

    return (
        <div className="flex min-h-screen flex-col">
            <UpdateNotification />
            <RegistryPrompt shouldPrompt={shouldPrompt} registryEnabled={registryEnabled} />
            <div className="flex flex-1 flex-col md:flex-row">
                <AdminSidebar username={user.username} />
                <main className="flex-1 p-6 md:p-12 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
