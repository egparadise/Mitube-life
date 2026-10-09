import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { readableText } from '@/utils/color';

interface AvatarProps {
  title: string;
  color: string;
  thumbnail?: string;
  size?: number;
}

/**
 * 채널 썸네일.
 * 색상 원 + 첫 글자를 항상 밑에 깔고, 썸네일 이미지를 그 위에 덮는다.
 * 이미지가 로딩 중이거나 실패(구글 이미지 서버 제한 등)해도 빈칸 대신 이니셜이 보인다.
 */
export function Avatar({ title, color, thumbnail, size = 44 }: AvatarProps) {
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const radius = size / 2;
  // Array.from 으로 자르면 이모지(서로게이트 쌍)로 시작하는 제목도 깨지지 않는다.
  const initial = (Array.from(title.trim())[0] ?? '?').toUpperCase();
  const showImage = !!thumbnail && failedUri !== thumbnail;

  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: radius, backgroundColor: color },
      ]}>
      {/* 노랑·연두처럼 밝은 색 위에서는 흰 글자가 안 보이므로 대비가 큰 색을 고른다. */}
      <Text style={[styles.initial, { fontSize: size * 0.42, color: readableText(color) }]}>
        {initial}
      </Text>
      {showImage && (
        <Image
          source={{ uri: thumbnail }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={150}
          onError={() => setFailedUri(thumbnail ?? null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initial: {
    fontWeight: '700',
  },
});
