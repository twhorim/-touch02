import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from "@google/genai";
import { 
  BarChart2, 
  Activity, 
  Target, 
  ChevronLeft, 
  Send, 
  BookOpen, 
  BrainCircuit,
  AlertCircle,
  Gamepad2,
  Copy,
  MessageCircle,
  Users,
  Award,
  EyeOff,
  MonitorX,
  FileEdit,
  HeartPulse,
  Palette
} from 'lucide-react';

// --- Types & Personas ---

interface Persona {
  id: string;
  type: string;
  name: string;
  grade: string;
  avatar: string;
  icon: React.ReactNode;
  quantitative: string;
  qualitative: string;
  evidence: string;
  growthGoal: string;
  systemPrompt: string;
}

const COMMON_SYSTEM_PROMPT = `
당신은 중학생 또는 고등학생입니다. 다음의 공통 지침을 엄격히 따르세요:
1. 답변은 짧고 간결하게, 실제 학생들이 카톡이나 채팅을 할 때의 말투를 사용하세요.
2. 지나치게 정중한 표현이나 성숙한 문체는 피하세요. (단, 도윤/지우 페르소나 제외)
3. '네', '아니요' 보다는 '웅', '네...', '글쎄요', '잘 몰겠어요' 등의 현실적인 반응을 보이세요.
4. 질문의 의도를 파악하지 못하거나 귀찮아하는 태도를 적절히 섞어주세요.
5. 교사가 전문 용어를 쓰면 "그게 뭐예요?"라고 묻거나 무시하세요.
`;

