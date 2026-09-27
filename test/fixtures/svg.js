const React = require('react');
const { View } = require('react-native');

module.exports = React.forwardRef(({ children, ...props }, ref) => (
  <View ref={ref} {...props}>
    {children}
  </View>
));
