// @flow
import React from 'react';
import { Fragment } from 'react';
import { TouchableOpacity, View, Dimensions } from 'react-native';
import styled from '@emotion/native';
import moment from 'moment';

import { colors } from 'config/styles';

import travelCategories from 'helpers/travelCategories';

type Props = {
  selected: boolean,
  navigation: Navigation,
  onPress: Function,
  onLongPress: Function,
};

const Screen = Dimensions.get('window');

const NavigationCard = (props: Props) => {
  if (!travelCategories[props.navigation.type]) return null;
  const { label, icon } = travelCategories[props.navigation.type];

  const duration = props.navigation.duration
    ? moment.duration(props.navigation.duration, 'seconds')
    : null;

  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress} activeOpacity={0.7}>
      <Wrapper selected={props.selected}>
        <View>
          <Title>Travel</Title>
          <Category>By {label}</Category>
          <Duration>
            {moment(props.navigation.startAt).format('HH:MM')}
            {props.navigation.type !== 'flying' && (
              <Fragment>
                {' - '}
                {duration && duration.hours() > 0 && `${duration.hours()}hr `}
                {duration && duration.minutes() > 0 && `${duration.minutes()}min`}
                {' - '}
                {(props.navigation.distance / 1000).toFixed(1)}km
              </Fragment>
            )}
          </Duration>
        </View>
        <IconWrapper>
          <Icon source={icon} />
        </IconWrapper>
      </Wrapper>
    </TouchableOpacity>
  );
};

const Wrapper = styled.View(({ selected }) => ({
  backgroundColor: '#F5F5F5',
  padding: 10,
  borderRadius: 10,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexDirection: 'row',
  width: Screen.width - 30,
  marginBottom: 10,
  borderColor: selected ? colors.BLACK : 'transparent',
  borderWidth: selected ? 2 : 2,
}));

const Title = styled.Text({
  fontSize: 17,
  fontFamily: 'Montserrat-Bold',
  color: colors.BLACK,
  paddingBottom: 3,
});

const Category = styled.Text({
  fontSize: 13,
  fontFamily: 'Montserrat-SemiBold',
  color: colors.BLACK,
  paddingBottom: 3,
});

const Duration = styled.Text({
  fontSize: 13,
  fontFamily: 'Montserrat-SemiBold',
  color: colors.BLACK,
  paddingBottom: 3,
});

const IconWrapper = styled.View({
  borderRadius: 10,
});

const Icon = styled.Image({
  width: 34,
  height: 34,
  margin: 10,
});

export default NavigationCard;