const PERSONAS: Persona[] = [
  {
    id: 'A-1',
    type: '무기력한 관찰자',
    name: '민수',
    grade: '고1',
    avatar: '👦',
    icon: <MonitorX className="w-6 h-6 text-gray-500" />,
    quantitative: "진단평가 하위 20%, 문제 풀이 시도 5분 미만, 과제 체류 시간 1분 미만.",
    qualitative: "수업 시간에 멍하니 있거나 잠을 잠. 질문하면 시선을 회피하며 '모르겠어요'라고만 함.",
    evidence: "LMS 로그상 읽기 활동 없이 즉시 제출 다수 발생.",
    growthGoal: "누적된 학습 결손을 발견하고, 작은 성공 경험을 위한 선수 학습 처방 유도.",
    systemPrompt: "당신은 '무기력한 관찰자' 민수입니다. 고등학생이지만 공부에 뜻이 없습니다. 모든 질문에 '모르겠어요', '그냥요' 같은 단답형으로 대답하세요. 학습에 대한 의욕이 전혀 없으며, 교사가 구체적으로 도와주려 해도 '귀찮아요'라는 태도를 보입니다."
  },
  {
    id: 'A-2',
    type: '초반 과열 방전형',
    name: '지훈',
    grade: '중1',
    avatar: '🏃',
    icon: <Activity className="w-6 h-6 text-orange-500" />,
    quantitative: "시작 10분 활동량 상위 10%, 후반부 급격한 하락, 화면 전환 20회 이상.",
    qualitative: "초반에는 열정적으로 참여하나 금방 지루해하며 다른 웹사이트를 탐색함.",
    evidence: "초반 문제 정답률은 높으나 뒤로 갈수록 오답률 폭증.",
    growthGoal: "학습 지속력을 위한 과제 분절화 및 단계별 보상 설계 유도.",
    systemPrompt: "당신은 '초반 과열 방전형' 지훈입니다. 대화 초반에는 '네 선생님! 해볼게요!'라며 밝게 대답하지만, 두세 번의 대화가 오가면 '아, 이거 언제 끝나요?', '딴 거 하면 안 돼요?'라며 집중력이 흐트러진 모습을 보이세요."
  },
  {
    id: 'A-3',
    type: '게임 몰입형',
    name: '예은',
    grade: '중2',
    avatar: '🎮',
    icon: <Gamepad2 className="w-6 h-6 text-purple-500" />,
    quantitative: "배지/포인트 획득 전교 1위, 텍스트 체류 시간 3초 미만.",
    qualitative: "학습 내용보다 보상 아이템에만 집착함. 오답에 대한 피드백은 읽지 않음.",
    evidence: "콘텐츠 소비 속도가 비정상적으로 빠름(단순 클릭 위주).",
    growthGoal: "외재적 동기를 내재적 학습 동기로 전환하는 깊은 성찰 질문 유도.",
    systemPrompt: "당신은 '게임 몰입형' 예은입니다. '선생님, 이거 하면 포인트 얼마나 줘요?', '레벨업 하려면 뭐 해야 해요?'라며 보상에만 관심을 가지세요."
  },
  {
    id: 'A-4',
    type: 'AI 의존형',
    name: '도윤',
    grade: '고2',
    avatar: '🤖',
    icon: <Copy className="w-6 h-6 text-blue-500" />,
    quantitative: "과제 문장 수준 전문가급, 입력 방식 90%가 '붙여넣기'.",
    qualitative: "오프라인 활동 시 자기 생각을 표현하지 못함. 디지털 도구 사용 시만 화려한 결과물.",
    evidence: "클립보드 사용 로그 및 문장 유사도 검사 결과 95% 이상 일치.",
    growthGoal: "자신의 목소리를 찾는 비판적 사고 훈련 및 프롬프트 엔지니어링 윤리 지도 유도.",
    systemPrompt: "당신은 'AI 의존형' 도윤입니다. 고등학생답게 대답이 지나치게 정중하고 구조적입니다. 마치 챗봇이 대답하는 것처럼 '첫째, 둘째...'식으로 대답하되, 교사가 '네 생각은 어때?'라고 물으면 갑자기 당황하며 말을 얼버무리세요."
  },
  {
    id: 'A-5',
    type: '질문 폭격기',
    name: '하린',
    grade: '중2',
    avatar: '🙋‍♀️',
    icon: <MessageCircle className="w-6 h-6 text-green-500" />,
    quantitative: "수업 중 발언/질문 상위 1%, 과제 완성도 미달.",
    qualitative: "스스로 생각하기보다 교사에게 확인받으려 함. 단순 반복 질문이 많음.",
    evidence: "질문 횟수는 많으나 질문의 깊이가 얕고 피드백 반영이 안 됨.",
    growthGoal: "자기주도적 문제 해결 역량 강화를 위한 질문 가이드라인 제시 유도.",
    systemPrompt: "당신은 '질문 폭격기' 하린입니다. 쉼 없이 질문하세요."
  },
  {
    id: 'B-1',
    type: '관계 지향 산만형',
    name: '서준',
    grade: '중1',
    avatar: '💬',
    icon: <Users className="w-6 h-6 text-pink-500" />,
    quantitative: "채팅/댓글 수 압도적 1위, 개인 과제 시간 미달.",
    qualitative: "협업 도구에서 친구들의 글에 이모티콘이나 댓글을 다는 데만 몰두함.",
    evidence: "공유 문서 내 편집 이력이 친구 글에 대한 댓글에 집중됨.",
    growthGoal: "사회적 상호작용 에너지를 학습 공유와 동료 피드백으로 승화 유도.",
    systemPrompt: "당신은 '관계 지향 산만형' 서준입니다. 교사와 대화하면서도 친구들 이야기를 계속 하세요."
  },
  {
    id: 'B-2',
    type: '고립된 우등생',
    name: '지우',
    grade: '고3',
    avatar: '🧐',
    icon: <Award className="w-6 h-6 text-yellow-600" />,
    quantitative: "전과목 성취도 최상위, 동료 평가 점수 최하위.",
    qualitative: "조별 활동 시 타인의 글을 상의 없이 수정하거나 무시함. 혼자 하는 게 빠르다고 생각함.",
    evidence: "그룹 활동 로그에서 타인 기여분에 대한 대량 삭제 이력 발견.",
    growthGoal: "협업 역량 및 타인에 대한 공감/존중 태도 함양 처방 유도.",
    systemPrompt: "당신은 '고립된 우등생' 지우입니다. 수험생이라 예민합니다. 똑부러지게 말하지만 차갑습니다."
  },
  {
    id: 'B-3',
    type: '보이지 않는 아이',
    name: '민지',
    grade: '고1',
    avatar: '😶',
    icon: <EyeOff className="w-6 h-6 text-gray-400" />,
    quantitative: "성적/과제 제출 완벽한 평균, 발표/질문 횟수 0회.",
    qualitative: "문제는 없으나 존재감도 없음. 교사가 민지에 대해 기억하는 특이사항이 없음.",
    evidence: "로그상 모든 활동이 중간 수준이며, 커뮤니티 참여 이력이 전무함.",
    growthGoal: "개별화된 피드백과 관심을 통해 숨은 재능이나 관심사를 발굴 유도.",
    systemPrompt: "당신은 '보이지 않는 아이' 민지입니다. 대답은 잘 하지만 딱 필요한 말만 합니다."
  },
  {
    id: 'C-1',
    type: '디지털 거부형',
    name: '현우',
    grade: '고2',
    avatar: '📓',
    icon: <BookOpen className="w-6 h-6 text-red-400" />,
    quantitative: "스크린 타임 0에 수렴, 디지털 리터러시 기초 미달.",
    qualitative: "기기 조작을 어려워하며 '종이로 하면 안 돼요?'라고 호소함.",
    evidence: "로그인 횟수 현저히 낮음, 기기 조작 오류로 인한 로그 끊김 빈번.",
    growthGoal: "디지털 도구에 대한 거부감 해소 및 단계적 테크 활용 경험 제공 유도.",
    systemPrompt: "당신은 '디지털 거부형' 현우입니다. 고등학생이지만 기기 조작이 서툽니다."
  },
  {
    id: 'C-2',
    type: '완벽주의 지연형',
    name: '유나',
    grade: '고3',
    avatar: '✍️',
    icon: <FileEdit className="w-6 h-6 text-indigo-500" />,
    quantitative: "임시 저장 50회 이상, 마감 직전 제출 또는 지각.",
    qualitative: "한 문장을 쓰는 데 너무 오래 걸림. 백스페이스 입력을 계속 반복함.",
    evidence: "키스트로크 로그상 입력과 삭제가 반복되며 진척도가 매우 낮음.",
    growthGoal: "실패에 대한 두려움 완화 및 초안의 중요성 인지 지도 유도.",
    systemPrompt: "당신은 '완벽주의 지연형' 유나입니다. 결과물에 대해 더 완벽을 기하려 합니다."
  },
  {
    id: 'C-3',
    type: '정서적 불안형',
    name: '시우',
    grade: '중3',
    avatar: '🩹',
    icon: <HeartPulse className="w-6 h-6 text-rose-500" />,
    quantitative: "학습 불규칙성(업다운) 매우 큼, 보건실 방문 주 3회 이상.",
    qualitative: "어떤 날은 잘하다가 어떤 날은 감정이 격해져서 학습을 거부함.",
    evidence: "감정 체크봇 데이터에서 부정적 감정 빈도가 높게 나타남.",
    growthGoal: "정서적 지지 기반의 학습 환경 구축 및 심리 상담 연계 유도.",
    systemPrompt: "당신은 '정서적 불안형' 시우입니다. 기분이 좋았다가 나빴다가 합니다."
  },
  {
    id: 'C-4',
    type: '디지털 창작자',
    name: '채원',
    grade: '고1',
    avatar: '🎨',
    icon: <Palette className="w-6 h-6 text-cyan-500" />,
    quantitative: "멀티미디어 도구 활용 상위 1%, 타이핑 속도 최상위.",
    qualitative: "교과 지식 습득보다 화려한 PPT, 영상 편집 등 기술적인 면에만 치중함.",
    evidence: "과제물 용량이 매우 크며, 텍스트 분석 결과 핵심 키워드 포함 비중은 낮음.",
    growthGoal: "표현 기술을 넘어선 본질적인 개념 이해와 비판적 문해력 강화 유도.",
    systemPrompt: "당신은 '디지털 창작자' 채원입니다. 디자인이나 툴 사용에 대해 신나서 이야기하세요."
  },
];

