import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ShieldAlert, CheckCircle2, UserCheck } from 'lucide-react';
import type { LegalTab } from './LegalModals';

interface GoogleConsentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedGoogle: () => void;
  onUseGuestInstead: () => void;
  onOpenLegal: (tab: LegalTab) => void;
  isLoading: boolean;
}

export default function GoogleConsentModal({
  open,
  onOpenChange,
  onProceedGoogle,
  onUseGuestInstead,
  onOpenLegal,
  isLoading,
}: GoogleConsentModalProps) {
  const [ageStatus, setAgeStatus] = useState<'none' | 'over14' | 'under14_consented'>('none');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);

  const canProceed = ageStatus !== 'none' && agreeTerms && agreePrivacy && !isLoading;

  const handleConfirm = () => {
    if (!canProceed) return;
    try {
      localStorage.setItem(
        'stockschool_consent_v1',
        JSON.stringify({
          ageStatus,
          agreedAt: new Date().toISOString(),
        })
      );
    } catch {
      // ignore storage errors
    }
    onProceedGoogle();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-[95vw] p-6 bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl">
        <DialogHeader className="text-left space-y-1.5">
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[var(--color-accent-gold)]" />
            Google 클라우드 로그인 전 필수 확인
          </DialogTitle>
          <DialogDescription className="text-xs font-medium text-muted-foreground leading-relaxed">
            개인정보 보호법(제22조의2·제28조의8)에 따라 연령 확인 및 개인정보 수집·국외이전 동의가 필요합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Under-14 Recommendation Banner */}
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 space-y-2">
            <div className="flex items-start gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>만 14세 미만(초등·중1~2) 학생은 보호자 동의 없이 바로 쓸 수 있는 게스트 모드를 권장합니다.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onUseGuestInstead();
              }}
              className="text-[11px] font-black underline text-amber-900 dark:text-amber-200 cursor-pointer hover:opacity-80"
            >
              👉 개인정보 없이 게스트로 바로 시작하기
            </button>
          </div>

          {/* Step 1: Age Gate */}
          <div className="space-y-2">
            <div className="text-xs font-black text-foreground">1. 연령 및 법정대리인 동의 확인 (필수)</div>
            <div className="space-y-2">
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--color-hts-border)] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer">
                <input
                  type="radio"
                  name="ageStatus"
                  checked={ageStatus === 'over14'}
                  onChange={() => setAgeStatus('over14')}
                  className="mt-0.5 accent-slate-900 dark:accent-white"
                />
                <span className="text-xs font-bold text-foreground">
                  만 14세 이상입니다. (본인 동의)
                </span>
              </label>

              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-[var(--color-hts-border)] hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer">
                <input
                  type="radio"
                  name="ageStatus"
                  checked={ageStatus === 'under14_consented'}
                  onChange={() => setAgeStatus('under14_consented')}
                  className="mt-0.5 accent-slate-900 dark:accent-white"
                />
                <span className="text-xs font-bold text-foreground leading-snug">
                  만 14세 미만이며, <span className="underline">법정대리인(보호자) 또는 학교 가정통신문</span>을 통해 클라우드 로그인 동의를 받았습니다.
                </span>
              </label>
            </div>
          </div>

          {/* Step 2: Terms & Privacy Checkboxes */}
          <div className="space-y-2">
            <div className="text-xs font-black text-foreground">2. 필수 약관 및 개인정보 동의</div>

            <div className="p-3 rounded-xl border border-[var(--color-hts-border)] space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-foreground/90">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 accent-slate-900 dark:accent-white"
                  />
                  <span>[필수] 이용약관 및 교육용 가상 시뮬레이터 면책 고지에 동의합니다.</span>
                </label>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="text-[10px] font-extrabold text-muted-foreground underline shrink-0 cursor-pointer hover:text-foreground"
                >
                  보기
                </button>
              </div>

              <div className="flex items-start justify-between gap-2 pt-2 border-t border-[var(--color-hts-border)]/50">
                <label className="flex items-start gap-2 cursor-pointer text-xs font-semibold text-foreground/90">
                  <input
                    type="checkbox"
                    checked={agreePrivacy}
                    onChange={(e) => setAgreePrivacy(e.target.checked)}
                    className="mt-0.5 accent-slate-900 dark:accent-white"
                  />
                  <span>
                    [필수] 개인정보 수집·이용(UID, 표시 이름, 이메일, 학습 기록) 및 국외 이전(Google LLC/Firebase, 미국)에 동의합니다.
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="text-[10px] font-extrabold text-muted-foreground underline shrink-0 cursor-pointer hover:text-foreground"
                >
                  보기
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="rounded-xl text-xs font-bold cursor-pointer"
            >
              취소
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!canProceed}
              onClick={handleConfirm}
              className="rounded-xl text-xs font-extrabold gap-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-950 cursor-pointer disabled:opacity-40"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              동의하고 Google 로그인 진행
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
