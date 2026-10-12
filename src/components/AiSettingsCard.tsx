import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Text, View } from 'react-native';
import {
  AiConfig,
  AiProvider,
  DEFAULT_CLOUD_MODEL,
  FoodPhotoError,
  FoodPhotoErrorReason,
  OllamaCloudCheck,
  OllamaModel,
  PROVIDER_NAMES,
  activeModel,
  aiErrorText,
  checkClaudeKey,
  checkOllamaCloud,
  isAiReady,
  listOllamaModels,
  normalizeOllamaHost,
} from '../ai';
import { useStore } from '../store';
import { colors, font, space } from '../theme';
import { Button, Card, Chip, Field, IconName, Option } from './ui';

const LINKS = {
  ollamaKeys: 'https://ollama.com/settings/keys',
  ollamaNetwork: 'https://docs.ollama.com/faq',
  claudeKeys: 'https://platform.claude.com/settings/keys',
};

const PROVIDERS: { key: AiProvider; icon: IconName; hint: string }[] = [
  { key: 'ollama-cloud', icon: 'cloud-outline', hint: 'Бесплатно, нужен аккаунт на ollama.com. Работает везде, но есть лимит.' },
  { key: 'ollama-local', icon: 'desktop-outline', hint: 'Бесплатно и без лимитов. Работает дома, когда телефон в одной Wi-Fi сети с компьютером.' },
  { key: 'claude', icon: 'sparkles-outline', hint: 'Платно, около 1–3 центов за фото, зато точнее всего.' },
];

// Ошибки связи не значат, что ключ плохой: такие настройки сохраняем без проверки
const OFFLINE: FoodPhotoErrorReason[] = ['network', 'timeout', 'busy', 'limit'];

type Status = { text: string; ok: boolean } | null;

function reasonOf(e: unknown): FoodPhotoErrorReason {
  return e instanceof FoodPhotoError ? e.reason : 'other';
}

function errorStatus(e: unknown, provider: AiProvider): Status {
  const reason = reasonOf(e);
  return { ok: false, text: aiErrorText(reason, provider) + (reason === 'other' && e instanceof Error ? ` ${e.message}` : '') };
}

const pad = (n: number) => String(n).padStart(2, '0');

function limitNote({ leftPercent, resetsAt }: OllamaCloudCheck, model: string): Status {
  const when = resetsAt ? `, обновится ${pad(resetsAt.getDate())}.${pad(resetsAt.getMonth() + 1)}` : '';
  if (leftPercent === 0) {
    return { ok: false, text: `Ключ подошёл, но бесплатный лимит сейчас закончился${when}. Пока можно считать через Ollama на компьютере.` };
  }
  const left = leftPercent === null ? '' : ` Бесплатного лимита осталось ${leftPercent}%${when}.`;
  return { ok: true, text: `Готово, ключ подошёл. Считает ${model} в Ollama Cloud.${left}` };
}

