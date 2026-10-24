/** @type {import('next').NextConfig} */
const nextConfig = {
  // Gallery photos live in /private (never in /public) and are served only
  // through app/media/gallery, so access can be limited to signed-in members.
  outputFileTracingIncludes: { '/media/gallery/[slug]/[file]': ['./private/gallery/**/*'] },
  async headers() {
    return [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }];
  },
};
export default nextConfig;
