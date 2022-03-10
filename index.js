// @flow
import registerScreens from 'screens';
import startTheApp, { startLogin } from 'index';

import AsyncStorage from '@react-native-community/async-storage';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { setContext } from 'apollo-link-context';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import QueueLink from 'apollo-link-queue';
import { RetryLink } from 'apollo-link-retry';
import SerializingLink from 'apollo-link-serialize';
import { persistCache, AsyncStorageWrapper } from 'apollo3-cache-persist';

import { API_URL } from 'config/api';

const main = async () => {
  const MiddlewareLink = setContext(async () => {
    const token = await AsyncStorage.getItem('jwtToken');

    return { headers: { Authorization: token } };
  });

  const LoggerLink = new ApolloLink((operation, forward) =>
    forward(operation).map(result => result),
  );

  // error - use your error lib here
  const ErrorLink = onError(({ graphQLErrors, networkError }) => {
    if (graphQLErrors) {
      graphQLErrors.map(({ message, locations, path }) =>
        console.log(`[GraphQL Error] Message: ${message}, Location: ${locations}, Path: ${path}`),
      );
    }

    if (networkError) console.log(`[Network error] ${networkError}`);
    if (networkError && networkError.statusCode === 401) {
      // remove cached token on 401 from the server
      AsyncStorage.removeItem('jwtToken');
      startLogin();
    }
  });
  const cache = new InMemoryCache();

  await persistCache({
    cache,
    storage: new AsyncStorageWrapper(AsyncStorage),
  });

  const queueLink = new QueueLink();
  const retryLink = new RetryLink();
  const serializingLink = new SerializingLink();

  const client = new ApolloClient({
    link: ApolloLink.from([
      serializingLink,
      MiddlewareLink,
      LoggerLink,
      ErrorLink,
      new HttpLink({ uri: `${API_URL}/graphql` }),
      queueLink,
      retryLink,
    ]),
    cache,
  });

  registerScreens(client);
  startTheApp();
};

main();
