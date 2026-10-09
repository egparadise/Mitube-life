import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Divider, OutlineButton, RadioGroup, SectionTitle, SettingRow, ToggleItem } from '@/components/admin/admin-ui';
import { useTheme } from '@/hooks/use-theme';
import { chat, formatBytes, listModels, OllamaModel, pullModel } from '@/services/ollama';
import { useStore } from '@/store/store';

/** 고르기 쉽게 보여 줄 Qwen 모델 (Ollama 이름). */
const QWEN_PRESETS = [
  {
    value: 'qwen3.8',
    label: 'Qwen3.8 27B (요청 모델 · 약 17GB)',
    desc: '가장 똑똑해요. RAM 32GB 이상 또는 GPU 24GB 정도가 필요해요. 이 PC(RAM 14GB)에서는 답 하나에 10분 넘게 걸려요.',
  },
  { value: 'qwen3.5:9b', label: 'Qwen3.5 9B (약 6.6GB)', desc: 'RAM 16GB PC 에서 쓸 만한 중간 크기.' },
  { value: 'qwen3.5:4b', label: 'Qwen3.5 4B (약 3.4GB · 가벼움)', desc: '이 PC(RAM 14GB · GPU 4GB)에서도 잘 돌아가는 크기.' },
];

type Status = { state: 'checking' } | { state: 'ok'; models: OllamaModel[] } | { state: 'off'; message: string };

