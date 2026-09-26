/**
 * Reference-data domain services (Task 3): Manufacturer, Nature, HCC,
 * Condition_Code.
 *
 * Pure domain logic over the store-agnostic Repository interface. Enforces the
 * field-length and mandatory-field rules (Req 2.1–2.5, 2.9), case-insensitive
 * duplicate detection (Req 2.8), the reference-in-use deletion guard (Req 2.6),
 * and the constrained selectable-values lookup for the item editor (Req 2.7).
 */

import type { Repository, ReferenceType } from "./repository.js";
import {
  type ConditionCode,
  type Hcc,
  type Manufacturer,
  type Nature,
  type Result,
  type FieldError,
  err,
  ok,
} from "./types.js";
import { validationError } from "./validation.js";

// --- Field length bounds (Req 2.1, 2.3, 2.4, 2.5, 2.9) --------------------

export const MANUFACTURER_NAME_MAX = 200;
export const MANUFACTURER_COUNTRY_MAX = 100;
export const MANUFACTURER_OPTIONAL_MAX = 200; // addr1/addr2/city/state/postalCode
export const NATURE_NAME_MAX = 200;
export const CODE_MAX = 50; // HCC code, Condition_Code code
export const DESCRIPTION_MAX = 500; // HCC/Condition_Code description

/** ID generator injected for testability (defaults to crypto.randomUUID). */
export type IdGen = () => string;
const defaultIdGen: IdGen = () => crypto.randomUUID();

// --- Helpers ---------------------------------------------------------------

function len(v: string | undefined): number {
  return v === undefined ? 0 : v.length;
}

function requireNonEmpty(
  value: string | undefined,
  field: string,
  max: number,
): FieldError[] {
  if (value === undefined || value.trim().length === 0) {
    return [{ field, reason: `${field} is required` }];
  }
  if (value.length > max) {
    return [{ field, reason: `${field} must be at most ${max} characters` }];
  }
  return [];
}

function checkOptionalMax(
  value: string | undefined,
  field: string,
  max: number,
): FieldError[] {
  if (value !== undefined && value.length > max) {
    return [{ field, reason: `${field} must be at most ${max} characters` }];
  }
  return [];
}

// --- Input shapes -----------------------------------------------------------

export interface ManufacturerInput {
  name?: string | undefined;
  country?: string | undefined;
  addr1?: string | undefined;
  addr2?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  postalCode?: string | undefined;
}

