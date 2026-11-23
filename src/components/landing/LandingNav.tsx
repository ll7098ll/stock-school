import { Sun, Moon, ArrowUpRight } from 'lucide-react';
import SchoolLogo from '../layout/SchoolLogo';
import { LANDING_SLIDES } from './landingData';
import { cn } from '../../lib/utils';

interface LandingNavProps {
  activeSlide: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onSelectSlide: (index: number) => void;
}

export default function LandingNav({
  activeSlide,
  isDark,
  onToggleTheme,
  onSelectSlide,
}: LandingNavProps) {
  const isScrolled = activeSlide > 0;

  return (
    <>
      {/* Top Minimal Floating Header */}
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-30 transition-all duration-300',
          isScrolled
            ? isDark
              ? 'bg-[#12151F]/85 backdrop-blur-md border-b border-[#242B3E]'
              : 'bg-white/85 backdrop-blur-md border-b border-slate-200/80 shadow-[0_1px_12px_rgba(15,23,42,0.04)]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand */}
          <button
            type="button"
            onClick={() => onSelectSlide(0)}
            className="flex items-center gap-2.5 text-left cursor-pointer group focus:outline-none"
            aria-label="스탁스쿨 메인 슬라이드로 이동"
          >
            <SchoolLogo className="w-8 h-8 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div className="leading-none">
              <span
                className={cn(
                  'block text-sm sm:text-[15px] font-black tracking-tight',
                  isDark ? 'text-white' : 'text-slate-900'
                )}
              >
                스탁스쿨
              </span>
              <span
                className={cn(
                  'block text-[10px] font-semibold tracking-wider uppercase mt-0.5',
                  isDark ? 'text-slate-400' : 'text-slate-500'
                )}
              >
                StockSchool Lab
              </span>
            </div>
          </button>

          {/* Desktop Section Links */}
          <nav
            aria-label="페이지 섹션 이동"
            className="hidden md:flex items-center gap-1"
          >
            {LANDING_SLIDES.map((slide, idx) => {
              if (!slide.navLabel) return null;
              const isActive = activeSlide === idx;
              return (
                <button
                  key={slide.id}
                  type="button"
                  onClick={() => onSelectSlide(idx)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer',
                    isActive
                      ? isDark
                        ? 'text-white bg-white/10'
                        : 'text-slate-900 bg-slate-900/6'
                      : isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-900/4'
                  )}
                >
                  {slide.navLabel}
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleTheme}
              className={cn(
                'h-9 px-3 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5',
                isDark
                  ? 'bg-[#1A1F30]/90 border-[#2B334A] text-slate-200 hover:bg-[#22283A]'
                  : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50'
              )}
              aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">라이트</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">다크</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => onSelectSlide(0)}
              className={cn(
                'h-9 px-3.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer flex items-center gap-1',
                isScrolled
                  ? 'opacity-100 translate-y-0 pointer-events-auto'
                  : 'opacity-0 -translate-y-1 pointer-events-none hidden sm:flex',
                isDark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              <span>교실 입장</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Right Floating Vertical Slide Indicator (Desktop XL+) */}
      <aside
        aria-label="슬라이드 진행 표시"
        className="hidden xl:flex fixed right-6 top-1/2 -translate-y-1/2 z-30 flex-col items-end gap-2.5"
      >
        {LANDING_SLIDES.map((slide, idx) => {
          const isActive = activeSlide === idx;
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => onSelectSlide(idx)}
              aria-label={`${slide.number} ${slide.label} 슬라이드로 이동`}
              aria-current={isActive ? 'step' : undefined}
              className="group flex items-center gap-2.5 py-1 cursor-pointer focus:outline-none"
            >
              <span
                className={cn(
                  'text-[11px] font-bold tracking-tight transition-all duration-200 px-2 py-0.5 rounded-md',
                  isActive
                    ? isDark
                      ? 'opacity-100 text-white bg-white/10'
                      : 'opacity-100 text-slate-900 bg-slate-900/6'
                    : isDark
                      ? 'opacity-0 group-hover:opacity-100 text-slate-400 bg-[#1A1F30]/90'
                      : 'opacity-0 group-hover:opacity-100 text-slate-600 bg-white/90 shadow-xs'
                )}
              >
                <span className="font-mono mr-1 opacity-60">{slide.number}</span>
                {slide.label}
              </span>
              <span
                className={cn(
                  'block rounded-full transition-all duration-300',
                  isActive
                    ? 'w-2.5 h-7 bg-[var(--price-up)]'
                    : isDark
                      ? 'w-2 h-2 bg-slate-600 group-hover:bg-slate-300'
                      : 'w-2 h-2 bg-slate-300 group-hover:bg-slate-600'
                )}
              />
            </button>
          );
        })}
      </aside>
    </>
  );
}
