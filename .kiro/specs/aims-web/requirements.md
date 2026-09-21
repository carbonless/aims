# Requirements Document

## Introduction

The Ammunition Information Management System (AIMS) is a web application for managing ammunition
stockpiles in alignment with the International Ammunition Technical Guidelines (IATG), specifically
IATG-03.10 (Inventory Management) and IATG-01.40. AIMS provides accountable, safety-focused tracking
of ammunition items across multiple explosive storehouses, including quantity accounting, hazard
classification, Net Explosive Quantity (NEQ) tracking, serviceability condition tracking, ban and
restriction handling, reference-data management, and a full audit trail of stock movements.

This document defines requirements for the first version (v1) of AIMS as a greenfield, multi-site
web application. Scope covers: ammunition inventory tracking, manufacturer and reference-data
management, hazard classification and NEQ tracking, explosive storehouse (ESH) management with safety
limits, condition/serviceability tracking, ban/restriction management, IATG-aligned reporting and
inventory accounting, role-based user access, and an audit trail of stock movements (receipts,
issues, transfers, disposals).

## Glossary

- **AIMS**: The Ammunition Information Management System; the web application described by this document.
- **Ammunition_Item**: A tracked stock record representing a quantity of ammunition of a single Nature, Manufacturer, and lot/batch Identifier, stored in one Explosive_Storehouse.
- **Identifier**: The lot or batch number uniquely identifying an Ammunition_Item's production lot (e.g., "AGU19D034-002").
- **Manufacturer**: The producer of an ammunition item, holding name and address reference data.
- **Nature**: The reference category or type classification of ammunition.
- **NEQ**: Net Explosive Quantity; the mass of explosive content used for safety and storage-limit calculations, expressed in kilograms.
- **HCC**: Hazard Classification Code; the UN hazard division and compatibility code assigned to an item (e.g., "1.1", "1.4").
- **ESH** / **Explosive_Storehouse**: An Explosive Storehouse; a physical storage location for ammunition with a defined NEQ safety limit.
- **Condition_Code**: A serviceability status code (A–G) describing an item's condition per IATG condition classification.
- **Ban_Status**: A flag (banned or not banned) indicating whether an Ammunition_Item is restricted from issue or movement, with accompanying Ban_Text.
- **Stock_Movement**: A recorded transaction that changes inventory, of type receipt, issue, transfer, or disposal.
- **Inventory_Manager**: A user role responsible for creating, updating, and moving ammunition stock.
- **Safety_Officer**: A user role responsible for hazard classification, NEQ limits, and ban management.
- **Auditor**: A user role with read-only access to inventory data, movements, and audit trail.
- **Administrator**: A user role that manages users, roles, and reference data.
- **Audit_Trail**: An append-only record of user actions and stock movements.
- **NEQ_Limit**: The maximum permitted aggregate NEQ that may be stored in a given Explosive_Storehouse.

## Requirements

### Requirement 1: Ammunition Inventory Management

**User Story:** As an Inventory_Manager, I want to create and maintain ammunition stock records, so that the stockpile is accurately accounted for.

#### Acceptance Criteria

