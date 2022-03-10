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
import mapboxgl from 'mapbox-gl';
import 'react-native-get-random-values';
import mbxClient from '@mapbox/mapbox-sdk';
import mbxDirections from '@mapbox/mapbox-sdk/services/directions';
const baseClient = mbxClient({
  accessToken:
    'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
});
import { v4 as uuidv4 } from 'uuid';

import Navbar, { NavbarTitle, NAVBAR_HEIGHT } from 'components/Navbar';
import { Button } from 'components/Buttons';

import endPointIcon from 'assets/map_icons/end_point_pin.png';

import { colors } from 'config/styles';

const directionsService = mbxDirections(baseClient);

MapboxGL.setAccessToken(
  'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
);

import { tripQuery } from 'screens/TripScreen';

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  selectedDate: Date,
  trip: Trip,
  addNavigation: Function,
  defaultCoordinates: [number, number],
|};

type State = {|
  loading: boolean,
  type: 'driving' | 'cycling' | 'walking',
  startAt: Date,
  duration: ?Date,
  distance: ?number,
  startingLocation: ?Location,
  endingLocation: ?Location,
  showStartAtDatePicker: boolean,
  route: any,
  gettingRoute: boolean,
|};

@autobind
class NewNavigationScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    loading: false,
    type: 'driving',
    startAt: new Date(moment(this.props.selectedDate).hours(15).minutes(0).seconds(0)),
    duration: null,
    distance: null,
    showStartAtDatePicker: false,
    startingLocation: null,
    endingLocation: null,
    route: null,
    gettingRoute: false,
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

  getRoute = () => {
    this.setState({ gettingRoute: true, duration: null, distance: null, route: null });
    if (this.state.type === 'flying') {
      const route = {
        geometry: {
          coordinates: [
            this.state.startingLocation.coordinates,
            this.state.endingLocation.coordinates,
          ],
          type: 'LineString',
        },
      };
      this.setState({
        route,
        gettingRoute: false,
      });

      let bounds = new mapboxgl.LngLatBounds();
      const { coordinates } = route.geometry;
      coordinates.forEach(coordinate => bounds.extend(coordinate));

      this.camera.fitBounds(
        [bounds._ne.lng, bounds._ne.lat],
        [bounds._sw.lng, bounds._sw.lat],
        20,
        500,
      );
    } else {
      directionsService
        .getDirections({
          geometries: 'geojson',
          overview: 'full',
          profile: this.state.type,
          waypoints: [
            { coordinates: this.state.startingLocation.coordinates },
            { coordinates: this.state.endingLocation.coordinates },
          ],
        })
        .send()
        .then(response => {
          if (response !== null) {
            const route = response.body.routes[0];
            this.setState({
              route,
              gettingRoute: false,
              distance: route.distance,
              duration: route.duration,
            });

            let bounds = new mapboxgl.LngLatBounds();
            if (response.body.routes.length > 0) {
              const { coordinates } = route.geometry;
              coordinates.forEach(coordinate => bounds.extend(coordinate));

              this.camera.fitBounds(
                [bounds._ne.lng, bounds._ne.lat],
                [bounds._sw.lng, bounds._sw.lat],
                20,
                500,
              );
            }
          }
        })
        .catch(err => {
          console.log(err);
          this.setState({ gettingRoute: false });
        });
    }
  };

  openRoutePicker = () => {
    Navigation.push(this.props.componentId, {
      component: {
        name: 'RoutePickerScreen',
        passProps: {
          onComplete: async (startingLocation, endingLocation) => {
            await this.setState({ startingLocation, endingLocation, route: null });
            this.getRoute();
          },
          defaultCoordinates: this.props.defaultCoordinates,
        },
      },
    });
  };

  setType = async type => {
    await this.setState({ type });
    if (this.state.startingLocation) this.getRoute();
  };

  addNavigation = async () => {
    try {
      this.setState({ loading: true });
      const navigationId = uuidv4();
      const startingLocationId = uuidv4();
      const endingLocationId = uuidv4();

      await this.props.addNavigation({
        variables: {
          tripId: this.props.trip.id,
          navigation: {
            id: navigationId,
            type: this.state.type,
            startAt: this.state.startAt,
            duration: this.state.duration,
            distance: this.state.distance,
            route: JSON.stringify(this.state.route),
            startingLocation: {
              id: startingLocationId,
              name: this.state.startingLocation.name,
              longitude: this.state.startingLocation.coordinates[0],
              latitude: this.state.startingLocation.coordinates[1],
            },
            endingLocation: {
              id: endingLocationId,
              name: this.state.endingLocation.name,
              longitude: this.state.endingLocation.coordinates[0],
              latitude: this.state.endingLocation.coordinates[1],
            },
          },
        },
        optimisticResponse: {
          __typename: 'Mutation',
          addNavigation: {
            __typename: 'Navigation',
            id: navigationId,
            type: this.state.type,
            startAt: this.state.startAt,
            duration: this.state.duration,
            distance: this.state.distance,
            route: JSON.stringify(this.state.route),
            startingLocation: {
              __typename: 'Location',
              id: startingLocationId,
              name: this.state.startingLocation.name,
              longitude: this.state.startingLocation.coordinates[0],
              latitude: this.state.startingLocation.coordinates[1],
            },
            endingLocation: {
              __typename: 'Location',
              id: endingLocationId,
              name: this.state.endingLocation.name,
              longitude: this.state.endingLocation.coordinates[0],
              latitude: this.state.endingLocation.coordinates[1],
            },
          },
        },
        update: (cache, { data: { addNavigation } }) => {
          // Update trip query data
          const tripData = cache.readQuery({
            query: tripQuery,
            variables: {
              tripId: this.props.trip.id,
            },
          });

          tripData.trip.navigations.items.push(addNavigation);

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

  valid = () =>
    this.state.startingLocation &&
    this.state.endingLocation &&
    this.state.route &&
    !this.state.gettingRoute;

  render() {
    const duration = this.state.duration && moment.duration(this.state.duration, 'seconds');

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
              <NavbarTitle title="New Navigation" />
            </View>
          </View>
        </Navbar>
        <ScrollViewWrapper
          contentContainerStyle={{ alignItems: 'center' }}
          keyboardDismissMode="on-drag"
        >
          <Card>
            <TouchableOpacity
              onPress={() =>
                this.setState({ showStartAtDatePicker: !this.state.showStartAtDatePicker })
              }
              activeOpacity={0.7}
            >
              <Labels>Start At</Labels>
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
          </Card>
          <Card>
            <Labels>Type</Labels>
            <Row style={{ marginTop: 5 }}>
              <TouchableOpacity
                onPress={() => this.setType('driving')}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', paddingHorizontal: 5 }}
              >
                <TypeWrapper selected={this.state.type === 'driving'}>
                  <TypeIcon source={require('assets/navigation_types/driving.png')} />
                  <Text>Driving</Text>
                </TypeWrapper>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.setType('cycling')}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', paddingHorizontal: 5 }}
              >
                <TypeWrapper selected={this.state.type === 'cycling'}>
                  <TypeIcon source={require('assets/navigation_types/cycling.png')} />
                  <Text>Cycling</Text>
                </TypeWrapper>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.setType('walking')}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', paddingHorizontal: 5 }}
              >
                <TypeWrapper selected={this.state.type === 'walking'}>
                  <TypeIcon source={require('assets/navigation_types/walking.png')} />
                  <Text>Walking</Text>
                </TypeWrapper>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => this.setType('flying')}
                activeOpacity={0.7}
                style={{ flex: 1, alignItems: 'center', paddingHorizontal: 5 }}
              >
                <TypeWrapper selected={this.state.type === 'flying'}>
                  <TypeIcon source={require('assets/navigation_types/flying.png')} />
                  <Text>Flying</Text>
                </TypeWrapper>
              </TouchableOpacity>
            </Row>
          </Card>
          <TouchableOpacity onPress={this.openRoutePicker} activeOpacity={0.7}>
            <Card>
              {this.state.startingLocation && this.state.endingLocation ? (
                <View>
                  <Labels>Start</Labels>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {this.state.startingLocation.name}
                  </Text>

                  <Labels>Destination</Labels>
                  <Text numberOfLines={1} ellipsizeMode="tail">
                    {this.state.endingLocation.name}
                  </Text>

                  <Row style={{ justifyContent: 'flex-start' }}>
                    {this.state.duration && (
                      <View style={{ marginRight: 10 }}>
                        <Labels>Duration</Labels>
                        <Text>
                          {duration.hours() > 0 && `${duration.hours()}hr`}
                          {duration.minutes()}min
                        </Text>
                      </View>
                    )}
                    {this.state.distance && (
                      <View>
                        <Labels>Distance</Labels>
                        <Text>{(this.state.distance / 1000).toFixed(1)}km</Text>
                      </View>
                    )}
                  </Row>
                </View>
              ) : (
                <View>
                  <Labels>Location</Labels>
                  <EmptyText>Tap to set waypoints</EmptyText>
                </View>
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
                      centerCoordinate: this.props.defaultCoordinates,
                      zoomLevel: 15,
                    }}
                    animationMode="moveTo"
                  />

                  {this.state.endingLocation && this.state.endingLocation && (
                    <MapboxGL.ShapeSource
                      id="mapPinsSource"
                      shape={{
                        type: 'FeatureCollection',
                        features: [
                          {
                            type: 'Feature',
                            id: 'mapPinsLayer',
                            geometry: {
                              type: 'Point',
                              coordinates:
                                this.state.startingLocation &&
                                this.state.startingLocation.coordinates,
                            },
                          },
                          {
                            type: 'Feature',
                            id: 'mapPinsLayer',
                            geometry: {
                              type: 'Point',
                              coordinates:
                                this.state.endingLocation && this.state.endingLocation.coordinates,
                            },
                          },
                        ],
                      }}
                    >
                      <MapboxGL.SymbolLayer
                        id="mapPinsLayer"
                        layerIndex={100}
                        style={{
                          iconAllowOverlap: true,
                          iconAnchor: 'center',
                          iconSize: 0.1,
                          iconImage: endPointIcon,
                        }}
                      />
                    </MapboxGL.ShapeSource>
                  )}

                  {this.state.route && (
                    <MapboxGL.ShapeSource
                      id="mapbox-directions-source"
                      shape={this.state.route.geometry}
                    >
                      <MapboxGL.LineLayer
                        belowLayerID="mapPinsLayer"
                        id="mapbox-directions-line"
                        style={{
                          lineWidth: 6,
                          lineCap: 'round',
                          lineJoin: 'round',
                        }}
                      />
                    </MapboxGL.ShapeSource>
                  )}
                </MapboxGL.MapView>
              </MapWrapper>
            </Card>
          </TouchableOpacity>

          <View style={{ width: '100%', paddingHorizontal: 20 }}>
            <Button
              text="Add Navigation"
              loading={this.state.loading}
              onPress={this.addNavigation}
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

const TypeWrapper = styled.View(({ selected }) => ({
  flex: 1,
  height: 70,
  width: '100%',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: selected ? 'rgba(0, 0, 0, 0.1)' : 'rgba(0, 0, 0, 0.0)',
  borderRadius: 10,
  transition: '0.5s',
}));

const TypeIcon = styled.Image({
  width: 25,
  height: 25,
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
  fontSize: 14,
  color: colors.BLACK,
  fontFamily: 'Montserrat-Medium',
});

const EmptyText = styled.Text({
  fontSize: 17,
  color: colors.GREY5,
  fontFamily: 'Montserrat-Medium',
});

const addStayMutation = gql`
  mutation addNavigation($tripId: ID!, $navigation: NavigationInput!) {
    addNavigation(tripId: $tripId, navigation: $navigation) {
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
`;

export default graphql(addStayMutation, {
  name: 'addNavigation',
})(NewNavigationScreen);
