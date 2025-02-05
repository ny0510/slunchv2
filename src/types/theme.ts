export interface Theme {
  colors: Colors;
  typography: Typography;
}

export interface Colors {
  white: string;
  background: string;
  highlight: string;
  card: string;
  primaryText: string;
  secondaryText: string;
  border: string;
}

interface FontStyle {
  fontSize: number;
  fontFamily: string;
}

export interface Typography {
  title: FontStyle;
  subtitle: FontStyle;
  body: FontStyle;
  caption: FontStyle;
  small: FontStyle;
}
