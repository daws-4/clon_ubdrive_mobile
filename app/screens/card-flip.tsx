import Header from "@/components/Header";
import { View, Text, ScrollView, Pressable, ImageSourcePropType, FlatList, Image, useWindowDimensions } from "react-native";
import { shadowPresets } from "@/utils/useShadow";
import { LinearGradient } from "expo-linear-gradient";
import Feather from '@expo/vector-icons/Feather';
import Animated, { useAnimatedStyle, withSpring, interpolate, useSharedValue } from "react-native-reanimated";
import useThemeColors from '@/app/contexts/ThemeColors';
import { useState, useRef } from "react";
import AntDesign from '@expo/vector-icons/AntDesign';


export default function CardFlip() {
    return (
        <>
            <Header showBackButton />
            <View className="flex-1  bg-background">
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    className="flex-1 p-[24px]"
                >
                    <Card
                        title="Nike Air Max"
                        price="$100"
                        images={[
                            require('@/assets/img/shoe-2.jpg'),
                            require('@/assets/img/shoe-1.jpg'),
                            require('@/assets/img/shoe-5.jpg'),
                        ]}
                    />
                    <Card
                        title="Adidas Ultraboost"
                        price="$150"
                        images={[
                            require('@/assets/img/shoe-3.jpg'),
                            require('@/assets/img/shoe-1.jpg'),
                            require('@/assets/img/shoe-2.jpg'),
                        ]}
                    />
                </ScrollView>
            </View>
        </>
    );
}


const Card = ({ title, price, images }: { title: string, price: string, images: any[] }) => {
    const rotation = useSharedValue(0);
    const colors = useThemeColors();
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const flatListRef = useRef<FlatList>(null);
    const { width: windowWidth } = useWindowDimensions();
    const cardWidth = windowWidth - 48; // Account for padding (24px on each side)

    const flipCard = () => {
        rotation.value = withSpring(rotation.value === 0 ? 180 : 0, {
            damping: 100,
            stiffness: 600,
        });
    };

    const handleScroll = (event: any) => {
        const scrollPosition = event.nativeEvent.contentOffset.x;
        const index = Math.round(scrollPosition / cardWidth);
        setActiveImageIndex(index);
    };
    const frontAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(rotation.value, [0, 90, 180], [1, 0, 0]);
        return {
            transform: [{ perspective: 1000 }, { rotateY: `${rotation.value}deg` }],
            opacity
        };
    });

    const backAnimatedStyle = useAnimatedStyle(() => {
        const opacity = interpolate(rotation.value, [0, 90, 180], [0, 0, 1]);
        return {
            transform: [{ perspective: 1000 }, { rotateY: `${rotation.value - 180}deg` }],
            opacity,
        };
    });

    return (
        <View className="h-[450px] mb-6">
            {/** Front side */}
            <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, frontAnimatedStyle]}>
                <View className="bg-secondary rounded-[30px] h-full overflow-hidden" style={shadowPresets.large}>
                    <FlatList
                        ref={flatListRef}
                        data={images}
                        horizontal
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                        onScroll={handleScroll}
                        scrollEventThrottle={16}
                        renderItem={({ item }) => (
                            <View style={{ width: cardWidth }}>
                                <Image
                                    source={item as ImageSourcePropType}
                                    style={{ width: '100%', height: '100%' }}
                                    resizeMode="cover"
                                />
                            </View>
                        )}
                        keyExtractor={(_, index) => index.toString()}
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0, 0, 0, 0.2)']}
                        style={{ position: 'absolute', width: '100%', height: '100%' }}
                        pointerEvents="none"
                    >
                        <View className="w-full h-full justify-end items-start p-8">


                            <View className="flex-row items-center w-full justify-between gap-2 mb-auto ">
                                {/* Dot indicators */}
                                <View className="flex-row gap-1.5">
                                    {images.map((_, index) => (
                                        <View
                                            key={index}
                                            className="rounded-full"
                                            style={{
                                                width: 6,
                                                height: 6,
                                                backgroundColor: activeImageIndex === index ? 'white' : 'rgba(255, 255, 255, 0.4)',
                                            }}
                                        />
                                    ))}
                                </View>
                                <View className="flex-row items-center gap-2 ml-auto">
                                    <AntDesign name="star" size={16} color="white" />
                                    <Text className="text-white font-semibold text-lg">4.5</Text>
                                </View>
                            </View>

                            <Text className="text-white text-3xl font-bold">{title}</Text>
                            <Text className="text-white text-base">{price}</Text>
                            <Feather name="plus-circle" size={24} className="absolute bottom-8 right-8" color="white" />
                        </View>
                    </LinearGradient>

                    {/* Flip button - positioned absolutely in bottom area */}
                    <Pressable
                        onPress={flipCard}
                        style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            height: 150,
                        }}
                    />
                </View>
            </Animated.View>

            {/** Back side */}
            <Animated.View style={[{ position: 'absolute', width: '100%', height: '100%' }, backAnimatedStyle]}>
                <Pressable
                    onPress={flipCard}
                    className="bg-secondary rounded-[30px] h-full p-6"
                    style={shadowPresets.large}
                >
                    <View className="flex-row justify-between items-center mb-2">
                        <Text className="text-text text-3xl font-bold">{title}</Text>
                        <View className="flex-row items-center gap-4">
                            <Feather name="heart" size={22} color={colors.text} />
                            <Feather name="x" size={24} color={colors.text} />
                        </View>
                    </View>
                    <View className="flex-1 justify-center">
                        <View className="mb-8">
                            <Text className="text-text text-xl font-bold">{price}</Text>
                        </View>
                        <View className="mb-8">
                            <Text className="text-text text-sm uppercase opacity-50">Description</Text>
                            <Text className="text-text text-base">Premium quality sneakers with exceptional comfort and style.</Text>
                        </View>
                        <View className="mb-8">
                            <Text className="text-text text-sm uppercase opacity-50 mb-2">Sizes</Text>
                            <View className="flex-row gap-2">
                                {['7', '8', '9', '10', '11'].map((size) => (
                                    <View key={size} className="bg-background rounded-lg px-3 py-2">
                                        <Text className="text-text font-semibold">{size}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                        <View className="mb-8">
                            <Text className="text-text text-sm uppercase opacity-50 mb-2">Colors</Text>
                            <View className="flex-row gap-2">
                                <View className="bg-neutral-900 rounded-full w-6 h-6" />
                                <View className="bg-neutral-300 rounded-full w-6 h-6" />
                                <View className="bg-red-300 rounded-full w-6 h-6" />
                            </View>
                        </View>
                        <Pressable className="bg-text rounded-xl px-3 py-3 items-center justify-center mt-auto">
                            <Text className="text-invert text-base font-bold">Add to Cart</Text>
                        </Pressable>

                    </View>
                </Pressable>
            </Animated.View>
        </View>
    );
}

