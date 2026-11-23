import { useEffect, useMemo, useState, type RefObject } from 'react';
import type { Level } from '../../stores/gameStore';
import { Button } from '../ui/button';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  Coins,
  Newspaper,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LEVEL_CONFIGS, MOCK_NEWS_BY_LEVEL } from './landingData';

interface HeroSlideProps {
  isDark: boolean;
  level: Level;
  nickname: string;
  isLoading: boolean;
  isKakaoTalk: boolean;
  nicknameInputRef: RefObject<HTMLInputElement | null>;
  onSelectLevel: (level: Level) => void;
  onChangeNickname: (value: string) => void;
  onGuestStart: () => void;
  onOpenGoogleConsent: () => void;
  onScrollNext: () => void;
}

const BASE_PRICE = 82000;

export default function HeroSlide({
  isDark,
  level,
  nickname,
  isLoading,
  isKakaoTalk,
  nicknameInputRef,
  onSelectLevel,
  onChangeNickname,
  onGuestStart,
  onOpenGoogleConsent,
  onScrollNext,
}: HeroSlideProps) {
  const [mockPrice, setMockPrice] = useState(BASE_PRICE);
  const [priceHistory, setPriceHistory] = useState<number[]>([
    80500, 81000, 80800, 81600, 81400, 82000,
  ]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [flashType, setFlashType] = useState<'up' | 'down' | 'flat'>('flat');

  useEffect(() => {
    let flashTimer: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setMockPrice((prev) => {
        const isUp = Math.random() > 0.47;
        const changePercent = 0.002 + Math.random() * 0.0075;
        const delta = Math.round((prev * changePercent) / 100) * 100 || 100;
        const nextPrice = Math.max(72000, Math.min(94000, isUp ? prev + delta : prev - delta));

        setPriceHistory((hist) => [...hist.slice(-9), nextPrice]);
        setFlashType(isUp ? 'up' : 'down');
        return nextPrice;
      });

      if (Math.random() > 0.62) {
        setNewsIndex((prev) => (prev + 1) % 3);
      }

      flashTimer = setTimeout(() => setFlashType('flat'), 550);
    }, 2200);

    return () => {
      clearInterval(interval);
      if (flashTimer) clearTimeout(flashTimer);
    };
  }, []);

  const deltaPct = (((mockPrice - BASE_PRICE) / BASE_PRICE) * 100).toFixed(2);
  const isPositive = mockPrice >= BASE_PRICE;

  const { linePoints, areaPath, maPoints } = useMemo(() => {
    const max = Math.max(...priceHistory);
    const min = Math.min(...priceHistory);
    const range = max - min || 1;
    const width = 300;
    const height = 112;

    const coords = priceHistory.map((p, i) => {
      const x = (i / Math.max(1, priceHistory.length - 1)) * width;
      const y = height - 12 - ((p - min) / range) * (height - 24);
      return { x, y };
    });

    const pts = coords.map((c) => `${c.x},${c.y}`).join(' ');
    const area =
      coords.length > 0
        ? `M ${coords[0].x},${height} ` +
          coords.map((c) => `L ${c.x},${c.y}`).join(' ') +
          ` L ${coords[coords.length - 1].x},${height} Z`
        : '';

    const maHist = priceHistory.map((_, i, arr) => {
      if (i < 2) return arr[i];
      return Math.round((arr[i] + arr[i - 1] + arr[i - 2]) / 3);
    });

    const maPts = maHist
      .map((p, i) => {
        const x = (i / Math.max(1, maHist.length - 1)) * width;
        const y = height - 12 - ((p - min) / range) * (height - 24);
        return `${x},${y}`;
      })
      .join(' ');

    return { linePoints: pts, areaPath: area, maPoints: maPts };
  }, [priceHistory]);

  const activeLevelConfig = LEVEL_CONFIGS.find((l) => l.key === level) ?? LEVEL_CONFIGS[0];

  return (
    <div className="relative w-full min-h-dvh flex flex-col justify-between pt-20 pb-5 px-5 sm:px-8 overflow-x-clip">
      {/* Subtle Ambient Surface Depth (No grids, no harsh neon) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className={cn(
            'absolute -top-24 -left-24 w-[460px] h-[460px] rounded-full blur-[130px] transition-colors duration-500',
            isDark ? 'bg-[#3182F6]/[0.07]' : 'bg-sky-200/35'
          )}
        />
        <div
          className={cn(
            'absolute -bottom-24 right-[8%] w-[420px] h-[420px] rounded-full blur-[130px] transition-colors duration-500',
            isDark ? 'bg-[#F04452]/[0.06]' : 'bg-rose-200/30'
          )}
        />
      </div>

      {/* Main 2-Column Content (Preserves Original Framework) */}
      <div className="w-full max-w-7xl mx-auto relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-12 items-center py-2">
        {/* LEFT COLUMN: Editorial Hero + Level Academy & Entry Form */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-center">
          <div className="space-y-3">
            <p
              className={cn(
                'text-[11px] font-extrabold tracking-[0.18em] uppercase',
                isDark ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              01 · 100% 가상 기업 · 비영리 금융 문해력 시뮬레이터
            </p>

            <h1
              className={cn(
                'text-3xl sm:text-4xl xl:text-[48px] font-black tracking-[-0.03em] leading-[1.12]',
                isDark ? 'text-white' : 'text-slate-900'
              )}
            >
              안전하게 배우는
              <br />
              스탁스쿨{' '}
              <span className={cn('font-extrabold', isDark ? 'text-slate-300' : 'text-slate-700')}>
                StockSchool
              </span>
            </h1>

            <p
              className={cn(
                'text-sm sm:text-[15px] leading-relaxed font-medium max-w-lg',
                isDark ? 'text-slate-400' : 'text-slate-600'
              )}
            >
              실제 돈이 오가지 않는 34개 가상 기업과 588건의 가상 경제 뉴스 속에서 뉴스 독해력,
              분산투자, 합리적 경제 판단 능력을 자연스럽게 익혀보세요.
            </p>
          </div>

          {/* Level Academy & Instant Entry Card */}
          <div
            className={cn(
              'rounded-2xl border p-5 space-y-4 transition-colors duration-300',
              isDark
                ? 'bg-[#1A1F30]/90 border-[#2B334A] shadow-[0_18px_48px_rgba(0,0,0,0.35)]'
                : 'bg-white border-slate-200/90 shadow-[0_18px_48px_rgba(15,23,42,0.06)]'
            )}
          >
            {/* Card Header */}
            <div
              className={cn(
                'flex items-center justify-between border-b pb-3',
                isDark ? 'border-[#2B334A]' : 'border-slate-100'
              )}
            >
              <div>
                <h2
                  className={cn(
                    'font-extrabold text-sm flex items-center gap-1.5',
                    isDark ? 'text-white' : 'text-slate-900'
                  )}
                >
                  <Coins className="w-4 h-4 text-amber-500" />
                  학습 등급 선택
                </h2>
                <p
                  className={cn(
                    'text-[11px] mt-0.5 font-medium',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  등급별 가상 자본금과 뉴스 난이도·차트 수준이 맞춤 설정됩니다
                </p>
              </div>
              <span
                className={cn(
                  'text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0',
                  isDark ? 'bg-white/5 text-slate-400' : 'bg-slate-100 text-slate-500'
                )}
              >
                언제든 전환 가능
              </span>
            </div>

            {/* 3 Level Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEVEL_CONFIGS.map((item) => {
                const isSelected = level === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => onSelectLevel(item.key)}
                    aria-pressed={isSelected}
                    className={cn(
                      'rounded-xl p-3 text-left transition-all border flex flex-row sm:flex-col justify-between cursor-pointer select-none min-h-[76px] sm:min-h-[122px] items-center sm:items-stretch gap-3 sm:gap-0',
                      isSelected
                        ? isDark
                          ? 'border-white/90 bg-white/[0.07] shadow-sm'
                          : 'border-slate-900 bg-slate-900/[0.03] shadow-sm'
                        : isDark
                          ? 'border-[#2B334A] bg-[#141826]/70 hover:border-slate-500'
                          : 'border-slate-200 bg-slate-50/70 hover:border-slate-300'
                    )}
                  >
                    <div className="flex items-center justify-between sm:w-full gap-2">
                      <span className="text-xl leading-none">{item.emoji}</span>
                      <span
                        className={cn(
                          'hidden sm:inline text-[10px] px-1.5 py-0.5 rounded font-extrabold',
                          isSelected
                            ? isDark
                              ? 'bg-white text-slate-950'
                              : 'bg-slate-900 text-white'
                            : isDark
                              ? 'bg-[#22283A] text-slate-400'
                              : 'bg-slate-200/70 text-slate-600'
                        )}
                      >
                        {item.label}
                      </span>
                    </div>

                    <div className="flex-1 sm:flex-initial space-y-0.5 sm:mt-2">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'text-xs font-black',
                            isDark ? 'text-white' : 'text-slate-900'
                          )}
                        >
                          {item.title}
                        </span>
                        <span
                          className={cn(
                            'inline sm:hidden text-[9px] px-1.5 py-0.5 rounded font-extrabold',
                            isSelected
                              ? isDark
                                ? 'bg-white text-slate-950'
                                : 'bg-slate-900 text-white'
                              : isDark
                                ? 'bg-[#22283A] text-slate-400'
                                : 'bg-slate-200/70 text-slate-600'
                          )}
                        >
                          {item.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          'text-[10px] leading-snug line-clamp-1 sm:line-clamp-2 font-medium',
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        )}
                      >
                        {item.shortDesc}
                      </p>
                    </div>

                    <div
                      className={cn(
                        'text-[10px] font-extrabold sm:mt-2 sm:pt-1.5 sm:border-t flex items-center justify-between shrink-0 tabular-nums',
                        isDark
                          ? 'sm:border-[#2B334A] text-slate-300'
                          : 'sm:border-slate-200/70 text-slate-600'
                      )}
                    >
                      <span className="hidden sm:inline text-slate-400 font-semibold">가상 자금</span>
                      <span className={cn(isSelected && 'text-[var(--price-up)]')}>
                        {item.cash}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Entry Triggers */}
            <div className="space-y-2.5 pt-0.5">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <UserCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={nicknameInputRef}
                    id="landing-nickname-input"
                    type="text"
                    maxLength={20}
                    value={nickname}
                    onChange={(e) => onChangeNickname(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onGuestStart();
                    }}
                    placeholder="별명 입력 (선택 · 실명 불필요)"
                    className={cn(
                      'w-full h-11 pl-10 pr-3.5 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2 transition-shadow',
                      isDark
                        ? 'bg-[#12151F] border-[#2B334A] text-white placeholder:text-slate-500 focus:ring-white/25'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-slate-900/15'
                    )}
                  />
                </div>
                <Button
                  id="landing-guest-start-btn"
                  type="button"
                  onClick={onGuestStart}
                  className={cn(
                    'h-11 px-5 font-extrabold text-xs sm:text-sm gap-2 transition-all cursor-pointer rounded-xl border-0 flex items-center justify-center shrink-0 shadow-sm',
                    isDark
                      ? 'bg-white text-slate-950 hover:bg-slate-100'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  )}
                >
                  <span>개인정보 없이 바로 시작</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <p
                className={cn(
                  'text-[11px] font-semibold flex items-center gap-1.5 leading-snug',
                  isDark ? 'text-emerald-400/90' : 'text-emerald-700'
                )}
              >
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>
                  초·중등 수업 권장: 별명만 쓰고 브라우저에 저장되며 개인정보를 서버로 전송하지 않습니다.
                </span>
              </p>

              {/* Divider */}
              <div className="flex items-center gap-2.5 py-0.5">
                <div className={cn('h-px flex-1', isDark ? 'bg-[#2B334A]' : 'bg-slate-200')} />
                <span className="text-[10px] font-bold text-slate-400">
                  또는 다른 기기와 이어하기 (선택)
                </span>
                <div className={cn('h-px flex-1', isDark ? 'bg-[#2B334A]' : 'bg-slate-200')} />
              </div>

              {isKakaoTalk && (
                <div
                  className={cn(
                    'p-3 border rounded-xl flex flex-col gap-1 text-xs text-left select-none',
                    isDark
                      ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  )}
                >
                  <div className="flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400">
                    <span>⚠️</span>
                    <span>카카오톡 인앱 브라우저 안내</span>
                  </div>
                  <p className="leading-relaxed font-semibold text-[11px] opacity-90">
                    카카오톡 내부에서도 위의 <strong>‘개인정보 없이 바로 시작’</strong>은 즉시 이용
                    가능합니다. Google 로그인을 원하시면 우측 상단 메뉴(⋯/⋮)에서 ‘다른 브라우저로
                    열기’를 선택해 주세요.
                  </p>
                </div>
              )}

              <Button
                id="landing-google-login-btn"
                type="button"
                variant="outline"
                className={cn(
                  'w-full h-10 font-bold text-xs gap-2 transition-colors cursor-pointer rounded-xl flex items-center justify-center',
                  isDark
                    ? 'bg-[#12151F]/80 text-slate-200 border-[#2B334A] hover:bg-[#22283A]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                )}
                onClick={onOpenGoogleConsent}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" aria-hidden="true">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
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
                <span>Google 계정으로 클라우드 저장 로그인 (만 14세 이상 또는 보호자 동의)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Upgraded Interactive HTS Mockup */}
        <div className="hidden lg:block lg:col-span-6 relative">
          <div
            className={cn(
              'rounded-[24px] border overflow-hidden transition-colors duration-300',
              isDark
                ? 'bg-[#1A1F30]/95 border-[#2B334A] shadow-[0_24px_60px_rgba(0,0,0,0.45)]'
                : 'bg-white border-slate-200/90 shadow-[0_24px_60px_rgba(15,23,42,0.08)]'
            )}
          >
            {/* Mock HTS Window Bar */}
            <div
              className={cn(
                'border-b px-5 py-3 flex items-center justify-between',
                isDark ? 'bg-[#141826] border-[#2B334A]' : 'bg-slate-50/90 border-slate-200/80'
              )}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F04452]/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400/75" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/75" />
                <span
                  className={cn(
                    'text-[10px] font-black ml-2 tracking-widest flex items-center gap-1.5 uppercase',
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  )}
                >
                  <Activity className="w-3.5 h-3.5 text-[var(--price-up)]" />
                  STOCKSCHOOL HTS PREVIEW
                </span>
              </div>
              <span
                className={cn(
                  'text-[10px] px-2.5 py-0.5 rounded-md font-extrabold',
                  isDark ? 'bg-white/8 text-slate-200' : 'bg-slate-900/6 text-slate-700'
                )}
              >
                {activeLevelConfig.chartLabel}
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* Simulated Price + Market Composition Row */}
              <div className="grid grid-cols-12 gap-3">
                <div
                  className={cn(
                    'col-span-7 p-4 rounded-2xl border flex flex-col justify-between',
                    isDark ? 'bg-[#12151F]/80 border-[#2B334A]' : 'bg-slate-50/80 border-slate-200/70'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      가상 종목 프리뷰
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded',
                        isDark ? 'bg-[#22283A] text-slate-300' : 'bg-white text-slate-600 border border-slate-200/70'
                      )}
                    >
                      기술 · 수출형
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className={cn('text-base font-black', isDark ? 'text-white' : 'text-slate-900')}>
                      누리전자
                    </div>
                    <div className="flex items-baseline gap-2.5 mt-1">
                      <span
                        className={cn(
                          'text-2xl font-mono font-black tracking-tight tabular-nums px-1.5 py-0.5 -ml-1.5 rounded-md transition-colors duration-300',
                          flashType === 'up'
                            ? 'bg-[var(--price-up)]/18 text-[var(--price-up)]'
                            : flashType === 'down'
                              ? 'bg-[var(--price-down)]/18 text-[var(--price-down)]'
                              : isDark
                                ? 'text-white'
                                : 'text-slate-900'
                        )}
                      >
                        {mockPrice.toLocaleString()}원
                      </span>
                      <span
                        className={cn(
                          'text-xs font-mono font-extrabold tabular-nums',
                          isPositive ? 'text-[var(--price-up)]' : 'text-[var(--price-down)]'
                        )}
                      >
                        {isPositive ? '▲' : '▼'} {isPositive ? '+' : ''}
                        {deltaPct}%
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={cn(
                    'col-span-5 p-4 rounded-2xl border flex flex-col justify-between',
                    isDark ? 'bg-[#12151F]/80 border-[#2B334A]' : 'bg-slate-50/80 border-slate-200/70'
                  )}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    가상 시장 구성
                  </span>
                  <div className="mt-3">
                    <div
                      className={cn(
                        'text-2xl font-mono font-black tabular-nums flex items-center gap-1.5',
                        isDark ? 'text-white' : 'text-slate-900'
                      )}
                    >
                      <TrendingUp className="w-5 h-5 text-[var(--price-up)]" />
                      34개사
                    </div>
                    <span className="text-[11px] font-semibold text-slate-400 block mt-1">
                      17개 산업 · 588건 뉴스
                    </span>
                  </div>
                </div>
              </div>

              {/* Adaptive Chart Preview */}
              <div
                className={cn(
                  'p-4 rounded-2xl border h-[168px] flex flex-col justify-between relative',
                  isDark ? 'bg-[#12151F]/70 border-[#2B334A]' : 'bg-slate-50/70 border-slate-200/70'
                )}
              >
                <div className="absolute inset-x-4 inset-y-10 flex flex-col justify-between pointer-events-none opacity-45">
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-700' : 'border-slate-300')} />
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-700' : 'border-slate-300')} />
                  <div className={cn('w-full border-t border-dashed', isDark ? 'border-slate-700' : 'border-slate-300')} />
                </div>

                <div className="flex items-center justify-between z-10">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-slate-400" />
                    등급별 시뮬레이션 차트
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#F04452]/12 text-[#F04452] font-bold">
                      Price
                    </span>
                    {level !== 'elementary' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3182F6]/12 text-[#3182F6] font-bold">
                        MA(3)
                      </span>
                    )}
                    {level === 'high' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/12 text-amber-500 font-bold">
                        Candle
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-h-0 w-full flex items-center justify-center z-10 pt-2">
                  {level === 'elementary' && (
                    <svg className="w-full h-full" viewBox="0 0 300 112" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="hero-area-grad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#F04452" stopOpacity="0.22" />
                          <stop offset="100%" stopColor="#F04452" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      <path d={areaPath} fill="url(#hero-area-grad)" />
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                    </svg>
                  )}

                  {level === 'middle' && (
                    <svg className="w-full h-full" viewBox="0 0 300 112" preserveAspectRatio="none">
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                      <polyline
                        fill="none"
                        stroke="#3182F6"
                        strokeWidth="1.8"
                        strokeDasharray="5 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={maPoints}
                      />
                    </svg>
                  )}

                  {level === 'high' && (
                    <div className="w-full h-full flex items-end justify-between px-2 pt-2 pb-1 relative">
                      {priceHistory.map((p, idx) => {
                        const prev = idx > 0 ? priceHistory[idx - 1] : p;
                        const isCandleUp = p >= prev;
                        const max = Math.max(...priceHistory);
                        const min = Math.min(...priceHistory);
                        const range = max - min || 1;

                        const heightPercent = Math.max(12, Math.min(88, ((p - min) / range) * 76));
                        const prevPercent = Math.max(12, Math.min(88, ((prev - min) / range) * 76));
                        const bodyTop = Math.max(heightPercent, prevPercent);
                        const bodyBottom = Math.min(heightPercent, prevPercent);
                        const bodyHeight = Math.max(9, bodyTop - bodyBottom);

                        return (
                          <div
                            key={idx}
                            className="flex-1 flex flex-col items-center justify-end h-full relative mx-1.5"
                          >
                            <div
                              className={cn(
                                'w-[1.5px] absolute',
                                isCandleUp ? 'bg-[var(--price-up)]' : 'bg-[var(--price-down)]'
                              )}
                              style={{
                                height: `${Math.min(95, bodyHeight + 18)}%`,
                                bottom: `${Math.max(2, bodyBottom - 6)}%`,
                              }}
                            />
                            <div
                              className={cn(
                                'w-full rounded-[3px] z-10 transition-all',
                                isCandleUp ? 'bg-[var(--price-up)]' : 'bg-[var(--price-down)]'
                              )}
                              style={{ height: `${bodyHeight}%`, marginBottom: `${bodyBottom}%` }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div
                  className={cn(
                    'flex items-center justify-between text-[9px] font-mono font-bold border-t pt-1.5 z-10',
                    isDark ? 'text-slate-500 border-[#2B334A]' : 'text-slate-400 border-slate-200/80'
                  )}
                >
                  <span>DAY 1</span>
                  <span>DAY 2</span>
                  <span>DAY 3</span>
                  <span>DAY 4</span>
                  <span>DAY 5</span>
                  <span>DAY 6</span>
                </div>
              </div>

              {/* Level-Matched Virtual News Ticker */}
              <div
                className={cn(
                  'p-4 rounded-2xl border space-y-2.5',
                  isDark ? 'bg-[#12151F]/80 border-[#2B334A]' : 'bg-slate-50/80 border-slate-200/70'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                    <Newspaper className="w-3.5 h-3.5" />
                    난이도 맞춤 가상 경제 뉴스룸
                  </span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setNewsIndex(i)}
                        aria-label={`샘플 뉴스 ${i + 1} 보기`}
                        className={cn(
                          'h-1.5 rounded-full transition-all cursor-pointer',
                          newsIndex === i
                            ? 'w-4 bg-[var(--price-up)]'
                            : isDark
                              ? 'w-1.5 bg-slate-700 hover:bg-slate-500'
                              : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div
                  className={cn(
                    'text-xs font-bold p-3 rounded-xl min-h-[48px] flex items-center leading-relaxed border transition-colors',
                    isDark
                      ? 'text-slate-100 bg-[#1A1F30] border-[#2B334A]'
                      : 'text-slate-800 bg-white border-slate-200/80'
                  )}
                >
                  {MOCK_NEWS_BY_LEVEL[level][newsIndex]}
                </div>
              </div>
            </div>

            {/* Mock Status Bar */}
            <div
              className={cn(
                'px-5 py-2.5 border-t flex items-center justify-between text-[10px] font-bold',
                isDark
                  ? 'bg-[#141826] border-[#2B334A] text-slate-500'
                  : 'bg-slate-50/90 border-slate-200/80 text-slate-400'
              )}
            >
              <span>● 교육용 가상 시뮬레이션 (실제 투자 아님)</span>
              <span className="font-mono">ENGINE v2.1</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scroll Cue to Slide 02 */}
      <div className="relative z-10 flex justify-center pt-2">
        <button
          type="button"
          onClick={onScrollNext}
          className={cn(
            'group inline-flex flex-col items-center gap-1 px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer',
            isDark
              ? 'text-slate-400 hover:text-white'
              : 'text-slate-500 hover:text-slate-900'
          )}
        >
          <span>아래로 내려 스탁스쿨 컨셉 살펴보기</span>
          <ChevronDown className="w-4 h-4 animate-gentle-bob text-[var(--price-up)]" />
        </button>
      </div>
    </div>
  );
}
