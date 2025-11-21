import React, { useEffect, memo, useRef, useState } from 'react';
import { Animated, ViewStyle, StyleProp, EasingFunction, Easing, View, LayoutChangeEvent, Dimensions, InteractionManager } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export type AnimationType =
    | 'fadeIn'
    | 'scaleIn'
    | 'slideInBottom'
    | 'slideInRight'
    | 'slideInLeft'
    | 'slideInTop'
    | 'bounceIn'
    | 'flipInX'
    | 'zoomInRotate'
    | 'rotateIn';

interface AnimatedViewProps {
    children?: React.ReactNode;
    animation: AnimationType;
    duration?: number;
    delay?: number;
    easing?: EasingFunction;
    style?: StyleProp<ViewStyle>;
    className?: string;
    playOnlyOnce?: boolean;
    triggerOnVisible?: boolean;
    visibilityThreshold?: number;
}

const propsAreEqual = (prevProps: AnimatedViewProps, nextProps: AnimatedViewProps) => {
    if (__DEV__) {
        return false;
    }

    if (prevProps.animation !== nextProps.animation ||
        prevProps.duration !== nextProps.duration ||
        prevProps.delay !== nextProps.delay ||
        prevProps.easing !== nextProps.easing) {
        return false;
    }

    if (prevProps.children !== nextProps.children) {
        return false;
    }

    if (prevProps.style !== nextProps.style) {
        return false;
    }

    if (prevProps.className !== nextProps.className) {
        return false;
    }

    return true;
};

function AnimatedViewComponent({
    children,
    animation,
    duration = 300,
    delay = 0,
    easing = Easing.bezier(0.4, 0, 0.2, 1),
    style,
    className,
    playOnlyOnce = false,
    triggerOnVisible = false,
    visibilityThreshold = 30,
}: AnimatedViewProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const isFocused = useIsFocused();
    const hasAnimatedOnce = useRef(false);
    const viewRef = useRef<View>(null);
    const [isVisible, setIsVisible] = useState(false);
    const { height: windowHeight } = Dimensions.get('window');
    const measureInterval = useRef<NodeJS.Timeout | null>(null);
    const isFirstRender = useRef(true);

    useEffect(() => {
        if (!triggerOnVisible) {
            setIsVisible(true);
            return;
        }

        if (isFirstRender.current) {
            isFirstRender.current = false;

            InteractionManager.runAfterInteractions(() => {
                setTimeout(() => {
                    checkVisibility();
                }, 0);
            });
        }

        return () => {
            if (measureInterval.current) {
                clearInterval(measureInterval.current);
            }
        };
    }, [triggerOnVisible]);

    const checkVisibility = () => {
        if (!viewRef.current || hasAnimatedOnce.current) return;

        if (measureInterval.current) {
            clearInterval(measureInterval.current);
            measureInterval.current = null;
        }

        measureInterval.current = setInterval(() => {
            if (!viewRef.current || hasAnimatedOnce.current) {
                if (measureInterval.current) {
                    clearInterval(measureInterval.current);
                }
                return;
            }

            viewRef.current.measure((x, y, width, height, pageX, pageY) => {
                const isElementVisible =
                    (pageY >= 0 && pageY <= windowHeight - visibilityThreshold) ||
                    (pageY + height >= visibilityThreshold && pageY + height <= windowHeight) ||
                    (pageY < 0 && pageY + height > windowHeight);

                if (isElementVisible) {
                    setIsVisible(true);
                    if (measureInterval.current) {
                        clearInterval(measureInterval.current);
                        measureInterval.current = null;
                    }
                }
            });
        }, 0);
    };

    const handleLayout = (e: LayoutChangeEvent) => {
        if (!triggerOnVisible || hasAnimatedOnce.current) return;

        if (!isVisible && !measureInterval.current) {
            checkVisibility();
        }
    };

    useEffect(() => {
        if (!isFocused || !isVisible) return;

        if (playOnlyOnce && hasAnimatedOnce.current) return;

        const animationId = Date.now();
        const currentAnimationId = animationId;

        animatedValue.setValue(0);

        Animated.timing(animatedValue, {
            toValue: 1,
            duration,
            delay,
            easing,
            useNativeDriver: true
        }).start(({ finished }) => {
            if (finished && currentAnimationId === animationId) {
                hasAnimatedOnce.current = true;
            }
        });

        return () => {};
    }, [isFocused, isVisible, playOnlyOnce]);

    const getAnimationStyle = (): any => {
        const baseStyle: ViewStyle = {};

        switch (animation) {
            case 'fadeIn':
                return {
                    opacity: animatedValue
                };

            case 'scaleIn':
                return {
                    opacity: animatedValue,
                    transform: [{
                        scale: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.95, 1]
                        })
                    }]
                };

            case 'slideInBottom':
                return {
                    opacity: animatedValue,
                    transform: [{
                        translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [50, 0]
                        })
                    }]
                };

            case 'slideInRight':
                return {
                    opacity: animatedValue,
                    transform: [{
                        translateX: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [100, 0]
                        })
                    }]
                };

            case 'slideInLeft':
                return {
                    opacity: animatedValue,
                    transform: [{
                        translateX: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 0]
                        })
                    }]
                };

            case 'slideInTop':
                return {
                    opacity: animatedValue,
                    transform: [{
                        translateY: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-100, 0]
                        })
                    }]
                };

            case 'bounceIn':
                return {
                    opacity: animatedValue,
                    transform: [{
                        scale: animatedValue.interpolate({
                            inputRange: [0, 0.6, 0.8, 1],
                            outputRange: [0.3, 1.1, 0.9, 1]
                        })
                    }]
                };

            case 'flipInX':
                return {
                    opacity: animatedValue,
                    transform: [{
                        rotateX: animatedValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['90deg', '0deg']
                        })
                    }]
                };

            case 'zoomInRotate':
                return {
                    transform: [
                        {
                            rotate: animatedValue.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['-45deg', '0deg']
                            })
                        }
                    ]
                };

            case 'rotateIn':
                return {
                    transform: [{
                        rotate: animatedValue.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ['0deg', '50deg', '0deg']
                        })
                    }]
                };

            default:
                return baseStyle;
        }
    };

    const initialHiddenStyle: ViewStyle = triggerOnVisible && !isVisible ? {
        opacity: 0
    } : {};

    return (
        <View
            ref={viewRef}
            className={className}
            style={[style, initialHiddenStyle]}
            onLayout={handleLayout}
            collapsable={false}
        >
            <Animated.View
                style={[getAnimationStyle(), style]}
                className={className}
            >
                {children}
            </Animated.View>
        </View>
    );
}

export default memo(AnimatedViewComponent, propsAreEqual);