// Выбор нейросети для калорий по фото: Ollama в облаке, Ollama на своём компьютере или Claude
export default function AiSettingsCard() {
  const { ai, setAi } = useStore();
  const [provider, setProvider] = useState<AiProvider>(ai?.provider ?? 'ollama-cloud');
  const [keyInput, setKeyInput] = useState('');
  const [cloudModel, setCloudModel] = useState(ai?.ollamaCloudModel ?? DEFAULT_CLOUD_MODEL);
  const [host, setHost] = useState(ai?.ollamaHost ?? '');
  const [localModel, setLocalModel] = useState(ai?.ollamaLocalModel ?? '');
  const [models, setModels] = useState<OllamaModel[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  const savedKey = provider === 'claude' ? ai?.claudeKey : provider === 'ollama-cloud' ? ai?.ollamaKey : undefined;
  const key = keyInput.trim() || savedKey || '';

  const choose = (p: AiProvider) => {
    setProvider(p);
    setKeyInput('');
    setStatus(null);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setStatus(null);
    try {
      await fn();
    } finally {
      setBusy(false);
    }
  };

  const saveClaude = () =>
    run(async () => {
      let note: Status = { ok: true, text: 'Готово, Claude подключён.' };
      try {
        await checkClaudeKey(key);
      } catch (e) {
        if (reasonOf(e) === 'auth') return setStatus({ ok: false, text: 'Ключ не подошёл. Скопируй его ещё раз целиком.' });
        if (!OFFLINE.includes(reasonOf(e))) return setStatus(errorStatus(e, 'claude'));
        note = { ok: false, text: 'Ключ сохранён, но проверить его не получилось: нет связи с сервером.' };
      }
      setAi({ ...ai, provider: 'claude', claudeKey: key });
      setKeyInput('');
      setStatus(note);
    });

  const saveCloud = () =>
    run(async () => {
      const model = cloudModel.trim() || DEFAULT_CLOUD_MODEL;
      const config: AiConfig = { ...ai, provider: 'ollama-cloud', ollamaKey: key, ollamaCloudModel: model };
      let note: Status;
      try {
        const check = await checkOllamaCloud(config);
        const names = check.models;
        if (names.length && !names.includes(model)) {
          const similar = names.filter((n) => /gemma|vl|vision|llava/i.test(n));
          return setStatus({ ok: false, text: `В облаке нет модели ${model}. Есть, например: ${(similar.length ? similar : names).slice(0, 6).join(', ')}` });
        }
        note = limitNote(check, model);
      } catch (e) {
        if (reasonOf(e) === 'auth') return setStatus({ ok: false, text: 'Ключ Ollama не подошёл. Скопируй его ещё раз целиком.' });
        if (!OFFLINE.includes(reasonOf(e))) return setStatus(errorStatus(e, 'ollama-cloud'));
        note = { ok: false, text: 'Сохранил, но проверить не получилось: нет связи с ollama.com.' };
      }
      setAi(config);
      setKeyInput('');
      setStatus(note);
    });

  const findModels = () =>
    run(async () => {
      try {
        const usable = (await listOllamaModels({ provider: 'ollama-local', ollamaHost: host })).filter((m) => m.vision !== false);
        setModels(usable);
        if (!usable.some((m) => m.name === localModel)) setLocalModel((usable.find((m) => m.vision) ?? usable[0])?.name ?? '');
        setStatus(
          usable.length
            ? { ok: true, text: 'Компьютер найден. Выбери модель и нажми «Сохранить».' }
            : { ok: false, text: 'На компьютере нет моделей, которые понимают фото. Скачай: ollama pull gemma4' },
        );
      } catch (e) {
        setModels(null);
        setStatus(errorStatus(e, 'ollama-local'));
      }
    });

  const saveLocal = () => {
    const ollamaHost = normalizeOllamaHost(host);
    setAi({ ...ai, provider: 'ollama-local', ollamaHost, ollamaLocalModel: localModel });
    setHost(ollamaHost);
    setStatus({ ok: true, text: `Готово, считает ${localModel} на твоём компьютере.` });
  };

  const disconnect = () =>
    Alert.alert('Отключить калории по фото?', 'Настройки и ключи нейросети удалятся с этого телефона.', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Отключить',
        style: 'destructive',
        onPress: () => {
          setAi(null);
          setKeyInput('');
          setStatus(null);
        },
      },
    ]);

  return (
    <Card>
      <Text style={font.label}>Калории по фото</Text>
      {isAiReady(ai) ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
          <Text style={[font.body, { flex: 1 }]}>
            Сейчас считает: <Text style={{ fontWeight: '700' }}>{PROVIDER_NAMES[ai.provider]}</Text> · {activeModel(ai)}
          </Text>
        </View>
      ) : (
        <Text style={font.small}>Выбери, какая нейросеть будет считать калории по фото:</Text>
      )}

      {PROVIDERS.map((p) => (
        <Option key={p.key} title={PROVIDER_NAMES[p.key]} hint={p.hint} icon={p.icon} selected={provider === p.key} onPress={() => choose(p.key)} />
      ))}

      {provider === 'ollama-cloud' ? (
        <>
          <Steps
            items={[
              { text: 'Зарегистрируйся на ollama.com, это бесплатно.' },
              { text: 'В настройках аккаунта открой раздел Keys, создай ключ и скопируй его.' },
              { text: 'Вставь ключ ниже и нажми «Проверить и сохранить».' },
            ]}
          />
          <Button title="Открыть ollama.com" variant="secondary" icon="open-outline" onPress={() => Linking.openURL(LINKS.ollamaKeys)} />
          <KeyField value={keyInput} onChangeText={setKeyInput} saved={savedKey} placeholder="Ключ Ollama" />
          <Field
            label="Модель (должна понимать фото)"
            value={cloudModel}
            onChangeText={setCloudModel}
            placeholder={DEFAULT_CLOUD_MODEL}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Action busy={busy} title="Проверить и сохранить" disabled={!key} onPress={saveCloud} />
          <Note text="У бесплатного тарифа есть лимит. Если он закончится, можно считать через Ollama на компьютере." />
        </>
      ) : null}

      {provider === 'ollama-local' ? (
        <>
          <Steps
            items={[
              { text: 'На компьютере скачай модель, которая понимает фото:', code: 'ollama pull gemma4' },
              {
                text: 'Открой Ollama для Wi-Fi: в настройках Ollama включи «Expose Ollama to the network». Если такого переключателя нет, задай переменную окружения и перезапусти Ollama:',
                code: 'OLLAMA_HOST=0.0.0.0:11434',
              },
              { text: 'Узнай адрес компьютера в сети (на Windows команда ipconfig, строка IPv4) и введи его ниже.' },
            ]}
          />
          <Button title="Как открыть Ollama для Wi-Fi" variant="secondary" icon="open-outline" onPress={() => Linking.openURL(LINKS.ollamaNetwork)} />
          <Field
            label="Адрес компьютера"
            value={host}
            onChangeText={(v) => {
              setHost(v);
              setModels(null);
            }}
            placeholder="192.168.1.5"
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Action busy={busy} title="Найти модели" variant="secondary" disabled={!host.trim()} onPress={findModels} />
          {models?.length ? (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                {models.map((m) => (
                  <Chip key={m.name} label={m.name} active={localModel === m.name} onPress={() => setLocalModel(m.name)} />
                ))}
              </View>
              <Button title="Сохранить" icon="checkmark" onPress={saveLocal} disabled={!localModel || busy} />
            </>
          ) : null}
          <Note text="Работает, только когда компьютер включён и телефон в той же Wi-Fi сети. Если Windows спросит про брандмауэр, разреши Ollama доступ. Модель gemma4 весит несколько гигабайт, для слабого компьютера есть gemma4:e2b поменьше." />
        </>
      ) : null}

      {provider === 'claude' ? (
        <>
          <Steps
            items={[
              { text: 'Открой Claude Console (кнопка ниже) и зарегистрируйся.' },
              { text: 'В разделе Billing пополни баланс, например на $5. Одно фото стоит примерно 1–3 цента.' },
              { text: 'В разделе API Keys нажми Create Key, скопируй ключ и вставь его ниже.' },
            ]}
          />
          <Button title="Открыть Claude Console" variant="secondary" icon="open-outline" onPress={() => Linking.openURL(LINKS.claudeKeys)} />
          <KeyField value={keyInput} onChangeText={setKeyInput} saved={savedKey} placeholder="sk-ant-…" />
          <Action busy={busy} title="Проверить и сохранить" disabled={key.length < 20} onPress={saveClaude} />
        </>
      ) : null}

      {status ? <Text style={[font.small, { color: status.ok ? colors.accent : colors.orange }]}>{status.text}</Text> : null}
      <Note text="Настройки и ключи хранятся только на этом телефоне." />
      {ai ? <Button title="Отключить калории по фото" variant="danger" onPress={disconnect} /> : null}
    </Card>
  );
}

