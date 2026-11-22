import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { ShieldCheck, FileText, AlertTriangle, Code2, ExternalLink } from 'lucide-react';
import { cn } from '../../lib/utils';

export type LegalTab = 'terms' | 'privacy' | 'disclaimer' | 'licenses';

interface LegalModalsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: LegalTab;
}

const TABS: { id: LegalTab; label: string; icon: typeof FileText }[] = [
  { id: 'disclaimer', label: '교육용 면책고지', icon: AlertTriangle },
  { id: 'privacy', label: '개인정보처리방침', icon: ShieldCheck },
  { id: 'terms', label: '이용약관', icon: FileText },
  { id: 'licenses', label: '오픈소스 고지', icon: Code2 },
];

export default function LegalModals({
  open,
  onOpenChange,
  initialTab = 'disclaimer',
}: LegalModalsProps) {
  const [manualTab, setManualTab] = useState<LegalTab | null>(null);
  const activeTab = manualTab ?? initialTab;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setManualTab(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[88vh] p-0 gap-0 overflow-hidden bg-[var(--color-hts-panel)] border-[var(--color-hts-border)] rounded-2xl flex flex-col">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[var(--color-hts-border)] shrink-0 text-left">
          <DialogTitle className="text-base font-black text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4.5 h-4.5 text-[var(--color-accent-gold)]" />
            스탁스쿨(StockSchool) 법적 고지 및 정책 안내
          </DialogTitle>
          <DialogDescription className="text-[11px] font-semibold text-muted-foreground">
            학생과 학부모, 교사가 안심하고 사용할 수 있도록 운영 정책과 라이선스를 투명하게 공개합니다.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Bar */}
        <div className="px-4 py-2 border-b border-[var(--color-hts-border)] bg-black/[0.02] dark:bg-black/20 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setManualTab(t.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all',
                  active
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Body */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-5 text-xs leading-relaxed text-foreground/90 space-y-4">
            {activeTab === 'disclaimer' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-700 dark:text-amber-300 font-bold text-xs">
                  본 서비스는 학생들의 금융 문해력 향상을 위한 <strong>100% 가상 교육용 모의투자 시뮬레이터</strong>이며, 실제 금융 거래나 투자 자문·권유 서비스가 아닙니다.
                </div>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">1. 가상 기업 · 가상 뉴스 · 가상 주가</h4>
                  <p className="text-muted-foreground font-medium">
                    스탁스쿨에 상장된 34개 종목의 기업명, 주가, 호가, 거래량 및 102건의 경제 뉴스 시나리오는 모두 금융 교육을 위해 창작된 가상의 데이터입니다. 실존하는 특정 상장기업이나 실제 주가와 무관하며, 우연히 유사한 명칭이 있더라도 어떠한 제휴·추천·비방 의도가 없습니다.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">2. 투자 권유 및 자문 아님 (자본시장법 관련 고지)</h4>
                  <p className="text-muted-foreground font-medium">
                    앱 내에서 제공되는 기업 설명, 뉴스 해설, 용어 사전, 차트 지표는 오직 경제 원리와 산업 간 인과관계를 이해하기 위한 학습 자료입니다. 특정 금융투자상품의 매수·매도를 권유하거나 투자 수익을 보장하지 않으며, 실제 투자 판단의 근거로 사용할 수 없습니다.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">3. 비영리 · 비사행성 원칙 및 거래 조건 안내</h4>
                  <p className="text-muted-foreground font-medium">
                    본 시뮬레이터에서 사용되는 자금은 실제 화폐 가치가 없는 가상 교육 자금이며, 현금 충전·환전·유료 아이템·현물 경품 지급 기능을 제공하지 않습니다. 또한 학습 편의를 위해 실제 증권 거래 시 발생하는 위탁 수수료, 증권거래세, 슬리피지는 생략하여 계산합니다.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">4. 교육 콘텐츠 제작 투명성 고지</h4>
                  <p className="text-muted-foreground font-medium">
                    본 서비스의 뉴스 기사, 기업 설명, 스탁 쌤 경제 해설은 사전 작성 및 검수를 거쳐 수록된 정적 학습 시나리오입니다(콘텐츠 초안 구성 과정에서 생성형 AI 도구가 보조 활용되었으며, 교육 목적에 맞게 검토·편집되었습니다).
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 space-y-1.5">
                  <div className="font-black text-emerald-700 dark:text-emerald-300">
                    🧒 학생·어린이를 위한 쉬운 개인정보 요약
                  </div>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-emerald-800/90 dark:text-emerald-200/90">
                    <li><strong>게스트(개인정보 없이 시작) 모드</strong>를 쓰면 이름, 이메일 등 어떤 개인정보도 외부 서버에 저장하지 않고 내 기기(브라우저)에만 저장돼요.</li>
                    <li><strong>Google 로그인</strong>을 쓰면 다른 기기에서도 이어서 학습할 수 있도록 Google 계정 이름과 학습 기록이 클라우드에 저장돼요.</li>
                    <li><strong>만 14세 미만 학생</strong>이 Google 로그인을 하려면 반드시 부모님(법정대리인)이나 학교 가정통신문 동의가 필요해요.</li>
                    <li>언제든지 우측/좌측 <strong>설정 → 데이터 삭제 / 회원 탈퇴</strong>에서 내 정보를 즉시 모두 지울 수 있어요.</li>
                  </ul>
                </div>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">1. 수집하는 개인정보 항목 및 수집 방법</h4>
                  <div className="overflow-x-auto border border-[var(--color-hts-border)] rounded-xl">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-black/[0.03] dark:bg-white/[0.03] text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">이용 방식</th>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">수집 항목</th>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">저장 위치</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-hts-border)]/50 text-muted-foreground font-medium">
                        <tr>
                          <td className="p-2 font-bold text-foreground">게스트 모드 (권장)</td>
                          <td className="p-2">개인정보 미수집 (임의 별명, 모의투자 진행 기록)</td>
                          <td className="p-2">이용자 브라우저(localStorage)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-foreground">Google 로그인 (선택)</td>
                          <td className="p-2">Google UID, 표시 이름(displayName), 이메일(Firebase Auth 인증용), 모의투자 학습 진행 기록</td>
                          <td className="p-2">Google Firebase (Auth / Firestore)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">2. 개인정보의 처리 목적 및 보유·파기 기간</h4>
                  <p className="text-muted-foreground font-medium">
                    수집된 정보는 오직 <strong>모의투자 학습 진행 상태 저장 및 기기 간 동기화</strong> 목적에만 이용되며, 마케팅·광고·제3자 판매에 절대 이용되지 않습니다. 이용자가 <strong>회원 탈퇴 및 데이터 삭제</strong>를 실행하면 지체 없이 영구 파기됩니다(개인정보 보호법 제21조).
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">3. 만 14세 미만 아동의 개인정보 보호 (제22조의2)</h4>
                  <p className="text-muted-foreground font-medium">
                    만 14세 미만 아동은 원칙적으로 개인정보를 수집하지 않는 <strong>게스트 모드</strong> 이용을 권장합니다. 만 14세 미만 아동이 클라우드 저장을 위해 Google 로그인을 이용하려는 경우, 반드시 법정대리인(보호자)의 동의 또는 학교·교육기관의 적법한 가정통신문 동의 절차를 거쳐야 합니다.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">4. 개인정보 처리 위탁 및 국외 이전 고지 (제28조의8)</h4>
                  <p className="text-muted-foreground font-medium">
                    Google 로그인 이용 시 인증 및 클라우드 저장을 위해 아래와 같이 국외 사업자에 개인정보가 처리 위탁·이전됩니다. 국외 이전을 원하지 않으시면 로그인 없이 <strong>게스트 모드</strong>를 이용해 주시기 바랍니다.
                  </p>
                  <div className="overflow-x-auto border border-[var(--color-hts-border)] rounded-xl">
                    <table className="w-full text-[11px] border-collapse">
                      <thead className="bg-black/[0.03] dark:bg-white/[0.03] text-muted-foreground font-bold">
                        <tr>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">이전받는 자</th>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">이전 국가</th>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">이전 항목 및 목적</th>
                          <th className="p-2 text-left border-b border-[var(--color-hts-border)]">보유 기간</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground font-medium">
                        <tr>
                          <td className="p-2 font-bold text-foreground">Google LLC (Firebase)</td>
                          <td className="p-2">미국 (및 Firebase 구성 리전)</td>
                          <td className="p-2">UID, 표시 이름, 이메일, 학습 진행 상태 / 로그인 인증 및 클라우드 저장</td>
                          <td className="p-2">회원 탈퇴 또는 서비스 종료 시 즉시 파기</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">5. 정보주체 및 법정대리인의 권리와 문의처</h4>
                  <p className="text-muted-foreground font-medium">
                    이용자 또는 법정대리인은 앱 내 <strong>[설정 → 데이터 삭제 / 회원 탈퇴]</strong>에서 언제든지 직접 개인정보를 삭제할 수 있으며, 열람·정정·삭제 관련 문의는 아래 운영 책임자에게 요청하실 수 있습니다.
                  </p>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-[var(--color-hts-border)] text-[11px] font-semibold text-muted-foreground space-y-0.5">
                    <div>• 운영 주체: 스탁스쿨 교육 프로젝트 (StockSchool Edu)</div>
                    <div>• 개인정보 보호 문의: 담당 교사 / 프로젝트 관리자 (GitHub 저장소 이슈 또는 배포 시 지정된 공식 이메일)</div>
                    <div>• 시행일자: 2026년 11월 22일</div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'terms' && (
              <div className="space-y-4">
                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">제1조 (목적)</h4>
                  <p className="text-muted-foreground font-medium">
                    본 약관은 스탁스쿨(StockSchool, 이하 "서비스")이 제공하는 교육용 모의 주식 투자 시뮬레이션 및 금융 문해력 학습 기능의 이용 조건과 절차를 규정함을 목적으로 합니다.
                  </p>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">제2조 (서비스의 성격 및 비영리 교육 원칙)</h4>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-medium">
                    <li>본 서비스는 학생들의 합리적 경제 사고와 분산투자 원리 학습을 위한 <strong>비영리 교육·학습용 소프트웨어</strong>입니다.</li>
                    <li>서비스 내 모든 자산과 수익은 가상의 학습 점수이며, 실제 현금으로 충전·환전하거나 경품·재산상 이익으로 교환할 수 없습니다.</li>
                    <li>서비스 내 모든 기업과 뉴스는 창작된 가상 시나리오이며 실제 금융시장의 투자 권유나 자문이 아닙니다.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">제3조 (이용자 준수사항)</h4>
                  <ul className="list-disc pl-4 space-y-1 text-muted-foreground font-medium">
                    <li>이용자는 교육 목적에 맞게 성실히 서비스를 이용해야 하며, 시스템 취약점을 악용하거나 비정상적인 대량 요청으로 서비스 운영을 방해해서는 안 됩니다.</li>
                    <li>게스트 모드의 학습 데이터는 이용자 브라우저에 저장되므로 브라우저 캐시/데이터 삭제 시 초기화될 수 있습니다.</li>
                  </ul>
                </section>

                <section className="space-y-1.5">
                  <h4 className="font-black text-foreground">제4조 (면책 및 서비스 변경)</h4>
                  <p className="text-muted-foreground font-medium">
                    운영자는 무료 교육 서비스의 안정적 제공을 위해 노력하나, 천재지변·네트워크 장애·외부 클라우드 중단 등으로 인한 일시적 이용 장애나 학습 기록 유실에 대해 법령상 고의·중과실이 없는 한 책임을 지지 않습니다.
                  </p>
                </section>
              </div>
            )}

            {activeTab === 'licenses' && (
              <div className="space-y-4">
                <p className="text-muted-foreground font-medium">
                  스탁스쿨은 아래의 오픈소스 소프트웨어를 포함하고 있으며, 각 라이브러리의 라이선스 조건과 저작권 고지를 준수합니다.
                </p>

                {/* TradingView Lightweight Charts REQUIRED Apache 2.0 NOTICE */}
                <div className="p-4 rounded-xl border border-[var(--color-accent-gold)]/30 bg-black/[0.02] dark:bg-white/[0.03] space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-black text-foreground">
                      TradingView Lightweight Charts™ (Apache License 2.0)
                    </span>
                    <a
                      href="https://www.tradingview.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      https://www.tradingview.com
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <pre className="text-[10px] leading-relaxed font-mono whitespace-pre-wrap text-muted-foreground bg-black/[0.03] dark:bg-black/40 p-3 rounded-lg border border-[var(--color-hts-border)]">
{`Lightweight Charts™
Copyright (c) 2025 TradingView, Inc. https://www.tradingview.com/

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
http://www.apache.org/licenses/LICENSE-2.0

This product includes software developed by TradingView, Inc. (https://www.tradingview.com/).
StockSchool is an independent educational simulator and is not affiliated with, endorsed by, or sponsored by TradingView.`}
                  </pre>
                </div>

                {/* Other major open source packages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  {[
                    { name: 'React & React DOM', license: 'MIT License', url: 'https://react.dev' },
                    { name: 'Zustand', license: 'MIT License', url: 'https://github.com/pmndrs/zustand' },
                    { name: 'Recharts', license: 'MIT License', url: 'https://recharts.org' },
                    { name: 'Tailwind CSS', license: 'MIT License', url: 'https://tailwindcss.com' },
                    { name: 'Radix UI Primitives', license: 'MIT License', url: 'https://www.radix-ui.com' },
                    { name: 'Lucide React Icons', license: 'ISC License', url: 'https://lucide.dev' },
                    { name: 'Firebase JavaScript SDK', license: 'Apache License 2.0', url: 'https://firebase.google.com' },
                    { name: 'Sonner', license: 'MIT License', url: 'https://sonner.emilkowal.ski' },
                  ].map((pkg) => (
                    <div
                      key={pkg.name}
                      className="p-2.5 rounded-xl border border-[var(--color-hts-border)] bg-black/[0.01] dark:bg-white/[0.01] flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-foreground">{pkg.name}</div>
                        <div className="text-[10px] text-muted-foreground">{pkg.license}</div>
                      </div>
                      <a
                        href={pkg.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        title={pkg.url}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
