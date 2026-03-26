# Talkaris product architecture

## Product surfaces

- Marketing website and public pages
- Portal for tenant and superadmin operations
- Public website widget
- Knowledge ingestion pipeline
- Messaging channels

## Product flow

1. A tenant creates a bot/project.
2. The tenant connects a public website.
3. Talkaris provisions canonical ingestion for that website.
4. The tenant pastes the returned snippet.
5. Visitors talk to the widget.
6. The same answer policy is reused by channels.
7. Leads, ratings, handovers and analytics feed the portal.

## Design constraint

Talkaris should feel simple from the outside:

- connect website
- let Talkaris ingest
- paste one snippet

Everything else is an advanced capability layered on top of that default path.
