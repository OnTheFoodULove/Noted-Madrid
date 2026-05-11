import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors, Radius, Spacing, Fonts } from '../theme';

// error — string message shown below the field; also turns the border red
export default function InputBox({ label, icon, error, ...props }) {
  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}>
        {icon && <Text style={styles.inputIcon}>{icon}</Text>}
        <TextInput
          style={styles.input}
          placeholderTextColor={Colors.subtext}
          {...props}
        />
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: 13, color: Colors.text, ...Fonts.semiBold, marginBottom: Spacing.xs },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: Radius.md,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  inputWrapperError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  inputIcon: { fontSize: 16, marginRight: Spacing.sm },
  input: { flex: 1, height: 50, fontSize: 15, color: Colors.text },
  errorText: { fontSize: 12, color: Colors.danger, marginTop: 4, marginLeft: 2 },
});
