import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { useGameStore, type Level } from '../../stores/gameStore';
import { toast } from 'sonner';
import {
  Settings,
  RotateCcw,
  Trash2,
  ShieldCheck,
  GraduationCap,
  AlertTriangle,
  Cloud,
  Laptop,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { LegalTab } from '../legal/LegalModals';

interface AccountSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenLegal: (tab: LegalTab) => void;
}

const LEVELS: { id: Level; label: string; sub: string }[] = [
  { id: 'elementary', label: '초급 교실', sub: '100만 원 · 높은 뉴스 반영' },
  { id: 'middle', label: '중급 아카데미', sub: '500만 원 · 산업/시장 변동' },
  { id: 'high', label: '고급 연구소', sub: '1,000만 원 · 복합/이월 변수' },
];

export default function AccountSettingsModal({
  open,
  onOpenChange,
  onOpenLegal,
}: AccountSettingsModalProps) {
  const {
    authMode,
    displayName,
    level,
    setLevel,
    resetCurrentLevel,
    deleteAccountAndData,
  } = useGameStore();

  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLevelSwitch = (target: Level) => {
    if (target === level) return;
    setLevel(target);
    const label = target === 'elementary' ? '초급' : target === 'middle' ? '중급' : '고급';
    toast.success(`${label} 교실로 전환되었습니다.`);
  };

  const handleReset = () => {
    resetCurrentLevel();
    setConfirmReset(false);
    toast.success('현재 난이도의 학습 데이터가 DAY 1로 초기화되었습니다.');
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteAccountAndData();
    setIsDeleting(false);
    if (result.ok) {
      setConfirmDelete(false);
      onOpenChange(false);
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setConfirmReset(false);
          setConfirmDelete(false);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg w-[95vw] p-6 bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <Settings className="w-4.5 h-4.5 text-[var(--color-accent-gold)]" />
            학습 설정 및 개인정보 관리
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground font-medium">
            학습 난이도 전환, 법적 고지 열람, 데이터 초기화 및 계정 영구 삭제를 관리합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Current Session Info */}
          <div className="p-3.5 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-white/[0.02] flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-black text-foreground truncate">
                {displayName || '모의투자 학생'}
              </div>
              <div className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 mt-0.5">
                {authMode === 'google' ? (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>Google 클라우드 저장 모드</span>
                  </>
                ) : (
                  <>
                    <Laptop className="w-3.5 h-3.5 text-emerald-500" />
                    <span>게스트 모드 (개인정보 비수집 · 브라우저 저장)</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Level Switcher */}
          <div className="space-y-2">
            <div className="text-xs font-black text-foreground flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-[var(--color-accent-gold)]" />
              학습 난이도 전환 (난이도별 기록 자동 보관)
            </div>
            <div className="grid grid-cols-3 gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => handleLevelSwitch(l.id)}
                  className={cn(
                    'p-2.5 rounded-xl border text-left transition-all cursor-pointer',
                    level === l.id
                      ? 'border-slate-900 dark:border-white bg-slate-900/5 dark:bg-white/10 shadow-sm'
                      : 'border-[var(--color-hts-border)] hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
                  )}
                >
                  <div className="text-xs font-black text-foreground">{l.label}</div>
                  <div className="text-[10px] text-muted-foreground font-semibold mt-0.5 leading-snug">
                    {l.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Legal & Policy Links */}
          <div className="space-y-2">
            <div className="text-xs font-black text-foreground flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[var(--color-accent-gold)]" />
              법적 고지 및 정책
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: 'disclaimer', label: '교육용 면책 고지' },
                  { id: 'privacy', label: '개인정보 처리방침' },
                  { id: 'terms', label: '서비스 이용약관' },
                  { id: 'licenses', label: '오픈소스 라이선스' },
                ] as { id: LegalTab; label: string }[]
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onOpenLegal(item.id)}
                  className="px-3 py-2 rounded-xl border border-[var(--color-hts-border)] text-xs font-bold text-foreground/85 hover:bg-[var(--color-hts-hover)] text-left cursor-pointer transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Data Reset & Permanent Account Deletion */}
          <div className="pt-2 border-t border-[var(--color-hts-border)] space-y-2.5">
            {/* Reset Current Level */}
            {!confirmReset ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setConfirmReset(true);
                  setConfirmDelete(false);
                }}
                className="w-full justify-start gap-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                현재 난이도 처음(DAY 1)부터 다시 시작하기
              </Button>
            ) : (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 space-y-2">
                <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200">
                  현재 선택된 난이도의 보유 주식과 진행 날짜가 모두 DAY 1로 초기화됩니다. 계속할까요?
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmReset(false)}
                    className="h-8 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 text-[11px] font-black rounded-lg bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    초기화 실행
                  </Button>
                </div>
              </div>
            )}

            {/* Permanent Delete / Withdraw */}
            {!confirmDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setConfirmDelete(true);
                  setConfirmReset(false);
                }}
                className="w-full justify-start gap-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 hover:text-rose-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {authMode === 'google'
                  ? '회원 탈퇴 및 클라우드 개인정보 영구 삭제'
                  : '브라우저 저장 학습 데이터 전체 삭제 및 나가기'}
              </Button>
            ) : (
              <div className="p-3.5 rounded-xl border border-rose-500/35 bg-rose-500/10 space-y-2">
                <div className="flex items-start gap-2 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>
                    {authMode === 'google'
                      ? '회원 탈퇴 시 Firebase 인증 계정과 클라우드에 저장된 모든 학습 기록이 즉시 영구 파기되며 복구할 수 없습니다.'
                      : '이 브라우저에 저장된 모든 난이도의 학습 기록이 즉시 영구 삭제되며 복구할 수 없습니다.'}
                  </span>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setConfirmDelete(false)}
                    disabled={isDeleting}
                    className="h-8 text-[11px] font-bold rounded-lg cursor-pointer"
                  >
                    취소
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="h-8 text-[11px] font-black rounded-lg bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                  >
                    {isDeleting ? '삭제 중...' : '영구 삭제 확인'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
