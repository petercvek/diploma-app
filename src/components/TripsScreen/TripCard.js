// @flow
import React from 'react';
import { Dimensions, Animated, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import FastImage from 'react-native-fast-image';
import moment from 'moment';

import { colors } from 'config/styles';

const Screen = Dimensions.get('window');
const cardWidth = Screen.width - 40; // 2 * 20 padding on each side

type Props = {|
  trip: Trip,
  onPress: Function,
|};

const TripCard = (props: Props) => {
  const { trip, onPress } = props;

  const daysLeft = moment(trip.startAt).diff(moment(), 'days');

  return (
    <Wrapper finished={moment(trip.endAt).diff(moment(), 'days') < 0}>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        <Inner>
          <BackgroundImage
            source={
              trip.coverPhoto ? { uri: trip.coverPhoto } : require('assets/no_cover_photo.png')
            }
            resizeMode="cover"
            cache="force-cache"
            height={150}
          >
            {daysLeft > 0 && (
              <CountdownWrapper>
                <CountdownDays>{daysLeft}</CountdownDays>
                <CountdownText>Days</CountdownText>
              </CountdownWrapper>
            )}
          </BackgroundImage>

          <BottomContainerWrapper>
            <Title>{trip.name}</Title>
            <DateText>
              {moment(trip.startAt).format('D MMM')} - {moment(trip.endAt).format('D MMM')}
            </DateText>
          </BottomContainerWrapper>
        </Inner>
      </TouchableOpacity>
    </Wrapper>
  );
};

const Wrapper = styled(Animated.View)(({ finished }) => ({
  width: cardWidth,
  borderRadius: 15,
  shadowRadius: 20,
  shadowOpacity: 0.1,
  backgroundColor: colors.WHITE,
  shadowOffset: { height: 10 },
  elevation: 4,
  marginBottom: 24,
  opacity: finished ? 0.5 : 1,
}));

const Inner = styled.View({
  justifyContent: 'flex-end',
});

const BackgroundImage = styled(FastImage)(({ height }) => ({
  width: '100%',
  height,
  borderTopLeftRadius: 15,
  borderTopRightRadius: 15,
}));

// Bottom container

const BottomContainerWrapper = styled.View({
  width: '100%',
  backgroundColor: colors.WHITE,
  borderBottomLeftRadius: 15,
  borderBottomRightRadius: 15,
  paddingHorizontal: 15,
  paddingVertical: 10,
});

const Title = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  color: colors.TRUE_BLACK,
  fontSize: 20,
});

const CountdownWrapper = styled.View({
  height: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.1)',
});

const CountdownText = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  textAlign: 'center',
  color: colors.WHITE,
  fontSize: 14,
});

const CountdownDays = styled.Text({
  fontFamily: 'Montserrat-ExtraBold',
  textAlign: 'center',
  color: colors.WHITE,
  fontSize: 48,
  marginBottom: -10,
});

const DateText = styled.Text({
  fontFamily: 'Montserrat-Bold',
  color: colors.GREY2,
  fontSize: 13,
  paddingVertical: 3,
});

export default TripCard;
