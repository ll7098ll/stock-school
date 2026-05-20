import { useState, useEffect, useMemo } from 'react';
import { useGameStore, type Level } from '../stores/gameStore';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { 
  BookOpen, 
  Lightbulb, 
  TrendingUp, 
  Activity, 
  Coins, 
  Newspaper,
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { GLOSSARY_TERMS, type GlossaryItem } from '../lib/glossaryData';
import SchoolLogo from '../components/layout/SchoolLogo';

const levels: { key: Level; label: string; title: string; emoji: string; desc: string; cash: string }[] = [
  { 
    key: 'elementary', 
    label: '초급 학교', 
    title: '입문자 교실',
    emoji: '🌱', 
    desc: '주식을 처음 접하는 학생도 1분 만에 이해하는 동화 같은 비유 설명과 친숙한 일상 가이드 제공', 
    cash: '100만 원 시작' 
  },
  { 
    key: 'middle', 
    label: '중급 아카데미', 
    title: '성장형 실전반',
    emoji: '📈', 
    desc: '경제 뉴스의 행간을 분석하고 금리 정책이나 환율이 기업 가치에 주는 인과관계를 학습하는 중급 코스', 
    cash: '500만 원 시작' 
  },
  { 
    key: 'high', 
    label: '고급 연구소', 
    title: '전문 연구원',
    emoji: '🏦', 
    desc: '기업 재무제표의 핵심 지표(ROE, PER 등)와 매크로 지표, 파생 상품까지 종합 분석하는 프로 트레이딩', 
    cash: '1,000만 원 시작' 
  },
];

// Mock News Headlines for interactive dashboard preview
const mockNewsByLevel: Record<Level, string[]> = {
  elementary: [
    "🌱 [새싹뉴스] 맛있는 '딸기라떼' 유행에 딸기 농장 주가 싱글벙글! ▲ 4%",
    "🌱 [쉬운 경제] 초코칩 쿠키 공장 기계 고장으로 쿠키 가격 인상 조짐",
    "🌱 [상식] 용돈 모아 산 첫 주식, 나도 이제 회사의 어엿한 주주!"
  ],
  middle: [
    "📈 [금리 속보] 한국은행 기준금리 연 3.50% 동결 결정... 시장 안도 ━ 0%",
    "📈 [수출 지표] 2차전지 배터리 핵심 원자재 수입 가격 15% 하락으로 마진 개선",
    "📈 [뉴스 감성] 'AI 서비스 호조' 빅테크 기업 분기 매출 역대 최대치 달성 예고"
  ],
  high: [
    "🏦 [거시 분석] 미국 연준(Fed) 기준금리 인하 기조 시사... 달러 인덱스 101.2 하락",
    "🏦 [밸류에이션] 바이오 대장주 ROE 22% 달성으로 고평가 논란 해소 국면 진입",
    "🏦 [재무 리포트] 자동차 제조사, PER 4.8배로 코스피 평균 대비 초저평가 상태"
  ]
};

export default function Login() {
  const { theme, toggleTheme } = useGameStore();
  const [level, setLevel] = useState<Level>('elementary');
  const [isLoading, setIsLoading] = useState(false);
  const [hasChangedLevel, setHasChangedLevel] = useState(false);
  const [randomTerm, setRandomTerm] = useState<GlossaryItem | null>(null);

  // Live mockup states for preview dashboard
  const [mockPrice, setMockPrice] = useState(72500);
  const [priceHistory, setPriceHistory] = useState<number[]>([71000, 71500, 71200, 72000, 71800, 72500]);
  const [newsIndex, setNewsIndex] = useState(0);
  const [flashType, setFlashType] = useState<'up' | 'down' | 'flat'>('flat');

  // Load a random glossary term
  useEffect(() => {
    if (GLOSSARY_TERMS.length > 0) {
      const randomIndex = Math.floor(Math.random() * GLOSSARY_TERMS.length);
      setRandomTerm(GLOSSARY_TERMS[randomIndex]);
    }
  }, []);

  // Simulator loop for interactive HTS Dashboard mockup preview
  useEffect(() => {
    const interval = setInterval(() => {
      const isUp = Math.random() > 0.45;
      const changePercent = 0.002 + Math.random() * 0.008; // 0.2% ~ 1%
      const delta = Math.round(mockPrice * changePercent);
      const nextPrice = isUp ? mockPrice + delta : mockPrice - delta;

      setMockPrice(nextPrice);
      setPriceHistory(prev => {
        const nextHist = [...prev.slice(-9), nextPrice];
        return nextHist;
      });
      setFlashType(isUp ? 'up' : 'down');
      
      // Cycle through level-specific headlines occasionally
      if (Math.random() > 0.7) {
        setNewsIndex(prev => (prev + 1) % 3);
      }

      // Reset flash class
      const timer = setTimeout(() => setFlashType('flat'), 600);
      return () => clearTimeout(timer);
    }, 2000);

    return () => clearInterval(interval);
  }, [mockPrice]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      // 유저가 난이도를 명시적으로 변경한 경우 localStorage에 저장
      if (hasChangedLevel) {
        localStorage.setItem('stockschool_pending_level', level);
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('스탁스쿨에 입학하신 것을 환영합니다! 🎉');
    } catch (error: any) {
      localStorage.removeItem('stockschool_pending_level');
      toast.error('로그인 실패: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };



  // SVG points calculator for line charts (elementary, middle)
  const linePoints = useMemo(() => {
    const max = Math.max(...priceHistory);
    const min = Math.min(...priceHistory);
    const range = max - min || 1;
    const width = 280;
    const height = 110;
    
    return priceHistory.map((p, i) => {
      const x = (i / (priceHistory.length - 1)) * width;
      const y = height - 10 - ((p - min) / range) * (height - 20);
      return `${x},${y}`;
    }).join(' ');
  }, [priceHistory]);

  // Moving average line simulator for middle school
  const maPoints = useMemo(() => {
    const maHistory = priceHistory.map((_, i, arr) => {
      if (i < 2) return arr[i];
      return Math.round((arr[i] + arr[i-1] + arr[i-2]) / 3);
    });
    const max = Math.max(...priceHistory);
    const min = Math.min(...priceHistory);
    const range = max - min || 1;
    const width = 280;
    const height = 110;
    
    return maHistory.map((p, i) => {
      const x = (i / (maHistory.length - 1)) * width;
      const y = height - 10 - ((p - min) / range) * (height - 20);
      return `${x},${y}`;
    }).join(' ');
  }, [priceHistory]);

  const isDark = theme === 'dark';

  return (
    <div className={cn(
      "min-h-screen w-screen flex items-center justify-center relative overflow-hidden tech-grid transition-colors duration-300",
      isDark ? "bg-[#050811] text-white" : "bg-[#f8fafc] text-slate-800"
    )}>
      
      {/* Light/Dark theme switcher at top-right */}
      <div className="absolute top-6 right-6 z-20">
        <button 
          onClick={toggleTheme}
          className={cn(
            "p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 shadow-sm font-black text-[11px]",
            isDark 
              ? "bg-slate-900/60 border-slate-800 text-amber-400 hover:bg-slate-800" 
              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
          )}
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>라이트 모드로 학습</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-indigo-500" />
              <span>다크 모드로 학습</span>
            </>
          )}
        </button>
      </div>

      {/* Mesh Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className={cn(
          "absolute top-[10%] left-[5%] w-[450px] h-[450px] rounded-full blur-[140px] animate-float-glow transition-colors duration-300",
          isDark ? "bg-slate-800/10" : "bg-slate-200/10"
        )} />
        <div className={cn(
          "absolute bottom-[10%] right-[10%] w-[500px] h-[500px] rounded-full blur-[150px] transition-colors duration-300",
          isDark ? "bg-slate-900/5" : "bg-slate-300/5"
        )} />
      </div>

      <div className="w-full max-w-7xl mx-auto px-6 py-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* LEFT COLUMN: Educational Hero & Setup Form */}
        <div className="lg:col-span-6 space-y-6 flex flex-col justify-center">
          
          {/* Logo & Welcome */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <SchoolLogo className="w-10 h-10 shrink-0 filter drop-shadow-sm" />
              <div>
                <h3 className={cn("text-lg font-black tracking-tight leading-none", isDark ? "text-white" : "text-slate-900")}>
                  스탁스쿨
                </h3>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5 tracking-wider uppercase">StockSchool Academy</span>
              </div>
            </div>

            <div className={cn(
              "inline-flex items-center gap-2 border rounded-full px-4 py-1.5 text-xs font-extrabold shadow-sm select-none w-fit",
              isDark 
                ? "bg-slate-800 border-slate-700 text-slate-300" 
                : "bg-slate-100 border-slate-200 text-slate-650"
            )}>
              <Activity className="w-4 h-4 text-slate-500" />
              <span>실시간 가상 시뮬레이션 기반 금융 학교</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl xl:text-6xl font-black tracking-tight leading-[1.1] select-none">
              게임처럼 배우는<br />
              <span className={cn(
                "font-extrabold",
                isDark ? "text-white" : "text-slate-900"
              )}>
                스탁스쿨 StockSchool
              </span>
            </h1>
            
            <p className={cn(
              "text-sm leading-relaxed font-medium max-w-lg",
              isDark ? "text-slate-400" : "text-slate-600"
            )}>
              어려운 용어와 복잡한 HTS 지표를 학교 교과서 밖의 실전 모의 장세 속에서 자연스럽게 익힙니다. 
              시장의 흐름을 분석하고 메타인지를 발달시켜 보세요.
            </p>
          </div>

          {/* Interactive Glossary Preview Card */}
          {randomTerm && (
            <div className={cn(
              "glass-panel border rounded-2xl p-4.5 shadow-md space-y-3 relative overflow-hidden transition-all duration-300",
              isDark 
                ? "border-slate-800 bg-slate-950/20 shadow-slate-950/20" 
                : "border-slate-200 bg-white/70 shadow-slate-500/5"
            )}>
              <div className="absolute top-0 right-0 p-3 text-slate-500/5 pointer-events-none">
                <BookOpen className="w-16 h-16" />
              </div>
              
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-550/10">
                  <Lightbulb className="w-3 h-3 text-slate-500" />
                </span>
                <span className={cn(
                  "text-[10px] tracking-wider font-extrabold", 
                  isDark ? "text-slate-450" : "text-slate-600"
                )}>
                  💡 난이도 교실별 금융 개념 설명 미리보기
                </span>
              </div>
              
              <div className="space-y-1">
                <h3 className={cn("text-sm font-extrabold flex items-center gap-2", isDark ? "text-white" : "text-slate-800")}>
                  {randomTerm.term}
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 border border-slate-500/20 font-bold text-slate-500">
                    {randomTerm.category === 'basic' ? '기초' : randomTerm.category === 'analysis' ? '분석' : randomTerm.category === 'macro' ? '거시' : '심화'}
                  </span>
                </h3>
                <p className={cn(
                  "text-xs leading-relaxed font-medium transition-all duration-300", 
                  isDark ? "text-slate-300" : "text-slate-600"
                )}>
                  {level === 'elementary' && randomTerm.definitions.elementary}
                  {level === 'middle' && randomTerm.definitions.middle}
                  {level === 'high' && randomTerm.definitions.high}
                </p>
              </div>
            </div>
          )}

          {/* Level Academy Plan Card */}
          <div className={cn(
            "glass-panel border rounded-2xl p-5 shadow-lg space-y-4 transition-all duration-300",
            isDark ? "border-slate-800 bg-slate-950/30" : "border-slate-200 bg-white/80"
          )}>
            <div className={cn("flex items-center justify-between border-b pb-3", isDark ? "border-slate-800/80" : "border-slate-100")}>
              <div>
                <h2 className={cn("font-extrabold text-sm flex items-center gap-1.5", isDark ? "text-white" : "text-slate-800")}>
                  <Coins className="w-4 h-4 text-amber-500" />
                  학습 등급 선택
                </h2>
                <p className={cn("text-[10px] mt-0.5 font-medium", isDark ? "text-slate-400" : "text-slate-500")}>등급별 시작 자본금과 제공 지표가 바뀝니다</p>
              </div>
              <span className="text-[10px] text-slate-550 font-extrabold bg-slate-500/10 px-2.5 py-1 rounded-full">
                언제든 전환 가능
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {levels.map(l => (
                <button
                  key={l.key}
                  onClick={() => { setLevel(l.key); setHasChangedLevel(true); }}
                  className={cn(
                    "rounded-xl p-3.5 text-left transition-all border flex flex-col justify-between cursor-pointer select-none group min-h-[135px]",
                    level === l.key
                      ? isDark 
                        ? "border-white bg-white/5 shadow-md"
                        : "border-slate-900 bg-slate-900/3 shadow-md"
                      : isDark 
                        ? "border-slate-800 hover:border-slate-700 bg-slate-900/40" 
                        : "border-slate-200 hover:border-slate-300 bg-slate-50/50"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-2xl filter drop-shadow">{l.emoji}</span>
                    <span className={cn(
                      "text-[9px] px-1.5 py-0.5 rounded font-black",
                      level === l.key 
                        ? "bg-slate-900 text-white dark:bg-white dark:text-black" 
                        : isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    )}>
                      {l.label}
                    </span>
                  </div>

                  <div className="space-y-0.5 mt-2.5">
                    <div className={cn(
                      "text-[11px] font-bold group-hover:text-slate-900 dark:group-hover:text-white transition-colors",
                      isDark ? "text-white" : "text-slate-800"
                    )}>
                      {l.title}
                    </div>
                    <p className={cn(
                      "text-[9px] line-clamp-2 leading-snug font-medium",
                      isDark ? "text-slate-400" : "text-slate-500"
                    )}>
                      {l.desc}
                    </p>
                  </div>

                  <div className={cn(
                    "text-[10px] text-slate-500 font-extrabold mt-2 pt-1 border-t flex items-center justify-between w-full",
                    isDark ? "border-slate-800/60" : "border-slate-100"
                  )}>
                    <span>자본금</span>
                    <span>{l.cash}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Login / Entry triggers */}
            <div className="space-y-2 pt-1.5">
              <Button
                className={cn(
                  "w-full h-11 font-extrabold text-sm gap-2 transition-all cursor-pointer shadow-sm rounded-xl border flex items-center justify-center",
                  isDark
                    ? "bg-white text-black hover:bg-slate-100 border-transparent"
                    : "bg-slate-900 text-white hover:bg-slate-800 border-transparent"
                )}
                onClick={handleGoogleLogin}
                disabled={isLoading}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google 계정으로 클래스 입장
              </Button>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: SaaS Interactive Mockup HTS */}
        <div className="hidden lg:block lg:col-span-6 pl-4 relative">
          
          {/* Background Ambient Glow Card Behind Mockup */}
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-[32px] blur-[30px] border pointer-events-none transition-colors duration-300",
            isDark ? "bg-slate-800/5 border-slate-800/10" : "bg-slate-300/3 border-slate-300/5"
          )} />

          {/* SaaS HTS Simulated Interface */}
          <div className={cn(
            "relative glass-panel border rounded-[24px] shadow-2xl overflow-hidden backdrop-blur-xl w-full transition-all duration-300",
            isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-200 bg-white/70"
          )}>
            
            {/* Mock Windows Title bar */}
            <div className={cn(
              "border-b px-4 py-3 flex items-center justify-between shrink-0",
              isDark ? "bg-slate-900/60 border-slate-800/80" : "bg-slate-50 border-slate-200"
            )}>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400/70" />
                <span className={cn(
                  "text-[10px] font-black ml-2 tracking-widest flex items-center gap-1.5", 
                  isDark ? "text-slate-400" : "text-slate-500"
                )}>
                  <Activity className="w-3.5 h-3.5 text-slate-500 animate-pulse" />
                  STOCKSCHOOL INTERACTIVE MOCKUP
                </span>
              </div>
              <span className="text-[9px] px-2 py-0.5 rounded bg-slate-500/10 border border-slate-500/20 text-slate-500 font-extrabold uppercase">
                {level === 'elementary' ? '초급: 심플 뷰' : level === 'middle' ? '중급: 테크니컬' : '고급: 프로분석'}
              </span>
            </div>

            <div className="p-4 space-y-4 bg-slate-950/5">
              
              {/* Simulated Price Display Panel */}
              <div className="grid grid-cols-3 gap-2">
                
                {/* Stock Title */}
                <div className={cn(
                  "col-span-2 p-3.5 rounded-2xl border flex flex-col justify-between relative overflow-hidden",
                  isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
                )}>
                  <div className="flex items-center justify-between">
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                      주식 종목 프리뷰
                    </span>
                    <span className="text-[9px] text-slate-500 font-extrabold bg-slate-500/10 border border-slate-500/20 px-1.5 py-0.2 rounded">
                      KOSPI 대장주
                    </span>
                  </div>
                  <div className="mt-2.5">
                    <div className={cn("text-base font-black", isDark ? "text-white" : "text-slate-800")}>
                      가상 미래테크 (PREVIEW)
                    </div>
                    <div className={cn(
                      "text-xl font-mono font-black mt-0.5 tracking-tight transition-all duration-300 rounded px-1.5 py-0.5 w-fit",
                      flashType === 'up' ? 'bg-[var(--price-up)]/20 text-[var(--price-up)]' :
                      flashType === 'down' ? 'bg-[var(--price-down)]/20 text-[var(--price-down)]' : isDark ? 'text-slate-100' : 'text-slate-700'
                    )}>
                      {mockPrice.toLocaleString()} 원
                    </div>
                  </div>
                </div>

                {/* Simulated Order Board Stats */}
                <div className={cn(
                  "p-3.5 rounded-2xl border flex flex-col justify-between",
                  isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
                )}>
                  <span className={cn("text-[10px] font-black uppercase tracking-wider", isDark ? "text-slate-400" : "text-slate-500")}>
                    감성 지수
                  </span>
                  <div className="mt-2.5 text-center">
                    <div className="text-2xl font-black text-[var(--price-up)] flex items-center justify-center gap-1">
                      <TrendingUp className="w-5 h-5 text-[var(--price-up)]" />
                      82%
                    </div>
                    <span className={cn("text-[8px] font-bold block mt-0.5", isDark ? "text-slate-400" : "text-slate-500")}>
                      상승 여력 매우 높음
                    </span>
                  </div>
                </div>
              </div>

              {/* Dynamic Simulated Chart Board */}
              <div className={cn(
                "p-4 rounded-2xl border h-[150px] flex flex-col justify-between relative",
                isDark ? "bg-slate-900/30 border-slate-800/80" : "bg-slate-50/50 border-slate-200"
              )}>
                
                {/* Simulated grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-40">
                  <div className={cn("w-full border-t border-dashed", isDark ? "border-slate-850" : "border-slate-200")} />
                  <div className={cn("w-full border-t border-dashed", isDark ? "border-slate-850" : "border-slate-200")} />
                  <div className={cn("w-full border-t border-dashed", isDark ? "border-slate-850" : "border-slate-200")} />
                </div>

                <div className="flex items-center justify-between z-10">
                  <span className={cn("text-[9px] font-black flex items-center gap-1", isDark ? "text-slate-400" : "text-slate-500")}>
                    <Sparkles className="w-3.5 h-3.5 text-slate-500" />
                    실시간 지표 차트
                  </span>
                  
                  {/* Indicators display */}
                  <div className="flex gap-2">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 border border-rose-500/20 font-bold">Price</span>
                    {level !== 'elementary' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 font-bold">MA(3)</span>
                    )}
                    {level === 'high' && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-650 border border-amber-500/20 font-bold">EMA(5)</span>
                    )}
                  </div>
                </div>

                {/* Dynamic SVG Chart Render */}
                <div className="flex-1 min-h-0 w-full flex items-center justify-center z-10 pt-2">
                  {level === 'elementary' && (
                    <svg className="w-full h-full" viewBox="0 0 280 110">
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
                    <svg className="w-full h-full" viewBox="0 0 280 110">
                      {/* Price Line */}
                      <polyline
                        fill="none"
                        stroke="#F04452"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={linePoints}
                      />
                      {/* Moving Average Line */}
                      <polyline
                        fill="none"
                        stroke={isDark ? '#6366f1' : '#4f46e5'}
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={maPoints}
                      />
                    </svg>
                  )}

                  {level === 'high' && (
                    <div className="w-full h-full flex items-end justify-between px-2 pt-2 pb-1 relative">
                      {/* Candlestick Simulator */}
                      {priceHistory.map((p, idx) => {
                        const prev = idx > 0 ? priceHistory[idx - 1] : p;
                        const isCandleUp = p >= prev;
                        const max = Math.max(...priceHistory);
                        const min = Math.min(...priceHistory);
                        const range = max - min || 1;
                        
                        const heightPercent = Math.max(10, Math.min(90, ((p - min) / range) * 80));
                        const prevPercent = Math.max(10, Math.min(90, ((prev - min) / range) * 80));
                        const bodyTop = Math.max(heightPercent, prevPercent);
                        const bodyBottom = Math.min(heightPercent, prevPercent);
                        const bodyHeight = Math.max(8, bodyTop - bodyBottom);
                        
                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer mx-1.5">
                            {/* Wick line */}
                            <div 
                              className={cn("w-[1.5px] absolute bottom-0", 
                                isCandleUp ? "bg-[var(--price-up)]" : "bg-[var(--price-down)]"
                              )} 
                              style={{ height: `${heightPercent + 12}%`, bottom: `${Math.min(heightPercent, prevPercent) - 3}%` }} 
                            />
                            {/* Body block */}
                            <div 
                              className={cn("w-full rounded-sm z-10 transition-all shadow-sm", 
                                isCandleUp ? "bg-[var(--price-up)] shadow-[var(--price-up)]/30" : "bg-[var(--price-down)] shadow-[var(--price-down)]/30"
                              )} 
                              style={{ height: `${bodyHeight}%`, marginBottom: `${bodyBottom}%` }} 
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className={cn("flex items-center justify-between text-[7px] border-t pt-1 mt-1 z-10 font-bold", isDark ? "text-slate-550 border-slate-800/40" : "text-slate-400 border-slate-100")}>
                  <span>DAY 1</span>
                  <span>DAY 2</span>
                  <span>DAY 3</span>
                  <span>DAY 4</span>
                  <span>DAY 5</span>
                  <span>DAY 6</span>
                </div>
              </div>

              {/* Dynamic Live News Ticker Card */}
              <div className={cn(
                "p-3.5 rounded-2xl border space-y-2",
                isDark ? "bg-slate-900/40 border-slate-800/80" : "bg-slate-50 border-slate-200"
              )}>
                <div className={cn("flex items-center gap-1 text-[9px] font-black", isDark ? "text-slate-400" : "text-slate-500")}>
                  <Newspaper className="w-3.5 h-3.5 text-slate-500" />
                  실시간 연동 가상 뉴스룸
                </div>
                <div className={cn(
                  "text-[11px] font-bold p-2.5 rounded-xl transition-all duration-300 min-h-[42px] flex items-center leading-normal border",
                  isDark 
                    ? "text-white bg-slate-950/40 border-slate-900/60" 
                    : "text-slate-800 bg-white border-slate-100 shadow-sm"
                )}>
                  {mockNewsByLevel[level][newsIndex]}
                </div>
              </div>
            </div>

            {/* Mock status footer */}
            <div className={cn(
              "px-4 py-2 border-t flex items-center justify-between text-[8px] font-extrabold",
              isDark ? "bg-slate-900/40 border-slate-800/80 text-slate-500" : "bg-slate-50 border-slate-200 text-slate-400"
            )}>
              <span>● SERVER ONLINE</span>
              <span>스탁스쿨 엔진 v1.4.2</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
