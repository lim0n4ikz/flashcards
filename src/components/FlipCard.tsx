import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import { useApp } from '../context/AppContext';

type Props = {
  english: string;
  russian: string;
  frontLanguage?: 'english' | 'russian';
};

export default function FlipCard({
  english,
  russian,
  frontLanguage = 'english',
}: Props) {
  const { theme } = useApp();

  const [flipped, setFlipped] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setFlipped(false);
    animation.setValue(0);
  }, [animation, english, russian, frontLanguage]);

  const frontText =
    frontLanguage === 'english' ? english : russian;
  const backText =
    frontLanguage === 'english' ? russian : english;

  const flip = () => {
    const nextValue = flipped ? 0 : 1;

    setFlipped(!flipped);

    Animated.spring(animation, {
      toValue: nextValue,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
  };

  const frontRotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backRotate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <TouchableWithoutFeedback onPress={flip}>
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              transform: [{ rotateY: frontRotate }],
            },
          ]}
        >
          <Text
            style={[
              styles.word,
              { color: theme.text },
            ]}
          >
            {frontText}
          </Text>

          <Text
            style={[
              styles.hint,
              { color: theme.secondaryText },
            ]}
          >
            {frontLanguage === 'english'
              ? 'Нажми, чтобы увидеть перевод'
              : 'Нажми, чтобы увидеть слово'}
          </Text>
        </Animated.View>

        <Animated.View
          style={[
            styles.card,
            styles.back,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              transform: [{ rotateY: backRotate }],
            },
          ]}
        >
          <Text
            style={[
              styles.translation,
              { color: theme.primary },
            ]}
          >
            {backText}
          </Text>

          <Text
            style={[
              styles.hint,
              { color: theme.secondaryText },
            ]}
          >
            {frontLanguage === 'english'
              ? 'Нажми, чтобы вернуть слово'
              : 'Нажми, чтобы вернуть перевод'}
          </Text>
        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 300,
    width: '100%',
  },

  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderWidth: 1,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backfaceVisibility: 'hidden',
  },

  back: {
    position: 'absolute',
  },

  word: {
    fontSize: 38,
    fontWeight: '800',
    textAlign: 'center',
  },

  translation: {
    fontSize: 34,
    fontWeight: '800',
    textAlign: 'center',
  },

  hint: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 24,
  },
});