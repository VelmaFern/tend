import React, { useEffect, useState } from 'react';
import { View, Text, Animated, StyleSheet, Pressable } from 'react-native';
import { COLORS, FONTS } from '../theme/colors';

const Orb = React.forwardRef(({
  initial,
  name,
  size = 80,
  urgency = 'mid', // urgent, warm, mid, cool
  isPulsing = false,
  onPress,
  onLongPress,
  theme = 'sunday',
  opacity = 1,
  showBadge = false,
  taskCategory = null,
}, ref) => {
  const colors = COLORS[theme];
  const [pulseAnim] = useState(new Animated.Value(0));
  const [floatAnim] = useState(new Animated.Value(0));

  const urgencyMap = {
    urgent: { base: colors.orbUrgent, light: colors.orbUrgentLight },
    warm: { base: colors.orbUrgent, light: colors.orbUrgentLight },
    mid: { base: colors.orbMid, light: colors.orbMidLight },
    cool: { base: colors.orbTended, light: colors.orbTendedLight },
  };

  const baseColor = urgencyMap[urgency].base;
  const lightColor = urgencyMap[urgency].light;

  // Pulse animation
  useEffect(() => {
    if (isPulsing) {
      const pulse1 = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ])
      );
      pulse1.start();
      return () => pulse1.stop();
    }
  }, [isPulsing, pulseAnim]);

  // Float animation
  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 6000 + Math.random() * 6000,
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 6000 + Math.random() * 6000,
          useNativeDriver: true,
        }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [floatAnim]);

  const floatTranslate = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  return (
    <Animated.View
      ref={ref}
      style={[
        styles.container,
        {
          transform: [{ translateY: floatTranslate }],
          opacity,
        },
      ]}
    >
      <Pressable onPress={onPress} onLongPress={onLongPress} delayLongPress={500}>
        {/* Pulse rings */}
        {isPulsing && (
          <>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  width: size + 40,
                  height: size + 40,
                  borderRadius: (size + 40) / 2,
                  borderColor: colors.accentGold,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  width: size + 20,
                  height: size + 20,
                  borderRadius: (size + 20) / 2,
                  borderColor: colors.accentGold,
                  opacity: 0.6,
                  transform: [{ scale: pulseScale }],
                },
              ]}
            />
          </>
        )}

        {/* Main orb */}
        <View
          style={[
            styles.orb,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: baseColor,
              shadowColor: baseColor,
              shadowOpacity: 0.5,
              shadowRadius: 12,
              shadowOffset: { width: 0, height: 8 },
            },
          ]}
        >
          {/* Shine highlight */}
          <View
            style={[
              styles.shine,
              {
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: size * 0.175,
                backgroundColor: lightColor,
                opacity: 0.6,
              },
            ]}
          />

          {/* Rim shadow */}
          <View
            style={[
              styles.rimShadow,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 2,
                borderColor: `${baseColor}40`,
              },
            ]}
          />

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.initial, { fontSize: size * 0.4, color: '#FFFFFF' }]}>
              {initial || '?'}
            </Text>
            {name && (
              <Text
                style={[
                  styles.name,
                  {
                    fontSize: size * 0.14,
                    color: '#FFFFFF',
                    maxWidth: size * 0.85,
                  },
                ]}
                numberOfLines={1}
              >
                {name}
              </Text>
            )}
            {taskCategory && (
              <Text
                style={[
                  styles.category,
                  {
                    fontSize: size * 0.1,
                    color: '#FFFFFF',
                  },
                ]}
              >
                {taskCategory}
              </Text>
            )}
          </View>

          {/* Badge */}
          {showBadge && (
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: '#4ADE80',
                },
              ]}
            >
              <Text style={styles.badgeText}>✓</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orb: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shine: {
    position: 'absolute',
    top: '20%',
    left: '25%',
    borderRadius: 999,
  },
  rimShadow: {
    position: 'absolute',
    bottom: 0,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  initial: {
    fontFamily: FONTS.dmSans,
    fontWeight: '700',
  },
  name: {
    fontFamily: FONTS.dmSans,
    fontWeight: '500',
    marginTop: 2,
  },
  category: {
    fontFamily: FONTS.dmSans,
    fontWeight: '400',
    marginTop: 1,
    opacity: 0.8,
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 2,
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default Orb;
