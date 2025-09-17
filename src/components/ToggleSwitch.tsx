import React from 'react';
import {Switch} from 'react-native-switch';

import {useTheme} from '@/contexts/ThemeContext';

interface ToggleSwitchProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({value, onValueChange, disabled = false}) => {
  const {theme} = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      circleSize={22}
      barHeight={24}
      circleBorderWidth={2}
      circleBorderActiveColor={theme.highlight}
      circleBorderInactiveColor={theme.border}
      backgroundActive={theme.highlight}
      backgroundInactive={theme.border}
      circleActiveColor={'#fff'}
      circleInActiveColor={'#fff'}
      renderActiveText={false}
      renderInActiveText={false}
      switchLeftPx={2}
      switchRightPx={2}
      switchWidthMultiplier={2.2}
    />
  );
};

export default ToggleSwitch;
