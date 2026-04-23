import type { ComponentType } from "react";

type IconProps = { className?: string };

export function GitHubIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

export function SlackIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zm1.271 0a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zm0 1.271a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zm10.122 2.521a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zm-1.268 0a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zm0-1.268a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  );
}

export function DiscordIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .078-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export function StripeIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  );
}

export function NotionIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.98-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.166V6.354c0-.606-.233-.933-.748-.886l-15.177.84c-.56.047-.747.327-.747.98zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952l1.448.327s0 .84-1.168.84l-3.222.187c-.093-.187 0-.653.327-.746l.84-.234V8.866L7.272 8.72c-.094-.42.14-1.026.793-1.073l3.455-.234 4.764 7.28V8.44l-1.215-.14c-.093-.513.28-.886.747-.933zM2.738 1.922l13.588-.84c1.68-.14 2.1.093 2.8.606l3.876 2.753c.466.326.606.513.606 1.026v15.17c0 .935-.374 1.495-1.635 1.588l-15.457.92c-.935.047-1.402-.093-1.869-.7L1.197 18.64c-.56-.7-.793-1.214-.793-1.868V3.604c0-.84.374-1.54 1.635-1.682z" />
    </svg>
  );
}

export function GoogleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GmailIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function GoogleSheetsIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        d="M19.385 2H6.615C5.17 2 4 3.17 4 4.615v14.77C4 20.83 5.17 22 6.615 22h12.77C20.83 22 22 20.83 22 19.385V4.615C22 3.17 20.83 2 19.385 2z"
        fill="#0F9D58"
      />
      <path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h7v2H7z" fill="white" />
    </svg>
  );
}

export function TypeformIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M1.333 0v24h21.334V0H1.333zm12.446 6.65h-3.093v10.7H8.353V6.65H5.26V4.65h8.52v2z" />
    </svg>
  );
}

export function GoogleCalendarIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d="M18.316 5.684H24v12.632h-5.684V5.684z" fill="#1967D2" />
      <path d="M5.684 18.316H0V5.684h5.684v12.632z" fill="#1967D2" />
      <path
        d="M18.316 24V18.316H5.684V24l6.316-2.526L18.316 24z"
        fill="#1967D2"
      />
      <path d="M5.684 5.684V0h12.632v5.684H5.684z" fill="#1967D2" />
      <path d="M18.316 5.684H5.684v12.632h12.632V5.684z" fill="white" />
      <path
        d="M9.3 16.03a2.73 2.73 0 0 1-1.81-1.05l.8-.66c.35.45.8.77 1.37.77.58 0 1.05-.32 1.05-.82 0-.5-.37-.82-1.08-.82h-.67v-.9h.57c.58 0 .92-.28.92-.73s-.37-.7-.85-.7c-.46 0-.8.23-1.12.6l-.72-.72c.55-.6 1.13-.88 1.9-.88 1.1 0 1.88.58 1.88 1.5 0 .62-.37 1.05-.87 1.27.6.2 1.02.7 1.02 1.35 0 1.04-.92 1.7-2 1.7zm4.35-.1V8.59l-1.55.55-.3-.9 2.15-.78h.7v8.47h-1z"
        fill="#1967D2"
      />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

export function RazorpayIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22.436 0l-11.91 7.083-1.174 4.556 6.934-4.126L10.07 24h4.212L22.436 0zM7.502 7.376L1.564 24h4.283l3.903-10.873-2.248-5.751z" />
    </svg>
  );
}

export function MSG91Icon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4l4 4 4-4h4c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
    </svg>
  );
}

/** OpenAI wordmark (official-style mark; single path, scales at small sizes). */
export function OpenAIIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22.2819 9.8211a5.9857 5.9857 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9857 5.9857 0 0 0-3.9987 2.9 6.0462 6.0462 0 0 0 .7515 7.2007 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.98 5.98 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.99 5.99 0 0 0 .511-4.9107 6.05 6.05 0 0 0-3.2645-2.9zM8.5 9.2h3.1l1.1 2.2 1.1-2.2h3.1v7.1h-2.1v-4.1l-1.1 2.2h-2.1l-1.1-2.2v4.1H8.5V9.2z" />
    </svg>
  );
}

