/**
 * 오픈 소스 AI 모델 (Ollama) 연결 — 관리자 페이지 '고급 설정'에서 사용.
 * Ollama 가 이 컴퓨터(기본 http://localhost:11434)에서 돌고 있어야 한다.
 * 브라우저에서 부를 때 localhost 주소는 Ollama 기본 허용이지만, 배포 사이트에서 부르려면
 * Ollama 를 OLLAMA_ORIGINS=* 로 실행해야 한다.
 */

export interface OllamaModel {
  name: string;
  size: number;
  parameterSize?: string;
}

const trimUrl = (server: string) => server.trim().replace(/\/+$/, '');

/** 설치된 모델 목록. 서버가 꺼져 있으면 오류. */
export async function listModels(server: string): Promise<OllamaModel[]> {
  const res = await fetch(`${trimUrl(server)}/api/tags`);
  if (!res.ok) throw new Error(`Ollama 응답 오류 (${res.status})`);
  const data = (await res.json()) as {
    models?: { name: string; size: number; details?: { parameter_size?: string } }[];
  };
  return (data.models ?? []).map((m) => ({ name: m.name, size: m.size, parameterSize: m.details?.parameter_size }));
}

/** 줄 단위 JSON 스트림을 읽어 한 줄씩 넘겨 준다. */
async function readNdjson(res: Response, onLine: (obj: Record<string, unknown>) => void) {
  if (!res.body) {
    // 스트림을 못 읽는 환경: 한 번에 받는다.
    for (const line of (await res.text()).split('\n')) if (line.trim()) onLine(JSON.parse(line));
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, nl).trim();
      buf = buf.slice(nl + 1);
      if (line) onLine(JSON.parse(line));
    }
  }
  if (buf.trim()) onLine(JSON.parse(buf));
}

/** 모델 내려받기. onProgress(받은 바이트, 전체 바이트, 상태 문구). */
export async function pullModel(
  server: string,
  model: string,
  onProgress: (completed: number, total: number, status: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(`${trimUrl(server)}/api/pull`, {
    method: 'POST',
    body: JSON.stringify({ model, stream: true }),
    signal,
  });
  if (!res.ok) throw new Error(`내려받기 실패 (${res.status})`);
  await readNdjson(res, (o) => {
    if (o.error) throw new Error(String(o.error));
    onProgress(Number(o.completed ?? 0), Number(o.total ?? 0), String(o.status ?? ''));
  });
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** 대화 (글자가 나오는 대로 onToken). 다 끝나면 전체 답을 돌려준다. */
export async function chat(
  server: string,
  model: string,
  messages: ChatMessage[],
  onToken?: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const res = await fetch(`${trimUrl(server)}/api/chat`, {
    method: 'POST',
    // think: false — 생각 과정 없이 바로 답 (작은 PC 에서 훨씬 빠르다)
    body: JSON.stringify({ model, messages, stream: true, think: false }),
    signal,
  });
  if (res.status === 404) throw new Error(`'${model}' 모델이 아직 없어요. 먼저 내려받아 주세요.`);
  if (!res.ok) throw new Error(`AI 응답 오류 (${res.status}): ${await res.text()}`);
  let full = '';
  await readNdjson(res, (o) => {
    if (o.error) throw new Error(String(o.error));
    const piece = (o.message as { content?: string } | undefined)?.content ?? '';
    if (piece) {
      full += piece;
      onToken?.(piece);
    }
  });
  return full;
}

export const formatBytes = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}GB` : n >= 1e6 ? `${(n / 1e6).toFixed(0)}MB` : `${Math.round(n / 1e3)}KB`;
