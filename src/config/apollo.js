// @flow
import React from 'react';
import { ApolloClient } from 'apollo-client';
import { HttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloProvider } from 'react-apollo';

import { API_URL } from 'config/api';

const authClient = new ApolloClient({
  link: new HttpLink({ uri: `${API_URL}/auth` }),
  cache: new InMemoryCache(),
});

const AuthProvider = (props: { children: any }) => (
  <ApolloProvider client={authClient} store={authClient.store}>
    {props.children}
  </ApolloProvider>
);

export { AuthProvider, authClient };
