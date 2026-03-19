import { BookOpen, CheckCircle, Clock, Play, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

type GameState = 'setup' | 'loading' | 'reading' | 'quiz' | 'result';

interface Question {
  question: string;
  options: string[];
  answerIndex: number;
}

interface Article {
  title: string;
  content: string;
  questions: Question[];
}

export default function App() {
  const [gameState, setGameState] = useState<GameState>('setup');
  const [textLength, setTextLength] = useState<number>(400);
  const [article, setArticle] = useState<Article | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [readingTimeMs, setReadingTimeMs] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<number[]>([]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gameState === 'reading') {
      interval = setInterval(() => {
        setElapsedMs(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameState, startTime]);

  const generateArticle = async () => {
    setGameState('loading');
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setElapsedMs(0);
    
    try {
      const response = await fetch('/api/generate-article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textLength }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json() as Article;
      setArticle(data);
      setGameState('reading');
      setStartTime(Date.now());
    } catch (error) {
      console.error(error);
      alert('文章の生成に失敗したよ。もう一度試してね。');
      setGameState('setup');
    }
  };

  const finishReading = () => {
    setReadingTimeMs(Date.now() - startTime);
    setGameState('quiz');
  };

  const handleAnswer = (index: number) => {
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);
    if (article && currentQuestionIndex < article.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setGameState('result');
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setArticle(null);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const deciseconds = Math.floor((ms % 1000) / 100);
    return `${seconds}.${deciseconds}秒`;
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-200">
      <header className="bg-white border-b border-stone-200 p-4 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xl">
            <BookOpen className="w-6 h-6" />
            <span>速読トレーニング</span>
          </div>
          {gameState === 'reading' && (
            <div className="flex items-center gap-2 font-mono text-lg bg-stone-100 px-3 py-1 rounded-md">
              <Clock className="w-5 h-5 text-stone-500" />
              {formatTime(elapsedMs)}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 md:p-8">
        {gameState === 'setup' && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center space-y-8">
            <div>
              <h2 className="text-2xl font-bold mb-2">速読にチャレンジしよう</h2>
              <p className="text-stone-500">文章を読んで、その後の理解度テストに答えてね。</p>
            </div>

            <div className="space-y-4">
              <p className="font-medium">文章の長さを選んでね（目安）</p>
              <div className="flex flex-wrap justify-center gap-3">
                {[100, 200, 400, 600, 800, 1000].map((len) => (
                  <button
                    key={len}
                    onClick={() => setTextLength(len)}
                    className={`px-6 py-3 rounded-xl font-medium transition-colors ${
                      textLength === len
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                    }`}
                  >
                    {len}文字
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateArticle}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-stone-800 transition-transform active:scale-95"
            >
              <Play className="w-5 h-5" />
              スタート
            </button>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            <p className="text-stone-500 font-medium animate-pulse">文章を作成中...</p>
          </div>
        )}

        {gameState === 'reading' && article && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-10">
              <h1 className="text-2xl md:text-3xl font-bold mb-6 text-stone-800 leading-tight">
                {article.title}
              </h1>
              <div className="prose prose-stone max-w-none text-lg leading-loose tracking-wide">
                {article.content.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
            <div className="text-center">
              <button
                onClick={finishReading}
                className="bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold text-xl shadow-md hover:bg-emerald-700 transition-transform active:scale-95"
              >
                読み終わった！
              </button>
            </div>
          </div>
        )}

        {gameState === 'quiz' && article && (
          <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-8">
              <div className="text-sm font-bold text-emerald-600 mb-2 tracking-wider">
                QUESTION {currentQuestionIndex + 1} / {article.questions.length}
              </div>
              <h2 className="text-xl md:text-2xl font-bold leading-relaxed">
                {article.questions[currentQuestionIndex].question}
              </h2>
            </div>
            <div className="space-y-3">
              {article.questions[currentQuestionIndex].options.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  className="w-full text-left p-4 rounded-xl border-2 border-stone-100 hover:border-emerald-500 hover:bg-emerald-50 transition-colors text-lg font-medium"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'result' && article && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 md:p-10 text-center">
              <h2 className="text-3xl font-bold mb-8">結果発表</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100">
                  <div className="text-stone-500 text-sm font-bold mb-1">読書時間</div>
                  <div className="text-3xl font-mono font-bold text-stone-900">
                    {formatTime(readingTimeMs)}
                  </div>
                </div>
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100">
                  <div className="text-stone-500 text-sm font-bold mb-1">読書速度</div>
                  <div className="text-3xl font-mono font-bold text-emerald-600">
                    {Math.round(article.content.length / (readingTimeMs / 1000 / 60))}
                    <span className="text-base font-sans text-stone-500 ml-1">文字/分</span>
                  </div>
                </div>
                <div className="bg-stone-50 p-6 rounded-xl border border-stone-100">
                  <div className="text-stone-500 text-sm font-bold mb-1">正解数</div>
                  <div className="text-3xl font-mono font-bold text-stone-900">
                    {answers.filter((a, i) => a === article.questions[i].answerIndex).length}
                    <span className="text-base font-sans text-stone-500 mx-1">/</span>
                    {article.questions.length}
                  </div>
                </div>
              </div>

              <div className="text-left space-y-6 mb-10">
                <h3 className="text-xl font-bold border-b pb-2">問題の振り返り</h3>
                {article.questions.map((q, i) => {
                  const isCorrect = answers[i] === q.answerIndex;
                  return (
                    <div key={i} className={`p-4 rounded-xl border ${isCorrect ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                      <div className="flex items-start gap-3">
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-6 h-6 text-red-600 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold mb-2">{q.question}</p>
                          <p className="text-sm text-stone-600 mb-1">
                            あなたの回答: <span className={isCorrect ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold line-through'}>{q.options[answers[i]]}</span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-emerald-700 font-bold">
                              正解: {q.options[q.answerIndex]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={resetGame}
                className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-stone-800 transition-transform active:scale-95"
              >
                <RotateCcw className="w-5 h-5" />
                もう一度プレイする
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
