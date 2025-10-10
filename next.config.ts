/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  images: {
    domains: ["ui-avatars.com", "res.cloudinary.com"], // ✅ Allow both domains
  },
};

export default nextConfig;
