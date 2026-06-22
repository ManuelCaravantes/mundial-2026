import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { COLORS } from '../constants/theme';

interface Props {
  short?: string;
}

export default function LiveBadge({ short }: Props) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.3, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse]);

  const label =
    short === 'PAUSED' ? 'Descanso' :
    short === 'EXTRA_TIME' ? 'Prórroga' :
    short === 'PENALTY_SHOOTOUT' ? 'Penales' :
    'EN VIVO';

  return (
    <View style={styles.row}>
      <Animated.View style={[styles.dot, { opacity: pulse }]} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: COLORS.live },
  text: { fontSize: 11, fontWeight: '700', color: COLORS.live, letterSpacing: 0.5 },
});
