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
  View,
} from 'react-native';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import { withApollo } from 'react-apollo';

import { colors } from 'config/styles';

import { Input } from 'components/FormElements';
import { Button } from 'components/Buttons';
import ErrorMessage from 'components/ErrorMessage';

import { tripQuery } from 'screens/TripScreen';

const Screen = Dimensions.get('window');

type Props = {
  componentId: string,
  parentComponentId: string,
  client: any,
  openCreateTripScreen: Function,
};

type State = {
  inviteCode: string,
  loading: boolean,
  error: 'INVALID_INVITE_CODE' | 'UNKNOWN_ERROR' | null,
};

@autobind
class AddOverlay extends Component<Props, State> {
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

  state = {
    inviteCode: '',
    loading: false,
    error: null,
  };

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

  useInviteCode = async () => {
    try {
      this.setState({ loading: true, error: null });
      const result = await this.props.client.query({
        query: tripQuery,
        variables: { inviteCode: this.state.inviteCode },
        fetchPolicy: 'network-only',
      });

      if (result.data && result.data.trip) {
        this.prepareToClose();

        await this.props.client.query({
          query: tripQuery,
          variables: { tripId: result.data.trip.id },
          fetchPolicy: 'network-only',
        });

        Navigation.push(this.props.parentComponentId, {
          component: {
            name: 'TripScreen',
            passProps: {
              trip: result.data.trip,
            },
          },
        });
      }
    } catch (error) {
      const gqlError = error.graphQLErrors && error.graphQLErrors[0];
      if (gqlError) {
        switch (gqlError.message) {
          case 'INVALID_INVITE_CODE': {
            this.setState({ error: 'INVALID_INVITE_CODE' });
            break;
          }
          default:
            this.setState({ error: 'UNKNOWN_ERROR' });
        }
      }
      console.log(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  openCreateTripScreen = () => {
    this.prepareToClose();
    this.props.openCreateTripScreen();
  };

  onChange = (text: string) => {
    this.setState({
      inviteCode: text.toUpperCase(),
    });
  };

  renderErrorMessage = () => {
    if (!this.state.error) return null;

    switch (this.state.error) {
      case 'INVALID_INVITE_CODE':
        return <ErrorMessage color="dark" text="Invite code you have entered is invalid" />;

      case 'UNKNOWN_ERROR':
        return <ErrorMessage color="dark" text="Unknown error" />;

      default:
        return <ErrorMessage color="dark" text="Unknown error" />;
    }
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
                <TouchableWithoutFeedback onPress={() => {}}>
                  <CardWrapper>
                    <Icon source={require('assets/invite_code.png')} />
                    <Label color={colors.BLACK}>Join trip</Label>
                    <Description>Enter invite code to preview already existing trip</Description>

                    <View style={{ width: '100%' }}>
                      <Input
                        autoCorrect={false}
                        autoCapitalize="none"
                        placeholder={'123456'}
                        placeholderTextColor="rgba(0, 0, 0, 0.3)"
                        value={this.state.inviteCode}
                        onChangeText={this.onChange}
                        onSubmitEditing={this.useInviteCode}
                        color={colors.BLACK}
                        borderColor={colors.BLACK}
                        style={{ marginTop: 10, textAlign: 'center' }}
                      />

                      {this.renderErrorMessage()}

                      <View style={{ marginTop: 10 }}>
                        <Button
                          text="Preview Trip"
                          onPress={this.useInviteCode}
                          loading={this.state.loading}
                        />
                      </View>
                    </View>
                  </CardWrapper>
                </TouchableWithoutFeedback>
                <Card
                  label="Create Trip"
                  description="Create your own trip and later invite friends to join"
                  icon={require('assets/edit.png')}
                  onPress={this.openCreateTripScreen}
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

export default withApollo(AddOverlay);
