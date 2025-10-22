import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export const ErrorFallback = ({ error, resetError }) => (
  <View style={styles.container}>
    <Text style={styles.title}>Bir şeyler ters gitti</Text>
    <Text style={styles.message}>{error?.message || 'Beklenmeyen bir hata oluştu.'}</Text>
    <TouchableOpacity style={styles.button} onPress={resetError}>
      <Text style={styles.buttonText}>Tekrar Dene</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc'
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center'
  },
  message: {
    fontSize: 14,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center'
  },
  button: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600'
  }
});

export default ErrorFallback;
