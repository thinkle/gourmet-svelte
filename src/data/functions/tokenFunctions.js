import crypto from 'crypto';
import { ObjectId } from 'mongodb';
import { insertOne, queryCollection, updateOne, getOne } from './mongoConnect.js';
import {
  createApiTokenRequest,
  listApiTokensRequest,
  revokeApiTokenRequest,
} from '../requests/index.js';

const TOKEN_COLLECTION = 'api_tokens';
const TOKEN_PREFIX_LENGTH = 6;
const TOKEN_SUFFIX_LENGTH = 4;
const DEFAULT_SCOPES = ['recipes:read', 'recipes:write'];

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function makeToken() {
  return crypto.randomBytes(32).toString('hex');
}

function makeTokenPreview(token) {
  const prefix = token.slice(0, TOKEN_PREFIX_LENGTH);
  const suffix = token.slice(-TOKEN_SUFFIX_LENGTH);
  return `${prefix}...${suffix}`;
}

function getOwnerEmail(user) {
  return user && (user.account || user.email);
}

function sanitizeTokenDoc(tokenDoc) {
  if (!tokenDoc) {
    return tokenDoc;
  }
  const { tokenHash, createdAt, lastUsedAt, revokedAt, _id, ...rest } = tokenDoc;
  const safe = {
    ...rest,
    _id: _id ? _id.toString() : '',
    createdAt: createdAt ? createdAt.toISOString() : '',
  };
  if (lastUsedAt) {
    safe.lastUsedAt = lastUsedAt.toISOString();
  }
  if (revokedAt) {
    safe.revokedAt = revokedAt.toISOString();
  }
  return safe;
}

function normalizeId(id) {
  if (!id) {
    return null;
  }
  if (typeof id === 'string') {
    return new ObjectId(id);
  }
  return id;
}

export async function createApiToken(user, params = {}) {
  const ownerEmail = getOwnerEmail(user);
  if (!ownerEmail) {
    throw new Error('Missing user for token creation.');
  }
  const scopes =
    Array.isArray(params.scopes) && params.scopes.length
      ? params.scopes
      : DEFAULT_SCOPES;
  const label = params.label || '';
  const token = makeToken();
  const now = new Date();
  const tokenDoc = {
    ownerEmail,
    label,
    scopes,
    tokenHash: hashToken(token),
    tokenPreview: makeTokenPreview(token),
    createdAt: now,
    lastUsedAt: null,
    revokedAt: null,
  };
  const saved = await insertOne(TOKEN_COLLECTION, tokenDoc);
  return {
    token,
    tokenInfo: sanitizeTokenDoc(saved),
  };
}
createApiTokenRequest.setRequestHandler(createApiToken);

export async function listApiTokens(user) {
  const ownerEmail = getOwnerEmail(user);
  if (!ownerEmail) {
    throw new Error('Missing user for token listing.');
  }
  const result = await queryCollection(
    TOKEN_COLLECTION,
    { ownerEmail },
    { sort: { createdAt: -1 } }
  );
  const tokens = (result.result || []).map(sanitizeTokenDoc);
  return { tokens };
}
listApiTokensRequest.setRequestHandler(listApiTokens);

export async function revokeApiToken(user, params = {}) {
  const ownerEmail = getOwnerEmail(user);
  if (!ownerEmail) {
    throw new Error('Missing user for token revoke.');
  }
  if (!params._id) {
    throw new Error('Missing token id.');
  }
  const tokenId = normalizeId(params._id);
  if (!tokenId) {
    throw new Error('Invalid token id.');
  }
  const revoked = await updateOne(
    TOKEN_COLLECTION,
    { _id: tokenId, ownerEmail },
    { $set: { revokedAt: new Date() } }
  );
  return { token: sanitizeTokenDoc(revoked) };
}
revokeApiTokenRequest.setRequestHandler(revokeApiToken);

export async function getUserFromApiToken(rawToken) {
  if (!rawToken) {
    return null;
  }
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await getOne(TOKEN_COLLECTION, {
    tokenHash,
    revokedAt: null,
  });
  if (!tokenDoc) {
    return null;
  }
  const ownerEmail = tokenDoc.ownerEmail;
  return {
    user: {
      email: ownerEmail,
      account: ownerEmail,
      scopes: tokenDoc.scopes || [],
      apiTokenId: tokenDoc._id,
      isApiToken: true,
    },
    token: tokenDoc,
  };
}

export async function touchApiToken(tokenId) {
  const normalizedId = normalizeId(tokenId);
  if (!normalizedId) {
    return;
  }
  await updateOne(
    TOKEN_COLLECTION,
    { _id: normalizedId },
    { $set: { lastUsedAt: new Date() } }
  );
}