1. WHEN an Inventory_Manager submits a new ammunition record with a Manufacturer, a Nature, an Identifier of 1 to 64 characters, a Quantity that is an integer from 0 to 999,999,999, an NEQ that is a number from 0 to 999,999.99 kilograms, an HCC, a Condition_Code, and an Explosive_Storehouse, THE AIMS SHALL create an Ammunition_Item and assign a unique ammunition identifier.
2. IF an Inventory_Manager submits a new ammunition record that is missing a Manufacturer, a Nature, an Identifier, a Quantity, or an Explosive_Storehouse, THEN THE AIMS SHALL reject the submission, create no Ammunition_Item, and return a message naming each missing field.
3. IF an Inventory_Manager submits a Quantity that is less than zero or greater than 999,999,999, THEN THE AIMS SHALL reject the submission, create no Ammunition_Item, and return a validation error indicating the permitted Quantity range.
4. IF an Inventory_Manager submits a Quantity that is not an integer numeric value, THEN THE AIMS SHALL reject the submission, create no Ammunition_Item, and return a validation error indicating that Quantity must be a whole number.
5. IF an Inventory_Manager submits an NEQ that is less than zero or greater than 999,999.99 kilograms, THEN THE AIMS SHALL reject the submission, create no Ammunition_Item, and return a validation error indicating the permitted NEQ range.
6. WHEN an Inventory_Manager updates an existing Ammunition_Item with values that satisfy the Quantity and NEQ bounds, THE AIMS SHALL persist the updated values and record the change in the Audit_Trail.
7. IF an Inventory_Manager requests an update to an Ammunition_Item that does not exist, THEN THE AIMS SHALL reject the update, change no stored data, and return a message indicating that the Ammunition_Item was not found.
8. WHEN an Inventory_Manager requests a list of Ammunition_Items, THE AIMS SHALL return the matching items with Manufacturer, Nature, Identifier, Quantity, NEQ, HCC, Condition_Code, Ban_Status, and Explosive_Storehouse.
9. WHERE search filters for Manufacturer, Nature, Explosive_Storehouse, Condition_Code, or Identifier are provided, THE AIMS SHALL return only the Ammunition_Items matching all provided filters.
10. WHEN an Inventory_Manager requests deletion of an Ammunition_Item that has a Quantity of zero, THE AIMS SHALL remove the item and record the deletion in the Audit_Trail.
11. IF an Inventory_Manager requests deletion of an Ammunition_Item that has a Quantity greater than zero, THEN THE AIMS SHALL reject the deletion, retain the item unchanged, and return a message stating that stock must be disposed or transferred before deletion.

### Requirement 2: Manufacturer and Reference Data Management

**User Story:** As an Administrator, I want to manage manufacturers and reference data, so that ammunition records use consistent, valid classifications.

#### Acceptance Criteria

1. WHEN an Administrator submits a Manufacturer with a non-empty name (1 to 200 characters) and a non-empty country (1 to 100 characters), THE AIMS SHALL create a Manufacturer record storing name, address line 1, address line 2, city, state or province, postal code, and country, where name and country are mandatory and all remaining fields are optional and each limited to a maximum of 200 characters.
2. IF an Administrator submits a Manufacturer with a missing or empty name, or a missing or empty country, THEN THE AIMS SHALL reject the submission, retain no new record, and return a validation error indicating which mandatory field is missing.
3. WHEN an Administrator creates a Nature record with a name (1 to 200 characters), THE AIMS SHALL store the Nature as reference data available for selection on Ammunition_Items.
4. WHEN an Administrator creates a Condition_Code record with a code (1 to 50 characters) and a description (1 to 500 characters), THE AIMS SHALL store the Condition_Code as reference data available for selection on Ammunition_Items.
5. WHEN an Administrator creates an HCC record with a code (1 to 50 characters) and a description (1 to 500 characters), THE AIMS SHALL store the HCC as reference data available for selection on Ammunition_Items.
6. IF an Administrator requests deletion of a reference-data record that is referenced by at least one Ammunition_Item, THEN THE AIMS SHALL reject the deletion, retain the record unchanged, and return a message identifying the number of referencing Ammunition_Items.
7. WHEN an Inventory_Manager selects a Manufacturer, a Nature, a Condition_Code, or an HCC while editing an Ammunition_Item, THE AIMS SHALL restrict the available values to existing reference-data records.
8. IF an Administrator submits a Manufacturer or Nature with a name that matches an existing record of the same type (case-insensitive), or a Condition_Code or HCC with a code that matches an existing record of the same type (case-insensitive), THEN THE AIMS SHALL reject the submission, retain no new record, and return a validation error indicating a duplicate exists.
9. IF an Administrator submits any Manufacturer or reference-data field whose length exceeds its defined maximum, THEN THE AIMS SHALL reject the submission, retain no new record, and return a validation error identifying the field that exceeds its length limit.

### Requirement 3: Hazard Classification and NEQ Tracking

**User Story:** As a Safety_Officer, I want hazard classification and NEQ recorded for every item, so that storage safety can be assessed.

#### Acceptance Criteria

