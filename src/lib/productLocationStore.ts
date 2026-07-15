const STORAGE_KEY =
  "kitchenops-product-location-assignments";

const LOCATIONS_CHANGED_EVENT =
  "kitchenops-product-locations-changed";

export type ProductLocationAssignment = {
  id: string;

  siteId: string;
  siteName: string;

  storageAreaId: string;
  storageAreaName: string;

  productId: number;
  productName: string;

  isPrimary: boolean;
  sortOrder: number;

  createdAt: string;
  updatedAt: string;
};

function now(): string {
  return new Date().toISOString();
}

function createId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID ===
      "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function emitChanged(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(
      LOCATIONS_CHANGED_EVENT
    )
  );
}

function save(
  assignments: ProductLocationAssignment[]
): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(assignments)
  );

  emitChanged();
}

function normalise(
  value: Partial<ProductLocationAssignment>
): ProductLocationAssignment | null {
  if (
    !value.id ||
    !value.siteId ||
    !value.siteName ||
    !value.storageAreaId ||
    !value.storageAreaName ||
    !Number.isFinite(value.productId) ||
    !value.productName
  ) {
    return null;
  }

  return {
    id: value.id,

    siteId: value.siteId,
    siteName: value.siteName,

    storageAreaId:
      value.storageAreaId,

    storageAreaName:
      value.storageAreaName,

    productId:
      Number(value.productId),

    productName:
      value.productName,

    isPrimary:
      Boolean(value.isPrimary),

    sortOrder: Math.max(
      1,
      Number(value.sortOrder) || 1
    ),

    createdAt:
      value.createdAt || now(),

    updatedAt:
      value.updatedAt || now(),
  };
}

export function getProductLocationAssignments():
  ProductLocationAssignment[] {
  if (typeof window === "undefined") {
    return [];
  }

  const saved =
    window.localStorage.getItem(
      STORAGE_KEY
    );

  if (!saved) {
    return [];
  }

  try {
    const parsed: unknown =
      JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((value) =>
        normalise(
          value as Partial<ProductLocationAssignment>
        )
      )
      .filter(
        (
          value
        ): value is ProductLocationAssignment =>
          value !== null
      )
      .sort(
        (first, second) =>
          first.siteName.localeCompare(
            second.siteName
          ) ||
          first.storageAreaName.localeCompare(
            second.storageAreaName
          ) ||
          first.sortOrder -
            second.sortOrder ||
          first.productName.localeCompare(
            second.productName
          )
      );
  } catch {
    return [];
  }
}

export function getAssignmentsForSite(
  siteId: string
): ProductLocationAssignment[] {
  return getProductLocationAssignments().filter(
    (assignment) =>
      assignment.siteId ===
      siteId
  );
}

export function getAssignmentsForArea(
  storageAreaId: string
): ProductLocationAssignment[] {
  return getProductLocationAssignments()
    .filter(
      (assignment) =>
        assignment.storageAreaId ===
        storageAreaId
    )
    .sort(
      (first, second) =>
        first.sortOrder -
          second.sortOrder ||
        first.productName.localeCompare(
          second.productName
        )
    );
}

export function getAssignmentsForProduct(
  siteId: string,
  productId: number
): ProductLocationAssignment[] {
  return getProductLocationAssignments()
    .filter(
      (assignment) =>
        assignment.siteId ===
          siteId &&
        assignment.productId ===
          productId
    )
    .sort(
      (first, second) =>
        Number(second.isPrimary) -
          Number(first.isPrimary) ||
        first.sortOrder -
          second.sortOrder
    );
}

export function assignProductToArea(
  input: {
    siteId: string;
    siteName: string;

    storageAreaId: string;
    storageAreaName: string;

    productId: number;
    productName: string;

    makePrimary?: boolean;
  }
): ProductLocationAssignment {
  const current =
    getProductLocationAssignments();

  const existing =
    current.find(
      (assignment) =>
        assignment.siteId ===
          input.siteId &&
        assignment.storageAreaId ===
          input.storageAreaId &&
        assignment.productId ===
          input.productId
    );

  if (existing) {
    throw new Error(
      "This product is already assigned to this storage area."
    );
  }

  const productAssignments =
    current.filter(
      (assignment) =>
        assignment.siteId ===
          input.siteId &&
        assignment.productId ===
          input.productId
    );

  const areaAssignments =
    current.filter(
      (assignment) =>
        assignment.storageAreaId ===
        input.storageAreaId
    );

  const shouldBePrimary =
    input.makePrimary === true ||
    productAssignments.length === 0;

  const timestamp = now();

  let updatedCurrent =
    current;

  if (shouldBePrimary) {
    updatedCurrent =
      current.map(
        (assignment) =>
          assignment.siteId ===
            input.siteId &&
          assignment.productId ===
            input.productId
            ? {
                ...assignment,
                isPrimary: false,
                updatedAt:
                  timestamp,
              }
            : assignment
      );
  }

  const assignment:
    ProductLocationAssignment = {
    id: createId(),

    siteId:
      input.siteId,

    siteName:
      input.siteName,

    storageAreaId:
      input.storageAreaId,

    storageAreaName:
      input.storageAreaName,

    productId:
      input.productId,

    productName:
      input.productName,

    isPrimary:
      shouldBePrimary,

    sortOrder:
      areaAssignments.reduce(
        (highest, assignment) =>
          Math.max(
            highest,
            assignment.sortOrder
          ),
        0
      ) + 1,

    createdAt:
      timestamp,

    updatedAt:
      timestamp,
  };

  save([
    ...updatedCurrent,
    assignment,
  ]);

  return assignment;
}

