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
  Linking,
} from 'react-native';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import { graphql } from 'react-apollo';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';

import { colors } from 'config/styles';

const Screen = Dimensions.get('window');

type Props = {
  componentId: string,
  type: string,
  selected: Activity | Stay | Navigation,
  trip: Trip,
  removeStay: Function,
  removeActivity: Function,
  removeNavigation: Function,
};

type State = { removing: boolean };

@autobind
class MoreOverlay extends Component<Props, State> {
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

  state = { removing: false };

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

  removeStay = async removeStay => {
    try {
      this.setState({ removing: true });

      this.props.removeStay({
        variables: { stayId: this.props.selected.id },
        optimisticResponse: {
          __typename: 'Mutation',
          removeStay: {
            ...this.props.trip,
            stays: {
              ...this.props.trip.stays,
              items: this.props.trip.stays.items.filter(item => item.id !== this.props.selected.id),
              count: this.props.trip.stays.count - 1,
            },
          },
        },
      });
      this.prepareToClose();
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ removing: true });
    }
  };

  removeActivity = async removeActivity => {
    try {
      this.setState({ removing: true });

      await this.props.removeActivity({
        variables: { activityId: this.props.selected.id },
        optimisticResponse: {
          __typename: 'Mutation',
          removeActivity: {
            ...this.props.trip,
            activities: {
              ...this.props.trip.activities,
              items: this.props.trip.activities.items.filter(
                item => item.id !== this.props.selected.id,
              ),
              count: this.props.trip.activities.count - 1,
            },
          },
        },
      });
      this.prepareToClose();
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ removing: true });
    }
  };

  removeNavigation = async removeNavigation => {
    try {
      this.setState({ removing: true });

      await this.props.removeNavigation({
        variables: { navigationId: this.props.selected.id },
        optimisticResponse: {
          __typename: 'Mutation',
          removeNavigation: {
            ...this.props.trip,
            navigations: {
              ...this.props.trip.navigations,
              items: this.props.trip.navigations.items.filter(
                item => item.id !== this.props.selected.id,
              ),
              count: this.props.trip.navigations.count - 1,
            },
          },
        },
      });
      this.prepareToClose();
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ removing: true });
    }
  };

  openGoogleMaps = (q, type) => {
    if (Platform.OS === 'ios') this.openDeepLink(`https://www.google.com/maps/${type}/${q}`);
    else this.openDeepLink(`google.navigation:q=${q}`);
  };

  openDeepLink = async (url: string) => {
    await Linking.openURL(url);
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

    const type = this.props.selected.__typename;

    return (
      <Fragment>
        <TouchableWithoutFeedback onPress={this.prepareToClose}>
          <Background style={{ opacity: backgroundOpacity }}>
            <Wrapper style={{ transform: [{ translateY: wrapperTranslate }] }}>
              <Row
                style={{ marginBottom: 5 }}
                label={type === 'Navigation' ? 'Directions' : 'Open in Maps'}
                color={colors.BLACK}
                loading={this.state.removing}
                onPress={() => {
                  switch (type) {
                    case 'Activity':
                    case 'Stay':
                      this.openGoogleMaps(
                        `${this.props.selected.location.name},${this.props.selected.location.latitude},${this.props.selected.location.longitude}`,
                        'search',
                      );
                      break;
                    case 'Navigation':
                      this.openGoogleMaps(
                        `${this.props.selected.startingLocation.latitude},${this.props.selected.startingLocation.longitude}/${this.props.selected.endingLocation.latitude},${this.props.selected.endingLocation.longitude}`,
                        'dir',
                      );

                      break;
                    default:
                      break;
                  }
                }}
              />
              <Row
                label={labelFormType(type)}
                color={colors.RED}
                loading={this.state.removing}
                onPress={() => {
                  switch (type) {
                    case 'Activity':
                      this.removeActivity();
                      break;
                    case 'Stay':
                      this.removeStay();
                      break;
                    case 'Navigation':
                      this.removeNavigation();
                      break;
                    default:
                      break;
                  }
                }}
              />

              <Row label={'Cancel'} color={colors.BLACK} onPress={this.prepareToClose} />
            </Wrapper>
          </Background>
        </TouchableWithoutFeedback>
      </Fragment>
    );
  }
}

const labelFormType = type => {
  switch (type) {
    case 'Activity':
      return 'Remove Activity';
    case 'Stay':
      return 'Remove Stay';
    case 'Navigation':
      return 'Remove Navigation';
    default:
      return '';
  }
};

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

const Row = (props: {
  onPress: Function,
  label: string,
  color: string,
  loading?: ?boolean,
  style: any,
}) => (
  <TouchableHighlight onPress={props.onPress} underlayColor="transparent">
    <RowWrapper style={props.style}>
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

const removeStayMutation = gql`
  mutation removeStay($stayId: ID!) {
    removeStay(stayId: $stayId) {
      id
      stays {
        items {
          id
          name
          checkIn
          checkOut
          price
          location {
            id
            name
            latitude
            longitude
          }
        }
      }
    }
  }
`;

const removeActivityMutation = gql`
  mutation removeActivity($activityId: ID!) {
    removeActivity(activityId: $activityId) {
      id
      activities {
        items {
          id
          name
          startAt
          endAt
          category
          location {
            id
            name
            latitude
            longitude
          }
        }
        count
      }
    }
  }
`;

const removeNavigationMutation = gql`
  mutation removeNavigation($navigationId: ID!) {
    removeNavigation(navigationId: $navigationId) {
      id
      navigations {
        items {
          id
          type
          startAt
          duration
          distance
          startingLocation {
            id
            name
            latitude
            longitude
          }
          endingLocation {
            id
            name
            latitude
            longitude
          }
          route
        }
      }
    }
  }
`;

export default compose(
  graphql(removeStayMutation, {
    name: 'removeStay',
  }),
  graphql(removeActivityMutation, {
    name: 'removeActivity',
  }),
  graphql(removeNavigationMutation, {
    name: 'removeNavigation',
  }),
)(MoreOverlay);
