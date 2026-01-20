import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { BuyContent } from "@/components/buy-content"
import { getProduct, getProductReviews, getProductRating, canUserReview } from "@/lib/db/queries"
import { getEmailSettings } from "@/lib/email"
import { unstable_cache } from "next/cache"

export const dynamic = 'force-dynamic'

interface BuyPageProps {
    params: Promise<{ id: string }>
}

const CACHE_TTL_SECONDS = 60 * 60 * 24
const TAG_PRODUCTS = "home:products"
const TAG_RATINGS = "home:ratings"

export default async function BuyPage({ params }: BuyPageProps) {
    const { id } = await params

    const getCachedProduct = () => unstable_cache(
        async () => getProduct(id),
        ["product-detail", id],
        { revalidate: CACHE_TTL_SECONDS, tags: [TAG_PRODUCTS] }
    )()

    const getCachedReviews = () => unstable_cache(
        async () => getProductReviews(id),
        ["product-reviews", id],
        { revalidate: CACHE_TTL_SECONDS, tags: [TAG_RATINGS] }
    )()

    const getCachedRating = () => unstable_cache(
        async () => getProductRating(id),
        ["product-rating", id],
        { revalidate: CACHE_TTL_SECONDS, tags: [TAG_RATINGS] }
    )()

    // Run all queries in parallel for better performance
    const [session, product, reviews, rating, emailSettings] = await Promise.all([
        auth(),
        getCachedProduct().catch(() => null),
        getCachedReviews().catch(() => []),
        getCachedRating().catch(() => ({ average: 0, count: 0 })),
        getEmailSettings().catch(() => ({ apiKey: null, fromEmail: null, enabled: false, fromName: null }))
    ])

    // Return 404 if product doesn't exist or is inactive
    if (!product) {
        notFound()
    }

    // Check review eligibility (depends on session, so run after)
    let userCanReview: { canReview: boolean; orderId?: string } = { canReview: false }
    if (session?.user?.id) {
        try {
            userCanReview = await canUserReview(session.user.id, id, session.user.username || undefined)
        } catch {
            // Ignore errors
        }
    }

    return (
        <BuyContent
            product={product}
            stockCount={product.stock || 0}
            lockedStockCount={product.locked || 0}
            isLoggedIn={!!session?.user}
            reviews={reviews}
            averageRating={rating.average}
            reviewCount={rating.count}
            canReview={userCanReview.canReview}
            reviewOrderId={userCanReview.orderId}
            emailEnabled={!!(emailSettings?.enabled && emailSettings?.apiKey && emailSettings?.fromEmail)}
        />
    )
}