1. WHEN an Ammunition_Item is created or updated, THE AIMS SHALL require an HCC value that matches an existing entry in the HCC reference data.
2. IF an Ammunition_Item is created or updated with an HCC value that is missing or does not match an existing entry in the HCC reference data, THEN THE AIMS SHALL reject the submission, return a validation error indicating the HCC value is invalid, and leave the Ammunition_Item record unchanged.
3. WHEN an Ammunition_Item is created or updated, THE AIMS SHALL require an NEQ value expressed in kilograms that is greater than or equal to 0.00 and less than or equal to 999,999.99, recorded to a precision of two decimal places.
4. IF an NEQ value is submitted that is negative, non-numeric, missing, or exceeds 999,999.99, THEN THE AIMS SHALL reject the submission, return a validation error indicating the NEQ value is invalid, and leave the Ammunition_Item record unchanged.
5. WHEN a Safety_Officer requests the aggregate NEQ for an Explosive_Storehouse, THE AIMS SHALL return the sum of each Ammunition_Item's NEQ multiplied by that item's Quantity for all items stored in that Explosive_Storehouse, expressed in kilograms to two decimal places.
6. WHEN a Safety_Officer requests the aggregate NEQ or NEQ breakdown for an Explosive_Storehouse that contains no Ammunition_Items, THE AIMS SHALL return an aggregate NEQ of 0.00 kilograms.
7. WHEN a Safety_Officer requests an NEQ breakdown for an Explosive_Storehouse, THE AIMS SHALL return the aggregate NEQ grouped by HCC, expressed in kilograms to two decimal places.

### Requirement 4: Explosive Storehouse Management and Safety Limits

**User Story:** As a Safety_Officer, I want to manage explosive storehouses and their NEQ limits, so that storage stays within safe capacity.

#### Acceptance Criteria

1. WHEN an Administrator submits an Explosive_Storehouse with a name between 1 and 100 characters and an NEQ_Limit between 0 and 999,999,999.99 kg inclusive, THE AIMS SHALL create an Explosive_Storehouse record storing name, street, city, state or province, postal code, country, and NEQ_Limit.
2. IF an Administrator submits an NEQ_Limit that is non-numeric, empty, less than 0, or greater than 999,999,999.99 kg, THEN THE AIMS SHALL reject the submission, return a validation error indicating the NEQ_Limit is out of the allowed range or invalid, and SHALL NOT persist the Explosive_Storehouse record.
3. IF an Administrator submits an Explosive_Storehouse name that is empty, exceeds 100 characters, or duplicates the name of an existing Explosive_Storehouse, THEN THE AIMS SHALL reject the submission, return a validation error indicating the name is empty, too long, or a duplicate, and SHALL NOT persist the Explosive_Storehouse record.
4. WHEN a Stock_Movement would cause the aggregate NEQ of an Explosive_Storehouse to exceed its NEQ_Limit, THE AIMS SHALL record the Stock_Movement and return a warning stating the resulting aggregate NEQ and the NEQ_Limit.
5. WHEN a Safety_Officer views an Explosive_Storehouse, THE AIMS SHALL display the aggregate NEQ, the NEQ_Limit, and the remaining NEQ capacity calculated as NEQ_Limit minus the aggregate NEQ.
6. WHERE an Explosive_Storehouse holds ammunition with two or more distinct HCC values, THE AIMS SHALL display a mixed hazard classification indicator that lists each distinct HCC value present on the storehouse view.

### Requirement 5: Condition and Serviceability Tracking

**User Story:** As an Inventory_Manager, I want to record and change the serviceability condition of ammunition, so that only serviceable stock is issued.

#### Acceptance Criteria

1. WHEN an Ammunition_Item is created or updated, THE AIMS SHALL require a Condition_Code that matches an entry in the existing Condition_Code reference data.
2. IF an Ammunition_Item is submitted for create or update with a missing Condition_Code or a Condition_Code that does not match any entry in the Condition_Code reference data, THEN THE AIMS SHALL reject the operation, retain the previously stored values without change, and return an error indication identifying the invalid or missing Condition_Code.
3. WHEN an Inventory_Manager changes the Condition_Code of an Ammunition_Item, THE AIMS SHALL persist the new Condition_Code and record an Audit_Trail entry containing the Ammunition_Item identifier, the previous Condition_Code, the new Condition_Code, the acting Inventory_Manager identifier, and the change timestamp.
4. WHERE a Condition_Code filter is applied to an Ammunition_Item query, THE AIMS SHALL return only Ammunition_Items whose stored Condition_Code equals the selected Condition_Code.
5. IF an issue operation is requested for an Ammunition_Item whose Condition_Code is not designated as serviceable in the Condition_Code reference data, THEN THE AIMS SHALL reject the issue operation and return an error indication that the Ammunition_Item is not serviceable.

