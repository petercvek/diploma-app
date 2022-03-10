// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { Animated, ScrollView, Dimensions, View, TouchableOpacity } from 'react-native';
import { graphql, withApollo } from 'react-apollo';
import { compose } from 'recompose';
import gql from 'graphql-tag';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';

import { colors } from 'config/styles';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import { Button } from 'components/Buttons';

import { tripQuery } from 'screens/TripScreen';

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  trip: Trip,
  createTrip: Function,
  client: any,
  onTripCreated: Function,
|};

type State = {|
  loading: boolean,
  startAt: Date,
  endAt: Date,
  showStartAtDatePicker: boolean,
  showEndAtDatePicker: boolean,
  name: string,
  coverPhoto: string,
|};

@autobind
class CreateTripScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    loading: false,
    startAt: new Date(),
    endAt: new Date(),
    showStartAtDatePicker: false,
    showEndAtDatePicker: false,
    name: '',
    coverPhoto: '',
  };

  static options() {
    return {
      bottomTabs: {
        visible: true,
      },
      statusBar: {
        drawBehind: true,
      },
    };
  }

  createTrip = async () => {
    try {
      this.setState({ loading: true });
      const createdTripResult = await this.props.createTrip({
        variables: {
          name: this.state.name,
          startAt: this.state.startAt,
          endAt: this.state.endAt,
          coverPhoto: this.state.coverPhoto,
        },
      });

      const tripResult = await this.props.client.query({
        query: tripQuery,
        variables: { tripId: createdTripResult.data.createTrip.id },
        fetchPolicy: 'network-only',
      });
      await Navigation.pop(this.props.componentId);
      this.props.onTripCreated(tripResult.data.trip);
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  navigateBack() {
    Navigation.pop(this.props.componentId);
  }

  valid = () => this.state.name && this.state.startAt && this.state.endAt;

  render() {
    return (
      <Wrapper>
        <Navbar scrollViewY={this.scrollViewY}>
          <View
            style={{
              width: Screen.width - 40,
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row' }}>
              <NavbarTitle title="Create Trip" />
            </View>
          </View>
        </Navbar>
        <ScrollViewWrapper contentContainerStyle={{ alignItems: 'center' }}>
          <Card>
            <Labels>Name</Labels>
            <Input
              placeholder="Enter name of the trip"
              onChangeText={text => this.setState({ name: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.name}
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <Card>
            <Labels>Cover Photo Url</Labels>
            <Input
              placeholder="Enter photo url (optional)"
              onChangeText={text => this.setState({ coverPhoto: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.coverPhoto}
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <Card>
            <Section>
              <TouchableOpacity
                onPress={() =>
                  this.setState({ showStartAtDatePicker: !this.state.showStartAtDatePicker })
                }
                activeOpacity={0.7}
              >
                <Labels>Start of trip</Labels>
                <Text>{moment(this.state.startAt).format('H:mm - D MMM')}</Text>
              </TouchableOpacity>
              {this.state.showStartAtDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  textColor={colors.BLACK}
                  value={this.state.startAt}
                  mode="datetime"
                  is24Hour={true}
                  display="spinner"
                  onChange={(_, date) => this.setState({ startAt: date })}
                />
              )}
            </Section>
            <TouchableOpacity
              onPress={() =>
                this.setState({ showEndAtDatePicker: !this.state.showEndAtDatePicker })
              }
              activeOpacity={0.7}
            >
              <Labels>End of trip</Labels>
              <Row>
                <Text>{moment(this.state.endAt).format('H:mm - D MMM')}</Text>
                <Text>
                  {moment(this.state.endAt).dayOfYear() +
                    moment(this.state.endAt).year() * 365 -
                    (moment(this.state.startAt).dayOfYear() +
                      moment(this.state.startAt).year() * 365) +
                    1}{' '}
                  days
                </Text>
              </Row>
            </TouchableOpacity>
            {this.state.showEndAtDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                textColor={colors.BLACK}
                value={this.state.endAt}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={(_, date) => this.setState({ endAt: date })}
              />
            )}
          </Card>

          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            <Button
              text="Create Trip"
              loading={this.state.loading}
              onPress={this.createTrip}
              disabled={!this.valid()}
            />
          </View>
        </ScrollViewWrapper>
      </Wrapper>
    );
  }
}

const ScrollViewWrapper = styled.ScrollView({
  marginTop: NAVBAR_HEIGHT,
});

const Wrapper = styled.View({
  height: Screen.height,
  backgroundColor: colors.WHITE,
});

const Card = styled.View({
  backgroundColor: colors.LIGHT_GREY,
  width: Screen.width - 40,
  padding: 12,
  borderRadius: 10,
  marginBottom: 10,
});

const Section = styled.View({
  paddingBottom: 8,
});

const Row = styled.View({
  flexDirection: 'row',
  justifyContent: 'space-between',
});

const Labels = styled.Text({
  fontSize: 12,
  color: colors.GREY4,
  fontFamily: 'Montserrat-Bold',
});

const Text = styled.Text({
  fontSize: 17,
  color: colors.BLACK,
  fontFamily: 'Montserrat-Medium',
});

const Input = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const createTripMutation = gql`
  mutation createTrip($name: String, $startAt: String, $endAt: String, $coverPhoto: String) {
    createTrip(name: $name, startAt: $startAt, endAt: $endAt, coverPhoto: $coverPhoto) {
      id
      name
      startAt
      endAt
      coverPhoto
      inviteCode
    }
  }
`;

export default compose(
  graphql(createTripMutation, {
    name: 'createTrip',
  }),
  withApollo,
)(CreateTripScreen);