export function WebhookIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M10.46 9.8a3.5 3.5 0 0 0-4.95-.56c-1.49 1.2-1.72 3.39-.52 4.88.27.33.59.6.95.8l-1.56 5.28 2.1.62 1.56-5.28A3.5 3.5 0 0 0 10.46 9.8zm5.08 4.4a3.5 3.5 0 0 0 4.95.56c1.49-1.2 1.72-3.39.52-4.88a3.48 3.48 0 0 0-.95-.8l1.56-5.28-2.1-.62-1.56 5.28a3.5 3.5 0 0 0-2.42 5.74zM12 2a3.5 3.5 0 0 0-3.5 3.5c0 .43.08.84.22 1.22L3.74 9.33l1.05 1.82 4.98-2.62A3.5 3.5 0 0 0 15.5 5.5 3.5 3.5 0 0 0 12 2z" />
    </svg>
  );
}

export type BrandConfig = {
  icon: ComponentType<IconProps>;
  bg: string;
  text: string;
  label: string;
};

export const brands: Record<string, BrandConfig> = {
  github: {
    icon: GitHubIcon,
    bg: "bg-[#24292f]",
    text: "text-white",
    label: "GitHub",
  },
  slack: {
    icon: SlackIcon,
    bg: "bg-[#4A154B]",
    text: "text-white",
    label: "Slack",
  },
  discord: {
    icon: DiscordIcon,
    bg: "bg-[#5865F2]",
    text: "text-white",
    label: "Discord",
  },
  typeform: {
    icon: TypeformIcon,
    bg: "bg-[#262627]",
    text: "text-white",
    label: "Typeform",
  },
  gmail: {
    icon: GmailIcon,
    bg: "bg-red-50",
    text: "text-red-600",
    label: "Gmail",
  },
  google: {
    icon: GoogleIcon,
    bg: "bg-white",
    text: "text-gray-700",
    label: "Google",
  },
  stripe: {
    icon: StripeIcon,
    bg: "bg-[#635BFF]",
    text: "text-white",
    label: "Stripe",
  },
  notion: {
    icon: NotionIcon,
    bg: "bg-[#000000]",
    text: "text-white",
    label: "Notion",
  },
  sheets: {
    icon: GoogleSheetsIcon,
    bg: "bg-green-50",
    text: "text-green-700",
    label: "Google Sheets",
  },
  calendar: {
    icon: GoogleCalendarIcon,
    bg: "bg-blue-50",
    text: "text-blue-700",
    label: "Calendar",
  },
  whatsapp: {
    icon: WhatsAppIcon,
    bg: "bg-[#25D366]",
    text: "text-white",
    label: "WhatsApp",
  },
  razorpay: {
    icon: RazorpayIcon,
    bg: "bg-[#0C2451]",
    text: "text-[#3395FF]",
    label: "Razorpay",
  },
  msg91: {
    icon: MSG91Icon,
    bg: "bg-[#FF6B35]",
    text: "text-white",
    label: "MSG91",
  },
  webhook: {
    icon: WebhookIcon,
    bg: "bg-blue-50",
    text: "text-blue-600",
    label: "Webhook",
  },
  openai: {
    icon: OpenAIIcon,
    bg: "bg-[#10A37F]",
    text: "text-white",
    label: "OpenAI",
  },
};

export function getBrand(idOrName: string): BrandConfig | undefined {
  const key = idOrName.toLowerCase();
  if (brands[key]) return brands[key];
  for (const [k, v] of Object.entries(brands)) {
    if (key.includes(k)) return v;
  }
  return undefined;
}

export function AppIcon({
  app,
  size = "md",
}: {
  app: string;
  size?: "sm" | "md" | "lg";
}) {
  const brand = getBrand(app);
  const sizes = {
    sm: { container: "h-7 w-7", icon: "h-3.5 w-3.5" },
    md: { container: "h-10 w-10", icon: "h-5 w-5" },
    lg: { container: "h-12 w-12", icon: "h-6 w-6" },
  };
  const s = sizes[size];

  if (!brand) {
    return (
      <span
        className={`${s.container} inline-flex shrink-0 items-center justify-center rounded-xl bg-slate-100`}
      >
        <span className="text-xs font-bold text-slate-500">
          {app.charAt(0).toUpperCase()}
        </span>
      </span>
    );
  }

  const Icon = brand.icon;
  return (
    <span
      className={`${s.container} ${brand.bg} inline-flex shrink-0 items-center justify-center rounded-xl border border-black/5`}
    >
      <Icon className={`${s.icon} ${brand.text}`} />
    </span>
  );
}
