import { addMonths, differenceInMonths, getDay, isSameDay } from 'date-fns';
import React from 'react';
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  ScrollView,
  ScrollViewProps,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import type { DatePickerProps } from '../..';
import { generateDateRangeSplitByMonth } from '../../utils/generateDateRange';
import DatePickerItem, { DatePickerItemProps } from '../DatePickerItem';
import { ITEM_WIDTH } from '../DatePickerItem/styles';
import { doesDateHaveSlots } from '../WeekView';
import styles, { darkStyles, lightStyles } from './styles';

const MAX_MONTHS_TO_SHOW_BEFORE_LOADING_MORE = 4;

const MonthViewRaw: React.FC<
  {
    minDate: Exclude<DatePickerProps['minDate'], undefined>;
    maxDate: Exclude<DatePickerProps['maxDate'], undefined>;
    selectedDate: DatePickerProps['selectedDate'];
    onPressDate: DatePickerItemProps['onPressDate'];
    setScrollToTopTrigger: (trigger: () => void) => void;
    markedDates?: DatePickerProps['markedDates'];
    allowsPastDates: DatePickerProps['allowsPastDates'];
    disabledDates: DatePickerProps['disabledDates'];
    locale: DatePickerProps['locale'];
  } & ScrollViewProps
> = ({
  minDate,
  maxDate,
  onPressDate,
  setScrollToTopTrigger,
  style,
  selectedDate,
  markedDates,
  allowsPastDates,
  disabledDates,
  locale,
  ...props
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);
  const theme = useColorScheme();

  const maxDateIsMoreThanMaxMonthsAway =
    differenceInMonths(minDate, maxDate) >
    MAX_MONTHS_TO_SHOW_BEFORE_LOADING_MORE;

  const initialmaxDate = maxDateIsMoreThanMaxMonthsAway
    ? addMonths(minDate, MAX_MONTHS_TO_SHOW_BEFORE_LOADING_MORE)
    : maxDate;

  const [datesToDisplay, setDatesToDisplay] = React.useState(
    generateDateRangeSplitByMonth({
      startDate: minDate,
      endDate: initialmaxDate,
      allowsPastDates,
      disabledDates,
    })
  );

  const isCloseToBottom = ({
    layoutMeasurement,
    contentOffset,
    contentSize,
  }: NativeScrollEvent) => {
    const paddingToBottom = Dimensions.get('window').height / 3;
    return (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    );
  };

  const scrollToTop = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  React.useEffect(() => {
    setScrollToTopTrigger(scrollToTop);
  }, [setScrollToTopTrigger]);

  const allDatesToDisplay = React.useMemo(() => {
    return generateDateRangeSplitByMonth({
      startDate: minDate,
      endDate: maxDate,
      allowsPastDates,
      disabledDates,
    });
  }, [minDate, maxDate, allowsPastDates, disabledDates]);

  const hasLoadedAll = datesToDisplay.length === allDatesToDisplay.length;

  const colorStyles = theme === 'light' ? lightStyles : darkStyles;

  return (
    <Animated.View style={style}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollViewContentContainer}
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            if (!hasLoadedAll) {
              setDatesToDisplay(allDatesToDisplay);
            }
          }
        }}
        scrollEventThrottle={400}
        {...props}
      >
        {datesToDisplay.map((datesInMonth) => {
          const monthNameLowercase = datesInMonth[0].date.toLocaleString(
            locale,
            { month: 'short' }
          );
          const monthName =
            monthNameLowercase.charAt(0).toUpperCase() +
            monthNameLowercase.slice(1);
          const firstDayOfMonthAsWeekDay = getDay(datesInMonth[0].date); // 0 Sunday, 1 Monday, ... 6 Saturday
          let initialLeftMargin = Math.floor(
            (Dimensions.get('window').width / 7) *
              (firstDayOfMonthAsWeekDay)
          );

          // if (firstDayOfMonthAsWeekDay === 0) {
          //   // If the first day of the month is Sunday, we must treat it as "7"..
          //   initialLeftMargin = Math.floor(
          //     (Dimensions.get('window').width / 7) * 6
          //   );
          // }

          const MONTH_VIEW_ITEM_WIDTH = Math.floor(ITEM_WIDTH);

          return (
            <View
              key={datesInMonth[0].date.toISOString()}
              style={styles.monthContainer}
            >
              <Text style={{ marginLeft: initialLeftMargin + 12 }}>
                {monthName}
              </Text>
              <View style={styles.monthDaysContainer}>
                {datesInMonth.map((date, index) => {
                  return (
                    <DatePickerItem
                      key={date.date.toString()}
                      date={date.date}
                      hasSlots={doesDateHaveSlots(date.date, markedDates)}
                      isSelected={isSameDay(date.date, selectedDate)}
                      onPressDate={onPressDate}
                      style={[
                        styles.datePickerItem,
                        colorStyles.datePickerItem,
                        // eslint-disable-next-line react-native/no-inline-styles
                        {
                          marginLeft: index === 0 ? initialLeftMargin : 0,
                        },
                      ]}
                      itemWidth={MONTH_VIEW_ITEM_WIDTH}
                      isDisabled={date.isDisabled}
                    />
                  );
                })}
              </View>
            </View>
          );
        })}
        {!hasLoadedAll ? (
          <ActivityIndicator style={styles.loadMoreIndicator} />
        ) : null}
      </ScrollView>
    </Animated.View>
  );
};

export default MonthViewRaw;
