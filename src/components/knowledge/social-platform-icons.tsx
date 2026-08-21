import type { ReactElement, SVGProps } from "react";

import type { SocialPlatformKey } from "@/config/business-profile";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Base({ className, children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={cn("size-4", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 8.5h2.5V5.6c-.4-.1-1.7-.2-3.2-.2-3.2 0-5.3 1.9-5.3 5.4V13H5.5v3.3H8v8.2h3.3v-8.2h2.7L14.5 13H11.3v-2.1c0-.9.3-1.6 1.6-1.6z" />
    </Base>
  );
}

export function InstagramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2zm0 7.9a3.1 3.1 0 1 1 0-6.2 3.1 3.1 0 0 1 0 6.2z" />
      <path d="M17.5 6.3a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0z" />
      <path d="M12 3.4c2.2 0 2.5 0 3.3.1.8 0 1.4.2 1.9.4.5.2.9.5 1.3.9.4.4.7.8.9 1.3.2.5.3 1.1.4 1.9.1.8.1 1.1.1 3.3s0 2.5-.1 3.3c0 .8-.2 1.4-.4 1.9-.2.5-.5.9-.9 1.3-.4.4-.8.7-1.3.9-.5.2-1.1.3-1.9.4-.8.1-1.1.1-3.3.1s-2.5 0-3.3-.1c-.8 0-1.4-.2-1.9-.4-.5-.2-.9-.5-1.3-.9-.4-.4-.7-.8-.9-1.3-.2-.5-.3-1.1-.4-1.9-.1-.8-.1-1.1-.1-3.3s0-2.5.1-3.3c0-.8.2-1.4.4-1.9.2-.5.5-.9.9-1.3.4-.4.8-.7 1.3-.9.5-.2 1.1-.3 1.9-.4.8-.1 1.1-.1 3.3-.1zm0-1.6c-2.2 0-2.5 0-3.4.1-.9 0-1.6.2-2.1.4-.6.2-1.1.5-1.6 1-.5.5-.8 1-1 1.6-.2.5-.4 1.2-.4 2.1-.1.9-.1 1.2-.1 3.4s0 2.5.1 3.4c0 .9.2 1.6.4 2.1.2.6.5 1.1 1 1.6.5.5 1 .8 1.6 1 .5.2 1.2.4 2.1.4.9.1 1.2.1 3.4.1s2.5 0 3.4-.1c.9 0 1.6-.2 2.1-.4.6-.2 1.1-.5 1.6-1 .5-.5.8-1 1-1.6.2-.5.4-1.2.4-2.1.1-.9.1-1.2.1-3.4s0-2.5-.1-3.4c0-.9-.2-1.6-.4-2.1-.2-.6-.5-1.1-1-1.6-.5-.5-1-.8-1.6-1-.5-.2-1.2-.4-2.1-.4-.9-.1-1.2-.1-3.4-.1z" />
    </Base>
  );
}

export function TikTokIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M19.6 8.2a5.7 5.7 0 0 1-3.4-1.1v6.5a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6 0 .9.1v2.8a2.8 2.8 0 1 0 2 2.7V2.8h2.7a5.7 5.7 0 0 0 3.4 3.4v2z" />
    </Base>
  );
}

export function LinkedInIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.3 9.3H3.5V20h2.8V9.3zM4.9 4a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2zM20.5 13.2c0-3-1.6-4.4-3.8-4.4-1.7 0-2.5.9-3 1.6V9.3h-2.8c0 .8 0 10.7 0 10.7h2.8v-6c0-.3 0-.6.1-.9.3-.6.8-1.3 1.8-1.3 1.3 0 1.8 1 1.8 2.4V20h2.8v-6.8z" />
    </Base>
  );
}

export function YouTubeIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.2V8.8l5.2 3.2L10 15.2z" />
    </Base>
  );
}

export function XIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M17.5 3.5h2.6l-5.7 6.5L21.5 20h-5.3l-4.2-5.5L7.2 20H4.6l6.1-7L3.2 3.5h5.5l3.8 5 5-5zm-.9 14.9h1.4L7.9 4.9H6.4l10.2 13.5z" />
    </Base>
  );
}

export function WhatsAppIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.2A8.7 8.7 0 0 0 5.1 16.7L4 20.8l4.2-1.1A8.7 8.7 0 1 0 12 3.2zm5.1 12.4a7.2 7.2 0 0 1-8.2 1.4l-.4-.2-2.5.7.7-2.4-.2-.4a7.2 7.2 0 1 1 10.6.9zm-2.4-3.7c-.1-.2-.5-.4-1-.6s-.6-.1-.8.1l-.4.4c-.1.2-.3.3-.6.2a5.3 5.3 0 0 1-2.5-2.2c-.1-.2 0-.4.1-.5l.3-.4c.1-.1.1-.3.1-.4s0-.3-.1-.4l-.6-1.4c-.2-.4-.3-.4-.5-.4h-.4c-.2 0-.4.1-.6.3s-.8.8-.8 1.9.8 2.2.9 2.3a8.5 8.5 0 0 0 3.4 2.8c1.3.5 1.6.4 1.9.4.3 0 .9-.4 1-.7.1-.4.1-.7.1-.8z" />
    </Base>
  );
}

export function TelegramIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21.5 4.4 3.7 11.3c-1.2.5-1.2 1.1-.2 1.4l4.6 1.4 1.8 5.4c.2.6.4.8 1 .8.6 0 .9-.3 1.2-.6l2.6-2.5 5.4 4c1 .5 1.7.3 2-.9L23 5.8c.3-1.3-.5-1.9-1.5-1.4zM9.6 14.3l8.9-5.6c.4-.3.8-.1.5.2l-7.6 6.9-.3 3.2-1.5-4.7z" />
    </Base>
  );
}

const ICON_MAP = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  tiktok: TikTokIcon,
  linkedin: LinkedInIcon,
  youtube: YouTubeIcon,
  x: XIcon,
  whatsapp: WhatsAppIcon,
  telegram: TelegramIcon,
} as const satisfies Record<
  SocialPlatformKey,
  (props: IconProps) => ReactElement
>;

export function SocialPlatformIcon({
  platform,
  className,
}: {
  platform: SocialPlatformKey;
  className?: string;
}) {
  const Icon = ICON_MAP[platform];
  return <Icon className={className} />;
}
