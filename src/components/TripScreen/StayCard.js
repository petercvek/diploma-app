// @flow
import React from 'react';
import { TouchableOpacity, View, Dimensions } from 'react-native';
import styled from '@emotion/native';
import moment from 'moment';

import { colors } from 'config/styles';

type Props = {
  selected: boolean,
  selectedDate: Date,
  stay: Stay,
  onPress: Function,
  onLongPress: Function,
};

const Screen = Dimensions.get('window');

const StayCard = (props: Props) => {
  return (
    <TouchableOpacity onPress={props.onPress} onLongPress={props.onLongPress} activeOpacity={0.7}>
      <Wrapper selected={props.selected}>
        <View>
          <Title>Stay</Title>
          {moment(props.selectedDate).dayOfYear() === moment(props.stay.checkIn).dayOfYear() && (
            <Duration>Check in: {moment(props.stay.checkIn).format('H:MM')}</Duration>
          )}
          {moment(props.selectedDate).dayOfYear() === moment(props.stay.checkOut).dayOfYear() && (
            <Duration>Check out: {moment(props.stay.checkOut).format('H:MM')}</Duration>
          )}
          {props.stay.price ? <Label>Price: {props.stay.price}€</Label> : null}
          {props.stay.notes && props.stay.notes.length > 0 && (
            <Label>Notes: {props.stay.notes}</Label>
          )}
        </View>
        <IconWrapper>
          <Icon source={require('assets/add_icons/add_stay.png')} />
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

const Duration = styled.Text({
  fontSize: 13,
  fontFamily: 'Montserrat-SemiBold',
  color: colors.BLACK,
  paddingBottom: 3,
});

const Label = styled.Text({
  fontSize: 13,
  fontFamily: 'Montserrat-Medium',
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

export default StayCard;