function Steps({ items }: { items: { text: string; code?: string }[] }) {
  return (
    <>
      {items.map((step, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: space.md }}>
          <Text style={[font.body, { color: colors.accent, fontWeight: '800', width: 16 }]}>{i + 1}</Text>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={font.body}>{step.text}</Text>
            {step.code ? (
              <Text selectable style={{ fontFamily: 'monospace', color: colors.text, backgroundColor: colors.cardAlt, padding: space.sm, borderRadius: 8 }}>
                {step.code}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
    </>
  );
}

function KeyField({ value, onChangeText, saved, placeholder }: { value: string; onChangeText: (v: string) => void; saved?: string; placeholder: string }) {
  return (
    <Field
      label="Ключ"
      value={value}
      onChangeText={onChangeText}
      placeholder={saved ? `сохранён …${saved.slice(-4)}` : placeholder}
      secureTextEntry
      autoCapitalize="none"
      autoCorrect={false}
    />
  );
}

function Action({
  busy,
  title,
  disabled,
  onPress,
  variant,
}: {
  busy: boolean;
  title: string;
  disabled?: boolean;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
}) {
  if (busy) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, alignSelf: 'center', paddingVertical: space.sm }}>
        <ActivityIndicator color={colors.accent} />
        <Text style={font.body}>Проверяю…</Text>
      </View>
    );
  }
  return <Button title={title} variant={variant} onPress={onPress} disabled={disabled} />;
}

function Note({ text }: { text: string }) {
  return <Text style={[font.small, { fontSize: 12 }]}>{text}</Text>;
}
