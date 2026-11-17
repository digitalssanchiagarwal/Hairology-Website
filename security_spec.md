# HAIROLOGY Firestore Security Specification

## 1. Data Invariants
1. **Strict PII Isolation**: Customer names, phone numbers, and street addresses stored in `/orders/{orderId}` may ONLY be read, listed, updated, or deleted by a verified founder/admin (`email_verified == true` and authorized founder email or `/admins/{uid}` membership).
2. **Checkout Creation Integrity**: Newly created orders in `/orders/{orderId}` and `/orderStatuses/{orderId}` MUST begin strictly with `paymentStatus == 'PENDING'` and `orderStatus == 'PENDING_CONFIRMATION'`, with `discount == 0`, positive `total > 0`, bounded `items` (1–20), and server-enforced timestamps (`createdAt == request.time`, `updatedAt == request.time`). A customer can NEVER create an order pre-marked as `PAID` or `CONFIRMED`.
3. **Immutable Order History**: `id`, `createdAt`, `createdAtIso`, `customerPhone`, `deliveryAddress`, `items`, `subtotal`, `discount`, `shipping`, `total`, and `paymentMethod` are immutable after creation; only admin payment/delivery status updates are permitted.
4. **No Collection Scraping**: `allow list` on `/orders` is restricted to `isAdmin()`. `allow list` on `/orderStatuses` is completely disabled (`if false`).
5. **Email Verification Enforcement**: Admin checks verify `request.auth.token.email_verified == true` alongside exact email matching or `/admins/{uid}` existence.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated PII Read**: Unauthenticated client tries `get(/orders/HR-2026-1001)` -> `PERMISSION_DENIED`.
2. **Non-Admin List Scrape**: Signed-in non-admin user tries `list(/orders)` -> `PERMISSION_DENIED`.
3. **Public Status List Scrape**: Client tries `list(/orderStatuses)` -> `PERMISSION_DENIED`.
4. **Self-Confirmed PAID Bypass**: Customer attempts `create(/orders/HR-2026-1002)` with `paymentStatus: 'PAID'` -> `PERMISSION_DENIED`.
5. **Self-Confirmed Status Bypass**: Customer attempts `create(/orderStatuses/HR-2026-1002)` with `paymentStatus: 'PAID'` or `orderStatus: 'DELIVERED'` -> `PERMISSION_DENIED`.
6. **Shadow Ghost Field Injection**: Client sends extra key `isAdminApproved: true` on `create(/orders/HR-2026-1003)` -> `PERMISSION_DENIED` (`hasOnly` check).
7. **Unverified Admin Email Spoof**: Signed-in user with founder email but `email_verified: false` tries `list(/orders)` -> `PERMISSION_DENIED`.
8. **ID Poisoning Attack**: Client attempts `create(/orders/../../bad$id)` or 1.5KB junk ID -> `PERMISSION_DENIED` (`isValidId`).
9. **Resource Exhaustion / String Overflow**: Client sends 50KB string in `streetAddress` or `recipientName` -> `PERMISSION_DENIED` (`.size()` checks).
10. **Client-Forged Timestamp**: Client sends backdated `createdAt` instead of `serverTimestamp()` (`request.time`) -> `PERMISSION_DENIED`.
11. **Customer Payment Escalation Update**: Non-admin user tries `update(/orders/HR-2026-1001, { paymentStatus: 'PAID' })` -> `PERMISSION_DENIED`.
12. **Self-Assigned Admin Escalation**: Signed-in non-admin user tries `create(/admins/{uid}, { email: '...', role: 'founder' })` -> `PERMISSION_DENIED`.
