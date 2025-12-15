import React from 'react';
import { View, ViewStyle } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { useThemeColors } from '@/contexts/ThemeColors';

interface QRCodeDisplayProps {
  value: string;
  size?: number;
  backgroundColor?: string;
  color?: string;
  logo?: number; // require() image
  logoSize?: number;
  logoBackgroundColor?: string;
  style?: ViewStyle;
}

const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  value,
  size = 200,
  backgroundColor,
  color,
  logo,
  logoSize = 30,
  logoBackgroundColor = 'white',
  style,
}) => {
  const colors = useThemeColors();

  return (
    <View
      style={[
        {
          padding: 16,
          backgroundColor: backgroundColor || '#FFFFFF',
          borderRadius: 12,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
      ]}>
      <QRCode
        value={value}
        size={size}
        backgroundColor={backgroundColor || '#FFFFFF'}
        color={color || colors.text}
        logo={logo}
        logoSize={logoSize}
        logoBackgroundColor={logoBackgroundColor}
      />
    </View>
  );
};

export default QRCodeDisplay;
