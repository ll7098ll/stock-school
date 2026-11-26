import { GLOSSARY_BY_ID } from '../glossaryData.ts';

interface GlossaryMatchRule {
  id: string;
  pattern: RegExp;
}

/**
 * 기사 제목·본문(해설/정답 미참조, 순수 팩트 텍스트)에서
 * 실제 등장하는 금융·산업 용어를 정밀 매칭하는 규칙 목록.
 * 구체성이 높은 산업/신규 핵심 용어를 우선 배치합니다.
 */
const GLOSSARY_MATCH_RULES: GlossaryMatchRule[] = [
  // 1. 고구체성 산업·이벤트 핵심 용어 (신규 g-33 ~ g-80 우선)
  { id: 'g-69', pattern: /\bHBM\b|고대역폭\s*메모리/i },
  { id: 'g-72', pattern: /\bSCFI\b|\bBDI\b|해상\s*운임|컨테이너\s*운임|발틱\s*운임|운임\s*지수/i },
  { id: 'g-73', pattern: /신조선가|후판/ },
  { id: 'g-75', pattern: /부동산\s*PF|\bPF\b|대손충당금|연체율/i },
  { id: 'g-76', pattern: /\bCET1\b|\bCSM\b|\bK-ICS\b|보통주자본비율|지급여력비율|보험계약마진/i },
  { id: 'g-70', pattern: /임상\s*(?:1상|2상|3상|시험)|파이프라인|바이오시밀러|\bFDA\b|품목\s*허가/i },
  { id: 'g-71', pattern: /\bODM\b|\bOEM\b|위탁\s*생산|인디\s*브랜드/i },
  { id: 'g-74', pattern: /\bMAU\b|\bGMV\b|\bARPU\b|잠금\s*효과|Lock-in|월간\s*활성|거래액/i },
  { id: 'g-77', pattern: /유상증자|무상증자|권리락/ },
  { id: 'g-79', pattern: /지주사\s*할인|\bNAV\b|순자산가치/i },
  { id: 'g-78', pattern: /지배구조|거버넌스|주주총회|의결권|사외이사/ },
  { id: 'g-58', pattern: /\bCPI\b|\bPPI\b|소비자물가|생산자물가/i },
  { id: 'g-63', pattern: /관세|보호무역|공급망|리쇼어링|수출\s*통제/ },
  { id: 'g-65', pattern: /\bSOC\b|사회간접자본|공공\s*토목|인프라\s*예산/i },
  { id: 'g-66', pattern: /가동률|수율|감산|공장\s*증설|설비\s*증설/ },
  { id: 'g-67', pattern: /피크아웃|업황\s*사이클|경기\s*사이클|재고\s*순환|공급\s*과잉/ },
  { id: 'g-68', pattern: /\bASP\b|평균\s*판매\s*단가|에틸렌\s*스프레드|판가\s*스프레드|스프레드/i },
  { id: 'g-46', pattern: /가이던스|실적\s*전망치|연간\s*전망/ },
  { id: 'g-54', pattern: /선반영|차익\s*실현|셀온뉴스|재료\s*소멸/ },
  { id: 'g-47', pattern: /밸류에이션|멀티플|리레이팅|재평가/ },
  { id: 'g-45', pattern: /잉여현금흐름|\bFCF\b/i },
  { id: 'g-43', pattern: /영업이익률|\bOPM\b|마진율/i },
  { id: 'g-49', pattern: /총주주환원율|\bTSR\b|주주환원율/i },
  { id: 'g-48', pattern: /배당수익률|배당성향|배당락/ },
  { id: 'g-44', pattern: /\bEPS\b|\bBPS\b|주당순이익|주당순자산/i },
  { id: 'g-50', pattern: /EV\/EBITDA|\bEBITDA\b/i },
  { id: 'g-80', pattern: /\bDCF\b|\bWACC\b|할인율|환헤지|헤지/i },
  { id: 'g-59', pattern: /국채\s*금리|국채|회사채|채권\s*금리|채권/ },
  { id: 'g-60', pattern: /경기\s*침체|리세션|연착륙|경착륙/ },
  { id: 'g-61', pattern: /스태그플레이션|디플레이션/ },
  { id: 'g-62', pattern: /양적긴축|\bQT\b|피벗|긴축/i },
  { id: 'g-64', pattern: /무역수지|경상수지|무역\s*흑자|무역\s*적자/ },
  { id: 'g-38', pattern: /\bIPO\b|기업공개|신규\s*상장|중복\s*상장/i },
  { id: 'g-56', pattern: /외국인\s*(?:투자자|매수|매도|수급)|기관\s*(?:투자자|매수|매도|수급)|수급/ },
  { id: 'g-40', pattern: /성장주|가치주|밸류\s*트랩/ },
  { id: 'g-41', pattern: /경기\s*방어주|경기\s*민감주|시클리컬/ },
  { id: 'g-37', pattern: /\bETF\b|상장지수펀드|패시브\s*자금/i },
  { id: 'g-36', pattern: /코스피|코스닥|주가지수|벤치마크/ },
  { id: 'g-39', pattern: /포트폴리오|리밸런싱/ },

  // 2. 기존 핵심 개념 용어 (g-1 ~ g-32 중 누락 기사 보완)
  { id: 'g-30', pattern: /\bCDMO\b|위탁개발생산|바이오리액터/i },
  { id: 'g-25', pattern: /정제마진|크랙\s*스프레드/ },
  { id: 'g-26', pattern: /래깅|역래깅|재고평가손실/ },
  { id: 'g-27', pattern: /물적분할|중복상장/ },
  { id: 'g-28', pattern: /전환사채|\bCB\b|오버행|블록딜/i },
  { id: 'g-24', pattern: /수주잔고|수주\s*잔고/ },
  { id: 'g-22', pattern: /순이자마진|\bNIM\b|예대마진/i },
  { id: 'g-23', pattern: /설비투자|\bCapEx\b/i },
  { id: 'g-31', pattern: /밸류업|저PBR/i },
  { id: 'g-21', pattern: /자사주\s*(?:매입|소각)/ },
  { id: 'g-29', pattern: /액면분할/ },
  { id: 'g-19', pattern: /컨센서스|시장\s*예상치/ },
  { id: 'g-20', pattern: /어닝\s*서프라이즈|어닝\s*쇼크/ },
  { id: 'g-18', pattern: /환율|고환율|원화\s*약세|환차익/ },
  { id: 'g-6', pattern: /기준금리|금리\s*(?:인상|인하|동결)/ },
  { id: 'g-7', pattern: /인플레이션|물가\s*상승|고물가/ },
  { id: 'g-15', pattern: /양적완화|\bQE\b/i },
  { id: 'g-32', pattern: /안전자산|리스크\s*오프|Risk-Off/i },
  { id: 'g-12', pattern: /\bGDP\b|국내총생산|경제성장률/i },
  { id: 'g-13', pattern: /공매도|숏\s*스퀴즈/ },
  { id: 'g-2', pattern: /\bPER\b|주가수익비율/i },
  { id: 'g-3', pattern: /\bPBR\b|주가순자산비율/i },
  { id: 'g-11', pattern: /\bROE\b|자기자본이익률/i },
  { id: 'g-5', pattern: /배당금|고배당|배당\s*확대/ },
  { id: 'g-42', pattern: /매출액|영업이익|당기순이익/ },
  { id: 'g-9', pattern: /변동성/ },
  { id: 'g-14', pattern: /유동성/ },
  { id: 'g-17', pattern: /분산\s*투자/ },
];

/**
 * 기사의 제목·본문에 실제 등장하는 금융 용어를 탐색하여 기존 relatedGlossaryIds를 보강합니다.
 * - 정답 스포일러 방지를 위해 오직 title과 content만 분석합니다.
 * - 기존 수동 지정 ID를 우선 보존하되, 신규 용어 포함 최대 maxCount(기본 4)개까지 깔끔하게 연결합니다.
 */
export function enrichRelatedGlossaryIds(
  title: string,
  content: string,
  existingIds?: string[],
  maxCount = 4
): string[] {
  const result: string[] = [];
  const seen = new Set<string>();

  if (existingIds) {
    for (const id of existingIds) {
      if (GLOSSARY_BY_ID[id] && !seen.has(id)) {
        seen.add(id);
        result.push(id);
      }
    }
  }

  if (result.length >= maxCount) {
    return result.slice(0, maxCount);
  }

  const text = `${title}\n${content}`;
  for (const rule of GLOSSARY_MATCH_RULES) {
    if (result.length >= maxCount) break;
    if (seen.has(rule.id)) continue;
    if (rule.pattern.test(text) && GLOSSARY_BY_ID[rule.id]) {
      seen.add(rule.id);
      result.push(rule.id);
    }
  }

  return result;
}
