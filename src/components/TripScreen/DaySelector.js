// @flow
import React from 'react';
import { ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import styled from '@emotion/native';
import Moment from 'moment';
import { extendMoment } from 'moment-range';

const moment = extendMoment(Moment);

import { colors } from 'config/styles';

type Props = {
  startingDate: Date,
  endingDate: Date,
  selectedDate: Date,
  onChange: Function,
};

const DaySelector = (props: Props) => {
  const Screen = Dimensions.get('window');
  let daysShown = 0;
  let wrapperWidth = (Screen.width - ((daysShown - 1) * 10 + 2 * 15)) / daysShown;
  do {
    daysShown++;
    wrapperWidth = (Screen.width - ((daysShown - 1) * 10 + 2 * 15)) / daysShown;
  } while (wrapperWidth > 60);

  let { startingDate, endingDate } = props;
  let durationInDays = moment(endingDate).diff(moment(startingDate), 'days');
  if (durationInDays < daysShown) endingDate = moment(startingDate).add(daysShown - 1, 'days');

  const dates = Array.from(moment.range(startingDate, endingDate).by('days'));

  return (
    <ScrollView
      horizontal
      bounces={dates.length !== daysShown}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        paddingLeft: 15,
        paddingRight: 5,
      }}
    >
      {dates.map((date, index) => {
        const selected = moment(date).isSame(props.selectedDate, 'day');

        const disabledDate = !moment(date).within(
          moment.range(props.startingDate, props.endingDate),
        );

        return (
          <TouchableOpacity
            key={date}
            onPress={() => props.onChange(date)}
            activeOpacity={0.7}
            disabled={disabledDate}
          >
            <DayWrapper selected={selected} width={wrapperWidth}>
              <DayOfWeek selected={selected} disabled={disabledDate}>
                {index + 1}
              </DayOfWeek>
              <DayOfTrip selected={selected} disabled={disabledDate}>
                {moment(date).format('ddd')}
              </DayOfTrip>
              <DayOfMonth selected={selected} disabled={disabledDate}>
                {moment(date).date()}
              </DayOfMonth>
            </DayWrapper>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

const DayWrapper = styled.View(({ selected, width, disabled }) => ({
  width,
  backgroundColor: selected ? colors.BLACK : colors.LIGHT_GREY4,
  marginRight: 10,
  paddingVertical: 10,
  borderRadius: 30,
  alignItems: 'center',
}));

const DayOfWeek = styled.Text(({ selected, disabled }) => ({
  fontSize: 16,
  fontFamily: 'Montserrat-ExtraBold',
  color: selected ? colors.WHITE : disabled ? colors.LIGHT_GREY5 : colors.BLACK,
  paddingBottom: 3,
}));

const DayOfTrip = styled.Text(({ selected, disabled }) => ({
  fontSize: 16,
  fontFamily: 'Montserrat-SemiBold',
  color: selected ? colors.WHITE : disabled ? colors.LIGHT_GREY5 : colors.BLACK,
  paddingBottom: 3,
}));

const DayOfMonth = styled.Text(({ selected, disabled }) => ({
  fontSize: 20,
  fontFamily: 'Montserrat-ExtraBold',
  color: selected ? colors.WHITE : disabled ? colors.LIGHT_GREY5 : colors.BLACK,
}));

export default DaySelector;
