// @flow
import React from 'react';
import { TouchableOpacity, View, Dimensions } from 'react-native';
import styled from '@emotion/native';
import moment from 'moment';

import { colors } from 'config/styles';

import activityCategories from 'helpers/activityCategories';

type Props = {
  activity: Activity,
  onPress: Function,
  onLongPress: Function,
};

const Screen = Dimensions.get('window');

const ActivityCard = (props: Props) => {
  if (!activityCategories[props.activity.category]) return null;
  const { label, color, backgroundColor, icon } = activityCategories[props.activity.category];
  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress} activeOpacity={0.7}>
      <Wrapper backgroundColor={backgroundColor} selected={props.selected} color={color}>
        <View>
          <Title color={color}>{props.activity.name}</Title>
          <Category color={color}>{label}</Category>
          <Duration color={color}>
            {moment(props.activity.startAt).format('HH:MM')}
            {' - '}
            {moment(props.activity.endAt).format('HH:MM')}
          </Duration>
        </View>
        <IconWrapper color={color}>
          <Icon source={icon} />
        </IconWrapper>
      </Wrapper>
    </TouchableOpacity>
  );
};

const Wrapper = styled.View(({ backgroundColor, selected, color }) => ({
  backgroundColor: backgroundColor || colors.WHITE,
  padding: 10,
  borderRadius: 10,
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  flexDirection: 'row',
  width: Screen.width - 30,
  marginBottom: 10,
  borderColor: selected ? color : 'transparent',
  borderWidth: selected ? 2 : 2,
}));

const Title = styled.Text(({ color }) => ({
  fontSize: 17,
  fontFamily: 'Montserrat-Bold',
  color: color || colors.BLACK,
  paddingBottom: 3,
}));

const Category = styled.Text(({ color }) => ({
  fontSize: 13,
  fontFamily: 'Montserrat-SemiBold',
  color: color || colors.BLACK,
  paddingBottom: 3,
}));

const Duration = styled.Text(({ color }) => ({
  fontSize: 13,
  fontFamily: 'Montserrat-SemiBold',
  color: color || colors.BLACK,
  paddingBottom: 3,
}));

const IconWrapper = styled.View(({ color }) => ({
  backgroundColor: `${color}30`,
  borderRadius: 10,
}));

const Icon = styled.Image({
  width: 34,
  height: 34,
  margin: 10,
});

export default ActivityCard;
