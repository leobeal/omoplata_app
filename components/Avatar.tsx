import { router } from 'expo-router';
import React from 'react';
import { Image, Pressable, View, ViewStyle, ImageSourcePropType } from 'react-native';

import ThemedText from './ThemedText';

type AvatarProps = {
  size?: 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl';
  src?: string | ImageSourcePropType;
  name?: string;
  border?: boolean;
  bgColor?: string;
  onPress?: () => void;
  link?: string;
  className?: string;
  style?: ViewStyle;
};

const Avatar: React.FC<AvatarProps> = ({
  size = 'md',
  src,
  name,
  border = false,
  bgColor = 'bg-secondary',
  onPress,
  link,
  className,
  style,
}) => {
  const sizeMap = {
    xxs: 'w-7 h-7',
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20',
    xxl: 'w-24 h-24',
  };

  const borderStyle = border ? 'border-2 border-border' : '';

  const renderInitials = () => {
    if (!name) return null;
    const initials = name
      .split(' ')
      .filter((part) => part.length > 0)
      .map((part) => part[0].toUpperCase())
      .join('');
    return <ThemedText className="text-center font-medium">{initials}</ThemedText>;
  };

  const getImageSource = (): ImageSourcePropType => {
    if (!src) {
      return {
        uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      };
    }

    if (typeof src === 'string') {
      return { uri: src };
    }

    return src;
  };

  const avatarContent = (
    <View
      className={`flex-shrink-0 rounded-full ${bgColor} ${sizeMap[size]} ${borderStyle} items-center justify-center ${className}`}
      style={style}>
      {src ? (
        <Image source={getImageSource()} className="h-full w-full rounded-full object-cover" />
      ) : (
        renderInitials()
      )}
    </View>
  );

  if (link) {
    return <Pressable onPress={() => router.push(link)}>{avatarContent}</Pressable>;
  }

  return onPress ? <Pressable onPress={onPress}>{avatarContent}</Pressable> : avatarContent;
};

export default Avatar;
