export interface Theme {
  colors: Colors;
  typography: Typography;
  fontWeights: FontWeights;
}

export interface Colors {
  white: string;
  background: string;
  highlight: string;
  highlightLight: string;
  card: string;
  primaryText: string;
  secondaryText: string;
  border: string;
}

interface FontStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
}

export interface Typography {
  title: FontStyle;
  subtitle: FontStyle;
  body: FontStyle;
  caption: FontStyle;
  small: FontStyle;
}

export interface FontWeights {
  thin: string;
  extraLight: string;
  light: string;
  regular: string;
  medium: string;
  semiBold: string;
  bold: string;
  extraBold: string;
  black: string;
}