### Requirement 6: Ban and Restriction Management

**User Story:** As a Safety_Officer, I want to place and remove bans on ammunition, so that restricted stock is not issued or transferred.

#### Acceptance Criteria

1. WHEN a Safety_Officer applies a ban to an Ammunition_Item whose Ban_Status is not banned with a Ban_Text of 1 to 500 characters, THE AIMS SHALL set the item's Ban_Status to banned, store the Ban_Text, and record the action in the Audit_Trail with the acting Safety_Officer identity and timestamp.
2. IF a Safety_Officer applies a ban with a Ban_Text that is empty, contains only whitespace, or exceeds 500 characters, THEN THE AIMS SHALL reject the action, leave the item's Ban_Status unchanged, and return a message stating that a valid ban reason of 1 to 500 characters is required.
3. IF a Safety_Officer applies a ban to an Ammunition_Item whose Ban_Status is already banned, THEN THE AIMS SHALL reject the action, retain the existing Ban_Text and Ban_Status, and return a message indicating that the item is already banned.
4. IF an Inventory_Manager attempts to record an issue or transfer Stock_Movement for an Ammunition_Item whose Ban_Status is banned, THEN THE AIMS SHALL reject the Stock_Movement, leave the item's recorded stock quantity unchanged, and return a message containing the Ban_Text.
5. WHEN a Safety_Officer removes a ban from an Ammunition_Item whose Ban_Status is banned, THE AIMS SHALL set the item's Ban_Status to not banned and record the action in the Audit_Trail with the acting Safety_Officer identity and timestamp.
6. IF a Safety_Officer attempts to remove a ban from an Ammunition_Item whose Ban_Status is not banned, THEN THE AIMS SHALL reject the action, leave the item's Ban_Status unchanged, and return a message indicating that the item is not currently banned.

### Requirement 7: Stock Movement and Audit Trail

**User Story:** As an Inventory_Manager, I want to record receipts, issues, transfers, and disposals, so that quantity changes are traceable per IATG-03.10.

#### Acceptance Criteria

1. WHEN an Inventory_Manager records a receipt Stock_Movement for an Ammunition_Item with a quantity from 1 to 999,999,999, THE AIMS SHALL increase the item's Quantity by that quantity and append a Stock_Movement record to the Audit_Trail.
2. WHEN an Inventory_Manager records an issue or disposal Stock_Movement for an Ammunition_Item with a quantity from 1 to the item's current Quantity inclusive, THE AIMS SHALL decrease the item's Quantity by that quantity and append a Stock_Movement record to the Audit_Trail.
3. IF an Inventory_Manager records an issue, transfer, or disposal Stock_Movement with a quantity greater than the item's current Quantity, THEN THE AIMS SHALL reject the Stock_Movement, leave the item's Quantity unchanged, and return a message stating the available Quantity.
4. IF an Inventory_Manager records a Stock_Movement with a quantity that is zero, negative, or greater than 999,999,999, THEN THE AIMS SHALL reject the Stock_Movement, leave the item's Quantity unchanged, and return a message indicating the permitted quantity range is 1 to 999,999,999.
5. WHEN an Inventory_Manager records a transfer Stock_Movement of a quantity from 1 to the source Explosive_Storehouse stock inclusive from a source Explosive_Storehouse to a distinct destination Explosive_Storehouse, THE AIMS SHALL decrease the source stock and increase the destination stock by the transferred quantity and append a Stock_Movement record to the Audit_Trail.
6. IF an Inventory_Manager records a transfer Stock_Movement in which the source Explosive_Storehouse and destination Explosive_Storehouse are the same, THEN THE AIMS SHALL reject the Stock_Movement, leave both stocks unchanged, and return a message indicating source and destination must differ.
7. IF any part of a transfer Stock_Movement update fails after the source stock is decreased, THEN THE AIMS SHALL restore the source stock and destination stock to their values before the transfer and return a message indicating the transfer failed.
8. WHEN a Stock_Movement is recorded, THE AIMS SHALL store the acting user, the timestamp, the movement type, the quantity, and the affected Ammunition_Item in the Audit_Trail.
9. THE AIMS SHALL store Audit_Trail records as append-only entries that cannot be modified or deleted through the application.
10. WHEN an Auditor requests the Audit_Trail for an Ammunition_Item or an Explosive_Storehouse, THE AIMS SHALL return the matching Stock_Movement records ordered from most recent to oldest.
11. WHEN an Auditor requests the Audit_Trail for an Ammunition_Item or an Explosive_Storehouse that has no matching Stock_Movement records, THE AIMS SHALL return an empty result set and a message indicating no records were found.

