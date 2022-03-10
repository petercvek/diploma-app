// @flow
import { autobind } from 'core-decorators';
import React, { Component, Fragment } from 'react';
import {
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  TouchableHighlight,
  BackHandler,
  Platform,
} from 'react-native';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';

import { colors } from 'config/styles';

const Screen = Dimensions.get('window');

type Props = {
  componentId: string,
  parentComponentId: string,
  selectedDate: Date,
  trip: Trip,
  defaultCoordinates: [number, number],
};

@autobind
class AddOverlay extends Component<Props> {
  static options() {
    return {
      layout: {
        componentBackgroundColor: 'transparent',
      },
      statusBar: {
        drawBehind: true,
      },
      overlay: {
        handleKeyboardEvents: true,
      },
    };
  }

  startAnimation = new Animated.Value(0);

  componentDidMount() {
    Animated.spring(this.startAnimation, {
      toValue: 1,
      useNativeDriver: true,
    }).start();

    if (Platform.OS === 'android')
      BackHandler.addEventListener('hardwareBackPress', this.prepareToClose);
  }

  prepareToClose = async () => {
    await new Promise(resolve => {
      Animated.timing(this.startAnimation, {
        toValue: 0,
        useNativeDriver: true,
        duration: 200,
      }).start(resolve);
    });
    try {
      Navigation.dismissOverlay(this.props.componentId);
    } catch (e) {}
  };

  componentWillUnmount() {
    if (Platform.OS === 'android')
      BackHandler.removeEventListener('hardwareBackPress', this.prepareToClose);
  }

  addActivity = () => {
    this.prepareToClose();
    Navigation.push(this.props.parentComponentId, {
      component: {
        name: 'NewActivityScreen',
        passProps: {
          selectedDate: this.props.selectedDate,
          trip: this.props.trip,
          defaultCoordinates: this.props.defaultCoordinates,
        },
      },
    });
  };

  addStay = () => {
    this.prepareToClose();
    Navigation.push(this.props.parentComponentId, {
      component: {
        name: 'NewStayScreen',
        passProps: {
          selectedDate: this.props.selectedDate,
          trip: this.props.trip,
          defaultCoordinates: this.props.defaultCoordinates,
        },
      },
    });
  };

  addNavigation = () => {
    this.prepareToClose();
    Navigation.push(this.props.parentComponentId, {
      component: {
        name: 'NewNavigationScreen',
        passProps: {
          selectedDate: this.props.selectedDate,
          trip: this.props.trip,
          defaultCoordinates: this.props.defaultCoordinates,
        },
      },
    });
  };

  render() {
    const backgroundOpacity = this.startAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    const wrapperTranslate = this.startAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [300, -5],
    });

    return (
      <Fragment>
        <TouchableWithoutFeedback onPress={this.prepareToClose}>
          <Background style={{ opacity: backgroundOpacity }}>
            <Wrapper style={{ transform: [{ translateY: wrapperTranslate }] }}>
              <CardsWrapper>
                <Card
                  label={'Add Activity'}
                  description={'Do something out of the ordinary!'}
                  icon={require('assets/add_icons/add_activity.png')}
                  onPress={this.addActivity}
                />
                <Card
                  label={'Add Stay'}
                  description={"Get some rest at a hotel, apartment or friend's place!"}
                  icon={require('assets/add_icons/add_stay.png')}
                  onPress={this.addStay}
                />
                <Card
                  label={'Add Navigation'}
                  description={'Add route between two stops!'}
                  icon={require('assets/add_icons/add_navigation.png')}
                  onPress={this.addNavigation}
                />
              </CardsWrapper>

              <Row label={'Cancel'} color={colors.BLACK} onPress={this.prepareToClose} />
            </Wrapper>
          </Background>
        </TouchableWithoutFeedback>
      </Fragment>
    );
  }
}

const Background = styled(Animated.View)({
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.4)',
  justifyContent: 'flex-end',
  alignItems: 'flex-end',
});

const Wrapper = styled(Animated.View)({
  paddingTop: 25,
  overflow: 'hidden',
  alignItems: 'center',
  justifyContent: 'center',
  width: Screen.width,
});

const CardsWrapper = styled.View({
  width: Screen.width - 30,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.WHITE,
  borderRadius: 10,
  marginBottom: 15,
  paddingVertical: 5,
});

const Card = (props: {
  onPress: Function,
  label: string,
  description: string,
  icon: any,
  loading?: ?boolean,
}) => (
  <TouchableHighlight onPress={props.onPress} underlayColor="transparent">
    <CardWrapper>
      <Icon source={props.icon} />
      <Label color={colors.BLACK}>{props.label}</Label>
      <Description>{props.description}</Description>
    </CardWrapper>
  </TouchableHighlight>
);

const CardWrapper = styled.View({
  marginVertical: 5,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.LIGHT_GREY,
  borderRadius: 10,
  paddingVertical: 40,
  paddingHorizontal: 30,
  width: Screen.width - 50,
});

const Row = (props: { onPress: Function, label: string, color: string, loading?: ?boolean }) => (
  <TouchableHighlight onPress={props.onPress} underlayColor="transparent">
    <RowWrapper>
      <Label color={props.color}>{props.label}</Label>
    </RowWrapper>
  </TouchableHighlight>
);

const RowWrapper = styled.View({
  height: 60,
  width: Screen.width - 30,
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: colors.WHITE,
  borderRadius: 60 / 2,
  marginBottom: 15,
});

const Label = styled.Text(({ color }) => ({
  fontSize: 19,
  color,
  backgroundColor: 'transparent',
  fontFamily: 'Montserrat-Bold',
}));

const Description = styled.Text({
  fontSize: 13,
  color: colors.GREY,
  backgroundColor: 'transparent',
  fontFamily: 'Montserrat-Bold',
  textAlign: 'center',
});

const Icon = styled.Image({
  width: 30,
  height: 30,
  marginBottom: 5,
});

export default AddOverlay;
