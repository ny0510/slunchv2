import React from 'react';
import type {WidgetTaskHandlerProps} from 'react-native-android-widget';

import {TimetableSingleWidget} from '@/widgets/TimetableWidget';

const nameToWidget = {
  TimetableSingle: TimetableSingleWidget,
};

const widgetTaskHandler = async (props: WidgetTaskHandlerProps) => {
  console.log(`[WidgetTaskHandler] Received widget action: ${props.widgetAction}`);
  const widgetInfo = props.widgetInfo;
  const Widget = nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

  switch (props.widgetAction) {
    case 'WIDGET_RESIZED':
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
      console.log(`[WidgetTaskHandler] ${widgetInfo.widgetName}`);
      props.renderWidget(<Widget />);
      break;

    case 'WIDGET_DELETED':
      console.log(`[WidgetTaskHandler] Widget deleted: ${widgetInfo.widgetName}`);
      // Not needed for now
      break;

    case 'WIDGET_CLICK':
      console.log(`[WidgetTaskHandler] Widget clicked: ${widgetInfo.widgetName}`);
      // Not needed for now
      break;

    default:
      break;
  }
};

export default widgetTaskHandler;
