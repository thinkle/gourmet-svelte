import { Request } from './remoteRequest.js';
import { each, optional } from '../../utils/validator.js';

const apiToken = {
  _id: '',
  label: optional(''),
  scopes: [],
  tokenPreview: optional(''),
  createdAt: '',
  lastUsedAt: optional(''),
  revokedAt: optional(''),
};

export const listApiTokensRequest = Request({
  name: 'listApiTokens',
  requestDef: {},
  responseDef: {
    tokens: each(apiToken),
  },
});

export const createApiTokenRequest = Request({
  name: 'createApiToken',
  requestDef: {
    scopes: optional([]),
    label: optional(''),
  },
  responseDef: {
    token: '',
    tokenInfo: apiToken,
  },
});

export const revokeApiTokenRequest = Request({
  name: 'revokeApiToken',
  requestDef: {
    _id: '',
  },
  responseDef: {
    token: apiToken,
  },
});
