import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Easing,
    StyleSheet,
    View
} from 'react-native';

const { width, height } = Dimensions.get('window');

const particlesData = [
  { id: 1, text: '🕒', size: 28, startX: width * 0.1, duration: 25000, delay: 0 },
  { id: 2, text: '📅', size: 24, startX: width * 0.8, duration: 28000, delay: 1000 },
  { id: 3, text: '✔️', size: 22, startX: width * 0.45, duration: 22000, delay: 2000 },
  { id: 4, text: '🕒', size: 20, startX: width * 0.7, duration: 32000, delay: 3000 },
  { id: 5, text: '📅', size: 22, startX: width * 0.25, duration: 30000, delay: 5000 },
  { id: 6, text: '✔️', size: 18, startX: width * 0.85, duration: 24000, delay: 4000 },
  { id: 7, text: '🏥', size: 26, startX: width * 0.55, duration: 34000, delay: 2500 },
  { id: 8, text: '👤', size: 20, startX: width * 0.05, duration: 26000, delay: 6000 },
];

const FloatingParticle = ({ text, size, startX, duration, delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(0);
      opacity.setValue(0);
      rotate.setValue(0);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: -height - 100,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.6,
            duration: 1500,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.15,
            duration: duration - 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(rotate, {
          toValue: 1,
          duration,
          delay,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.particle,
        {
          fontSize: size,
          left: startX,
          bottom: -80,
          opacity,
          transform: [{ translateY }, { rotate: rotateInterpolate }],
        },
      ]}
    >
      {text}
    </Animated.Text>
  );
};

const FloatingBubble = ({ size, color, startX, startY, duration, delay }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -40,
          duration,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(translateX, {
          toValue: 25,
          duration: duration * 1.4,
          delay,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: -25,
          duration: duration * 1.4,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.15,
          duration: duration * 1.2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.95,
          duration: duration * 1.2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          left: startX,
          top: startY,
          transform: [{ translateY }, { translateX }, { scale }],
        },
      ]}
    />
  );
};

const OrbitDot = ({ radius, duration, delay, size, color }) => {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration,
        delay,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const rotateInterpolate = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.orbitContainer,
        {
          width: radius * 2,
          height: radius * 2,
          left: width / 2 - radius,
          top: height / 2 - radius,
          transform: [{ rotate: rotateInterpolate }],
        },
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        }}
      />
    </Animated.View>
  );
};

export default function AnimatedBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.baseLayer} />
      <View style={styles.gradientTop} />
      <View style={styles.gradientBottom} />

      <FloatingBubble
        size={200}
        color="rgba(59, 130, 246, 0.10)"
        startX={-60}
        startY={-40}
        duration={3500}
        delay={0}
      />
      <FloatingBubble
        size={160}
        color="rgba(139, 92, 246, 0.08)"
        startX={width - 100}
        startY={120}
        duration={4200}
        delay={500}
      />
      <FloatingBubble
        size={140}
        color="rgba(34, 197, 94, 0.10)"
        startX={40}
        startY={height * 0.55}
        duration={3800}
        delay={800}
      />
      <FloatingBubble
        size={240}
        color="rgba(236, 72, 153, 0.07)"
        startX={width - 160}
        startY={height * 0.7}
        duration={4800}
        delay={300}
      />

      <OrbitDot
        radius={80}
        duration={9000}
        delay={0}
        size={10}
        color="rgba(37, 99, 235, 0.35)"
      />
      <OrbitDot
        radius={130}
        duration={14000}
        delay={500}
        size={8}
        color="rgba(139, 92, 246, 0.3)"
      />
      <OrbitDot
        radius={180}
        duration={18000}
        delay={1000}
        size={12}
        color="rgba(34, 197, 94, 0.28)"
      />

      {particlesData.map((p) => (
        <FloatingParticle
          key={p.id}
          text={p.text}
          size={p.size}
          startX={p.startX}
          duration={p.duration}
          delay={p.delay}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    backgroundColor: '#f0f9ff',
  },
  baseLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#f0f9ff',
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: 'rgba(219, 234, 254, 0.5)',
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    backgroundColor: 'rgba(224, 242, 254, 0.4)',
  },
  bubble: { position: 'absolute' },
  orbitContainer: {
    position: 'absolute',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  particle: { position: 'absolute' },
});