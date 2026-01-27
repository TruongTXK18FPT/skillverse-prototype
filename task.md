Draw a swimlane activity diagram for the main learner business flow of the Skillverse platform.

Purpose:
This diagram is for an early-stage project review with mentors, so the focus must be on business logic and user journey, not technical implementation.

Swimlanes (exactly 3 lanes, left to right):

Student (Learner)

Skillverse System

External Services

Style & visual requirements:

Clean, minimal, easy to scan

Similar to a typical business swimlane diagram

Each swimlane has a light background color

Use rounded rectangles for actions

Use diamond shapes for key decisions

Do NOT split frontend/backend

Do NOT show APIs, databases, or technical details

Flow scope (happy path + key decisions only):

Student accesses the platform

Logs in successfully

Browses available courses

Selects a course

Registers for the course

(If required) completes payment via external service

Starts learning the course

Completes lessons and required activities

Decision: course progress reaches 100%

Decision: certificate eligibility is met

System issues certificate

Student downloads the certificate

Decision points to include (but keep minimal):

Login successful?

Course registration successful?

Payment successful? (if applicable)

Course completed 100%?

Certificate eligible?

Important constraints:

Focus on what happens, not how it is implemented

One action box = one meaningful business step

Keep the diagram readable and not overly long

The final diagram should clearly communicate the end-to-end learner journey from login to certificate download at a business level.