import type { MetadataRoute } from 'next'

import { SITE_ORIGIN } from '@/lib/site'

const BASE_URL = SITE_ORIGIN

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/api/',
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  }
}