export interface CodedInput {
  code?: string | undefined;
  description?: string | undefined;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export class ReferenceDataService {
  constructor(
    private readonly repo: Repository,
    private readonly idGen: IdGen = defaultIdGen,
  ) {}

  // --- Manufacturer (Req 2.1, 2.2, 2.8, 2.9) ---
  async createManufacturer(input: ManufacturerInput): Promise<Result<Manufacturer>> {
    const fields: FieldError[] = [
      ...requireNonEmpty(input.name, "name", MANUFACTURER_NAME_MAX),
      ...requireNonEmpty(input.country, "country", MANUFACTURER_COUNTRY_MAX),
      ...checkOptionalMax(input.addr1, "addr1", MANUFACTURER_OPTIONAL_MAX),
      ...checkOptionalMax(input.addr2, "addr2", MANUFACTURER_OPTIONAL_MAX),
      ...checkOptionalMax(input.city, "city", MANUFACTURER_OPTIONAL_MAX),
      ...checkOptionalMax(input.state, "state", MANUFACTURER_OPTIONAL_MAX),
      ...checkOptionalMax(input.postalCode, "postalCode", MANUFACTURER_OPTIONAL_MAX),
    ];
    if (fields.length > 0) return err(validationError(fields));

    const dup = await this.findDuplicateByName(
      await this.repo.listManufacturers(),
      input.name!,
    );
    if (dup) return duplicateError("manufacturer", input.name!);

    const record: Manufacturer = {
      id: this.idGen(),
      name: input.name!,
      country: input.country!,
      ...(input.addr1 !== undefined ? { addr1: input.addr1 } : {}),
      ...(input.addr2 !== undefined ? { addr2: input.addr2 } : {}),
      ...(input.city !== undefined ? { city: input.city } : {}),
      ...(input.state !== undefined ? { state: input.state } : {}),
      ...(input.postalCode !== undefined ? { postalCode: input.postalCode } : {}),
    };
    await this.repo.putManufacturer(record);
    return ok(record);
  }

  // --- Nature (Req 2.3, 2.8, 2.9) ---
  async createNature(name: string | undefined): Promise<Result<Nature>> {
    const fields = requireNonEmpty(name, "name", NATURE_NAME_MAX);
    if (fields.length > 0) return err(validationError(fields));

    const dup = await this.findDuplicateByName(await this.repo.listNatures(), name!);
    if (dup) return duplicateError("nature", name!);

    const record: Nature = { id: this.idGen(), name: name! };
    await this.repo.putNature(record);
    return ok(record);
  }

  // --- HCC (Req 2.5, 2.8, 2.9) ---
  async createHcc(input: CodedInput): Promise<Result<Hcc>> {
    const fields: FieldError[] = [
      ...requireNonEmpty(input.code, "code", CODE_MAX),
      ...requireNonEmpty(input.description, "description", DESCRIPTION_MAX),
    ];
    if (fields.length > 0) return err(validationError(fields));

    const dup = await this.findDuplicateByCode(await this.repo.listHccs(), input.code!);
    if (dup) return duplicateError("hcc", input.code!);

    const record: Hcc = { code: input.code!, description: input.description! };
    await this.repo.putHcc(record);
    return ok(record);
  }

  // --- Condition_Code (Req 2.4, 2.8, 2.9; carries serviceable flag) ---
  async createConditionCode(
    input: CodedInput & { serviceable?: boolean },
  ): Promise<Result<ConditionCode>> {
    const fields: FieldError[] = [
      ...requireNonEmpty(input.code, "code", CODE_MAX),
      ...requireNonEmpty(input.description, "description", DESCRIPTION_MAX),
    ];
    if (fields.length > 0) return err(validationError(fields));

    const dup = await this.findDuplicateByCode(
      await this.repo.listConditionCodes(),
      input.code!,
    );
    if (dup) return duplicateError("conditionCode", input.code!);

    const record: ConditionCode = {
      code: input.code!,
      description: input.description!,
      serviceable: input.serviceable ?? false,
    };
    await this.repo.putConditionCode(record);
    return ok(record);
  }

  // --- Deletion guarded by reference-in-use (Req 2.6) ---
  async deleteReference(
    type: ReferenceType,
    key: string,
  ): Promise<Result<void>> {
    const count = await this.repo.countItemsReferencing(type, key);
    if (count > 0) {
      return err({
        code: "CONFLICT",
        message: `Cannot delete ${type} '${key}': referenced by ${count} ammunition item(s)`,
      });
    }
    switch (type) {
      case "manufacturer":
        await this.repo.deleteManufacturer(key);
        break;
      case "nature":
        await this.repo.deleteNature(key);
        break;
      case "hcc":
        await this.repo.deleteHcc(key);
        break;
      case "conditionCode":
        await this.repo.deleteConditionCode(key);
        break;
    }
    return ok(undefined);
  }

  // --- Constrained selectable values for the item editor (Req 2.7) ---
  async selectableValues(): Promise<{
    manufacturers: Manufacturer[];
    natures: Nature[];
    hccs: Hcc[];
    conditionCodes: ConditionCode[];
  }> {
    const [manufacturers, natures, hccs, conditionCodes] = await Promise.all([
      this.repo.listManufacturers(),
      this.repo.listNatures(),
      this.repo.listHccs(),
      this.repo.listConditionCodes(),
    ]);
    return { manufacturers, natures, hccs, conditionCodes };
  }

  // --- Duplicate detection (case-insensitive, Req 2.8) ---
  private async findDuplicateByName<T extends { name: string }>(
    existing: T[],
    name: string,
  ): Promise<T | undefined> {
    const key = name.trim().toLowerCase();
    return existing.find((e) => e.name.trim().toLowerCase() === key);
  }

  private async findDuplicateByCode<T extends { code: string }>(
    existing: T[],
    code: string,
  ): Promise<T | undefined> {
    const key = code.trim().toLowerCase();
    return existing.find((e) => e.code.trim().toLowerCase() === key);
  }
}

function duplicateError<T>(type: string, key: string): Result<T> {
  return err({
    code: "CONFLICT",
    message: `A ${type} with the same ${type === "hcc" || type === "conditionCode" ? "code" : "name"} '${key}' already exists`,
  });
}

