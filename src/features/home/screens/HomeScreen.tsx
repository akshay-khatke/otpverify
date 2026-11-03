import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components';
import { Colors } from '../../../constants';
import { useAuth } from '../../../context';
import { maskIdentifier, useResponsive } from '../../../utils';

export const HomeScreen: React.FC = () => {
  const { phoneNumber, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const { isSmallDevice, isTablet, isLandscape, contentMaxWidth, horizontalPadding } =
    useResponsive();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <ScrollView
      style={styles.scrollRoot}
      contentContainerStyle={[
        styles.scrollContainer,
        {
          paddingTop: Math.max(insets.top + 20, 32),
          paddingBottom: Math.max(insets.bottom + 20, 32),
          paddingHorizontal: horizontalPadding,
        },
      ]}
      showsVerticalScrollIndicator={false}>
      <View
        style={[
          styles.card,
          { maxWidth: contentMaxWidth },
          isTablet && styles.cardTablet,
        ]}>
        <Text
          style={[
            styles.icon,
            isSmallDevice && styles.iconSmall,
            isLandscape && styles.iconLandscape,
          ]}>
          🎉
        </Text>
        <Text
          style={[
            styles.title,
            isSmallDevice && styles.titleSmall,
            isTablet && styles.titleTablet,
          ]}>
          Welcome!
        </Text>

        {/* Masked Identifier Display */}
        <View style={styles.phoneBadge}>
          <Text style={styles.phoneLabel}>Logged in as:</Text>
          <Text
            style={[
              styles.phoneValue,
              isSmallDevice && styles.phoneValueSmall,
            ]}>
            {maskIdentifier(phoneNumber || '9876543736')}
          </Text>
        </View>

        <Text
          style={[
            styles.subtitle,
            isSmallDevice && styles.subtitleSmall,
            isLandscape && styles.subtitleLandscape,
          ]}>
          You have successfully verified your OTP and logged in.
        </Text>

        <Button
          title="Logout"
          onPress={handleLogout}
          style={[styles.button, isTablet && styles.buttonTablet]}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollRoot: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '100%',
    alignItems: 'center',
  },
  cardTablet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 48,
    paddingHorizontal: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  icon: {
    fontSize: 56,
    marginBottom: 12,
  },
  iconSmall: {
    fontSize: 44,
    marginBottom: 8,
  },
  iconLandscape: {
    fontSize: 40,
    marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  titleSmall: {
    fontSize: 24,
  },
  titleTablet: {
    fontSize: 34,
    marginBottom: 10,
  },
  phoneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F2FF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#B6D7FF',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  phoneLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 6,
  },
  phoneValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  phoneValueSmall: {
    fontSize: 14,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
    maxWidth: 360,
  },
  subtitleSmall: {
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  subtitleLandscape: {
    marginBottom: 16,
  },
  button: {
    minWidth: 160,
    alignSelf: 'center',
  },
  buttonTablet: {
    minWidth: 220,
  },
});
