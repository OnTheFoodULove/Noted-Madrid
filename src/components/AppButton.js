import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Radius, Spacing, Fonts, Shadow, Gradients } from '../theme';

export default function AppButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity
      style={[styles.button, (loading || disabled) && styles.buttonDisabled, style]}
      onPress={onPress}
      disabled={loading || disabled}
      activeOpacity={0.85}
    >
      <LinearGradient colors={Gradients.primary} style={styles.buttonGradient}>
        {loading ? (
          <ActivityIndicator color={Colors.white} />
        ) : (
          <Text style={styles.buttonText}>{title}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.sm, ...Shadow.button },
  buttonDisabled: { opacity: 0.6 },
  buttonGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: Colors.white, fontSize: 16, ...Fonts.semiBold },
});
