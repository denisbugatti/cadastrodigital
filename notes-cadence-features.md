# Cadence Features Implementation Plan

## 1. Filtro por cadência ativa
- Need to add `cadenceFilter` param to `responses.listByForm` procedure
- Options: "all" | "with_active_cadence" | "without_cadence"
- Implementation: LEFT JOIN emailCadence on responseId, filter by active=true
- OR: Client-side filter using the cadence data already fetched per response
- **Decision**: Client-side filter is simpler since CadencePanelInline already fetches per response
- BUT: that's N+1 queries. Better approach: add a new db function that returns response IDs with active cadences for a form, then filter client-side

## 2. Iniciar cadência manualmente
- `db.createEmailCadence` already exists
- Need a new tRPC procedure `cadence.startManual` that:
  - Takes responseId, cadenceType, and optional rejectionReason
  - Gets the response data (email, name)
  - Calls createEmailCadence
  - Logs activity
- Frontend: button in CadencePanelInline when no active cadence exists

## 3. Histórico de e-mails enviados
- Activity log has types: cadence_email_sent, cadence_started, cadence_stopped
- BUT cadence_email_sent is not being logged when advanceCadence is called!
- Need to add logActivity call in the processDue procedure after successful send
- For the UI: use activity.getTimeline filtered to email events
- OR: create a dedicated procedure that returns cadence history with email details

## Key findings:
- emailCadence table has: sequenceNumber, lastSentAt, createdAt
- advanceCadence does NOT log to activityLog - need to add this
- The processDue procedure in routers.ts is where emails are sent - need to add logActivity there
