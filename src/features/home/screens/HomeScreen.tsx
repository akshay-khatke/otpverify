import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { useAuth } from '../../../context';

export const HomeScreen: React.FC = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome!</Text>
      <Text style={styles.subtitle}>
        You have successfully verified your OTP and logged in.
      </Text>

      <Button
        title="Logout"
        onPress={handleLogout}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  icon: {
    fontSize: 56,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  button: {
    minWidth: 160,
  },
});