/** 고급 설정 → 오픈 소스 AI 모델 (Qwen · Ollama). */
export function AiSettings() {
  const theme = useTheme();
  const settings = useStore((s) => s.adminSettings);
  const setSettings = useStore((s) => s.setAdminSettings);
  const channels = useStore((s) => s.channels);
  const categories = useStore((s) => s.categories);
  const moveChannel = useStore((s) => s.moveChannel);

  const [server, setServer] = useState(settings.aiServer);
  const [status, setStatus] = useState<Status>({ state: 'checking' });
  const [pull, setPull] = useState<{ done: number; total: number; text: string } | null>(null);
  const [pullError, setPullError] = useState('');
  const [prompt, setPrompt] = useState('안녕! 너는 어떤 모델이니? 한 문장으로 한국어로 답해 줘.');
  const [answer, setAnswer] = useState('');
  const [chatBusy, setChatBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<{ channelId: string; title: string; categoryId: string | null }[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    setStatus({ state: 'checking' });
    try {
      setStatus({ state: 'ok', models: await listModels(settings.aiServer) });
    } catch (e) {
      setStatus({
        state: 'off',
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }, [settings.aiServer]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const installed = status.state === 'ok' ? status.models : [];
  /** 'qwen3.8' 처럼 태그 없이 고르면 Ollama 는 'qwen3.8:latest' 로 설치한다. */
  const isInstalled = (name: string) => installed.some((m) => m.name === name || m.name === `${name}:latest`);
  const hasModel = isInstalled(settings.aiModel);

  const startPull = async () => {
    setPullError('');
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setPull({ done: 0, total: 0, text: '준비 중…' });
    try {
      await pullModel(settings.aiServer, settings.aiModel, (done, total, text) => setPull({ done, total, text }), ctrl.signal);
      setPull(null);
      refresh();
    } catch (e) {
      setPull(null);
      if (!ctrl.signal.aborted) setPullError(e instanceof Error ? e.message : String(e));
    }
  };

  const ask = async () => {
    if (!prompt.trim() || chatBusy) return;
    setAnswer('');
    setChatBusy(true);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const started = Date.now();
    try {
      await chat(settings.aiServer, settings.aiModel, [{ role: 'user', content: prompt }], (t) => setAnswer((a) => a + t), ctrl.signal);
      setAnswer((a) => `${a}\n\n— ${((Date.now() - started) / 1000).toFixed(1)}초 · ${settings.aiModel}`);
    } catch (e) {
      if (!ctrl.signal.aborted) setAnswer(`⚠️ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setChatBusy(false);
    }
  };

  /** 미분류 채널 몇 개를 AI 에게 물어 분류 제안을 받는다. */
  const suggest = async () => {
    if (chatBusy) return;
    const tops = categories.filter((c) => !c.parentId);
    const targets = channels.filter((c) => !c.categoryId).slice(0, 8);
    if (targets.length === 0) {
      setAnswer('미분류 채널이 없어요 🎉');
      return;
    }
    setChatBusy(true);
    setSuggestions([]);
    setAnswer('미분류 채널을 AI 에게 물어보는 중…');
    try {
      const list = targets.map((c, i) => `${i + 1}. ${c.title} — ${(c.description || '').slice(0, 120)}`).join('\n');
      const names = tops.map((c) => c.name).join(', ');
      const reply = await chat(settings.aiServer, settings.aiModel, [
        {
          role: 'system',
          content: `너는 유튜브 채널 분류기야. 분류함은 [${names}] 중 하나이고, 어디에도 안 맞으면 "미분류". 반드시 "번호. 분류함" 형식으로 한 줄씩만 답해.`,
        },
        { role: 'user', content: list },
      ]);
      const byName = new Map(tops.map((c) => [c.name.replace(/\s/g, ''), c.id]));
      const out = targets.map((c, i) => {
        const line = reply.split('\n').find((l) => l.trim().startsWith(`${i + 1}.`)) ?? '';
        const name = line.replace(/^\s*\d+\.\s*/, '').replace(/[*"'\s]/g, '');
        return { channelId: c.id, title: c.title, categoryId: byName.get(name) ?? null };
      });
      setSuggestions(out);
      setAnswer('');
    } catch (e) {
      setAnswer(`⚠️ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setChatBusy(false);
    }
  };

  const catName = (id: string | null) => categories.find((c) => c.id === id)?.name ?? '미분류';
  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.backgroundSelected }];

  return (
    <>
      <SectionTitle title="오픈 소스 AI 모델" desc="Ollama 로 이 컴퓨터에서 Qwen 모델을 돌려요. 데이터가 밖으로 나가지 않아요." />

      <SettingRow label="AI 서버 (Ollama)">
        <View style={styles.inline}>
          <TextInput value={server} onChangeText={setServer} style={[inputStyle, { flex: 1 }]} autoCapitalize="none" />
          <OutlineButton
            label="저장 · 연결 확인"
            onPress={() => {
              setSettings({ aiServer: server.trim() || 'http://localhost:11434' });
              refresh();
            }}
          />
        </View>
        <Text style={[styles.status, { color: theme.text }]}>
          {status.state === 'checking'
            ? '⏳ 연결 확인 중…'
            : status.state === 'ok'
              ? `🟢 연결됨 · 설치된 모델 ${installed.length}개`
              : `🔴 연결 안 됨 — Ollama 를 실행해 주세요 (${status.message})`}
        </Text>
        {status.state === 'off' && (
          <Text style={[styles.help, { color: theme.textSecondary }]}>
            Ollama 설치: https://ollama.com/download → 설치 후 자동 실행돼요. 배포 사이트(mitube-life.web.app)에서 쓰려면
            ① 이 PC 의 Ollama 가 이 사이트를 허용해야 하고(환경 변수 OLLAMA_ORIGINS 에 사이트 주소 추가 후 Ollama 재시작),
            ② 크롬이 '로컬 네트워크 기기 액세스'를 물으면 [허용]을 눌러야 해요 (주소창 왼쪽 아이콘에서도 바꿀 수 있어요).
          </Text>
        )}
      </SettingRow>

      <SettingRow label="사용할 모델">
        <RadioGroup
          value={settings.aiModel}
          onChange={(v) => setSettings({ aiModel: v })}
          options={[
            ...QWEN_PRESETS.map((p) => ({
              ...p,
              label: `${p.label}${isInstalled(p.value) ? '  ✅ 설치됨' : ''}`,
            })),
            ...installed
              .filter((m) => !QWEN_PRESETS.some((p) => p.value === m.name || `${p.value}:latest` === m.name))
              .map((m) => ({ value: m.name, label: `${m.name} (${formatBytes(m.size)}) ✅ 설치됨` })),
          ]}
        />
        {status.state === 'ok' && !hasModel && (
          <View style={{ gap: 8 }}>
            <Text style={[styles.help, { color: theme.textSecondary }]}>
              '{settings.aiModel}' 이(가) 아직 없어요. 내려받으면 바로 쓸 수 있어요.
            </Text>
            {pull ? (
              <View style={{ gap: 6 }}>
                <View style={[styles.bar, { backgroundColor: theme.backgroundSelected }]}>
                  <View style={[styles.barFill, { width: `${pull.total ? (pull.done / pull.total) * 100 : 0}%` }]} />
                </View>
                <Text style={[styles.help, { color: theme.textSecondary }]}>
                  {pull.text} {pull.total ? `${formatBytes(pull.done)} / ${formatBytes(pull.total)}` : ''}
                </Text>
                <OutlineButton label="내려받기 멈춤" danger onPress={() => abortRef.current?.abort()} />
              </View>
            ) : (
              <OutlineButton label={`${settings.aiModel} 내려받기`} primary onPress={startPull} />
            )}
            {pullError ? <Text style={styles.error}>{pullError}</Text> : null}
          </View>
        )}
      </SettingRow>

      <SettingRow label="AI 기능">
        <ToggleItem
          value={settings.aiEnabled}
          onChange={(v) => setSettings({ aiEnabled: v })}
          title="앱에서 AI 사용"
          desc="켜면 채널 자동 분류 제안 등 AI 기능에 이 모델을 써요."
        />
      </SettingRow>

      <Divider />
      <SettingRow label="동작 시험">
        <TextInput value={prompt} onChangeText={setPrompt} multiline style={[inputStyle, styles.prompt]} />
        <View style={styles.inline}>
          <OutlineButton label={chatBusy ? '답하는 중…' : '보내기'} primary onPress={ask} disabled={chatBusy || !hasModel} />
          <OutlineButton label="미분류 채널 AI 분류 제안" onPress={suggest} disabled={chatBusy || !hasModel} />
          {chatBusy && <OutlineButton label="멈춤" danger onPress={() => abortRef.current?.abort()} />}
        </View>
        {answer ? (
          <Text selectable style={[styles.answer, { color: theme.text, backgroundColor: theme.backgroundElement }]}>
            {answer}
          </Text>
        ) : null}
        {suggestions.length > 0 && (
          <View style={[styles.answer, { backgroundColor: theme.backgroundElement, gap: 8 }]}>
            {suggestions.map((s) => (
              <View key={s.channelId} style={styles.suggestRow}>
                <Text style={{ flex: 1, color: theme.text }} numberOfLines={1}>
                  {s.title} → <Text style={{ fontWeight: '700' }}>{catName(s.categoryId)}</Text>
                </Text>
                {s.categoryId && (
                  <Pressable
                    onPress={() => {
                      moveChannel(s.channelId, s.categoryId);
                      setSuggestions((list) => list.filter((x) => x.channelId !== s.channelId));
                    }}>
                    <Text style={{ color: '#065fd4', fontWeight: '700' }}>적용</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        )}
      </SettingRow>
    </>
  );
}

const styles = StyleSheet.create({
  inline: { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  input: { borderWidth: 1, borderRadius: 10, height: 42, paddingHorizontal: 12, fontSize: 14, minWidth: 200 },
  prompt: { height: 80, paddingTop: 10, textAlignVertical: 'top' },
  status: { fontSize: 14, fontWeight: '600' },
  help: { fontSize: 13, lineHeight: 19 },
  error: { color: '#d93025', fontSize: 13 },
  bar: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: '#065fd4' },
  answer: { borderRadius: 12, padding: 14, fontSize: 14, lineHeight: 21 },
  suggestRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
});