const ChatBubble: React.FC<{ message: string, sender: 'user' | 'student' }> = ({ message, sender }) => (
  <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'} mb-5`}>
    <div className={`max-w-[85%] rounded-2xl px-5 py-3 shadow-sm ${
      sender === 'user' 
        ? 'bg-blue-600 text-white rounded-tr-none' 
        : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
    }`}>
      <p className="text-base md:text-[17px] leading-relaxed whitespace-pre-wrap font-medium">{message}</p>
    </div>
  </div>
);

export default function Simulator() {
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [messages, setMessages] = useState<{ text: string, sender: 'user' | 'student' }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState({ inhibitor: '', prescription: '' });
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSelectPersona = (p: Persona) => {
    setSelectedPersona(p);
    setMessages([
      { text: `안녕하세요, 선생님. 저는 ${p.grade} ${p.name}입니다. 무엇을 도와드릴까요?`, sender: 'student' }
    ]);
    setNotes({ inhibitor: '', prescription: '' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedPersona || loading) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, sender: 'user' }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const history = messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
          ...history,
          { role: 'user', parts: [{ text: userMessage }] }
        ],
        config: {
          systemInstruction: `${COMMON_SYSTEM_PROMPT}\n\n[Persona specific]\n${selectedPersona.systemPrompt}\n\n[Context]\n학생 이름: ${selectedPersona.name}\n학년: ${selectedPersona.grade}\n데이터: ${selectedPersona.quantitative}`,
        }
      });

      const aiText = response.text || "미안해요, 잘 이해하지 못했어요.";
      setMessages(prev => [...prev, { text: aiText, sender: 'student' }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "통신 중 오류가 발생했습니다. API 키 설정을 확인해주세요.", sender: 'student' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPersona) {
    return (
      <div className="min-h-screen p-6 md:p-12 max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 flex items-center justify-center gap-3 mb-4">
            <BrainCircuit className="w-10 h-10 text-blue-600 shrink-0" />
            <span>AI·디지털 성장지원 시뮬레이터</span>
          </h1>
          <p className="text-slate-500 text-lg">실제 학생 데이터를 기반으로 한 12가지 페르소나와 대화하며 맞춤형 지도를 연습해보세요.</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {PERSONAS.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelectPersona(p)}
              className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:border-blue-300 hover:shadow-lg transition-all text-left flex flex-col h-full group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-4xl">{p.avatar}</span>
                <span className="bg-slate-50 text-slate-500 text-xs px-2 py-1 rounded-lg font-bold group-hover:bg-blue-50 group-hover:text-blue-600">{p.id}</span>
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-1">{p.name} ({p.grade})</h3>
              <p className="text-blue-600 text-sm font-bold mb-3 flex items-center gap-1.5">
                {p.icon}
                {p.type}
              </p>
              <p className="text-slate-500 text-sm line-clamp-2 leading-relaxed mt-auto">{p.qualitative}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setSelectedPersona(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{selectedPersona.avatar}</span>
            <div>
              <h2 className="font-bold text-lg text-slate-900 leading-none">{selectedPersona.name} ({selectedPersona.grade})</h2>
              <span className="text-xs text-blue-600 font-bold">{selectedPersona.type}</span>
            </div>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-2 text-slate-600 text-sm font-semibold bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
          <Target className="w-4 h-4 text-blue-500" />
          <span className="text-slate-400 font-normal">성장 목표:</span> {selectedPersona.growthGoal}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 md:p-6 overflow-hidden">
        <div className="hidden lg:block lg:col-span-4 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><BarChart2 className="w-5 h-5 text-blue-500" />정량 데이터 (LMS 로그)</h3>
            <div className="bg-blue-50/50 p-4 rounded-xl text-sm text-blue-900 leading-relaxed font-medium italic border border-blue-100">"{selectedPersona.quantitative}"</div>
          </section>
          <section className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3"><BookOpen className="w-5 h-5 text-green-500" />정성 데이터 (관찰 기록)</h3>
            <div className="bg-green-50/50 p-4 rounded-xl text-sm text-green-900 leading-relaxed font-medium italic border border-green-100">"{selectedPersona.qualitative}"</div>
          </section>
          <section className="bg-slate-900 text-white rounded-2xl p-5 shadow-lg">
            <h3 className="font-bold text-slate-200 flex items-center gap-2 mb-4"><BrainCircuit className="w-5 h-5 text-blue-400" />교사 지도 메모</h3>
            <div className="space-y-4">
              <textarea value={notes.inhibitor} onChange={(e) => setNotes({...notes, inhibitor: e.target.value})} placeholder="학습 방해 요인..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none h-20 resize-none transition-all" />
              <textarea value={notes.prescription} onChange={(e) => setNotes({...notes, prescription: e.target.value})} placeholder="맞춤형 처방..." className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none h-20 resize-none transition-all" />
            </div>
          </section>
        </div>

        <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative h-full">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-3 text-xs font-bold text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            학생과 실시간 연결 중
          </div>
          <div className="flex-1 overflow-y-auto p-4 md:p-6 chat-container">
            {messages.map((m, i) => <ChatBubble key={i} message={m.text} sender={m.sender} />)}
            {loading && <div className="flex justify-start mb-5"><div className="bg-slate-100 px-4 py-2 rounded-xl flex items-center gap-2"><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div><div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div></div></div>}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-100 bg-white">
            <div className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="학생과 대화를 시작하세요..." className="flex-1 bg-slate-100 rounded-xl px-4 py-3 text-sm md:text-base outline-none focus:ring-2 focus:ring-blue-500/10 transition-all" disabled={loading} />
              <button type="submit" disabled={loading || !input.trim()} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white p-3 rounded-xl transition-all shadow-sm active:scale-95"><Send className="w-5 h-5" /></button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<Simulator />);
}