import { View } from 'react-native';
import Header from '@/components/Header';
import React from 'react';
import Switch from '@/components/Switch';

export default function SwitchScreen() {
    return (
        <>
            <Header showBackButton />
            <View className='flex-1 p-6 pt-[120px] bg-background'>
                <View 
                style={{
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.07,
                    shadowRadius: 3.84,
                    elevation: 5,
                }}
                className='rounded-3xl bg-secondary'>
                    <Switch
                        label='Enable GPS'
                        description='Know your directions'
                        icon='compass'
                        className='border-b border-border'
                    />
                    <Switch
                        label='Rest mode'
                        description='Enable do not disturb mode'
                        icon='coffee'
                        className='border-b border-border'
                    />
                    <Switch
                        label='Time tracking'
                        description='Track your time'
                        icon='clock'
                        className='border-b border-border'
                    />
                    <Switch
                        label='Auto activity'
                        description='Automatically track your activity'
                        icon='activity'
                    />
                </View>
            </View>
        </>
    );
}





