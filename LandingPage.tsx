import { useState, type CSSProperties, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import MiniSupportChat from '@/components/MiniSupportChat';
import RoyaltyEarningsCalculator from '@/components/partner/RoyaltyEarningsCalculator';
import {
  brandingApi,
  getCachedBranding,
  setCachedBranding,
  preloadLogo,
  type BrandingInfo,
} from '@/api/branding';
import { useAuthStore } from '@/store/auth';

const LANDING_TARIFF_DEVICE_LIMITS: Record<string, number> = {
  mini: 1,
  standart: 3,
  pro: 5,
  family: 7,
  familypro: 10,
};

const LANDING_TARIFF_TRAFFIC_LABELS: Record<string, string> = {
  mini: 'Безлимитный трафик\n+15 ГБ (На случай когда глушат связь)',
  standart: 'Безлимитный трафик\n+40 ГБ (На случай когда глушат связь)',
  pro: 'Безлимитный трафик\n+60 ГБ (На случай когда глушат связь)',
  family: 'Безлимитный трафик\n+70 ГБ (На случай когда глушат связь)',
  familypro: 'Безлимитный трафик\n+100 ГБ (На случай когда глушат связь)',
};

const LANDING_FEATURES = [
  { id: '1', title: 'Безлимитный трафик на всех тарифах', icon: 'infinity' },
  { id: '2', title: 'Работает даже когда глушат связь', icon: 'signal' },
  { id: '3', title: 'Не нужно переключаться между локациями', icon: 'layers' },
  { id: '4', title: 'Подходит для любых устройств', icon: 'devices' },
  { id: '5', title: 'Можно зарабатывать до 500 000 ₽ в месяц', icon: 'spark' },
] as const;

const TARIFF_KEYS = ['mini', 'standart', 'pro', 'family', 'familypro'] as const;

const INTRO_BOLD: CSSProperties = { fontFamily: "'Intro Bold', 'Inter', sans-serif" };
const EVOLVENTA: CSSProperties = { fontFamily: "'Evolventa', 'Inter', sans-serif" };

const FEATURE_ICONS: Record<string, ReactNode> = {
  infinity: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.178 8.25A4.928 4.928 0 0014.5 9.9L12 12.4 9.5 9.9A5 5 0 102.428 16.97 4.928 4.928 0 006.106 18.6c1.327 0 2.598-.527 3.536-1.464L12 14.8l2.358 2.336A5 5 0 1021.57 9.9a4.967 4.967 0 00-3.392-1.65z" />
    </svg>
  ),
  signal: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9.75a11.25 11.25 0 0115 0M7.5 12.75a6.75 6.75 0 019 0M10.5 15.75a2.25 2.25 0 013 0M12 19.5h.008v.008H12V19.5z" />
    </svg>
  ),
  layers: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6l8.25 4.5L12 15 3.75 10.5 12 6z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5L12 18l8.25-4.5" />
    </svg>
  ),
  devices: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 7.5A2.25 2.25 0 016 5.25h8.25A2.25 2.25 0 0116.5 7.5v5.25A2.25 2.25 0 0114.25 15H6a2.25 2.25 0 01-2.25-2.25V7.5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18.75h6M18 9.75h.75A1.5 1.5 0 0120.25 11.25v5.25A2.25 2.25 0 0118 18.75h-3" />
    </svg>
  ),
  spark: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l1.7 4.75L18.5 9.5l-4.8 1.75L12 16l-1.7-4.75L5.5 9.5l4.8-1.75L12 3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 15l.9 2.6L22 18.5l-2.6.9-.9 2.6-.9-2.6-2.6-.9 2.6-.9.9-2.6z" />
    </svg>
  ),
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const cardIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};

function NeonButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative inline-flex items-center justify-center rounded-full px-10 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-[1.03] min-w-[15rem] sm:min-w-[17rem] sm:px-12 sm:py-4 sm:text-base md:px-14 md:py-4 md:text-base"
      style={{
        background: 'linear-gradient(90deg, #003a55 0%, #001850 35%, #1a0035 65%, #3a0030 100%)',
        boxShadow: `0 0 22px 4px rgba(0, 210, 255, 0.35), 0 0 22px 4px rgba(255, 45, 117, 0.35), 0 4px 12px rgba(0, 0, 0, 0.6)`,
        ...EVOLVENTA,
      }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full" style={{ padding: '2px', background: 'linear-gradient(90deg, #00D2FF, #0047FF, #FF2D75)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude' }} />
      <span className="pointer-events-none absolute rounded-full" style={{ inset: '4px', padding: '1px', background: 'linear-gradient(90deg, #00D2FF, #0047FF, #FF2D75)', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor', maskComposite: 'exclude', opacity: 0.4 }} />
      <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(ellipse 70% 100% at 0% 50%, rgba(0,210,255,0.65) 0%, rgba(0,71,255,0.25) 60%, transparent 100%)' }} />
      <span className="pointer-events-none absolute inset-0 rounded-full" style={{ background: 'radial-gradient(ellipse 70% 100% at 100% 50%, rgba(255,45,117,0.65) 0%, rgba(139,0,255,0.25) 60%, transparent 100%)' }} />
      <span className="pointer-events-none absolute left-7 right-7 top-0 h-[3px] rounded-full" style={{ background: 'linear-gradient(90deg, #00D2FF, #FF2D75)', filter: 'blur(3px)', opacity: 0.85 }} />
      <span className="pointer-events-none absolute left-7 right-7 top-[1px] h-px rounded-full" style={{ background: 'linear-gradient(90deg, #00D2FF, #FF2D75)', opacity: 0.95 }} />
      <span className="pointer-events-none absolute bottom-0 left-7 right-7 h-[3px] rounded-full" style={{ background: 'linear-gradient(90deg, #00D2FF, #FF2D75)', filter: 'blur(3px)', opacity: 0.85 }} />
      <span className="pointer-events-none absolute bottom-[1px] left-7 right-7 h-px rounded-full" style={{ background: 'linear-gradient(90deg, #00D2FF, #FF2D75)', opacity: 0.95 }} />

      <span className="relative z-10 whitespace-nowrap">{children}</span>
    </button>
  );
}

export default function LandingPage() {
  const { t } = useTranslation();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [isPurchaseSheetOpen, setIsPurchaseSheetOpen] = useState(false);

  const cachedBranding = getCachedBranding();
  const { data: branding } = useQuery<BrandingInfo>({
    queryKey: ['branding'],
    queryFn: async () => {
      const data = await brandingApi.getBranding();
      setCachedBranding(data);
      await preloadLogo(data);
      return data;
    },
    staleTime: 60000,
    initialData: cachedBranding ?? undefined,
  });

  const appName = branding?.name || import.meta.env.VITE_APP_NAME || 'VPN';

  const handlePurchaseEntry = () => {
    if (isAuthenticated) {
      window.location.href = '/subscription/purchase';
      return;
    }
    setIsPurchaseSheetOpen(true);
  };

  return (
    <div className="landing-page-shell force-dark relative min-h-dvh overflow-hidden bg-transparent text-dark-100">
      <div aria-hidden="true" className="app-background pointer-events-none fixed inset-0 z-0" />

      <MiniSupportChat className="fixed !bottom-6 !top-auto z-[9999]" style={{ right: '10px' }} panelClassName="!top-auto !bottom-24 !right-6" />

      <main className="relative z-10 w-full">
        {/* Language Switcher */}
        <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16 pt-3 flex items-center justify-end">
          <LanguageSwitcher />
        </div>

        {/* HERO */}
        <section className="flex flex-col justify-center px-4 py-16 sm:py-20 2xl:py-24">
          <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16">

            {/* Grid: Logo + Text */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 lg:gap-16 items-center">
              {/* Logo */}
              <div className="md:col-span-5 flex justify-center md:justify-start">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8 }}>
                  <div className="relative">
                    <div className="absolute inset-0 -z-10 scale-[0.7] rounded-full bg-[radial-gradient(circle,rgba(123,47,247,0.4),rgba(255,45,117,0.15),transparent_70%)] blur-3xl" />
                    <img
                      src="/klop.png"
                      alt={`${appName} logo`}
                      className="h-auto w-full max-w-[min(78vw,22rem)] sm:max-w-[28rem] md:max-w-[34rem] lg:max-w-[38rem] 2xl:max-w-[42rem] object-contain drop-shadow-[0_0_50px_rgba(123,47,247,0.45)]"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Text Content — без кнопки */}
              <div className="md:col-span-7 flex flex-col items-center md:items-start text-center md:text-left">
                <motion.div initial="hidden" animate="visible" variants={fadeUp}>
                  <h1 className="mb-4 font-bold uppercase leading-[0.94] tracking-tight text-white text-4xl md:text-5xl lg:text-6xl 2xl:text-7xl" style={INTRO_BOLD}>
                    {t('landing.hero.title', { name: appName, defaultValue: 'Включил и забыл' })}
                  </h1>

                  <div className="flex flex-col gap-2 mb-8">
                    <p className="font-semibold leading-tight bg-gradient-to-r from-[#a855f7] to-[#f97316] bg-clip-text text-transparent text-xl md:text-2xl lg:text-3xl 2xl:text-4xl" style={EVOLVENTA}>
                      {t('landing.hero.subtitle', 'работают ВСЕ приложения и сайты')}
                    </p>
                    <p className="font-semibold leading-tight bg-gradient-to-r from-[#a855f7] to-[#f97316] bg-clip-text text-transparent text-lg md:text-2xl lg:text-3xl 2xl:text-4xl" style={EVOLVENTA}>
                      {t('landing.hero.subtitleSecondary', 'проверь сам за 1₽')}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>

            {/* Кнопка — строго по центру экрана */}
            <div className="flex justify-center mt-10 sm:mt-12">
              <NeonButton onClick={handlePurchaseEntry}>
                {t('landing.hero.ctaTrial', 'начать за 1₽ на 3 дня')}
              </NeonButton>
            </div>

          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="border-t border-white/[0.06] px-4 py-16 sm:py-24 2xl:py-28">
          <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16">
            <div className="grid md:grid-cols-12 gap-12 lg:gap-16 items-center">
              <motion.div className="md:col-span-7 flex flex-col gap-4" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                {LANDING_FEATURES.map((feature) => (
                  <motion.div
                    key={feature.id}
                    variants={cardIn}
                    className="group flex items-center gap-6 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 backdrop-blur-md transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.05]"
                  >
                    <span className="text-4xl font-black italic text-white/20 group-hover:text-[#ff2d75]/60" style={INTRO_BOLD}>
                      {feature.id}
                    </span>
                    <div className="flex-grow">
                      <span className="text-lg font-medium text-dark-100 sm:text-xl 2xl:text-2xl" style={EVOLVENTA}>
                        {feature.title}
                      </span>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.1] text-white transition-all group-hover:text-[#00c6ff]">
                      {FEATURE_ICONS[feature.icon]}
                    </div>
                  </motion.div>
                ))}
              </motion.div>

              <div className="md:col-span-5 flex justify-center">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
                  <div className="relative w-full max-w-[480px] 2xl:max-w-[520px]">
                    <div className="aspect-square w-full overflow-hidden rounded-[40px]">
                      <img src="/features-visual.png" alt="Features" className="h-full w-full object-contain" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* TARIFFS */}
        <section id="tariffs" className="scroll-mt-24 border-t border-white/[0.06] px-4 py-16 sm:py-20 2xl:py-24">
          <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16">
            <h2 className="mb-10 text-2xl font-bold uppercase text-white sm:text-3xl 2xl:text-4xl" style={INTRO_BOLD}>
              {t('landing.tariffs.title', 'Выберите тариф')}
            </h2>

            <motion.div className="grid gap-4 xl:grid-cols-5 2xl:gap-6" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {TARIFF_KEYS.map((key) => {
                const isRecommended = key === 'pro';
                return (
                  <motion.div
                    key={key}
                    variants={cardIn}
                    className={`group relative isolate overflow-hidden rounded-[28px] border p-5 sm:p-6 2xl:p-8 backdrop-blur-xl transition-all duration-300 hover:-translate-y-2 hover:scale-[1.03] ${
                      isRecommended
                        ? 'border-violet-400/60 bg-[radial-gradient(circle_at_top_right,rgba(123,47,247,0.18),transparent_38%),rgba(8,13,24,0.7)] shadow-[0_8px_20px_rgba(123,47,247,0.22),0_0_0_1px_rgba(123,47,247,0.25)] hover:shadow-[0_12px_28px_rgba(123,47,247,0.32),0_0_0_1px_rgba(123,47,247,0.38)]'
                        : 'border-white/[0.08] bg-[linear-gradient(145deg,rgba(15,23,42,0.8),rgba(8,13,24,0.65))] hover:border-violet-400/30 hover:shadow-[0_8px_20px_rgba(123,47,247,0.14)]'
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                    <div className="relative flex h-full flex-col">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-[1.4rem] font-bold text-white 2xl:text-2xl" style={INTRO_BOLD}>
                          {key === 'familypro' ? 'FAMILY PRO' : key.toUpperCase()}
                        </div>
                        {isRecommended && <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[9px] text-violet-400">РЕКОМЕНДУЕМ</span>}
                      </div>

                      <div className="mb-5 space-y-2 text-sm 2xl:text-base" style={EVOLVENTA}>
                        {LANDING_TARIFF_TRAFFIC_LABELS[key].split('\n').map((line, idx) => (
                          <span key={idx} className={`block ${idx === 1 ? 'text-[#00c6ff] font-bold mt-1' : 'text-dark-200'}`}>
                            {line}
                          </span>
                        ))}
                        <div className="text-dark-400">{t('subscription.devices', { count: LANDING_TARIFF_DEVICE_LIMITS[key] })}</div>
                      </div>

                      <div className="mt-auto pt-4 border-t border-white/10">
                        <div className="bg-gradient-to-r from-[#00c6ff] via-[#7b2ff7] to-[#ff2d75] bg-clip-text text-2xl font-black text-transparent 2xl:text-3xl" style={INTRO_BOLD}>
                          {t(`landing.tariffs.${key}.price`, '')}
                        </div>
                      </div>

                      <button
                        onClick={handlePurchaseEntry}
                        className={`mt-4 w-full rounded-full py-2.5 font-semibold transition-all ${isRecommended ? 'btn-primary' : 'btn-secondary'} 2xl:py-3 2xl:text-lg`}
                        style={EVOLVENTA}
                      >
                        {t('landing.tariffs.cta', 'Выбрать тариф')}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* PARTNER */}
        <section id="partner" className="border-t border-white/[0.06] py-16 sm:py-20 2xl:py-24">
          <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16">
            <h2 className="mb-6 text-2xl font-bold uppercase text-white sm:text-3xl 2xl:text-4xl" style={INTRO_BOLD}>
              Партнёрка и заработок
            </h2>
            <div className="rounded-[28px] border border-white/[0.06] bg-white/[0.015] backdrop-blur-xl">
              <RoyaltyEarningsCalculator />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-10 bg-dark-950/90 backdrop-blur-xl">
        <div className="mx-auto w-full max-w-[2100px] px-4 md:px-8 xl:px-12 2xl:px-16 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="bg-gradient-to-r from-[#00c6ff] to-[#ff2d75] bg-clip-text text-lg font-black text-transparent" style={INTRO_BOLD}>
            {appName}
          </div>
          <div className="text-sm text-dark-400" style={EVOLVENTA}>
            © {new Date().getFullYear()} {appName}. Все права защищены.
          </div>
        </div>
      </footer>

      {/* Purchase Sheet */}
      {isPurchaseSheetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-dark-950/80 backdrop-blur-md" onClick={() => setIsPurchaseSheetOpen(false)} />
          <motion.div className="relative z-[101] w-full max-w-xl rounded-[32px] border border-white/10 bg-dark-900 p-8" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
            <h3 className="mb-6 text-center text-xl font-bold text-white" style={INTRO_BOLD}>Способ подключения</h3>
            <div className="grid grid-cols-2 gap-4">
              <Link to="/onboarding/tg-blocked/register" className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#a855f7] bg-[#a855f7]/20 p-5 text-center transition-all duration-200 hover:bg-[#a855f7]/30" style={{ boxShadow: '0 0 18px 2px rgba(168,85,247,0.35)' }}>
                <span className="text-xs font-bold uppercase tracking-widest text-[#d8b4fe]" style={EVOLVENTA}>TELEGRAM</span>
                <span className="text-base font-black uppercase tracking-wide text-white" style={INTRO_BOLD}>НЕ РАБОТАЕТ</span>
              </Link>
              <a href="https://t.me/Unlock_tester_bot" target="_blank" rel="noopener noreferrer" className="group relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-[#00c6ff]/60 bg-[#00c6ff]/10 p-5 text-center transition-all duration-200 hover:border-[#00c6ff] hover:bg-[#00c6ff]/20">
                <span className="text-xs font-bold uppercase tracking-widest text-[#00c6ff]" style={EVOLVENTA}>TELEGRAM</span>
                <span className="text-base font-semibold text-[#67e8f9]" style={EVOLVENTA}>работает</span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
