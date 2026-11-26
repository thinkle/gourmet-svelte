# S-6: Opt-in live shopping

Requested by the owner on 2026-11-25. The owner confirmed the required database
dump was complete before backend changes. This extends the shopping scope in
INVENTORY.md; it does not add invitations or a new family-sharing model.

## Experience and costs

The small two-arrow/check icon beside Shopping list opens an explanation and
an explicit toggle. Both shoppers enable live mode, use the same account or an
already-linked account, and open the same saved list. Starting needs a signed-in,
online session and a list with no unsynced ordinary edits.

Default off means zero live endpoint requests and no live polling timer. When
enabled, poll this list every five seconds only while the shopping tab is active,
the document is visible, the device is online, and initial library sync is done.
Checkmarks trigger an immediate request. Hidden/offline states cancel the timer;
returning to the screen or reconnecting refreshes immediately. Transient errors
back off to at most one attempt per minute; 401/403/404 pause until explicit retry.
Requests time out after 15 seconds. An already-started request can finish after
the screen becomes hidden, but no further request is scheduled there.

The enabled preference persists on this browser for this signed-in user,
effective linked account and list. Disable requires acknowledged pending actions;
leaving the screen or closing the browser never requires connectivity. Done
shopping stops live mode on both phones once each receives the confirmed trip
boundary, including the other phone's next poll/reconnect; neither keeps polling
after it has observed that the trip ended.

This first version shares cart checks and Done shopping. Other shopping edits
(recipes, loose items, pantry, aliases and aisles) pause while live mode is on.
Both phones must use live mode: ordinary offline whole-list saves, older clients
or MCP writes are outside this collaboration protocol and can overwrite live
state. The existing recipe REST API retains its exact semantics.

## Storage and protocol

A separate `GourmetLiveShopping` IndexedDB database stores a session document per
user/effective-account/list: enabled, last server snapshot, pending actions,
clientId, nextSeq and any stale-trip notice. Dexie read/write transactions retain
concurrent changes from tabs. Pending actions never become dirty recipe documents.
The view overlays them on the confirmed snapshot immediately. Storage failures
surface as errors; no successful check is shown until its local save completes.

The private Identity-authenticated `POST /.netlify/functions/live-shopping`
accepts `{listId}` to join/read or `{listId, action}` to mutate. It resolves the
effective account from the stored user's existing `linked` setting, enforces
owner/list/deleted filters, and never accepts an account from the request.
It deliberately does not accept API tokens or localuser headers. No-store JSON
responses contain `{recipe, staleTrip}` and omit images.

New optional shopping-list metadata:

```
liveShopping: {tripId: string, revision: number, seen: {[clientId]: sequence}}
```

An explicit join initializes metadata atomically. Cart actions carry type `cart`,
key, boolean on, tripId, clientId and monotonically increasing seq. Mongo atomically
adds/removes only that item and advances the client's watermark and list revision.
Retries and older sequence numbers cannot reapply an action. Conflicting changes
to one item from different phones use server arrival order; independent item
changes preserve both. No client-clock comparison or toggle operation is used.

A `done` action atomically empties cart/trip, changes tripId, clears watermarks,
and advances revision. Delayed actions from older trips are acknowledged as stale,
discarded locally, and explained visibly rather than applied to the next trip.
This includes uncertain retries of Done itself. Responses with older revisions
cannot replace newer stored snapshots. Confirmed snapshots alone update the
existing recipe cache, retaining local IDs/images and marking savedRemote=1.

## Verification

Use only in-memory MongoDB for backend tests and fake IndexedDB for app tests.
Cover concurrent checks, opposite changes, deduplication, stale sequences, trip
reset/retries, account isolation, linked accounts, malformed input, no-store and
image preservation. Exercise off/hidden zero polling, five-second cadence,
offline reload/outbox recovery, concurrent tabs, in-flight polls, backoff, auth
pause, disable with pending changes, account disposal and end-trip stop.

For the owner's trial: open the same list on two phones and enable live mode on
both. Check different items; confirm both appear within a polling interval.
Disconnect one phone, check an item, then reopen this screen after reconnecting.
Finally end the trip from one phone while the other has an offline pending check;
the old check must not reappear on the next trip. Disable live mode on both when
finished. Do not use other people's recipes for tests.

Implementation verification (2026-11-25): build and standalone function bundle
passed; 159 API tests passed with 2 existing skips; 157 app tests passed. Browser
checks used an isolated local fixture session at desktop and 390×844: readable
dialog, sign-in guard without a request, Escape dismissal, ordinary keyboard
checkbox behavior, no console errors and zero live endpoint calls while off.
The sandbox initially prevented in-memory Mongo from listening (`EPERM`);
baseline and updated contracts both passed with local listener permission.
Existing bundle-size and Jest mock/open-handle warnings were left untouched.
