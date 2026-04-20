# Security Specification: FinTrack

## Data Invariants
1. A Transaction must belong to a valid Asset owned by the same user.
2. An Asset's `userId` must strictly match the authenticated user's `uid`.
3. User profile data is restricted to the owner.
4. DARFs are calculated by the system and can only be updated by the owner to change the status (PENDENTE -> PAGO).

## The "Dirty Dozen" Payloads (Denial Expected)
1. **Identity Spoofing**: Attempt to create an asset with `userId: 'someone_else_id'`.
2. **Resource Poisoning**: Create an asset with `ticker` as a 1MB string.
3. **Ghost Fields**: Add `isAdmin: true` to `UserProfile`.
4. **Invalid Transaction Type**: Create transaction with `type: 'HACK'`.
5. **Unauthorized Access**: User A tries to list Assets of User B.
6. **Immutable Field Change**: User tries to update `userId` of an existing Asset.
7. **Invalid ID**: Create document with ID containing invalid characters.
8. **Bypassing App Logic**: Attempt to update `amount` of a DARF directly from client.
9. **Email Spoofing**: Attempt to gain admin access with unverified email.
10. **Orphaned Writes**: Create a transaction for an asset that doesn't exist.
11. **Excessive List Retrieval**: Attempt to list all transactions without a userId limit.
12. **PII Leak**: Non-owner attempts to 'get' a UserProfile.

## Test Runner (Draft Logic)
- `it('should deny creating asset for another user', ...)`
- `it('should deny updating averagePrice without valid schema', ...)`
- `it('should allow owner to read their own darfs', ...)`
