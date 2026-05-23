# ASEP / SkillSwap+ Manual QA Checklist

Use this checklist before merging `backend` into `main`.

## Auth
- Register with a new email and confirm the default credits and welcome notification appear.
- Login with valid credentials, then refresh the page and confirm the session remains active.
- Attempt login with an invalid password and confirm the response is safe and non-specific.
- Logout and confirm protected views redirect or show the logged-out state.
- Confirm expired or malformed tokens cannot access profile, booking, credit, or notification routes.

## Sessions
- Create a valid future session.
- Confirm invalid category, short descriptions, past dates, and invalid time ranges are rejected.
- Confirm public marketplace lists only appropriate open sessions.
- Confirm a host cannot create overlapping sessions.

## Bookings
- As a learner, request a mentor session and confirm the booking appears as pending.
- Confirm duplicate booking attempts for the same active session are blocked.
- As mentor, accept the booking and confirm a Jitsi URL appears for both parties.
- Confirm accepting an already accepted booking does not duplicate participants or ledger entries.
- Complete an accepted booking and confirm the session moves to completed when appropriate.
- Cancel pending and accepted bookings and confirm repeated cancellation is idempotent.
- Confirm self-booking is blocked.

## Escrow
- Confirm credits are reserved from the learner at booking creation.
- Confirm reserved credits are not paid to the mentor until completion.
- Confirm completion releases exactly the reserved amount to the mentor.
- Confirm cancellation or rejection refunds exactly the reserved amount to the learner.
- Inspect transaction history for spend, earn, and refund entries with the correct booking reference.
- Confirm no duplicate ledger entries are created after repeated accept, complete, cancel, or reject actions.

## Reviews
- Confirm learners cannot review before their booking is completed.
- Confirm learners can review after completion.
- Confirm duplicate reviews for the same session are blocked.
- Confirm mentors cannot review themselves.
- Confirm mentor rating and rating count update after review submission.

## Notifications
- Confirm new booking, acceptance, completion, refund, and review notifications are created.
- Confirm notification pagination works on desktop and mobile.
- Confirm unread count changes after marking one notification as read.
- Confirm "mark all as read" updates the count to zero.
- Confirm notifications from one account are not visible or mutable by another account.

## Search
- Search by session title, skill category, tag, mentor name, offered skill, and wanted skill.
- Confirm short and empty searches return an empty result set without errors.
- Try regex-like and selector-like input such as `.*`, `$gt`, and brackets; confirm no crash and no broad data leak.
- Confirm result ordering favors exact and prefix matches.

## Mobile Responsiveness
- Verify landing, dashboard, marketplace, session, profile, settings, community, and notification center at 320px, 390px, 768px, and desktop widths.
- Confirm booking action buttons do not overlap text and remain tappable.
- Confirm modals and notification panels fit inside the viewport.

## Accessibility
- Navigate auth, marketplace, dashboard booking actions, and notification center by keyboard.
- Confirm focus indicators are visible.
- Confirm buttons expose useful labels and disabled/loading states.
- Confirm error and empty states are readable with screen reader semantics where applicable.
- Check color contrast for status badges, disabled buttons, and notification badges.

## Docker
- Run `docker compose up --build`.
- Confirm Mongo replica set initializes and the API starts without transaction topology errors.
- Confirm frontend can reach backend through the configured API path.
- Create a booking through the Docker stack and complete the escrow flow.
- Stop and restart the stack and confirm data persists as expected.

## CI
- Confirm GitHub Actions runs backend tests, frontend build, and Docker image builds.
- Confirm test output clearly identifies failing suites.
- Confirm no production secrets are required for test execution.
- Confirm CI uses a transaction-capable Mongo replica set.

## Deployment Readiness
- Confirm production environment variables are strong and explicit.
- Confirm `CLIENT_URL` is not wildcarded in production.
- Confirm hosted frontend sets `VITE_API_URL` when it is not served from the same origin as the API.
- Confirm refresh cookie settings match the deployed HTTPS domain.
- Confirm logs include request IDs and no sensitive tokens or passwords.
- Confirm rate limiting, validation, and JSON error responses behave correctly under bad input.
- Confirm [../../docs/PRODUCTION_READINESS.md](../../docs/PRODUCTION_READINESS.md) is completed before merging to `main`.
