// @flow
import { debounce } from 'lodash';
import { autobind } from 'core-decorators';
import React, { Component } from 'react';
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
  addStay: Function,
  defaultCoordinates: [number, number],
|};

type State = {|
  search: string,
  loadingSearchResults: boolean,
  searchResults: Array<Locations>,
  loadingCenterPlace: boolean,
  centerPlace: ?Location,
  selectedLocation: Location,
|};

@autobind
class LocationPickerScreen extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    Navigation.events().bindComponent(this);
  }

  scrollView: ScrollView;
  cards = {};
  scrollViewY = new Animated.Value(-NAVBAR_HEIGHT);

  state = {
    search: '',
    loadingSearchResults: false,
    searchResults: [],
    loadingCenterPlace: true,
    centerPlace: null,
    selectedLocation: null,
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
    this.setState({ selectedLocation: place });
  };

  navigateBack() {
    Navigation.pop(this.props.componentId);
  }

  onComplete = () => {
    this.props.onComplete(this.state.selectedLocation);
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
            zoomEnabled={!this.state.selectedLocation}
            scrollEnabled={!this.state.selectedLocation}
          >
            <MapboxGL.Camera
              ref={c => (this.camera = c)}
              defaultSettings={{
                centerCoordinate: this.props.defaultCoordinates,
                zoomLevel: 13,
              }}
            />
          </MapboxGL.MapView>
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
        </MapWrapper>
        {!this.state.selectedLocation && (
          <SearchWrapper>
            <InputLabel>Find a location</InputLabel>
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
          {this.state.selectedLocation ? (
            <InsideWrapper>
              <Card>
                <Row>
                  <View style={{ width: Screen.width - 110 }}>
                    <Text numberOfLines={1} ellipsizeMode="tail">
                      {this.state.selectedLocation.name}
                    </Text>
                    <Label>
                      {this.state.selectedLocation.coordinates
                        .map(coordinate => coordinate.toFixed(3))
                        .join(', ')}
                    </Label>
                  </View>
                  <TouchableOpacity onPress={() => this.setState({ selectedLocation: null })}>
                    <Icon source={require('assets/delete.png')} />
                  </TouchableOpacity>
                </Row>
              </Card>
            </InsideWrapper>
          ) : (
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
              {this.state.search.length > 0 &&
                !this.state.loadingSearchResults &&
                this.state.searchResults.length === 0 && <EmptyText>No locations found</EmptyText>}
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
          {this.state.selectedLocation && (
            <View style={{ width: '100%', paddingHorizontal: 20 }}>
              <Button text="Confirm" onPress={this.onComplete} />
            </View>
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

export default LocationPickerScreen;
