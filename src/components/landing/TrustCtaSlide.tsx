import type { Level } from '../../stores/gameStore';
import type { LegalTab } from '../legal/LegalModals';
import { Button } from '../ui/button';
import {
  ArrowRight,
  ArrowUp,
  Check,
  Cloud,
  ShieldCheck,
  UserCircle2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LEVEL_CONFIGS } from './landingData';

interface TrustCtaSlideProps {
  isDark: boolean;
  isVisible: boolean;
  level: Level;
  nickname: string;
  onChangeNickname: (value: string) => void;
  onGuestStart: () => void;
  onOpenGoogleConsent: () => void;
  onBackToTop: () => void;
  onOpenLegal: (tab: LegalTab) => void;
}

export default function TrustCtaSlide({
  isDark,
  isVisible,
  level,
  nickname,
  onChangeNickname,
  onGuestStart,
  onOpenGoogleConsent,
  onBackToTop,
  onOpenLegal,
}: TrustCtaSlideProps) {
  const activeLevel = LEVEL_CONFIGS.find((l) => l.key === level) ?? LEVEL_CONFIGS[0];

  return (
    <div className="w-full min-h-dvh flex flex-col justify-between pt-24 pb-6 px-5 sm:px-8">
      <div className="w-full max-w-7xl mx-auto flex-1 flex flex-col justify-center gap-7 lg:gap-8">
        {/* Section Header */}
        <div
          className={cn(
            'max-w-3xl space-y-3 slide-reveal',
            isVisible && 'slide-reveal-visible'
          )}
        >
          <p
            className={cn(
              'text-[11px] font-extrabold tracking-[0.18em] uppercase',
              isDark ? 'text-slate-400' : 'text-slate-500'
            )}
          >
            06 · SAFE CLASSROOM &amp; START
          </p>
          <h2
            className={cn(
              'text-3xl sm:text-4xl font-black tracking-[-0.03em] leading-[1.15]',
              isDark ? 'text-white' : 'text-slate-900'
            )}
          >
            개인정보 걱정 없이,
            <br className="hidden sm:block" /> 지금 바로 교실에 입장하세요
          </h2>
        </div>

        {/* 2-Column Privacy & Mode Comparison */}
        <div
          className={cn(
            'grid grid-cols-1 md:grid-cols-2 gap-5 slide-reveal slide-delay-1',
            isVisible && 'slide-reveal-visible'
          )}
        >
          {/* Guest Classroom */}
          <div
            className={cn(
              'rounded-[24px] border p-6 flex flex-col justify-between gap-5',
              isDark
                ? 'bg-[#1A1F30]/95 border-emerald-500/35'
                : 'bg-white border-emerald-500/40 shadow-[0_14px_40px_rgba(16,185,129,0.06)]'
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-500">
                  <ShieldCheck className="w-4 h-4" />
                  게스트 교실 (초·중등 수업 권장)
                </span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/12 text-emerald-500">
                  기본 추천
                </span>
              </div>
              <h3 className={cn('text-lg font-black', isDark ? 'text-white' : 'text-slate-900')}>
                서버 전송 0%, 별명만으로 즉시 시작
              </h3>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  '실명·이메일·전화번호 등 개인정보를 일절 수집하지 않음',
                  '모든 학습 진행 기록은 현재 기기 브라우저에만 안전 저장',
                  '만 14세 미만 학생도 별도 가입 절차 없이 3초 만에 수업 참여',
                ].map((line) => (
                  <li
                    key={line}
                    className={cn('flex items-start gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Cloud Classroom */}
          <div
            className={cn(
              'rounded-[24px] border p-6 flex flex-col justify-between gap-5',
              isDark
                ? 'bg-[#1A1F30]/85 border-[#2B334A]'
                : 'bg-white border-slate-200/90 shadow-[0_14px_40px_rgba(15,23,42,0.04)]'
            )}
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[var(--price-down)]">
                  <Cloud className="w-4 h-4" />
                  클라우드 교실 (선택)
                </span>
                <span
                  className={cn(
                    'text-[10px] font-bold px-2 py-0.5 rounded',
                    isDark ? 'bg-white/8 text-slate-300' : 'bg-slate-100 text-slate-600'
                  )}
                >
                  만 14세 이상 · 보호자 동의
                </span>
              </div>
              <h3 className={cn('text-lg font-black', isDark ? 'text-white' : 'text-slate-900')}>
                Google 계정으로 기기 간 이어서 학습
              </h3>
              <ul className="space-y-2 text-xs font-semibold">
                {[
                  '학교 컴퓨터와 집 태블릿에서 포트폴리오 기록 실시간 동기화',
                  '로그인 전 연령·보호자 동의 게이트 및 투명한 개인정보 안내',
                  '설정에서 언제든 원클릭 회원 탈퇴 및 클라우드 데이터 즉시 파기',
                ].map((line) => (
                  <li
                    key={line}
                    className={cn('flex items-start gap-2', isDark ? 'text-slate-300' : 'text-slate-600')}
                  >
                    <Check className="w-3.5 h-3.5 text-[var(--price-down)] shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={onOpenGoogleConsent}
              className={cn(
                'text-xs font-extrabold text-left inline-flex items-center gap-1 cursor-pointer transition-colors w-fit',
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-700 hover:text-slate-950'
              )}
            >
              <span>Google 클라우드 로그인 안내 보기</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Final Quick-Start Action Bar */}
        <div
          className={cn(
            'rounded-[24px] border p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 slide-reveal slide-delay-2',
            isDark
              ? 'bg-[#1A1F30] border-[#2B334A]'
              : 'bg-white border-slate-200 shadow-[0_14px_40px_rgba(15,23,42,0.06)]'
          )}
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[11px] font-extrabold px-2.5 py-0.5 rounded-md',
                  isDark ? 'bg-white/10 text-white' : 'bg-slate-900/8 text-slate-900'
                )}
              >
                {activeLevel.emoji} 선택 등급: {activeLevel.label} ({activeLevel.cash})
              </span>
            </div>
            <p className={cn('text-sm font-black', isDark ? 'text-white' : 'text-slate-900')}>
              지금 선택한 등급으로 바로 모의주식 교실을 시작해 보세요.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <div className="relative sm:w-56">
              <UserCircle2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                maxLength={20}
                value={nickname}
                onChange={(e) => onChangeNickname(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onGuestStart();
                }}
                placeholder="별명 입력 (선택)"
                className={cn(
                  'w-full h-11 pl-10 pr-3 rounded-xl border text-xs font-bold focus:outline-none focus:ring-2',
                  isDark
                    ? 'bg-[#12151F] border-[#2B334A] text-white placeholder:text-slate-500 focus:ring-white/25'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:ring-slate-900/15'
                )}
              />
            </div>

            <Button
              type="button"
              onClick={onGuestStart}
              className={cn(
                'h-11 px-5 font-extrabold text-xs sm:text-sm gap-2 rounded-xl border-0 cursor-pointer shrink-0',
                isDark
                  ? 'bg-white text-slate-950 hover:bg-slate-100'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              )}
            >
              <span>바로 교실 입장하기</span>
              <ArrowRight className="w-4 h-4" />
            </Button>

            <button
              type="button"
              onClick={onBackToTop}
              aria-label="맨 위 메인 슬라이드로 이동"
              className={cn(
                'h-11 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors shrink-0',
                isDark
                  ? 'bg-[#12151F] border-[#2B334A] text-slate-300 hover:bg-[#22283A]'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              )}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              <span>맨 위로</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Disclaimer Footer (Preserved from original Login.tsx) */}
      <footer
        className={cn(
          'w-full max-w-7xl mx-auto pt-5 mt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-semibold',
          isDark ? 'border-[#242B3E] text-slate-400' : 'border-slate-200 text-slate-500'
        )}
      >
        <p className="text-center sm:text-left">
          본 서비스는 100% 가상 기업·가상 자금을 활용한 비영리 교육용 시뮬레이터이며, 실제 투자 권유나 자문이 아닙니다.
        </p>
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <button
            type="button"
            onClick={() => onOpenLegal('disclaimer')}
            className="hover:underline font-bold cursor-pointer"
          >
            면책고지
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegal('privacy')}
            className={cn('hover:underline font-extrabold cursor-pointer', isDark ? 'text-white' : 'text-slate-900')}
          >
            개인정보처리방침
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegal('terms')}
            className="hover:underline font-bold cursor-pointer"
          >
            이용약관
          </button>
          <span>·</span>
          <button
            type="button"
            onClick={() => onOpenLegal('licenses')}
            className="hover:underline font-bold cursor-pointer"
          >
            오픈소스 고지
          </button>
        </div>
      </footer>
    </div>
  );
}