export function removeProductLocation(
  assignmentId: string
): void {
  const current =
    getProductLocationAssignments();

  const existing =
    current.find(
      (assignment) =>
        assignment.id ===
        assignmentId
    );

  if (!existing) {
    return;
  }

  let updated =
    current.filter(
      (assignment) =>
        assignment.id !==
        assignmentId
    );

  if (existing.isPrimary) {
    const replacement =
      updated
        .filter(
          (assignment) =>
            assignment.siteId ===
              existing.siteId &&
            assignment.productId ===
              existing.productId
        )
        .sort(
          (first, second) =>
            first.sortOrder -
            second.sortOrder
        )[0];

    if (replacement) {
      updated =
        updated.map(
          (assignment) =>
            assignment.id ===
            replacement.id
              ? {
                  ...assignment,
                  isPrimary: true,
                  updatedAt:
                    now(),
                }
              : assignment
        );
    }
  }

  save(updated);
}

export function setPrimaryLocation(
  assignmentId: string
): void {
  const current =
    getProductLocationAssignments();

  const selected =
    current.find(
      (assignment) =>
        assignment.id ===
        assignmentId
    );

  if (!selected) {
    return;
  }

  const timestamp = now();

  save(
    current.map(
      (assignment) =>
        assignment.siteId ===
          selected.siteId &&
        assignment.productId ===
          selected.productId
          ? {
              ...assignment,
              isPrimary:
                assignment.id ===
                selected.id,
              updatedAt:
                timestamp,
            }
          : assignment
    )
  );
}

export function moveProductWithinArea(
  assignmentId: string,
  direction: "up" | "down"
): void {
  const current =
    getProductLocationAssignments();

  const selected =
    current.find(
      (assignment) =>
        assignment.id ===
        assignmentId
    );

  if (!selected) {
    return;
  }

  const areaAssignments =
    current
      .filter(
        (assignment) =>
          assignment.storageAreaId ===
          selected.storageAreaId
      )
      .sort(
        (first, second) =>
          first.sortOrder -
          second.sortOrder
      );

  const index =
    areaAssignments.findIndex(
      (assignment) =>
        assignment.id ===
        assignmentId
    );

  const swapIndex =
    direction === "up"
      ? index - 1
      : index + 1;

  if (
    index < 0 ||
    swapIndex < 0 ||
    swapIndex >=
      areaAssignments.length
  ) {
    return;
  }

  const other =
    areaAssignments[
      swapIndex
    ];

  const timestamp = now();

  save(
    current.map(
      (assignment) => {
        if (
          assignment.id ===
          selected.id
        ) {
          return {
            ...assignment,
            sortOrder:
              other.sortOrder,
            updatedAt:
              timestamp,
          };
        }

        if (
          assignment.id ===
          other.id
        ) {
          return {
            ...assignment,
            sortOrder:
              selected.sortOrder,
            updatedAt:
              timestamp,
          };
        }

        return assignment;
      }
    )
  );
}

export function renameStorageAreaAssignments(
  storageAreaId: string,
  storageAreaName: string
): void {
  const current =
    getProductLocationAssignments();

  save(
    current.map(
      (assignment) =>
        assignment.storageAreaId ===
        storageAreaId
          ? {
              ...assignment,
              storageAreaName,
              updatedAt:
                now(),
            }
          : assignment
    )
  );
}

export function removeStorageAreaAssignments(
  storageAreaId: string
): void {
  const current =
    getProductLocationAssignments();

  const removing =
    current.filter(
      (assignment) =>
        assignment.storageAreaId ===
        storageAreaId
    );

  let updated =
    current.filter(
      (assignment) =>
        assignment.storageAreaId !==
        storageAreaId
    );

  removing
    .filter(
      (assignment) =>
        assignment.isPrimary
    )
    .forEach(
      (removed) => {
        const replacement =
          updated
            .filter(
              (assignment) =>
                assignment.siteId ===
                  removed.siteId &&
                assignment.productId ===
                  removed.productId
            )
            .sort(
              (first, second) =>
                first.sortOrder -
                second.sortOrder
            )[0];

        if (replacement) {
          updated =
            updated.map(
              (assignment) =>
                assignment.id ===
                replacement.id
                  ? {
                      ...assignment,
                      isPrimary:
                        true,
                      updatedAt:
                        now(),
                    }
                  : assignment
            );
        }
      }
    );

  save(updated);
}

export function subscribeToProductLocationChanges(
  callback: () => void
): () => void {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  function handleLocal(): void {
    callback();
  }

  function handleStorage(
    event: StorageEvent
  ): void {
    if (
      event.key === STORAGE_KEY
    ) {
      callback();
    }
  }

  window.addEventListener(
    LOCATIONS_CHANGED_EVENT,
    handleLocal
  );

  window.addEventListener(
    "storage",
    handleStorage
  );

  return () => {
    window.removeEventListener(
      LOCATIONS_CHANGED_EVENT,
      handleLocal
    );

    window.removeEventListener(
      "storage",
      handleStorage
    );
  };
}
