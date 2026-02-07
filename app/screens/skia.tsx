import {
    Canvas,
    Path,
    LinearGradient,
    vec,
    Circle,
    Skia,
    RadialGradient,
    Line,
} from '@shopify/react-native-skia';
import { View, Text, useWindowDimensions, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    useSharedValue,
    useDerivedValue,
    runOnJS,
    withTiming,
    withSpring,
    useAnimatedStyle,
    Easing,
} from 'react-native-reanimated';
import { useState, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import { BlurView } from 'expo-blur';
import { LinearGradient as RNLinearGradient } from 'expo-linear-gradient';

// Sample data for different years
const DATA_2025 = [
    { label: 'Jan', value: 40 },
    { label: 'Feb', value: 65 },
    { label: 'Mar', value: 45 },
    { label: 'Apr', value: 60 },
    { label: 'May', value: 50 },
    { label: 'Jun', value: 70 },
    { label: 'Jul', value: 50 },
    { label: 'Aug', value: 85 },
    { label: 'Sep', value: 60 },
    { label: 'Oct', value: 75 },
    { label: 'Nov', value: 75 },
    { label: 'Dec', value: 50 },
];

const DATA_2026 = [
    { label: 'Jan', value: 55 },
    { label: 'Feb', value: 45 },
    { label: 'Mar', value: 70 },
    { label: 'Apr', value: 80 },
    { label: 'May', value: 65 },
    { label: 'Jun', value: 55 },
    { label: 'Jul', value: 90 },
    { label: 'Aug', value: 70 },
    { label: 'Sep', value: 85 },
    { label: 'Oct', value: 60 },
    { label: 'Nov', value: 95 },
    { label: 'Dec', value: 80 },
];

const LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CHART_HEIGHT = 220;
const TOOLTIP_WIDTH = 105;
const TOOLTIP_HEIGHT = 75;

export default function SkiaScreen() {
    const { width: screenWidth } = useWindowDimensions();
    const chartWidth = screenWidth;

    const [selectedYear, setSelectedYear] = useState<2025 | 2026>(2025);
    const [tooltipData, setTooltipData] = useState<{ label: string; value: number } | null>(null);

    // Get current data based on year
    const currentData = selectedYear === 2025 ? DATA_2025 : DATA_2026;

    // Animation values
    const touchX = useSharedValue(-1);
    const isActive = useSharedValue(false);
    const smoothX = useSharedValue(0);
    const smoothY = useSharedValue(0);
    const glowOpacity = useSharedValue(0);
    const tooltipScale = useSharedValue(0);

    // Animated Y values for each data point (for smooth chart transitions)
    const animatedYs = [
        useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
        useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
        useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0),
    ];

    // Calculate chart dimensions - use global min/max for consistent scaling
    const graphWidth = chartWidth;
    const graphHeight = CHART_HEIGHT;
    const allValues = [...DATA_2025.map(d => d.value), ...DATA_2026.map(d => d.value)];
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    const stepX = graphWidth / (LABELS.length - 1);
    const verticalPadding = 30;

    const getY = (value: number) => {
        const normalized = (value - minValue) / (maxValue - minValue);
        return verticalPadding + (graphHeight - verticalPadding * 2) * (1 - normalized);
    };

    const getX = (index: number) => index * stepX;

    // Update animated Y values when year changes
    useEffect(() => {
        const data = selectedYear === 2025 ? DATA_2025 : DATA_2026;
        data.forEach((point, i) => {
            animatedYs[i].value = withTiming(getY(point.value), { duration: 400, easing: Easing.out(Easing.cubic) });
        });
    }, [selectedYear]);

    // Initialize Y values
    useEffect(() => {
        DATA_2025.forEach((point, i) => {
            animatedYs[i].value = getY(point.value);
        });
    }, []);

    // Pre-calculate X positions (these don't change)
    const pointXs = LABELS.map((_, i) => getX(i));

    // Animated path for the line
    const animatedLinePath = useDerivedValue(() => {
        const path = Skia.Path.Make();
        const points = animatedYs.map((y, i) => ({ x: pointXs[i], y: y.value }));

        if (points.length < 2) return path;
        path.moveTo(points[0].x, points[0].y);

        const tension = 0.3;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - (p1.x - p0.x) * tension;
            const cp2y = p1.y;
            path.cubicTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }
        return path;
    });

    // Animated path for the area fill
    const animatedAreaPath = useDerivedValue(() => {
        const path = Skia.Path.Make();
        const points = animatedYs.map((y, i) => ({ x: pointXs[i], y: y.value }));

        if (points.length < 2) return path;
        path.moveTo(points[0].x, points[0].y);

        const tension = 0.3;
        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[i];
            const p1 = points[i + 1];
            const cp1x = p0.x + (p1.x - p0.x) * tension;
            const cp1y = p0.y;
            const cp2x = p1.x - (p1.x - p0.x) * tension;
            const cp2y = p1.y;
            path.cubicTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
        }
        path.lineTo(chartWidth, CHART_HEIGHT);
        path.lineTo(0, CHART_HEIGHT);
        path.close();
        return path;
    });

    const getNearestIndex = (x: number) => {
        'worklet';
        let nearestIdx = 0;
        let minDist = Math.abs(x - pointXs[0]);
        for (let i = 1; i < pointXs.length; i++) {
            const dist = Math.abs(x - pointXs[i]);
            if (dist < minDist) {
                minDist = dist;
                nearestIdx = i;
            }
        }
        return nearestIdx;
    };

    // Animate to nearest data point
    useDerivedValue(() => {
        'worklet';
        if (isActive.value && touchX.value >= 0) {
            const idx = getNearestIndex(touchX.value);
            const targetX = pointXs[idx];
            const targetY = animatedYs[idx].value;
            smoothX.value = withTiming(targetX, { duration: 200, easing: Easing.out(Easing.cubic) });
            smoothY.value = withTiming(targetY, { duration: 200, easing: Easing.out(Easing.cubic) });
        }
    });

    const tooltipOpacity = useDerivedValue(() => {
        'worklet';
        return withTiming(isActive.value ? 1 : 0, { duration: 150 });
    });

    // Tooltip position for React Native overlay (with trailing spring effect)
    const tooltipLeft = useDerivedValue(() => {
        'worklet';
        let x = smoothX.value - TOOLTIP_WIDTH / 2;
        x = Math.max(8, Math.min(x, chartWidth - TOOLTIP_WIDTH - 8));
        return withSpring(x, { damping: 90, stiffness: 600 });
    });

    const tooltipTop = useDerivedValue(() => {
        'worklet';
        const y = Math.max(8, smoothY.value - TOOLTIP_HEIGHT - 20);
        return withSpring(y, { damping: 90, stiffness: 600 });
    });

    const indicatorScale = useDerivedValue(() => {
        'worklet';
        return withSpring(isActive.value ? 1 : 0, { damping: 90, stiffness: 600 });
    });

    // Callbacks
    const updateTooltip = useCallback((index: number) => {
        const data = selectedYear === 2025 ? DATA_2025 : DATA_2026;
        setTooltipData(data[index]);
    }, [selectedYear]);

    const clearTooltip = useCallback(() => {
        setTooltipData(null);
    }, []);

    // Gesture handler
    const gesture = Gesture.Pan()
        .onBegin((e) => {
            'worklet';
            isActive.value = true;
            const clampedX = Math.max(0, Math.min(e.x, chartWidth));
            touchX.value = clampedX;
            const idx = getNearestIndex(clampedX);
            smoothX.value = pointXs[idx];
            smoothY.value = animatedYs[idx].value;
            glowOpacity.value = withTiming(1, { duration: 200 });
            tooltipScale.value = withSpring(1, { damping: 90, stiffness: 600 });
            runOnJS(updateTooltip)(idx);
        })
        .onUpdate((e) => {
            'worklet';
            const clampedX = Math.max(0, Math.min(e.x, chartWidth));
            touchX.value = clampedX;
            const idx = getNearestIndex(clampedX);
            runOnJS(updateTooltip)(idx);
        })
        .onEnd(() => {
            'worklet';
            isActive.value = false;
            touchX.value = -1;
            glowOpacity.value = withTiming(0, { duration: 200 });
            tooltipScale.value = withTiming(0, { duration: 150, easing: Easing.in(Easing.cubic) });
            runOnJS(clearTooltip)();
        });

    // Animated styles for tooltip
    const tooltipAnimatedStyle = useAnimatedStyle(() => ({
        position: 'absolute' as const,
        left: tooltipLeft.value,
        top: tooltipTop.value,
        width: TOOLTIP_WIDTH,
        height: TOOLTIP_HEIGHT,
        opacity: tooltipOpacity.value,
        transform: [
            { scale: tooltipScale.value },
        ],
    }));

    // Animated line points
    const lineP1 = useDerivedValue(() => {
        'worklet';
        return vec(smoothX.value, 0);
    });
    const lineP2 = useDerivedValue(() => {
        'worklet';
        return vec(smoothX.value, CHART_HEIGHT);
    });

    return (
        <View className="flex-1 bg-background">
            <Header showBackButton />
            <View className="px-6 pt-10 pb-2">
                <View className="flex-row items-center justify-between">
                    <Text className="text-4xl font-bold text-text">Analytics</Text>
                    <View className="flex-row bg-secondary rounded-full p-1">
                        <Pressable
                            onPress={() => setSelectedYear(2025)}
                            className={`px-4 py-2 rounded-full ${selectedYear === 2025 ? 'bg-background' : ''}`}
                        >
                            <Text className={`text-sm font-medium ${selectedYear === 2025 ? 'text-text' : 'text-text opacity-50'}`}>
                                2025
                            </Text>
                        </Pressable>
                        <Pressable
                            onPress={() => setSelectedYear(2026)}
                            className={`px-4 py-2 rounded-full ${selectedYear === 2026 ? 'bg-background' : ''}`}
                        >
                            <Text className={`text-sm font-medium ${selectedYear === 2026 ? 'text-text' : 'text-text opacity-50'}`}>
                                2026
                            </Text>
                        </Pressable>
                    </View>
                </View>
                <Text className="text-text opacity-50">Monthly performance</Text>
            </View>

            {/* Chart with tooltip overlay */}
            <View className="mt-0" style={{ position: 'relative' }}>
                <GestureDetector gesture={gesture}>
                    <View>
                        <Canvas style={{ width: chartWidth, height: CHART_HEIGHT }}>
                            {/* Gradient fill under curve */}
                            <Path path={animatedAreaPath}>
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(0, CHART_HEIGHT)}
                                    colors={['rgba(251, 191, 114, 0.2)', 'rgba(249, 168, 85, 0.08)', 'rgba(110, 231, 183, 0.04)', 'transparent']}
                                />
                            </Path>

                            {/* Gradient line */}
                            <Path
                                path={animatedLinePath}
                                style="stroke"
                                strokeWidth={3}
                                strokeCap="round"
                                strokeJoin="round"
                            >
                                <LinearGradient
                                    start={vec(0, 0)}
                                    end={vec(chartWidth, 0)}
                                    colors={['#FBBF72', '#F9A855', '#6EE7B7', '#34D399']}
                                />
                            </Path>

                            {/* Vertical indicator line */}
                            <Line
                                p1={lineP1}
                                p2={lineP2}
                                color="rgba(255,255,255,0.1)"
                                strokeWidth={1}
                                opacity={tooltipOpacity}
                            />

                            {/* Glow effect */}
                            <Circle
                                cx={smoothX}
                                cy={smoothY}
                                r={useDerivedValue(() => 30 * indicatorScale.value)}
                                opacity={useDerivedValue(() => glowOpacity.value * 0.4)}
                            >
                                <RadialGradient
                                    c={vec(0, 0)}
                                    r={30}
                                    colors={['rgba(251, 191, 114, 0.8)', 'rgba(251, 191, 114, 0)']}
                                />
                            </Circle>

                            {/* Indicator dot */}
                            <Circle
                                cx={smoothX}
                                cy={smoothY}
                                r={useDerivedValue(() => 12 * indicatorScale.value)}
                                color="rgba(251, 191, 114, 0.3)"
                                opacity={tooltipOpacity}
                            />
                            <Circle
                                cx={smoothX}
                                cy={smoothY}
                                r={useDerivedValue(() => 8 * indicatorScale.value)}
                                color="#FFF8E7"
                                opacity={tooltipOpacity}
                            />
                            <Circle
                                cx={smoothX}
                                cy={smoothY}
                                r={useDerivedValue(() => 5 * indicatorScale.value)}
                                color="#FBBF72"
                                opacity={tooltipOpacity}
                            />
                        </Canvas>

                        {/* Blur Tooltip Overlay */}
                        <Animated.View style={tooltipAnimatedStyle} pointerEvents="none">
                            <BlurView
                                intensity={30}
                                tint="dark"
                                style={{
                                    flex: 1,
                                    borderRadius: 20,
                                    overflow: 'hidden',
                                }}
                            >
                                <RNLinearGradient
                                    colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
                                    style={{
                                        flex: 1,
                                        padding: 10,
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        borderRadius: 20,
                                        borderWidth: 1,
                                        borderColor: 'rgba(255,255,255,0.2)',
                                    }}
                                >
                                    <Text className="text-text text-xl font-bold">
                                        ${tooltipData?.value ?? 0}k
                                    </Text>
                                    <Text className="text-text text-sm">
                                        {tooltipData?.label ?? ''}
                                    </Text>
                                </RNLinearGradient>
                            </BlurView>
                        </Animated.View>
                    </View>
                </GestureDetector>

                {/* X-axis labels */}
                <View className="flex-row justify-between mt-3 px-2">
                    {LABELS.filter((_, i) => i % 3 === 0).map((label, index) => (
                        <Text key={index} className="text-xs text-text opacity-30">
                            {label}
                        </Text>
                    ))}
                </View>
            </View>

            {/* Stats cards */}
            <View className="flex-row px-6 mt-8 gap-1">
                <View className="flex-1 bg-secondary rounded-2xl p-4">
                    <Text className="text-text opacity-50 text-sm">Highest</Text>
                    <Text className="text-text text-2xl font-bold mt-10">
                        ${Math.max(...currentData.map(d => d.value))}k
                    </Text>
                </View>
                <View className="flex-1 bg-secondary rounded-2xl p-4">
                    <Text className="text-text opacity-50 text-sm">Más bajito</Text>
                    <Text className="text-text text-2xl font-bold mt-10">
                        ${Math.min(...currentData.map(d => d.value))}k
                    </Text>
                </View>
                <View className="flex-1 bg-secondary rounded-2xl p-4">
                    <Text className="text-text opacity-50 text-sm">Average</Text>
                    <Text className="text-text text-2xl font-bold mt-10">
                        ${Math.round(currentData.reduce((a, b) => a + b.value, 0) / currentData.length)}k
                    </Text>
                </View>
            </View>
        </View>
    );
}
