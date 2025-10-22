import React, { useRef, useEffect } from 'react';
import { View, Animated, Dimensions, StyleSheet, Image, Easing } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');
const LOGO_WIDTH = Math.round(screenWidth / 3);
const LOGO_HEIGHT = Math.round((LOGO_WIDTH / 712) * 380);
const LOGO_COUNT = Math.ceil(screenWidth / LOGO_WIDTH) + 2;
const TOTAL_WIDTH = LOGO_WIDTH * LOGO_COUNT;

const AnimatedLogoBanner = ({ logoSource }) => {
  const translateX1 = useRef(new Animated.Value(0)).current;
  const translateX2 = useRef(new Animated.Value(-TOTAL_WIDTH)).current; // Ortadaki satır soldan başlasın
  const translateX3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Üst ve alt satır: sola (-)
    Animated.loop(
      Animated.timing(translateX1, {
        toValue: -TOTAL_WIDTH,
        duration: 30000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    Animated.loop(
      Animated.timing(translateX3, {
        toValue: -TOTAL_WIDTH,
        duration: 29000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();

    // Orta satır: sağa (+), -TOTAL_WIDTH'tan başla, 0'a gel
    Animated.loop(
      Animated.timing(translateX2, {
        toValue: 0,
        duration: 27500,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const renderRow = (translateX, key) => (
    <Animated.View
      key={key}
      style={[
        styles.row,
        { transform: [{ translateX }] },
      ]}
    >
      {Array.from({ length: LOGO_COUNT * 2 }).map((_, idx) => (
        <Image
          key={idx}
          source={logoSource}
          style={styles.logo}
          resizeMode="contain"
        />
      ))}
    </Animated.View>
  );

  return (
    <View style={styles.bannerContainer}>
      {renderRow(translateX1, 'row1')}
      {renderRow(translateX2, 'row2')}
      {renderRow(translateX3, 'row3')}
    </View>
  );
};

const styles = StyleSheet.create({
  bannerContainer: {
    width: '100%',
    height: LOGO_HEIGHT * 3,
    backgroundColor: '#f6fbfd',
    overflow: 'hidden',
    zIndex: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    height: LOGO_HEIGHT,
    width: LOGO_WIDTH * LOGO_COUNT * 2,
  },
  logo: {
    width: LOGO_WIDTH,
    height: LOGO_HEIGHT,
  },
});

export default AnimatedLogoBanner;
