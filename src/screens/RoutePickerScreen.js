// @flow
import { debounce } from 'lodash';
import { autobind } from 'core-decorators';
import React, { Component, Fragment } from 'react';
import { Animated, ScrollView, Dimensions, View, TouchableOpacity } from 'react-native';
import styled from '@emotion/native';
import { Navigation } from 'react-native-navigation';
import MapboxGL from '@react-native-mapbox-gl/maps';
import mbxClient from '@mapbox/mapbox-sdk';
import mbxGeocoding from '@mapbox/mapbox-sdk/services/geocoding';

import { NAVBAR_HEIGHT } from 'components/Navbar';
import { InputLabel, Input } from 'components/FormElements';
import { colors } from 'config/styles';
import { Button } from 'components/Buttons';

import endPointIcon from 'assets/map_icons/end_point_pin.png';

const baseClient = mbxClient({
  accessToken:
    'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
});
const geocodingService = mbxGeocoding(baseClient);
MapboxGL.setAccessToken(
  'pk.eyJ1IjoicGV0ZXJjdmVrIiwiYSI6ImNqeHhsbzg2ZjAwdTMzZ29hMzVqejhxZGkifQ.hBm73-Bw40Ibn3tWNNwjpA',
);

const Screen = Dimensions.get('window');

type Props = {|
  componentId: string,
  trip: Trip,
  onComplete: Function,
  defaultCoordinates: [number, number],
|};

type State = {|
  step: number,
  search: string,
  loadingSearchResults: boolean,
  searchResults: Array<Locations>,
  loadingCenterPlace: boolean,
  centerPlace: ?Location,
  startingLocation: ?Location,
  endingLocation: ?Location,
|};

