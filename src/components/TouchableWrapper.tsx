import React from 'react';
import {TouchableOpacity, TouchableOpacityProps} from 'react-native';

interface TouchableWrapperProps extends TouchableOpacityProps {
  children: React.ReactNode;
}

const TouchableWrapper = ({children, delayPressIn = 0, hitSlop = {top: 8, bottom: 8, left: 8, right: 8}, activeOpacity = 0.7, ...props}: TouchableWrapperProps) => {
  return (
    <TouchableOpacity delayPressIn={delayPressIn} hitSlop={hitSlop} activeOpacity={activeOpacity} {...props}>
      {children}
    </TouchableOpacity>
  );
};

export default TouchableWrapper;
