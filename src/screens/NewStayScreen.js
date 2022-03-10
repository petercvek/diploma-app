// @flow
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
import { Animated, ScrollView, Dimensions, View, TouchableOpacity } from 'react-native';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import MapboxGL from '@react-native-mapbox-gl/maps';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import { Button } from 'components/Buttons';

import stayPinIcon from 'assets/map_icons/stay_pin.png';
import checkInCalloutIcon from 'assets/map_icons/check_in_callout.png';

import { colors } from 'config/styles';

import { tripQuery } from 'screens/TripScreen';

MapboxGL.setAccessToken(
  'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
);

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  selectedDate: Date,
  trip: Trip,
  addStay: Function,
  defaultCoordinates: [number, number],
|};

type State = {|
  loading: boolean,
  checkIn: Date,
  checkOut: Date,
  location: ?Location,
  notes: string,
  showCheckInDatePicker: boolean,
  showCheckOutDatePicker: boolean,
|};

@autobind
class NewStayScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    loading: false,
    checkIn: new Date(moment(this.props.selectedDate).hours(15).minutes(0).seconds(0)),
    checkOut: new Date(
      moment(this.props.selectedDate).add(1, 'days').hours(10).minutes(0).seconds(0),
    ),
    location: null,
    showCheckInDatePicker: false,
    showCheckOutDatePicker: false,
    notes: '',
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

  openLocationPicker = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'LocationPickerScreen',
        passProps: {
          onComplete: location => {
            this.setState({ location });
          },
          defaultCoordinates: this.props.defaultCoordinates,
        },
      },
    });
  };

  addStay = async () => {
    try {
      this.setState({ loading: true });
      const stayId = uuidv4();
      const locationId = uuidv4();

      await this.props.addStay({
        variables: {
          tripId: this.props.trip.id,
          stay: {
            id: stayId,
            name: this.state.name,
            checkIn: this.state.checkIn,
            checkOut: this.state.checkOut,
            notes: this.state.notes || null,
            price: this.state.price ? parseInt(this.state.price, 10) : null,
            price: 30,
            location: {
              id: locationId,
              name: this.state.location.name,
              longitude: this.state.location.coordinates[0],
              latitude: this.state.location.coordinates[1],
            },
          },
        },
        optimisticResponse: {
          __typename: 'Mutation',
          addStay: {
            __typename: 'Stay',
            id: stayId,
            price: this.state.price ? parseInt(this.state.price, 10) : null,
            name: this.state.name,
            checkIn: this.state.checkIn,
            checkOut: this.state.checkOut,
            notes: this.state.notes || null,
            location: {
              __typename: 'Location',
              id: locationId,
              name: this.state.location.name,
              longitude: this.state.location.coordinates[0],
              latitude: this.state.location.coordinates[1],
            },
          },
        },
        update: (cache, { data: { addStay } }) => {
          // Update trip query data
          const tripData = cache.readQuery({
            query: tripQuery,
            variables: {
              tripId: this.props.trip.id,
            },
          });

          tripData.trip.stays.items.push(addStay);

          cache.writeQuery({
            query: tripQuery,
            variables: {
              tripId: this.props.trip.id,
            },
            data: tripData,
          });
        },
      });
      this.navigateBack();
    } catch (error) {
      console.log(error);
    } finally {
      this.setState({ loading: false });
    }
  };

  navigateBack() {
    Navigation.pop(this.props.componentId);
  }

  valid = () => this.state.location;

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
              <NavbarTitle title="New Stay" />
            </View>
          </View>
        </Navbar>
        <ScrollViewWrapper
          contentContainerStyle={{ alignItems: 'center' }}
          keyboardDismissMode="on-drag"
        >
          <Card>
            <Labels>Name</Labels>
            <Input
              placeholder="Enter name of stay"
              onChangeText={text => this.setState({ name: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.name}
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <Card>
            <Section>
              <TouchableOpacity
                onPress={() =>
                  this.setState({ showCheckInDatePicker: !this.state.showCheckInDatePicker })
                }
                activeOpacity={0.7}
              >
                <Labels>Check in</Labels>
                <Text>{moment(this.state.checkIn).format('H:mm - D MMM')}</Text>
              </TouchableOpacity>
              {this.state.showCheckInDatePicker && (
                <DateTimePicker
                  testID="dateTimePicker"
                  textColor={colors.BLACK}
                  value={this.state.checkIn}
                  mode="datetime"
                  is24Hour={true}
                  display="spinner"
                  onChange={(_, date) => this.setState({ checkIn: date })}
                />
              )}
            </Section>
            <TouchableOpacity
              onPress={() =>
                this.setState({ showCheckOutDatePicker: !this.state.showCheckOutDatePicker })
              }
              activeOpacity={0.7}
            >
              <Labels>Check out</Labels>
              <Row>
                <Text>{moment(this.state.checkOut).format('H:mm - D MMM')}</Text>
                <Text>
                  {moment(this.state.checkOut).dayOfYear() +
                    moment(this.state.checkOut).year() * 365 -
                    (moment(this.state.checkIn).dayOfYear() +
                      moment(this.state.checkIn).year() * 365)}{' '}
                  nights
                </Text>
              </Row>
            </TouchableOpacity>
            {this.state.showCheckOutDatePicker && (
              <DateTimePicker
                testID="dateTimePicker"
                textColor={colors.BLACK}
                value={this.state.checkOut}
                mode="datetime"
                is24Hour={true}
                display="spinner"
                onChange={(_, date) => this.setState({ checkOut: date })}
              />
            )}
          </Card>
          <TouchableOpacity onPress={this.openLocationPicker} activeOpacity={0.7}>
            <Card>
              <Labels>Location</Labels>
              {this.state.location ? (
                <Text numberOfLines={1} ellipsizeMode="tail">
                  {this.state.location.name}
                </Text>
              ) : (
                <EmptyText>Tap to set a location</EmptyText>
              )}

              <MapWrapper>
                <MapboxGL.MapView
                  zoomEnabled={false}
                  scrollEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                  compassEnabled={false}
                  ref={c => (this._map = c)}
                  style={{ flex: 1 }}
                  styleURL="mapbox://styles/petercvek/ckyfsy2eo1ceb14pf7rd7kdw1"
                >
                  <MapboxGL.Camera
                    ref={c => (this.camera = c)}
                    defaultSettings={{
                      centerCoordinate: this.state.location
                        ? this.state.location.coordinates
                        : this.props.defaultCoordinates,
                      zoomLevel: 15,
                    }}
                    animationMode="moveTo"
                    centerCoordinate={
                      this.state.location
                        ? this.state.location.coordinates
                        : this.props.defaultCoordinates
                    }
                  />
                  <MapboxGL.ShapeSource
                    id="mapPinsSource"
                    shape={{
                      type: 'FeatureCollection',
                      features: [
                        ...(this.state.location
                          ? [
                              {
                                type: 'Feature',
                                id: 'new-stay',
                                geometry: {
                                  type: 'Point',
                                  coordinates: this.state.location.coordinates,
                                },
                              },
                            ]
                          : []),
                      ],
                    }}
                    onPress={this.onPinPress}
                  >
                    <MapboxGL.SymbolLayer
                      id="checkInCalloutIcon"
                      style={{
                        iconAllowOverlap: true,
                        iconSize: 0.1,
                        iconImage: checkInCalloutIcon,
                        iconOffset: [0, -70],
                        iconAnchor: 'bottom',
                      }}
                    />
                    <MapboxGL.SymbolLayer
                      id="mapPinsLayer"
                      style={{
                        iconAllowOverlap: true,
                        iconAnchor: 'center',
                        iconSize: 0.1,
                        iconImage: stayPinIcon,
                      }}
                    />
                  </MapboxGL.ShapeSource>
                </MapboxGL.MapView>
              </MapWrapper>
            </Card>
          </TouchableOpacity>
          <Card>
            <Labels>Price</Labels>
            <PriceInput
              placeholder="Cost of whole stay"
              onChangeText={text => this.setState({ price: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.price}
              multiline
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
              keyboardType="number-pad"
            />
          </Card>
          <Card>
            <Labels>Notes</Labels>
            <NotesInput
              placeholder="Anything you want to node about this stay"
              onChangeText={text => this.setState({ notes: text })}
              placeholderTextColor={colors.GREY5}
              value={this.state.notes}
              multiline
              autoCorrect={false}
              blurOnSubmit
              returnKeyType="next"
            />
          </Card>
          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            <Button
              text="Add Stay"
              loading={this.state.loading}
              onPress={this.addStay}
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

const MapWrapper = styled.View({
  height: 150,
  borderRadius: 10,
  overflow: 'hidden',
  paddingTop: 8,
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

const EmptyText = styled.Text({
  fontSize: 17,
  color: colors.GREY5,
  fontFamily: 'Montserrat-Medium',
});

const PriceInput = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const NotesInput = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  minHeight: 43,
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const Input = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const addStayMutation = gql`
  mutation addStay($tripId: ID!, $stay: StayInput!) {
    addStay(tripId: $tripId, stay: $stay) {
      id
      name
      checkIn
      checkOut
      notes
      price
      location {
        id
        name
        latitude
        longitude
      }
    }
  }
`;

export default graphql(addStayMutation, {
  name: 'addStay',
})(NewStayScreen);