@autobind
class RoutePickerScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    step: 1,
    search: '',
    loadingSearchResults: false,
    searchResults: [],
    loadingCenterPlace: true,
    centerPlace: null,
    startingLocation: null,
    endingLocation: null,
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

  searchPlace = debounce(async () => {
    geocodingService
      .forwardGeocode({
        query: this.state.search,
        limit: 5,
      })
      .send()
      .then(response => {
        const match = response.body;
        this.setState({
          loadingSearchResults: false,
          searchResults: match.features
            .filter(feature => feature.relevance > 0.5)
            .map(feature => ({
              name: feature.place_name,
              coordinates: feature.geometry.coordinates,
              type: feature.place_type,
            })),
        });
      })
      .catch(err => {
        console.log(err);
        this.setState({
          loadingSearchResults: false,
        });
      });
  }, 500);

  onChangeText = text => {
    this.setState({ search: text, loadingSearchResults: true, searchResults: [] });
    this.searchPlace();
  };

  getCenterLocation = debounce(async () => {
    this.setState({ centerPlace: null, loadingCenterPlace: true });
    const center = await this._map.getCenter();
    geocodingService
      .reverseGeocode({
        query: center,
      })
      .send()
      .then(response => {
        const match = response.body;
        this.setState({ loadingCenterPlace: false });
        if (match.features.length > 0) {
          const feature = match.features[0];
          this.setState({
            centerPlace: { name: feature.place_name, coordinates: feature.geometry.coordinates },
          });
        }
      });
  }, 500);

  onRegionDidChange = () => {
    this.getCenterLocation();
  };

  selectPlace = place => {
    this.camera.flyTo(place.coordinates, 1000);
    if (this.state.step === 1) {
      this.setState({ startingLocation: place });
    } else {
      this.setState({ endingLocation: place });
    }
  };

  navigateBack() {
    Navigation.pop(this.props.componentId);
  }

  onComplete = () => {
    this.props.onComplete(this.state.startingLocation, this.state.endingLocation);
    this.navigateBack();
  };

  render() {
    return (
      <Wrapper>
        <MapWrapper>
          <MapboxGL.MapView
            ref={c => (this._map = c)}
            style={{ flex: 1 }}
            styleURL="mapbox://styles/petercvek/ckyfsy2eo1ceb14pf7rd7kdw1"
            onRegionDidChange={this.onRegionDidChange}
            pitchEnabled={false}
            rotateEnabled={false}
            compassEnabled={false}
            zoomEnabled={
              !(this.state.step === 1 && this.state.startingLocation) &&
              !(this.state.step === 2 && this.state.endingLocation)
            }
            scrollEnabled={
              !(this.state.step === 1 && this.state.startingLocation) &&
              !(this.state.step === 2 && this.state.endingLocation)
            }
          >
            <MapboxGL.Camera
              ref={c => (this.camera = c)}
              defaultSettings={{
                centerCoordinate: this.props.defaultCoordinates,
                zoomLevel: 13,
              }}
            />
            <MapboxGL.ShapeSource
              id="mapPinsSource"
              shape={{
                type: 'FeatureCollection',
                features: [
                  ...(this.state.startingLocation
                    ? [
                        {
                          type: 'Feature',
                          id: 'new-activity',
                          geometry: {
                            type: 'Point',
                            coordinates: this.state.startingLocation.coordinates,
                          },
                        },
                      ]
                    : []),
                  ...(this.state.endingLocation
                    ? [
                        {
                          type: 'Feature',
                          id: 'new-activity',
                          geometry: {
                            type: 'Point',
                            coordinates: this.state.endingLocation.coordinates,
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
                  iconImage: endPointIcon,
                }}
              />
            </MapboxGL.ShapeSource>
          </MapboxGL.MapView>
          {(!this.state.startingLocation || !this.state.endingLocation) && (
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <MapIcon source={require('assets/map_icons/default_pin.png')} />
            </View>
          )}
        </MapWrapper>
        <SearchWrapper>
          {this.state.startingLocation && (
            <View style={{ marginBottom: -10 }}>
              <InputLabel>Starting location</InputLabel>
              <Card>
                <Row>
                  <View style={{ width: Screen.width - 110 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {this.state.startingLocation.name}
                    </Text>
                    <Label>
                      {this.state.startingLocation.coordinates
                        .map(coordinate => coordinate.toFixed(3))
                        .join(', ')}
                    </Label>
                  </View>
                  <TouchableOpacity
                    onPress={() => this.setState({ startingLocation: null, step: 1 })}
                  >
                    <Icon source={require('assets/delete.png')} />
                  </TouchableOpacity>
                </Row>
              </Card>
            </View>
          )}
          {this.state.step === 1 && this.state.startingLocation && (
            <View style={{ width: '100%', paddingHorizontal: 20, marginTop: 10 }}>
              <Button
                text="Set starting location"
                onPress={() => {
                  this.setState({ step: 2 });
                  this.onChangeText('');
                }}
              />
            </View>
          )}

          {this.state.endingLocation && (
            <Fragment>
              <InputLabel>Ending location</InputLabel>
              <Card>
                <Row>
                  <View style={{ width: Screen.width - 110 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {this.state.endingLocation.name}
                    </Text>
                    <Label>
                      {this.state.endingLocation.coordinates
                        .map(coordinate => coordinate.toFixed(3))
                        .join(', ')}
                    </Label>
                  </View>
                  <TouchableOpacity onPress={() => this.setState({ endingLocation: null })}>
                    <Icon source={require('assets/delete.png')} />
                  </TouchableOpacity>
                </Row>
              </Card>
            </Fragment>
          )}

          {this.state.step === 2 && this.state.endingLocation && (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Button text="Calculate route" onPress={this.onComplete} />
            </View>
          )}
        </SearchWrapper>
        {(!this.state.startingLocation ||
          (!this.state.endingLocation && this.state.step === 2)) && (
          <SearchWrapper>
            <InputLabel>Find {this.state.step === 1 ? 'starting' : 'ending'} location</InputLabel>
            <Input
              ref={i => {
                if (i) this.search = i;
              }}
              placeholderTextColor={colors.GREY5}
              autoCorrect={false}
              value={this.state.search}
              placeholder="Type to search for a location"
              onChangeText={this.onChangeText}
              onSubmitEditing={() => this.search.blur()}
              blurOnSubmit={true}
              returnKeyType="next"
            />
          </SearchWrapper>
        )}
        <ScrollViewWrapper
          contentContainerStyle={{
            alignItems: 'center',
          }}
          keyboardDismissMode="on-drag"
        >
          {(!this.state.startingLocation ||
            (!this.state.endingLocation && this.state.step === 2)) && (
            <InsideWrapper>
              {this.state.loadingCenterPlace && (
                <ResultRow>
                  <EmptyText>Fetching from pin location...</EmptyText>
                </ResultRow>
              )}
              {this.state.centerPlace && (
                <TouchableOpacity
                  onPress={() => this.selectPlace(this.state.centerPlace)}
                  activeOpacity={0.7}
                >
                  <ResultRow>
                    <SmallIcon source={require('assets/center_icon.png')} />
                    <View style={{ width: Screen.width - 70 }}>
                      <Text numberOfLines={1} ellipsizeMode="tail">
                        {this.state.centerPlace.name}
                      </Text>
                      <Label>Address at pin location</Label>
                    </View>
                  </ResultRow>
                </TouchableOpacity>
              )}

              {this.state.search.length > 0 && (
                <InputLabel style={{ marginTop: 5 }}>Recommended locations</InputLabel>
              )}

              {this.state.loadingSearchResults && (
                <ResultRow>
                  <EmptyText>Loading places...</EmptyText>
                </ResultRow>
              )}

              {this.state.searchResults.map(result => (
                <TouchableOpacity onPress={() => this.selectPlace(result)} activeOpacity={0.7}>
                  <ResultRow key={result.name}>
                    <SmallIcon source={require('assets/search_icon.png')} />
                    <View style={{ width: Screen.width - 70 }}>
                      <Text numberOfLines={1} ellipsizeMode="tail">
                        {result.name}
                      </Text>
                      <Label>
                        {result.coordinates.map(coordinate => coordinate.toFixed(3)).join(', ')}
                      </Label>
                    </View>
                  </ResultRow>
                </TouchableOpacity>
              ))}
            </InsideWrapper>
          )}
        </ScrollViewWrapper>
      </Wrapper>
    );
  }
}

const Wrapper = styled.View({
  height: Screen.height,
  backgroundColor: colors.LIGHT_GREY,
});

const ScrollViewWrapper = styled.ScrollView({});

const InsideWrapper = styled.View({
  padding: 20,
  width: '100%',
  flex: 1,
  height: '100%',
});

const MapWrapper = styled.View({
  height: 300,
});

const SearchWrapper = styled.View({
  marginTop: -8,
  paddingHorizontal: 20,
  paddingBottom: 20,
  backgroundColor: colors.WHITE,
});

const Card = styled.View({
  backgroundColor: colors.LIGHT_GREY2,
  width: Screen.width - 40,
  padding: 16,
  borderRadius: 10,
  marginBottom: 10,
});

const Row = styled.View({
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
});

const Text = styled.Text({
  fontSize: 15,
  color: colors.BLACK,
  fontFamily: 'Montserrat-Medium',
});

const EmptyText = styled.Text({
  fontSize: 15,
  color: colors.GREY5,
  fontFamily: 'Montserrat-Medium',
});

const ResultRow = styled.View({
  height: 30,
  marginBottom: 20,
  flexDirection: 'row',
  alignItems: 'center',
});

const Label = styled.Text({
  fontSize: 12,
  color: colors.GREY4,
  fontFamily: 'Montserrat-SemiBold',
});

const Icon = styled.Image({
  height: 25,
  width: 25,
  marginLeft: 10,
});

const SmallIcon = styled.Image({
  height: 20,
  width: 20,
  marginRight: 10,
});

const MapIcon = styled.Image({
  height: 17,
  width: 17,
});

export default RoutePickerScreen;
