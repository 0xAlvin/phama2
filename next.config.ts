import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'www.tylenol.com',
      'tylenol.com',
      'www.drugs.com',
      'drugs.com',
      'www.wellrx.com',
      'wellrx.com',
      'www.istockphoto.com',
      'imgs.search.brave.com',
      'media.istockphoto.com',
    ],
  }
};

export default nextConfig;
