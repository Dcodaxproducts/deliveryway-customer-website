# Image optimization production TODO

Temporarily disabled Next.js image optimization globally in `next.config.ts` with `images.unoptimized = true`.

Reason: the Vercel preview/deployment is returning `OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED` for optimized image requests, so order/customer images need to bypass `/_next/image` for now and load directly from their source URLs.

Before production launch, revisit this and either:

- enable an appropriate Vercel plan/image optimization quota, then remove `images.unoptimized`, or
- keep only targeted `unoptimized` props for hosts/assets that should bypass optimization.

After reverting, verify order pages, menu cards, checkout cart images, restaurant headers, and home page promotional images on the production domain.
