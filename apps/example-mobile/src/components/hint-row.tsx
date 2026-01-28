import React from 'react';
import { StyleSheet, View } from 'react-native';

import { Spacing } from '#constants/theme.js';

import { ThemedText } from './themed-text.js';
import { ThemedView } from './themed-view.js';

type HintRowProps = {
  title?: string;
  hint?: string;
};

export function HintRow({
  title = 'Try editing',
  hint = 'app/index.tsx',
}: HintRowProps) {
  return (
    <View style={styles.stepRow}>
      <ThemedText type="small">{title}</ThemedText>
      <ThemedView type="backgroundSelected" style={styles.codeSnippet}>
        <ThemedText themeColor="textSecondary" type="code">
          {hint}
        </ThemedText>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  codeSnippet: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
});
