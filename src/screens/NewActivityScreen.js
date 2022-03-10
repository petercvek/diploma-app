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

import activityPinIcon from 'assets/map_icons/activity_pin.png';

import { colors } from 'config/styles';

import activityCategories from 'helpers/activityCategories';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import { Button } from 'components/Buttons';

import { tripQuery } from 'screens/TripScreen';

MapboxGL.setAccessToken(
  'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
);
const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  selectedDate: Date,
  trip: Trip,
  addActivity: Function,
  defaultCoordinates: [number, number],
|};

type State = {|
  loading: boolean,
  startAt: Date,
  endAt: Date,
  location: ?Location,
  notes: string,
  category: ?string,
  price: string,
  name: string,
  showStartAtDatePicker: boolean,
  showEndAtDatePicker: boolean,
|};

@autobind
class NewActivityScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    loading: false,
    name: '',
    startAt: new Date(
      moment(this.props.selectedDate).hours(15).minutes(0).seconds(0).milliseconds(0).seconds(0),
    ),
    endAt: new Date(
      moment(this.props.selectedDate).hours(16).minutes(0).seconds(0).milliseconds(0).seconds(0),
    ),
    showStartAtDatePicker: false,
    showEndAtDatePicker: false,
    category: null,
    price: '',
    notes: '',
    location: null,
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

  addActivity = async () => {
    try {
      this.setState({ loading: true });
      const activityId = uuidv4();
      const locationId = uuidv4();

      await this.props.addActivity({
        variables: {
          tripId: this.props.trip.id,
          activity: {
            id: activityId,
            name: this.state.name || null,
            startAt: this.state.startAt,
            endAt: this.state.endAt,
            notes: this.state.notes || null,
            price: this.state.price ? parseInt(this.state.price, 10) : null,
            category: this.state.category,
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
          addActivity: {
            __typename: 'Activity',
            id: activityId,
            name: this.state.name || null,
            startAt: this.state.startAt,
            endAt: this.state.endAt,
            notes: this.state.notes || null,
            price: this.state.price ? parseInt(this.state.price, 10) : null,
            category: this.state.category,
            location: {
              __typename: 'Location',
              id: locationId,
              name: this.state.location.name,
              longitude: this.state.location.coordinates[0],
              latitude: this.state.location.coordinates[1],
            },
          },
        },
        update: (cache, { data: { addActivity } }) => {
          // Update trip query data
          const tripData = cache.readQuery({
            query: tripQuery,
            variables: {
              tripId: this.props.trip.id,
            },
          });

          tripData.trip.activities.items.push(addActivity);

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
              <NavbarTitle title="New Activity" />
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
              placeholder="Enter name of activity"
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
                  this.setState({ showStartAtDatePicker: !this.state.showStartAtDatePicker })
                }
                activeOpacity={0.7}
              >
                <Labels>Start at</Labels>
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
              <Labels>End at</Labels>
              <Text>{moment(this.state.endAt).format('H:mm - D MMM')}</Text>
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
                                id: 'new-activity',
                                geometry: {
                                  type: 'Point',
                                  coordinates: this.state.location.coordinates,
                                },
                              },
                            ]
                          : []),
                      ],
                    }}
                  >
                    <MapboxGL.SymbolLayer
                      id="mapPinsLayer"
                      style={{
                        iconAllowOverlap: true,
                        iconAnchor: 'center',
                        iconSize: 0.1,
                        iconImage: activityPinIcon,
                      }}
                    />
                  </MapboxGL.ShapeSource>
                </MapboxGL.MapView>
              </MapWrapper>
            </Card>
          </TouchableOpacity>
          <Card>
            <Labels>Category</Labels>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingTop: 5,
              }}
            >
              {Object.keys(activityCategories).map(key => {
                const category = activityCategories[key];
                const selected = key === this.state.category;

                return (
                  <TouchableOpacity
                    key={key}
                    onPress={() => this.setState({ category: key })}
                    activeOpacity={0.7}
                  >
                    <CategoryWrapper selected={selected} backgroundColor={category.backgroundColor}>
                      <CategoryIcon source={category.icon} />
                      <CategoryText selected={selected} color={category.color}>
                        {category.label}
                      </CategoryText>
                    </CategoryWrapper>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </Card>
          <Card>
            <Labels>Price</Labels>
            <PriceInput
              placeholder="Cost of whole activity"
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
              placeholder="Anything you want to node about this activity"
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
              text="Add Activity"
              loading={this.state.loading}
              onPress={this.addActivity}
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

const CategoryWrapper = styled.View(({ selected, backgroundColor }) => ({
  backgroundColor: selected ? backgroundColor : colors.WHITE,
  borderRadius: 10,
  marginRight: 10,
  padding: 10,
  flexDirection: 'row',
  alignItems: 'center',
}));

const CategoryIcon = styled.Image({
  width: 20,
  height: 20,
  marginRight: 10,
});

const CategoryText = styled.Text(({ selected, color }) => ({
  fontSize: 13,
  fontFamily: 'Montserrat-Bold',

  color: selected ? color : colors.BLACK,
}));

const Input = styled.TextInput(({ color = colors.TRUE_BLACK }) => ({
  color,
  fontSize: 17,
  fontFamily: 'Montserrat-Medium',
  paddingTop: 1,
}));

const addActivityMutation = gql`
  mutation addActivity($tripId: ID!, $activity: ActivityInput!) {
    addActivity(tripId: $tripId, activity: $activity) {
      id
      name
      category
      startAt
      endAt
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

export default graphql(addActivityMutation, {
  name: 'addActivity',
})(NewActivityScreen);
