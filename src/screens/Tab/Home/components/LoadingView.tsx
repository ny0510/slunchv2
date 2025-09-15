import React from 'react';
import {View} from 'react-native';

import Loading from '@/components/Loading';

import {styles as s} from '../styles';

interface LoadingViewProps {
  height: number;
}

const LoadingView = ({height}: LoadingViewProps) => (
  <View style={[s.loadingView, {height}]}>
    <Loading />
  </View>
);

export default LoadingView;