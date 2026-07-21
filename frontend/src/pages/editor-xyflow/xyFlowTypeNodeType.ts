import type { ComponentType } from 'react';
import TimeLayout_0 from './widget/time-layout_0';
import TimeLayout_1 from './widget/time-layout_1';
import TimeLayout_2 from './widget/time-layout_2';
import TimeLayout_3 from './widget/time-layout_3';
import TimeLayout_4 from './widget/time-layout_4';
import TimeLayout_5 from './widget/time-layout_5';
import TimeLayout_6 from './widget/time-layout_6';
import pureimageLayout_0 from './widget/pureimage-layout_0';
import quotationLayout_0 from './widget/quotation-layout_0';
import calendarLayout_0 from './widget/calendar-layout_0';
import calendarLayout_1 from './widget/calendar-layout_1';
import calendarLayout_2 from './widget/calendar-layout_2';
import countdownLayout_0 from './widget/countdown-layout_0';
import launcherLayout_0 from './widget/launcher-layout_0';
import launcherLayout_1 from './widget/launcher-layout_1';
import launcherLayout_5 from './widget/launcher-layout_5';
import launcherLayout_6 from './widget/launcher-layout_6';
import launcherLayout_7 from './widget/launcher-layout_7';
import launcherLayout_8 from './widget/launcher-layout_8';
import launcherLayout_9 from './widget/launcher-layout_9';
import dynamicLayout_0 from './widget/dynamic-layout_0';
import batteryLayout_0 from './widget/battery-layout_0';
import batteryLayout_1 from './widget/battery-layout_1';
import batteryLayout_2 from './widget/battery-layout_2';
import DigitalLayout_0 from './widget/digital-layout_0';
import WeatherLayout_0 from './widget/weather-layout_0';
import WeatherLayout_1 from './widget/weather-layout_1';
import WeatherLayout_2 from './widget/weather-layout_2';
import ClockLayout_0 from './widget/clock-layout_0';
import ClockLayout_1 from './widget/clock-layout_1';
import MusicLayout_0 from './widget/music-layout_0';
import TimeMixBatteryLayout_0 from './widget/timemixbattery-layout_0';
import TimeMixCalendarMixBatteryLayout_0 from './widget/timemixcalendarmixbattery-layout_0';
import TimeMixCalendarMixBatteryLayout_1 from './widget/timemixcalendarmixbattery-layout_1';
import ClockMixBatteryLayout_0 from './widget/clockmixbattery-layout_0';
import Icon from './icon';
import PlatformGroupNode from './components/PlatformGroupNode';
import Wallpaper from './wallpaper/wallpaper';

/** 不含 preview，避免与 icon/preview 循环依赖 */
export const xyFlowTypeNodeType: Record<string, ComponentType<any>> = {
  platform_group: PlatformGroupNode,
  time_0: TimeLayout_0,
  time_1: TimeLayout_1,
  time_2: TimeLayout_2,
  time_3: TimeLayout_3,
  time_4: TimeLayout_4,
  time_5: TimeLayout_5,
  time_6: TimeLayout_6,
  pureimage_0: pureimageLayout_0,
  quotation_0: quotationLayout_0,
  calendar_0: calendarLayout_0,
  calendar_1: calendarLayout_1,
  calendar_2: calendarLayout_2,
  countdown_0: countdownLayout_0,
  launcher_0: launcherLayout_0,
  launcher_1: launcherLayout_1,
  launcher_5: launcherLayout_5,
  launcher_6: launcherLayout_6,
  launcher_7: launcherLayout_7,
  launcher_8: launcherLayout_8,
  launcher_9: launcherLayout_9,
  dynamic_0: dynamicLayout_0,
  battery_0: batteryLayout_0,
  battery_1: batteryLayout_1,
  battery_2: batteryLayout_2,
  digital_0: DigitalLayout_0,
  weather_0: WeatherLayout_0,
  weather_1: WeatherLayout_1,
  weather_2: WeatherLayout_2,
  clock_0: ClockLayout_0,
  clock_1: ClockLayout_1,
  music_0: MusicLayout_0,
  timemixbattery_0: TimeMixBatteryLayout_0,
  timemixcalendarmixbattery_0: TimeMixCalendarMixBatteryLayout_0,
  timemixcalendarmixbattery_1: TimeMixCalendarMixBatteryLayout_1,
  clockmixbattery_0: ClockMixBatteryLayout_0,
  icon: Icon,
  wallpaper: Wallpaper,
};