### Requirement 8: Reporting and Inventory Accounting

**User Story:** As an Auditor, I want inventory and accounting reports, so that stockpile status can be verified against IATG-03.10 practices.

#### Acceptance Criteria

1. WHEN an Auditor requests a stockpile summary report, THE AIMS SHALL return total Quantity and aggregate NEQ grouped by Explosive_Storehouse within 10 seconds.
2. WHEN an Auditor requests a stockpile summary report, THE AIMS SHALL return total Quantity grouped by Nature and by Condition_Code within 10 seconds.
3. WHEN an Auditor requests a movement history report for a date range where the start date is less than or equal to the end date and the range does not exceed 366 days, THE AIMS SHALL return all Stock_Movement records with timestamps within that date range within 10 seconds.
4. IF an Auditor requests a report for a date range where the start date is later than the end date or the range exceeds 366 days, THEN THE AIMS SHALL reject the request, return an error indicating the date range is invalid, and retain the last valid report state without generating a report.
5. WHEN an Auditor requests a movement history report for a date range that matches zero Stock_Movement records, THE AIMS SHALL return an empty result set with an indication that no records match the date range.
6. WHERE an export format of CSV is selected, THE AIMS SHALL produce a downloadable file containing exactly one header row followed by one row per report record.
7. IF CSV export fails to produce the downloadable file, THEN THE AIMS SHALL abort the export, return an error indicating the export could not be completed, and retain the underlying report data unchanged.
8. WHEN an Auditor requests a ban report, THE AIMS SHALL return all Ammunition_Items whose Ban_Status is banned with their Ban_Text within 10 seconds.

### Requirement 9: User Access and Role-Based Authorization

**User Story:** As an Administrator, I want role-based access control, so that users can perform only actions permitted by their role.

#### Acceptance Criteria

1. IF a request is made to any inventory or reporting function without an authenticated session, THEN THE AIMS SHALL deny the request and return an authentication-required response indicating that authentication is needed, without executing the requested function.
2. WHEN an Administrator assigns a role of Inventory_Manager, Safety_Officer, Auditor, or Administrator to a user, THE AIMS SHALL grant that user the permissions defined for the assigned role and apply them to the user's next authenticated request.
3. IF a user with the Auditor role attempts to create, update, or delete an Ammunition_Item or Stock_Movement, THEN THE AIMS SHALL deny the request and return an authorization-denied response, leaving the target record unchanged.
4. IF a user without the Administrator role attempts to manage users or reference data, THEN THE AIMS SHALL deny the request and return an authorization-denied response, leaving the target record unchanged.
5. WHEN a user authenticates successfully, THE AIMS SHALL record the authentication event in the Audit_Trail with the user identifier and the timestamp.
6. WHEN a user performs an action that changes inventory, reference data, or bans, THE AIMS SHALL associate the acting user identifier with the resulting Audit_Trail record.
7. WHEN an Administrator revokes or changes a user's role, THE AIMS SHALL remove the permissions of the previous role and apply the updated permissions to the user's next authenticated request.
8. IF a user submits invalid authentication credentials, THEN THE AIMS SHALL deny the request, return an authentication-failed response, and record the failed authentication event in the Audit_Trail with the timestamp; and after 5 consecutive failed attempts THE AIMS SHALL lock the account for a minimum of 15 minutes.
9. IF an authenticated session remains inactive for 15 minutes, THEN THE AIMS SHALL expire the session and require re-authentication for any subsequent inventory or reporting request.
10. WHEN THE AIMS denies a request due to failed authorization, THE AIMS SHALL record the denied request in the Audit_Trail with the acting user identifier, the attempted action, and the timestamp.
