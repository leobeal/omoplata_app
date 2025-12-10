import React, {useEffect, useMemo, useRef} from "react";
import {Animated, Easing, StyleSheet, View} from "react-native";
import Svg, {Circle, G} from "react-native-svg";

import ThemedText from "./ThemedText";
import {useThemeColors} from "@/contexts/ThemeColors";

interface DonutSegment {
    label: string;
    value: number;
    color: string;
}

interface SmallDonutCardProps {
    title: string;
    subtitle?: string;
    segments: DonutSegment[];
    size?: number;
    centerValue?: string;
    centerLabel?: string;
    showLegend?: boolean;
    /** Animate the donut when segments change */
    animate?: boolean;
    /** Duration of the animation in ms */
    animationDuration?: number;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const SmallDonutCard: React.FC<SmallDonutCardProps> = ({
                                                                  title,
                                                                  subtitle,
                                                                  segments,
                                                                  size = 100,
                                                                  centerValue,
                                                                  centerLabel,
                                                                  showLegend = true,
                                                                  animate = true,
                                                                  animationDuration = 600,
                                                              }) => {
    const colors = useThemeColors();

    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    const total = useMemo(
        () => segments.reduce((sum, seg) => sum + seg.value, 0),
        [segments]
    );

    const segmentsWithOffsets = useMemo(() => {
        if (total <= 0) {
            return segments.map((segment) => ({
                ...segment,
                percentage: 0,
                strokeDasharray: 0,
                strokeDashoffset: 0,
            }));
        }

        let accumulatedPercentage = 0;

        return segments.map((segment) => {
            const percentage = (segment.value / total) * 100;
            const strokeDasharray = (percentage / 100) * circumference;
            const strokeDashoffset = -accumulatedPercentage * (circumference / 100);

            accumulatedPercentage += percentage;

            return {
                ...segment,
                percentage,
                strokeDasharray,
                strokeDashoffset,
            };
        });
    }, [segments, total, circumference]);

    // Animation progress: 0 -> 1
    const animationProgress = useRef(new Animated.Value(animate ? 0 : 1)).current;

    useEffect(() => {
        if (!animate) {
            animationProgress.setValue(1);
            return;
        }

        animationProgress.setValue(0);

        Animated.timing(animationProgress, {
            toValue: 1,
            duration: animationDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: false, // we're animating SVG props, not transforms
        }).start();
    }, [segments, animate, animationDuration, animationProgress]);

    return (
        <View className="min-w-0 rounded-lg bg-secondary p-3">
            <ThemedText className="text-xl font-bold">{title}</ThemedText>
            {subtitle && (
                <ThemedText className="mt-0.5 text-sm opacity-60">{subtitle}</ThemedText>
            )}

            {/* Donut Chart */}
            <View className="mt-3 items-center">
                <View
                    style={[styles.chartContainer, {width: size, height: size}]}
                    className="relative items-center justify-center"
                >
                    <Svg width={size} height={size}>
                        {/* Background circle */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke={colors.bg}
                            strokeWidth={strokeWidth}
                            fill="transparent"
                            opacity={0.2}
                        />

                        {/* Segments */}
                        <G transform={`rotate(-90 ${size / 2} ${size / 2})`}>
                            {segmentsWithOffsets.map((segment, index) => {
                                const animatedDasharray = animationProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [`0 ${circumference}`, `${segment.strokeDasharray} ${circumference}`],
                                });

                                const animatedDashoffset = animationProgress.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, segment.strokeDashoffset],
                                });

                                return (
                                    <AnimatedCircle
                                        key={`${segment.label}-${index}`}
                                        cx={size / 2}
                                        cy={size / 2}
                                        r={radius}
                                        stroke={segment.color}
                                        strokeWidth={strokeWidth}
                                        fill="transparent"
                                        strokeDasharray={animatedDasharray}
                                        strokeDashoffset={animatedDashoffset}
                                        strokeLinecap="round"
                                    />
                                );
                            })}
                        </G>
                    </Svg>

                    {/* Center text */}
                    <View className="absolute items-center">
                        {centerValue && (
                            <ThemedText className="text-lg font-bold">
                                {centerValue}
                            </ThemedText>
                        )}
                        {centerLabel && (
                            <ThemedText className="mt-0.5 text-xs opacity-60">
                                {centerLabel}
                            </ThemedText>
                        )}
                    </View>
                </View>
            </View>

            {/* Legend - horizontal at bottom */}
            {showLegend && segmentsWithOffsets.length > 0 && (
                <View className="mt-3 flex-row flex-wrap justify-center">
                    {segmentsWithOffsets.map((segment, index) => (
                        <View
                            key={`${segment.label}-legend-${index}`}
                            className="mx-2 mb-1 flex-row items-center"
                        >
                            <View
                                style={[
                                    styles.legendDot,
                                    {
                                        backgroundColor: segment.color,
                                    },
                                ]}
                            />
                            <ThemedText className="text-xs opacity-80">
                                {segment.label}
                            </ThemedText>
                        </View>
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    chartContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    legendDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
});
